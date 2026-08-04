"use client";

import { useMemo, useState } from "react";
import type { Priority, Task } from "@/lib/types";
import { priorityLabel } from "@/lib/types";
import { useTasks } from "@/lib/tasks-context";
import { toISO, todayISO } from "@/lib/date";

const WEEKDAYS =["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const priorityDot: Record<Priority, string> = {
  low: "bg-faint",
  medium: "bg-tag-yellow-text",
  high: "bg-tag-red-text",
};

// Libellé long d'une date ISO, pour les toasts (« 4 août »).
function longDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });
}

export function Calendar() {
  const { tasks, updateTask } = useTasks();
  const today = new Date();
  const [view, setView] = useState<"month" | "week">("month");
  // Jour de référence (ISO) : détermine le mois affiché ou la semaine affichée.
  const [anchor, setAnchor] = useState(todayISO);
  // Glisser-déposer d'une tâche sur un jour pour (re)définir son échéance.
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverISO, setDragOverISO] = useState<string | null>(null);

  function resetDrag() {
    setDraggingId(null);
    setDragOverISO(null);
  }

  // Dépose la tâche glissée sur un jour : fixe/modifie sa dueDate (persisté).
  function dropOnDay(dateISO: string) {
    const id = draggingId;
    resetDrag();
    if (!id) return;
    const task = tasks.find((t) => t.id === id);
    if (!task || task.dueDate === dateISO) return;
    updateTask(id, { dueDate: dateISO }, `Échéance fixée au ${longDate(dateISO)}`);
  }

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const list = map.get(t.dueDate) ?? [];
      list.push(t);
      map.set(t.dueDate, list);
    }
    return map;
  }, [tasks]);

  const noDueDate = useMemo(
    () => tasks.filter((t) => !t.dueDate),
    [tasks],
  );

  const anchorDate = new Date(anchor + "T00:00:00");

  const cells = useMemo(() => {
    const base = new Date(anchor + "T00:00:00");

    if (view === "week") {
      const start = new Date(base);
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // Lundi
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
      });
    }

    const year = base.getFullYear();
    const month = base.getMonth();
    const first = new Date(year, month, 1);
    const startWeekday = (first.getDay() + 6) % 7; // Lundi = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const result: Date[] = [];
    for (let i = 0; i < startWeekday; i++) {
      result.push(new Date(year, month, i - startWeekday + 1));
    }
    for (let d = 1; d <= daysInMonth; d++) {
      result.push(new Date(year, month, d));
    }
    while (result.length % 7 !== 0) {
      const last = result[result.length - 1];
      result.push(
        new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
      );
    }
    return result;
  }, [anchor, view]);

  // Décale d'un mois (vue mois) ou d'une semaine (vue semaine).
  const shift = (delta: number) =>
    setAnchor((a) => {
      const d = new Date(a + "T00:00:00");
      if (view === "week") d.setDate(d.getDate() + delta * 7);
      else d.setMonth(d.getMonth() + delta);
      return toISO(d);
    });

  const goToday = () => setAnchor(todayISO());

  const periodLabel = useMemo(() => {
    const base = new Date(anchor + "T00:00:00");
    if (view === "week") {
      const start = new Date(base);
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const fmt = (d: Date, withYear: boolean) =>
        d.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
          ...(withYear ? { year: "numeric" } : {}),
        });
      return `${fmt(start, false)} – ${fmt(end, true)}`;
    }
    return `${MONTHS[base.getMonth()]} ${base.getFullYear()}`;
  }, [anchor, view]);

  const todayStr = toISO(today);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-content">
            Calendrier
          </h1>
          <p className="mt-1 text-sm text-muted">
            Échéances de vos tâches
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-line bg-surface p-1">
            <ViewChip active={view === "month"} onClick={() => setView("month")}>
              Mois
            </ViewChip>
            <ViewChip active={view === "week"} onClick={() => setView("week")}>
              Semaine
            </ViewChip>
          </div>
          <button
            onClick={goToday}
            className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-muted transition hover:bg-surface-hover hover:text-content"
          >
            Aujourd&apos;hui
          </button>
          <div className="flex items-center rounded-md border border-line">
            <button
              onClick={() => shift(-1)}
              aria-label={view === "week" ? "Semaine précédente" : "Mois précédent"}
              className="rounded-l-md px-2 py-1.5 text-muted transition hover:bg-surface-hover hover:text-content"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={() => shift(1)}
              aria-label={view === "week" ? "Semaine suivante" : "Mois suivant"}
              className="rounded-r-md px-2 py-1.5 text-muted transition hover:bg-surface-hover hover:text-content"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
          <span className="min-w-44 text-right text-lg font-semibold capitalize text-content">
            {periodLabel}
          </span>
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="grid grid-cols-7 border-b border-line bg-surface-muted">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="px-2 py-2 text-center text-xs font-medium uppercase tracking-wide text-faint"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((date, i) => {
            // En vue semaine, tous les jours sont « actifs » ; en vue mois, ceux du mois affiché.
            const inMonth =
              view === "week" || date.getMonth() === anchorDate.getMonth();
            const dateISO = toISO(date);
            const isToday = dateISO === todayStr;
            const dayTasks = tasksByDate.get(dateISO) ?? [];

            const isDropTarget = dragOverISO === dateISO;

            return (
              <div
                key={i}
                onDragOver={(e) => {
                  if (!draggingId) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOverISO !== dateISO) setDragOverISO(dateISO);
                }}
                onDragLeave={(e) => {
                  // Ignore les transitions vers un enfant de la case.
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDragOverISO((cur) => (cur === dateISO ? null : cur));
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  dropOnDay(dateISO);
                }}
                className={`border-b border-r border-line p-1.5 transition-colors ${
                  view === "week" ? "min-h-64" : "min-h-28"
                } ${
                  isDropTarget
                    ? "bg-accent-soft ring-2 ring-inset ring-accent"
                    : inMonth
                      ? "bg-surface"
                      : "bg-surface-muted"
                }`}
              >
                <div className="mb-1 flex justify-end">
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full text-xs font-medium ${
                      isToday
                        ? "bg-accent text-white"
                        : inMonth
                          ? "text-muted"
                          : "text-faint"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", t.id);
                        setDraggingId(t.id);
                      }}
                      onDragEnd={resetDrag}
                      title={`${t.title} · ${priorityLabel(t.priority)} · glisser pour changer d'échéance`}
                      className={`flex cursor-grab items-center gap-1 rounded px-1.5 py-1 text-xs active:cursor-grabbing ${
                        draggingId === t.id ? "opacity-40 ring-1 ring-accent" : ""
                      } ${
                        t.status === "done"
                          ? "bg-surface-hover text-faint line-through"
                          : "bg-surface-hover text-content"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${priorityDot[t.priority]}`}
                      />
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {noDueDate.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-content">
            Sans échéance ({noDueDate.length})
          </h2>
          <p className="mb-2 text-xs text-faint">
            Glissez une tâche sur un jour pour lui donner une échéance.
          </p>
          <div className="flex flex-wrap gap-2">
            {noDueDate.map((t) => (
              <span
                key={t.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", t.id);
                  setDraggingId(t.id);
                }}
                onDragEnd={resetDrag}
                title="Glisser sur un jour pour définir l'échéance"
                className={`inline-flex cursor-grab items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1 text-xs text-muted active:cursor-grabbing ${
                  draggingId === t.id ? "opacity-40 ring-1 ring-accent" : ""
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${priorityDot[t.priority]}`}
                />
                {t.title}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ViewChip({
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
      aria-pressed={active}
      className={`rounded px-2.5 py-1 text-xs font-medium transition ${
        active
          ? "bg-accent text-white"
          : "text-muted hover:bg-surface-hover hover:text-content"
      }`}
    >
      {children}
    </button>
  );
}
