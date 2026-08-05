import { Trash } from "../components/trash";

export default function TrashPage() {
  // La corbeille lit les tâches supprimées depuis le TasksProvider (layout).
  return (
    <div className="min-h-screen flex-1 bg-page">
      <Trash />
    </div>
  );
}
