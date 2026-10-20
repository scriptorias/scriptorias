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

// ---------- Editorial records (see docs/EDITORIAL.md) ----------
//
// Three questions are tracked separately and never collapsed into one status:
//   transcription  does our text match the named printed edition?        unchecked → proofread → editor-reviewed
//   provenance     are edition, pages, attribution, and rights right?    recorded → confirmed
//   review         has a historical claim been checked against sources?  draft → reviewed → approved
// `content` says whether a record is real material or a design placeholder. Scholarly certainty
// of a claim is its `basis` (established / disputed / unknown), independent of review.

/** A source reference, optionally pinned to a page, folio, or section. */
export const Citation = z.union([Id, z.object({ source: Id, locator: z.string().optional(), note: z.string().optional() })]);
export type Citation = z.infer<typeof Citation>;
export const citationSource = (c: Citation) => (typeof c === "string" ? c : c.source);
export const citationLocator = (c: Citation) => (typeof c === "string" ? undefined : c.locator);

export const ContentKind = z.enum(["placeholder", "authentic"]);
export const TranscriptionStatus = z.enum(["unchecked", "proofread", "editor-reviewed"]);
export const ProvenanceStatus = z.enum(["recorded", "confirmed"]);
export const ClaimReview = z.enum(["draft", "reviewed", "approved"]);

/**
 * One review or check. Tier A (text, divisions, alignment, historical claims) needs a qualified
 * reviewer to raise a record to editor-reviewed / approved; tier B (metadata, provenance, typos in
 * our prose) needs one review; tier C is mechanical and covered by CI.
 */
export const Review = z.object({
  by: Id,
  date: z.string(),
  tier: z.enum(["A", "B", "C"]),
  aspect: z.enum(["transcription", "divisions", "alignment", "provenance", "rights", "claims", "metadata"]),
  result: z.enum(["pass", "changes-requested", "fail"]),
  against: z.array(Citation).default([]),
  sections: z.array(z.number().int()).optional(),
  method: z.string().optional(),
  note: z.string().optional(),
});
export type Review = z.infer<typeof Review>;

export const Editorial = z.object({
  content: ContentKind,
  transcription: TranscriptionStatus.optional(),
  provenance: ProvenanceStatus.optional(),
  review: ClaimReview.optional(),
  note: z.string().optional(),
  reviews: z.array(Review).default([]),
});
export type Editorial = z.infer<typeof Editorial>;

/** People who may record reviews. `qualified` marks an appointed scholarly reviewer (tier A). */
export const Reviewer = z.object({
  id: Id,
  name: z.string(),
  roles: z.array(z.enum(["publisher", "editor", "reviewer", "maintainer", "assistant"])),
  qualified: z.boolean().default(false),
  scope: z.string().optional(),
  appointed: z.string().optional(),
});
export type Reviewer = z.infer<typeof Reviewer>;

/**
 * Rights are decided per layer: the ancient work, the printed edition or translation, the
 * digitization our transcription was made from, and the terms of the website hosting it.
 * A decision is never final while any layer still needs legal review.
 */
export const RightsLayer = z.object({
  status: z.enum(["public-domain", "licensed", "permission", "restricted", "unknown", "not-applicable"]),
  basis: z.string(),
  jurisdictions: z.record(z.string()).optional(),
  license: z.object({ name: z.string(), url: z.string().url().optional() }).optional(),
  obligations: z.array(z.string()).default([]),
  legalReview: z.enum(["required", "recommended", "not-needed", "done"]),
  evidence: z.array(Citation).default([]),
});
export const Rights = z.object({
  work: RightsLayer,
  edition: RightsLayer,
  digitization: RightsLayer,
  siteTerms: RightsLayer.optional(),
  ours: z.object({ license: z.string(), status: z.enum(["preferred", "decided"]) }).optional(),
  decision: z.enum(["open", "cleared", "restricted"]),
  decidedBy: Id.optional(),
  date: z.string().optional(),
  note: z.string().optional(),
});
export type Rights = z.infer<typeof Rights>;

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
  editorial: Editorial.optional(),
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
  debated: z.union([z.literal(true), z.object({ note: z.string(), sources: z.array(Citation).default([]) })]).optional(),
});

/** How a work is cited. Canonical refs must fit this scheme. */
export const RefScheme = z.object({
  type: z.enum(["chapter", "chapter.verse"]),
  sectionLabel: z.string().default("Chapter"),
  sections: z.number().int().positive(),
  note: z.string().optional(),
  editorial: Editorial,
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
  /** Retired refs and their replacements, so old bookmarks and citations keep resolving. */
  refAliases: z.record(Ref, Ref).optional(),
  genre: z.string().optional(),
  canonicalStatus: z.array(z.object({
    tradition: z.string(),
    status: z.enum(["canonical", "deuterocanonical", "noncanonical", "disputed", "varies"]),
    note: z.string().optional(),
    sources: z.array(Citation).default([]),
  })).optional(),
  /** Only `published` works are held to the publication rules in the validator. */
  publication: z.object({ status: z.enum(["draft", "preview", "published"]), approvedBy: Id.optional(), date: z.string().optional() }).optional(),
});
export type Work = z.infer<typeof Work>;

/** Historical overview: loaded on demand. Every claim has a basis (certainty) and a review status. */
export const Fact = z.object({
  label: z.string(),
  value: z.string(),
  basis: z.enum(["established", "disputed", "unknown"]),
  review: ClaimReview.default("draft"),
  sources: z.array(Citation).default([]),
});
export const Paragraph = z.object({
  kind: z.enum(["fact", "interpretation"]),
  text: z.string(),
  review: ClaimReview.default("draft"),
  sources: z.array(Citation).default([]),
});
export const SourceGroup = z.object({ title: z.string(), sources: z.array(Citation) });
export const Overview = z.object({
  work: Id,
  editorial: Editorial,
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
  material: z.string().optional(),
  holding: z.string().optional(),
  shelfmark: z.string().optional(),
  images: z.array(z.object({ href: z.string().url(), license: z.string(), credit: z.string() })).default([]),
  /** External pages with images or catalogue records; we link out rather than host. */
  links: z.array(z.object({ label: z.string(), href: z.string().url() })).default([]),
  sources: z.array(Citation).default([]),
  editorial: Editorial,
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
  /** The printed edition this text reproduces, and where in it. */
  edition: z.object({ source: Id, pages: z.string().optional() }).optional(),
  /** What the transcription preserves, and any normalization applied (recorded, never silent). */
  transcriptionPolicy: z.object({
    preserves: z.array(z.string()).default([]),
    normalizations: z.array(z.object({ what: z.string(), how: z.string() })).default([]),
  }).optional(),
  version: z.string().optional(),
  rights: Rights.optional(),
  editorial: Editorial,
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
  editorial: Editorial,
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
  sources: z.array(Citation).default([]),
  editorial: Editorial,
});
export type Connection = z.infer<typeof Connection>;

/** Reader notes attached to canonical references (section- or verse-level). */
export const Note = z.object({
  ref: Ref,
  kind: z.string(),
  title: z.string(),
  note: z.string(),
  to: Target.optional(),
  sources: z.array(Citation).default([]),
  editorial: Editorial,
});
export type Note = z.infer<typeof Note>;

/** A scan of a printed source in a public repository. */
export const Scan = z.object({
  repository: z.enum(["internet-archive", "hathitrust", "google-books", "other"]),
  id: z.string(),
  url: z.string().url(),
  holding: z.string().optional(),
  digitizedBy: z.string().optional(),
  rightsCode: z.string().optional(),
  terms: z.string().optional(),
  primary: z.boolean().default(false),
  note: z.string().optional(),
});
export const Source = z.object({
  id: Id,
  type: z.enum(["book", "article", "edition", "web", "catalog"]),
  /** What the source may be used for (see docs/EDITORIAL.md §2). */
  role: z.enum(["manuscript", "indirect-witness", "base-edition", "reference-edition", "translation", "digitization", "secondary", "catalog"]).optional(),
  use: z.enum(["reproduce", "compare", "consult-only", "cite"]).optional(),
  citation: z.string(),
  href: z.string().url().optional(),
  edition: z.object({
    editors: z.array(z.string()).default([]),
    title: z.string(),
    place: z.string().optional(),
    publisher: z.string().optional(),
    year: z.number().int(),
    volume: z.string().optional(),
    pages: z.string().optional(),
    identifiers: z.record(z.string()).optional(),
  }).optional(),
  scans: z.array(Scan).default([]),
  rights: RightsLayer.optional(),
  editorial: Editorial,
});
export type Source = z.infer<typeof Source>;

/** Pathway steps point at works and canonical refs; they never copy text. */
export const Pathway = z.object({
  id: Id,
  title: z.string(),
  blurb: z.string(),
  editorial: Editorial.optional(),
  steps: z.array(z.object({ title: z.string(), note: z.string(), target: Target })),
});
export type Pathway = z.infer<typeof Pathway>;

/**
 * Proposed corrections to a base transcription. The base text stays as printed; corrections are
 * adopted only after review and are always recorded here.
 */
export const Correction = z.object({
  id: Id,
  segment: SegmentId,
  printed: z.string(),
  proposed: z.string(),
  basis: z.array(Citation).min(1),
  status: z.enum(["proposed", "adopted", "rejected"]),
  reviews: z.array(Review).default([]),
  note: z.string().optional(),
});
export type Correction = z.infer<typeof Correction>;

/** Reader-facing revision log for a translation or edition. */
export const Revision = z.object({
  version: z.string(),
  date: z.string(),
  type: z.enum(["typo", "reading", "division", "alignment", "metadata", "initial"]),
  refs: z.array(Ref).default([]),
  description: z.string(),
  tier: z.enum(["A", "B", "C"]),
  by: Id,
});
export type Revision = z.infer<typeof Revision>;
