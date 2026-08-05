import type { Priority, TagColor } from "@/lib/types";
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

/** Classes fond + texte par couleur d'étiquette (tokens sémantiques, jour/nuit). */
export const tagColorClass: Record<TagColor, string> = {
  blue: "bg-tag-blue text-tag-blue-text",
  green: "bg-tag-green text-tag-green-text",
  yellow: "bg-tag-yellow text-tag-yellow-text",
  red: "bg-tag-red text-tag-red-text",
  gray: "bg-tag-gray text-tag-gray-text",
};

/** Pastille pleine par couleur d'étiquette. */
export const tagDotClass: Record<TagColor, string> = {
  blue: "bg-tag-blue-text",
  green: "bg-tag-green-text",
  yellow: "bg-tag-yellow-text",
  red: "bg-tag-red-text",
  gray: "bg-tag-gray-text",
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

export function Tag({
  label,
  color = "blue",
}: {
  label: string;
  color?: TagColor;
}) {
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs ${tagColorClass[color]}`}>
      {label}
    </span>
  );
}
