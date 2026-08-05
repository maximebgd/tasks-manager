"use server";

import { prisma } from "@/lib/prisma";
import type { Priority, Status } from "@/lib/types";

// Server Actions des tâches du tableau. Appelées depuis le client, elles
// persistent en base ce que l'UI applique déjà de façon optimiste.

export async function createTaskAction(input: {
  id: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  dueDate: string | null;
  tagIds: string[];
  notes?: string;
}) {
  // Nouvelle tâche en tête de liste : position juste avant le minimum actuel.
  const agg = await prisma.task.aggregate({ _min: { position: true } });
  const position = (agg._min.position ?? 0) - 1;

  await prisma.task.create({
    data: {
      id: input.id,
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      dueDate: input.dueDate,
      tags: { connect: input.tagIds.map((tagId) => ({ id: tagId })) },
      notes: input.notes,
      position,
    },
  });
}

type TaskPatch = {
  title?: string;
  description?: string | null;
  status?: Status;
  priority?: Priority;
  dueDate?: string | null;
  tagIds?: string[];
  notes?: string | null;
};

export async function updateTaskAction(id: string, patch: TaskPatch) {
  // Les champs `undefined` sont ignorés par Prisma (pas de modification).
  await prisma.task.update({
    where: { id },
    data: {
      title: patch.title,
      description: patch.description,
      status: patch.status,
      priority: patch.priority,
      dueDate: patch.dueDate,
      // `set` remplace l'ensemble des étiquettes rattachées par la nouvelle liste.
      tags: patch.tagIds
        ? { set: patch.tagIds.map((tagId) => ({ id: tagId })) }
        : undefined,
      notes: patch.notes,
    },
  });
}

/** Met la tâche à la corbeille (soft delete) : renseigne `deletedAt`. */
export async function softDeleteTaskAction(id: string) {
  await prisma.task.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

/** Restaure une tâche depuis la corbeille : efface `deletedAt`. */
export async function restoreTaskAction(id: string) {
  await prisma.task.update({
    where: { id },
    data: { deletedAt: null },
  });
}

/** Supprime définitivement une tâche (irréversible). */
export async function purgeTaskAction(id: string) {
  await prisma.task.delete({ where: { id } });
}

/** Réordonne (et éventuellement change de statut) plusieurs tâches d'un coup. */
export async function reorderTasksAction(
  items: { id: string; status: Status; position: number }[],
) {
  await prisma.$transaction(
    items.map((it) =>
      prisma.task.update({
        where: { id: it.id },
        data: { status: it.status, position: it.position },
      }),
    ),
  );
}
