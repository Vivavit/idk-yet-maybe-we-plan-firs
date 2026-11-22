"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Copy,
  Check,
  Download,
  ExternalLink,
  Globe,
  Eye,
  Lock,
  KeyRound,
  Cloud,
} from "lucide-react";
import { Project, ShareMode } from "@/lib/types";
import { exportProjectJson } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase";

const SPRING = { type: "spring" as const, stiffness: 380, damping: 32 };

const MODES: {
  id: ShareMode;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "edit",
    label: "Anyone with link can edit",
    desc: "Friends pick a name & avatar and edit live together.",
    icon: <Globe className="h-4 w-4" />,
  },
  {
    id: "view",
    label: "View only",
    desc: "Locked in DB — safe for actors, clients, or guests.",
    icon: <Eye className="h-4 w-4" />,
  },
  {
    id: "private",
    label: "Private",
    desc: "Blocked from remote access; local only.",
    icon: <Lock className="h-4 w-4" />,
  },
];

interface Props {
  project: Project;
  onChangeMode: (mode: ShareMode) => void;
  onChangePasscode: (passcode: string) => void;
  onClose: () => void;
}

export function ShareModal({
  project,
  onChangeMode,
  onChangePasscode,
  onClose,
}: Props) {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/p/${project.shareCode}`
      : `/p/${project.shareCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={SPRING}
        onClick={(e) => e.stopPropagation()}
        className="glass-modal w-full max-w-md rounded-[28px] p-7"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[20px] font-semibold tracking-[-0.02em]">
                Share & Security
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
                <Cloud className="h-3 w-3" />
                {isSupabaseConfigured ? "Cloud Live" : "Local Sync"}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
              Code{" "}
              <span className="font-semibold text-[var(--text-primary)]">
                {project.shareCode}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Copy Link Pill */}
        <div className="mt-5 flex items-center gap-2 rounded-full bg-[var(--bg-subtle)] p-1.5 pl-4">
          <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--text-primary)]">
            {shareUrl}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--anchor-bg)] px-4 py-2 text-[12px] font-medium text-[var(--anchor-text)] transition-opacity hover:opacity-90"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </button>
        </div>

        {/* Optional Friend Passcode / PIN */}
        <div className="mt-5">
          <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            <KeyRound className="h-3.5 w-3.5" />
            Optional Shoot Passcode (PIN)
          </label>
          <input
            type="text"
            maxLength={20}
            value={project.passcode || ""}
            onChange={(e) => onChangePasscode(e.target.value)}
            placeholder="Leave empty for no PIN, or set a friend passcode..."
            className="w-full rounded-[14px] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)]"
          />
        </div>

        {/* Access Mode */}
        <div className="mt-5 space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            Access Level
          </p>
          {MODES.map((m) => {
            const active = project.shareMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onChangeMode(m.id)}
                className={`flex w-full items-start gap-3 rounded-[18px] p-3.5 text-left transition-colors ${
                  active
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "bg-[var(--bg-subtle)] text-[var(--text-primary)] hover:opacity-90"
                }`}
              >
                <div className="mt-0.5 shrink-0">{m.icon}</div>
                <div className="min-w-0">
                  <p className="text-[14px] font-medium">{m.label}</p>
                  <p className="mt-0.5 text-[12px] opacity-75">{m.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Actions: Test Multi-Tab & Export JSON */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t hairline-divider pt-4">
          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-[var(--bg-subtle)] px-4 py-2 text-[12px] font-medium text-[var(--text-primary)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Test Live Tab
          </a>
          <button
            type="button"
            onClick={() => exportProjectJson(project)}
            className="flex items-center gap-1.5 rounded-full bg-[var(--bg-subtle)] px-4 py-2 text-[12px] font-medium text-[var(--text-primary)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
          >
            <Download className="h-3.5 w-3.5" />
            Export JSON
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
