/**
 * The Lightfoot & Harmer (1891) Didache editions are generated from the SCRIPTORIAS working
 * transcription files (scripts/content/import-lightfoot-1891.ts). The text is never edited:
 *   - always: the committed text.json rebuilds files whose SHA-256 match translation.json
 *     provenance, and every generated file is what the importer produces from them;
 *   - when the working files are present ($SCRIPTORIAS_TRANSCRIPTIONS/transcription/), they are
 *     byte-identical to the rebuild; otherwise that test is skipped (e.g. in CI).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { EDITIONS, generate, hasSource, rebuiltFiles, sha256, sourceFromEnv, trDir } from "../../scripts/content/import-lightfoot-1891.ts";
import { CONTENT, stringify } from "../../scripts/content/load.ts";
import type { RefMap, Text, Translation } from "../../src/content/schema.ts";

const read = <T,>(f: string): T => JSON.parse(fs.readFileSync(f, "utf8"));
const SOURCE = sourceFromEnv();

for (const cfg of EDITIONS) {
  test(`${cfg.translation}: text.json rebuilds the recorded transcription files (SHA-256)`, () => {
    const tr = read<Translation>(path.join(trDir(cfg.translation), "translation.json"));
    const rec = tr.provenance!.workingFiles!;
    assert.match(rec.commit, /^[0-9a-f]{40}$/);
    const files = rebuiltFiles(cfg);
    assert.deepEqual(files.map((f) => f.name), cfg.files);
    files.forEach((f, i) => {
      assert.equal(f.bytes.length, rec.files[i].bytes, f.name);
      assert.equal(sha256(f.bytes), rec.files[i].sha256, f.name);
    });
  });

  test(`${cfg.translation}: byte-for-byte against the working files`, { skip: hasSource(SOURCE) ? false : "working transcription files not present (set SCRIPTORIAS_TRANSCRIPTIONS)" }, () => {
    for (const f of rebuiltFiles(cfg)) assert.ok(fs.readFileSync(path.join(SOURCE!, "transcription", f.name)).equals(f.bytes), `${f.name} differs`);
  });
}

test("every generated file matches the importer output", () => {
  for (const [f, data] of generate(rebuiltFiles)) assert.equal(fs.readFileSync(path.join(CONTENT, f), "utf8"), stringify(data), f);
});

test("structure: 16 chapters each; Greek XVI has printed verses 1–7 and no 16.8", () => {
  for (const cfg of EDITIONS) {
    const text = read<Text>(path.join(trDir(cfg.translation), "text.json"));
    assert.deepEqual(text.sections.map((s) => s.n), Array.from({ length: 16 }, (_, i) => i + 1));
  }
  const grc = read<Text>(path.join(trDir("lightfoot-1891-grc"), "text.json"));
  assert.deepEqual(grc.sections[15].segments.map((s) => s.id), ["16.1", "16.2", "16.3", "16.4", "16.5", "16.6", "16.7"]);
  assert.deepEqual(grc.sections[15].segments.map((s) => s.label), ["XVI.", "2.", "3.", "4.", "5.", "6.", "7."]);
});

test("16.8 maps to Lightfoot XVI.7 as a provisional (uncertain) mapping; 16.6–7 to XVI.6", () => {
  const map = read<RefMap>(path.join(trDir("lightfoot-1891-grc"), "refmap.json"));
  const m7 = map.mappings.find((m) => m.segments.join() === "16.7")!;
  assert.deepEqual(m7.refs, ["didache.16.8"]);
  assert.equal(m7.certainty, "uncertain");
  const m6 = map.mappings.find((m) => m.segments.join() === "16.6")!;
  assert.deepEqual(m6.refs, ["didache.16.6", "didache.16.7"]);
  assert.equal(m6.kind, "one-to-many");
});

test("English: no verse numbers printed; verse alignment only in chapters 1 and 16, editorial", () => {
  const map = read<RefMap>(path.join(trDir("lightfoot-1891-en"), "refmap.json"));
  assert.equal(map.printsVerses, false);
  const verse = map.mappings.filter((m) => m.level === "verse");
  assert.ok(verse.every((m) => m.basis === "editorial"));
  assert.deepEqual([...new Set(verse.map((m) => m.refs[0].split(".")[1]))], ["1", "16"]);
});

/** Greek verse openings agree with the Greek witness (≥2 of the first 3 words, accents ignored). */
test("Greek verse openings agree with the Greek Wikisource witness", () => {
  const g = fs.readFileSync(path.join(CONTENT, "_raw/wikisource/verification/didache-greek.wikitext"), "utf8");
  const witness = new Map<string, string>();
  for (const m of g.matchAll(/===(\d+)===\n([\s\S]*?)(?=\n===|\n\[\[Κατηγορία)/g)) {
    const parts = m[2].split(/(?:^|(?<=\s))(\d{1,2}) (?=\S)/);
    for (let i = 1; i < parts.length; i += 2) witness.set(`didache.${m[1]}.${parts[i]}`, parts[i + 1]);
  }
  const norm = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/ς/g, "σ").replace(/[^\p{L}\s]/gu, " ").split(/\s+/).filter(Boolean).slice(0, 3);
  const agree = (a: string, b: string) => { const x = norm(a), y = norm(b); return x.filter((w, i) => w === y[i]).length >= 2; };
  const map = read<RefMap>(path.join(trDir("lightfoot-1891-grc"), "refmap.json"));
  const text = read<Text>(path.join(trDir("lightfoot-1891-grc"), "text.json"));
  const segs = new Map(text.sections.flatMap((s) => s.segments.map((g2) => [g2.id, (g2.runs ?? []).map((r) => r.t).join("")] as const)));
  let checked = 0;
  const bad: string[] = [];
  for (const m of map.mappings.filter((x) => x.level === "verse")) for (const r of m.refs) {
    const w = witness.get(r);
    assert.ok(w, `${r} missing from witness`);
    const words = m.starts?.[r] ?? segs.get(m.segments[0])!;
    if (!agree(words, w)) bad.push(r);
    checked++;
  }
  assert.deepEqual(bad, []);
  assert.ok(checked >= 98, `${checked} verse openings checked`);
});

test("recorded Greek edition differences occur in the text", () => {
  const text = read<Text>(path.join(trDir("lightfoot-1891-grc"), "text.json"));
  const all = text.sections.flatMap((s) => s.segments.flatMap((g) => (g.runs ?? []).map((r) => r.t))).join("");
  for (const w of ["ποιήσεις", "μαρὰν ἀθά", "καθῆσθαι", "προεξομολογησάμενοι", "κοσμοπλανὴς", "κελεύεις", "σιαγονα"]) assert.ok(all.includes(w), w);
});
