"use client";

import { useEffect } from "react";
import { useTasks } from "@/lib/tasks-context";
import { useTags } from "@/lib/tags-context";
import { statusLabel } from "@/lib/types";
import { PriorityBadge, Tag } from "./badges";
import { Markdown } from "./markdown";

// Échéance lisible (« 6 août 2026 ») à partir d'une chaîne ISO "YYYY-MM-DD".
function formatDueDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Aperçu en lecture seule d'une tâche à la corbeille : on affiche son contenu
 * sans permettre l'édition (une tâche supprimée n'est pas modifiable). Restaurer
 * ou supprimer définitivement reste accessible depuis l'en-tête.
 */
export function TrashPeek({
  taskId,
  onClose,
}: {
  taskId: string;
  onClose: () => void;
}) {
  const { trashedTasks, restoreTask, purgeTask } = useTasks();
  const { getTag } = useTags();
  const task = trashedTasks.find((t) => t.id === taskId);

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
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/30 p-4 backdrop-blur-md animate-[overlay-in_200ms_ease-out] sm:p-8"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-6 w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-surface shadow-pop animate-[pop-in_260ms_var(--ease-spring)]"
      >
        <div className="flex items-center justify-between border-b border-line px-3 py-2">
          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-faint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            </svg>
            À la corbeille · lecture seule
          </span>
          <div className="flex items-center gap-0.5">
            {task && (
              <>
                <button
                  onClick={() => {
                    restoreTask(task.id);
                    onClose();
                  }}
                  aria-label="Restaurer la tâche"
                  title="Restaurer"
                  className="grid h-7 w-7 place-items-center rounded-md text-muted transition hover:bg-surface-hover hover:text-content"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7v6h6" />
                    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    purgeTask(task.id);
                    onClose();
                  }}
                  aria-label="Supprimer définitivement"
                  title="Supprimer définitivement"
                  className="grid h-7 w-7 place-items-center rounded-md text-faint transition hover:bg-tag-red hover:text-tag-red-text"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  </svg>
                </button>
              </>
            )}
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
          {!task ? (
            <p className="py-10 text-center text-sm text-muted">
              Cette tâche est introuvable.
            </p>
          ) : (
            <div>
              <h2 className="text-xl font-bold tracking-tight text-content">
                {task.title || "Sans titre"}
              </h2>

              <div className="mt-4 flex flex-col gap-2">
                <ReadonlyRow
                  label="Statut"
                  icon={
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M8 12h8" strokeLinecap="round" />
                    </svg>
                  }
                >
                  <span className="text-sm text-content">
                    {statusLabel(task.status)}
                  </span>
                </ReadonlyRow>

                <ReadonlyRow
                  label="Priorité"
                  icon={
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                      <path d="M4 22v-7" />
                    </svg>
                  }
                >
                  <PriorityBadge priority={task.priority} />
                </ReadonlyRow>

                <ReadonlyRow
                  label="Échéance"
                  icon={
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                  }
                >
                  <span className="text-sm text-content">
                    {task.dueDate ? formatDueDate(task.dueDate) : (
                      <span className="text-faint">Aucune</span>
                    )}
                  </span>
                </ReadonlyRow>

                <ReadonlyRow
                  label="Tags"
                  icon={
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.6 13.4 12 22l-9-9V3h10z" />
                      <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" stroke="none" />
                    </svg>
                  }
                >
                  {task.tagIds.length === 0 ? (
                    <span className="text-sm text-faint">Aucun</span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {task.tagIds.map((id) => {
                        const tag = getTag(id);
                        return tag ? (
                          <Tag key={id} label={tag.name} color={tag.color} />
                        ) : null;
                      })}
                    </div>
                  )}
                </ReadonlyRow>
              </div>

              <div className="mt-5 border-t border-line pt-4">
                <label className="mb-1 block text-xs font-medium text-muted">
                  Description
                </label>
                {task.description?.trim() ? (
                  <p className="text-sm leading-relaxed text-content">
                    {task.description}
                  </p>
                ) : (
                  <p className="text-sm text-faint">Aucune description.</p>
                )}
              </div>

              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-muted">
                  Notes
                </label>
                {task.notes?.trim() ? (
                  <Markdown content={task.notes} />
                ) : (
                  <p className="text-sm text-faint">Aucune note.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReadonlyRow({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex w-28 shrink-0 items-center gap-1.5 text-sm text-muted">
        <span className="text-faint">{icon}</span>
        {label}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
