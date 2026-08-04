import { PrismaClient } from "@prisma/client";
import { mockTasks, mockDailyTodos } from "../lib/mock-data";

const prisma = new PrismaClient();

/**
 * Peuple la base à partir des données mock existantes. Idempotent : réutilise
 * les ids stables des mocks (upsert), on peut donc le relancer sans doublon.
 */
async function main() {
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
        tags: t.tags,
        notes: t.notes,
        position: i,
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
        subtasks: {
          create: d.subtasks.map((s, j) => ({
            id: s.id,
            title: s.title,
            done: s.done,
            position: j,
          })),
        },
      },
    });
  }

  console.log(
    `Seed OK : ${mockTasks.length} tâches, ${mockDailyTodos.length} todos journalières.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
