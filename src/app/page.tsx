"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Sun,
  Moon,
  Upload,
  Film,
  Sparkles,
  Search,
  FolderOpen,
  CheckCircle2,
  Database,
} from "lucide-react";
import { Project } from "@/lib/types";
import {
  listProjects,
  saveProject,
  deleteProject,
  parseImportedProject,
  subscribeProjectChanges,
} from "@/lib/db";
import { createBlankProject, createStarterProject } from "@/lib/starter";
import { useTheme } from "@/lib/theme";
import { AppLogo, CuteSlateBuddy, FolderShootCard } from "@/components/AppIcons";

const SPRING = { type: "spring" as const, stiffness: 380, damping: 32 };

export default function DashboardPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCamera, setNewCamera] = useState("Sony ZV-E10 · 4K 24p · Cine2");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAll = async () => {
    try {
      const items = await listProjects();
      setProjects(items);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    const unsub = subscribeProjectChanges(() => {
      loadAll();
    });
    return unsub;
  }, []);

  const handleCreateStarter = async () => {
    const starter = createStarterProject();
    await saveProject(starter);
    router.push(`/p/${starter.shareCode}`);
  };

  const handleCreateBlank = async (e: React.FormEvent) => {
    e.preventDefault();
    const proj = createBlankProject(newTitle.trim() || "Untitled Shoot");
    if (newCamera.trim()) proj.cameraProfile = newCamera.trim();
    await saveProject(proj);
    setShowNewModal(false);
    setNewTitle("");
    router.push(`/p/${proj.shareCode}`);
  };

  const handleJoinCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinCode.trim().toUpperCase();
    if (!clean) return;
    router.push(`/p/${clean}`);
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setErrorMsg(null);
      const imported = await parseImportedProject(file);
      await saveProject(imported);
      router.push(`/p/${imported.shareCode}`);
    } catch {
      setErrorMsg(
        "Could not read that JSON file. Please select an exported shoot file."
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const totalShots = projects.reduce((sum, p) => sum + p.shots.length, 0);
  const filmedShots = projects.reduce(
    (sum, p) => sum + p.shots.filter((s) => s.isFilmed).length,
    0
  );
  const overallPct =
    totalShots > 0 ? Math.round((filmedShots / totalShots) * 100) : 0;

  return (
    <div className="min-h-screen p-3 sm:p-5 lg:p-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImportJson}
      />

      {/* Mobile Top Bar (< lg) */}
      <header className="glass-surface sticky top-3 z-30 mb-5 flex items-center justify-between rounded-full px-4 py-2.5 lg:hidden">
        <div className="flex items-center gap-2.5">
          <AppLogo className="h-8 w-8 rounded-[10px]" />
          <span className="text-[14px] font-semibold tracking-[-0.01em]">
            Plan First
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
            aria-label="Import JSON"
          >
            <Upload className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </div>
      </header>

      {/* Main Responsive App Shell */}
      <div className="mx-auto grid max-w-[1520px] gap-6 lg:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_300px]">
        {/* LEFT FROSTED SIDEBAR (Desktop) */}
        <aside className="glass-surface hidden h-[calc(100vh-3rem)] sticky top-6 flex-col justify-between rounded-[28px] p-5 lg:flex">
          <div>
            {/* Brand Header */}
            <div className="flex items-center gap-3 px-1">
              <AppLogo className="h-10 w-10" />
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold tracking-[-0.01em]">
                  IDK Yet Maybe
                </p>
                <p className="truncate text-[12px] text-[var(--text-secondary)]">
                  We Plan First
                </p>
              </div>
            </div>

            {/* Primary Nav / Actions */}
            <div className="mt-8 space-y-1.5">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-[16px] bg-gradient-to-r from-[#3B82F6] to-[#2563EB] px-3.5 py-2.5 text-[13px] font-medium text-white shadow-[0_8px_20px_rgba(37,99,235,0.28)]"
              >
                <FolderOpen className="h-4 w-4" />
                All Shoots
                <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-[11px]">
                  {projects.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowNewModal(true)}
                className="flex w-full items-center gap-3 rounded-[16px] px-3.5 py-2.5 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
              >
                <Plus className="h-4 w-4" />
                New Shoot
              </button>

              <button
                type="button"
                onClick={handleCreateStarter}
                className="flex w-full items-center gap-3 rounded-[16px] px-3.5 py-2.5 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
              >
                <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                Load Starter Shoot
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center gap-3 rounded-[16px] px-3.5 py-2.5 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
              >
                <Upload className="h-4 w-4" />
                Import JSON
              </button>
            </div>

            {/* Quick Share Code Jump */}
            <form onSubmit={handleJoinCode} className="mt-8">
              <label className="mb-2 block px-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                Open Share Code
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Enter code..."
                  maxLength={8}
                  className="w-full rounded-[14px] bg-[var(--bg-subtle)] py-2.5 pl-9 pr-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)]"
                />
              </div>
            </form>
          </div>

          {/* Sidebar Footer: Cute Buddy + Theme Switch */}
          <div className="space-y-3 border-t hairline-divider pt-4">
            <CuteSlateBuddy progress={overallPct} compact />
            <button
              type="button"
              onClick={toggleTheme}
              className="flex w-full items-center justify-between rounded-[14px] px-3 py-2 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
            >
              <span>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </aside>

        {/* CENTER WORKSPACE: FOLDER GRID */}
        <main className="surface-card min-h-[calc(100vh-3rem)] rounded-[28px] p-5 sm:p-7 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
                Pre-Production Hub
              </p>
              <h1 className="mt-1 text-[26px] font-semibold tracking-[-0.025em] sm:text-[32px]">
                Your Shoots
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative hidden sm:block">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter shoots..."
                  className="h-10 w-44 rounded-full bg-[var(--bg-subtle)] pl-9 pr-4 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)]"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={handleCreateStarter}
                className="flex h-10 items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-4 text-[13px] font-medium text-[var(--accent)] transition-opacity hover:opacity-85 lg:hidden"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Starter
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setShowNewModal(true)}
                className="flex h-10 items-center gap-1.5 rounded-full bg-[var(--anchor-bg)] px-5 text-[13px] font-medium text-[var(--anchor-text)] transition-opacity hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                New Shoot
              </motion.button>
            </div>
          </div>

          {errorMsg && (
            <div className="mt-5 rounded-[18px] bg-[var(--bg-subtle)] px-4 py-3 text-[13px] text-[var(--text-primary)]">
              {errorMsg}
            </div>
          )}

          {/* Folder Cards Grid */}
          <div className="mt-8">
            {loading ? (
              <div className="py-16 text-center text-[14px] text-[var(--text-secondary)]">
                Loading shoots...
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[24px] bg-[var(--bg-subtle)] px-6 py-20 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-surface-solid)] text-[var(--accent)] shadow-sm">
                  <Film className="h-6 w-6" />
                </div>
                <p className="text-[16px] font-semibold">
                  {projects.length === 0
                    ? "Plan your first shoot"
                    : "No matching shoots"}
                </p>
                <p className="mt-1.5 max-w-sm text-[13px] text-[var(--text-secondary)]">
                  Start from scratch or load the sample short film with a full script, scenes, shot list, and gear checklist.
                </p>
                {projects.length === 0 && (
                  <button
                    type="button"
                    onClick={handleCreateStarter}
                    className="mt-6 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] px-5 py-2.5 text-[13px] font-medium text-white shadow-[0_8px_20px_rgba(37,99,235,0.28)]"
                  >
                    Create Starter Shoot
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 2xl:grid-cols-3">
                {filteredProjects.map((proj, idx) => {
                  const filmedCount = proj.shots.filter(
                    (s) => s.isFilmed
                  ).length;
                  return (
                    <FolderShootCard
                      key={proj.id}
                      index={idx}
                      title={proj.title}
                      shareCode={proj.shareCode}
                      sceneCount={proj.scenes.length}
                      filmedCount={filmedCount}
                      totalShots={proj.shots.length}
                      cameraProfile={proj.cameraProfile}
                      onClick={() => router.push(`/p/${proj.shareCode}`)}
                      onDelete={(e) => handleDelete(e, proj.id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* RIGHT INFO INSPECTOR (Wide Desktop xl:) */}
        <aside className="hidden space-y-5 xl:block">
          <div className="surface-card rounded-[28px] p-6">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
              Studio Overview
            </h2>
            <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
              Local workspace summary
            </p>

            <div className="mt-5 space-y-3.5">
              <div className="rounded-[20px] bg-[var(--bg-subtle)] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[var(--text-secondary)]">
                    Active Shoots
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                    <FolderOpen className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-2 text-[26px] font-semibold tracking-[-0.03em]">
                  {projects.length}
                </p>
              </div>

              <div className="rounded-[20px] bg-[var(--bg-subtle)] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[var(--text-secondary)]">
                    Shots Captured
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-2 text-[26px] font-semibold tracking-[-0.03em]">
                  {filmedShots}
                  <span className="text-[16px] font-normal text-[var(--text-secondary)]">
                    /{totalShots}
                  </span>
                </p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface-solid)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#60A5FA] to-[#2563EB] transition-all duration-500"
                    style={{ width: `${overallPct}%` }}
                  />
                </div>
              </div>

              <div className="rounded-[20px] bg-[var(--bg-subtle)] p-4">
                <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--text-primary)]">
                  <Database className="h-3.5 w-3.5 text-[var(--accent)]" />
                  Free-Tier Storage Ready
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                  Link-only moodboards & WebP storyboards keep project sizes tiny for Supabase free tier.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* New Project Frosted Modal */}
      <AnimatePresence>
        {showNewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNewModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={SPRING}
              onClick={(e) => e.stopPropagation()}
              className="glass-modal w-full max-w-md rounded-[28px] p-7"
            >
              <div className="flex items-center gap-3">
                <AppLogo className="h-9 w-9" />
                <div>
                  <h2 className="text-[19px] font-semibold tracking-[-0.02em]">
                    New Shoot
                  </h2>
                  <p className="text-[12px] text-[var(--text-secondary)]">
                    Working title & camera profile
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateBlank} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
                    Project Title
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Night Walk Short Film"
                    className="w-full rounded-[16px] bg-[var(--bg-subtle)] px-4 py-3 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
                    Camera Profile
                  </label>
                  <input
                    type="text"
                    value={newCamera}
                    onChange={(e) => setNewCamera(e.target.value)}
                    placeholder="Sony ZV-E10 · 4K 24p · Cine2"
                    className="w-full rounded-[16px] bg-[var(--bg-subtle)] px-4 py-3 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)]"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="rounded-full px-4 py-2.5 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] px-5 py-2.5 text-[13px] font-medium text-white shadow-[0_8px_20px_rgba(37,99,235,0.28)]"
                  >
                    Create Shoot
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
