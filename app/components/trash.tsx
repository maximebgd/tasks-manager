"use client";

import { useState } from "react";
import { useTasks } from "@/lib/tasks-context";
import { useTags } from "@/lib/tags-context";
import { useDailyTodos } from "@/lib/daily-todos-context";
import { useConfirm } from "@/lib/confirm-context";
import { PriorityBadge, Tag } from "./badges";
import { TrashPeek } from "./trash-peek";

// Date + heure lisibles de mise à la corbeille (« 4 août à 21:07 »).
function formatDeletedAt(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  })} à ${d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

// Jour d'une todo journalière (« 6 août »).
function formatDay(dateISO: string) {
  return new Date(dateISO + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });
}

// Icônes réutilisées par les actions restaurer / supprimer.
function RestoreIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </svg>
  );
}

// Boutons restaurer / supprimer définitivement, communs à tous les éléments.
function ItemActions({
  onRestore,
  onPurge,
}: {
  onRestore: () => void;
  onPurge: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        onClick={onRestore}
        className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-medium text-muted transition duration-200 ease-smooth hover:bg-surface-hover hover:text-content active:scale-95"
      >
        <RestoreIcon />
        Restaurer
      </button>
      <button
        onClick={onPurge}
        aria-label="Supprimer définitivement"
        title="Supprimer définitivement"
        className="inline-flex items-center rounded-full p-1.5 text-faint transition duration-200 ease-smooth hover:bg-tag-red hover:text-tag-red-text active:scale-90"
      >
        <TrashIcon />
      </button>
    </div>
  );
}

export function Trash() {
  const { trashedTasks, restoreTask, purgeTask } = useTasks();
  const {
    trashedDailyTodos,
    trashedSubtasks,
    restoreTodo,
    purgeTodo,
    restoreSubtask,
    purgeSubtask,
  } = useDailyTodos();
  const { getTag } = useTags();
  const confirm = useConfirm();
  // Id de la tâche dont on affiche l'aperçu (lecture seule), ou null.
  const [peekId, setPeekId] = useState<string | null>(null);

  const total =
    trashedTasks.length + trashedDailyTodos.length + trashedSubtasks.length;

  async function emptyTrash() {
    const ok = await confirm({
      title: "Vider la corbeille",
      message: `${total} élément${total > 1 ? "s" : ""} ${
        total > 1 ? "seront supprimés" : "sera supprimé"
      } définitivement. Cette action est irréversible.`,
      confirmLabel: "Vider la corbeille",
      danger: true,
    });
    if (!ok) return;
    trashedTasks.forEach((t) => purgeTask(t.id));
    trashedDailyTodos.forEach((t) => purgeTodo(t.id));
    trashedSubtasks.forEach((s) => purgeSubtask(s.subtask.id));
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-content">
            Corbeille
          </h1>
          <p className="mt-1 text-sm text-muted">
            {total === 0
              ? "Aucun élément supprimé"
              : `${total} élément${total > 1 ? "s" : ""} supprimé${
                  total > 1 ? "s" : ""
                }`}
          </p>
        </div>
        {total > 0 && (
          <button
            onClick={emptyTrash}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-muted shadow-card transition duration-200 ease-smooth hover:bg-tag-red hover:text-tag-red-text active:scale-95"
          >
            <TrashIcon />
            Vider la corbeille
          </button>
        )}
      </header>

      {total === 0 ? (
        <div className="rounded-xl border border-dashed border-line-strong px-6 py-16 text-center">
          <svg className="mx-auto text-faint" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          </svg>
          <p className="mt-3 text-sm text-muted">
            La corbeille est vide. Les éléments supprimés apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Tâches du tableau */}
          {trashedTasks.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
                Tâches
              </h2>
              <ul className="flex flex-col gap-2">
                {trashedTasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 shadow-card transition duration-200 ease-smooth hover:shadow-lift"
                  >
                    <button
                      type="button"
                      onClick={() => setPeekId(t.id)}
                      className="min-w-0 flex-1 cursor-pointer text-left"
                    >
                      <h3 className="truncate text-sm font-medium text-content transition hover:text-accent-text">
                        {t.title}
                      </h3>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <PriorityBadge priority={t.priority} />
                        {t.tagIds.map((id) => {
                          const tag = getTag(id);
                          return tag ? (
                            <Tag key={id} label={tag.name} color={tag.color} />
                          ) : null;
                        })}
                        {t.deletedAt && (
                          <span className="text-xs text-faint">
                            Supprimée le {formatDeletedAt(t.deletedAt)}
                          </span>
                        )}
                      </div>
                    </button>
                    <ItemActions
                      onRestore={() => restoreTask(t.id)}
                      onPurge={() => purgeTask(t.id)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Todos journalières + sous-tâches supprimées seules */}
          {(trashedDailyTodos.length > 0 || trashedSubtasks.length > 0) && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
                Tâches journalières
              </h2>
              <ul className="flex flex-col gap-2">
                {trashedDailyTodos.map((t) => {
                  const subCount = t.subtasks.length;
                  return (
                    <li
                      key={t.id}
                      className="flex flex-wrap items-start gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 shadow-card transition duration-200 ease-smooth hover:shadow-lift"
                    >
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-muted text-muted">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
                        </svg>
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium text-content">
                          {t.title}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint">
                          <span>{formatDay(t.date)}</span>
                          {t.deletedAt && (
                            <span>· Supprimée le {formatDeletedAt(t.deletedAt)}</span>
                          )}
                        </div>
                        {subCount > 0 && (
                          <ul className="mt-2 flex flex-col gap-1 border-l border-line pl-3">
                            {t.subtasks.map((s) => (
                              <li
                                key={s.id}
                                className="flex items-center gap-1.5 text-xs"
                              >
                                <span
                                  aria-hidden="true"
                                  className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border ${
                                    s.done
                                      ? "border-accent bg-accent text-white"
                                      : "border-line-strong"
                                  }`}
                                >
                                  {s.done && (
                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M20 6 9 17l-5-5" />
                                    </svg>
                                  )}
                                </span>
                                <span
                                  className={`truncate ${
                                    s.done
                                      ? "text-faint line-through"
                                      : "text-muted"
                                  }`}
                                >
                                  {s.title}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <ItemActions
                        onRestore={() => restoreTodo(t.id)}
                        onPurge={() => purgeTodo(t.id)}
                      />
                    </li>
                  );
                })}

                {trashedSubtasks.map(({ parentTitle, subtask }) => (
                  <li
                    key={subtask.id}
                    className="flex flex-wrap items-start gap-3 rounded-xl border border-line border-l-2 border-l-accent bg-surface px-3.5 py-3 shadow-card transition duration-200 ease-smooth hover:shadow-lift"
                  >
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-text">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 3v6a3 3 0 0 0 3 3h9" />
                        <path d="M15 9l3 3-3 3" />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="shrink-0 rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-text">
                          Sous-tâche
                        </span>
                        <h3 className="min-w-0 truncate text-sm font-medium text-content">
                          {subtask.title}
                        </h3>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint">
                        <span>de « {parentTitle} »</span>
                        {subtask.deletedAt && (
                          <span>· Supprimée le {formatDeletedAt(subtask.deletedAt)}</span>
                        )}
                      </div>
                    </div>
                    <ItemActions
                      onRestore={() => restoreSubtask(subtask.id)}
                      onPurge={() => purgeSubtask(subtask.id)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {peekId && <TrashPeek taskId={peekId} onClose={() => setPeekId(null)} />}
    </div>
  );
}
