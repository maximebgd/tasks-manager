"use server";

import { prisma } from "@/lib/prisma";
import type { TagColor } from "@/lib/types";

// Server Actions des étiquettes (CRUD). Comme pour les tâches, l'UI applique
// le changement de façon optimiste puis persiste ici.

export async function createTagAction(input: {
  id: string;
  name: string;
  color: TagColor;
}) {
  await prisma.tag.create({
    data: { id: input.id, name: input.name, color: input.color },
  });
}

export async function updateTagAction(
  id: string,
  patch: { name?: string; color?: TagColor },
) {
  await prisma.tag.update({
    where: { id },
    data: { name: patch.name, color: patch.color },
  });
}

/** Supprime une étiquette ; les liens tâche↔étiquette partent en cascade. */
export async function deleteTagAction(id: string) {
  await prisma.tag.delete({ where: { id } });
}
