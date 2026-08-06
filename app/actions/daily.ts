"use server";

import { prisma } from "@/lib/prisma";

// Server Actions de la todo journalière (/daily) : tâches et sous-tâches.

export async function createDailyTodoAction(input: {
  id: string;
  date: string;
  title: string;
}) {
  const position = await prisma.dailyTodo.count({
    where: { date: input.date, deletedAt: null },
  });
  await prisma.dailyTodo.create({
    data: {
      id: input.id,
      date: input.date,
      title: input.title,
      done: false,
      position,
    },
  });
}

export async function setDailyTodoDoneAction(id: string, done: boolean) {
  await prisma.dailyTodo.update({ where: { id }, data: { done } });
}

/** Met la todo journalière à la corbeille (soft delete) : renseigne `deletedAt`. */
export async function softDeleteDailyTodoAction(id: string) {
  await prisma.dailyTodo.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

/** Restaure une todo journalière depuis la corbeille : efface `deletedAt`. */
export async function restoreDailyTodoAction(id: string) {
  await prisma.dailyTodo.update({ where: { id }, data: { deletedAt: null } });
}

/** Supprime définitivement une todo journalière (irréversible, cascade sous-tâches). */
export async function purgeDailyTodoAction(id: string) {
  await prisma.dailyTodo.delete({ where: { id } });
}

export async function createSubtaskAction(input: {
  id: string;
  dailyTodoId: string;
  title: string;
}) {
  const position = await prisma.subTodo.count({
    where: { dailyTodoId: input.dailyTodoId, deletedAt: null },
  });
  await prisma.subTodo.create({
    data: {
      id: input.id,
      dailyTodoId: input.dailyTodoId,
      title: input.title,
      done: false,
      position,
    },
  });
}

export async function setSubtaskDoneAction(id: string, done: boolean) {
  await prisma.subTodo.update({ where: { id }, data: { done } });
}

/** Met la sous-tâche à la corbeille (soft delete) : renseigne `deletedAt`. */
export async function softDeleteSubtaskAction(id: string) {
  await prisma.subTodo.update({ where: { id }, data: { deletedAt: new Date() } });
}

/** Restaure une sous-tâche depuis la corbeille : efface `deletedAt`. */
export async function restoreSubtaskAction(id: string) {
  await prisma.subTodo.update({ where: { id }, data: { deletedAt: null } });
}

/** Supprime définitivement une sous-tâche (irréversible). */
export async function purgeSubtaskAction(id: string) {
  await prisma.subTodo.delete({ where: { id } });
}

export async function reorderDailyTodosAction(
  items: { id: string; position: number }[],
) {
  await prisma.$transaction(
    items.map((it) =>
      prisma.dailyTodo.update({
        where: { id: it.id },
        data: { position: it.position },
      }),
    ),
  );
}

export async function reorderSubtasksAction(
  items: { id: string; position: number }[],
) {
  await prisma.$transaction(
    items.map((it) =>
      prisma.subTodo.update({
        where: { id: it.id },
        data: { position: it.position },
      }),
    ),
  );
}
