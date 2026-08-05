"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTasks } from "@/lib/tasks-context";
import { TaskEditor } from "../../components/task-editor";

export default function TaskPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { tasks, deleteTask } = useTasks();
  const exists = tasks.some((t) => t.id === id);

  return (
    <div className="min-h-screen flex-1 bg-page">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-content"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Tableau
          </Link>
          {exists && (
            <button
              onClick={() => {
                deleteTask(id);
                router.push("/");
              }}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted transition duration-200 ease-smooth hover:bg-tag-red hover:text-tag-red-text active:scale-95"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              </svg>
              Supprimer
            </button>
          )}
        </div>

        <TaskEditor key={id} taskId={id} variant="page" />
      </div>
    </div>
  );
}
