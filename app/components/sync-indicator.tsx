"use client";

import { useSync, type SyncStatus } from "@/lib/sync-context";
import type { Locale } from "@/lib/i18n/locale";
import { shellText } from "@/lib/i18n/shell";
import { useTasks } from "@/lib/tasks-context";

const svg = (children: React.ReactNode, extraClass = "") => (
  <svg
    className={extraClass}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const config: Record<
  SyncStatus,
  { text: "syncIdle" | "syncWorking" | "syncError"; className: string; icon: React.ReactNode }
> = {
  idle: {
    text: "syncIdle",
    className: "text-muted",
    // Nuage avec check.
    icon: svg(
      <>
        <path d="M17.5 19a4.5 4.5 0 0 0 .5-8.98A6 6 0 0 0 6.34 9.5 4 4 0 0 0 7 17.5" />
        <path d="M9 13.5l2 2 4-4.5" />
      </>,
    ),
  },
  syncing: {
    text: "syncWorking",
    className: "text-accent",
    // Flèches circulaires qui tournent.
    icon: svg(
      <>
        <path d="M21 12a9 9 0 0 1-9 9c-2.5 0-4.77-1-6.4-2.65" />
        <path d="M3 12a9 9 0 0 1 9-9c2.5 0 4.77 1 6.4 2.65" />
        <path d="M21 3v5h-5M3 21v-5h5" />
      </>,
      "animate-spin [animation-duration:900ms]",
    ),
  },
  saved: {
    text: "syncIdle",
    className: "text-tag-green-text",
    icon: svg(
      <>
        <path d="M17.5 19a4.5 4.5 0 0 0 .5-8.98A6 6 0 0 0 6.34 9.5 4 4 0 0 0 7 17.5" />
        <path d="M9 13.5l2 2 4-4.5" />
      </>,
    ),
  },
  error: {
    text: "syncError",
    className: "text-tag-red-text",
    // Nuage barré.
    icon: svg(
      <>
        <path d="M17.5 19a4.5 4.5 0 0 0 .5-8.98A6 6 0 0 0 6.34 9.5 4 4 0 0 0 7 17.5" />
        <path d="M12 10v3M12 16h.01" />
      </>,
    ),
  },
};

/**
 * Petit badge de synchronisation BDD affiché dans la nav. Reflète en temps réel
 * l'état agrégé des mutations (voir `SyncProvider`) : au repos « Synchronisé »,
 * en écriture une icône qui tourne, un flash vert au succès, rouge en cas d'échec.
 */
export function SyncIndicator({ locale }: { locale: Locale }) {
  const { status } = useSync();
  const { stale } = useTasks();
  const { text, className, icon } = config[status];
  const label = shellText(locale, stale ? "syncStale" : text);
  if (stale) return <div role="status" aria-live="polite" aria-label={label} title={label} className="flex shrink-0 items-center text-muted">{svg(<><path d="M12 9v4M12 17h.01" /><circle cx="12" cy="12" r="9" /></>)}</div>;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      title={label}
      className={`flex shrink-0 items-center transition-colors duration-300 ease-smooth ${className}`}
    >
      {icon}
    </div>
  );
}
