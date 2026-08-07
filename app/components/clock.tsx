"use client";

import { useEffect, useState } from "react";

// Horloge locale (heure du navigateur), mise à jour chaque seconde.
// Rendue vide au premier rendu pour éviter tout mismatch d'hydratation.
export function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now
    ? now.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--:--:--";

  // Ex. « Ven. 7 Août » : jour abrégé + numéro + mois, avec majuscules.
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const date = now
    ? `${cap(now.toLocaleDateString("fr-FR", { weekday: "short" }))} ${now.getDate()} ${cap(
        now.toLocaleDateString("fr-FR", { month: "long" }),
      )}`
    : "";

  return (
    <div className="flex flex-col items-center rounded-xl px-2 py-2" title="Date et heure locales">
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
