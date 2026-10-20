/**
 * Canonical references ("work.section[.verse]") and their relation to translation segments.
 */
import type { Alignment, Text } from "./schema";

export interface ParsedRef { work: string; section: number; verse?: number }
export function parseRef(ref: string): ParsedRef {
  const [work, s, v] = ref.split(".");
  return { work, section: Number(s), ...(v ? { verse: Number(v) } : {}) };
}
export const sectionRef = (work: string, section: number) => `${work}.${section}`;
export const isVerseRef = (ref: string) => ref.split(".").length === 3;
/** "Didache 1.2", "1 Enoch 6" */
export const formatRef = (title: string, ref: string) => `${title} ${ref.split(".").slice(1).join(".")}`;

/** Lookup tables between a translation's segments and canonical refs. */
export class AlignmentIndex {
  readonly segToRefs = new Map<string, string[]>();
  readonly refToSegs = new Map<string, string[]>();
  constructor(readonly work: string, text: Text | null, alignment: Alignment | null) {
    for (const s of text?.sections ?? []) {
      for (const seg of s.segments) {
        const refs = alignment?.segments[seg.id] ?? [sectionRef(work, s.n)];
        this.segToRefs.set(seg.id, refs);
        for (const r of refs) this.refToSegs.set(r, [...(this.refToSegs.get(r) ?? []), seg.id]);
      }
    }
  }
  /** Most specific canonical ref for a segment (its first aligned verse, else its section). */
  refOf(segId: string) { return this.segToRefs.get(segId)?.[0] ?? sectionRef(this.work, Number(segId.split(".")[0])); }
  segsOf(ref: string) { return this.refToSegs.get(ref) ?? []; }
  isAligned(segId: string) { return isVerseRef(this.refOf(segId)); }
}

/** Translation-local anchor, e.g. "lightfoot:1.7". */
export const anchorOf = (tr: string, segId: string) => `${tr}:${segId}`;
export function parseAnchor(anchor: string) { const [tr, seg] = anchor.split(":"); return { tr, seg }; }
