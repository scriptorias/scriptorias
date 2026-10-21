/** Reference alias resolution (src/content/aliases.ts) with representative old → new mappings. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveAlias, sectionOf } from "../../src/content/aliases";

// Representative corrections: a verse merged into its predecessor, a verse moved across a
// chapter boundary, and a retired chapter-level ref.
const ALIASES = { "didache.1.7": "didache.1.6", "didache.2.8": "didache.3.1", "didache.17": "didache.16" };

test("an aliased verse resolves to its replacement", () => assert.equal(resolveAlias(ALIASES, "didache.1.7"), "didache.1.6"));
test("a verse moved across chapters resolves to the new chapter", () => {
  assert.equal(resolveAlias(ALIASES, "didache.2.8"), "didache.3.1");
  assert.equal(sectionOf(resolveAlias(ALIASES, "didache.2.8")), 3);
});
test("a chapter-level alias resolves", () => assert.equal(resolveAlias(ALIASES, "didache.17"), "didache.16"));
test("unaliased refs are unchanged", () => {
  for (const r of ["didache.1.6", "didache.1", "1-enoch.6.7"]) assert.equal(resolveAlias(ALIASES, r), r);
});
test("no aliases at all is a no-op", () => assert.equal(resolveAlias(undefined, "didache.1.7"), "didache.1.7"));
test("resolution is one step only (chains are rejected by the validator, not followed)", () =>
  assert.equal(resolveAlias({ "didache.1.8": "didache.1.7", "didache.1.7": "didache.1.6" }, "didache.1.8"), "didache.1.7"));
