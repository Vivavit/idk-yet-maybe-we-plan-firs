"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  MapPin,
  Clock,
  FileText,
  Columns2,
  BookOpen,
  Layers,
  Wand2,
} from "lucide-react";
import { Project, Scene, TimeOfDay } from "@/lib/types";
import { generateId } from "@/lib/db";

const TIMES_OF_DAY: TimeOfDay[] = ["Day", "Golden Hour", "Night", "Indoor"];
const SPRING = { type: "spring" as const, stiffness: 380, damping: 32 };

type ScriptLayoutMode = "split" | "full" | "scenes";

interface Props {
  project: Project;
  readOnly: boolean;
  onChange: (updated: Project) => void;
}

export function ScriptView({ project, readOnly, onChange }: Props) {
  const [layoutMode, setLayoutMode] = useState<ScriptLayoutMode>("split");
  const [selectedSceneId, setSelectedSceneId] = useState<string>(
    project.scenes[0]?.id || ""
  );

  // Local fast-typing buffer for Full Script so typing is 0ms lag
  // and never stutters or drops characters during cloud sync.
  const [draftFullScript, setDraftFullScript] = useState<string>(
    project.fullScript || ""
  );
  const fullScriptFocusedRef = useRef(false);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!fullScriptFocusedRef.current) {
      setDraftFullScript(project.fullScript || "");
    }
  }, [project.fullScript]);

  useEffect(() => {
    return () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    };
  }, []);

  const handleFullScriptInput = (val: string) => {
    if (readOnly) return;
    setDraftFullScript(val);
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = setTimeout(() => {
      onChange({ ...project, fullScript: val });
    }, 350);
  };

  const handleFullScriptBlur = () => {
    fullScriptFocusedRef.current = false;
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    if (draftFullScript !== (project.fullScript || "")) {
      onChange({ ...project, fullScript: draftFullScript });
    }
  };

  const activeScene =
    project.scenes.find((s) => s.id === selectedSceneId) || project.scenes[0];

  const wordStats = useMemo(() => {
    const text = (draftFullScript || "").trim();
    const words = text ? text.split(/\s+/).length : 0;
    const estSec = Math.round((words / 140) * 60);
    return { words, estSec };
  }, [draftFullScript]);

  const updateProjectMeta = (patch: Partial<Project>) => {
    if (readOnly) return;
    onChange({ ...project, ...patch });
  };

  const updateScene = (sceneId: string, patch: Partial<Scene>) => {
    if (readOnly) return;
    onChange({
      ...project,
      scenes: project.scenes.map((s) =>
        s.id === sceneId ? { ...s, ...patch } : s
      ),
    });
  };

  const addScene = () => {
    if (readOnly) return;
    const nextNum = project.scenes.length + 1;
    const newScene: Scene = {
      id: generateId("scn"),
      orderIndex: project.scenes.length,
      title: `Scene ${nextNum}`,
      location: "",
      timeOfDay: "Day",
      scriptText: "",
      notes: "",
    };
    onChange({
      ...project,
      scenes: [...project.scenes, newScene],
    });
    setSelectedSceneId(newScene.id);
  };

  const deleteScene = (sceneId: string) => {
    if (readOnly || project.scenes.length <= 1) return;
    const remaining = project.scenes.filter((s) => s.id !== sceneId);
    onChange({
      ...project,
      scenes: remaining,
      shots: project.shots.filter((sh) => sh.sceneId !== sceneId),
    });
    if (selectedSceneId === sceneId && remaining[0]) {
      setSelectedSceneId(remaining[0].id);
    }
  };

  const syncScenesIntoFullScript = () => {
    if (readOnly) return;
    const compiled = project.scenes
      .map((sc, idx) => {
        const header = `[SCENE ${idx + 1} — ${(sc.location || "LOCATION").toUpperCase()} — ${sc.timeOfDay.toUpperCase()}]`;
        const body = sc.scriptText.trim() || "(Scene action / dialogue)";
        return `${header}\n${sc.title}\n\n${body}`;
      })
      .join("\n\n---\n\n");
    setDraftFullScript(compiled);
    updateProjectMeta({ fullScript: compiled });
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Project Meta + View Switcher */}
      <section className="surface-card rounded-[24px] p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid flex-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                Logline
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={project.logline}
                onChange={(e) => updateProjectMeta({ logline: e.target.value })}
                placeholder="One-line summary of the film..."
                className="w-full bg-transparent text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                Camera Profile
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={project.cameraProfile}
                onChange={(e) =>
                  updateProjectMeta({ cameraProfile: e.target.value })
                }
                placeholder="4K 24p · Cine2"
                className="w-full bg-transparent text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                Shoot Date
              </label>
              <input
                type="date"
                disabled={readOnly}
                value={project.shootDate}
                onChange={(e) => updateProjectMeta({ shootDate: e.target.value })}
                className="w-full bg-transparent text-[14px] text-[var(--text-primary)] focus:outline-none"
              />
            </div>
          </div>

          {/* Script Flow Mode Switcher */}
          <div className="inline-flex shrink-0 self-start rounded-full bg-[var(--bg-subtle)] p-1 xl:self-center">
            {(
              [
                {
                  id: "full",
                  label: "Full Script",
                  icon: <BookOpen className="h-3.5 w-3.5" />,
                },
                {
                  id: "split",
                  label: "Split",
                  icon: <Columns2 className="h-3.5 w-3.5" />,
                },
                {
                  id: "scenes",
                  label: "Scenes",
                  icon: <Layers className="h-3.5 w-3.5" />,
                },
              ] as const
            ).map((m) => {
              const active = layoutMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setLayoutMode(m.id)}
                  className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
                    active
                      ? "text-[var(--accent)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="script-layout-pill"
                      transition={SPRING}
                      className="absolute inset-0 rounded-full bg-[var(--bg-surface-solid)] shadow-sm"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
                    {m.icon}
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content Area: Full Script + Scene Breakdown */}
      <div
        className={`grid gap-6 ${
          layoutMode === "split" ? "xl:grid-cols-2" : "grid-cols-1"
        }`}
      >
        {/* FULL SCRIPT PANEL */}
        {(layoutMode === "full" || layoutMode === "split") && (
          <section className="surface-card flex flex-col rounded-[28px] p-6 sm:p-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--accent)]">
                  Master Document
                </p>
                <h2 className="mt-0.5 text-[20px] font-semibold tracking-[-0.02em]">
                  Full Script
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[var(--bg-subtle)] px-3 py-1 text-[12px] text-[var(--text-secondary)]">
                  {wordStats.words} words · ~{wordStats.estSec}s VO
                </span>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={syncScenesIntoFullScript}
                    title="Compile all scenes into Full Script"
                    className="flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-3.5 py-1.5 text-[12px] font-medium text-[var(--accent)] transition-opacity hover:opacity-85"
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    Compile Scenes
                  </button>
                )}
              </div>
            </div>

            <textarea
              disabled={readOnly}
              rows={layoutMode === "full" ? 20 : 18}
              value={draftFullScript}
              onFocus={() => {
                fullScriptFocusedRef.current = true;
              }}
              onBlur={handleFullScriptBlur}
              onChange={(e) => handleFullScriptInput(e.target.value)}
              placeholder="Write your full story, treatment, voiceover, or screenplay here first — then break it down into scenes..."
              className="w-full flex-1 resize-y rounded-[20px] bg-[var(--bg-subtle)] p-5 font-mono text-[14px] leading-[1.75] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)]"
            />
          </section>
        )}

        {/* SCENES BREAKDOWN PANEL */}
        {(layoutMode === "scenes" || layoutMode === "split") && (
          <div
            className={`grid gap-5 ${
              layoutMode === "scenes"
                ? "lg:grid-cols-[280px_1fr]"
                : "grid-cols-1"
            }`}
          >
            {/* Scene Selector Strip / Rail */}
            <aside className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                  Scene Breakdown ({project.scenes.length})
                </span>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={addScene}
                    className="flex h-7 items-center gap-1 rounded-full bg-[var(--accent-soft)] px-3 text-[12px] font-medium text-[var(--accent)] transition-opacity hover:opacity-85"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Scene
                  </button>
                )}
              </div>

              <div
                className={`flex gap-2 overflow-x-auto pb-1 ${
                  layoutMode === "scenes"
                    ? "lg:flex-col lg:overflow-visible lg:pb-0"
                    : ""
                }`}
              >
                {project.scenes.map((scene, idx) => {
                  const isSelected = activeScene?.id === scene.id;
                  const shotCount = project.shots.filter(
                    (sh) => sh.sceneId === scene.id
                  ).length;
                  return (
                    <button
                      key={scene.id}
                      type="button"
                      onClick={() => setSelectedSceneId(scene.id)}
                      className={`relative flex shrink-0 flex-col items-start rounded-[20px] px-4 py-3 text-left transition-all ${
                        layoutMode === "scenes" ? "lg:w-full" : "min-w-[175px]"
                      } ${
                        isSelected
                          ? "surface-card text-[var(--text-primary)] ring-1 ring-[var(--accent-border)]"
                          : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {isSelected && (
                        <motion.span
                          layoutId="active-scene-dot"
                          transition={SPRING}
                          className="absolute right-3.5 top-3.5 h-2 w-2 rounded-full bg-[var(--accent)]"
                        />
                      )}
                      <span className="text-[11px] font-medium uppercase tracking-[0.1em] opacity-65">
                        {String(idx + 1).padStart(2, "0")} · {scene.timeOfDay}
                      </span>
                      <span className="mt-0.5 line-clamp-1 pr-4 text-[14px] font-medium">
                        {scene.title || "Untitled Scene"}
                      </span>
                      <span className="mt-0.5 text-[12px] opacity-65">
                        {shotCount} {shotCount === 1 ? "shot" : "shots"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Active Scene Editor Card */}
            {activeScene && (
              <section className="surface-card rounded-[28px] p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                      Scene Editor
                    </p>
                    <input
                      type="text"
                      disabled={readOnly}
                      value={activeScene.title}
                      onChange={(e) =>
                        updateScene(activeScene.id, { title: e.target.value })
                      }
                      placeholder="Scene Title"
                      className="mt-1 w-full bg-transparent text-[22px] font-semibold tracking-[-0.02em] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none sm:text-[24px]"
                    />
                  </div>
                  {!readOnly && project.scenes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => deleteScene(activeScene.id)}
                      aria-label="Delete scene"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Metadata Pills Row */}
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-2 rounded-full bg-[var(--bg-subtle)] px-3.5 py-2">
                    <MapPin className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                    <input
                      type="text"
                      disabled={readOnly}
                      value={activeScene.location}
                      onChange={(e) =>
                        updateScene(activeScene.id, {
                          location: e.target.value,
                        })
                      }
                      placeholder="Location"
                      className="w-36 bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none sm:w-44"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1 rounded-full bg-[var(--bg-subtle)] p-1">
                    <Clock className="ml-2 mr-1 h-3.5 w-3.5 text-[var(--text-secondary)]" />
                    {TIMES_OF_DAY.map((tod) => {
                      const active = activeScene.timeOfDay === tod;
                      return (
                        <button
                          key={tod}
                          type="button"
                          disabled={readOnly}
                          onClick={() =>
                            updateScene(activeScene.id, { timeOfDay: tod })
                          }
                          className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
                            active
                              ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          {tod}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="my-5 border-t hairline-divider" />

                {/* Scene Script Beat */}
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                    <FileText className="h-3.5 w-3.5" />
                    Scene Beats, Voiceover & Dialogue
                  </label>
                  <textarea
                    disabled={readOnly}
                    rows={7}
                    value={activeScene.scriptText}
                    onChange={(e) =>
                      updateScene(activeScene.id, {
                        scriptText: e.target.value,
                      })
                    }
                    placeholder="Dialogue, voiceover lines, or action for this scene..."
                    className="w-full resize-y rounded-[18px] bg-[var(--bg-subtle)] p-4 text-[14px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)]"
                  />
                </div>

                {/* Director & Lighting Notes */}
                <div className="mt-4">
                  <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                    Director & Lighting Notes
                  </label>
                  <textarea
                    disabled={readOnly}
                    rows={3}
                    value={activeScene.notes}
                    onChange={(e) =>
                      updateScene(activeScene.id, { notes: e.target.value })
                    }
                    placeholder="Lens notes, natural light timing, sound cues..."
                    className="w-full resize-none rounded-[18px] bg-[var(--bg-subtle)] p-4 text-[14px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)]"
                  />
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
