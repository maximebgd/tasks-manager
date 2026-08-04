"use server";

import { prisma } from "@/lib/prisma";

// Server Actions de la todo journalière (/daily) : tâches et sous-tâches.

export async function createDailyTodoAction(input: {
  id: string;
  date: string;
  title: string;
}) {
  const position = await prisma.dailyTodo.count({ where: { date: input.date } });
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

export async function deleteDailyTodoAction(id: string) {
  // Les sous-tâches sont supprimées en cascade (onDelete: Cascade).
  await prisma.dailyTodo.delete({ where: { id } });
}

export async function createSubtaskAction(input: {
  id: string;
  dailyTodoId: string;
  title: string;
}) {
  const position = await prisma.subTodo.count({
    where: { dailyTodoId: input.dailyTodoId },
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

export async function deleteSubtaskAction(id: string) {
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
