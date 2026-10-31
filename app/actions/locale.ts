'use server';

import { cookies } from "next/headers";
import { isSupportedLocale } from "@/lib/i18n/locale";

export async function setLocaleAction(value: string) {
  if (!isSupportedLocale(value)) return;
  const cookieStore = await cookies();
  cookieStore.set("locale", value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
