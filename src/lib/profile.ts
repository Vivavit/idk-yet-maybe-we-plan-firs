export interface FriendProfile {
  id: string;
  name: string;
  avatarType: "preset" | "image";
  avatarValue: string; // preset key OR tiny 96x96 WebP data URL
  color: string;
}

export const AVATAR_PRESETS = [
  { id: "director", emoji: "🎬", label: "Director", color: "#2563EB" },
  { id: "camera", emoji: "🎥", label: "Camera", color: "#0EA5E9" },
  { id: "spark", emoji: "✨", label: "Creative", color: "#6366F1" },
  { id: "light", emoji: "💡", label: "Gaffer", color: "#F59E0B" },
  { id: "sound", emoji: "🎧", label: "Sound", color: "#10B981" },
  { id: "cat", emoji: "🐱", label: "Crew Cat", color: "#EC4899" },
];

const STORAGE_KEY = "plan-first-friend-profile";

export function loadFriendProfile(): FriendProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FriendProfile>;
    if (!parsed.id || !parsed.name) return null;
    return {
      id: parsed.id,
      name: parsed.name,
      avatarType: parsed.avatarType === "image" ? "image" : "preset",
      avatarValue: parsed.avatarValue || "director",
      color: parsed.color || "#2563EB",
    };
  } catch {
    return null;
  }
}

export function saveFriendProfile(profile: FriendProfile): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

export function createFriendId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `crew_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `crew_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Compresses any uploaded photo to a tiny 96x96 WebP (~3-5KB) in the browser
 * so it can safely travel in Realtime presence and never bloat storage.
 */
export function compressAvatarFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image"));
      img.onload = () => {
        const size = 96;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No canvas context"));
          return;
        }
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL("image/webp", 0.72));
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}
