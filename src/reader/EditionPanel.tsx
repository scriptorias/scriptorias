/**
 * Edition and editorial status for page-image transcriptions with an edition-aware reference map
 * (refmap.json): status line and error reports, edition references next to SCRIPTORIAS refs,
 * provisional mappings and open questions, edition differences, provenance (external source links
 * only; no page images) and the correction history.
 */
import type { ReactNode } from "react";
import { Link } from "react-router";
import { citationText, source } from "../content/catalog";
import { basisLabel, editionLabel, isProvisional, kindLabel, mappingsFor, pagesText, shortRef, uniq } from "../content/editions";
import { PROVISIONAL, transcriptionLabel } from "../content/labels";
import { CC0_NOTICE, FACTUAL_NOTICE, REPORT_NOTE, STATUS_DETAIL } from "../content/notices";
import type { EditionDifference, EditorialQuestion, RefMap, RefMapping, Revision, Translation } from "../content/schema";
import { Notice, richText } from "../components/Notice";
import { readPath } from "../lib/paths";

export interface EditionData { refmap: RefMap; questions: EditorialQuestion[]; differences: EditionDifference[]; revisions: Revision[] }

interface Props {
  work: string;
  tr: Translation;
  data: EditionData;
  chapter: number;
  /** Segments of the current selection, if any. */
  selected: string[];
  /** The other available edition of this work with a reference map, if any. */
  other?: Translation;
  preview: boolean;
  reportHref: string;
  /** Switch to another translation at a SCRIPTORIAS ref (or the chapter). */
  onSwitch: (tr: string, ref: string) => void;
}

/** "Lightfoot" from "Lightfoot Greek": whose numbering the edition prints. */
const editorOf = (map: RefMap) => map.editionName.split(" ")[0];

function Provisional() {
  return <span className="ed-prov">{PROVISIONAL}</span>;
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

export function EditionPanel({ work, tr, data, chapter, selected, other, preview, reportHref, onSwitch }: Props) {
  const { refmap: map, questions: allQ, differences, revisions } = data;
  const greek = map.printsVerses;
  const inCh = map.mappings.filter((m) => m.segments.some((s) => Number(s.split(".")[0]) === chapter));
  const pages = uniq(inCh.flatMap((m) => m.pages));
  const verseRows = inCh.filter((m) => m.level === "verse");
  const printedVerses = greek ? verseRows.map((m) => m.edition[0].split(".")[1]) : [];
  const roman = greek ? verseRows[0]?.edition[0].split(".")[0] : String(chapter);
  const chRef = `${work}.${chapter}`;
  const touches = (refs: string[]) => refs.some((r) => r === chRef || r.startsWith(chRef + "."));
  const forTr = (q: EditorialQuestion) => !q.translations.length || q.translations.includes(tr.id);
  const questions = allQ.filter((q) => q.status === "open" && touches(q.refs) && forTr(q));
  const general = allQ.filter((q) => q.status === "open" && !q.refs.length && forTr(q));
  const diffs = differences.filter((d) => d.translation === tr.id && touches(d.refs));
  const ocr = (tr.provenance?.ocrAssisted ?? []).filter((o) => o.sections.includes(chapter));
  const selMaps = mappingsFor(map, selected);
  const target = selMaps.flatMap((m) => m.refs).find((r) => r.split(".").length === 3) ?? chRef;
  const special = inCh.filter((m) => m.kind !== "one-to-one" || isProvisional(m));
  const editorial = inCh.some((m) => m.basis === "editorial");
  const editor = editorOf(map);
  const status = transcriptionLabel(tr.editorial);
  const prov = tr.provenance;

  return (
    <section className="ed-panel" aria-label="Edition and editorial status" data-tr={tr.id}>
      {preview && <p className="ed-preview" data-preview>Preview · not yet released</p>}
      <p className="ed-status" data-notice="status">
        {status && <b>{status}.</b>} {richText(STATUS_DETAIL)}{" "}
        <a href={reportHref} target="_blank" rel="noopener" data-report>Report a suspected error</a> {REPORT_NOTE}.
      </p>
      {ocr.map((o) => <p key={o.page} className="ed-warn" data-ocr-page={o.page}><b>OCR-assisted page {o.page}.</b> {o.note}</p>)}
      <p className="ed-edition" data-edition-ref>
        {greek
          ? <>{tr.label}, chapter {roman}, printed verses {printedVerses[0]}–{printedVerses[printedVerses.length - 1]}, {pagesText(pages)}.</>
          : <>{tr.label}, chapter {chapter} ({editor} prints no verse numbers), {pagesText(pages)}.</>}
        {" "}SCRIPTORIAS reference: <code>{chRef}</code>.
        {editorial && <> Verse numbers in [brackets] are an <b>editorial alignment</b>, not {editor}'s; they are provisional.</>}
      </p>
      {other && (
        <p className="ed-switch">
          <button type="button" className="ed-btn" onClick={() => onSwitch(other.id, target)} data-switch-to={other.id}>
            {other.language === "grc" ? "Read this passage in Greek" : "Read this passage in English"} ({shortRef(target)})
          </button>
        </p>
      )}
      {special.length > 0 && (
        <div className="ed-callout" data-mapping-callout>
          <h2>Edition references and SCRIPTORIAS references differ here</h2>
          <MappingRows map={map} mappings={special} selected={selected} />
        </div>
      )}
      <details className="ed-details" data-section="refs">
        <summary>All references in this chapter ({inCh.length})</summary>
        <MappingRows map={map} mappings={inCh} selected={selected} />
        <p className="ed-small">Numbering: {map.numbering}</p>
        <Notice kind="cc0" className="ed-small" text={CC0_NOTICE} />
      </details>
      <details className="ed-details" data-section="questions" open={questions.length > 0}>
        <summary>Open questions ({PROVISIONAL.toLowerCase()}): {questions.length} in this chapter, {general.length} general</summary>
        <ul className="ed-list">
          {[...questions, ...general].map((q) => (
            <li key={q.id} data-question={q.id}><Provisional /> <b>{q.title}</b> <span>{q.detail}</span></li>
          ))}
        </ul>
        <Notice kind="cc0" className="ed-small" text={CC0_NOTICE} />
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
      <details className="ed-details" data-section="provenance">
        <summary>Sources, provenance and correction history</summary>
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
        <Notice kind="factual" className="ed-small" text={FACTUAL_NOTICE} />
        <h3 id="correction-history">Correction history</h3>
        <ul className="ed-list" data-revisions>
          {revisions.map((r) => <li key={r.version}><b>{r.version}</b> ({r.date}): {r.description}</li>)}
        </ul>
      </details>
    </section>
  );
}
