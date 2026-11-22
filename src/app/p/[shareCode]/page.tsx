"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Clapperboard,
  Image as ImageIcon,
  ClipboardCheck,
  Radio,
  Share2,
  Sun,
  Moon,
  Lock,
} from "lucide-react";
import { Project, ShareMode, WorkspaceTab } from "@/lib/types";
import {
  getProjectByShareCode,
  saveProject,
  subscribeProjectChanges,
} from "@/lib/db";
import {
  FriendProfile,
  loadFriendProfile,
  saveFriendProfile,
} from "@/lib/profile";
import {
  PeerPresence,
  RoomConnection,
  connectShootRoom,
} from "@/lib/realtime";
import { useTheme } from "@/lib/theme";
import { ScriptView } from "@/components/ScriptView";
import { ShotListView } from "@/components/ShotListView";
import { MoodboardView } from "@/components/MoodboardView";
import { ShootPrepView } from "@/components/ShootPrepView";
import { OnSetModeView } from "@/components/OnSetModeView";
import { ShareModal } from "@/components/ShareModal";
import { FriendAvatar, ProfileModal } from "@/components/ProfileModal";
import { LiveCursors } from "@/components/LiveCursors";
import { AppLogo, CuteSlateBuddy } from "@/components/AppIcons";

const SPRING = { type: "spring" as const, stiffness: 380, damping: 32 };

const TABS: {
  id: WorkspaceTab;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "script",
    label: "Script & Scenes",
    shortLabel: "Script",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    id: "shots",
    label: "Shots & Boards",
    shortLabel: "Shots",
    icon: <Clapperboard className="h-4 w-4" />,
  },
  {
    id: "moodboard",
    label: "Moodboard",
    shortLabel: "Mood",
    icon: <ImageIcon className="h-4 w-4" />,
  },
  {
    id: "prep",
    label: "Shoot Prep",
    shortLabel: "Prep",
    icon: <ClipboardCheck className="h-4 w-4" />,
  },
  {
    id: "onset",
    label: "On-Set Mode",
    shortLabel: "On-Set",
    icon: <Radio className="h-4 w-4" />,
  },
];

export default function ProjectWorkspacePage() {
  const params = useParams<{ shareCode: string }>();
  const router = useRouter();
  const { theme, toggleTheme, setForceDark } = useTheme();

  const shareCode = String(params?.shareCode || "").toUpperCase();
  const [project, setProject] = useState<Project | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("script");
  const [showShare, setShowShare] = useState(false);
  const [syncPulse, setSyncPulse] = useState(false);

  // Friend Profile (Name + Avatar)
  const [profile, setProfile] = useState<FriendProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Live Presence & Cursors
  const [peers, setPeers] = useState<PeerPresence[]>([]);
  const roomRef = useRef<RoomConnection | null>(null);

  // Optional Shoot Passcode Gate
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    const existing = loadFriendProfile();
    if (existing) {
      setProfile(existing);
    } else {
      setShowProfileModal(true);
    }
  }, []);

  const loadProject = useCallback(async () => {
    if (!shareCode) return;
    try {
      const found = await getProjectByShareCode(shareCode);
      if (found) {
        setProject(found);
        setNotFound(false);
        if (!found.passcode) {
          setUnlocked(true);
        } else if (typeof window !== "undefined") {
          const cached = window.sessionStorage.getItem(`pin-ok:${shareCode}`);
          if (cached === found.passcode) setUnlocked(true);
        }
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    }
  }, [shareCode]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Live project sync (BroadcastChannel + Supabase Realtime)
  useEffect(() => {
    if (!shareCode) return;
    const unsub = subscribeProjectChanges((msg) => {
      if (msg.shareCode && msg.shareCode.toUpperCase() === shareCode) {
        if (msg.project) {
          setProject(msg.project);
        } else {
          loadProject();
        }
        setSyncPulse(true);
        setTimeout(() => setSyncPulse(false), 1200);
      }
    }, shareCode);
    return unsub;
  }, [shareCode, loadProject]);

  // Connect Live Presence & Cursors room once profile + unlocked
  useEffect(() => {
    if (!shareCode || !profile || !unlocked) return;
    const room = connectShootRoom(shareCode, profile, activeTab, {
      onPeersChange: (nextPeers) => setPeers(nextPeers),
    });
    roomRef.current = room;

    const handlePointerMove = (e: PointerEvent) => {
      if (!window.innerWidth || !window.innerHeight) return;
      const xPct = (e.clientX / window.innerWidth) * 100;
      const yPct = (e.clientY / window.innerHeight) * 100;
      room.updateCursor(xPct, yPct);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      room.disconnect();
      roomRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareCode, profile?.id, unlocked]);

  // Keep room updated when activeTab or profile changes
  useEffect(() => {
    roomRef.current?.updateTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (profile) roomRef.current?.updateProfile(profile);
  }, [profile]);

  // Automatic high-contrast Dark Mode when On-Set Mode is active
  useEffect(() => {
    setForceDark(activeTab === "onset");
    return () => setForceDark(false);
  }, [activeTab, setForceDark]);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleProjectChange = useCallback((updated: Project) => {
    setProject(updated);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveProject(updated).catch(() => {});
    }, 220);
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleShareModeChange = (mode: ShareMode) => {
    if (!project) return;
    handleProjectChange({ ...project, shareMode: mode });
  };

  const handlePasscodeChange = (passcode: string) => {
    if (!project) return;
    handleProjectChange({ ...project, passcode });
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(`pin-ok:${shareCode}`, passcode);
    }
  };

  const handleProfileSave = (next: FriendProfile) => {
    saveFriendProfile(next);
    setProfile(next);
    setShowProfileModal(false);
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    if (pinInput.trim() === (project.passcode || "").trim()) {
      setUnlocked(true);
      setPinError(false);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          `pin-ok:${shareCode}`,
          project.passcode || ""
        );
      }
    } else {
      setPinError(true);
    }
  };

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="surface-card max-w-sm rounded-[28px] p-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            Code {shareCode}
          </p>
          <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em]">
            Shoot not found
          </h1>
          <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
            This project isn’t stored here yet. Check the share link, import its JSON file, or create a new shoot.
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-6 rounded-full bg-[var(--anchor-bg)] px-5 py-2.5 text-[13px] font-medium text-[var(--anchor-text)]"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[14px] text-[var(--text-secondary)]">
        Opening workspace...
      </div>
    );
  }

  // Passcode Lock Screen
  if (project.passcode && !unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center p-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={SPRING}
          className="glass-modal w-full max-w-sm rounded-[28px] p-7 text-center"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-[20px] font-semibold tracking-[-0.02em]">
            {project.title}
          </h1>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            Enter the friend passcode to open this shoot.
          </p>
          <form onSubmit={handleUnlockSubmit} className="mt-5 space-y-3">
            <input
              type="password"
              autoFocus
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError(false);
              }}
              placeholder="Shoot passcode..."
              className="w-full rounded-[16px] bg-[var(--bg-subtle)] px-4 py-3 text-center text-[15px] tracking-widest text-[var(--text-primary)] placeholder:tracking-normal placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)]"
            />
            {pinError && (
              <p className="text-[12px] text-red-500">
                Incorrect passcode. Try again.
              </p>
            )}
            <button
              type="submit"
              className="w-full rounded-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] py-3 text-[14px] font-medium text-white shadow-[0_8px_20px_rgba(37,99,235,0.28)]"
            >
              Unlock Shoot
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const readOnly = project.shareMode === "view";
  const filmedCount = project.shots.filter((s) => s.isFilmed).length;
  const totalShots = project.shots.length;
  const pct = totalShots > 0 ? Math.round((filmedCount / totalShots) * 100) : 0;

  return (
    <div className="min-h-screen p-3 pb-28 sm:p-5 lg:p-6 lg:pb-6">
      {/* Live Figma-style Friend Cursors */}
      <LiveCursors peers={peers} activeTab={activeTab} />

      {/* Mobile / Tablet Floating Top Bar (< lg) */}
      <header className="glass-surface sticky top-3 z-30 mb-5 flex items-center justify-between gap-2 rounded-full px-3 py-2 lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/")}
            aria-label="Back to projects"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <AppLogo className="h-7 w-7 rounded-[9px]" />
          <input
            type="text"
            disabled={readOnly}
            value={project.title}
            onChange={(e) =>
              handleProjectChange({ ...project, title: e.target.value })
            }
            aria-label="Project title"
            className="min-w-0 max-w-[140px] truncate bg-transparent text-[14px] font-semibold tracking-[-0.01em] text-[var(--text-primary)] focus:outline-none sm:max-w-[240px]"
          />
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {profile && (
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              title={`Signed in as ${profile.name}`}
              className="flex items-center"
            >
              <FriendAvatar profile={profile} size="sm" />
            </button>
          )}
          {activeTab !== "onset" && (
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
          )}
          <button
            type="button"
            onClick={() => setShowShare(true)}
            className="flex h-8 items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-3 text-[12px] font-medium text-[var(--accent)]"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
        </div>
      </header>

      {/* Desktop App Shell: Left Frosted Sidebar + Expansive Main Canvas */}
      <div className="mx-auto grid max-w-[1600px] gap-6 lg:grid-cols-[264px_1fr]">
        {/* LEFT FROSTED SIDEBAR (Desktop lg+) */}
        <aside className="glass-surface sticky top-6 hidden h-[calc(100vh-3rem)] flex-col justify-between overflow-y-auto rounded-[28px] p-5 lg:flex">
          <div>
            {/* Top Brand + Back */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="group flex items-center gap-2.5 text-left"
              >
                <AppLogo className="h-9 w-9" />
                <div>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--text-secondary)] group-hover:text-[var(--accent)]">
                    <ArrowLeft className="h-3 w-3" />
                    All Shoots
                  </span>
                  <p className="text-[12px] font-semibold tracking-[-0.01em]">
                    Plan First
                  </p>
                </div>
              </button>

              {profile && (
                <button
                  type="button"
                  onClick={() => setShowProfileModal(true)}
                  title={`${profile.name} (click to edit)`}
                  className="transition-transform hover:scale-105"
                >
                  <FriendAvatar profile={profile} size="sm" />
                </button>
              )}
            </div>

            {/* Editable Project Title */}
            <div className="mt-5 rounded-[18px] bg-[var(--bg-subtle)] px-3.5 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                  Current Shoot
                </span>
                {syncPulse && (
                  <span className="text-[10px] font-medium text-[var(--accent)]">
                    Synced
                  </span>
                )}
              </div>
              <input
                type="text"
                disabled={readOnly}
                value={project.title}
                onChange={(e) =>
                  handleProjectChange({ ...project, title: e.target.value })
                }
                aria-label="Project title"
                className="mt-1 w-full bg-transparent text-[14px] font-semibold tracking-[-0.01em] text-[var(--text-primary)] focus:outline-none"
              />
            </div>

            {/* Vertical Navigation with Live Crew Presence Dots */}
            <nav className="mt-5 space-y-1.5">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const tabPeers = peers.filter((p) => p.tab === tab.id);
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex w-full items-center justify-between rounded-[16px] px-3.5 py-2.5 text-[13px] font-medium transition-colors ${
                      isActive
                        ? "text-white"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="desktop-sidebar-pill"
                        transition={SPRING}
                        className="absolute inset-0 rounded-[16px] bg-gradient-to-r from-[#3B82F6] to-[#2563EB] shadow-[0_8px_20px_rgba(37,99,235,0.28)]"
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-3 whitespace-nowrap">
                      {tab.icon}
                      {tab.label}
                    </span>
                    {tabPeers.length > 0 && (
                      <span className="relative z-10 flex -space-x-1.5">
                        {tabPeers.slice(0, 3).map((tp) => (
                          <FriendAvatar
                            key={tp.sessionId}
                            profile={tp.profile}
                            size="xs"
                          />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Online Crew Presence Strip */}
            {peers.length > 0 && (
              <div className="mt-5 rounded-[18px] bg-[var(--bg-subtle)] p-3">
                <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  On Set Now ({peers.length + 1})
                </p>
                <div className="space-y-1.5">
                  {peers.map((peer) => {
                    const peerTabLabel =
                      TABS.find((t) => t.id === peer.tab)?.shortLabel ||
                      peer.tab;
                    return (
                      <div
                        key={peer.sessionId}
                        className="flex items-center justify-between gap-2 text-[12px]"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <FriendAvatar profile={peer.profile} size="xs" />
                          <span className="truncate font-medium text-[var(--text-primary)]">
                            {peer.profile.name}
                          </span>
                        </div>
                        <span className="shrink-0 rounded-full bg-[var(--bg-surface-solid)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">
                          {peerTabLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Cute Buddy + Shoot Progress + Controls */}
          <div className="mt-4 space-y-3">
            <CuteSlateBuddy progress={pct} compact />

            <div className="rounded-[20px] bg-[var(--bg-subtle)] p-3.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-[var(--text-secondary)]">Progress</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {filmedCount}/{totalShots} shots
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface-solid)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#60A5FA] to-[#2563EB] transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeTab !== "onset" && (
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </button>
              )}
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setShowShare(true)}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--accent-soft)] text-[13px] font-medium text-[var(--accent)] transition-opacity hover:opacity-85"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share Shoot
              </motion.button>
            </div>
          </div>
        </aside>

        {/* MAIN EXPANSIVE CANVAS */}
        <main className="min-w-0">
          {readOnly && (
            <div className="mb-5 rounded-full bg-[var(--bg-subtle)] px-4 py-2 text-center text-[12px] text-[var(--text-secondary)]">
              View-only mode is active. Switch access level in Share to resume editing.
            </div>
          )}

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeTab === "script" && (
              <ScriptView
                project={project}
                readOnly={readOnly}
                onChange={handleProjectChange}
              />
            )}
            {activeTab === "shots" && (
              <ShotListView
                project={project}
                readOnly={readOnly}
                onChange={handleProjectChange}
              />
            )}
            {activeTab === "moodboard" && (
              <MoodboardView
                project={project}
                readOnly={readOnly}
                onChange={handleProjectChange}
              />
            )}
            {activeTab === "prep" && (
              <ShootPrepView
                project={project}
                readOnly={readOnly}
                onChange={handleProjectChange}
              />
            )}
            {activeTab === "onset" && (
              <OnSetModeView
                project={project}
                readOnly={readOnly}
                onChange={handleProjectChange}
              />
            )}
          </motion.div>
        </main>
      </div>

      {/* Floating Frosted Bottom Dock (Mobile / Tablet < lg) */}
      <nav className="fixed bottom-4 left-1/2 z-30 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 lg:hidden">
        <div className="glass-surface flex items-center justify-around rounded-full px-2 py-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center gap-0.5 rounded-full px-3 py-1.5 text-[10px] font-medium transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="mobile-nav-pill"
                    transition={SPRING}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB]"
                  />
                )}
                <span className="relative z-10">{tab.icon}</span>
                <span className="relative z-10">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Share Modal */}
      <AnimatePresence>
        {showShare && (
          <ShareModal
            project={project}
            onChangeMode={handleShareModeChange}
            onChangePasscode={handlePasscodeChange}
            onClose={() => setShowShare(false)}
          />
        )}
      </AnimatePresence>

      {/* Friend Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <ProfileModal
            initialProfile={profile}
            canDismiss={Boolean(profile)}
            onSave={handleProfileSave}
            onClose={() => setShowProfileModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
