"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Image as ImageIcon,
  Link2,
  ExternalLink,
  Trash2,
  X,
  Database,
} from "lucide-react";
import { Project, ReferenceItem } from "@/lib/types";
import { generateId } from "@/lib/db";

const SPRING = { type: "spring" as const, stiffness: 380, damping: 32 };

function extractYouTubeThumb(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
      if (u.pathname.startsWith("/shorts/")) {
        const shortId = u.pathname.split("/")[2];
        return shortId
          ? `https://img.youtube.com/vi/${shortId}/hqdefault.jpg`
          : null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function looksLikeDirectImage(url: string): boolean {
  try {
    const u = new URL(url);
    const p = u.pathname.toLowerCase();
    return (
      /\.(jpg|jpeg|png|webp|gif|avif|svg)$/.test(p) ||
      u.hostname.includes("images.unsplash.com") ||
      u.hostname.includes("i.pinimg.com") ||
      u.hostname.includes("i.imgur.com") ||
      u.hostname.includes("images.pexels.com")
    );
  } catch {
    return false;
  }
}

function getPlatformLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("youtube") || host.includes("youtu.be")) return "YouTube";
    if (host.includes("tiktok")) return "TikTok";
    if (host.includes("pinterest") || host.includes("pinimg")) return "Pinterest";
    if (host.includes("vimeo")) return "Vimeo";
    if (host.includes("unsplash")) return "Unsplash";
    if (host.includes("instagram")) return "Instagram";
    return host;
  } catch {
    return "Link";
  }
}

interface Props {
  project: Project;
  readOnly: boolean;
  onChange: (updated: Project) => void;
}

export function MoodboardView({ project, readOnly, onChange }: Props) {
  const [sceneFilter, setSceneFilter] = useState<string>("all");
  const [lightboxItem, setLightboxItem] = useState<ReferenceItem | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const [urlInput, setUrlInput] = useState("");
  const [caption, setCaption] = useState("");
  const [vibeTag, setVibeTag] = useState("Framing");
  const [sceneId, setSceneId] = useState<string>("");

  const filtered = project.references.filter((item) => {
    if (sceneFilter === "all") return true;
    if (sceneFilter === "general") return !item.sceneId;
    return item.sceneId === sceneFilter;
  });

  const handleAddLinkItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    const rawUrl = urlInput.trim();
    if (!rawUrl) return;

    const ytThumb = extractYouTubeThumb(rawUrl);
    const isDirectImg = looksLikeDirectImage(rawUrl);

    const item: ReferenceItem = {
      id: generateId("ref"),
      sceneId:
        sceneId ||
        (sceneFilter !== "all" && sceneFilter !== "general"
          ? sceneFilter
          : null),
      imageUrl: ytThumb || (isDirectImg ? rawUrl : ""),
      sourceUrl: rawUrl,
      caption: caption.trim() || `${getPlatformLabel(rawUrl)} reference`,
      vibeTag: vibeTag.trim() || "Reference",
      createdAt: new Date().toISOString(),
    };

    onChange({
      ...project,
      references: [item, ...project.references],
    });
    setUrlInput("");
    setCaption("");
  };

  const deleteItem = (id: string) => {
    if (readOnly) return;
    onChange({
      ...project,
      references: project.references.filter((r) => r.id !== id),
    });
    if (lightboxItem?.id === id) setLightboxItem(null);
  };

  const previewUrl =
    extractYouTubeThumb(urlInput.trim()) ||
    (looksLikeDirectImage(urlInput.trim()) ? urlInput.trim() : null);

  return (
    <div className="space-y-6">
      {/* Quick Link-First Input Bar (Saves Database Storage) */}
      {!readOnly && (
        <form
          onSubmit={handleAddLinkItem}
          className="surface-card rounded-[26px] p-5 sm:p-6"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
              <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
                Add Online Reference
              </h2>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-medium text-[var(--accent)]">
              <Database className="h-3 w-3" />
              Link-only mode · saves database storage
            </span>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr_140px_160px_auto]">
            <input
              type="url"
              required
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste image URL, Unsplash, Pinterest, YouTube, or TikTok link..."
              className="w-full rounded-full bg-[var(--bg-subtle)] px-4 py-2.5 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)]"
            />
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Note / lighting vibe (optional)"
              className="w-full rounded-full bg-[var(--bg-subtle)] px-4 py-2.5 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)]"
            />
            <input
              type="text"
              value={vibeTag}
              onChange={(e) => setVibeTag(e.target.value)}
              placeholder="Tag"
              className="w-full rounded-full bg-[var(--bg-subtle)] px-4 py-2.5 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none"
            />
            <select
              value={sceneId}
              onChange={(e) => setSceneId(e.target.value)}
              className="w-full rounded-full bg-[var(--bg-subtle)] px-4 py-2.5 text-[13px] text-[var(--text-primary)] focus:outline-none"
            >
              <option value="">All / General</option>
              {project.scenes.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.title}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-[var(--anchor-bg)] px-5 text-[13px] font-medium text-[var(--anchor-text)] transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          {previewUrl && (
            <div className="mt-3 flex items-center gap-3 rounded-[16px] bg-[var(--bg-subtle)] p-2.5">
              <img
                src={previewUrl}
                alt="Live preview"
                className="h-12 w-20 rounded-[10px] object-cover"
              />
              <div className="text-[12px] text-[var(--text-secondary)]">
                <span className="font-medium text-[var(--text-primary)]">
                  Live preview detected
                </span>{" "}
                · Loads directly from source URL when online.
              </div>
            </div>
          )}
        </form>
      )}

      {/* Scene Filter Pills */}
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
          All ({project.references.length})
        </button>
        <button
          type="button"
          onClick={() => setSceneFilter("general")}
          className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
            sceneFilter === "general"
              ? "bg-[var(--accent-soft)] text-[var(--accent)]"
              : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          General
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

      {/* Responsive Wide Gallery */}
      <section className="surface-card rounded-[28px] p-5 sm:p-7">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[22px] bg-[var(--bg-subtle)] px-6 py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-surface-solid)] text-[var(--accent)]">
              <ImageIcon className="h-5 w-5" />
            </div>
            <p className="text-[15px] font-medium">
              Paste any image or video link above
            </p>
            <p className="mt-1 max-w-sm text-[13px] text-[var(--text-secondary)]">
              Images load directly from their online URLs so your free database stays fast and nearly empty.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item, idx) => {
              const thumb =
                item.imageUrl ||
                (item.sourceUrl ? extractYouTubeThumb(item.sourceUrl) : null);
              const linkedScene = project.scenes.find(
                (s) => s.id === item.sceneId
              );
              const imgFailed = failedImages[item.id];
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 14, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ ...SPRING, delay: Math.min(idx * 0.04, 0.25) }}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => setLightboxItem(item)}
                  className="group cursor-pointer overflow-hidden rounded-[22px] bg-[var(--bg-subtle)] shadow-sm transition-shadow hover:shadow-[var(--shadow-soft)]"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/5">
                    {thumb && !imgFailed ? (
                      <img
                        src={thumb}
                        alt={item.caption}
                        loading="lazy"
                        onError={() =>
                          setFailedImages((prev) => ({
                            ...prev,
                            [item.id]: true,
                          }))
                        }
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-[var(--text-secondary)]">
                        <Link2 className="h-5 w-5 text-[var(--accent)]" />
                        <span className="text-[11px] font-medium">
                          {item.sourceUrl
                            ? getPlatformLabel(item.sourceUrl)
                            : "Reference"}
                        </span>
                      </div>
                    )}

                    {item.sourceUrl && (
                      <span className="absolute bottom-2.5 left-2.5 rounded-full bg-black/55 px-2.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
                        {getPlatformLabel(item.sourceUrl)}
                      </span>
                    )}

                    {!readOnly && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteItem(item.id);
                        }}
                        aria-label="Delete reference"
                        className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-[var(--bg-surface-solid)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--accent)]">
                        {item.vibeTag}
                      </span>
                      {linkedScene && (
                        <span className="truncate text-[11px] text-[var(--text-secondary)]">
                          {linkedScene.title}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 line-clamp-2 text-[14px] font-medium leading-snug text-[var(--text-primary)]">
                      {item.caption}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Frosted Lightbox */}
      <AnimatePresence>
        {lightboxItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxItem(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={SPRING}
              onClick={(e) => e.stopPropagation()}
              className="glass-modal w-full max-w-4xl overflow-hidden rounded-[28px]"
            >
              {(() => {
                const thumb =
                  lightboxItem.imageUrl ||
                  (lightboxItem.sourceUrl
                    ? extractYouTubeThumb(lightboxItem.sourceUrl)
                    : null);
                return thumb && !failedImages[lightboxItem.id] ? (
                  <div className="max-h-[68vh] w-full overflow-hidden bg-black">
                    <img
                      src={thumb}
                      alt={lightboxItem.caption}
                      className="mx-auto max-h-[68vh] w-auto object-contain"
                    />
                  </div>
                ) : null;
              })()}
              <div className="flex items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--accent)]">
                    {lightboxItem.vibeTag}
                  </span>
                  <p className="mt-0.5 text-[15px] font-medium">
                    {lightboxItem.caption}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {lightboxItem.sourceUrl && (
                    <a
                      href={lightboxItem.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-9 items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-4 text-[13px] font-medium text-[var(--accent)]"
                    >
                      Open Original
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setLightboxItem(null)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-primary)]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
