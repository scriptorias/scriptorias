/**
 * Scriptorias content schema.
 *
 * Content lives as version-controlled JSON under /content and is validated against these
 * schemas by `npm run content:validate`. The same types are used by the app.
 *
 * Identifiers
 * - Entity ids are lowercase slugs: "didache", "early-christian", "lightfoot".
 * - Canonical passage references (Ref) are translation-independent:
 *     "<work>.<section>"            a chapter or section, e.g. "didache.1"
 *     "<work>.<section>.<verse>"    a verse in the work's reference scheme, e.g. "1-enoch.1.9"
 *   They follow the work's own citation system (refScheme), never a translation's segmentation.
 * - Translation segments have local ids "<section>.<n>" that are only meaningful inside one
 *   translation. A segment is linked to canonical references through `align`.
 */
import { z } from "zod";
export { z };

export const Id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "lowercase slug");
export const Ref = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*\.\d+(?:\.\d+)?$/, "work.section[.verse]");
export const SegmentId = z.string().regex(/^\d+\.\d+[a-z]?$/, "section.n");

/** Verification of a claim, record, alignment, or text. */
export const Verification = z.object({
  status: z.enum(["sample", "unverified", "proposed", "verified"]),
  by: z.string().optional(),
  date: z.string().optional(),
  note: z.string().optional(),
  /** Sources the check was made against. */
  sources: z.array(Id).optional(),
});
export type Verification = z.infer<typeof Verification>;

// ---------- Traditions and collections ----------

export const Tradition = z.object({
  id: Id,
  name: z.string(),
  icon: z.string(),
  status: z.enum(["live", "planned"]),
  order: z.number().int(),
  facets: z.array(z.string()).default([]),
});
export type Tradition = z.infer<typeof Tradition>;

/**
 * A collection groups works for browsing. `kind: "canon"` collections describe a tradition's
 * scriptural canon. Works may belong to any number of collections; membership lives here, not on
 * the work, so a shared book (e.g. Tobit) exists once and is referenced by several canons.
 * Members may also be other collections (e.g. Biblical Canon → The Torah).
 */
export const CollectionMember = z.union([
  z.object({ work: Id, note: z.string().optional() }),
  z.object({ collection: Id, note: z.string().optional() }),
]);
export const Collection = z.object({
  id: Id,
  tradition: Id,
  kind: z.enum(["collection", "canon", "group"]),
  title: z.string(),
  blurb: z.string(),
  intro: z.string().optional(),
  countLabel: z.string().optional(),
  listed: z.boolean().default(true),
  order: z.number().int().optional(),
  sample: z.boolean().default(false),
  verification: Verification.optional(),
  members: z.array(CollectionMember),
});
export type Collection = z.infer<typeof Collection>;

// ---------- Works ----------

export const Author = z.object({
  name: z.string().optional(),
  basis: z.enum(["known", "attributed", "traditional", "anonymous"]),
});
export const DateInfo = z.object({
  label: z.string(),
  sort: z.number(),
  debated: z.union([z.literal(true), z.object({ note: z.string(), sources: z.array(Id).default([]) })]).optional(),
});

/** How a work is cited. Canonical refs must fit this scheme. */
export const RefScheme = z.object({
  type: z.enum(["chapter", "chapter.verse"]),
  sectionLabel: z.string().default("Chapter"),
  sections: z.number().int().positive(),
  note: z.string().optional(),
  verification: Verification,
});
export type RefScheme = z.infer<typeof RefScheme>;

/** Catalog record: small, always loaded. */
export const Work = z.object({
  id: Id,
  title: z.string(),
  tradition: Id,
  blurb: z.string(),
  author: Author.optional(),
  date: DateInfo.optional(),
  partOf: Id.optional(),
  parts: z.array(Id).optional(),
  partLabel: z.string().optional(),
  refScheme: RefScheme.optional(),
});
export type Work = z.infer<typeof Work>;

/** Historical overview: loaded on demand. Every claim carries a basis and a verification. */
export const Fact = z.object({
  label: z.string(),
  value: z.string(),
  basis: z.enum(["established", "disputed", "unknown"]),
  sources: z.array(Id).default([]),
});
export const Paragraph = z.object({
  kind: z.enum(["fact", "interpretation"]),
  text: z.string(),
  sources: z.array(Id).default([]),
});
export const SourceGroup = z.object({ title: z.string(), sources: z.array(Id) });
export const Overview = z.object({
  work: Id,
  verification: Verification,
  aka: z.string().optional(),
  intro: z.string().optional(),
  facts: z.array(Fact).default([]),
  background: z.array(Paragraph).default([]),
  structure: z.array(z.object({ from: z.number().int(), to: z.number().int(), title: z.string() })).default([]),
  sourceGroups: z.array(SourceGroup).default([]),
});
export type Overview = z.infer<typeof Overview>;

export const Manuscript = z.object({
  id: Id,
  work: Id,
  name: z.string(),
  date: z.string(),
  note: z.string(),
  contents: z.array(Ref).default([]),
  images: z.array(z.object({ href: z.string().url(), license: z.string(), credit: z.string() })).default([]),
  sources: z.array(Id).default([]),
  verification: Verification,
});
export type Manuscript = z.infer<typeof Manuscript>;

// ---------- Translations and editions ----------

/**
 * A translation or edition of a work. Planned editions have no text file yet.
 * Provenance records exactly where a text came from and under what terms.
 */
export const Translation = z.object({
  id: Id,
  work: Id,
  label: z.string(),
  detail: z.string(),
  language: z.string(),
  year: z.number().int().optional(),
  kind: z.enum(["translation", "original", "edition"]),
  status: z.enum(["available", "planned"]),
  default: z.boolean().default(false),
  license: z.object({ name: z.string(), url: z.string().url().optional() }),
  attribution: z.string().optional(),
  source: z.object({ label: z.string(), href: z.string().url(), retrieved: z.string().optional() }).optional(),
  importer: z.object({ name: z.string(), raw: z.string(), sections: z.array(z.number().int()), options: z.record(z.unknown()).optional() }).optional(),
  coverage: z.object({ sections: z.array(z.number().int()), note: z.string().optional() }).optional(),
  italics: z.string().optional(),
  /** Passage numbers shown in the reader: the source's own labels, or canonical verse numbers. */
  numbering: z.enum(["source", "canonical"]).default("canonical"),
  verification: Verification,
});
export type Translation = z.infer<typeof Translation>;

export const Run = z.object({ t: z.string(), em: z.literal(true).optional() });
export const Line = z.union([z.string(), z.object({ t: z.string(), stanza: z.literal(true) })]);
export const Segment = z.object({
  id: SegmentId,
  n: z.string(),
  runs: z.array(Run).optional(),
  lines: z.array(Line).optional(),
  stanza: z.literal(true).optional(),
});
export type Segment = z.infer<typeof Segment>;
export const TextSection = z.object({ n: z.number().int(), title: z.string().optional(), segments: z.array(Segment) });
export const Text = z.object({ work: Id, translation: Id, sections: z.array(TextSection) });
export type Text = z.infer<typeof Text>;

/**
 * Alignment maps translation segments onto canonical references. Segments not listed are
 * anchored only at section level. Alignment carries its own verification status.
 */
export const Alignment = z.object({
  work: Id,
  translation: Id,
  verification: Verification,
  segments: z.record(SegmentId, z.array(Ref)),
});
export type Alignment = z.infer<typeof Alignment>;

// ---------- Connections, notes, sources, pathways ----------

export const Target = z.union([
  z.object({ work: Id, ref: Ref.optional() }),
  z.object({ label: z.string() }),
]);
export type Target = z.infer<typeof Target>;

export const Connection = z.object({
  from: z.object({ work: Id, ref: Ref.optional() }),
  to: Target,
  rel: z.string(),
  inverse: z.string().optional(),
  note: z.string(),
  disputed: z.boolean().default(false),
  sources: z.array(Id).default([]),
  verification: Verification,
});
export type Connection = z.infer<typeof Connection>;

/** Reader notes attached to canonical references (section- or verse-level). */
export const Note = z.object({
  ref: Ref,
  kind: z.string(),
  title: z.string(),
  note: z.string(),
  to: Target.optional(),
  sources: z.array(Id).default([]),
  verification: Verification,
});
export type Note = z.infer<typeof Note>;

export const Source = z.object({
  id: Id,
  type: z.enum(["book", "article", "edition", "web", "catalog"]),
  citation: z.string(),
  href: z.string().url().optional(),
  verification: Verification,
});
export type Source = z.infer<typeof Source>;

/** Pathway steps point at works and canonical refs; they never copy text. */
export const Pathway = z.object({
  id: Id,
  title: z.string(),
  blurb: z.string(),
  sample: z.boolean().default(false),
  steps: z.array(z.object({ title: z.string(), note: z.string(), target: Target })),
});
export type Pathway = z.infer<typeof Pathway>;
