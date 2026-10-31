"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocaleAction } from "@/app/actions/locale";
import type { Locale } from "@/lib/i18n/locale";
import { translations } from "@/lib/i18n/catalogs";

export function LanguageSelector({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const t = translations[locale];

  function changeLocale(value: string) {
    startTransition(async () => {
      await setLocaleAction(value);
      router.refresh();
    });
  }

  return (
    <label className="flex items-center gap-2 text-xs text-muted">
      <span className="sr-only">{t.language}</span>
      <select
        aria-label={t.language}
        value={locale}
        disabled={pending}
        onChange={(event) => changeLocale(event.target.value)}
        className="rounded-md border border-line bg-surface px-2 py-1 text-content"
      >
        <option value="fr">{t.french}</option>
        <option value="es">{t.spanish}</option>
      </select>
    </label>
  );
}
