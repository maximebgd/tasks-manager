import { Calendar } from "../components/calendar";

export default function CalendarPage() {
  // Le calendrier lit les tâches depuis le TasksProvider (monté dans le layout).
  return (
    <div className="min-h-screen flex-1 bg-page">
      <Calendar />
    </div>
  );
}
