import { DailyTodoList } from "../components/daily-todo";
import { getDailyTodos } from "@/lib/data";

export default async function DailyPage() {
  const todos = await getDailyTodos();
  return (
    <div className="min-h-screen flex-1 bg-page">
      <DailyTodoList initialTodos={todos} />
    </div>
  );
}
