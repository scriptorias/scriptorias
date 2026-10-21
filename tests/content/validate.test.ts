/**
 * Editorial validation rules (docs/EDITORIAL.md). Each case copies the real content tree,
 * breaks one rule, and expects the validator to reject it with a specific message.
 *
 *   npm run test:content
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

const ROOT = path.resolve(import.meta.dirname, "../..");
const VALIDATE = path.join(ROOT, "scripts/content/validate.ts");

function withContent(mutate: (dir: string) => void) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sc-content-"));
  fs.cpSync(path.join(ROOT, "content"), dir, { recursive: true });
  mutate(dir);
  const r = spawnSync(process.execPath, ["--import", "tsx", VALIDATE], { env: { ...process.env, CONTENT_DIR: dir }, encoding: "utf8" });
  fs.rmSync(dir, { recursive: true, force: true });
  return { ok: r.status === 0, out: r.stdout + r.stderr };
}
const edit = (dir: string, file: string, f: (d: any) => void) => {
  const p = path.join(dir, file);
  const d = JSON.parse(fs.readFileSync(p, "utf8"));
  f(d);
  fs.writeFileSync(p, JSON.stringify(d, null, 2));
};
const rejects = (mutate: (dir: string) => void, message: RegExp) => {
  const r = withContent(mutate);
  assert.equal(r.ok, false, "validator should fail");
  assert.match(r.out, message);
};

const LF = "works/didache/translations/lightfoot/translation.json";
const OV = "works/didache/overview.json";
const ALIGN = "works/didache/translations/lightfoot/alignment.json";

test("current content passes", () => {
  const r = withContent(() => {});
  assert.equal(r.ok, true, r.out);
});

test("citations must resolve to sources.json", () =>
  rejects((d) => edit(d, OV, (o) => o.facts[0].sources.push({ source: "no-such-source", locator: "p. 1" })), /unknown source "no-such-source"/));

test("reviews must name a recorded reviewer", () =>
  rejects((d) => edit(d, ALIGN, (a) => (a.editorial.reviews[0].by = "someone")), /unknown reviewer "someone"/));

test("proofread needs a recorded check", () =>
  rejects((d) => edit(d, LF, (t) => (t.editorial.transcription = "proofread")), /'proofread' needs a recorded passing/));

test("editor-reviewed needs a qualified tier A reviewer (the assistant is not one)", () =>
  rejects((d) => edit(d, ALIGN, (a) => (a.editorial.transcription = "editor-reviewed")), /'editor-reviewed' needs a passing tier A review by a qualified reviewer/));

test("approved claims need a qualified reviewer", () =>
  rejects((d) => edit(d, "works/didache/manuscripts.json", (m) => {
    const r = m.find((x: any) => x.id === "p-oxy-1782");
    r.editorial.review = "approved";
    r.editorial.reviews.push({ by: "consuelo", date: "2026-10-20", tier: "A", aspect: "claims", result: "pass", against: [] });
  }), /'approved' needs a passing tier A claims review by a qualified reviewer/));

test("placeholder content cannot carry reviewed claims", () =>
  rejects((d) => edit(d, OV, (o) => (o.facts[0].review = "reviewed")), /placeholder overview cannot contain reviewed claims/));

test("provenance confirmed needs a provenance review", () =>
  rejects((d) => edit(d, LF, (t) => (t.editorial.provenance = "confirmed")), /provenance 'confirmed' needs/));

test("rights cannot be cleared while legal review is outstanding", () =>
  rejects((d) => edit(d, LF, (t) => { t.rights.decision = "cleared"; t.rights.decidedBy = "publisher"; }), /rights cleared but .* legal review/));

test("only the publisher clears rights", () =>
  rejects((d) => edit(d, LF, (t) => {
    t.rights.decision = "cleared"; t.rights.decidedBy = "consuelo";
    for (const k of ["work", "edition", "digitization", "siteTerms"]) if (t.rights[k]) t.rights[k].legalReview = "done";
  }), /only be cleared by the publisher/));

test("available translations need a rights record", () =>
  rejects((d) => edit(d, LF, (t) => delete t.rights), /needs a rights record/));

test("consult-only sources (Holmes) cannot be an edition base", () =>
  rejects((d) => edit(d, LF, (t) => (t.edition.source = "holmes-2007")), /consult-only|role/));

test("raw snapshots need a NOTICE.md", () =>
  rejects((d) => fs.rmSync(path.join(d, "_raw/wikisource/didache-lightfoot/NOTICE.md")), /NOTICE\.md/));

test("ref aliases must point at real refs and not chain", () => {
  rejects((d) => edit(d, "works/didache/work.json", (w) => (w.refAliases = { "didache.1.9": "didache.1.99" })), /didache\.1\.99/);
  rejects((d) => edit(d, "works/didache/work.json", (w) => (w.refAliases = { "didache.1.9": "didache.1.5", "didache.1.5": "didache.1.4" })), /no chains/);
});

test("corrections keep the printed reading and need review before adoption", () =>
  rejects((d) => fs.writeFileSync(path.join(d, "works/didache/translations/lightfoot/corrections.json"), JSON.stringify([{
    id: "c1", segment: "1.1", printed: "x", proposed: "y", basis: [{ source: "lake-1912-apostolic-fathers", locator: "p. 308" }], status: "adopted", reviews: [],
  }])), /adopting a correction needs/));

test("publication gate blocks a published work without approval and clearance", () =>
  rejects((d) => edit(d, "works/didache/work.json", (w) => (w.publication = { status: "published" })), /approved by the publisher[\s\S]*placeholder|approved by the publisher/));

test("an alias cannot replace a live ref", () =>
  rejects((d) => edit(d, "works/didache/work.json", (w) => (w.refAliases = { "didache.1.5": "didache.1.6" })), /still a live ref/));

test("a valid alias for a retired ref passes", () => {
  const r = withContent((d) => edit(d, "works/didache/work.json", (w) => (w.refAliases = { "didache.1.7": "didache.1.6" })));
  assert.equal(r.ok, true, r.out);
});
