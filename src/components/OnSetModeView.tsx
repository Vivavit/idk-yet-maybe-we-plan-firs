"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Camera, Film, Eye } from "lucide-react";
import { Project, Shot } from "@/lib/types";

interface Props {
  project: Project;
  readOnly: boolean;
  onChange: (updated: Project) => void;
}

export function OnSetModeView({ project, readOnly, onChange }: Props) {
  const [onlyRemaining, setOnlyRemaining] = useState(false);
  const [selectedSceneId, setSelectedSceneId] = useState<string>("all");

  const filmedCount = project.shots.filter((s) => s.isFilmed).length;
  const totalCount = project.shots.length;
  const progress =
    totalCount > 0 ? Math.round((filmedCount / totalCount) * 100) : 0;

  const filteredShots = project.shots.filter((shot) => {
    if (onlyRemaining && shot.isFilmed) return false;
    if (selectedSceneId !== "all" && shot.sceneId !== selectedSceneId)
      return false;
    return true;
  });

  const toggleFilmed = (shot: Shot) => {
    if (readOnly) return;
    onChange({
      ...project,
      shots: project.shots.map((s) =>
        s.id === shot.id ? { ...s, isFilmed: !s.isFilmed } : s
      ),
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Dark Matte Hero Status Capsule */}
      <section className="surface-card rounded-[28px] p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
              On-Set Mode · High Contrast
            </p>
            <h2 className="mt-1 text-[34px] font-semibold leading-none tracking-[-0.03em] sm:text-[42px]">
              {filmedCount}
              <span className="text-[var(--text-secondary)]">/{totalCount}</span>{" "}
              <span className="text-[18px] font-normal text-[var(--text-secondary)]">
                shots captured
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyRemaining((v) => !v)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                onlyRemaining
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              {onlyRemaining ? "Remaining Only" : "Show All"}
            </button>
          </div>
        </div>

        <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
          <motion.div
            className="h-full rounded-full bg-[var(--accent)]"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
          />
        </div>

        {/* Scene Filter Pills */}
        <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedSceneId("all")}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
              selectedSceneId === "all"
                ? "bg-[var(--bg-subtle)] text-[var(--text-primary)] ring-1 ring-[var(--accent-border)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            All Scenes
          </button>
          {project.scenes.map((sc, idx) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => setSelectedSceneId(sc.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
                selectedSceneId === sc.id
                  ? "bg-[var(--bg-subtle)] text-[var(--text-primary)] ring-1 ring-[var(--accent-border)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {String(idx + 1).padStart(2, "0")} · {sc.title}
            </button>
          ))}
        </div>
      </section>

      {/* Large Tap-Friendly Shot Cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {filteredShots.length === 0 ? (
          <div className="surface-card rounded-[28px] px-6 py-14 text-center">
            <Film className="mx-auto mb-3 h-6 w-6 text-[var(--text-secondary)]" />
            <p className="text-[16px] font-medium">
              {onlyRemaining ? "All shots filmed. That's a wrap." : "No shots yet."}
            </p>
          </div>
        ) : (
          filteredShots.map((shot, idx) => {
            const scene = project.scenes.find((s) => s.id === shot.sceneId);
            const sceneRefs = project.references.filter(
              (r) => r.sceneId === shot.sceneId && r.imageUrl
            );
            return (
              <motion.div
                key={shot.id}
                layout
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: shot.isFilmed ? 0.58 : 1, y: 0, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 360,
                  damping: 28,
                  delay: Math.min(idx * 0.04, 0.2),
                }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => toggleFilmed(shot)}
                className="surface-card cursor-pointer rounded-[26px] p-5 sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[12px] font-semibold text-[var(--accent)]">
                        Shot {shot.shotNumber}
                      </span>
                      <span className="text-[12px] text-[var(--text-secondary)]">
                        {scene?.title} · {shot.shotSize} · {shot.movement}
                      </span>
                    </div>
                    <h3
                      className={`mt-2.5 text-[18px] font-medium leading-snug sm:text-[20px] ${
                        shot.isFilmed ? "line-through" : ""
                      }`}
                    >
                      {shot.description || "Untitled Shot"}
                    </h3>
                    <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[13px] text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1.5">
                        <Camera className="h-3.5 w-3.5" />
                        {shot.lens} · {shot.cameraSettings}
                      </span>
                      <span>{shot.durationSec}s</span>
                    </div>
                  </div>

                  {/* Big On-Set Checkbox */}
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      shot.isFilmed
                        ? "border-transparent bg-[var(--accent)] text-white"
                        : "border-[var(--border-hairline)] bg-[var(--bg-subtle)] text-transparent"
                    }`}
                  >
                    <Check className="h-6 w-6" />
                  </div>
                </div>

                {/* Storyboard & Scene References Strip */}
                {(shot.storyboardUrl || sceneRefs.length > 0) && (
                  <div className="mt-4 flex gap-3 overflow-x-auto pt-1">
                    {shot.storyboardUrl && (
                      <img
                        src={shot.storyboardUrl}
                        alt={`Storyboard ${shot.shotNumber}`}
                        className="h-24 w-40 shrink-0 rounded-[14px] bg-[#FAFAF8] object-cover ring-1 ring-white/10"
                      />
                    )}
                    {sceneRefs.slice(0, 3).map((ref) => (
                      <img
                        key={ref.id}
                        src={ref.imageUrl}
                        alt={ref.caption}
                        className="h-24 w-36 shrink-0 rounded-[14px] object-cover ring-1 ring-white/10"
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
