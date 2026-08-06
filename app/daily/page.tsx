import { DailyTodoList } from "../components/daily-todo";

export default function DailyPage() {
  // Les todos journalières sont lues depuis le DailyTodosProvider (layout).
  return (
    <div className="min-h-screen flex-1 bg-page">
      <DailyTodoList />
    </div>
  );
}
