/**
 * Lossless parser for page-image transcriptions in the SCRIPTORIAS working markup, and the inverse
 * that rebuilds the exact source bytes (used by scripts/content/import-lightfoot-1891.ts).
 *
 *   [[p. N]]   a printed page begins          {n}   a number or label as printed
 *   *…*        italic                          ^…^   uncial type
 *   ⟦?…⟧       uncertain reading               blank line: new paragraph
 *
 * Only structure is parsed. Every character of the transcription, including spaces and line
 * breaks, stays in the runs, so `reconstruct(parse(src)) === src` (checked by the content tests).
 */
import type { Run } from "../../src/content/schema.ts";

export type Flags = Pick<Run, "em" | "uncial" | "uncertain">;
export type Item =
  | { type: "text"; t: string; flags: Flags }
  | { type: "pb"; page: string; restated: boolean; flags: Flags }
  | { type: "label"; label: string };

const TOKEN = /\[\[p\. (\d+)\]\]|\{([^}\n]*)\}|⟦\?|⟧|\*|\^/g;

/** Splits marked-up text into text, page-break and printed-label items. */
export function tokenize(src: string): Item[] {
  const out: Item[] = [];
  const flags: Flags = {};
  let page: string | null = null;
  let last = 0;
  const pushText = (t: string) => { if (t) out.push({ type: "text", t, flags: { ...flags } }); };
  for (const m of src.matchAll(TOKEN)) {
    pushText(src.slice(last, m.index));
    last = m.index! + m[0].length;
    const tok = m[0];
    if (m[1]) {
      out.push({ type: "pb", page: m[1], restated: m[1] === page, flags: { ...flags } });
      page = m[1];
    } else if (m[2] !== undefined) {
      if (flags.em || flags.uncial || flags.uncertain) throw new Error(`printed label {${m[2]}} inside a styled span at ${m.index}`);
      out.push({ type: "label", label: m[2] });
    } else if (tok === "*") toggle(flags, "em");
    else if (tok === "^") toggle(flags, "uncial");
    else if (tok === "⟦?") { if (flags.uncertain) throw new Error(`nested ⟦? at ${m.index}`); flags.uncertain = true; }
    else if (tok === "⟧") { if (!flags.uncertain) throw new Error(`unmatched ⟧ at ${m.index}`); delete flags.uncertain; }
  }
  pushText(src.slice(last));
  if (flags.em || flags.uncial || flags.uncertain) throw new Error("unclosed span at end of text");
  return out;
}
function toggle(f: Flags, k: "em" | "uncial") { if (f[k]) delete f[k]; else f[k] = true; }

export const runOf = (i: Exclude<Item, { type: "label" }>): Run =>
  i.type === "pb" ? { t: "", pb: i.page, ...(i.restated ? { restated: true } : {}), ...i.flags } : { t: i.t, ...i.flags };

const ORDER = ["em", "uncial", "uncertain"] as const;
const OPEN = { em: "*", uncial: "^", uncertain: "⟦?" };
const CLOSE = { em: "*", uncial: "^", uncertain: "⟧" };

/** Markup for a sequence of labels and runs: the exact inverse of tokenize(). */
export function reconstruct(parts: ({ label: string } | Run)[]): string {
  let out = "";
  const open: (typeof ORDER[number])[] = [];
  const closeTo = (keep: Set<string>) => {
    // Close inner spans first; a span that must close forces every span opened after it to close.
    const firstBad = open.findIndex((k) => !keep.has(k));
    if (firstBad < 0) return;
    while (open.length > firstBad) out += CLOSE[open.pop()!];
  };
  for (const p of parts) {
    if ("label" in p) { closeTo(new Set()); out += `{${p.label}}`; continue; }
    const want = new Set(ORDER.filter((k) => p[k]));
    closeTo(want);
    for (const k of ORDER) if (want.has(k) && !open.includes(k)) { open.push(k); out += OPEN[k]; }
    out += p.pb ? `[[p. ${p.pb}]]` : p.t;
  }
  closeTo(new Set());
  return out;
}

/** Plain text of runs (no markup, page breaks dropped). */
export const plain = (runs: Run[]) => runs.map((r) => r.t).join("");

/** Splits runs at a character offset of their plain text (flags kept on both sides). */
export function splitRuns(runs: Run[], at: number): [Run[], Run[]] {
  const a: Run[] = [], b: Run[] = [];
  let pos = 0;
  for (const r of runs) {
    const end = pos + r.t.length;
    if (r.pb !== undefined) (pos < at ? a : b).push(r);
    else if (end <= at) a.push(r);
    else if (pos >= at) b.push(r);
    else { a.push({ ...r, t: r.t.slice(0, at - pos) }); b.push({ ...r, t: r.t.slice(at - pos) }); }
    pos = end;
  }
  return [a, b];
}

/** Merges neighbouring runs with identical features (never page breaks). */
export function compact(runs: Run[]): Run[] {
  const out: Run[] = [];
  for (const r of runs) {
    const prev = out[out.length - 1];
    if (prev && prev.pb === undefined && r.pb === undefined && ORDER.every((k) => prev[k] === r[k])) prev.t += r.t;
    else out.push({ ...r });
  }
  return out;
}

/** Pages a run list touches, given the page in progress where it starts. */
export function pagesOf(runs: Run[], startPage: string | null): { pages: string[]; endPage: string | null } {
  const pages: string[] = [];
  let page = startPage;
  let sawText = false;
  for (const r of runs) {
    if (r.pb !== undefined) { page = r.pb; continue; }
    if (r.t.trim() && page && !pages.includes(page)) pages.push(page);
    if (r.t.trim()) sawText = true;
  }
  if (!sawText && page && !pages.includes(page)) pages.push(page);
  return { pages, endPage: page };
}

/** Rebuilds the concatenated source transcription from a generated text.json. */
export function reconstructText(text: { sections: { segments: { label?: string; runs?: Run[] }[] }[] }): string {
  return reconstruct(text.sections.flatMap((s) => s.segments.flatMap((g) => [...(g.label !== undefined ? [{ label: g.label }] : []), ...(g.runs ?? [])])));
}
