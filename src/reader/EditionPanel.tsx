/**
 * Edition and editorial status for page-image transcriptions with an edition-aware reference map
 * (refmap.json). The reading screen shows only the chapter and its text: the language switch sits
 * in the reader's top bar, and everything about the edition lives in the Contents panel, in
 * sections closed by default under a one-line status summary:
 * - About this edition: status, the edition, sources and provenance (external source links only;
 *   no page images), the copies and the working-file checksums;
 * - Licensing & notices: public domain, CC0, factual data;
 * - References & textual notes: edition references next to SCRIPTORIAS refs, provisional mappings,
 *   open questions, edition differences and OCR-assisted pages;
 * - Correction history; Report a suspected error.
 * Provisional readings and mappings carry small inline markers whose explanation links there.
 */
import type { ReactNode } from "react";
import { Link } from "react-router";
import { citationText, source } from "../content/catalog";
import { basisLabel, editionLabel, isProvisional, kindLabel, mappingsFor, pagesText, shortRef, uniq } from "../content/editions";
import { PROVISIONAL, transcriptionLabel } from "../content/labels";
import { CC0_NOTICE, FACTUAL_NOTICE, REPORT_NOTE, STATUS_DETAIL } from "../content/notices";
import type { EditionDifference, EditorialQuestion, RefMap, RefMapping, Revision, Segment, Translation } from "../content/schema";
import { Notice, richText } from "../components/Notice";
import { readPath } from "../lib/paths";

export interface EditionData { refmap: RefMap; questions: EditorialQuestion[]; differences: EditionDifference[]; revisions: Revision[] }

/** The edition sections in the Contents panel, all closed by default. */
export type EditionSection = "about" | "licensing" | "notes" | "history" | "report";
export const SECTION_ID: Record<EditionSection, string> = { about: "ed-about", licensing: "ed-licensing", notes: "ed-notes", history: "correction-history", report: "ed-report" };
export const SECTION_TITLE: Record<EditionSection, string> = {
  about: "About this edition", licensing: "Licensing & notices", notes: "References & textual notes", history: "Correction history", report: "Report a suspected error",
};
export const NO_SECTIONS: Record<EditionSection, boolean> = { about: false, licensing: false, notes: false, history: false, report: false };

/** "Lightfoot" from "Lightfoot Greek": whose numbering the edition prints. */
const editorOf = (map: RefMap) => map.editionName.split(" ")[0];
const touchesChapter = (refs: string[], chRef: string) => refs.some((r) => r === chRef || r.startsWith(chRef + "."));
const forTr = (q: EditorialQuestion, tr: string) => !q.translations.length || q.translations.includes(tr);
const openQuestions = (data: EditionData, tr: string) => data.questions.filter((q) => q.status === "open" && forTr(q, tr));

function Provisional() {
  return <span className="ed-prov">{PROVISIONAL}</span>;
}

/** Where the language switch lands: the selected verse, else the chapter. */
export function switchTarget(map: RefMap, selected: string[], chRef: string) {
  return mappingsFor(map, selected).flatMap((m) => m.refs).find((r) => r.split(".").length === 3) ?? chRef;
}

// ----- Language switch in the top bar -----

const languageName = (t: Translation) => (t.language === "grc" ? "Greek" : t.language === "en" ? "English" : t.label);

interface ToggleProps {
  tr: Translation;
  other: Translation;
  /** SCRIPTORIAS ref the switch opens: the selected verse, else the chapter. */
  target: string;
  onSwitch: (tr: string, ref: string) => void;
}

/** A compact English / Greek switch (toggle buttons; Tab, Enter and Space). */
export function LanguageToggle({ tr, other, target, onSwitch }: ToggleProps) {
  const both = [tr, other].sort((a, b) => (a.language === "en" ? -1 : b.language === "en" ? 1 : 0));
  return (
    <div className="rd-lang" role="group" aria-label="Text language" data-lang-toggle>
      {both.map((t) => t.id === tr.id ? (
        <button key={t.id} type="button" aria-pressed="true" data-lang={t.language}>{languageName(t)}</button>
      ) : (
        <button key={t.id} type="button" aria-pressed="false" data-lang={t.language} data-switch-to={t.id}
          title={`Read ${shortRef(target)} in ${languageName(t)}`} onClick={() => onSwitch(t.id, target)}>{languageName(t)}</button>
      ))}
    </div>
  );
}

// ----- Collapsible sections in the Contents panel -----

function Drawer({ name, open, onToggle, children }: { name: EditionSection; open: boolean; onToggle: () => void; children: ReactNode }) {
  const id = SECTION_ID[name];
  return (
    <section className={`ed-drawer${open ? " open" : ""}`} aria-labelledby={`${id}-h`} data-drawer={name}>
      <h4 className="ed-drawer-h">
        <button type="button" id={`${id}-h`} aria-expanded={open} aria-controls={id} onClick={onToggle}>{SECTION_TITLE[name]}</button>
      </h4>
      <div id={id} className="ed-drawer-body" hidden={!open}>{children}</div>
    </section>
  );
}

function MappingRows({ map, mappings, selected = [] }: { map: RefMap; mappings: RefMapping[]; selected?: string[] }) {
  const editor = editorOf(map);
  // A note shared by several rows (e.g. the editorial-alignment note) is shown once, on its first row.
  const firstWithNote = new Map<string, RefMapping>();
  for (const m of mappings) if (m.note && !firstWithNote.has(m.note)) firstWithNote.set(m.note, m);
  return (
    <table className="ed-table">
      <thead><tr><th scope="col">Edition (as printed)</th><th scope="col">SCRIPTORIAS</th><th scope="col">Correspondence</th></tr></thead>
      <tbody>
        {mappings.map((m) => (
          <tr key={m.segments.join()} data-segs={m.segments.join(" ")} data-basis={m.basis} data-certainty={m.certainty}
            className={`${m.segments.some((s) => selected.includes(s)) ? "on" : ""}${m.certainty === "uncertain" ? " uncertain" : ""}`}>
            <td>{editionLabel(map, m)}{m.pages.length ? <small> · {pagesText(m.pages)}</small> : null}</td>
            <td>{m.refs.length ? m.refs.map((r) => <Link key={r} to={readPath(map.work, r, { tr: map.translation })}>{shortRef(r)}</Link>).reduce<ReactNode[]>((a, x, i) => (i ? [...a, ", ", x] : [x]), []) : "—"}</td>
            <td>
              <span className={`ed-basis ${m.basis}`}>{basisLabel(m, editor)}</span>
              {m.kind !== "one-to-one" && m.kind !== "unmapped" && <span className="ed-kind"> · {kindLabel[m.kind]}</span>}
              {isProvisional(m) && <> · <Provisional /></>}
              {m.starts && Object.keys(m.starts).length > 1 && (
                <small className="ed-starts">{Object.entries(m.starts).map(([r, w]) => `${shortRef(r)} begins “${w}”`).join(" · ")}</small>
              )}
              {m.note && firstWithNote.get(m.note) === m && m.kind !== "unmapped" && (m.certainty === "uncertain" || m.kind === "one-to-many" || m.basis === "editorial") && <small className="ed-note">{m.note}</small>}
              {m.alternatives.map((a, i) => <small key={i} className="ed-alt">Alternative: {a.note}</small>)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface SectionsProps {
  work: string;
  tr: Translation;
  data: EditionData;
  chapter: number;
  /** Segments of the current selection, if any. */
  selected: string[];
  reportHref: string;
  open: Record<EditionSection, boolean>;
  onToggle: (s: EditionSection) => void;
}

/** The edition block of the Contents panel: a one-line status summary and five closed sections. */
export function EditionSections({ work, tr, data, chapter, selected, reportHref, open, onToggle }: SectionsProps) {
  const { refmap: map, differences, revisions } = data;
  const greek = map.printsVerses;
  const inCh = map.mappings.filter((m) => m.segments.some((s) => Number(s.split(".")[0]) === chapter));
  const pages = uniq(inCh.flatMap((m) => m.pages));
  const verseRows = inCh.filter((m) => m.level === "verse");
  const printedVerses = greek ? verseRows.map((m) => m.edition[0].split(".")[1]) : [];
  const roman = greek ? verseRows[0]?.edition[0].split(".")[0] : String(chapter);
  const chRef = `${work}.${chapter}`;
  const all = openQuestions(data, tr.id);
  const questions = all.filter((q) => touchesChapter(q.refs, chRef));
  const general = all.filter((q) => !q.refs.length);
  const diffs = differences.filter((d) => d.translation === tr.id && touchesChapter(d.refs, chRef));
  const ocr = (tr.provenance?.ocrAssisted ?? []).filter((o) => o.sections.includes(chapter));
  const special = inCh.filter((m) => m.kind !== "one-to-one" || isProvisional(m));
  const editorial = inCh.some((m) => m.basis === "editorial");
  const editor = editorOf(map);
  const status = transcriptionLabel(tr.editorial);
  const prov = tr.provenance;
  const section = (name: EditionSection, children: ReactNode) => <Drawer name={name} open={open[name]} onToggle={() => onToggle(name)}>{children}</Drawer>;

  return (
    <div className="rd-block ed-sections" data-tr={tr.id}>
      <h3>This edition</h3>
      {status && <p className="ed-summary" data-status-line>{status}</p>}

      {section("about", <>
        <p className="ed-status" data-notice="status">
          {status && <b>{status}.</b>} {richText(STATUS_DETAIL)}{" "}
          <a href={reportHref} target="_blank" rel="noopener" data-report>Report a suspected error</a> {REPORT_NOTE}.
        </p>
        {tr.edition && <p className="ed-small" data-edition-name>Edition: {citationText({ source: tr.edition.source, locator: `pp. ${tr.edition.pages}` })}</p>}
        <div className="ed-block" data-section="provenance">
          <h5>Sources and provenance</h5>
          {tr.notices?.sources && <Notice kind="sources" className="ed-small" text={tr.notices.sources} />}
          {prov && (
            <ul className="ed-list" data-copies>
              {prov.copies.map((c) => {
                const scan = source(c.source)?.scans.find((s) => s.id === c.scan);
                return (
                  <li key={c.scan}>
                    <b>{c.role === "reading" ? "Reading copy" : "Check copy"}:</b> {scan?.holding}{scan?.printing ? `, ${scan.printing.split(" (")[0]}` : ""} ·{" "}
                    {scan ? <a href={scan.url} target="_blank" rel="noopener">Internet Archive {c.scan}</a> : c.scan}{c.images ? ` · ${c.images}` : ""}
                  </li>
                );
              })}
            </ul>
          )}
          {prov?.workingFiles && (
            <>
              <p className="ed-small">Generated from the SCRIPTORIAS working transcription files (commit <code>{prov.workingFiles.commit.slice(0, 12)}</code>, {prov.workingFiles.date}); the text here rebuilds them byte for byte:</p>
              <ul className="ed-list ed-files">
                {prov.workingFiles.files.map((f) => <li key={f.name}><code>{f.name}</code> · {f.bytes} bytes · SHA-256 <code className="ed-hash">{f.sha256}</code></li>)}
              </ul>
            </>
          )}
        </div>
      </>)}

      {section("licensing", <>
        {tr.notices?.publicDomain && <Notice kind="public-domain" className="ed-small" text={tr.notices.publicDomain} />}
        <Notice kind="cc0" className="ed-small" text={CC0_NOTICE} />
        <Notice kind="factual" className="ed-small" text={FACTUAL_NOTICE} />
      </>)}

      {section("notes", <>
        {ocr.map((o) => <p key={o.page} className="ed-warn" data-ocr-page={o.page}><b>OCR-assisted page {o.page}.</b> {o.note}</p>)}
        <p className="ed-edition" data-edition-ref>
          {greek
            ? <>{tr.label}, chapter {roman}, printed verses {printedVerses[0]}–{printedVerses[printedVerses.length - 1]}, {pagesText(pages)}.</>
            : <>{tr.label}, chapter {chapter} ({editor} prints no verse numbers), {pagesText(pages)}.</>}
          {" "}SCRIPTORIAS reference: <code>{chRef}</code>.
          {editorial && <> Verse numbers in [brackets] are an <b>editorial alignment</b>, not {editor}'s; they are provisional.</>}
        </p>
        {special.length > 0 && (
          <div className="ed-callout" data-mapping-callout>
            <h5>Edition references and SCRIPTORIAS references differ here</h5>
            <MappingRows map={map} mappings={special} selected={selected} />
          </div>
        )}
        <div className="ed-block" data-section="questions">
          <h5>Open questions ({PROVISIONAL.toLowerCase()}): {questions.length} in this chapter, {general.length} general</h5>
          <ul className="ed-list">
            {[...questions, ...general].map((q) => (
              <li key={q.id} data-question={q.id}><Provisional /> <b>{q.title}</b> <span>{q.detail}</span></li>
            ))}
          </ul>
        </div>
        <details className="ed-details" data-section="refs">
          <summary>All references in this chapter ({inCh.length})</summary>
          <MappingRows map={map} mappings={inCh} selected={selected} />
          <p className="ed-small">Numbering: {map.numbering}</p>
        </details>
        {diffs.length > 0 && (
          <details className="ed-details" data-section="differences">
            <summary>Edition differences in this chapter ({diffs.length})</summary>
            <ul className="ed-list">
              {diffs.map((d, i) => <li key={i}><b>{d.refs.map(shortRef).join(", ")}</b> {d.kind}: {editor} {d.reading}; {citationText(d.witness).split(",")[0]}: {d.other}</li>)}
            </ul>
            <p className="ed-small">Recorded, not harmonized: the text stays as {editor} printed it.</p>
          </details>
        )}
        <Notice kind="cc0" className="ed-small" text={CC0_NOTICE} />
      </>)}

      {section("history",
        <ul className="ed-list" data-revisions>
          {revisions.map((r) => <li key={r.version}><b>{r.version}</b> ({r.date}): {r.description}</li>)}
        </ul>,
      )}

      {section("report", <>
        <p><a href={reportHref} target="_blank" rel="noopener" data-report="chapter">Report a suspected error in chapter {chapter}</a> {REPORT_NOTE}.</p>
        <p className="ed-small">To report a single passage, select its number in the text and choose Report a suspected error.</p>
      </>)}
    </div>
  );
}

// ----- Inline provisional markers -----

export interface MarkInfo { key: string; label: string; body: ReactNode }

/**
 * Small markers in the text where something is provisional: an uncertain reading, an uncertain
 * edition mapping (at the mapping's first segment), and editorial verse numbers (once per chapter,
 * at the first one). Each opens its explanation in place.
 */
export function provisionalMarks(work: string, tr: Translation, data: EditionData, chapter: number, segs: Segment[], refOf: (seg: string) => string) {
  const map = data.refmap;
  const editor = editorOf(map);
  const chRef = `${work}.${chapter}`;
  const qs = openQuestions(data, tr.id);
  const questionItems = (list: EditorialQuestion[]) => list.map((q) => <span key={q.id} className="ed-pop-q" data-question={q.id}><b>{q.title}</b> {q.detail}</span>);
  const bySeg = new Map<string, MarkInfo[]>();
  const add = (seg: string, m: MarkInfo) => bySeg.set(seg, [...(bySeg.get(seg) ?? []), m]);
  let editorialDone = false;
  for (const s of segs) {
    const m = mappingsFor(map, [s.id])[0];
    if (m && m.segments[0] === s.id && m.certainty === "uncertain") {
      const refs = m.refs.map(shortRef).join(" and ");
      const related = qs.filter((q) => q.refs.some((r) => m.refs.includes(r)) && q.refs.length > 0);
      add(s.id, {
        key: `map-${s.id}`,
        label: `Provisional mapping: ${editionLabel(map, m)} = SCRIPTORIAS ${refs}`,
        body: <>
          <span className="ed-pop-t">{editionLabel(map, m)} = SCRIPTORIAS {refs} (provisional mapping)</span>
          {m.note && <span className="ed-pop-p">{m.note}</span>}
          {m.alternatives.map((a, i) => <span key={i} className="ed-pop-p">Alternative: {a.note}</span>)}
          {questionItems(related)}
        </>,
      });
    }
    if (m && m.basis === "editorial" && !editorialDone) {
      editorialDone = true;
      const note = map.mappings.find((x) => x.basis === "editorial" && x.note && x.segments.some((g) => Number(g.split(".")[0]) === chapter))?.note;
      add(s.id, {
        key: `editorial-${chapter}`,
        label: "Editorial verse numbers: provisional",
        body: <>
          <span className="ed-pop-t">Verse numbers in [brackets] are an editorial alignment, not {editor}'s; they are provisional.</span>
          {note && <span className="ed-pop-p">{note}</span>}
          {questionItems(qs.filter((q) => q.refs.includes(chRef)))}
        </>,
      });
    }
    (s.runs ?? []).forEach((r, i) => {
      if (!r.uncertain) return;
      const ref = refOf(s.id);
      add(s.id, {
        key: `unc-${s.id}-${i}`,
        label: `Provisional reading ${shortRef(ref)}: ${r.t}`,
        body: <>
          <span className="ed-pop-t">Uncertain reading (provisional), shown as ⟦?…⟧.</span>
          {questionItems(qs.filter((q) => q.refs.includes(ref)))}
        </>,
      });
    });
  }
  return bySeg;
}

export function ProvisionalMark({ mark, open, onToggle, onMore }: { mark: MarkInfo; open: boolean; onToggle: () => void; onMore: () => void }) {
  const id = `pm-${mark.key.replace(/[^\w-]/g, "_")}`;
  return (
    <span className="ed-mark" data-mark={mark.key}>
      <button type="button" className="ed-mark-btn" aria-expanded={open} aria-controls={id} aria-label={mark.label} title={mark.label} onClick={onToggle}>?</button>
      <span id={id} className="ed-pop" role="note" data-pop={mark.key} hidden={!open}>
        <Provisional />
        {mark.body}
        <button type="button" className="ed-linkbtn" onClick={onMore} data-more>References &amp; textual notes (in Contents)</button>
      </span>
    </span>
  );
}
