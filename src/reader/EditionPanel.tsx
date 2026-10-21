/**
 * Edition and editorial status for page-image transcriptions with an edition-aware reference map
 * (refmap.json). The text comes first: above it only a compact edition header (edition name, a
 * small status line, the language switch); everything else sits in two sections after the text,
 * closed by default, and in small inline markers on provisional readings and mappings:
 * - References & textual notes: edition references next to SCRIPTORIAS refs, provisional mappings,
 *   open questions, edition differences, OCR-assisted pages and the correction history;
 * - About this edition: status and error reports, public notices, provenance (external source
 *   links only; no page images) and the working-file checksums.
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

/** The two closed-by-default sections after the text. */
export type EditionSection = "notes" | "about";
export const SECTION_ID: Record<EditionSection, string> = { notes: "ed-notes", about: "ed-about" };

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

// ----- Header above the text -----

interface HeaderProps {
  tr: Translation;
  other?: Translation;
  /** SCRIPTORIAS ref the language switch opens. */
  target: string;
  preview: boolean;
  aboutOpen: boolean;
  onSwitch: (tr: string, ref: string) => void;
  onAbout: () => void;
}

export function EditionHeader({ tr, other, target, preview, aboutOpen, onSwitch, onAbout }: HeaderProps) {
  const status = transcriptionLabel(tr.editorial);
  return (
    <section className="ed-head" aria-label="Edition" data-tr={tr.id}>
      <div className="ed-id">
        <p className="ed-name"><b>{tr.label}</b>{tr.detail && <span> · {tr.detail}</span>}</p>
        <p className="ed-statusline" data-status-line>
          {preview && <span className="ed-preview" data-preview>Preview · not yet released</span>}
          {status && <span className="ed-badge">{status}</span>}
          <button type="button" className="ed-linkbtn" aria-expanded={aboutOpen} aria-controls={SECTION_ID.about} onClick={onAbout} data-open-about>About this edition</button>
        </p>
      </div>
      {other && (
        <button type="button" className="ed-btn ed-switch" onClick={() => onSwitch(other.id, target)} data-switch-to={other.id}>
          {other.language === "grc" ? "Read this passage in Greek" : "Read this passage in English"} ({shortRef(target)})
        </button>
      )}
    </section>
  );
}

// ----- Collapsible sections after the text -----

function Drawer({ name, title, open, onToggle, children }: { name: EditionSection; title: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  const id = SECTION_ID[name];
  return (
    <section className={`ed-drawer${open ? " open" : ""}`} aria-labelledby={`${id}-h`} data-drawer={name}>
      <h2 id={`${id}-h`} className="ed-drawer-h">
        <button type="button" aria-expanded={open} aria-controls={id} onClick={onToggle}>{title}</button>
      </h2>
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

/** "References & textual notes" and "About this edition", both closed by default. */
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

  return (
    <div className="ed-sections" data-tr={tr.id}>
      <Drawer name="notes" title="References & textual notes" open={open.notes} onToggle={() => onToggle("notes")}>
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
            <h3>Edition references and SCRIPTORIAS references differ here</h3>
            <MappingRows map={map} mappings={special} selected={selected} />
          </div>
        )}
        <div className="ed-block" data-section="questions">
          <h3>Open questions ({PROVISIONAL.toLowerCase()}): {questions.length} in this chapter, {general.length} general</h3>
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
        <div className="ed-block" data-section="corrections">
          <h3 id="correction-history">Correction history</h3>
          <ul className="ed-list" data-revisions>
            {revisions.map((r) => <li key={r.version}><b>{r.version}</b> ({r.date}): {r.description}</li>)}
          </ul>
        </div>
        <Notice kind="cc0" className="ed-small" text={CC0_NOTICE} />
      </Drawer>

      <Drawer name="about" title="About this edition" open={open.about} onToggle={() => onToggle("about")}>
        <p className="ed-status" data-notice="status">
          {status && <b>{status}.</b>} {richText(STATUS_DETAIL)}{" "}
          <a href={reportHref} target="_blank" rel="noopener" data-report>Report a suspected error</a> {REPORT_NOTE}.
        </p>
        {tr.notices?.publicDomain && <Notice kind="public-domain" className="ed-small" text={tr.notices.publicDomain} />}
        <div className="ed-block" data-section="provenance">
          <h3>Sources and provenance</h3>
          {tr.notices?.sources && <Notice kind="sources" className="ed-small" text={tr.notices.sources} />}
          {tr.edition && <p className="ed-small">Edition: {citationText({ source: tr.edition.source, locator: `pp. ${tr.edition.pages}` })}</p>}
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
        <Notice kind="factual" className="ed-small" text={FACTUAL_NOTICE} />
        <Notice kind="cc0" className="ed-small" text={CC0_NOTICE} />
      </Drawer>
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
        <button type="button" className="ed-linkbtn" onClick={onMore}>References &amp; textual notes</button>
      </span>
    </span>
  );
}
