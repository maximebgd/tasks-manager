"use client";

import { useEffect } from "react";
import { useTasks } from "@/lib/tasks-context";
import { TaskEditor } from "./task-editor";

/** Petit panneau d'aperçu ouvert au simple clic sur une carte du tableau. */
export function TaskPeek({
  taskId,
  onClose,
  onOpenPage,
}: {
  taskId: string;
  onClose: () => void;
  onOpenPage: () => void;
}) {
  const { deleteTask } = useTasks();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/30 p-4 backdrop-blur-[1px] sm:p-8"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-6 w-full max-w-2xl overflow-hidden rounded-xl border border-line bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-line px-3 py-2">
          <button
            onClick={onOpenPage}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted transition hover:bg-surface-hover hover:text-content"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6M14 10l7-7M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
            </svg>
            Ouvrir en pleine page
          </button>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => {
                deleteTask(taskId);
                onClose();
              }}
              aria-label="Supprimer la tâche"
              className="grid h-7 w-7 place-items-center rounded-md text-faint transition hover:bg-tag-red hover:text-tag-red-text"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              </svg>
            </button>
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="grid h-7 w-7 place-items-center rounded-md text-muted transition hover:bg-surface-hover hover:text-content"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-6">
          <TaskEditor key={taskId} taskId={taskId} variant="peek" />
        </div>
      </div>
    </div>
  );
}
