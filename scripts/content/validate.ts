/**
 * Validates every file under /content against the schema, then checks references between them.
 *   npm run content:validate
 */
import path from "node:path";
import type { ZodTypeAny } from "zod";
import * as S from "../../src/content/schema.ts";
import { CONTENT, exists, listDirs, listJson, readJson, rel } from "./load.ts";

const errors: string[] = [];
const warnings: string[] = [];
const err = (where: string, msg: string) => errors.push(`${where}: ${msg}`);
const warn = (where: string, msg: string) => warnings.push(`${where}: ${msg}`);

function parse<T extends ZodTypeAny>(schema: T, file: string): S.z.infer<T> | null {
  const r = schema.safeParse(readJson(file));
  if (!r.success) {
    for (const i of r.error.issues) err(rel(file), `${i.path.join(".") || "(root)"}: ${i.message}`);
    return null;
  }
  return r.data;
}

// ---------- Load ----------
const traditions = parse(S.z.array(S.Tradition), path.join(CONTENT, "traditions.json")) ?? [];
const sources = parse(S.z.array(S.Source), path.join(CONTENT, "sources.json")) ?? [];
const collections = listJson(path.join(CONTENT, "collections")).map((f) => [f, parse(S.Collection, f)] as const);
const pathways = listJson(path.join(CONTENT, "pathways")).map((f) => [f, parse(S.Pathway, f)] as const);

type WorkBundle = {
  dir: string;
  work: S.Work;
  overview?: S.Overview | null;
  manuscripts?: S.Manuscript[] | null;
  connections?: S.Connection[] | null;
  notes?: S.Note[] | null;
  translations: { dir: string; tr: S.Translation; text?: S.Text | null; alignment?: S.Alignment | null }[];
};
const works = new Map<string, WorkBundle>();
for (const id of listDirs(path.join(CONTENT, "works"))) {
  const dir = path.join(CONTENT, "works", id);
  const f = (n: string) => path.join(dir, n);
  if (!exists(f("work.json"))) { err(rel(dir), "missing work.json"); continue; }
  const work = parse(S.Work, f("work.json"));
  if (!work) continue;
  if (work.id !== id) err(rel(f("work.json")), `id "${work.id}" does not match folder "${id}"`);
  const b: WorkBundle = { dir, work, translations: [] };
  if (exists(f("overview.json"))) b.overview = parse(S.Overview, f("overview.json"));
  if (exists(f("manuscripts.json"))) b.manuscripts = parse(S.z.array(S.Manuscript), f("manuscripts.json"));
  if (exists(f("connections.json"))) b.connections = parse(S.z.array(S.Connection), f("connections.json"));
  if (exists(f("notes.json"))) b.notes = parse(S.z.array(S.Note), f("notes.json"));
  for (const tid of listDirs(f("translations"))) {
    const tdir = path.join(f("translations"), tid);
    const tr = parse(S.Translation, path.join(tdir, "translation.json"));
    if (!tr) continue;
    const t: WorkBundle["translations"][number] = { dir: tdir, tr };
    if (exists(path.join(tdir, "text.json"))) t.text = parse(S.Text, path.join(tdir, "text.json"));
    if (exists(path.join(tdir, "alignment.json"))) t.alignment = parse(S.Alignment, path.join(tdir, "alignment.json"));
    b.translations.push(t);
  }
  works.set(id, b);
}

// ---------- Reference checks ----------
const traditionIds = new Set(traditions.map((t) => t.id));
const collectionIds = new Set(collections.flatMap(([, c]) => (c ? [c.id] : [])));
const sourceIds = new Set(sources.map((s) => s.id));
const checkSources = (where: string, ids: string[]) => ids.forEach((s) => sourceIds.has(s) || err(where, `unknown source "${s}"`));

function checkRef(where: string, ref: string) {
  const [workId, section, verse] = ref.split(".");
  const b = works.get(workId);
  if (!b) return err(where, `ref "${ref}": unknown work "${workId}"`);
  const scheme = b.work.refScheme;
  if (!scheme) return err(where, `ref "${ref}": work "${workId}" has no refScheme`);
  if (Number(section) < 1 || Number(section) > scheme.sections) err(where, `ref "${ref}": ${scheme.sectionLabel.toLowerCase()} out of range 1–${scheme.sections}`);
  if (verse && scheme.type !== "chapter.verse") err(where, `ref "${ref}": scheme "${scheme.type}" has no verses`);
}
/** Verse-level refs should land on aligned text somewhere, or readers can't reach them. */
function checkReachable(where: string, ref: string) {
  const [workId, , verse] = ref.split(".");
  if (!verse) return;
  const b = works.get(workId);
  const hit = b?.translations.some((t) => t.alignment && Object.values(t.alignment.segments).some((refs) => refs.includes(ref)));
  if (!hit) warn(where, `ref "${ref}" is not aligned in any available translation`);
}
function checkTarget(where: string, t: S.Target) {
  if ("work" in t) {
    if (!works.has(t.work)) err(where, `unknown work "${t.work}"`);
    else if (t.ref) {
      if (!t.ref.startsWith(t.work + ".")) err(where, `ref "${t.ref}" does not belong to work "${t.work}"`);
      checkRef(where, t.ref);
      checkReachable(where, t.ref);
    }
  }
}

for (const t of traditions) if (traditions.filter((x) => x.id === t.id).length > 1) err("traditions.json", `duplicate id "${t.id}"`);

const memberOf = new Map<string, string[]>();
for (const [file, c] of collections) {
  if (!c) continue;
  const where = rel(file);
  if (path.basename(file, ".json") !== c.id) err(where, `id "${c.id}" does not match file name`);
  if (!traditionIds.has(c.tradition)) err(where, `unknown tradition "${c.tradition}"`);
  if (c.sample && !c.verification) { /* sample flag alone is fine */ }
  for (const m of c.members) {
    if ("work" in m) {
      if (!works.has(m.work)) err(where, `unknown work "${m.work}"`);
      memberOf.set(m.work, [...(memberOf.get(m.work) ?? []), c.id]);
    } else if (!collectionIds.has(m.collection)) err(where, `unknown collection "${m.collection}"`);
    else if (m.collection === c.id) err(where, "collection contains itself");
  }
}

for (const [id, b] of works) {
  const w = rel(path.join(b.dir, "work.json"));
  if (!traditionIds.has(b.work.tradition)) err(w, `unknown tradition "${b.work.tradition}"`);
  if (b.work.partOf) {
    const parent = works.get(b.work.partOf);
    if (!parent) err(w, `partOf unknown work "${b.work.partOf}"`);
    else if (!parent.work.parts?.includes(id)) err(w, `parent "${b.work.partOf}" does not list this work in parts`);
  } else if (!memberOf.has(id)) err(w, "work belongs to no collection");
  for (const p of b.work.parts ?? []) if (works.get(p)?.work.partOf !== id) err(w, `part "${p}" missing or not marked partOf "${id}"`);

  if (b.work.refScheme) checkSources(w, b.work.refScheme.verification.sources ?? []);
  if (b.overview) {
    const where = rel(path.join(b.dir, "overview.json"));
    if (b.overview.work !== id) err(where, `work "${b.overview.work}" does not match folder`);
    const max = b.work.refScheme?.sections;
    for (const s of b.overview.structure) {
      if (s.from > s.to) err(where, `structure "${s.title}": from > to`);
      if (max && s.to > max) err(where, `structure "${s.title}" exceeds ${max} sections`);
    }
    b.overview.facts.forEach((f) => checkSources(where, f.sources));
    b.overview.background.forEach((p) => checkSources(where, p.sources));
    b.overview.sourceGroups.forEach((g) => checkSources(where, g.sources));
  }
  for (const m of b.manuscripts ?? []) {
    const where = rel(path.join(b.dir, "manuscripts.json"));
    if (m.work !== id) err(where, `${m.id}: work "${m.work}" does not match folder`);
    m.contents.forEach((r) => checkRef(where, r));
    checkSources(where, m.sources);
  }
  for (const c of b.connections ?? []) {
    const where = rel(path.join(b.dir, "connections.json"));
    if (c.from.work !== id) err(where, `connection from "${c.from.work}" stored under "${id}"`);
    if (c.from.ref) checkRef(where, c.from.ref);
    checkTarget(where, c.to);
    checkSources(where, c.sources);
  }
  for (const n of b.notes ?? []) {
    const where = rel(path.join(b.dir, "notes.json"));
    if (!n.ref.startsWith(id + ".")) err(where, `note ref "${n.ref}" does not belong to "${id}"`);
    checkRef(where, n.ref);
    checkReachable(where, n.ref);
    if (n.to) checkTarget(where, n.to);
    checkSources(where, n.sources);
  }

  const defaults = b.translations.filter((t) => t.tr.default && t.tr.status === "available");
  if (b.translations.some((t) => t.tr.status === "available") && defaults.length !== 1) err(rel(b.dir), `needs exactly one available default translation (found ${defaults.length})`);
  for (const t of b.translations) {
    const where = rel(path.join(t.dir, "translation.json"));
    if (t.tr.id !== path.basename(t.dir)) err(where, `id "${t.tr.id}" does not match folder`);
    if (t.tr.work !== id) err(where, `work "${t.tr.work}" does not match folder`);
    if (t.tr.status === "available") {
      if (!t.text) { err(where, "available translation has no text.json"); continue; }
      if (!t.tr.source) err(where, "available translation needs a source");
      if (!b.work.refScheme) err(where, "work needs a refScheme before texts are added");
    } else if (t.text) err(where, "planned translation should not have text.json");
    if (!t.text) continue;
    const tw = rel(path.join(t.dir, "text.json"));
    if (t.text.work !== id || t.text.translation !== t.tr.id) err(tw, "work/translation does not match folder");
    const ids = new Set<string>();
    for (const s of t.text.sections) {
      if (b.work.refScheme && s.n > b.work.refScheme.sections) err(tw, `section ${s.n} exceeds refScheme`);
      for (const seg of s.segments) {
        if (ids.has(seg.id)) err(tw, `duplicate segment id "${seg.id}"`);
        ids.add(seg.id);
        if (!seg.id.startsWith(`${s.n}.`)) err(tw, `segment "${seg.id}" outside section ${s.n}`);
        if (!seg.runs === !seg.lines) err(tw, `segment "${seg.id}" needs exactly one of runs or lines`);
      }
    }
    const covered = t.tr.coverage?.sections ?? [];
    const present = t.text.sections.map((s) => s.n);
    if (covered.join() !== present.join()) err(where, `coverage [${covered}] does not match text sections [${present}]`);
    if (t.alignment) {
      const aw = rel(path.join(t.dir, "alignment.json"));
      checkSources(aw, t.alignment.verification.sources ?? []);
      for (const [segId, refs] of Object.entries(t.alignment.segments)) {
        if (!ids.has(segId)) err(aw, `unknown segment "${segId}"`);
        for (const r of refs) {
          if (!r.startsWith(`${id}.${segId.split(".")[0]}.`)) err(aw, `segment "${segId}" aligned outside its section: "${r}"`);
          checkRef(aw, r);
        }
      }
    }
  }
}

for (const [file, p] of pathways) {
  if (!p) continue;
  const where = rel(file);
  if (path.basename(file, ".json") !== p.id) err(where, `id "${p.id}" does not match file name`);
  p.steps.forEach((s) => checkTarget(where, s.target));
}

// ---------- Report ----------
for (const w of warnings) console.warn(`warning  ${w}`);
for (const e of errors) console.error(`error    ${e}`);
const n = works.size, t = [...works.values()].reduce((a, b) => a + b.translations.length, 0);
console.log(`${errors.length ? "✗" : "✓"} ${traditions.length} traditions, ${collections.length} collections, ${n} works, ${t} translations/editions, ${pathways.length} pathways · ${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
