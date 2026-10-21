/**
 * Edition-aware references (refmap.json): an edition's own numbering, as printed, next to
 * SCRIPTORIAS refs. Used by the reader for passage numbers, selection labels and citations.
 */
import type { RefMap, RefMapping } from "./schema";

export const shortRef = (ref: string) => ref.split(".").slice(1).join(".");
export const pagesText = (pages: string[]) => (pages.length ? (pages.length > 1 ? `pp. ${pages[0]}–${pages[pages.length - 1]}` : `p. ${pages[0]}`) : "");
export const uniq = <T,>(xs: T[]) => [...new Set(xs)];
export const mappingsFor = (map: RefMap, segs: string[]) => map.mappings.filter((m) => m.segments.some((s) => segs.includes(s)));

/** "Lightfoot Greek XVI.7", "Lightfoot English ch. 4, ¶ 2". */
export function editionLabel(map: RefMap, m: RefMapping, seg?: string) {
  if (m.kind === "unmapped") return `${map.editionName}, ${m.edition.join(", ")}`;
  if (map.printsVerses) return `${map.editionName} ${m.edition.join(", ")}`;
  const para = (seg ?? m.segments[0]).split(".")[1].replace(/[a-z]$/, "");
  return m.level === "chapter" && m.segments.length > 1 ? `${map.editionName} ch. ${m.edition[0]}, ¶ ${para}` : `${map.editionName} ch. ${m.edition[0]}`;
}

export const basisLabel = (m: RefMapping, editor: string) =>
  m.kind === "unmapped" ? "Not mapped" : m.basis === "editorial" ? `Editorial alignment (not ${editor}'s numbering)` : m.level === "chapter" ? `${editor}'s chapter numbering` : `${editor}'s printed numbering`;
export const kindLabel: Record<RefMapping["kind"], string> = { "one-to-one": "one to one", "one-to-many": "one to many", "many-to-one": "many to one", unmapped: "unmapped" };
/** A mapping shown as provisional (docs/EDITORIAL.md §9): uncertain, or our own editorial alignment. */
export const isProvisional = (m: RefMapping) => m.certainty === "uncertain" || m.basis === "editorial";

/** Extra class for a passage number, and its accessible description. */
export function numberInfo(map: RefMap, segId: string, editor: string): { className: string; title: string } | null {
  const m = mappingsFor(map, [segId])[0];
  if (!m || m.kind === "unmapped") return null;
  const refs = m.refs.map(shortRef).join(" and ");
  if (m.basis === "editorial") return { className: "pn-editorial", title: `Editorial alignment: SCRIPTORIAS ${refs}. Not ${editor}'s numbering (no verse numbers are printed). Provisional.` };
  if (m.level === "chapter") return { className: "pn-para", title: `${editionLabel(map, m, segId)}: resolves to SCRIPTORIAS ${refs}` };
  return { className: m.kind !== "one-to-one" || m.certainty === "uncertain" ? "pn-mapped" : "", title: `${editionLabel(map, m)} = SCRIPTORIAS ${refs}${m.certainty === "uncertain" ? " (provisional mapping)" : ""}` };
}

/** The edition's own reference for a selection, e.g. "Lightfoot Greek XVI.7, p. 225 · provisional mapping". */
export function editionRef(map: RefMap, segs: string[]): string | null {
  const ms = mappingsFor(map, segs);
  if (!ms.length) return null;
  const pages = uniq(ms.flatMap((m) => m.pages));
  const label = ms.map((m) => editionLabel(map, m, segs[0])).join(", ");
  return `${label}${pages.length ? `, ${pagesText(pages)}` : ""}${ms.some((m) => m.basis === "editorial") ? " · editorial alignment" : ""}${ms.some((m) => m.certainty === "uncertain") ? " · provisional mapping" : ""}`;
}
