"use client";

import { useRef } from "react";
import type { Status, Task } from "@/lib/types";
import { STATUSES } from "@/lib/types";
import { PriorityBadge, Tag } from "./badges";

const TODAY = "2026-07-31";

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export function TaskCard({
  task,
  onStatusChange,
  onDelete,
  onPeek,
  onOpenPage,
  onDragStart,
  onDragEnd,
  isDragging,
  onCardDragOver,
  onCardDrop,
  dropPosition,
}: {
  task: Task;
  onStatusChange: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  onPeek: (id: string) => void;
  onOpenPage: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  onCardDragOver: (position: "before" | "after") => void;
  onCardDrop: (targetId: string, position: "before" | "after") => void;
  dropPosition: "before" | "after" | null;
}) {
  const isDone = task.status === "done";
  const isOverdue = !isDone && task.dueDate !== null && task.dueDate < TODAY;

  // Discrimination simple/double clic : un simple clic ouvre l'aperçu après un
  // court délai, annulé si un double clic survient (qui ouvre la page détail).
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleClick() {
    if (clickTimer.current) return;
    clickTimer.current = setTimeout(() => {
      clickTimer.current = null;
      onPeek(task.id);
    }, 220);
  }

  function handleDoubleClick() {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
    onOpenPage(task.id);
  }

  // Position d'insertion selon que le curseur est au-dessus ou en dessous du milieu.
  function positionFrom(e: React.DragEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    return e.clientY < rect.top + rect.height / 2 ? "before" : "after";
  }

  return (
    <div
      onDragOver={(e) => {
        if (isDragging) return;
        e.preventDefault();
        e.stopPropagation(); // évite que la colonne efface l'indicateur
        e.dataTransfer.dropEffect = "move";
        onCardDragOver(positionFrom(e));
      }}
      onDrop={(e) => {
        if (isDragging) return;
        e.preventDefault();
        e.stopPropagation();
        onCardDrop(task.id, positionFrom(e));
      }}
      className={`relative before:absolute before:inset-x-0 before:h-0.5 before:rounded-full before:bg-accent before:transition-opacity before:content-[''] ${
        dropPosition === "before"
          ? "before:-top-1.5 before:opacity-100"
          : dropPosition === "after"
            ? "before:-bottom-1.5 before:top-auto before:opacity-100"
            : "before:opacity-0"
      }`}
    >
    <article
      draggable
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      title="Clic : aperçu · Double-clic : ouvrir la fiche"
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", task.id);
        onDragStart(task.id);
      }}
      onDragEnd={onDragEnd}
      className={`group cursor-pointer rounded-lg border border-line bg-surface p-3.5 transition hover:border-line-strong ${
        isDragging ? "opacity-40 ring-2 ring-accent" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className={`text-sm font-medium leading-snug ${
            isDone ? "text-faint line-through" : "text-content"
          }`}
        >
          {task.title}
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          aria-label="Supprimer la tâche"
          className="shrink-0 rounded p-1 text-faint opacity-0 transition hover:bg-tag-red hover:text-tag-red-text group-hover:opacity-100"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          </svg>
        </button>
      </div>

      {task.description && (
        <p className="mt-1.5 text-xs leading-relaxed text-muted">
          {task.description}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={task.priority} />
        {task.tags.map((t) => (
          <Tag key={t} label={t} />
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
        {task.dueDate ? (
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium ${
              isOverdue ? "text-tag-red-text" : "text-faint"
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            {formatDate(task.dueDate)}
            {isOverdue && " · en retard"}
          </span>
        ) : (
          <span className="text-xs text-faint">Pas d&apos;échéance</span>
        )}

        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value as Status)}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          aria-label="Changer le statut"
          className="cursor-pointer rounded border border-line bg-surface-muted px-1.5 py-1 text-xs font-medium text-muted outline-none transition hover:border-line-strong focus:border-accent"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </article>
    </div>
  );
}
