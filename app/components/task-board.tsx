"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Priority, Status, Task } from "@/lib/types";
import { PRIORITIES, STATUSES } from "@/lib/types";
import { useTasks } from "@/lib/tasks-context";
import { useTags } from "@/lib/tags-context";
import { tagColorClass } from "./badges";
import { TaskCard } from "./task-card";
import { AddTaskForm } from "./add-task-form";
import { TaskPeek } from "./task-peek";

type PriorityFilter = Priority | "all";

const columnAccent: Record<Status, string> = {
  todo: "bg-faint",
  in_progress: "bg-accent",
  done: "bg-tag-green-text",
};

// Tri par échéance croissante : les plus proches en haut, sans échéance en bas.
function byDueDateAsc(a: Task, b: Task) {
  if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
  if (a.dueDate) return -1;
  if (b.dueDate) return 1;
  return 0;
}

export function TaskBoard() {
  const router = useRouter();
  const { tasks, addTask, updateTask, deleteTask, reorderTasks } = useTasks();
  const { tags: allTagDefs } = useTags();
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [sortByDue, setSortByDue] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [peekId, setPeekId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<Status | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{
    id: string;
    position: "before" | "after";
  } | null>(null);

  function changeStatus(id: string, status: Status) {
    updateTask(id, { status });
  }

  function resetDrag() {
    setDraggingId(null);
    setDragOverStatus(null);
    setDropIndicator(null);
  }

  /** Dépose la tâche glissée avant/après une autre tâche (réordonne + change de statut). */
  function dropOnCard(targetId: string, position: "before" | "after") {
    if (!draggingId || draggingId === targetId) return resetDrag();
    const dragged = tasks.find((t) => t.id === draggingId);
    const target = tasks.find((t) => t.id === targetId);
    if (!dragged || !target) return resetDrag();

    const updated = { ...dragged, status: target.status };
    const rest = tasks.filter((t) => t.id !== draggingId);
    const targetIndex = rest.findIndex((t) => t.id === targetId);
    const insertAt = position === "after" ? targetIndex + 1 : targetIndex;

    const next = [...rest];
    next.splice(insertAt, 0, updated);
    reorderTasks(next);
    resetDrag();
  }

  /** Dépose la tâche dans l'espace vide d'une colonne : l'ajoute à la fin de ce statut. */
  function dropOnColumn(status: Status) {
    if (!draggingId) return resetDrag();
    const dragged = tasks.find((t) => t.id === draggingId);
    if (!dragged || dragged.status === status) return resetDrag();

    const updated = { ...dragged, status };
    const rest = tasks.filter((t) => t.id !== draggingId);
    let lastOfStatus = -1;
    rest.forEach((t, i) => {
      if (t.status === status) lastOfStatus = i;
    });

    const next = [...rest];
    next.splice(lastOfStatus + 1, 0, updated);
    reorderTasks(next);
    resetDrag();
  }

  // Noms (minuscule) des étiquettes par id, pour la recherche texte.
  const tagName = useMemo(
    () => new Map(allTagDefs.map((t) => [t.id, t.name.toLowerCase()])),
    [allTagDefs],
  );

  // Étiquettes réellement utilisées par des tâches, triées (ordre FR).
  const usedTags = useMemo(() => {
    const used = new Set<string>();
    tasks.forEach((t) => t.tagIds.forEach((id) => used.add(id)));
    return allTagDefs
      .filter((t) => used.has(t.id))
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [tasks, allTagDefs]);

  function toggleTag(id: string) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      const matchesQuery =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.tagIds.some((id) => tagName.get(id)?.includes(q));
      const matchesPriority =
        priorityFilter === "all" || t.priority === priorityFilter;
      // Filtre par tag : la tâche doit porter au moins un des tags sélectionnés.
      const matchesTags =
        selectedTagIds.length === 0 ||
        selectedTagIds.some((id) => t.tagIds.includes(id));
      return matchesQuery && matchesPriority && matchesTags;
    });
  }, [tasks, query, priorityFilter, selectedTagIds, tagName]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    return { total, done, inProgress, todo: total - done - inProgress };
  }, [tasks]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-content">
            Gestionnaire de tâches
          </h1>
          <p className="mt-1 text-sm text-muted">
            {stats.total} tâches · {stats.done} terminées · {stats.inProgress} en
            cours · {stats.todo} à faire
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-card transition duration-200 ease-spring hover:shadow-lift hover:brightness-105 active:scale-95"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nouvelle tâche
        </button>
      </header>

      {showForm && (
        <AddTaskForm onAdd={addTask} onClose={() => setShowForm(false)} />
      )}

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            className="w-full rounded-full border border-line bg-surface py-2 pl-9 pr-3 text-sm text-content shadow-card outline-none transition duration-200 ease-smooth placeholder:text-faint hover:border-line-strong focus:border-accent focus:ring-2 focus:ring-accent-soft"
          />
        </div>

        <div className="flex items-center gap-1 rounded-full border border-line bg-surface p-1 shadow-card">
          <FilterChip
            active={priorityFilter === "all"}
            onClick={() => setPriorityFilter("all")}
          >
            Toutes
          </FilterChip>
          {PRIORITIES.map((p) => (
            <FilterChip
              key={p.value}
              active={priorityFilter === p.value}
              onClick={() => setPriorityFilter(p.value)}
            >
              {p.label}
            </FilterChip>
          ))}
        </div>

        <div className="rounded-full border border-line bg-surface p-1 shadow-card">
          <button
            onClick={() => setSortByDue((v) => !v)}
            aria-pressed={sortByDue}
            title="Trier par échéance la plus proche en haut"
            className={`inline-flex items-center justify-center rounded-full p-1.5 transition duration-200 ease-smooth active:scale-95 ${
              sortByDue
                ? "bg-accent text-white"
                : "text-muted hover:bg-surface-hover hover:text-content"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 16 4 4 4-4" />
              <path d="M7 20V4" />
              <path d="M11 4h4M11 8h7M11 12h10" />
            </svg>
          </button>
        </div>
      </div>

      {usedTags.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-faint">Tags</span>
          {usedTags.map((tag) => {
            const active = selectedTagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                aria-pressed={active}
                className={`rounded px-2 py-0.5 text-xs font-medium transition ${
                  active
                    ? "bg-accent text-white"
                    : `${tagColorClass[tag.color]} hover:opacity-80`
                }`}
              >
                {tag.name}
              </button>
            );
          })}
          {selectedTagIds.length > 0 && (
            <button
              onClick={() => setSelectedTagIds([])}
              className="ml-1 text-xs font-medium text-muted transition hover:text-content"
            >
              Effacer
            </button>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {STATUSES.map((col) => {
          const items = filtered.filter((t) => t.status === col.value);
          if (sortByDue) items.sort(byDueDateAsc);
          return (
            <section
              key={col.value}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragOverStatus !== col.value) setDragOverStatus(col.value);
                // Survol de l'espace vide de la colonne : pas d'insertion ciblée.
                setDropIndicator(null);
              }}
              onDragLeave={(e) => {
                // Ignore les transitions vers un enfant de la colonne.
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverStatus((s) => (s === col.value ? null : s));
                }
              }}
              onDrop={() => dropOnColumn(col.value)}
              className={`flex flex-col rounded-2xl p-3 transition-colors duration-200 ease-smooth ${
                dragOverStatus === col.value
                  ? "bg-accent-soft ring-2 ring-accent"
                  : "bg-surface-muted"
              }`}
            >
              <div className="mb-3 flex items-center gap-2 px-1">
                <span className={`h-2 w-2 rounded-full ${columnAccent[col.value]}`} />
                <h2 className="text-sm font-medium text-content">
                  {col.label}
                </h2>
                <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted">
                  {items.length}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {items.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={changeStatus}
                    onDelete={deleteTask}
                    onPeek={setPeekId}
                    onOpenPage={(id) => router.push(`/task/${id}`)}
                    onDragStart={setDraggingId}
                    onDragEnd={resetDrag}
                    isDragging={draggingId === task.id}
                    onCardDragOver={(position) =>
                      setDropIndicator({ id: task.id, position })
                    }
                    onCardDrop={dropOnCard}
                    dropPosition={
                      dropIndicator?.id === task.id
                        ? dropIndicator.position
                        : null
                    }
                  />
                ))}
                {items.length === 0 && (
                  <p className="rounded-lg border border-dashed border-line-strong px-3 py-6 text-center text-xs text-faint">
                    Aucune tâche
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {peekId && (
        <TaskPeek
          taskId={peekId}
          onClose={() => setPeekId(null)}
          onOpenPage={() => {
            router.push(`/task/${peekId}`);
            setPeekId(null);
          }}
        />
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-xs font-medium transition duration-200 ease-smooth ${
        active
          ? "bg-accent text-white shadow-card"
          : "text-muted hover:bg-surface-hover hover:text-content"
      }`}
    >
      {children}
    </button>
  );
}
