import { prisma } from "./prisma";
import type { DailyTodo, Tag, TagColor, Task } from "./types";

// Lectures serveur (Server Components uniquement) + conversion des lignes
// Prisma vers les types utilisés par l'UI (null -> undefined, date -> ISO).

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: Task["status"];
  priority: Task["priority"];
  dueDate: string | null;
  tags: { id: string }[];
  notes: string | null;
  createdAt: Date;
  deletedAt: Date | null;
};

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status,
    priority: row.priority,
    dueDate: row.dueDate,
    tagIds: row.tags.map((t) => t.id),
    createdAt: row.createdAt.toISOString().slice(0, 10),
    notes: row.notes ?? undefined,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
  };
}

/** Tâches actives (hors corbeille). */
export async function getTasks(): Promise<Task[]> {
  const rows = await prisma.task.findMany({
    where: { deletedAt: null },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    include: { tags: { select: { id: true } } },
  });
  return rows.map(toTask);
}

/** Tâches à la corbeille, plus récemment supprimées en premier. */
export async function getTrashedTasks(): Promise<Task[]> {
  const rows = await prisma.task.findMany({
    where: { deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    include: { tags: { select: { id: true } } },
  });
  return rows.map(toTask);
}

/** Toutes les étiquettes, dans l'ordre d'affichage (drag & drop), puis par nom. */
export async function getTags(): Promise<Tag[]> {
  const rows = await prisma.tag.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    color: r.color as TagColor,
  }));
}

/**
 * Toutes les todos journalières avec toutes leurs sous-tâches, y compris celles
 * à la corbeille (`deletedAt` renseigné). Le `DailyTodosProvider` en dérive les
 * vues actives et corbeille (une sous-tâche peut être supprimée seule alors que
 * sa todo parente est encore active).
 */
export async function getAllDailyTodos(): Promise<DailyTodo[]> {
  const rows = await prisma.dailyTodo.findMany({
    orderBy: { position: "asc" },
    include: { subtasks: { orderBy: { position: "asc" } } },
  });
  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    title: r.title,
    done: r.done,
    deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null,
    subtasks: r.subtasks.map((s) => ({
      id: s.id,
      title: s.title,
      done: s.done,
      deletedAt: s.deletedAt ? s.deletedAt.toISOString() : null,
    })),
  }));
}
