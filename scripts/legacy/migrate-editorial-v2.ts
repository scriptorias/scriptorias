/**
 * One-time migration of content records from the v0.1 `verification` field to the editorial
 * model (docs/EDITORIAL.md). Kept for the record.
 *
 *   npx tsx scripts/legacy/migrate-editorial-v2.ts
 *
 * Mapping:
 *   sample (prose we wrote for design)            → content: placeholder
 *   sample (real text imported from a source)      → content: authentic, transcription: unchecked, provenance: recorded
 *   unverified                                     → content: authentic (claims: review draft)
 *   proposed (divisions/alignment cross-checked)   → content: authentic, transcription: proofread + the documented check
 */
import fs from "node:fs";
import path from "node:path";

const CONTENT = path.resolve(import.meta.dirname, "../../content");
const read = (f: string) => JSON.parse(fs.readFileSync(f, "utf8"));
const write = (f: string, d: unknown) => fs.writeFileSync(f, JSON.stringify(d, null, 2) + "\n");
const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (e.name === "_raw" ? [] : walk(path.join(dir, e.name))) : e.name.endsWith(".json") ? [path.join(dir, e.name)] : []));

type V = { status: string; note?: string; sources?: string[]; by?: string; date?: string } | undefined;

function placeholder(note?: string) { return { content: "placeholder", ...(note ? { note } : {}), reviews: [] }; }

for (const file of walk(CONTENT)) {
  const rel = path.relative(CONTENT, file);
  const data = read(file);
  const name = path.basename(file);
  let changed = false;
  const fix = (o: any, f: (v: V) => object) => { if (o && "verification" in o) { o.editorial = f(o.verification); delete o.verification; changed = true; } };

  if (rel.startsWith("collections/")) {
    if (data.sample) { data.editorial = placeholder("Sample metadata written for interface design."); delete data.sample; changed = true; }
    else if ("sample" in data) { delete data.sample; changed = true; }
    fix(data, (v) => ({ content: "authentic", review: "draft", ...(v?.note ? { note: v.note } : {}), reviews: [] }));
  } else if (rel.startsWith("pathways/")) {
    if ("sample" in data) { data.editorial = placeholder("Sample pathway written for interface design."); delete data.sample; changed = true; }
  } else if (name === "work.json" && data.refScheme?.verification) {
    const v: V = data.refScheme.verification;
    data.refScheme.editorial = { content: "authentic", transcription: "unchecked", ...(v?.note ? { note: v.note } : {}), reviews: [] };
    if (v?.sources?.length) {
      data.refScheme.editorial.reviews.push({
        by: "consuelo", date: "2026-10-20", tier: "A", aspect: "divisions", result: "pass", sections: [1],
        against: v.sources, method: "Compared chapter 1 verse boundaries in two named witnesses (docs/REFERENCES.md).",
      });
    }
    delete data.refScheme.verification; changed = true;
  } else if (name === "overview.json") {
    fix(data, () => placeholder("Overview written for interface design; to be replaced with cited research."));
    for (const x of [...(data.facts ?? []), ...(data.background ?? [])]) { x.review ??= "draft"; changed = true; }
  } else if (name === "manuscripts.json" || name === "connections.json" || name === "notes.json") {
    for (const r of data) fix(r, () => placeholder());
  } else if (name === "translation.json") {
    fix(data, (v) => data.status === "available"
      ? { content: "authentic", transcription: "unchecked", provenance: "recorded", ...(v?.note ? { note: "Imported from a third-party digitization; not yet proofread against the printed edition." } : {}), reviews: [] }
      : { content: "authentic", provenance: "recorded", reviews: [] });
  } else if (name === "alignment.json") {
    fix(data, (v) => v?.status === "proposed" && v.sources?.length
      ? { content: "authentic", transcription: "proofread", note: v.note, reviews: [{
          by: "consuelo", date: "2026-10-20", tier: "A", aspect: "alignment", result: "pass", sections: [1], against: v.sources,
          method: "Each chapter 1 segment assigned to the verse whose incipit it falls under; checked against two witnesses.",
        }] }
      : { content: "authentic", transcription: "unchecked", ...(v?.note ? { note: v.note } : {}), reviews: [] });
  } else if (name === "sources.json") {
    for (const r of data) fix(r, (v) => ({ content: "authentic", provenance: "recorded", ...(v?.note ? { note: v.note } : {}), reviews: [] }));
  }
  if (changed) { write(file, data); console.log("migrated", rel); }
}
