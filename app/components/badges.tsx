import type { Priority } from "@/lib/types";
import { priorityLabel } from "@/lib/types";

const priorityStyles: Record<Priority, string> = {
  low: "bg-tag-gray text-tag-gray-text",
  medium: "bg-tag-yellow text-tag-yellow-text",
  high: "bg-tag-red text-tag-red-text",
};

const priorityDot: Record<Priority, string> = {
  low: "bg-faint",
  medium: "bg-tag-yellow-text",
  high: "bg-tag-red-text",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs font-medium ${priorityStyles[priority]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${priorityDot[priority]}`} />
      {priorityLabel(priority)}
    </span>
  );
}

export function Tag({ label }: { label: string }) {
  return (
    <span className="rounded bg-tag-blue px-1.5 py-0.5 text-xs text-tag-blue-text">
      {label}
    </span>
  );
}
