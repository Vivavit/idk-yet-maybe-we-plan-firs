"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

const SPRING = { type: "spring" as const, stiffness: 360, damping: 26 };

export function AppLogo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.07, rotate: -3 }}
      whileTap={{ scale: 0.94 }}
      transition={SPRING}
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-[26%] shadow-[0_6px_16px_rgba(37,99,235,0.28)] ring-1 ring-white/30 ${className}`}
    >
      <img
        src="/icon-192.png"
        alt="IDK Yet Maybe We Plan First icon"
        className="h-full w-full scale-[1.06] object-cover"
      />
    </motion.div>
  );
}

const CHEERS = [
  "Action! Let's roll.",
  "Frame looks crisp.",
  "Don't forget audio!",
  "Golden hour ready.",
  "Cinema magic mode.",
];

export function CuteSlateBuddy({
  progress = 0,
  compact = false,
}: {
  progress?: number;
  compact?: boolean;
}) {
  const [clapping, setClapping] = useState(false);
  const [cheerIdx, setCheerIdx] = useState(-1);

  const isWrap = progress >= 100;

  const statusLine =
    cheerIdx >= 0
      ? CHEERS[cheerIdx]
      : isWrap
        ? "That's a wrap!"
        : progress >= 50
          ? "Halfway there!"
          : progress > 0
            ? "Rolling nicely!"
            : "Tap me for luck";

  const handleTap = () => {
    setClapping(true);
    setCheerIdx((prev) => (prev + 1) % CHEERS.length);
    setTimeout(() => setClapping(false), 450);
  };

  return (
    <motion.button
      type="button"
      onClick={handleTap}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={SPRING}
      className={`group flex w-full items-center gap-3 rounded-[20px] bg-[var(--bg-subtle)] text-left transition-colors hover:bg-[var(--accent-soft)] ${
        compact ? "px-3 py-2.5" : "px-3.5 py-3"
      }`}
    >
      {/* Animated Mini Clapperboard Buddy */}
      <motion.div
        animate={
          clapping
            ? { y: [0, -6, 0], rotate: [0, -5, 4, 0] }
            : { y: [0, -2, 0] }
        }
        transition={
          clapping
            ? { duration: 0.42 }
            : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
        }
        className="relative flex h-10 w-10 shrink-0 items-center justify-center"
      >
        <svg viewBox="0 0 44 44" fill="none" className="h-10 w-10">
          {/* Clapperboard Hinged Top */}
          <motion.g
            style={{ originX: "10px", originY: "17px" }}
            animate={{ rotate: clapping ? 0 : -14 }}
            transition={{ type: "spring", stiffness: 460, damping: 20 }}
          >
            <rect
              x="7"
              y="10"
              width="30"
              height="6.5"
              rx="3"
              fill="currentColor"
              className="text-[var(--text-primary)]"
            />
            {/* Diagonal white stripes */}
            <path
              d="M13 10.5L16.5 16M21 10.5L24.5 16M29 10.5L32.5 16"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeOpacity="0.85"
            />
          </motion.g>

          {/* Rounded Frosted Body */}
          <rect
            x="7"
            y="17"
            width="30"
            height="21"
            rx="7"
            className="fill-[#3B82F6] dark:fill-[#2563EB]"
          />
          {/* Top glossy highlight */}
          <rect
            x="10"
            y="19"
            width="24"
            height="4"
            rx="2"
            fill="white"
            fillOpacity="0.22"
          />

          {/* Cute Eyes */}
          {isWrap || clapping ? (
            <>
              <path
                d="M15.5 27.5C16.3 25.8 18.7 25.8 19.5 27.5"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M24.5 27.5C25.3 25.8 27.7 25.8 28.5 27.5"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </>
          ) : (
            <>
              <motion.ellipse
                cx="17.5"
                cy="27"
                rx="2"
                ry="2.3"
                fill="white"
                animate={{ scaleY: [1, 1, 0.12, 1, 1] }}
                transition={{
                  duration: 4.2,
                  repeat: Infinity,
                  times: [0, 0.88, 0.92, 0.96, 1],
                }}
              />
              <motion.ellipse
                cx="26.5"
                cy="27"
                rx="2"
                ry="2.3"
                fill="white"
                animate={{ scaleY: [1, 1, 0.12, 1, 1] }}
                transition={{
                  duration: 4.2,
                  repeat: Infinity,
                  times: [0, 0.88, 0.92, 0.96, 1],
                }}
              />
            </>
          )}

          {/* Soft Cheeks */}
          <circle cx="13.5" cy="30" r="1.8" fill="#FBCFE8" fillOpacity="0.65" />
          <circle cx="30.5" cy="30" r="1.8" fill="#FBCFE8" fillOpacity="0.65" />

          {/* Tiny Smile */}
          <path
            d="M20 31C21.2 32.3 22.8 32.3 24 31"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
          Clappy
        </p>
        <p className="truncate text-[11px] text-[var(--text-secondary)] group-hover:text-[var(--accent)]">
          {statusLine}
        </p>
      </div>
    </motion.button>
  );
}

export function FolderShootCard({
  title,
  shareCode,
  sceneCount,
  filmedCount,
  totalShots,
  cameraProfile,
  index = 0,
  onClick,
  onDelete,
}: {
  title: string;
  shareCode: string;
  sceneCount: number;
  filmedCount: number;
  totalShots: number;
  cameraProfile: string;
  index?: number;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const progress =
    totalShots > 0 ? Math.round((filmedCount / totalShots) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...SPRING, delay: Math.min(index * 0.06, 0.3) }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className="group relative cursor-pointer pt-5"
    >
      {/* Back Folder Tab */}
      <div className="absolute left-4 top-2 h-7 w-24 rounded-t-[14px] border border-b-0 border-[var(--border-hairline)] bg-[var(--bg-subtle)] transition-colors duration-300 group-hover:border-[#60A5FA]/40 group-hover:bg-[#3B82F6]/25" />

      {/* Back Peeking Paper Sheet (fans slightly left on hover) */}
      <div className="pointer-events-none absolute left-7 right-7 top-4 h-11 rounded-t-[14px] border border-black/5 bg-white/70 shadow-sm transition-transform duration-300 ease-out group-hover:-translate-y-2.5 group-hover:-rotate-2 dark:border-white/10 dark:bg-white/10" />

      {/* Front Peeking Paper / Script Preview Card (fans slightly right on hover) */}
      <div className="pointer-events-none absolute left-5 right-5 top-3.5 h-12 rounded-t-[14px] border border-black/5 bg-white/90 px-3.5 pt-2 shadow-sm transition-transform duration-300 ease-out group-hover:-translate-y-2 group-hover:rotate-1 dark:border-white/10 dark:bg-[#232329]/95">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-10 rounded-full bg-slate-300/80 dark:bg-white/25" />
          <span className="h-1.5 w-6 rounded-full bg-blue-400/60" />
        </div>
        <div className="mt-1.5 h-1.5 w-2/3 rounded-full bg-slate-200/80 dark:bg-white/15" />
      </div>

      {/* Main Frosted Folder Body */}
      <div className="relative overflow-hidden rounded-[24px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 pt-6 shadow-[var(--shadow-soft)] backdrop-blur-2xl transition-all duration-300 group-hover:border-[#60A5FA]/55 group-hover:bg-gradient-to-br group-hover:from-[#60A5FA] group-hover:to-[#2563EB] group-hover:text-white group-hover:shadow-[0_20px_42px_rgba(37,99,235,0.28)]">
        {/* Top Row: Share Code Pill + Delete */}
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-[var(--accent)] transition-colors group-hover:bg-white/20 group-hover:text-white">
            {shareCode}
          </span>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete project"
            className="rounded-full px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] opacity-0 transition-all hover:bg-black/15 group-hover:text-white/90 group-hover:opacity-100"
          >
            Delete
          </button>
        </div>

        {/* Title & Metadata */}
        <h3 className="mt-4 line-clamp-1 text-[17px] font-semibold tracking-[-0.015em]">
          {title}
        </h3>
        <p className="mt-1 line-clamp-1 text-[12px] text-[var(--text-secondary)] transition-colors group-hover:text-white/80">
          {sceneCount} {sceneCount === 1 ? "scene" : "scenes"} · {filmedCount}/
          {totalShots} shots · {cameraProfile || "Custom camera"}
        </p>

        {/* Mini Progress Bar */}
        <div className="mt-5 flex items-center gap-2.5">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg-subtle)] group-hover:bg-white/25">
            <motion.div
              className="h-full rounded-full bg-[var(--accent)] group-hover:bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <span className="text-[11px] font-medium text-[var(--text-secondary)] group-hover:text-white/90">
            {progress}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}
