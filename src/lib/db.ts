import { Project } from "./types";
import { getSupabaseClient } from "./supabase";

const DB_NAME = "idk-plan-first-db";
const DB_VERSION = 1;
const STORE_NAME = "projects";
const CHANNEL_NAME = "idk-plan-first-sync";

// Track our own recent saves per shareCode so Supabase Realtime echoes
// never overwrite characters the user is actively typing.
const recentLocalSaves = new Map<string, number>();

function markLocalSave(shareCode: string) {
  recentLocalSaves.set(shareCode.toUpperCase(), Date.now());
}

function isRecentLocalEcho(shareCode: string, incomingUpdatedAt?: string): boolean {
  const lastLocal = recentLocalSaves.get(shareCode.toUpperCase());
  if (!lastLocal) return false;
  if (Date.now() - lastLocal < 2200) {
    if (!incomingUpdatedAt) return true;
    const incomingMs = new Date(incomingUpdatedAt).getTime();
    if (!Number.isNaN(incomingMs) && incomingMs <= lastLocal + 500) {
      return true;
    }
  }
  return false;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB is not available"));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("shareCode", "shareCode", { unique: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getSyncChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
    return null;
  }
  return new BroadcastChannel(CHANNEL_NAME);
}

export function broadcastProjectChange(projectId: string, shareCode: string) {
  const ch = getSyncChannel();
  if (!ch) return;
  ch.postMessage({
    type: "PROJECT_UPDATED",
    projectId,
    shareCode,
    ts: Date.now(),
  });
  ch.close();
}

export function subscribeProjectChanges(
  onMessage: (payload: {
    type: string;
    projectId?: string;
    shareCode?: string;
    project?: Project;
  }) => void,
  shareCodeFilter?: string
): () => void {
  const cleanups: (() => void)[] = [];

  // 1. Local multi-tab BroadcastChannel
  const ch = getSyncChannel();
  if (ch) {
    const handler = (event: MessageEvent) => {
      if (event.data) onMessage(event.data);
    };
    ch.addEventListener("message", handler);
    cleanups.push(() => {
      ch.removeEventListener("message", handler);
      ch.close();
    });
  }

  // 2. Supabase Realtime postgres_changes (when configured + shareCodeFilter provided)
  const sb = getSupabaseClient();
  if (sb && shareCodeFilter) {
    const code = shareCodeFilter.toUpperCase();
    const channel = sb
      .channel(`project-db-${code}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "projects",
          filter: `share_code=eq.${code}`,
        },
        (payload) => {
          const row = payload.new as { data?: Project } | undefined;
          if (row?.data) {
            const incoming = normalizeProject(row.data);
            if (isRecentLocalEcho(incoming.shareCode, incoming.updatedAt)) {
              return;
            }
            saveProjectLocalOnly(incoming).catch(() => {});
            onMessage({
              type: "PROJECT_UPDATED",
              projectId: incoming.id,
              shareCode: incoming.shareCode,
              project: incoming,
            });
          }
        }
      )
      .subscribe();

    cleanups.push(() => {
      sb.removeChannel(channel);
    });
  }

  return () => {
    cleanups.forEach((fn) => fn());
  };
}

function normalizeProject(raw: Project): Project {
  return {
    ...raw,
    fullScript: raw.fullScript ?? "",
    passcode: raw.passcode ?? "",
  };
}

async function saveProjectLocalOnly(project: Project): Promise<Project> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(project);
    req.onsuccess = () => resolve(project);
    req.onerror = () => reject(req.error);
  });
}

export async function listProjects(): Promise<Project[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const items = ((req.result as Project[]) || []).map(normalizeProject);
      items.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getProjectByShareCode(
  shareCode: string
): Promise<Project | null> {
  const code = shareCode.toUpperCase();

  // Try Supabase first when configured (gets latest cloud state for shared links)
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("projects")
        .select("data")
        .eq("share_code", code)
        .maybeSingle();

      if (!error && data?.data) {
        const remote = normalizeProject(data.data as Project);
        await saveProjectLocalOnly(remote).catch(() => {});
        return remote;
      }
    } catch {
      // Fall back to local IndexedDB
    }
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const idx = store.index("shareCode");
    const req = idx.get(code);
    req.onsuccess = () => {
      const res = req.result as Project | undefined;
      resolve(res ? normalizeProject(res) : null);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveProject(project: Project): Promise<Project> {
  const updated: Project = normalizeProject({
    ...project,
    updatedAt: new Date().toISOString(),
  });

  markLocalSave(updated.shareCode);
  await saveProjectLocalOnly(updated);
  broadcastProjectChange(updated.id, updated.shareCode);

  const sb = getSupabaseClient();
  if (sb) {
    try {
      await sb.from("projects").upsert(
        {
          id: updated.id,
          share_code: updated.shareCode.toUpperCase(),
          share_mode: updated.shareMode,
          passcode: updated.passcode || "",
          data: updated,
          updated_at: updated.updatedAt,
        },
        { onConflict: "id" }
      );
    } catch {
      // Local IndexedDB already saved; ignore transient offline errors
    }
  }

  return updated;
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => {
      broadcastProjectChange(id, "");
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

export function generateId(prefix = "id"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Generates a 12-character unguessable share code (~32^12 combinations)
 * safe for unlisted Google-Docs-style sharing.
 */
export function generateShareCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < 12; i++) {
      code += chars[bytes[i] % chars.length];
    }
    return code;
  }
  for (let i = 0; i < 12; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function exportProjectJson(project: Project) {
  const blob = new Blob([JSON.stringify(project, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${
    project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "shoot-plan"
  }.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function parseImportedProject(file: File): Promise<Project> {
  const text = await file.text();
  const parsed = JSON.parse(text) as Partial<Project>;
  if (
    !parsed ||
    typeof parsed.title !== "string" ||
    !Array.isArray(parsed.scenes)
  ) {
    throw new Error("Invalid project JSON file.");
  }
  const now = new Date().toISOString();
  return {
    id: generateId("proj"),
    title: parsed.title,
    logline: parsed.logline || "",
    fullScript: parsed.fullScript || "",
    shareCode: generateShareCode(),
    shareMode: parsed.shareMode || "edit",
    passcode: parsed.passcode || "",
    shootDate: parsed.shootDate || now.slice(0, 10),
    cameraProfile: parsed.cameraProfile || "4K 24p · 1/50",
    targetLut: parsed.targetLut || "Neutral Rec.709",
    scenes: parsed.scenes || [],
    shots: parsed.shots || [],
    references: parsed.references || [],
    prepItems: parsed.prepItems || [],
    createdAt: now,
    updatedAt: now,
  };
}
