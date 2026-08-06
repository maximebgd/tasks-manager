"use client";

import { useTasks } from "@/lib/tasks-context";
import { useTags } from "@/lib/tags-context";
import { useConfirm } from "@/lib/confirm-context";
import { PriorityBadge, Tag } from "./badges";

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

export function Trash() {
  const { trashedTasks, restoreTask, purgeTask } = useTasks();
  const { getTag } = useTags();
  const confirm = useConfirm();

  async function emptyTrash() {
    const ok = await confirm({
      title: "Vider la corbeille",
      message: `${trashedTasks.length} tâche${
        trashedTasks.length > 1 ? "s" : ""
      } ${
        trashedTasks.length > 1 ? "seront supprimées" : "sera supprimée"
      } définitivement. Cette action est irréversible.`,
      confirmLabel: "Vider la corbeille",
      danger: true,
    });
    if (!ok) return;
    trashedTasks.forEach((t) => purgeTask(t.id));
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-content">
            Corbeille
          </h1>
          <p className="mt-1 text-sm text-muted">
            {trashedTasks.length === 0
              ? "Aucune tâche supprimée"
              : `${trashedTasks.length} tâche${
                  trashedTasks.length > 1 ? "s" : ""
                } supprimée${trashedTasks.length > 1 ? "s" : ""}`}
          </p>
        </div>
        {trashedTasks.length > 0 && (
          <button
            onClick={emptyTrash}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-muted shadow-card transition duration-200 ease-smooth hover:bg-tag-red hover:text-tag-red-text active:scale-95"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            </svg>
            Vider la corbeille
          </button>
        )}
      </header>

      {trashedTasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-strong px-6 py-16 text-center">
          <svg className="mx-auto text-faint" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          </svg>
          <p className="mt-3 text-sm text-muted">
            La corbeille est vide. Les tâches supprimées apparaîtront ici.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {trashedTasks.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 shadow-card transition duration-200 ease-smooth hover:shadow-lift"
            >
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium text-content">
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
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => restoreTask(t.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-medium text-muted transition duration-200 ease-smooth hover:bg-surface-hover hover:text-content active:scale-95"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7v6h6" />
                    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                  </svg>
                  Restaurer
                </button>
                <button
                  onClick={() => purgeTask(t.id)}
                  aria-label="Supprimer définitivement"
                  title="Supprimer définitivement"
                  className="inline-flex items-center rounded-full p-1.5 text-faint transition duration-200 ease-smooth hover:bg-tag-red hover:text-tag-red-text active:scale-90"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
