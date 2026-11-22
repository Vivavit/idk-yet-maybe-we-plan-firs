"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Check,
  PenTool,
  Trash2,
  Camera,
  Clock,
} from "lucide-react";
import {
  CameraMovement,
  Project,
  Shot,
  ShotSize,
} from "@/lib/types";
import { generateId } from "@/lib/db";
import { StoryboardCanvas } from "./StoryboardCanvas";

const SHOT_SIZES: ShotSize[] = [
  "Wide",
  "Medium",
  "Close-Up",
  "Detail",
  "POV",
  "Over-Shoulder",
];

const MOVEMENTS: CameraMovement[] = [
  "Static",
  "Tripod",
  "Pan / Tilt",
  "Handheld + Gyroflow",
  "Gimbal Push",
  "Tracking",
];

interface Props {
  project: Project;
  readOnly: boolean;
  onChange: (updated: Project) => void;
}

export function ShotListView({ project, readOnly, onChange }: Props) {
  const [sceneFilter, setSceneFilter] = useState<string>("all");
  const [editingStoryboardShot, setEditingStoryboardShot] =
    useState<Shot | null>(null);

  const visibleScenes =
    sceneFilter === "all"
      ? project.scenes
      : project.scenes.filter((s) => s.id === sceneFilter);

  const filmedCount = project.shots.filter((s) => s.isFilmed).length;
  const totalDuration = project.shots.reduce(
    (sum, s) => sum + (Number(s.durationSec) || 0),
    0
  );

  const addShot = (sceneId: string) => {
    if (readOnly) return;
    const sceneIndex =
      project.scenes.findIndex((s) => s.id === sceneId) + 1;
    const existingInScene = project.shots.filter(
      (s) => s.sceneId === sceneId
    ).length;
    const letter = String.fromCharCode(65 + (existingInScene % 26));
    const newShot: Shot = {
      id: generateId("sht"),
      sceneId,
      orderIndex: project.shots.length,
      shotNumber: `${sceneIndex}${letter}`,
      description: "",
      shotSize: "Medium",
      movement: "Tripod",
      lens: "35mm",
      cameraSettings: project.cameraProfile || "4K 24p · 1/50",
      durationSec: 4,
      storyboardUrl: null,
      isFilmed: false,
    };
    onChange({
      ...project,
      shots: [...project.shots, newShot],
    });
  };

  const updateShot = (shotId: string, patch: Partial<Shot>) => {
    if (readOnly) return;
    onChange({
      ...project,
      shots: project.shots.map((s) =>
        s.id === shotId ? { ...s, ...patch } : s
      ),
    });
  };

  const deleteShot = (shotId: string) => {
    if (readOnly) return;
    onChange({
      ...project,
      shots: project.shots.filter((s) => s.id !== shotId),
    });
  };

  return (
    <div className="space-y-7">
      {/* Summary & Scene Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSceneFilter("all")}
            className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
              sceneFilter === "all"
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            All Scenes
          </button>
          {project.scenes.map((sc, idx) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => setSceneFilter(sc.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                sceneFilter === sc.id
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {String(idx + 1).padStart(2, "0")} · {sc.title}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-[13px] text-[var(--text-secondary)]">
          <span>
            <strong className="font-semibold text-[var(--text-primary)]">
              {filmedCount}/{project.shots.length}
            </strong>{" "}
            filmed
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            ~{totalDuration}s runtime
          </span>
        </div>
      </div>

      {/* Scene Groups */}
      <div className="space-y-6">
        {visibleScenes.map((scene) => {
          const sceneShots = project.shots.filter(
            (sh) => sh.sceneId === scene.id
          );
          return (
            <section
              key={scene.id}
              className="surface-card rounded-[28px] p-5 sm:p-7"
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-[18px] font-semibold tracking-[-0.01em]">
                    {scene.title}
                  </h3>
                  <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">
                    {scene.location || "No location"} · {scene.timeOfDay}
                  </p>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => addShot(scene.id)}
                    className="flex items-center gap-1.5 rounded-full bg-[var(--bg-subtle)] px-4 py-2 text-[13px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Shot
                  </button>
                )}
              </div>

              {sceneShots.length === 0 ? (
                <div className="rounded-[20px] bg-[var(--bg-subtle)] px-5 py-8 text-center text-[13px] text-[var(--text-secondary)]">
                  No shots planned for this scene yet.
                </div>
              ) : (
                <div className="divide-y hairline-divider">
                  {sceneShots.map((shot) => (
                    <div
                      key={shot.id}
                      className="flex flex-col gap-4 py-5 first:pt-2 last:pb-1 sm:flex-row sm:items-start"
                    >
                      {/* Storyboard Thumbnail Trigger */}
                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => setEditingStoryboardShot(shot)}
                        className="group relative flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-[var(--bg-subtle)] transition-transform active:scale-[0.98] sm:w-44"
                      >
                        {shot.storyboardUrl ? (
                          <>
                            <img
                              src={shot.storyboardUrl}
                              alt={`Storyboard ${shot.shotNumber}`}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                              <span className="flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-black">
                                <PenTool className="h-3 w-3" />
                                Edit Sketch
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 text-[var(--text-secondary)] group-hover:text-[var(--accent)]">
                            <PenTool className="h-4 w-4" />
                            <span className="text-[11px] font-medium">
                              Draw Storyboard
                            </span>
                          </div>
                        )}
                      </button>

                      {/* Shot Details */}
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex items-start gap-2.5">
                          <input
                            type="text"
                            disabled={readOnly}
                            value={shot.shotNumber}
                            onChange={(e) =>
                              updateShot(shot.id, {
                                shotNumber: e.target.value,
                              })
                            }
                            className="w-12 shrink-0 rounded-full bg-[var(--bg-subtle)] px-2.5 py-1 text-center text-[12px] font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)]"
                          />
                          <input
                            type="text"
                            disabled={readOnly}
                            value={shot.description}
                            onChange={(e) =>
                              updateShot(shot.id, {
                                description: e.target.value,
                              })
                            }
                            placeholder="Describe framing, subject action, or visual beat..."
                            className={`w-full bg-transparent text-[15px] font-medium focus:outline-none ${
                              shot.isFilmed
                                ? "line-through opacity-55"
                                : "text-[var(--text-primary)]"
                            }`}
                          />
                        </div>

                        {/* Technical Specs Row */}
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            disabled={readOnly}
                            value={shot.shotSize}
                            onChange={(e) =>
                              updateShot(shot.id, {
                                shotSize: e.target.value as ShotSize,
                              })
                            }
                            className="rounded-full bg-[var(--bg-subtle)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-primary)] focus:outline-none"
                          >
                            {SHOT_SIZES.map((sz) => (
                              <option key={sz} value={sz}>
                                {sz}
                              </option>
                            ))}
                          </select>

                          <select
                            disabled={readOnly}
                            value={shot.movement}
                            onChange={(e) =>
                              updateShot(shot.id, {
                                movement: e.target.value as CameraMovement,
                              })
                            }
                            className="rounded-full bg-[var(--bg-subtle)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-primary)] focus:outline-none"
                          >
                            {MOVEMENTS.map((mv) => (
                              <option key={mv} value={mv}>
                                {mv}
                              </option>
                            ))}
                          </select>

                          <input
                            type="text"
                            disabled={readOnly}
                            value={shot.lens}
                            onChange={(e) =>
                              updateShot(shot.id, { lens: e.target.value })
                            }
                            placeholder="Lens"
                            className="w-24 rounded-full bg-[var(--bg-subtle)] px-3 py-1.5 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none"
                          />

                          <div className="flex items-center gap-1 rounded-full bg-[var(--bg-subtle)] px-3 py-1.5">
                            <Camera className="h-3 w-3 text-[var(--text-secondary)]" />
                            <input
                              type="text"
                              disabled={readOnly}
                              value={shot.cameraSettings}
                              onChange={(e) =>
                                updateShot(shot.id, {
                                  cameraSettings: e.target.value,
                                })
                              }
                              placeholder="4K 24p · 1/50"
                              className="w-40 bg-transparent text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none"
                            />
                          </div>

                          <div className="flex items-center gap-1 rounded-full bg-[var(--bg-subtle)] px-3 py-1.5 text-[12px] text-[var(--text-secondary)]">
                            <input
                              type="number"
                              min={1}
                              max={600}
                              disabled={readOnly}
                              value={shot.durationSec}
                              onChange={(e) =>
                                updateShot(shot.id, {
                                  durationSec: Number(e.target.value) || 0,
                                })
                              }
                              className="w-10 bg-transparent text-right text-[var(--text-primary)] focus:outline-none"
                            />
                            <span>s</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Actions: Filmed Toggle & Delete */}
                      <div className="flex shrink-0 items-center justify-end gap-2 sm:flex-col sm:items-end">
                        <motion.button
                          whileTap={{ scale: 0.92 }}
                          type="button"
                          disabled={readOnly}
                          onClick={() =>
                            updateShot(shot.id, { isFilmed: !shot.isFilmed })
                          }
                          className={`flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-medium transition-colors ${
                            shot.isFilmed
                              ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                              : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" />
                          {shot.isFilmed ? "Filmed" : "Mark"}
                        </motion.button>

                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => deleteShot(shot.id)}
                            aria-label="Delete shot"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Storyboard Modal */}
      <AnimatePresence>
        {editingStoryboardShot && (
          <StoryboardCanvas
            initialDataUrl={editingStoryboardShot.storyboardUrl}
            shotLabel={`Shot ${editingStoryboardShot.shotNumber} — ${
              editingStoryboardShot.description || "Untitled Shot"
            }`}
            onSave={(dataUrl) => {
              updateShot(editingStoryboardShot.id, { storyboardUrl: dataUrl });
              setEditingStoryboardShot(null);
            }}
            onClose={() => setEditingStoryboardShot(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
