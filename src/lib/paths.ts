/** URL builders for clean routes. */
import { resolveRef } from "../content/catalog";
import type { Target } from "../content/schema";

export const workPath = (id: string) => `/works/${id}`;
export const collectionPath = (id: string) => `/collections/${id}`;
export const pathwayPath = (id: string) => `/pathways/${id}`;
export const manuscriptPath = (work: string, ms: string) => `/works/${work}/manuscripts/${ms}`;

/** Reader URL for a work, optionally at a canonical ref ("work.section[.verse]"). Aliased refs resolve. */
export function readPath(work: string, ref?: string, opts: { seg?: string; tr?: string } = {}) {
  const [, s, v] = ref ? resolveRef(ref).split(".") : [];
  const q = new URLSearchParams();
  if (opts.seg) q.set("seg", opts.seg);
  if (opts.tr) q.set("tr", opts.tr);
  const qs = q.toString();
  return `/works/${work}/read${s ? `/${s}` : ""}${v ? `/${v}` : ""}${qs ? `?${qs}` : ""}`;
}
export const readSection = (work: string, section: number) => `/works/${work}/read/${section}`;

/** Where a content target links to: a passage, a work, or nowhere. */
export function targetPath(t: Target): string | null {
  if (!("work" in t)) return null;
  return t.ref ? readPath(t.work, t.ref) : workPath(t.work);
}
