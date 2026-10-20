/**
 * Text importers. Each turns a raw source snapshot (committed under content/_raw) into the
 * Text format, deterministically, so imports can be re-run and checked in CI.
 */
import fs from "node:fs";
import path from "node:path";
import type { Alignment, Segment, Text, Translation } from "../../src/content/schema.ts";

export interface ImportResult {
  text: Text;
  alignment?: Alignment;
}
type Importer = (tr: Translation, rawPath: string) => ImportResult;

/** Split a string on <em>…</em> into runs. Emphasis may span segment boundaries. */
function runsOf(body: string, state: { em: boolean }) {
  const runs: { t: string; em?: true }[] = [];
  let pos = 0;
  for (const m of body.matchAll(/<\/?em>/g)) {
    if (m.index! > pos) runs.push({ t: body.slice(pos, m.index), ...(state.em ? { em: true as const } : {}) });
    state.em = m[0] === "<em>";
    pos = m.index! + m[0].length;
  }
  if (pos < body.length) runs.push({ t: body.slice(pos), ...(state.em ? { em: true as const } : {}) });
  return runs;
}

/**
 * Wikisource pages that mark each passage with <section begin=C:N/>…<section end=C:N/>.
 * Segment ids keep Wikisource's numbering; they are translation-local, not canonical.
 */
const wikisourceSections: Importer = (tr, rawPath) => {
  const raw = fs.readFileSync(rawPath, "utf8");
  const wanted = new Set(tr.importer!.sections);
  const bySection = new Map<number, Segment[]>();
  const state = { em: false };
  for (const m of raw.matchAll(/<section begin=(\d+):(\d+)\/>([\s\S]*?)<section end=\1:\2\/>/g)) {
    const [, c, n, body] = m;
    const runs = runsOf(body, state);
    if (!wanted.has(Number(c))) continue;
    if (!bySection.has(Number(c))) bySection.set(Number(c), []);
    bySection.get(Number(c))!.push({ id: `${c}.${n}`, n, runs });
  }
  return {
    text: {
      work: tr.work,
      translation: tr.id,
      sections: [...wanted].sort((a, b) => a - b).map((n) => ({ n, segments: bySection.get(n) ?? [] })),
    },
  };
};

/**
 * R. H. Charles' 1 Enoch as transcribed on Wikisource: one page per chapter, verse numbers
 * inline ("3. …"), poetry as separate lines, stanza breaks as runs of blank lines.
 * Textual marks ⌈ ⌉ 〈 〉 are removed; editorial brackets [ ] are kept.
 * Charles' own verse numbers are the conventional citation system, so the importer also emits a
 * canonical alignment; sub-verse letters (6a, b, …) align to their parent verse.
 */
const wikisourceCharlesEnoch: Importer = (tr, rawDir) => {
  const NUM = /(?:^|(?<=\s))(\d+[a-z]?)\.\s+/g;
  const LET = /^([a-z])\.\s+/;
  const titles = (tr.importer!.options?.sectionTitles ?? []) as { from: number; to: number; title: string }[];
  const sections: Text["sections"] = [];
  const align: Alignment["segments"] = {};

  for (const ch of tr.importer!.sections) {
    const raw = fs
      .readFileSync(path.join(rawDir, `Chapter_${String(ch).padStart(2, "0")}.wikitext`), "utf8")
      .replace(/[⌈⌉〈〉]/g, "");
    type Seg = { n: string; lines: (string | { t: string; stanza: true })[]; stanza?: true };
    const segs: Seg[] = [];
    let gap = 0;
    for (const line of raw.split("\n")) {
      const s = line.trim();
      if (!s) { gap++; continue; }
      if (/^(\{\{|\||\}\}|=|CHAPTER)/.test(s)) { gap = 0; continue; }
      const marks = [...s.matchAll(NUM)].map((m) => ({ start: m.index!, end: m.index! + m[0].length, n: m[1] }));
      const lm = s.match(LET);
      if (lm && !(marks.length && marks[0].start === 0)) marks.unshift({ start: 0, end: lm[0].length, n: lm[1] });
      let stanza = gap >= 2 && segs.length > 0;
      const head = (marks.length ? s.slice(0, marks[0].start) : s).trim();
      if (head) {
        segs[segs.length - 1].lines.push(stanza ? { t: head, stanza: true } : head);
        stanza = false;
      }
      marks.forEach((m, i) => {
        const end = i + 1 < marks.length ? marks[i + 1].start : s.length;
        segs.push({ n: m.n, lines: [s.slice(m.end, end).trim()], ...(stanza && i === 0 ? { stanza: true as const } : {}) });
      });
      gap = 0;
    }
    let verse = 0;
    const segments: Segment[] = segs.map((g, i) => {
      const id = `${ch}.${i + 1}`;
      const num = g.n.match(/^\d+/);
      if (num) verse = Number(num[0]);
      align[id] = [`${tr.work}.${ch}.${verse}`];
      return { id, n: g.n, lines: g.lines, ...(g.stanza ? { stanza: true as const } : {}) };
    });
    const title = titles.find((t) => ch >= t.from && ch <= t.to)?.title;
    sections.push({ n: ch, ...(title ? { title } : {}), segments });
  }
  return {
    text: { work: tr.work, translation: tr.id, sections },
    alignment: {
      work: tr.work,
      translation: tr.id,
      editorial: { content: "authentic", transcription: "unchecked", note: "Generated from Charles' own verse numbers by the importer.", reviews: [] },
      segments: align,
    },
  };
};

export const IMPORTERS: Record<string, Importer> = {
  "wikisource-sections": wikisourceSections,
  "wikisource-charles-enoch": wikisourceCharlesEnoch,
};
