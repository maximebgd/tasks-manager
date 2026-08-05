"use client";

import Link from "next/link";
import type { Priority, Status } from "@/lib/types";
import { PRIORITIES, STATUSES } from "@/lib/types";
import { useTasks } from "@/lib/tasks-context";
import { TagPicker } from "./tag-picker";

/**
 * Champs éditables d'une tâche, partagés par l'aperçu (`peek`) et la page
 * détail (`page`). Les modifications sont propagées au store partagé, donc
 * visibles instantanément sur le tableau.
 */
export function TaskEditor({
  taskId,
  variant,
}: {
  taskId: string;
  variant: "peek" | "page";
}) {
  const { tasks, updateTask } = useTasks();
  const task = tasks.find((t) => t.id === taskId);

  if (!task) {
    return (
      <div className="py-10 text-center text-sm text-muted">
        Cette tâche est introuvable.
        {variant === "page" && (
          <div className="mt-3">
            <Link href="/" className="text-accent-text hover:underline">
              Retour au tableau
            </Link>
          </div>
        )}
      </div>
    );
  }

  const field =
    "w-full max-w-xs rounded border border-transparent bg-transparent px-2 py-1 text-sm text-content outline-none transition hover:bg-surface-hover focus:border-accent";

  return (
    <div>
      <input
        value={task.title}
        onChange={(e) => updateTask(task.id, { title: e.target.value })}
        placeholder="Sans titre"
        className={`w-full bg-transparent font-bold tracking-tight text-content outline-none placeholder:text-faint ${
          variant === "page" ? "text-3xl" : "text-xl"
        }`}
      />

      <div className="mt-4 flex flex-col gap-0.5">
        <PropertyRow
          label="Statut"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M8 12h8" strokeLinecap="round" />
            </svg>
          }
        >
          <select
            value={task.status}
            onChange={(e) =>
              updateTask(task.id, { status: e.target.value as Status })
            }
            className={`${field} cursor-pointer`}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </PropertyRow>

        <PropertyRow
          label="Priorité"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <path d="M4 22v-7" />
            </svg>
          }
        >
          <select
            value={task.priority}
            onChange={(e) =>
              updateTask(task.id, { priority: e.target.value as Priority })
            }
            className={`${field} cursor-pointer`}
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </PropertyRow>

        <PropertyRow
          label="Échéance"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          }
        >
          <input
            type="date"
            value={task.dueDate ?? ""}
            onChange={(e) =>
              updateTask(task.id, { dueDate: e.target.value || null })
            }
            className={`${field} cursor-pointer`}
          />
        </PropertyRow>

        <PropertyRow
          label="Tags"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.6 13.4 12 22l-9-9V3h10z" />
              <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" stroke="none" />
            </svg>
          }
        >
          <TagPicker
            selectedIds={task.tagIds}
            onChange={(ids) => updateTask(task.id, { tagIds: ids })}
          />
        </PropertyRow>
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <label className="mb-1 block text-xs font-medium text-muted">
          Description
        </label>
        <textarea
          value={task.description ?? ""}
          onChange={(e) =>
            updateTask(task.id, { description: e.target.value })
          }
          rows={2}
          placeholder="Résumé court…"
          className="w-full resize-none bg-transparent text-sm leading-relaxed text-content outline-none placeholder:text-faint"
        />
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-muted">Notes</label>
        <textarea
          value={task.notes ?? ""}
          onChange={(e) => updateTask(task.id, { notes: e.target.value })}
          placeholder="Écrire quelque chose…"
          className={`w-full resize-none bg-transparent text-sm leading-relaxed text-content outline-none placeholder:text-faint ${
            variant === "page" ? "min-h-[16rem]" : "min-h-[8rem]"
          }`}
        />
      </div>
    </div>
  );
}

function PropertyRow({
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
