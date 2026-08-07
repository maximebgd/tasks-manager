import { PrismaClient } from "@prisma/client";
import { mockTags, mockTasks, mockDailyTodos } from "../lib/mock-data";

const prisma = new PrismaClient();

/**
 * Peuple la base à partir des données mock existantes. Idempotent : réutilise
 * les ids stables des mocks (upsert), on peut donc le relancer sans doublon.
 */
async function main() {
  // Upsert par `name` (unique) : réutilise les étiquettes déjà présentes
  // (ex. créées par la migration) et applique la couleur voulue.
  for (const [i, tag] of mockTags.entries()) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: { color: tag.color, position: i },
      create: { id: tag.id, name: tag.name, color: tag.color, position: i },
    });
  }

  for (const [i, t] of mockTasks.entries()) {
    await prisma.task.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        // Rattache par nom (unique) aux étiquettes créées ci-dessus.
        tags: { connect: t.tagNames.map((name) => ({ name })) },
        notes: t.notes,
        position: i,
        deletedAt: t.deletedAt ? new Date(t.deletedAt) : null,
      },
    });
  }

  for (const [i, d] of mockDailyTodos.entries()) {
    await prisma.dailyTodo.upsert({
      where: { id: d.id },
      update: {},
      create: {
        id: d.id,
        date: d.date,
        title: d.title,
        done: d.done,
        position: i,
        deletedAt: d.deletedAt ? new Date(d.deletedAt) : null,
        subtasks: {
          create: d.subtasks.map((s, j) => ({
            id: s.id,
            title: s.title,
            done: s.done,
            position: j,
            deletedAt: s.deletedAt ? new Date(s.deletedAt) : null,
          })),
        },
      },
    });
  }

  const trashedTasks = mockTasks.filter((t) => t.deletedAt).length;
  const trashedDaily = mockDailyTodos.filter((d) => d.deletedAt).length;
  console.log(
    `Seed OK : ${mockTags.length} étiquettes, ${mockTasks.length} tâches ` +
      `(dont ${trashedTasks} à la corbeille), ${mockDailyTodos.length} todos ` +
      `journalières (dont ${trashedDaily} à la corbeille).`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
