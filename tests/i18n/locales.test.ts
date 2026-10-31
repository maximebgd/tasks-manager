import assert from "node:assert/strict";
import { test } from "node:test";
import { translations } from "../../lib/i18n/catalogs";
import { getLocale, getLocaleFromCookieHeader, isSupportedLocale } from "../../lib/i18n/locale";
import { formatClockDate, formatClockTime, shellText } from "../../lib/i18n/shell";
import { formatTaskDate, priorityText, relativeDueText, statusText } from "../../lib/i18n/tasks";
import { taskUiTranslations } from "../../lib/i18n/task-ui";

test("French and Spanish catalogs have identical, non-empty keys", () => {
  const frenchKeys = Object.keys(translations.fr).sort();
  const spanishKeys = Object.keys(translations.es).sort();
  assert.ok(frenchKeys.length > 0, "catalogs must not be empty");
  assert.deepEqual(spanishKeys, frenchKeys);
  for (const key of frenchKeys) {
    assert.ok(translations.fr[key as keyof typeof translations.fr]);
    assert.ok(translations.es[key as keyof typeof translations.es]);
  }
});

test("task UI catalogs have identical, non-empty keys and values", () => {
  const frenchKeys = Object.keys(taskUiTranslations.fr).sort();
  const spanishKeys = Object.keys(taskUiTranslations.es).sort();
  assert.ok(frenchKeys.length > 0, "task UI catalogs must not be empty");
  assert.deepEqual(spanishKeys, frenchKeys);
  for (const key of frenchKeys) {
    assert.ok(taskUiTranslations.fr[key as keyof typeof taskUiTranslations.fr].trim(), `French task UI value for ${key} must not be empty`);
    assert.ok(taskUiTranslations.es[key as keyof typeof taskUiTranslations.es].trim(), `Spanish task UI value for ${key} must not be empty`);
  }
});

test("French is the default and only French/Spanish are supported", () => {
  assert.equal(getLocale(), "fr");
  assert.equal(isSupportedLocale("fr"), true);
  assert.equal(isSupportedLocale("es"), true);
  assert.equal(isSupportedLocale("en"), false);
  assert.equal(isSupportedLocale(undefined), false);
});

test("a supported locale preference persists through the locale cookie", () => {
  assert.equal(getLocaleFromCookieHeader(undefined), "fr");
  assert.equal(getLocaleFromCookieHeader("other=value; locale=es"), "es");
  assert.equal(getLocaleFromCookieHeader("locale=en"), "fr");
});

test("shell text is selected from the active locale", () => {
  assert.equal(shellText("fr", "themeToLight"), "Passer en mode jour");
  assert.equal(shellText("es", "themeToLight"), "Cambiar a modo claro");
  assert.equal(shellText("es", "confirm"), "Confirmar");
  assert.equal(shellText("fr", "syncError"), "Échec de synchro");
});

test("task status and priority labels use the active locale", () => {
  assert.equal(statusText("fr", "in_progress"), "En cours");
  assert.equal(statusText("es", "in_progress"), "En progreso");
  assert.equal(priorityText("fr", "high"), "Haute");
  assert.equal(priorityText("es", "high"), "Alta");
});

test("task dates and relative due messages use the active locale", () => {
  const date = new Date(2024, 0, 2);
  assert.equal(formatTaskDate("2024-01-02", "fr"), "2 janv.");
  assert.equal(formatTaskDate("2024-01-02", "es"), "2 ene");
  assert.equal(relativeDueText(0, "es"), "hoy");
  assert.equal(relativeDueText(2, "es"), "dentro de 2 días");
  assert.equal(relativeDueText(-1, "fr"), "en retard de 1 jour");
});

test("clock date and time use the active locale", () => {
  const date = new Date(2024, 0, 2, 15, 4, 5);
  assert.equal(formatClockTime(date, "es"), "15:04:05");
  assert.equal(formatClockDate(date, "es"), "mar, 2 de enero");
  assert.equal(formatClockDate(date, "fr"), "mar. 2 janvier");
});
