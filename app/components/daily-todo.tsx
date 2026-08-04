"use client";

import { useMemo, useState } from "react";
import type { DailyTodo } from "@/lib/types";
import {
  createDailyTodoAction,
  setDailyTodoDoneAction,
  deleteDailyTodoAction,
  createSubtaskAction,
  setSubtaskDoneAction,
  deleteSubtaskAction,
  reorderDailyTodosAction,
  reorderSubtasksAction,
} from "@/app/actions/daily";

const logError = (e: unknown) => console.error("Échec de persistance :", e);

const TODAY_ISO = "2026-07-31";

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function shiftDay(dateISO: string, delta: number) {
  const d = new Date(dateISO + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return toISO(d);
}

function formatLong(dateISO: string) {
  return new Date(dateISO + "T00:00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function DailyTodoList({ initialTodos }: { initialTodos: DailyTodo[] }) {
  const [todos, setTodos] = useState<DailyTodo[]>(initialTodos);
  const [selectedDate, setSelectedDate] = useState(TODAY_ISO);
  const [draft, setDraft] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{
    id: string;
    position: "before" | "after";
  } | null>(null);
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null);
  const [subDraft, setSubDraft] = useState("");
  const [draggingSub, setDraggingSub] = useState<{
    parentId: string;
    subId: string;
  } | null>(null);
  const [subDropIndicator, setSubDropIndicator] = useState<{
    subId: string;
    position: "before" | "after";
  } | null>(null);

  const dayTodos = useMemo(
    () => todos.filter((t) => t.date === selectedDate),
    [todos, selectedDate],
  );

  const doneCount = dayTodos.filter((t) => t.done).length;
  const percent =
    dayTodos.length === 0 ? 0 : Math.round((doneCount / dayTodos.length) * 100);

  function addTodo(e: React.FormEvent) {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    const id = crypto.randomUUID();
    setTodos((prev) => [
      ...prev,
      { id, date: selectedDate, title, done: false, subtasks: [] },
    ]);
    setDraft("");
    createDailyTodoAction({ id, date: selectedDate, title }).catch(logError);
  }

  function addSubtask(parentId: string) {
    const title = subDraft.trim();
    if (!title) return;
    const id = crypto.randomUUID();
    setTodos((prev) =>
      prev.map((t) =>
        t.id === parentId
          ? { ...t, subtasks: [...t.subtasks, { id, title, done: false }] }
          : t,
      ),
    );
    setSubDraft("");
    createSubtaskAction({ id, dailyTodoId: parentId, title }).catch(logError);
  }

  function toggleSubtask(parentId: string, subId: string) {
    const sub = todos
      .find((t) => t.id === parentId)
      ?.subtasks.find((s) => s.id === subId);
    if (!sub) return;
    const done = !sub.done;
    setTodos((prev) =>
      prev.map((t) =>
        t.id === parentId
          ? {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === subId ? { ...s, done } : s,
              ),
            }
          : t,
      ),
    );
    setSubtaskDoneAction(subId, done).catch(logError);
  }

  function removeSubtask(parentId: string, subId: string) {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === parentId
          ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subId) }
          : t,
      ),
    );
    deleteSubtaskAction(subId).catch(logError);
  }

  function resetSubDrag() {
    setDraggingSub(null);
    setSubDropIndicator(null);
  }

  /** Réordonne une sous-tâche avant/après une autre, au sein de la même tâche. */
  function reorderSubtask(
    parentId: string,
    targetSubId: string,
    position: "before" | "after",
  ) {
    if (!draggingSub) return resetSubDrag();
    const parent = todos.find((t) => t.id === parentId);
    const dragId = draggingSub.subId;
    if (!parent || dragId === targetSubId) return resetSubDrag();
    const dragged = parent.subtasks.find((s) => s.id === dragId);
    if (!dragged) return resetSubDrag();

    const rest = parent.subtasks.filter((s) => s.id !== dragId);
    const targetIndex = rest.findIndex((s) => s.id === targetSubId);
    const insertAt = position === "after" ? targetIndex + 1 : targetIndex;
    const nextSubs = [...rest];
    nextSubs.splice(insertAt, 0, dragged);

    setTodos((prev) =>
      prev.map((t) => (t.id === parentId ? { ...t, subtasks: nextSubs } : t)),
    );
    reorderSubtasksAction(
      nextSubs.map((s, i) => ({ id: s.id, position: i })),
    ).catch(logError);
    resetSubDrag();
  }

  function toggle(id: string) {
    const current = todos.find((t) => t.id === id);
    if (!current) return;
    const done = !current.done;
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)));
    setDailyTodoDoneAction(id, done).catch(logError);
  }

  function remove(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    deleteDailyTodoAction(id).catch(logError);
  }

  // Position d'insertion selon que le curseur est au-dessus ou en dessous du milieu.
  function positionFrom(e: React.DragEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    return e.clientY < rect.top + rect.height / 2 ? "before" : "after";
  }

  function resetDrag() {
    setDraggingId(null);
    setDropIndicator(null);
  }

  /** Réordonne la tâche glissée avant/après une autre tâche du même jour. */
  function reorder(targetId: string, position: "before" | "after") {
    if (!draggingId || draggingId === targetId) return resetDrag();
    const dragged = todos.find((t) => t.id === draggingId);
    if (!dragged) return resetDrag();
    const rest = todos.filter((t) => t.id !== draggingId);
    const targetIndex = rest.findIndex((t) => t.id === targetId);
    const insertAt = position === "after" ? targetIndex + 1 : targetIndex;
    const next = [...rest];
    next.splice(insertAt, 0, dragged);

    setTodos(next);
    reorderDailyTodosAction(
      next.map((t, i) => ({ id: t.id, position: i })),
    ).catch(logError);
    resetDrag();
  }

  const isToday = selectedDate === TODAY_ISO;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-content">
          Todo journalière
        </h1>
        <p className="mt-1 text-sm text-muted">
          Vos tâches à faire, jour après jour
        </p>
      </header>

      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          onClick={() => setSelectedDate((d) => shiftDay(d, -1))}
          aria-label="Jour précédent"
          className="rounded-md border border-line p-2 text-muted transition hover:bg-surface-hover hover:text-content"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        <div className="text-center">
          <div className="text-sm font-medium capitalize text-content">
            {formatLong(selectedDate)}
          </div>
          {!isToday && (
            <button
              onClick={() => setSelectedDate(TODAY_ISO)}
              className="mt-0.5 text-xs font-medium text-accent-text hover:underline"
            >
              Revenir à aujourd&apos;hui
            </button>
          )}
        </div>

        <button
          onClick={() => setSelectedDate((d) => shiftDay(d, 1))}
          aria-label="Jour suivant"
          className="rounded-md border border-line p-2 text-muted transition hover:bg-surface-hover hover:text-content"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        {dayTodos.length > 0 && (
          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted">
              <span>
                {doneCount} / {dayTodos.length} terminées
              </span>
              <span>{percent}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-hover">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}

        <ul className="flex flex-col gap-1">
          {dayTodos.map((t) => (
            <li
              key={t.id}
              onDragOver={(e) => {
                if (!draggingId || draggingId === t.id) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDropIndicator({ id: t.id, position: positionFrom(e) });
              }}
              onDrop={(e) => {
                if (!draggingId) return;
                e.preventDefault();
                reorder(t.id, positionFrom(e));
              }}
              className={`group relative rounded-md before:absolute before:inset-x-2 before:h-0.5 before:rounded-full before:bg-accent before:transition-opacity before:content-[''] ${
                draggingId === t.id ? "opacity-40" : ""
              } ${
                dropIndicator?.id === t.id && dropIndicator.position === "before"
                  ? "before:-top-0.5 before:opacity-100"
                  : dropIndicator?.id === t.id &&
                      dropIndicator.position === "after"
                    ? "before:-bottom-0.5 before:top-auto before:opacity-100"
                    : "before:opacity-0"
              }`}
            >
              {/* Ligne principale : clic = cocher/décocher, poignée = glisser */}
              <div
                onClick={() => toggle(t.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle(t.id);
                  }
                }}
                role="checkbox"
                aria-checked={t.done}
                tabIndex={0}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 transition hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span
                  draggable
                  onClick={(e) => e.stopPropagation()}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", t.id);
                    setDraggingId(t.id);
                  }}
                  onDragEnd={resetDrag}
                  aria-label="Réordonner la tâche"
                  className="grid shrink-0 cursor-grab place-items-center text-faint opacity-0 transition group-hover:opacity-100 active:cursor-grabbing"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="9" cy="6" r="1.6" />
                    <circle cx="15" cy="6" r="1.6" />
                    <circle cx="9" cy="12" r="1.6" />
                    <circle cx="15" cy="12" r="1.6" />
                    <circle cx="9" cy="18" r="1.6" />
                    <circle cx="15" cy="18" r="1.6" />
                  </svg>
                </span>

                <span
                  aria-hidden="true"
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded border transition ${
                    t.done
                      ? "border-accent bg-accent text-white"
                      : "border-line-strong group-hover:border-accent"
                  }`}
                >
                  {t.done && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </span>

                <span
                  className={`flex-1 text-sm ${
                    t.done ? "text-faint line-through" : "text-content"
                  }`}
                >
                  {t.title}
                </span>

                {t.subtasks.length > 0 && (
                  <span className="shrink-0 text-xs font-medium text-faint">
                    {t.subtasks.filter((s) => s.done).length}/
                    {t.subtasks.length}
                  </span>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(t.id);
                  }}
                  aria-label="Supprimer"
                  className="shrink-0 rounded p-1 text-faint opacity-0 transition hover:bg-tag-red hover:text-tag-red-text group-hover:opacity-100"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Sous-tâches (puces cochables) */}
              {t.subtasks.length > 0 && (
                <ul className="ml-9 flex flex-col gap-0.5">
                  {t.subtasks.map((s) => (
                    <li
                      key={s.id}
                      onClick={() => toggleSubtask(t.id, s.id)}
                      onDragOver={(e) => {
                        if (!draggingSub || draggingSub.parentId !== t.id)
                          return;
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = "move";
                        setSubDropIndicator({
                          subId: s.id,
                          position: positionFrom(e),
                        });
                      }}
                      onDrop={(e) => {
                        if (!draggingSub || draggingSub.parentId !== t.id)
                          return;
                        e.preventDefault();
                        e.stopPropagation();
                        reorderSubtask(t.id, s.id, positionFrom(e));
                      }}
                      className={`group/sub relative flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 transition hover:bg-surface-hover before:absolute before:inset-x-2 before:h-0.5 before:rounded-full before:bg-accent before:transition-opacity before:content-[''] ${
                        draggingSub?.subId === s.id ? "opacity-40" : ""
                      } ${
                        subDropIndicator?.subId === s.id &&
                        subDropIndicator.position === "before"
                          ? "before:-top-0.5 before:opacity-100"
                          : subDropIndicator?.subId === s.id &&
                              subDropIndicator.position === "after"
                            ? "before:-bottom-0.5 before:top-auto before:opacity-100"
                            : "before:opacity-0"
                      }`}
                    >
                      <span
                        draggable
                        onClick={(e) => e.stopPropagation()}
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", s.id);
                          setDraggingSub({ parentId: t.id, subId: s.id });
                        }}
                        onDragEnd={resetSubDrag}
                        aria-label="Réordonner la sous-tâche"
                        className="grid shrink-0 cursor-grab place-items-center text-faint opacity-0 transition group-hover/sub:opacity-100 active:cursor-grabbing"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="9" cy="6" r="1.6" />
                          <circle cx="15" cy="6" r="1.6" />
                          <circle cx="9" cy="12" r="1.6" />
                          <circle cx="15" cy="12" r="1.6" />
                          <circle cx="9" cy="18" r="1.6" />
                          <circle cx="15" cy="18" r="1.6" />
                        </svg>
                      </span>
                      <span
                        aria-hidden="true"
                        className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border transition ${
                          s.done
                            ? "border-accent bg-accent text-white"
                            : "border-line-strong group-hover/sub:border-accent"
                        }`}
                      >
                        {s.done && (
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        )}
                      </span>
                      <span
                        className={`flex-1 text-sm ${
                          s.done ? "text-faint line-through" : "text-muted"
                        }`}
                      >
                        {s.title}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSubtask(t.id, s.id);
                        }}
                        aria-label="Supprimer la sous-tâche"
                        className="shrink-0 rounded p-0.5 text-faint opacity-0 transition hover:text-tag-red-text group-hover/sub:opacity-100"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Ajout d'une sous-tâche */}
              {addingSubFor === t.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addSubtask(t.id);
                  }}
                  className="ml-9 flex items-center gap-2 px-2 py-1"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-faint" />
                  <input
                    autoFocus
                    value={subDraft}
                    onChange={(e) => setSubDraft(e.target.value)}
                    onBlur={() => {
                      if (!subDraft.trim()) setAddingSubFor(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setSubDraft("");
                        setAddingSubFor(null);
                      }
                    }}
                    placeholder="Sous-tâche…"
                    className="flex-1 bg-transparent text-sm text-content outline-none placeholder:text-faint"
                  />
                </form>
              ) : (
                <button
                  onClick={() => {
                    setSubDraft("");
                    setAddingSubFor(t.id);
                  }}
                  className="ml-9 flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-faint opacity-0 transition hover:text-content group-hover:opacity-100"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Sous-tâche
                </button>
              )}
            </li>
          ))}

          {dayTodos.length === 0 && (
            <li className="py-6 text-center text-sm text-faint">
              Rien de prévu ce jour. Ajoutez une tâche ci-dessous.
            </li>
          )}
        </ul>

        <form onSubmit={addTodo} className="mt-3 flex gap-2 border-t border-line pt-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ajouter une tâche pour ce jour…"
            className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm text-content outline-none transition placeholder:text-faint hover:border-line-strong focus:border-accent"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Ajouter
          </button>
        </form>
      </div>
    </div>
  );
}
