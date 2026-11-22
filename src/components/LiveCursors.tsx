"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PeerPresence } from "@/lib/realtime";
import { WorkspaceTab } from "@/lib/types";
import { FriendAvatar } from "./ProfileModal";

interface Props {
  peers: PeerPresence[];
  activeTab: WorkspaceTab;
}

export function LiveCursors({ peers, activeTab }: Props) {
  const visiblePeers = peers.filter(
    (p) =>
      p.tab === activeTab &&
      typeof p.xPct === "number" &&
      typeof p.yPct === "number"
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      <AnimatePresence>
        {visiblePeers.map((peer) => {
          const color = peer.profile.color || "#2563EB";
          return (
            <motion.div
              key={peer.sessionId}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: 1,
                scale: 1,
                left: `${peer.xPct}%`,
                top: `${peer.yPct}%`,
              }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{
                left: { type: "spring", stiffness: 260, damping: 28, mass: 0.5 },
                top: { type: "spring", stiffness: 260, damping: 28, mass: 0.5 },
                opacity: { duration: 0.2 },
              }}
              className="fixed -translate-x-1 -translate-y-1"
            >
              {/* Sleek Pointer Arrow */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="drop-shadow-md"
              >
                <path
                  d="M4.5 3.5L19.5 11.2L12.6 13.4L9.8 20.2L4.5 3.5Z"
                  fill={color}
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>

              {/* Name + Tiny Avatar Pill */}
              <div
                className="ml-3 -mt-1 flex items-center gap-1.5 rounded-full py-0.5 pl-1 pr-2.5 text-[11px] font-medium text-white shadow-md"
                style={{ backgroundColor: color }}
              >
                <FriendAvatar profile={peer.profile} size="xs" />
                <span className="max-w-[100px] truncate">
                  {peer.profile.name}
                </span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
