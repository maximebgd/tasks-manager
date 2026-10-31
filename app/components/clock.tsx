"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n/locale";
import { formatClockDate, formatClockTime, shellText } from "@/lib/i18n/shell";

// Horloge locale (heure du navigateur), mise à jour chaque seconde.
// Rendue vide au premier rendu pour éviter tout mismatch d'hydratation.
export function Clock({ locale }: { locale: Locale }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now ? formatClockTime(now, locale) : "--:--:--";
  const date = now ? formatClockDate(now, locale) : "";

  return (
    <div className="flex flex-col items-center rounded-xl px-2 py-2" title={shellText(locale, "clockTitle")}>
      <span
        className="text-xs font-medium text-muted lg:text-sm"
        suppressHydrationWarning
      >
        {date}
      </span>
      <span
        className="font-mono text-xl font-semibold tabular-nums tracking-wide text-content"
        suppressHydrationWarning
      >
        {time}
      </span>
    </div>
  );
}
