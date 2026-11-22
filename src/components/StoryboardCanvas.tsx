"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Pen,
  Highlighter,
  MoveUpRight,
  Square,
  Circle,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Grid3X3,
  X,
  Check,
} from "lucide-react";

type Tool = "pen" | "highlighter" | "arrow" | "rect" | "circle" | "eraser";
type AspectGuide = "16:9" | "2.39:1" | "9:16";

const SWATCHES = [
  { id: "ink", label: "Ink", color: "#141414" },
  { id: "white", label: "Chalk", color: "#FFFFFF" },
  { id: "motion", label: "Motion", color: "#D1493F" },
  { id: "light", label: "Lighting", color: "#4E6E8E" },
  { id: "subject", label: "Subject", color: "#C8953A" },
];

const CANVAS_W = 960;
const CANVAS_H = 540;

interface Props {
  initialDataUrl: string | null;
  shotLabel: string;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

export function StoryboardCanvas({
  initialDataUrl,
  shotLabel,
  onSave,
  onClose,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snapshotRef = useRef<ImageData | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const isDrawingRef = useRef(false);

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#141414");
  const [strokeSize, setStrokeSize] = useState(4);
  const [showThirds, setShowThirds] = useState(true);
  const [aspectGuide, setAspectGuide] = useState<AspectGuide>("16:9");
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  const pushHistory = (ctx: CanvasRenderingContext2D) => {
    const snap = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIdx + 1);
      const next = [...sliced, snap].slice(-25);
      setHistoryIdx(next.length - 1);
      return next;
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#FAFAF8";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (initialDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
        const snap = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
        setHistory([snap]);
        setHistoryIdx(0);
      };
      img.src = initialDataUrl;
    } else {
      const snap = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
      setHistory([snap]);
      setHistoryIdx(0);
    }
  }, [initialDataUrl]);

  const getCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  };

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) => {
    const headLen = Math.max(14, strokeSize * 4);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLen * Math.cos(angle - Math.PI / 6),
      y2 - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLen * Math.cos(angle + Math.PI / 6),
      y2 - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    const pt = getCoords(e);
    isDrawingRef.current = true;
    startPointRef.current = pt;

    if (tool === "arrow" || tool === "rect" || tool === "circle") {
      snapshotRef.current = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    } else {
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !startPointRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pt = getCoords(e);

    if (tool === "pen" || tool === "highlighter" || tool === "eraser") {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (tool === "eraser") {
        ctx.strokeStyle = "#FAFAF8";
        ctx.lineWidth = strokeSize * 5;
        ctx.globalAlpha = 1;
      } else if (tool === "highlighter") {
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeSize * 4.5;
        ctx.globalAlpha = 0.22;
      } else {
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeSize;
        ctx.globalAlpha = 1;
      }
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.globalAlpha = 1;
    } else if (snapshotRef.current) {
      ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const sx = startPointRef.current.x;
      const sy = startPointRef.current.y;

      if (tool === "arrow") {
        drawArrow(ctx, sx, sy, pt.x, pt.y);
      } else if (tool === "rect") {
        ctx.strokeRect(sx, sy, pt.x - sx, pt.y - sy);
      } else if (tool === "circle") {
        const rx = Math.abs(pt.x - sx) / 2;
        const ry = Math.abs(pt.y - sy) / 2;
        const cx = (sx + pt.x) / 2;
        const cy = (sy + pt.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    startPointRef.current = null;
    snapshotRef.current = null;

    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.restore();
    pushHistory(ctx);
  };

  const handleUndo = () => {
    if (historyIdx <= 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const nextIdx = historyIdx - 1;
    ctx.putImageData(history[nextIdx], 0, 0);
    setHistoryIdx(nextIdx);
  };

  const handleRedo = () => {
    if (historyIdx >= history.length - 1) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const nextIdx = historyIdx + 1;
    ctx.putImageData(history[nextIdx], 0, 0);
    setHistoryIdx(nextIdx);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FAFAF8";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    pushHistory(ctx);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Compressed WebP keeps storyboard frames lightweight (~15-25KB) for free-tier DBs
    const dataUrl = canvas.toDataURL("image/webp", 0.74);
    onSave(dataUrl);
  };

  const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: "pen", icon: <Pen className="h-4 w-4" />, label: "Pen" },
    {
      id: "highlighter",
      icon: <Highlighter className="h-4 w-4" />,
      label: "Highlighter",
    },
    {
      id: "arrow",
      icon: <MoveUpRight className="h-4 w-4" />,
      label: "Motion Arrow",
    },
    { id: "rect", icon: <Square className="h-4 w-4" />, label: "Frame / Box" },
    { id: "circle", icon: <Circle className="h-4 w-4" />, label: "Circle" },
    { id: "eraser", icon: <Eraser className="h-4 w-4" />, label: "Eraser" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 backdrop-blur-md sm:p-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border hairline-divider bg-[var(--bg-surface)] shadow-[var(--shadow-float)]"
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b hairline-divider px-5 py-3.5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-secondary)]">
              Storyboard Studio
            </p>
            <h3 className="text-[15px] font-semibold tracking-[-0.01em]">
              {shotLabel}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex h-9 items-center gap-1.5 rounded-full bg-[var(--anchor-bg)] px-4 text-[13px] font-medium text-[var(--anchor-text)] transition-opacity hover:opacity-90"
            >
              <Check className="h-4 w-4" />
              Save Frame
            </button>
          </div>
        </div>

        {/* Canvas Viewport */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[var(--bg-subtle)] p-4 sm:p-6">
          <div className="relative w-full max-w-[920px] aspect-video overflow-hidden rounded-[18px] shadow-[var(--shadow-soft)] ring-1 ring-black/10">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="h-full w-full touch-none cursor-crosshair bg-[#FAFAF8]"
            />

            {/* Rule of Thirds Overlay */}
            {showThirds && (
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/3 top-0 h-full w-px bg-black/12" />
                <div className="absolute left-2/3 top-0 h-full w-px bg-black/12" />
                <div className="absolute left-0 top-1/3 h-px w-full bg-black/12" />
                <div className="absolute left-0 top-2/3 h-px w-full bg-black/12" />
              </div>
            )}

            {/* Aspect Ratio Guides */}
            {aspectGuide === "2.39:1" && (
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                <div className="h-[12.5%] w-full bg-black/28" />
                <div className="h-[12.5%] w-full bg-black/28" />
              </div>
            )}
            {aspectGuide === "9:16" && (
              <div className="pointer-events-none absolute inset-0 flex justify-between">
                <div className="h-full w-[34%] bg-black/28" />
                <div className="h-full w-[34%] bg-black/28" />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t hairline-divider px-5 py-3.5">
          {/* Drawing Tools */}
          <div className="flex items-center gap-1 rounded-full bg-[var(--bg-subtle)] p-1">
            {tools.map((t) => {
              const active = tool === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  title={t.label}
                  onClick={() => setTool(t.id)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                    active
                      ? "bg-[var(--bg-surface)] text-[var(--accent)] shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {t.icon}
                </button>
              );
            })}
          </div>

          {/* Swatches + Size */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {SWATCHES.map((sw) => {
                const selected = color === sw.color && tool !== "eraser";
                return (
                  <button
                    key={sw.id}
                    type="button"
                    title={sw.label}
                    onClick={() => {
                      setColor(sw.color);
                      if (tool === "eraser") setTool("pen");
                    }}
                    className={`h-6 w-6 rounded-full border border-black/15 transition-transform ${
                      selected ? "scale-115 ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-surface)]" : ""
                    }`}
                    style={{ backgroundColor: sw.color }}
                  />
                );
              })}
            </div>

            <div className="flex items-center gap-1.5">
              {[2, 4, 8].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setStrokeSize(sz)}
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                    strokeSize === sz
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                  }`}
                >
                  <span
                    className="rounded-full bg-current"
                    style={{ width: sz + 3, height: sz + 3 }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Guides & Undo/Redo */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-full bg-[var(--bg-subtle)] p-1 text-[11px] font-medium">
              {(["16:9", "2.39:1", "9:16"] as AspectGuide[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setAspectGuide(g)}
                  className={`rounded-full px-2.5 py-1 transition-colors ${
                    aspectGuide === g
                      ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                      : "text-[var(--text-secondary)]"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowThirds((v) => !v)}
              title="Rule of thirds"
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                showThirds
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIdx <= 0}
              title="Undo"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] disabled:opacity-35"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIdx >= history.length - 1}
              title="Redo"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] disabled:opacity-35"
            >
              <Redo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              title="Clear canvas"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
