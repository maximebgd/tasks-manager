import { prisma } from "@/lib/prisma";
import {
  getAllDailyTodos,
  getTags,
  getTasks,
  getTrashedTasks,
} from "@/lib/data";
import type { DailyTodo, Priority, Status, Tag, TagColor, Task } from "@/lib/types";

// Couche métier du serveur MCP. Réutilise les lecteurs de `lib/data.ts` (déjà
// convertis vers les types UI) et Prisma pour les mutations, en respectant la
// logique des Server Actions (positions, soft delete). Les IDs sont générés par
// Prisma (`@default(cuid())`) : le LLM n'a pas à les fournir à la création.

// ————————————————————————————————————————————————————————————— Tâches

/** Tâche seule, convertie comme dans `lib/data.ts` (null → undefined, Date → ISO). */
export async function getTask(id: string): Promise<Task | null> {
  const row = await prisma.task.findUnique({
    where: { id },
    include: { tags: { select: { id: true } } },
  });
  if (!row) return null;
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

/** Liste des tâches actives, avec filtres optionnels par statut et étiquette. */
export async function listTasks(filter?: {
  status?: Status;
  tagId?: string;
  trashed?: boolean;
}): Promise<Task[]> {
  const rows = filter?.trashed ? await getTrashedTasks() : await getTasks();
  return rows.filter(
    (t) =>
      (!filter?.status || t.status === filter.status) &&
      (!filter?.tagId || t.tagIds.includes(filter.tagId)),
  );
}

/** Recherche plein texte (insensible à la casse) dans titre / description / notes. */
export async function searchTasks(query: string): Promise<Task[]> {
  const q = query.toLowerCase();
  const rows = await getTasks();
  return rows.filter((t) =>
    [t.title, t.description, t.notes]
      .filter(Boolean)
      .some((field) => field!.toLowerCase().includes(q)),
  );
}

export async function createTask(input: {
  title: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  dueDate?: string | null;
  tagIds?: string[];
  notes?: string;
}): Promise<Task> {
  // Nouvelle tâche en tête de liste : position juste avant le minimum actuel.
  const agg = await prisma.task.aggregate({ _min: { position: true } });
  const position = (agg._min.position ?? 0) - 1;

  const created = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      status: input.status ?? "todo",
      priority: input.priority ?? "medium",
      dueDate: input.dueDate ?? null,
      tags: input.tagIds
        ? { connect: input.tagIds.map((id) => ({ id })) }
        : undefined,
      notes: input.notes,
      position,
    },
    select: { id: true },
  });
  return (await getTask(created.id))!;
}

export async function updateTask(
  id: string,
  patch: {
    title?: string;
    description?: string | null;
    status?: Status;
    priority?: Priority;
    dueDate?: string | null;
    tagIds?: string[];
    notes?: string | null;
  },
): Promise<Task> {
  await prisma.task.update({
    where: { id },
    data: {
      title: patch.title,
      description: patch.description,
      status: patch.status,
      priority: patch.priority,
      dueDate: patch.dueDate,
      // `set` remplace l'ensemble des étiquettes rattachées.
      tags: patch.tagIds
        ? { set: patch.tagIds.map((tagId) => ({ id: tagId })) }
        : undefined,
      notes: patch.notes,
    },
  });
  return (await getTask(id))!;
}

/** Met la tâche à la corbeille (soft delete). */
export async function softDeleteTask(id: string): Promise<void> {
  await prisma.task.update({ where: { id }, data: { deletedAt: new Date() } });
}

/** Restaure une tâche depuis la corbeille. */
export async function restoreTask(id: string): Promise<void> {
  await prisma.task.update({ where: { id }, data: { deletedAt: null } });
}

/** Supprime définitivement une tâche (irréversible). */
export async function purgeTask(id: string): Promise<void> {
  await prisma.task.delete({ where: { id } });
}

// ————————————————————————————————————————————————————————————— Étiquettes

export async function listTags(): Promise<Tag[]> {
  return getTags();
}

export async function createTag(input: {
  name: string;
  color: TagColor;
}): Promise<Tag> {
  const position = await prisma.tag.count();
  const created = await prisma.tag.create({
    data: { name: input.name, color: input.color, position },
  });
  return { id: created.id, name: created.name, color: created.color as TagColor };
}

export async function updateTag(
  id: string,
  patch: { name?: string; color?: TagColor },
): Promise<Tag> {
  const updated = await prisma.tag.update({
    where: { id },
    data: { name: patch.name, color: patch.color },
  });
  return { id: updated.id, name: updated.name, color: updated.color as TagColor };
}

/** Supprime une étiquette ; les liens tâche↔étiquette partent en cascade. */
export async function deleteTag(id: string): Promise<void> {
  await prisma.tag.delete({ where: { id } });
}

// ————————————————————————————————————————————————————————————— Todos journalières

/** Todos journalières actives (hors corbeille), filtrables par jour. */
export async function listDailyTodos(filter?: {
  date?: string;
  trashed?: boolean;
}): Promise<DailyTodo[]> {
  const rows = await getAllDailyTodos();
  return rows
    .filter((t) => (filter?.trashed ? t.deletedAt : !t.deletedAt))
    .filter((t) => !filter?.date || t.date === filter.date)
    .map((t) => ({
      ...t,
      // On n'expose que les sous-tâches actives (les supprimées sont du bruit).
      subtasks: t.subtasks.filter((s) => (filter?.trashed ? true : !s.deletedAt)),
    }));
}

export async function createDailyTodo(input: {
  date: string;
  title: string;
}): Promise<DailyTodo> {
  const position = await prisma.dailyTodo.count({
    where: { date: input.date, deletedAt: null },
  });
  const created = await prisma.dailyTodo.create({
    data: { date: input.date, title: input.title, done: false, position },
  });
  return {
    id: created.id,
    date: created.date,
    title: created.title,
    done: created.done,
    deletedAt: null,
    subtasks: [],
  };
}

export async function setDailyTodoDone(id: string, done: boolean): Promise<void> {
  await prisma.dailyTodo.update({ where: { id }, data: { done } });
}

export async function softDeleteDailyTodo(id: string): Promise<void> {
  await prisma.dailyTodo.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function restoreDailyTodo(id: string): Promise<void> {
  await prisma.dailyTodo.update({ where: { id }, data: { deletedAt: null } });
}

export async function addSubtask(input: {
  dailyTodoId: string;
  title: string;
}): Promise<void> {
  const position = await prisma.subTodo.count({
    where: { dailyTodoId: input.dailyTodoId, deletedAt: null },
  });
  await prisma.subTodo.create({
    data: {
      dailyTodoId: input.dailyTodoId,
      title: input.title,
      done: false,
      position,
    },
  });
}

export async function setSubtaskDone(id: string, done: boolean): Promise<void> {
  await prisma.subTodo.update({ where: { id }, data: { done } });
}
