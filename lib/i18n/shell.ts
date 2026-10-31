import { translations, type TranslationKey } from "./catalogs";
import type { Locale } from "./locale";

export function shellText(locale: Locale, key: TranslationKey): string {
  return translations[locale][key];
}

export function formatClockTime(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function formatClockDate(date: Date, locale: Locale): string {
  const parts = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "long",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  const weekday = part("weekday");
  const day = part("day");
  const month = part("month");
  return locale === "es"
    ? `${weekday}, ${day} de ${month}`
    : `${weekday} ${day} ${month}`;
}
