/**
 * Imports the SCRIPTORIAS transcription of Lightfoot & Harmer, The Apostolic Fathers (1891):
 * the Didache in Greek (pp. 217–225) and English (pp. 229–235).
 *
 * The working transcription files are kept outside this repository. This script reads them
 * (never writes them) and generates, per edition, under content/works/didache/translations/:
 *   text.json         segments and runs (structure only: every source character is kept)
 *   refmap.json       the edition's own references ↔ SCRIPTORIAS refs (kind, basis, certainty)
 *   alignment.json    the reader's projection of the verse-level mappings in refmap.json
 *   translation.json  created from the template below if missing; on later imports only
 *                     `provenance.workingFiles` (commit, size and SHA-256 of each file) is updated,
 *                     so editorial, rights and publication fields stay hand-maintained data
 * and, for the work: questions.json (open editorial questions), differences.json (recorded edition
 * differences) and the Greek edition's corrections.json (proposed, not applied).
 *
 *   npm run content:import-lightfoot -- --from <dir>    write the files (<dir> holds transcription/)
 *   npm run content:import-lightfoot -- --check         fail if committed files differ
 *
 * The source folder is --from, else $SCRIPTORIAS_TRANSCRIPTIONS (no default: the location of the
 * working files is local and is not recorded in this repository).
 * --check works without it: the committed text.json is turned back into the transcription files,
 * which must match the recorded SHA-256 of every file, and every generated file is rebuilt from
 * them. When the folder is present, the files there must also be byte-identical.
 */
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Alignment, Correction, EditionDifference, EditorialQuestion, RefMap, RefMapping, Run, Segment, Text, Translation } from "../../src/content/schema.ts";
import { CONTENT, stringify } from "./load.ts";
import { compact, pagesOf, plain, reconstructText, runOf, splitRuns, tokenize } from "./transcription.ts";

// ---------- Configuration (structure only: the text is never edited) ----------

export interface EditionConfig {
  translation: string;
  style: "greek" | "english";
  editionName: string;
  files: string[];
  numbering: string;
  printsVerses: boolean;
  against: string[];
  /** Greek: replaces the default one-to-one mapping for a segment. */
  overrides?: Record<string, Partial<RefMapping> & { refs: string[] }>;
  /** English: editorial verse alignment, per chapter: where each verse begins (plain text). */
  editorialAlignment?: Record<string, { ref: string; at?: string }[]>;
  editorialNote?: string;
  alignmentNote: string;
}

const WORK = "didache";
const WITNESSES = ["lake-1912-apostolic-fathers", "wikisource-el-didache"];
const PROVISIONAL = "Provisional; not reviewed by a qualified editor.";

export const EDITIONS: EditionConfig[] = [
  {
    translation: "lightfoot-1891-grc",
    style: "greek",
    editionName: "Lightfoot Greek",
    files: ["lightfoot-1891-greek-ch01.txt", "lightfoot-1891-greek-p218-221.txt", "lightfoot-1891-greek-p222-225.txt"],
    numbering: "Lightfoot & Harmer (1891), Greek text pp. 217–225: chapters I–XVI in roman numerals, verses numbered as printed from 2. (verse 1 carries the chapter numeral). Chapter XVI has printed verses 1–7 only.",
    printsVerses: true,
    against: WITNESSES,
    alignmentNote: `Lightfoot's printed verse numbers. They coincide with the SCRIPTORIAS verse numbering (Lake 1912, checked for chapter XVI on the printed page; Greek Wikisource) in chapters I–XV and XVI.1–5; in chapter XVI his verse 6 holds SCRIPTORIAS 16.6–7 and his verse 7 is SCRIPTORIAS 16.8. ${PROVISIONAL}`,
    overrides: {
      "16.6": {
        refs: ["didache.16.6", "didache.16.7"],
        kind: "one-to-many",
        starts: { "didache.16.6": "καὶ τότε φανήσεται", "didache.16.7": "οὐ πάντων δέ" },
        note: `Lightfoot prints one verse (6.) where Lake 1912 (p. 332), Funk 1901 and Schaff 1885 print two: 16.6 (καὶ τότε φανήσεται τὰ σημεῖα …) and 16.7 (οὐ πάντων δέ, ἀλλ᾽ ὡς ἐρρέθη …). SCRIPTORIAS 16.6 and 16.7 are both parts of Lightfoot's XVI.6. ${PROVISIONAL}`,
      },
      "16.7": {
        refs: ["didache.16.8"],
        kind: "one-to-one",
        certainty: "uncertain",
        starts: { "didache.16.8": "τότε ὄψεται" },
        note: "Lightfoot prints no verse 8. His last verse, XVI.7 (from τότε ὄψεται), contains the words ἐρχόμενον ἐπάνω τῶν νεφελῶν τοῦ οὐρανοῦ. In the printed Lake 1912 (vol. 1, p. 332, checked on the page image) 16.7 begins at οὐ πάντων δέ and 16.8 at τότε ὄψεται; Funk 1901 (p. 36) and Schaff 1885 (p. 218) print the same division. So SCRIPTORIAS didache.16.8 corresponds to Lightfoot's XVI.7, and from 16.7 on Lightfoot's numbers run one behind. The historical text is not renumbered and no verse 8 is inserted. Provisional: how SCRIPTORIAS displays and cites this has not been reviewed by a qualified editor.",
      },
    },
  },
  {
    translation: "lightfoot-1891-en",
    style: "english",
    editionName: "Lightfoot English",
    files: ["lightfoot-1891-ch01.txt", "lightfoot-1891-english-p229-232.txt", "lightfoot-1891-english-p233-235.txt"],
    numbering: "Lightfoot & Harmer (1891), English translation pp. 229–235: chapters 1–16 in arabic numerals; no verse numbers are printed. Paragraphs as printed.",
    printsVerses: false,
    against: WITNESSES,
    alignmentNote: `Chapter-level alignment is Lightfoot's own (he numbers chapters only). Verse-level alignment exists for chapters 1 and 16 only and is an editorial alignment by SCRIPTORIAS, not Lightfoot's numbering. ${PROVISIONAL}`,
    editorialNote: `Editorial alignment: Lightfoot prints no verse numbers. SCRIPTORIAS placed the verse opening to match the Greek verse openings (Lake 1912; Greek Wikisource). ${PROVISIONAL}`,
    editorialAlignment: {
      "1": [
        { ref: "didache.1.1" },
        { ref: "didache.1.2", at: "The way of life is" },
        { ref: "didache.1.3", at: "Now of these words the" },
        { ref: "didache.1.4", at: "Abstain thou from fleshly" },
        { ref: "didache.1.5", at: "To every man that asketh" },
        { ref: "didache.1.6", at: "Yea, as touching this also" },
      ],
      "16": [
        { ref: "didache.16.1" },
        { ref: "didache.16.2", at: "And ye shall gather yourselves" },
        { ref: "didache.16.3", at: "For in the last days" },
        { ref: "didache.16.4", at: "For as lawlessness increaseth" },
        { ref: "didache.16.5", at: "Then all created mankind" },
        { ref: "didache.16.6", at: "And then shall the signs" },
        { ref: "didache.16.7", at: "yet not of all" },
        { ref: "didache.16.8", at: "Then shall the world see" },
      ],
    },
  },
];

const GRC = "lightfoot-1891-grc", EN = "lightfoot-1891-en";

export const QUESTIONS: EditorialQuestion[] = [
  { id: "greek-1-4-siagona", title: "Greek 1.4 σιαγονα printed without an accent (p. 217)", detail: "Neither copy shows an accent on σιαγονα. It is transcribed as printed; the accented form σιαγόνα (as in Bryennios 1883) is recorded as a proposed correction and not applied.", refs: ["didache.1.4"], translations: [GRC] },
  { id: "greek-3-10-ater", title: "Greek 3.10 ἄτερ (p. 219)", detail: "A dot under α in both copies: a misplaced iota subscript (ᾄτερ) or a print speck? Transcribed ἄτερ and marked ⟦?ἄτερ⟧. Not resolved.", refs: ["didache.3.10"], translations: [GRC] },
  { id: "english-3-6-self-willed", title: "English 3.6 “self-willed” (p. 230)", detail: "The hyphen falls at a line end; whether Lightfoot printed a hyphenated or a solid form cannot be decided from this edition. Transcribed as hyphenated. Not resolved.", refs: ["didache.3.6"], translations: [EN] },
  { id: "chapter-16-numbering", title: "Chapter 16 numbering: Lightfoot prints no verse 8", detail: "Lightfoot's Greek prints verses 1–7 only. The printed Lake 1912 (p. 332; checked on the page image), Funk 1901 and Schaff 1885 begin 16.7 at οὐ πάντων δέ and 16.8 at τότε ὄψεται. SCRIPTORIAS maps 16.6–7 to Lightfoot's XVI.6 and 16.8 to his XVI.7. No verse 8 is inserted. Provisional: the display and citation of 16.8 have not been reviewed by a qualified editor.", refs: ["didache.16.6", "didache.16.7", "didache.16.8"], translations: [GRC, EN] },
  { id: "english-verse-alignment", title: "English verse numbers in chapters 1 and 16 are an editorial alignment", detail: "Lightfoot's translation prints chapter numbers only. In chapters 1 and 16, SCRIPTORIAS shows bracketed verse numbers placed to match the Greek verse openings; elsewhere passages resolve to the chapter. Provisional; not reviewed by a qualified editor.", refs: ["didache.1", "didache.16"], translations: [EN] },
  { id: "italic-punctuation", title: "Italic or roman punctuation next to italics (English, 7 places)", detail: "Where the italic status of adjoining punctuation cannot be seen at scan resolution, it is placed inside the italic span if it lies within the quotation, otherwise outside: 2.2 (twice), 8.2 (comma after “as the hypocrites”), 16.1 (twice), 16.4, 16.7. Wikisource differs on 8.2 and 16.7. Judgements, not readings; not resolved.", refs: ["didache.2.2", "didache.8.2", "didache.16.1", "didache.16.4", "didache.16.7"], translations: [EN] },
  { id: "greek-4-7-4-11-manuscript", title: "Greek 4.7 ὁ (ἀνταποδότης) and 4.11 οἱ δοῦλοι", detail: "Bryennios's notes give different manuscript readings at these places; the text is transcribed as Lightfoot printed it. For an editor to note or decide.", refs: ["didache.4.7", "didache.4.11"], translations: [GRC] },
  { id: "lightfoot-bryennios-variants", title: "Lightfoot and Bryennios differ (25 confirmed edition differences)", detail: "Genuine differences between Lightfoot's Greek and Bryennios's first edition (1883) need an editor's review (see Edition differences). The Lightfoot text is kept as Lightfoot printed it; no reading has been harmonized.", refs: ["didache.4.3", "didache.10.6", "didache.11.9", "didache.12.3", "didache.13.1", "didache.14.1", "didache.16.4"], translations: [GRC] },
  { id: "reading-copy-1907-reprint", title: "The reading copy is a 1907 reprint", detail: "The text was read from the Cornell copy, a 1907 reprint (“First Edition 1891. Reprinted 1893, 1898, 1907”), and compared page by page with the Toronto copy of the 1891 printing. No printed difference was found on the Didache pages. Not yet confirmed by a qualified editor.", refs: [], translations: [GRC, EN] },
  { id: "display-reference-system", title: "Reference system for display; presentation of uncertain readings", detail: "Which verse system SCRIPTORIAS displays, and how uncertain readings are presented, have not been reviewed by a qualified editor. The reader shows Lightfoot's numbering as printed next to SCRIPTORIAS references, and uncertain readings as ⟦?…⟧.", refs: [], translations: [GRC, EN] },
].map((q) => ({ ...q, status: "open" as const, reviews: [] }));

const B = "bryennios-1883";
export const DIFFERENCES: EditionDifference[] = [
  { refs: ["didache.4.3"], kind: "substantive", translation: GRC, reading: "ποιήσεις", other: "ποθήσεις", witness: B },
  { refs: ["didache.10.6"], kind: "substantive", translation: GRC, reading: "μαρὰν ἀθά", other: "μαραναθά", witness: B },
  { refs: ["didache.11.9"], kind: "substantive", translation: GRC, reading: "position of “εἰ δὲ μήγε, ψευδοπροφήτης ἐστίν”", other: "placed differently relative to “οὐ φάγεται ἀπ᾽ αὐτῆς”", witness: B },
  { refs: ["didache.12.3", "didache.13.1"], kind: "substantive", translation: GRC, reading: "καθῆσθαι", other: "καθῆσαι", witness: B },
  { refs: ["didache.14.1"], kind: "substantive", translation: GRC, reading: "προεξομολογησάμενοι", other: "προσεξομολογησάμενοι", witness: B },
  { refs: ["didache.16.4"], kind: "substantive", translation: GRC, reading: "κοσμοπλανὴς", other: "κοσμοπλάνος", witness: B },
  { refs: ["didache.3.4", "didache.5.1"], kind: "orthographic", translation: GRC, reading: "εἰδωλολατρία family; φαρμακίαι", other: "εἰδωλολατρεία family; φαρμακεῖαι", witness: B },
  { refs: ["didache.7.4"], kind: "orthographic", translation: GRC, reading: "κελεύεις", other: "κελεύσεις", witness: B },
  { refs: ["didache.11.11", "didache.13.1"], kind: "orthographic", translation: GRC, reading: "ἀληθινὸς with comma", other: "ἀληθινός", witness: B },
  { refs: ["didache.13.7"], kind: "orthographic", translation: GRC, reading: "ἀπαρχὴν (comma)", other: "differs in punctuation", witness: B },
  { refs: [], kind: "orthographic", translation: GRC, reading: "movable ν (ἐστι/ἐστιν ×5, διώξουσι), οὕτω/οὕτως (×4), accentuation of ἐστι", other: "differs", witness: B },
  { refs: ["didache.5.1", "didache.8.2", "didache.14.3"], kind: "punctuation", translation: EN, reading: "printed punctuation mark present", other: "omitted by Wikisource (rev. 14637905); no wording differences in chapters 2–16", witness: "wikisource-lightfoot-didache" },
];

export const CORRECTIONS: Correction[] = [
  { id: "greek-1-4-siagona", segment: "1.4", printed: "σιαγονα", proposed: "σιαγόνα", basis: [{ source: B, note: "Bryennios prints the accented form." }], status: "proposed", reviews: [], note: "No accent is printed in either copy of Lightfoot. Recorded, not applied; for a qualified editor to decide." },
];

// ---------- translation.json templates (created once; later edits are data changes) ----------

const COPIES = (images: string) => [
  { source: "lightfoot-harmer-1891", scan: "cu31924024254744", role: "reading" as const, images },
  { source: "lightfoot-harmer-1891", scan: "apostolicfathers00lighuoft", role: "check" as const, images },
];
const SOURCES_NOTICE = "Transcribed from page images of the Cornell University Library copy (a 1907 reprint of the second edition) and checked page by page against the University of Toronto copy (1891); no differences were found on these pages. Both copies were digitized by the Internet Archive: [Cornell copy](https://archive.org/details/cu31924024254744) · [Toronto copy](https://archive.org/details/apostolicfathers00lighuoft). SCRIPTORIAS does not reproduce the page images. The transcription was prepared with AI assistance and internally checked against the page images. Page 235 was drafted from the Internet Archive's machine-read text and then corrected against both copies.";
const pdNotice = (part: string) => `**Public domain.** This is a transcription of J. B. Lightfoot and J. R. Harmer, *The Apostolic Fathers* (London: Macmillan, 1891), ${part}. It is in the public domain in the United States, where it was published in 1891, and in the United Kingdom and the European Union, where copyright ended 70 years after the death of its last author (J. B. Lightfoot died in 1889, J. R. Harmer in 1944). Its status in other countries has not been assessed. SCRIPTORIAS claims no copyright in this text.`;
const NORMALIZATIONS = [
  { what: "spacing", how: "Victorian spacing before ; : ? ! removed. No other punctuation changed." },
  { what: "line breaks", how: "Print line breaks not kept; paragraphs kept. Line-end hyphenation joined; a word divided across a page break stays divided, with its printed hyphen." },
  { what: "drop capitals", how: "A drop capital and the small capitals after it are written as ordinary capitals and not lowered." },
  { what: "italic punctuation", how: "Where the roman/italic status of adjoining punctuation cannot be seen at scan resolution, it goes inside the span if within the quotation, else outside (7 places, listed as open questions)." },
];
const rights = (): NonNullable<Translation["rights"]> => ({
  work: { status: "public-domain", basis: "Ancient work (c. late 1st–2nd century).", obligations: [], legalReview: "not-needed", evidence: [] },
  edition: {
    status: "public-domain",
    basis: "Lightfoot & Harmer (1891). J. B. Lightfoot died 1889, J. R. Harmer died 1944. Assessed for the intended markets only (United States, United Kingdom, European Union); other countries not assessed.",
    jurisdictions: { US: "Public domain: published 1891.", UK: "Public domain: last author died 1944 (life + 70).", EU: "Public domain: last author died 1944 (life + 70)." },
    obligations: [], legalReview: "not-needed", evidence: ["lightfoot-harmer-1891"],
  },
  digitization: {
    status: "public-domain",
    basis: "SCRIPTORIAS's own transcription from Internet Archive page images of two copies; no third-party transcription copied (Wikisource used for comparison only). No copyright is claimed in the historical text.",
    obligations: [], legalReview: "not-needed", evidence: ["lightfoot-harmer-1891"],
  },
  siteTerms: {
    status: "unknown",
    basis: "The Internet Archive's terms of use give access to its collections for scholarship and research. Whether publishing a text-only transcription made from the page images rests on an acceptable reuse basis has not yet been decided by the publisher.",
    obligations: [], legalReview: "not-needed", evidence: [],
  },
  ours: { license: "CC0 1.0 for original SCRIPTORIAS material, to the extent rights exist; no copyright claimed in the historical text", status: "decided" },
  decision: "open",
  note: "Not cleared. The source-reuse basis for the page images is open and the publisher has not signed off this work. Release steps: docs/releases/didache-release-steps.md.",
});
const internalChecks = (cfg: EditionConfig, pages: string) => [
  { by: "consuelo", date: "2026-10-21", tier: "B" as const, aspect: "transcription" as const, result: "pass" as const, against: [{ source: "lightfoot-harmer-1891", locator: `pp. ${pages}` }], sections: range16(),
    method: `Internal check (docs/EDITORIAL.md §6), not an independent verification. Read from the page images of the Cornell copy (1907 reprint); every page compared word by word and mark by mark with the images and with the Toronto copy (1891 printing).${cfg.style === "english" ? " Page 235 drafted from the Internet Archive's machine-read text and corrected against both copies." : ""}` },
  { by: "consuelo", date: "2026-10-21", tier: "B" as const, aspect: "provenance" as const, result: "pass" as const, against: ["lightfoot-harmer-1891"],
    method: "Internal check: edition, printing actually read (1907 reprint) and second copy (1891 printing), page and image indexes, and the size and SHA-256 of each transcription file recorded; sources linked externally, no page images hosted." },
  { by: "consuelo", date: "2026-10-21", tier: "B" as const, aspect: "completeness" as const, result: "pass" as const, against: [{ source: "lightfoot-harmer-1891", locator: `pp. ${pages}` }], sections: range16(),
    method: "Internal check: all 16 chapters present, including the title and inscription; page joins continuous; nothing omitted." },
  { by: "consuelo", date: "2026-10-21", tier: "C" as const, aspect: "technical" as const, result: "pass" as const, against: [],
    method: "Markup balanced; text.json rebuilds the transcription files byte for byte; refmap and alignment validate (npm run content:check, npm run test:content)." },
];
const range16 = () => Array.from({ length: 16 }, (_, i) => i + 1);

function template(cfg: EditionConfig): Translation {
  const greek = cfg.style === "greek";
  const pages = greek ? "217–225" : "229–235";
  return {
    id: cfg.translation,
    work: WORK,
    label: greek ? "Lightfoot & Harmer · Greek" : "Lightfoot & Harmer · English",
    detail: greek ? "The Apostolic Fathers (1891), Greek text, pp. 217–225" : "The Apostolic Fathers (1891), English translation, pp. 229–235",
    language: greek ? "grc" : "en",
    year: 1891,
    kind: greek ? "original" : "translation",
    status: "available",
    default: !greek,
    license: { name: "Public domain in the US, UK and EU" },
    source: { label: "Internet Archive: Cornell University Library copy (1907 reprint)", href: "https://archive.org/details/cu31924024254744", retrieved: "2026-10-21" },
    coverage: { sections: range16(), note: "All 16 chapters" },
    italics: greek
      ? "Lightfoot sets Scripture quotations in the Greek in uncial (capital-form) type; shown here in a distinct style."
      : "Italic type follows Lightfoot, who set quotations of Scripture in italics.",
    numbering: "source",
    edition: { source: "lightfoot-harmer-1891", pages },
    transcriptionPolicy: {
      preserves: [
        "printed wording, spelling, capitalization, punctuation and accentuation, as printed",
        "the editor's paragraphing",
        "page breaks of the printed edition",
        "uncertain readings, marked ⟦?…⟧ and left unresolved",
        ...(greek
          ? ["uncial type", "Lightfoot's chapter numerals and verse numbers exactly as printed (XVI has verses 1–7 only)", "accents, breathings and iota subscripts as printed, including forms an editor would correct"]
          : ["italics marking Scripture quotations", "Lightfoot's chapter numbers as printed (he prints no verse numbers)"]),
      ],
      normalizations: [
        ...NORMALIZATIONS,
        ...(greek ? [{ what: "uncial type", how: "Text set in uncial type is transcribed in ordinary lowercase with σ/ς and the accents and breathings as printed." }] : []),
      ],
    },
    version: "1.0",
    rights: rights(),
    provenance: {
      method: "Transcribed with AI assistance from the page images of the Cornell copy (a 1907 reprint of the second edition) and internally checked against the page images of that copy and of the Toronto copy (1891).",
      copies: COPIES(greek ? "pp. 217–225 = images n232–n240" : "pp. 229–235 = images n244–n250"),
      ocrAssisted: greek ? [] : [{ page: "235", sections: [15, 16], note: "Page 235 was drafted from the Internet Archive's machine-read text and then corrected against both copies." }],
    },
    notices: { publicDomain: pdNotice(greek ? "Greek text, pp. 217–225" : "English translation, pp. 229–235"), sources: SOURCES_NOTICE },
    editorial: {
      content: "authentic",
      transcription: "proofread",
      provenance: "recorded",
      note: "Internally checked transcription (docs/EDITORIAL.md §6), not independently verified. Open questions are shown with the text as provisional.",
      reviews: internalChecks(cfg, pages),
    },
  };
}

// ---------- Parsing (structure only) ----------

const ROMAN = /^([IVXL]+)\.$/;
const ARABIC = /^(\d+)\.$/;
const romanValue = (s: string) => {
  const v: Record<string, number> = { I: 1, V: 5, X: 10, L: 50 };
  return [...s].reduce((acc, c, i, a) => (v[c] < (v[a[i + 1]] ?? 0) ? acc - v[c] : acc + v[c]), 0);
};
const ROMANS = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI"];

interface Seg extends Segment { runs: Run[]; section: number }

/** Parses one edition (the concatenated files) into segments. Throws on any structural surprise. */
export function parseEdition(cfg: EditionConfig, src: string) {
  const items = tokenize(src);
  const segs: Seg[] = [];
  let chapter = 0, verse = 0, para = 0, front = 0;
  let cur: Seg | null = null;
  // After a blank line, page breaks and whitespace wait for the next paragraph's first word.
  let pending = false;
  let held: Run[] = [];
  const open = (s: Omit<Seg, "runs">) => { cur = { ...s, runs: [] }; segs.push(cur); };
  const newParagraph = () => {
    if (!cur || cur.heading) open({ id: `1.0${String.fromCharCode(97 + front++)}`, n: "", section: 1, para: true, heading: true });
    else if (cfg.style === "english") open({ id: `${chapter}.${++para}`, n: "¶", section: chapter, para: true });
    else throw new Error(`${cfg.translation}: paragraph break inside verse ${cur.id}`);
  };
  const flush = () => { if (held.length) { cur!.runs.push(...held); held = []; } };

  for (const it of items) {
    if (it.type === "label") {
      const roman = it.label.match(ROMAN), arabic = it.label.match(ARABIC);
      if (cfg.style === "greek") {
        if (roman) {
          if (romanValue(roman[1]) !== chapter + 1) throw new Error(`${cfg.translation}: chapter ${it.label} out of sequence`);
          chapter++; verse = 1;
        } else if (arabic) {
          if (Number(arabic[1]) !== verse + 1) throw new Error(`${cfg.translation}: verse ${it.label} out of sequence in chapter ${chapter}`);
          verse++;
        } else throw new Error(`${cfg.translation}: unexpected label {${it.label}}`);
      } else {
        if (!arabic || Number(arabic[1]) !== chapter + 1) throw new Error(`${cfg.translation}: chapter label {${it.label}} out of sequence`);
        chapter++; para = 1;
      }
      if (cur) flush();
      const startsPara = Boolean(roman) || cfg.style === "english" || pending;
      open({ id: `${chapter}.${cfg.style === "greek" ? verse : 1}`, n: cfg.style === "greek" ? String(verse) : "¶", label: it.label, section: chapter, ...(startsPara ? { para: true } : {}) });
      pending = false;
      continue;
    }
    const run = runOf(it);
    if (!cur) newParagraph();
    // A blank line ends a paragraph: text up to and including it stays with the old one.
    const pieces = run.pb === undefined ? run.t.split(/(?<=\n\n)/).filter(Boolean) : [run.t];
    for (const t of pieces) {
      const r = { ...run, t };
      if (pending && (r.pb !== undefined || !t.trim())) { held.push(r); continue; }
      if (pending) { newParagraph(); flush(); pending = false; }
      cur!.runs.push(r);
      if (r.pb === undefined && t.endsWith("\n\n")) pending = true;
    }
  }
  if (cur) flush();
  if (chapter !== 16) throw new Error(`${cfg.translation}: ends at chapter ${chapter}, expected 16`);
  return (segs as Seg[]).map((s) => ({ ...s, runs: compact(s.runs) }));
}

/** Splits English paragraphs at editorial verse openings (structure only; text unchanged). */
function applyEditorialAlignment(cfg: EditionConfig, segs: Seg[]) {
  const out: Seg[] = [];
  const verseOf = new Map<string, string>();
  for (const s of segs) {
    const spec = cfg.editorialAlignment?.[String(s.section)];
    if (!spec || s.heading) { out.push(s); continue; }
    if (s.id !== `${s.section}.1` || segs.some((x) => x.section === s.section && x.id !== s.id && !x.heading))
      throw new Error(`${cfg.translation}: editorial alignment of chapter ${s.section} needs a single paragraph`);
    let rest = s.runs;
    const pieces: Run[][] = [];
    for (const [i, v] of spec.entries()) {
      if (i === 0) continue;
      const text = plain(rest);
      const at = text.indexOf(v.at!);
      if (at <= 0 || text.indexOf(v.at!, at + 1) >= 0) throw new Error(`${cfg.translation}: opening for ${v.ref} not found exactly once in chapter ${s.section}`);
      const [a, b] = splitRuns(rest, at);
      pieces.push(a); rest = b;
    }
    pieces.push(rest);
    pieces.forEach((runs, i) => {
      const id = `${s.section}.1${String.fromCharCode(97 + i)}`;
      verseOf.set(id, spec[i].ref);
      out.push({ ...s, id, n: `[${spec[i].ref.split(".")[2]}]`, runs: compact(runs), ...(i === 0 ? {} : { label: undefined, para: undefined }) });
    });
  }
  return { segs: out.map((s) => JSON.parse(JSON.stringify(s)) as Seg), verseOf };
}

const order = (segs: Seg[], id: string) => segs.findIndex((s) => s.id === id);
const clean = <T extends object>(o: T): T => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

/** Builds text.json, refmap.json and alignment.json for one edition from its source text. */
export function buildEdition(cfg: EditionConfig, src: string) {
  const parsed = parseEdition(cfg, src);
  const { segs, verseOf } = cfg.style === "english" ? applyEditorialAlignment(cfg, parsed) : { segs: parsed, verseOf: new Map<string, string>() };

  const pages = new Map<string, string[]>();
  let page: string | null = null;
  for (const s of segs) { const r = pagesOf(s.runs, page); pages.set(s.id, r.pages); page = r.endPage; }

  const mappings: RefMapping[] = [];
  const base: Pick<RefMapping, "alternatives" | "against"> = { alternatives: [], against: cfg.against };
  for (const s of segs.filter((x) => x.heading)) {
    mappings.push({ ...base, against: [], edition: [s.id === "1.0a" ? "title" : "inscription"], segments: [s.id], refs: [], kind: "unmapped", level: "none", basis: "original", certainty: "proposed", pages: pages.get(s.id)!, note: "Printed before the numbered text; outside the chapter and verse numbering." });
  }
  if (cfg.style === "greek") {
    for (const s of segs.filter((x) => !x.heading)) {
      const [c, v] = s.id.split(".");
      const o = cfg.overrides?.[s.id];
      const refs = o?.refs ?? [`${WORK}.${c}.${v}`];
      mappings.push({
        ...base, edition: [`${ROMANS[Number(c)]}.${v}`], segments: [s.id], refs, level: "verse", basis: "original", certainty: "proposed", pages: pages.get(s.id)!,
        kind: refs.length > 1 ? "one-to-many" : "one-to-one", ...o, against: o?.against ?? cfg.against,
      } as RefMapping);
    }
  } else {
    for (let c = 1; c <= 16; c++) {
      const inCh = segs.filter((x) => x.section === c && !x.heading);
      if (cfg.editorialAlignment?.[String(c)]) {
        for (const s of inCh) mappings.push({
          ...base, edition: [String(c)], segments: [s.id], refs: [verseOf.get(s.id)!], kind: "one-to-one", level: "verse", basis: "editorial", certainty: "proposed",
          pages: pages.get(s.id)!, note: cfg.editorialNote,
        });
      } else {
        mappings.push({
          ...base, against: [], edition: [String(c)], segments: inCh.map((s) => s.id), refs: [`${WORK}.${c}`], kind: inCh.length > 1 ? "many-to-one" : "one-to-one",
          level: "chapter", basis: "original", certainty: "proposed", pages: [...new Set(inCh.flatMap((s) => pages.get(s.id)!))],
          note: inCh.length > 1 ? `Lightfoot prints chapter ${c} (no verse numbers) in ${inCh.length} paragraphs; each resolves to the chapter.` : `Lightfoot prints chapter ${c} without verse numbers; the passage resolves to the chapter.`,
        });
      }
    }
  }
  mappings.sort((a, b) => order(segs, a.segments[0]) - order(segs, b.segments[0]));

  const sections = range16().map((n) => ({ n, segments: segs.filter((s) => s.section === n).map(({ section: _s, ...seg }) => clean(seg)) }));
  const text: Text = { work: WORK, translation: cfg.translation, sections };
  const refmap: RefMap = {
    work: WORK, translation: cfg.translation, numbering: cfg.numbering, printsVerses: cfg.printsVerses, editionName: cfg.editionName,
    editorial: { content: "authentic", transcription: "unchecked", note: cfg.alignmentNote, reviews: [] },
    mappings,
  };
  const alignment: Alignment = {
    work: WORK, translation: cfg.translation,
    editorial: { content: "authentic", transcription: "unchecked", note: `${cfg.alignmentNote} Generated from refmap.json (verse-level mappings only).`, reviews: [] },
    segments: Object.fromEntries(mappings.filter((m) => m.level === "verse").flatMap((m) => m.segments.map((id) => [id, m.refs]))),
  };
  return { text, refmap, alignment };
}

// ---------- Sources: the working files, or the committed text rebuilt ----------

export const sha256 = (b: Buffer | string) => crypto.createHash("sha256").update(b).digest("hex");
/** Folder holding transcription/<file>, from $SCRIPTORIAS_TRANSCRIPTIONS (or --from); null if unset. */
export const sourceFromEnv = () => (process.env.SCRIPTORIAS_TRANSCRIPTIONS ? path.resolve(process.env.SCRIPTORIAS_TRANSCRIPTIONS) : null);
export const trDir = (tr: string) => path.join(CONTENT, "works", WORK, "translations", tr);
const readJson = <T,>(f: string): T => JSON.parse(fs.readFileSync(f, "utf8"));

/** The committed text.json turned back into the transcription files, split by recorded size. */
export function rebuiltFiles(cfg: EditionConfig): { name: string; bytes: Buffer }[] {
  const tr = readJson<Translation>(path.join(trDir(cfg.translation), "translation.json"));
  const files = tr.provenance?.workingFiles?.files;
  if (!files) throw new Error(`${cfg.translation}: translation.json has no provenance.workingFiles`);
  if (files.map((f) => f.name).join() !== cfg.files.join()) throw new Error(`${cfg.translation}: recorded files differ from the configured files`);
  const all = Buffer.from(reconstructText(readJson<Text>(path.join(trDir(cfg.translation), "text.json"))), "utf8");
  let off = 0;
  const out = files.map((f) => { const bytes = all.subarray(off, off + f.bytes); off += f.bytes; return { name: f.name, bytes }; });
  if (off !== all.length) throw new Error(`${cfg.translation}: rebuilt text has ${all.length - off} bytes more than the recorded files`);
  return out;
}

function sourceDir(argv: string[]) {
  const i = argv.indexOf("--from");
  return i >= 0 ? path.resolve(argv[i + 1]) : sourceFromEnv();
}
export const hasSource = (dir: string | null): dir is string => Boolean(dir) && EDITIONS.every((e) => e.files.every((f) => fs.existsSync(path.join(dir!, "transcription", f))));

function git(dir: string, ...args: string[]) {
  return execFileSync("git", ["-C", dir, ...args], { encoding: "utf8" }).trim();
}

/** Everything the importer writes, keyed by path relative to content/. */
export function generate(read: (cfg: EditionConfig) => { name: string; bytes: Buffer }[], workingFiles?: (cfg: EditionConfig, files: { name: string; bytes: Buffer }[]) => NonNullable<NonNullable<Translation["provenance"]>["workingFiles"]>) {
  const out = new Map<string, unknown>();
  const w = (f: string) => path.join("works", WORK, f);
  for (const cfg of EDITIONS) {
    const files = read(cfg);
    const built = buildEdition(cfg, Buffer.concat(files.map((f) => f.bytes)).toString("utf8"));
    const t = (f: string) => w(path.join("translations", cfg.translation, f));
    out.set(t("text.json"), built.text);
    out.set(t("refmap.json"), built.refmap);
    out.set(t("alignment.json"), built.alignment);
    const file = path.join(CONTENT, t("translation.json"));
    const tr = fs.existsSync(file) ? readJson<Translation>(file) : template(cfg);
    if (workingFiles) tr.provenance = { method: "", copies: [], ocrAssisted: [], ...tr.provenance, workingFiles: workingFiles(cfg, files) };
    out.set(t("translation.json"), tr);
  }
  out.set(w("questions.json"), QUESTIONS);
  out.set(w("differences.json"), DIFFERENCES);
  out.set(w(path.join("translations", GRC, "corrections.json")), CORRECTIONS);
  return out;
}

// ---------- CLI ----------
if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const check = argv.includes("--check");
  const dir = sourceDir(argv);
  const present = hasSource(dir);
  let problems = 0;
  const fail = (m: string) => { problems++; console.error(`✗ ${m}`); };

  if (!check && !present) { console.error(`✗ working transcription files not found${dir ? ` in ${dir}/transcription` : ""} (use --from <dir> or SCRIPTORIAS_TRANSCRIPTIONS)`); process.exit(1); }

  let commit = "", date = "";
  if (present && !check) {
    // (dir is set whenever the files are present)
    commit = git(dir!, "rev-parse", "HEAD");
    date = git(dir!, "log", "-1", "--format=%cs");
    const dirty = git(dir!, "status", "--porcelain", "--", ...EDITIONS.flatMap((e) => e.files.map((f) => path.join("transcription", f))));
    if (dirty) { console.error("✗ the working transcription files have uncommitted changes; commit them first"); process.exit(1); }
  }
  const fromSource = (cfg: EditionConfig) => cfg.files.map((name) => ({ name, bytes: fs.readFileSync(path.join(dir!, "transcription", name)) }));

  if (check) {
    // 1. The committed text rebuilds files with the recorded checksums (works without the source).
    for (const cfg of EDITIONS) {
      const tr = readJson<Translation>(path.join(trDir(cfg.translation), "translation.json"));
      const rec = tr.provenance?.workingFiles?.files ?? [];
      let rebuilt: { name: string; bytes: Buffer }[] = [];
      try { rebuilt = rebuiltFiles(cfg); } catch (e) { fail(String((e as Error).message)); continue; }
      rebuilt.forEach((f, i) => { if (sha256(f.bytes) !== rec[i].sha256) fail(`${cfg.translation}: text.json does not rebuild ${f.name} (SHA-256 differs from the record)`); });
      // 2. With the source present, the files there are the recorded ones, byte for byte.
      if (present) fromSource(cfg).forEach((f, i) => { if (!f.bytes.equals(rebuilt[i]?.bytes ?? Buffer.alloc(0))) fail(`${cfg.translation}: ${f.name} in ${dir} differs from the committed text`); });
    }
    // 3. Every generated file is what the importer produces.
    if (!problems) {
      const out = generate(present ? fromSource : rebuiltFiles);
      for (const [f, data] of out) {
        const p = path.join(CONTENT, f);
        if (!fs.existsSync(p) || fs.readFileSync(p, "utf8") !== stringify(data)) fail(`${f} differs from importer output (npm run content:import-lightfoot)`);
      }
    }
    if (problems) process.exit(1);
    console.log(`✓ Lightfoot 1891: ${EDITIONS.length} editions rebuild their ${EDITIONS.reduce((n, e) => n + e.files.length, 0)} transcription files byte for byte${present ? ` (also compared with ${dir})` : " (working files not present; checked against the recorded SHA-256)"}`);
  } else {
    const out = generate(fromSource, (_cfg, files) => ({ commit, date, files: files.map((f) => ({ name: f.name, bytes: f.bytes.length, sha256: sha256(f.bytes) })) }));
    for (const [f, data] of out) {
      const p = path.join(CONTENT, f);
      const next = stringify(data);
      if (fs.existsSync(p) && fs.readFileSync(p, "utf8") === next) continue;
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, next);
      console.log(`wrote ${f}`);
    }
    console.log(`imported ${EDITIONS.length} editions from commit ${commit.slice(0, 12)}`);
  }
}
