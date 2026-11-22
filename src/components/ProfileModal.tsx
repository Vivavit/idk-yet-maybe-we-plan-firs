"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, Check, X } from "lucide-react";
import {
  AVATAR_PRESETS,
  FriendProfile,
  compressAvatarFile,
  createFriendId,
} from "@/lib/profile";

const SPRING = { type: "spring" as const, stiffness: 380, damping: 32 };

export function FriendAvatar({
  profile,
  size = "md",
}: {
  profile: FriendProfile;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const dims =
    size === "xs"
      ? "h-5 w-5 text-[11px]"
      : size === "sm"
        ? "h-7 w-7 text-[13px]"
        : size === "lg"
          ? "h-14 w-14 text-[26px]"
          : "h-9 w-9 text-[16px]";

  if (profile.avatarType === "image" && profile.avatarValue) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full ring-2 ring-white/70 dark:ring-white/20 ${dims}`}
      >
        <img
          src={profile.avatarValue}
          alt={profile.name}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const preset =
    AVATAR_PRESETS.find((p) => p.id === profile.avatarValue) ||
    AVATAR_PRESETS[0];

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full ring-2 ring-white/70 dark:ring-white/20 ${dims}`}
      style={{ backgroundColor: `${profile.color || preset.color}22` }}
    >
      <span>{preset.emoji}</span>
    </div>
  );
}

interface Props {
  initialProfile: FriendProfile | null;
  canDismiss: boolean;
  onSave: (profile: FriendProfile) => void;
  onClose?: () => void;
}

export function ProfileModal({
  initialProfile,
  canDismiss,
  onSave,
  onClose,
}: Props) {
  const [name, setName] = useState(initialProfile?.name || "");
  const [avatarType, setAvatarType] = useState<"preset" | "image">(
    initialProfile?.avatarType || "preset"
  );
  const [avatarValue, setAvatarValue] = useState(
    initialProfile?.avatarValue || AVATAR_PRESETS[0].id
  );
  const [color, setColor] = useState(
    initialProfile?.color || AVATAR_PRESETS[0].color
  );
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const dataUrl = await compressAvatarFile(file);
      setAvatarType("image");
      setAvatarValue(dataUrl);
    } catch {
      // ignore invalid image
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim() || "Crew Member";
    onSave({
      id: initialProfile?.id || createFriendId(),
      name: cleanName,
      avatarType,
      avatarValue,
      color,
    });
  };

  const previewProfile: FriendProfile = {
    id: initialProfile?.id || "preview",
    name: name.trim() || "You",
    avatarType,
    avatarValue,
    color,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => canDismiss && onClose?.()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={SPRING}
        onClick={(e) => e.stopPropagation()}
        className="glass-modal w-full max-w-md rounded-[28px] p-7"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--accent)]">
              Crew Identity
            </p>
            <h2 className="mt-1 text-[21px] font-semibold tracking-[-0.02em]">
              Who’s on set?
            </h2>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
              Pick a name and avatar so friends can see your live cursor & where you’re editing.
            </p>
          </div>
          {canDismiss && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Live Preview + Upload */}
          <div className="flex items-center gap-4 rounded-[20px] bg-[var(--bg-subtle)] p-4">
            <FriendAvatar profile={previewProfile} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold">
                {previewProfile.name}
              </p>
              <p className="text-[12px] text-[var(--text-secondary)]">
                No account or password needed
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full bg-[var(--bg-surface-solid)] px-3.5 py-2 text-[12px] font-medium text-[var(--text-primary)] shadow-sm transition-opacity hover:opacity-90"
            >
              <Upload className="h-3.5 w-3.5" />
              {uploading ? "..." : "Photo"}
            </button>
          </div>

          {/* Display Name */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
              Display Name
            </label>
            <input
              type="text"
              autoFocus
              required
              maxLength={24}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Vit, Alex, Sam..."
              className="w-full rounded-[16px] bg-[var(--bg-subtle)] px-4 py-3 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)]"
            />
          </div>

          {/* Preset Avatars */}
          <div>
            <label className="mb-2 block text-[12px] font-medium text-[var(--text-secondary)]">
              Or pick a crew avatar
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_PRESETS.map((preset) => {
                const selected =
                  avatarType === "preset" && avatarValue === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    title={preset.label}
                    onClick={() => {
                      setAvatarType("preset");
                      setAvatarValue(preset.id);
                      setColor(preset.color);
                    }}
                    className={`flex h-12 flex-col items-center justify-center rounded-[16px] text-[20px] transition-all ${
                      selected
                        ? "scale-105 bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]"
                        : "bg-[var(--bg-subtle)] hover:scale-105"
                    }`}
                  >
                    {preset.emoji}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] py-3 text-[14px] font-medium text-white shadow-[0_10px_24px_rgba(37,99,235,0.28)] transition-opacity hover:opacity-95"
          >
            <Check className="h-4 w-4" />
            Enter Shoot
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
