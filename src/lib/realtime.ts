import { FriendProfile } from "./profile";
import { getSupabaseClient } from "./supabase";
import { WorkspaceTab } from "./types";

export interface PeerPresence {
  sessionId: string;
  profile: FriendProfile;
  tab: WorkspaceTab;
  xPct: number | null;
  yPct: number | null;
  lastSeen: number;
}

interface RealtimeCallbacks {
  onPeersChange: (peers: PeerPresence[]) => void;
}

export interface RoomConnection {
  updateTab: (tab: WorkspaceTab) => void;
  updateCursor: (xPct: number, yPct: number) => void;
  updateProfile: (profile: FriendProfile) => void;
  disconnect: () => void;
}

export function connectShootRoom(
  shareCode: string,
  initialProfile: FriendProfile,
  initialTab: WorkspaceTab,
  callbacks: RealtimeCallbacks
): RoomConnection {
  const sessionId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 12)
      : Math.random().toString(36).slice(2, 12);

  let currentProfile = initialProfile;
  let currentTab = initialTab;
  let lastCursorSent = 0;

  const peersMap = new Map<string, PeerPresence>();

  const emitPeers = () => {
    const now = Date.now();
    for (const [key, peer] of peersMap.entries()) {
      if (now - peer.lastSeen > 15000) {
        peersMap.delete(key);
      }
    }
    callbacks.onPeersChange(Array.from(peersMap.values()));
  };

  const sb = getSupabaseClient();

  // ========================================================
  // MODE A: SUPABASE REALTIME (Cloud Presence + Broadcast)
  // ========================================================
  if (sb) {
    const channel = sb.channel(`shoot-room:${shareCode.toUpperCase()}`, {
      config: {
        presence: { key: sessionId },
        broadcast: { self: false },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{
          profile: FriendProfile;
          tab: WorkspaceTab;
        }>();
        const activeIds = new Set<string>();
        Object.entries(state).forEach(([key, entries]) => {
          if (key === sessionId || !entries.length) return;
          activeIds.add(key);
          const latest = entries[entries.length - 1];
          const prev = peersMap.get(key);
          peersMap.set(key, {
            sessionId: key,
            profile: latest.profile,
            tab: latest.tab,
            xPct: prev?.xPct ?? null,
            yPct: prev?.yPct ?? null,
            lastSeen: Date.now(),
          });
        });
        for (const key of Array.from(peersMap.keys())) {
          if (!activeIds.has(key)) peersMap.delete(key);
        }
        emitPeers();
      })
      .on("broadcast", { event: "cursor" }, ({ payload }) => {
        if (!payload || payload.sessionId === sessionId) return;
        const prev = peersMap.get(payload.sessionId);
        peersMap.set(payload.sessionId, {
          sessionId: payload.sessionId,
          profile: payload.profile || prev?.profile,
          tab: payload.tab || prev?.tab || "script",
          xPct: payload.xPct,
          yPct: payload.yPct,
          lastSeen: Date.now(),
        });
        emitPeers();
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ profile: currentProfile, tab: currentTab });
        }
      });

    return {
      updateTab(tab) {
        currentTab = tab;
        channel.track({ profile: currentProfile, tab: currentTab });
      },
      updateProfile(profile) {
        currentProfile = profile;
        channel.track({ profile: currentProfile, tab: currentTab });
      },
      updateCursor(xPct, yPct) {
        const now = Date.now();
        if (now - lastCursorSent < 55) return;
        lastCursorSent = now;
        channel.send({
          type: "broadcast",
          event: "cursor",
          payload: {
            sessionId,
            profile: currentProfile,
            tab: currentTab,
            xPct,
            yPct,
          },
        });
      },
      disconnect() {
        sb.removeChannel(channel);
      },
    };
  }

  // ========================================================
  // MODE B: LOCAL MULTI-TAB BroadcastChannel (Zero-setup test)
  // ========================================================
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
    return {
      updateTab() {},
      updateCursor() {},
      updateProfile() {},
      disconnect() {},
    };
  }

  const bc = new BroadcastChannel(`shoot-room-local:${shareCode.toUpperCase()}`);

  const sendPresence = () => {
    bc.postMessage({
      type: "PRESENCE",
      sessionId,
      profile: currentProfile,
      tab: currentTab,
    });
  };

  const onMsg = (ev: MessageEvent) => {
    const msg = ev.data;
    if (!msg || msg.sessionId === sessionId) return;

    if (msg.type === "LEAVE") {
      peersMap.delete(msg.sessionId);
      emitPeers();
      return;
    }

    if (msg.type === "HELLO") {
      sendPresence();
    }

    if (msg.type === "PRESENCE" || msg.type === "HELLO") {
      const prev = peersMap.get(msg.sessionId);
      peersMap.set(msg.sessionId, {
        sessionId: msg.sessionId,
        profile: msg.profile,
        tab: msg.tab,
        xPct: prev?.xPct ?? null,
        yPct: prev?.yPct ?? null,
        lastSeen: Date.now(),
      });
      emitPeers();
    }

    if (msg.type === "CURSOR") {
      const prev = peersMap.get(msg.sessionId);
      peersMap.set(msg.sessionId, {
        sessionId: msg.sessionId,
        profile: msg.profile || prev?.profile,
        tab: msg.tab || prev?.tab || "script",
        xPct: msg.xPct,
        yPct: msg.yPct,
        lastSeen: Date.now(),
      });
      emitPeers();
    }
  };

  bc.addEventListener("message", onMsg);

  // Announce presence on join + heartbeat every 5s
  bc.postMessage({
    type: "HELLO",
    sessionId,
    profile: currentProfile,
    tab: currentTab,
  });

  const heartbeat = setInterval(() => {
    sendPresence();
    emitPeers();
  }, 5000);

  return {
    updateTab(tab) {
      currentTab = tab;
      sendPresence();
    },
    updateProfile(profile) {
      currentProfile = profile;
      sendPresence();
    },
    updateCursor(xPct, yPct) {
      const now = Date.now();
      if (now - lastCursorSent < 45) return;
      lastCursorSent = now;
      bc.postMessage({
        type: "CURSOR",
        sessionId,
        profile: currentProfile,
        tab: currentTab,
        xPct,
        yPct,
      });
    },
    disconnect() {
      clearInterval(heartbeat);
      bc.postMessage({ type: "LEAVE", sessionId });
      bc.removeEventListener("message", onMsg);
      bc.close();
    },
  };
}
