import assert from "node:assert/strict";
import { test } from "node:test";
import { mcpTranslations, mcpText } from "../../lib/i18n/mcp";

test("MCP UI catalogs have matching non-empty keys", () => {
  assert.deepEqual(Object.keys(mcpTranslations.fr).sort(), Object.keys(mcpTranslations.es).sort());
  for (const catalog of Object.values(mcpTranslations)) for (const value of Object.values(catalog)) assert.ok(value.trim());
});

test("MCP UI strings interpolate values in both locales", () => {
  assert.equal(mcpText("fr", "statusAgoSeconds", { count: 3 }), "il y a 3 s");
  assert.equal(mcpText("es", "statusAgoSeconds", { count: 3 }), "hace 3 s");
});
