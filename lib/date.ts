export const pad = (n: number) => String(n).padStart(2, "0");

/** Convertit une Date en chaîne ISO locale "YYYY-MM-DD". */
export const toISO = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Date du jour (locale) au format "YYYY-MM-DD". */
export const todayISO = () => toISO(new Date());
