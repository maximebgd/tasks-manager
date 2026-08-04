export const pad = (n: number) => String(n).padStart(2, "0");

/** Convertit une Date en chaîne ISO locale "YYYY-MM-DD". */
export const toISO = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Date du jour (locale) au format "YYYY-MM-DD". */
export const todayISO = () => toISO(new Date());

/** Nombre de jours entiers de `fromISO` à `toISO` (positif si `toISO` est après). */
export const daysBetween = (fromISO: string, toISO: string) => {
  const from = new Date(fromISO + "T00:00:00");
  const to = new Date(toISO + "T00:00:00");
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
};
