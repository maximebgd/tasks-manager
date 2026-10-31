export const supportedLocales = ["fr", "es"] as const;
export type Locale = (typeof supportedLocales)[number];

export function isSupportedLocale(value: unknown): value is Locale {
  return typeof value === "string" && (supportedLocales as readonly string[]).includes(value);
}

export function getLocale(value?: unknown): Locale {
  return isSupportedLocale(value) ? value : "fr";
}

export function getLocaleFromCookieHeader(cookieHeader?: string): Locale {
  if (!cookieHeader) return "fr";
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== "locale") continue;
    try {
      return getLocale(decodeURIComponent(part.slice(separator + 1).trim()));
    } catch {
      return "fr";
    }
  }
  return "fr";
}
