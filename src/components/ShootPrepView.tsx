"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Check,
  Trash2,
  Backpack,
  CalendarClock,
  Users,
  MapPin,
} from "lucide-react";
import { PrepCategory, PrepItem, Project } from "@/lib/types";
import { generateId } from "@/lib/db";

const CATEGORIES: {
  id: PrepCategory;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
}[] = [
  {
    id: "gear",
    label: "Gear",
    icon: <Backpack className="h-4 w-4" />,
    placeholder: "Add camera, lens, battery, mic...",
  },
  {
    id: "schedule",
    label: "Call Sheet",
    icon: <CalendarClock className="h-4 w-4" />,
    placeholder: "Add call time or shoot block...",
  },
  {
    id: "crew",
    label: "Crew",
    icon: <Users className="h-4 w-4" />,
    placeholder: "Add friend or crew role...",
  },
  {
    id: "location",
    label: "Locations",
    icon: <MapPin className="h-4 w-4" />,
    placeholder: "Add location or parking note...",
  },
];

interface Props {
  project: Project;
  readOnly: boolean;
  onChange: (updated: Project) => void;
}

export function ShootPrepView({ project, readOnly, onChange }: Props) {
  const [category, setCategory] = useState<PrepCategory>("gear");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [timeSlot, setTimeSlot] = useState("");

  const items = project.prepItems.filter((i) => i.category === category);
  const doneCount = items.filter((i) => i.isDone).length;
  const pct = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

  const activeMeta = CATEGORIES.find((c) => c.id === category)!;

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || !title.trim()) return;
    const next: PrepItem = {
      id: generateId("prp"),
      category,
      title: title.trim(),
      detail: detail.trim(),
      timeSlot: category === "schedule" ? timeSlot.trim() : "",
      isDone: false,
    };
    onChange({
      ...project,
      prepItems: [...project.prepItems, next],
    });
    setTitle("");
    setDetail("");
    setTimeSlot("");
  };

  const toggleItem = (id: string) => {
    if (readOnly) return;
    onChange({
      ...project,
      prepItems: project.prepItems.map((i) =>
        i.id === id ? { ...i, isDone: !i.isDone } : i
      ),
    });
  };

  const deleteItem = (id: string) => {
    if (readOnly) return;
    onChange({
      ...project,
      prepItems: project.prepItems.filter((i) => i.id !== id),
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Category Segmented Pills */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-full bg-[var(--bg-subtle)] p-1">
          {CATEGORIES.map((cat) => {
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`relative flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                  active
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="prep-cat-pill"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-[var(--bg-surface)] shadow-sm"
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {cat.icon}
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        <span className="text-[13px] text-[var(--text-secondary)]">
          <strong className="font-semibold text-[var(--text-primary)]">
            {doneCount}/{items.length}
          </strong>{" "}
          ready
        </span>
      </div>

      {/* Dominant Prep Card */}
      <section className="surface-card rounded-[28px] p-6 sm:p-8">
        {/* Progress Hairline */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-[12px] text-[var(--text-secondary)]">
            <span className="font-medium uppercase tracking-[0.12em]">
              {activeMeta.label} Checklist
            </span>
            <span>{pct}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
            <motion.div
              className="h-full rounded-full bg-[var(--accent)]"
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>
        </div>

        {/* Quick Add Form */}
        {!readOnly && (
          <form onSubmit={addItem} className="mb-6 flex flex-col gap-2.5 sm:flex-row">
            {category === "schedule" && (
              <input
                type="text"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                placeholder="07:00"
                className="w-full rounded-full bg-[var(--bg-subtle)] px-4 py-2.5 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)] sm:w-24"
              />
            )}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={activeMeta.placeholder}
              className="flex-1 rounded-full bg-[var(--bg-subtle)] px-4 py-2.5 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)]"
            />
            <input
              type="text"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Note (optional)"
              className="w-full rounded-full bg-[var(--bg-subtle)] px-4 py-2.5 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)] sm:w-44"
            />
            <button
              type="submit"
              className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[var(--anchor-bg)] px-5 text-[13px] font-medium text-[var(--anchor-text)] transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </form>
        )}

        {/* List */}
        {items.length === 0 ? (
          <div className="rounded-[20px] bg-[var(--bg-subtle)] px-5 py-10 text-center text-[13px] text-[var(--text-secondary)]">
            Nothing added under {activeMeta.label.toLowerCase()} yet.
          </div>
        ) : (
          <div className="divide-y hairline-divider">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className="group flex cursor-pointer items-center justify-between gap-4 py-4 first:pt-1 last:pb-1"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      item.isDone
                        ? "border-transparent bg-[var(--accent)] text-white"
                        : "border-[var(--border-hairline)] bg-[var(--bg-subtle)]"
                    }`}
                  >
                    {item.isDone && <Check className="h-3.5 w-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {item.timeSlot && (
                        <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
                          {item.timeSlot}
                        </span>
                      )}
                      <p
                        className={`truncate text-[15px] font-medium ${
                          item.isDone ? "line-through opacity-50" : ""
                        }`}
                      >
                        {item.title}
                      </p>
                    </div>
                    {item.detail && (
                      <p className="mt-0.5 truncate text-[13px] text-[var(--text-secondary)]">
                        {item.detail}
                      </p>
                    )}
                  </div>
                </div>

                {!readOnly && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItem(item.id);
                    }}
                    aria-label="Delete item"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] opacity-0 transition-opacity hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
