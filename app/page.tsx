import { TaskBoard } from "./components/task-board";

export default function Page() {
  // Les tâches proviennent du TasksProvider (monté dans le layout).
  return (
    <main className="min-h-screen flex-1 bg-page">
      <TaskBoard />
    </main>
  );
}
