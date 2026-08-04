import { prisma } from "./prisma";
import type { DailyTodo, Task } from "./types";

// Lectures serveur (Server Components uniquement) + conversion des lignes
// Prisma vers les types utilisés par l'UI (null -> undefined, date -> ISO).

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: Task["status"];
  priority: Task["priority"];
  dueDate: string | null;
  tags: string[];
  notes: string | null;
  createdAt: Date;
};

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status,
    priority: row.priority,
    dueDate: row.dueDate,
    tags: row.tags,
    createdAt: row.createdAt.toISOString().slice(0, 10),
    notes: row.notes ?? undefined,
  };
}

export async function getTasks(): Promise<Task[]> {
  const rows = await prisma.task.findMany({
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toTask);
}

export async function getDailyTodos(): Promise<DailyTodo[]> {
  const rows = await prisma.dailyTodo.findMany({
    orderBy: { position: "asc" },
    include: { subtasks: { orderBy: { position: "asc" } } },
  });
  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    title: r.title,
    done: r.done,
    subtasks: r.subtasks.map((s) => ({
      id: s.id,
      title: s.title,
      done: s.done,
    })),
  }));
}
