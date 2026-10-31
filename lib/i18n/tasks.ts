import type { Priority, Status } from "../types";
import type { Locale } from "./locale";

const labels = {
  fr: { todo: "À faire", in_progress: "En cours", done: "Terminé", low: "Basse", medium: "Moyenne", high: "Haute" },
  es: { todo: "Por hacer", in_progress: "En progreso", done: "Terminada", low: "Baja", medium: "Media", high: "Alta" },
} as const;

export function statusText(locale: Locale, status: Status): string {
  return labels[locale][status];
}

export function priorityText(locale: Locale, priority: Priority): string {
  return labels[locale][priority];
}

export function formatTaskDate(iso: string, locale: Locale): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(new Date(year, month - 1, day));
}

export function relativeDueText(diff: number, locale: Locale): string {
  const amount = new Intl.NumberFormat(locale).format(Math.abs(diff));
  if (locale === "es") {
    if (diff === 0) return "hoy";
    if (diff > 0) return `dentro de ${amount} ${diff === 1 ? "día" : "días"}`;
    return `con ${amount} ${diff === -1 ? "día" : "días"} de retraso`;
  }
  if (diff === 0) return "aujourd'hui";
  if (diff > 0) return `dans ${amount} jour${diff > 1 ? "s" : ""}`;
  const late = -diff;
  return `en retard de ${amount} jour${late > 1 ? "s" : ""}`;
}
