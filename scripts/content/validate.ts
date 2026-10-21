/**
 * Validates every file under /content against the schema, then checks references between them.
 *   npm run content:validate
 */
import fs from "node:fs";
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
const reviewersFile = path.join(CONTENT, "editorial", "reviewers.json");
const reviewers = exists(reviewersFile) ? parse(S.z.array(S.Reviewer), reviewersFile) ?? [] : [];

type WorkBundle = {
  dir: string;
  work: S.Work;
  overview?: S.Overview | null;
  manuscripts?: S.Manuscript[] | null;
  connections?: S.Connection[] | null;
  notes?: S.Note[] | null;
  questions?: S.EditorialQuestion[] | null;
  differences?: S.EditionDifference[] | null;
  translations: { dir: string; tr: S.Translation; text?: S.Text | null; alignment?: S.Alignment | null; refmap?: S.RefMap | null; corrections?: S.Correction[] | null; revisions?: S.Revision[] | null }[];
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
  if (exists(f("questions.json"))) b.questions = parse(S.z.array(S.EditorialQuestion), f("questions.json"));
  if (exists(f("differences.json"))) b.differences = parse(S.z.array(S.EditionDifference), f("differences.json"));
  for (const tid of listDirs(f("translations"))) {
    const tdir = path.join(f("translations"), tid);
    const tr = parse(S.Translation, path.join(tdir, "translation.json"));
    if (!tr) continue;
    const t: WorkBundle["translations"][number] = { dir: tdir, tr };
    if (exists(path.join(tdir, "text.json"))) t.text = parse(S.Text, path.join(tdir, "text.json"));
    if (exists(path.join(tdir, "alignment.json"))) t.alignment = parse(S.Alignment, path.join(tdir, "alignment.json"));
    if (exists(path.join(tdir, "refmap.json"))) t.refmap = parse(S.RefMap, path.join(tdir, "refmap.json"));
    if (exists(path.join(tdir, "corrections.json"))) t.corrections = parse(S.z.array(S.Correction), path.join(tdir, "corrections.json"));
    if (exists(path.join(tdir, "revisions.json"))) t.revisions = parse(S.z.array(S.Revision), path.join(tdir, "revisions.json"));
    b.translations.push(t);
  }
  works.set(id, b);
}

// ---------- Reference checks ----------
const traditionIds = new Set(traditions.map((t) => t.id));
const collectionIds = new Set(collections.flatMap(([, c]) => (c ? [c.id] : [])));
const sourceIds = new Set(sources.map((s) => s.id));
const sourceById = new Map(sources.map((s) => [s.id, s]));
const reviewerById = new Map(reviewers.map((r) => [r.id, r]));
const checkSources = (where: string, cites: S.Citation[]) =>
  cites.forEach((c) => sourceIds.has(S.citationSource(c)) || err(where, `unknown source "${S.citationSource(c)}"`));

// ---------- Editorial rules (docs/EDITORIAL.md) ----------
const isQualified = (id: string) => {
  const r = reviewerById.get(id);
  return Boolean(r?.qualified && r.roles.some((x) => x === "reviewer" || x === "editor"));
};
const passes = (ed: S.Editorial, aspects: S.Review["aspect"][], opts: { qualified?: boolean; tierA?: boolean } = {}) =>
  ed.reviews.some((r) => r.result === "pass" && aspects.includes(r.aspect) && (!opts.tierA || r.tier === "A") && (!opts.qualified || isQualified(r.by)));

function checkReviews(where: string, reviews: S.Review[]) {
  for (const r of reviews) {
    if (!reviewerById.has(r.by)) err(where, `review by unknown reviewer "${r.by}" (add to editorial/reviewers.json)`);
    checkSources(where, r.against);
  }
}

/** Status claims must be backed by recorded reviews; tier A statuses need a qualified reviewer. */
function checkEditorial(where: string, ed: S.Editorial | undefined) {
  if (!ed) return;
  checkReviews(where, ed.reviews);
  if (ed.content === "placeholder") {
    if (ed.review && ed.review !== "draft") err(where, "placeholder content cannot be reviewed or approved; replace it with authentic material");
    if (ed.transcription && ed.transcription !== "unchecked") err(where, "placeholder content cannot have a transcription status");
    return;
  }
  if (ed.transcription === "proofread" && !passes(ed, ["transcription", "divisions", "alignment"]))
    err(where, "transcription 'proofread' needs a recorded passing transcription/divisions/alignment check");
  if (ed.transcription === "editor-reviewed" && !passes(ed, ["transcription", "divisions", "alignment"], { qualified: true, tierA: true }))
    err(where, "transcription 'editor-reviewed' needs a passing tier A review by a qualified reviewer");
  if (ed.provenance === "confirmed" && !passes(ed, ["provenance", "rights"]))
    err(where, "provenance 'confirmed' needs a passing provenance review");
  if (ed.review === "reviewed" && !passes(ed, ["claims"])) err(where, "review 'reviewed' needs a passing claims review");
  if (ed.review === "approved" && !passes(ed, ["claims"], { qualified: true, tierA: true }))
    err(where, "review 'approved' needs a passing tier A claims review by a qualified reviewer");
}

function checkRights(where: string, rights: S.Rights | undefined, available: boolean) {
  if (!rights) { if (available) err(where, "available translation needs a rights record"); return; }
  const layers = [["work", rights.work], ["edition", rights.edition], ["digitization", rights.digitization], ["siteTerms", rights.siteTerms]] as const;
  for (const [, l] of layers) if (l) checkSources(where, l.evidence);
  if (rights.decision === "cleared") {
    for (const [name, l] of layers) {
      if (!l) continue;
      if (l.legalReview === "required" || l.legalReview === "recommended") err(where, `rights cleared but ${name} still has legal review "${l.legalReview}"`);
      if (l.status === "unknown" || l.status === "restricted") err(where, `rights cleared but ${name} is "${l.status}"`);
    }
    if (!rights.decidedBy || !reviewerById.get(rights.decidedBy)?.roles.includes("publisher")) err(where, "rights can only be cleared by the publisher (decidedBy)");
  }
}

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
  for (const m of c.members) {
    if ("work" in m) {
      if (!works.has(m.work)) err(where, `unknown work "${m.work}"`);
      memberOf.set(m.work, [...(memberOf.get(m.work) ?? []), c.id]);
    } else if (!collectionIds.has(m.collection)) err(where, `unknown collection "${m.collection}"`);
    else if (m.collection === c.id) err(where, "collection contains itself");
  }
  checkEditorial(where, c.editorial);
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

  if (b.work.refScheme) checkEditorial(w + " refScheme", b.work.refScheme.editorial);
  for (const [from, to] of Object.entries(b.work.refAliases ?? {})) {
    for (const r of [from, to]) if (!r.startsWith(id + ".")) err(w, `ref alias "${r}" does not belong to "${id}"`);
    checkRef(w, to);
    if (to.split(".")[2] && !b.translations.some((t) => t.alignment && Object.values(t.alignment.segments).some((refs) => refs.includes(to))))
      err(w, `ref alias "${from}" → "${to}": target is not aligned in any translation`);
    if (b.work.refAliases?.[to]) err(w, `ref alias "${from}" → "${to}" points to another alias (no chains)`);
    if (b.translations.some((t) => t.alignment && Object.values(t.alignment.segments).some((refs) => refs.includes(from))))
      err(w, `ref alias "${from}" is still a live ref in an alignment; an alias may only replace a retired ref`);
  }
  for (const c of b.work.canonicalStatus ?? []) checkSources(w, c.sources);
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
    checkEditorial(where, b.overview.editorial);
    const claims = [...b.overview.facts, ...b.overview.background];
    if (b.overview.editorial.content === "placeholder" && claims.some((c) => c.review !== "draft")) err(where, "placeholder overview cannot contain reviewed claims");
    if (claims.some((c) => c.review === "reviewed" || c.review === "approved") && !passes(b.overview.editorial, ["claims"])) err(where, "claims marked reviewed need a passing claims review in editorial.reviews");
    if (claims.some((c) => c.review === "approved") && !passes(b.overview.editorial, ["claims"], { qualified: true, tierA: true })) err(where, "claims marked approved need a tier A claims review by a qualified reviewer");
  }
  for (const m of b.manuscripts ?? []) {
    const where = rel(path.join(b.dir, "manuscripts.json"));
    if (m.work !== id) err(where, `${m.id}: work "${m.work}" does not match folder`);
    m.contents.forEach((r) => checkRef(where, r));
    checkSources(where, m.sources);
    checkEditorial(`${where} ${m.id}`, m.editorial);
  }
  for (const c of b.connections ?? []) {
    const where = rel(path.join(b.dir, "connections.json"));
    if (c.from.work !== id) err(where, `connection from "${c.from.work}" stored under "${id}"`);
    if (c.from.ref) checkRef(where, c.from.ref);
    checkTarget(where, c.to);
    checkSources(where, c.sources);
    checkEditorial(where, c.editorial);
  }
  for (const n of b.notes ?? []) {
    const where = rel(path.join(b.dir, "notes.json"));
    if (!n.ref.startsWith(id + ".")) err(where, `note ref "${n.ref}" does not belong to "${id}"`);
    checkRef(where, n.ref);
    checkReachable(where, n.ref);
    if (n.to) checkTarget(where, n.to);
    checkSources(where, n.sources);
    checkEditorial(where, n.editorial);
  }

  const defaults = b.translations.filter((t) => t.tr.default && t.tr.status === "available");
  if (b.translations.some((t) => t.tr.status === "available") && defaults.length !== 1) err(rel(b.dir), `needs exactly one available default translation (found ${defaults.length})`);
  for (const t of b.translations) {
    const where = rel(path.join(t.dir, "translation.json"));
    if (t.tr.id !== path.basename(t.dir)) err(where, `id "${t.tr.id}" does not match folder`);
    if (t.tr.work !== id) err(where, `work "${t.tr.work}" does not match folder`);
    checkEditorial(where, t.tr.editorial);
    checkRights(where, t.tr.rights, t.tr.status === "available");
    if (t.tr.edition) {
      const src = sourceById.get(t.tr.edition.source);
      if (!src) err(where, `edition source "${t.tr.edition.source}" not in sources.json`);
      else if (src.role && !["base-edition", "translation"].includes(src.role)) err(where, `edition source "${src.id}" has role "${src.role}", not base-edition/translation`);
      else if (src.use === "consult-only") err(where, `edition source "${src.id}" is consult-only and cannot be reproduced`);
    }
    if (t.tr.importer) {
      const raw = path.join(CONTENT, t.tr.importer.raw);
      const dir = fs.existsSync(raw) && fs.statSync(raw).isDirectory() ? raw : path.dirname(raw);
      if (!exists(path.join(dir, "NOTICE.md"))) err(where, `raw snapshot ${rel(dir)} has no NOTICE.md (source, licence, attribution)`);
    }
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
    for (const c of t.corrections ?? []) {
      const cw = rel(path.join(t.dir, "corrections.json"));
      if (!ids.has(c.segment)) err(cw, `${c.id}: unknown segment "${c.segment}"`);
      checkSources(cw, c.basis);
      checkReviews(cw, c.reviews);
      if (c.status === "adopted" && !c.reviews.some((r) => r.result === "pass" && r.tier === "A" && isQualified(r.by)))
        err(cw, `${c.id}: adopting a correction needs a passing tier A review by a qualified reviewer`);
    }
    for (const r of t.revisions ?? []) {
      const rw = rel(path.join(t.dir, "revisions.json"));
      if (!reviewerById.has(r.by)) err(rw, `revision ${r.version}: unknown reviewer "${r.by}"`);
      r.refs.forEach((x) => checkRef(rw, x));
    }
    if (t.alignment) {
      const aw = rel(path.join(t.dir, "alignment.json"));
      checkEditorial(aw, t.alignment.editorial);
      for (const [segId, refs] of Object.entries(t.alignment.segments)) {
        if (!ids.has(segId)) err(aw, `unknown segment "${segId}"`);
        for (const r of refs) {
          if (!r.startsWith(`${id}.${segId.split(".")[0]}.`)) err(aw, `segment "${segId}" aligned outside its section: "${r}"`);
          checkRef(aw, r);
        }
      }
    }
    if (t.refmap) checkRefMap(id, t.tr, t.text, t.alignment ?? null, t.refmap, rel(path.join(t.dir, "refmap.json")));
  }

  // Retired translation ids keep resolving: replacement exists, old segments map into it.
  for (const [old, r] of Object.entries(b.work.retiredTranslations ?? {})) {
    const where = `${w} retiredTranslations.${old}`;
    if (b.translations.some((t) => t.tr.id === old)) err(where, "a retired translation id cannot also be a current translation");
    const rep = b.translations.find((t) => t.tr.id === r.replacedBy);
    if (!rep || rep.tr.status !== "available" || !rep.text) { err(where, `replacement "${r.replacedBy}" is not an available translation with text`); continue; }
    const repIdx = new Map(rep.text.sections.flatMap((s) => s.segments.map((g) => [g.id, s.n] as const)));
    const repRefs = new Set(Object.values(rep.alignment?.segments ?? {}).flat());
    for (const [seg, m] of Object.entries(r.segments)) {
      checkRef(where, m.ref);
      const [, sec, verse] = m.ref.split(".");
      if (!m.ref.startsWith(`${id}.`) || Number(sec) !== Number(seg.split(".")[0])) err(where, `old segment ${seg} → ${m.ref}: not in the same ${id} chapter`);
      if (verse && !repRefs.has(m.ref)) err(where, `old segment ${seg} → ${m.ref}: verse not aligned in "${r.replacedBy}"`);
      if (!verse && !m.seg) err(where, `old segment ${seg} resolves only to a chapter: name the replacement segment (seg)`);
      if (m.seg && repIdx.get(m.seg) !== Number(sec)) err(where, `old segment ${seg} → replacement segment ${m.seg} is not in chapter ${sec}`);
    }
  }

  // Open editorial questions and recorded edition differences.
  const trIds = new Set(b.translations.map((t) => t.tr.id));
  const qw = rel(path.join(b.dir, "questions.json"));
  const qids = new Set<string>();
  for (const q of b.questions ?? []) {
    if (qids.has(q.id)) err(qw, `duplicate question "${q.id}"`);
    qids.add(q.id);
    q.refs.forEach((r) => { if (!r.startsWith(id + ".")) err(qw, `${q.id}: ref "${r}" does not belong to "${id}"`); else checkRef(qw, r); });
    q.translations.forEach((tid) => trIds.has(tid) || err(qw, `${q.id}: unknown translation "${tid}"`));
    checkReviews(qw, q.reviews);
    if (q.status === "settled" && !q.reviews.some((r) => r.result === "pass" && r.tier === "A" && isQualified(r.by)))
      err(qw, `${q.id}: only a qualified reviewer can settle an editorial question (tier A review needed); keep it open`);
  }
  const dw = rel(path.join(b.dir, "differences.json"));
  for (const d of b.differences ?? []) {
    d.refs.forEach((r) => { if (!r.startsWith(id + ".")) err(dw, `ref "${r}" does not belong to "${id}"`); else checkRef(dw, r); });
    if (!trIds.has(d.translation)) err(dw, `unknown translation "${d.translation}"`);
    checkSources(dw, [d.witness]);
  }
}

/** Plain text of a segment (runs only). */
function segText(g: S.Segment) { return (g.runs ?? []).map((r) => r.t).join(""); }

/**
 * Edition-aware reference maps (refmap.json): every segment mapped exactly once, kinds and levels
 * consistent, editions that print no verse numbers only aligned editorially, uncertain or split
 * mappings explained, alignment.json exactly the verse-level projection, and no verse inserted
 * into an edition that prints its own numbers.
 */
function checkRefMap(work: string, tr: S.Translation, text: S.Text | null | undefined, alignment: S.Alignment | null, map: S.RefMap, where: string) {
  if (map.work !== work || map.translation !== tr.id) err(where, "work/translation does not match folder");
  checkEditorial(where, map.editorial);
  if (!text) return err(where, "refmap.json needs text.json");
  const segs = new Map(text.sections.flatMap((s) => s.segments.map((g) => [g.id, g] as const)));
  const seen = new Map<string, number>();
  for (const m of map.mappings) {
    const at = `${where} [${m.segments.join(",")}]`;
    m.segments.forEach((s) => { seen.set(s, (seen.get(s) ?? 0) + 1); if (!segs.has(s)) err(at, `unknown segment "${s}"`); });
    const expect = m.refs.length === 0 ? "unmapped" : m.segments.length > 1 && m.refs.length === 1 ? "many-to-one" : m.segments.length === 1 && m.refs.length > 1 ? "one-to-many" : m.segments.length === 1 ? "one-to-one" : "?";
    if (m.kind !== expect) err(at, `kind "${m.kind}" does not fit ${m.segments.length} segment(s) → ${m.refs.length} ref(s)`);
    if ((m.kind === "unmapped") !== (m.level === "none")) err(at, "unmapped entries (only) have level none");
    for (const r of m.refs) {
      if (!r.startsWith(work + ".")) { err(at, `ref "${r}" does not belong to "${work}"`); continue; }
      checkRef(at, r);
      const parts = r.split(".");
      if ((m.level === "verse") !== (parts.length === 3)) err(at, `ref "${r}" does not match level ${m.level}`);
      if (m.segments.some((s) => Number(s.split(".")[0]) !== Number(parts[1]))) err(at, `ref "${r}" crosses a chapter`);
    }
    if (!map.printsVerses && m.level === "verse" && m.basis !== "editorial") err(at, "the edition prints no verse numbers: verse-level mappings must have basis editorial");
    if (m.basis === "editorial" && !(m.note ?? "").toLowerCase().includes("editorial alignment")) err(at, "editorial mappings must say “editorial alignment” in their note");
    if ((m.certainty === "uncertain" || m.kind === "one-to-many") && !m.note) err(at, "uncertain and one-to-many mappings need an explanatory note");
    if (map.printsVerses && m.level === "verse" && m.basis === "original")
      for (const s of m.segments) if (!segs.get(s)?.label) err(at, `segment "${s}" has no printed number: an edition's own numbering cannot gain a verse it does not print`);
    for (const [r, words] of Object.entries(m.starts ?? {})) {
      if (!m.refs.includes(r)) err(at, `starts names ${r}, which is not mapped here`);
      if (!m.segments.map((s) => segText(segs.get(s) ?? { id: s, n: "" })).join("").includes(words)) err(at, `opening "${words}" for ${r} not found in the edition text`);
    }
    checkSources(at, m.against);
    m.alternatives.forEach((a) => { a.refs.forEach((r) => checkRef(at, r)); checkSources(at, a.sources); });
  }
  for (const s of segs.keys()) if (seen.get(s) !== 1) err(where, `segment "${s}" mapped ${seen.get(s) ?? 0} times (must be exactly once)`);
  const proj = Object.fromEntries(map.mappings.filter((m) => m.level === "verse").flatMap((m) => m.segments.map((s) => [s, m.refs])));
  if (JSON.stringify(proj) !== JSON.stringify(alignment?.segments ?? {})) err(where, "alignment.json is not the projection of the verse-level mappings in refmap.json");
}

for (const [file, p] of pathways) {
  if (!p) continue;
  const where = rel(file);
  if (path.basename(file, ".json") !== p.id) err(where, `id "${p.id}" does not match file name`);
  p.steps.forEach((s) => checkTarget(where, s.target));
}

for (const s2 of sources) { checkEditorial(`sources.json ${s2.id}`, s2.editorial); if (s2.rights) checkSources(`sources.json ${s2.id}`, s2.rights.evidence); }

// Every raw snapshot folder must carry a notice (source, licence, attribution, retrieval date).
(function checkRaw(dir: string) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile() && !["NOTICE.md", "README.md", ".DS_Store"].includes(e.name));
  if (files.length && !entries.some((e) => e.name === "NOTICE.md")) err(rel(dir), "raw snapshot folder has no NOTICE.md");
  entries.filter((e) => e.isDirectory()).forEach((e) => checkRaw(path.join(dir, e.name)));
})(path.join(CONTENT, "_raw"));

// ---------- Production hold: works in preview never reach production ----------
// Vercel sets VERCEL_ENV=production for production deployments (main). SCRIPTORIAS_TARGET=production
// simulates one locally. Preview deployments and CI are unaffected.
const PRODUCTION = process.env.VERCEL_ENV === "production" || process.env.SCRIPTORIAS_TARGET === "production";
for (const [, b] of works)
  if (PRODUCTION && b.work.publication?.status === "preview")
    err(`${rel(path.join(b.dir, "work.json"))} (preview)`, "a work in preview cannot be built for production; release it first (publication.status published, approved by the publisher)");

// ---------- Publication gate: only for works marked published ----------
for (const [, b] of works) {
  const pub = b.work.publication;
  if (pub?.status !== "published") continue;
  const where = `${rel(path.join(b.dir, "work.json"))} (published)`;
  if (!pub.approvedBy || !reviewerById.get(pub.approvedBy)?.roles.includes("publisher")) err(where, "publication must be approved by the publisher");
  if (!b.overview || b.overview.editorial.content !== "authentic") err(where, "needs an authentic overview (no placeholder)");
  for (const c of [...(b.overview?.facts ?? []), ...(b.overview?.background ?? [])]) {
    if (!c.sources.some((x) => S.citationLocator(x))) err(where, `claim "${"label" in c ? c.label : c.text.slice(0, 40)}" needs a citation with a page or section locator`);
  }
  for (const [kind, list] of [["note", b.notes], ["connection", b.connections], ["manuscript", b.manuscripts]] as const)
    for (const r of list ?? []) if (r.editorial.content === "placeholder") err(where, `${kind} is still a placeholder`);
  const def = b.translations.find((t) => t.tr.default && t.tr.status === "available");
  if (def) {
    if (def.tr.editorial.provenance !== "confirmed") err(where, `default translation "${def.tr.id}" needs provenance confirmed`);
    if (def.tr.rights?.decision !== "cleared") err(where, `default translation "${def.tr.id}" needs rights cleared`);
    if (def.tr.editorial.transcription === "unchecked") err(where, `default translation "${def.tr.id}" must be at least proofread`);
  }
  if (b.work.refScheme?.editorial.content !== "authentic") err(where, "reference scheme must be authentic");
}

// ---------- Report ----------
for (const w of warnings) console.warn(`warning  ${w}`);
for (const e of errors) console.error(`error    ${e}`);
const n = works.size, t = [...works.values()].reduce((a, b) => a + b.translations.length, 0);
console.log(`${errors.length ? "✗" : "✓"} ${traditions.length} traditions, ${collections.length} collections, ${n} works, ${t} translations/editions, ${pathways.length} pathways · ${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
