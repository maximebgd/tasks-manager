import assert from "node:assert/strict";
import { test } from "node:test";
import { remainingTranslations, remainingText, formatRemainingDate, formatCalendarMonth, formatCalendarWeekdays, formatTrashCount, formatDeletedDateTime } from "../../lib/i18n/remaining";

test("daily, calendar and trash catalogs have matching non-empty keys", () => {
  assert.deepEqual(Object.keys(remainingTranslations.fr).sort(), Object.keys(remainingTranslations.es).sort());
  for (const catalog of Object.values(remainingTranslations)) {
    for (const value of Object.values(catalog)) assert.ok(value.trim());
  }
});

test("remainingText interpolates values for either locale", () => {
  assert.equal(remainingText("es", "trashCountPlural", { count: 2 }), "2 elementos eliminados");
  assert.equal(remainingText("fr", "trashCount", { count: 1 }), "1 élément supprimé");
});

test("trash counts pluralize and deletion timestamps follow the active locale", () => {
  assert.equal(formatTrashCount(1, "fr"), "1 élément supprimé");
  assert.equal(formatTrashCount(2, "es"), "2 elementos eliminados");
  assert.match(formatDeletedDateTime("2026-08-04T13:05:00", "es"), /4 de agosto/);
  assert.match(formatDeletedDateTime("2026-08-04T13:05:00", "es"), /13:05/);
});

test("calendar and date formatters use requested locale", () => {
  assert.equal(formatCalendarMonth(new Date(2026, 0, 1), "es"), "enero de 2026");
  assert.deepEqual(formatCalendarWeekdays("es"), ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"]);
  assert.match(formatRemainingDate("2026-08-04", "es", { month: "long", day: "numeric" }), /4 de agosto/);
});
