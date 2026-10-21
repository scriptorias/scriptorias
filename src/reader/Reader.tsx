/**
 * Reusable reader. Renders one translation of one work, one section (chapter) at a time.
 *
 * Passage identity is canonical: selections, bookmarks, citations, and notes use refs from the
 * work's reference scheme ("didache.1.2"), resolved through the translation's alignment. Segments
 * without verse-level alignment fall back to a section ref plus a translation-local anchor.
 * A side-by-side view can render a second translation and align its segments by the same refs.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { availableTranslations, defaultTranslation, resolveRef, resolveRetired, retiredTranslation, translationsFor, work as getWork } from "../content/catalog";
import { loadAlignment, loadDifferences, loadNotes, loadOverview, loadQuestions, loadRefMap, loadRevisions, loadText } from "../content/loaders";
import { AlignmentIndex, anchorOf, formatRef, isVerseRef, parseAnchor, sectionRef } from "../content/refs";
import type { Note, Run, Segment, Translation } from "../content/schema";
import { isPlaceholder, transcriptionLabel } from "../content/labels";
import { editionRef, numberInfo, shortRef } from "../content/editions";
import { CC0_NOTICE, REPORT_NOTE, reportUrl } from "../content/notices";
import { Icon } from "../components/Icon";
import { Notice, richText } from "../components/Notice";
import { Page, ShellFrame } from "../components/Shell";
import { NotFound } from "../pages/Misc";
import { bookmarkKey, getBookmarks, getPrefs, setPrefs, store, toggleBookmark, type Position, type ReaderPrefs } from "../lib/storage";
import { readPath, readSection, workPath } from "../lib/paths";
import { toast } from "../lib/toast";
import { useAsync } from "../lib/useAsync";
import { useTitle } from "../lib/useTitle";
import { prototypeTranslation } from "../lib/migrate";
import { EditionSections, LanguageToggle, NO_SECTIONS, ProvisionalMark, SECTION_ID, provisionalMarks, switchTarget, type EditionData, type EditionSection, type MarkInfo } from "./EditionPanel";

const SIZES = [16, 17, 18, 19, 20, 22, 24];
const LEADING = { compact: 1.55, comfortable: 1.75, airy: 1.95 } as const;
type Panel = "toc" | "notes" | "settings";
/** Panel state survives chapter changes within a session (as in the prototype). */
const ui: Record<Panel, boolean> = { toc: false, notes: false, settings: false };
const narrow = () => window.innerWidth < 1200;

interface Selection { ref: string; segs: string[]; anchor?: string }

/**
 * One run: italics, uncial type, an uncertain reading (shown as ⟦?…⟧, followed by its provisional
 * marker if any), or a printed page break.
 */
function runNode(r: Run, i: number, after?: ReactNode): ReactNode {
  if (r.pb !== undefined) return r.restated ? null : <span key={i} className="pb" data-page={r.pb} title={`Page ${r.pb} of the printed edition begins here`}>[p. {r.pb}]</span>;
  let n: ReactNode = r.t;
  if (r.uncertain) n = <span className="unc" title="Uncertain reading (provisional): see the open questions">⟦?{n}⟧</span>;
  if (r.uncial) n = <span className="uncial" title="Set in uncial type in the printed edition">{n}</span>;
  return r.em ? <em key={i}>{n}{after}</em> : <span key={i}>{n}{after}</span>;
}

function runsOf(seg: Segment, markFor?: (i: number) => ReactNode): ReactNode {
  if (seg.runs) return seg.runs.map((r, i) => runNode(r, i, r.uncertain ? markFor?.(i) : undefined));
  return (seg.lines ?? []).map((l, i) =>
    typeof l === "string" ? <span key={i} className="ln">{l}</span> : <span key={i} className="ln stanza">{l.t}</span>,
  );
}

export function Reader() {
  const params = useParams();
  const id = params.id!;
  const w = getWork(id);
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Translation: ?tr= (from an edition link) wins and becomes the preference.
  const avail = availableTranslations(id);
  const wanted = search.get("tr");
  if (wanted && avail.some((t) => t.id === wanted)) store.set(`rd.tr.${id}`, wanted);
  const stored = store.get<string | null>(`rd.tr.${id}`, null);
  const tr: Translation | undefined = avail.find((t) => t.id === (wanted ?? stored)) ?? defaultTranslation(id);
  // Links into a retired translation (?tr=<old id>, or prototype ?n= numbering) open the same
  // passage in its replacement, through the old segment map (work.retiredTranslations).
  const nParam = search.get("n");
  const proto = !wanted && nParam && params.ch ? prototypeTranslation(id) : undefined;
  const retiredId = wanted && retiredTranslation(id, wanted) ? wanted : proto && retiredTranslation(id, proto) ? proto : null;

  const text = useAsync(() => (tr ? loadText(id, tr.id) : Promise.resolve(null)), [id, tr?.id]);
  const alignment = useAsync(() => (tr ? loadAlignment(id, tr.id) : Promise.resolve(null)), [id, tr?.id]);
  const edition = useAsync(async (): Promise<EditionData | null> => {
    const refmap = tr ? await loadRefMap(id, tr.id) : null;
    if (!tr || !refmap) return null;
    const [questions, differences, revisions] = await Promise.all([loadQuestions(id), loadDifferences(id), loadRevisions(id, tr.id)]);
    return { refmap, questions, differences, revisions };
  }, [id, tr?.id]);
  const notes = useAsync(() => loadNotes(id), [id]);
  const overview = useAsync(() => loadOverview(id), [id]);
  useTitle(w?.title);

  if (!w) return <ShellFrame><NotFound /></ShellFrame>;
  if (retiredId) {
    const seg = search.get("seg") ?? (proto && nParam ? `${params.ch}.${nParam}` : null);
    const r = seg ? resolveRetired(id, retiredId, seg)! : null;
    const to = r
      ? readPath(id, r.ref, { tr: r.tr, ...(!isVerseRef(r.ref) && r.seg ? { seg: r.seg } : {}) })
      : readPath(id, params.ch ? `${id}.${params.ch}${params.verse ? `.${params.verse}` : ""}` : undefined, { tr: retiredTranslation(id, retiredId)!.replacedBy });
    return <Redirect to={to} />;
  }
  if (!tr) {
    return (
      <ShellFrame>
        <Page back={{ to: workPath(id), label: w.title }} className="soon-page">
          <h1>{w.title}</h1><p>Reading view coming soon</p>
          <Link className="crumb-link" to={workPath(id)}><Icon name="left" />Back to overview</Link>
        </Page>
      </ShellFrame>
    );
  }
  if (text === undefined || alignment === undefined || edition === undefined || notes === undefined || overview === undefined || !text) return <div className="rd" />;

  // A chapter in the URL must exist in the work; chapters outside this translation's coverage
  // get an explanation instead of silently opening another chapter.
  if (params.ch !== undefined) {
    const n = Number(params.ch);
    const total = w.refScheme?.sections ?? text.sections.length;
    if (!/^\d+$/.test(params.ch) || n < 1 || n > total) return <ShellFrame><NotFound /></ShellFrame>;
    if (!text.sections.some((s) => s.n === n)) {
      const label = w.refScheme?.sectionLabel ?? "Chapter";
      return (
        <ShellFrame>
          <Page back={{ to: workPath(id), label: w.title }} className="soon-page">
            <h1>{w.title} {n}</h1>
            <p>{label} {n} is not available in this edition yet</p>
            <Link className="crumb-link" to={readSection(id, text.sections[0].n)}><Icon name="left" />Read from {label.toLowerCase()} {text.sections[0].n}</Link>
          </Page>
        </ShellFrame>
      );
    }
  }

  return (
    <ReaderView
      key={`${id}:${tr.id}`}
      id={id} tr={tr} text={text} alignment={alignment} edition={edition} notes={notes} overview={overview}
      chParam={params.ch} verseParam={params.verse} segParam={search.get("seg")} nParam={nParam}
      navigate={navigate} locationKey={location.key}
    />
  );
}

/** Client-side redirect that replaces the history entry (old links keep the back button clean). */
function Redirect({ to }: { to: string }) {
  const navigate = useNavigate();
  useEffect(() => { navigate(to, { replace: true }); }, [to, navigate]);
  return <div className="rd" />;
}

type ViewProps = {
  id: string;
  tr: Translation;
  text: NonNullable<Awaited<ReturnType<typeof loadText>>>;
  alignment: Awaited<ReturnType<typeof loadAlignment>>;
  edition: EditionData | null;
  notes: Note[];
  overview: Awaited<ReturnType<typeof loadOverview>>;
  chParam?: string; verseParam?: string; segParam: string | null; nParam: string | null;
  navigate: ReturnType<typeof useNavigate>;
  locationKey: string;
};

function ReaderView({ id, tr, text, alignment, edition, notes, overview, chParam, verseParam, segParam, nParam, navigate, locationKey }: ViewProps) {
  const w = getWork(id)!;
  const scheme = w.refScheme;
  const label = scheme?.sectionLabel ?? "Chapter";
  const total = scheme?.sections ?? text.sections.length;
  const availSections = text.sections.map((s) => s.n);
  const saved = store.get<Position | null>(`rd.pos.${id}`, null);
  const chn = availSections.includes(Number(chParam)) ? Number(chParam) : saved && availSections.includes(saved.ch) ? saved.ch : availSections[0];
  const sec = text.sections.find((s) => s.n === chn)!;
  const idx = useMemo(() => new AlignmentIndex(id, text, alignment), [id, text, alignment]);
  const chRef = sectionRef(id, chn);

  const [prefs, setPrefState] = useState<ReaderPrefs>(getPrefs);
  const [panels, setPanels] = useState({ ...ui });
  const [, bump] = useState(0);
  const [sel, setSel] = useState<Selection | null>(null);
  // Edition sections in the Contents panel (closed by default) and the open provisional marker, if any.
  const [sections, setSections] = useState<Record<EditionSection, boolean>>(NO_SECTIONS);
  const [openMark, setOpenMark] = useState<string | null>(null);
  const progress = useRef<HTMLSpanElement>(null);
  const textEl = useRef<HTMLElement>(null);
  const done = store.get<number[]>(`rd.done.${id}`, []);

  // Panels close on narrow screens when the chapter changes; settings always closes.
  useEffect(() => {
    if (narrow()) { ui.toc = ui.notes = false; }
    ui.settings = false;
    setPanels({ ...ui });
    store.set("last", { work: id, ch: chn });
  }, [id, chn]);

  // Reading mode: hide the app chrome and apply the theme to the page background.
  useEffect(() => {
    document.body.classList.add("reading");
    return () => document.body.classList.remove("reading", "reading-dark");
  }, []);
  useEffect(() => { document.body.classList.toggle("reading-dark", prefs.theme === "dark"); }, [prefs.theme]);

  // ----- Selection -----
  const selectSeg = useCallback((segId: string | null, toggle = false) => {
    if (!segId) { setSel(null); return; }
    const ref = idx.refOf(segId);
    const next: Selection = isVerseRef(ref) ? { ref, segs: idx.segsOf(ref) } : { ref, segs: [segId], anchor: anchorOf(tr.id, segId) };
    setSel((cur) => (toggle && cur && cur.segs.join() === next.segs.join() ? null : next));
  }, [idx, tr.id]);

  // Initial target from the URL (canonical verse, segment, or source label), else resume position.
  useEffect(() => {
    let target: string | null = null;
    // A superseded verse division (work.refAliases) redirects to its current ref.
    const asked = verseParam ? `${id}.${chn}.${verseParam}` : null;
    if (asked && resolveRef(asked) !== asked) { navigate(readPath(id, asked, { tr: tr.id }), { replace: true }); return; }
    if (verseParam) target = idx.segsOf(`${id}.${chn}.${verseParam}`)[0] ?? null;
    else if (segParam) target = sec.segments.some((s) => s.id === segParam) ? segParam : null;
    else if (nParam) target = sec.segments.find((s) => s.n === nParam)?.id ?? null;
    selectSeg(target);
    requestAnimationFrame(() => {
      const resume = !chParam && saved?.ch === chn && saved.anchor ? parseAnchor(saved.anchor) : null;
      const el = target ? document.getElementById(`s-${target}`) : resume && resume.tr === tr.id ? document.getElementById(`s-${resume.seg}`) : null;
      if (el) el.scrollIntoView({ block: target ? "center" : "start" });
      else window.scrollTo(0, 0);
      onScroll();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationKey, chn]);

  // ----- Progress: bar, resume position, sections read -----
  const onScroll = useCallback(() => {
    const el = textEl.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const span = r.height - window.innerHeight * 0.5;
    const pct = Math.max(0, Math.min(1, span > 0 ? -r.top / span : 1));
    // A section counts as read once the end of its text has been on screen.
    const finished = r.bottom <= window.innerHeight;
    if (progress.current) progress.current.style.width = `${(pct * 100).toFixed(1)}%`;
    const top = [...el.querySelectorAll<HTMLElement>("[data-seg]")].find((p) => p.getBoundingClientRect().bottom > 90);
    store.set(`rd.pos.${id}`, { ch: chn, anchor: top ? anchorOf(tr.id, top.dataset.seg!) : null } satisfies Position);
    if (finished) {
      const d = store.get<number[]>(`rd.done.${id}`, []);
      if (!d.includes(chn)) store.set(`rd.done.${id}`, [...d, chn]);
    }
  }, [id, chn, tr.id]);
  useEffect(() => {
    let tick = false;
    const h = () => { if (!tick) { tick = true; requestAnimationFrame(() => { tick = false; onScroll(); }); } };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, [onScroll]);

  // ----- Panels and preferences -----
  const setPanel = (name: Panel, open?: boolean) => {
    ui[name] = open ?? !ui[name];
    if (ui[name]) for (const k of ["toc", "notes", "settings"] as Panel[]) if (k !== name && (narrow() || k === "settings" || name === "settings")) ui[k] = false;
    setPanels({ ...ui });
  };
  const closeAll = () => { for (const k of ["settings", "toc", "notes"] as Panel[]) if (ui[k] && (k === "settings" || narrow())) ui[k] = false; setPanels({ ...ui }); };
  const updatePrefs = (p: ReaderPrefs) => { setPrefs(p); setPrefState(p); };

  // ----- Keyboard -----
  const prev = availSections.filter((n) => n < chn).pop();
  const next = availSections.find((n) => n > chn);
  // The handler reads neighbours from a ref, so a key pressed right after a chapter change
  // never acts on the previous chapter's neighbours.
  const neighbours = useRef({ prev, next });
  neighbours.current = { prev, next };
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (/INPUT|TEXTAREA|SELECT/.test((document.activeElement as HTMLElement)?.tagName)) return;
      const { prev: p, next: n } = neighbours.current;
      if (e.key === "Escape") { setSel(null); setOpenMark(null); for (const k of ["toc", "notes", "settings"] as Panel[]) ui[k] = false; setPanels({ ...ui }); }
      if (e.key === "ArrowRight" && n) navigate(readSection(id, n));
      if (e.key === "ArrowLeft" && p) navigate(readSection(id, p));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [id, navigate]);

  // ----- Notes -----
  const sectionNotes = notes.filter((n) => n.ref === chRef);
  const verseNotes = useMemo(() => {
    const m = new Map<string, Note[]>();
    for (const n of notes) if (n.ref.startsWith(chRef + ".") && idx.segsOf(n.ref).length) m.set(n.ref, [...(m.get(n.ref) ?? []), n]);
    return m;
  }, [notes, chRef, idx]);
  const [focusNote, setFocusNote] = useState<string | null>(null);
  const openNotes = (ref: string) => { setPanel("notes", true); setFocusNote(ref); requestAnimationFrame(() => document.querySelector(`[data-for="${CSS.escape(ref)}"]`)?.scrollIntoView({ block: "nearest" })); };
  const notesPlaceholder = notes.some((n) => isPlaceholder(n.editorial));

  // ----- Bookmarks -----
  const marked = new Set(getBookmarks().map(bookmarkKey));
  const isMarked = (ref: string, anchor?: string) => marked.has(bookmarkKey({ ref, anchor }));
  const toggle = (ref: string, anchor?: string, what = "Passage") => {
    const on = toggleBookmark({ ref, work: id, ch: chn, tr: tr.id, ...(anchor ? { anchor } : {}) });
    bump((n) => n + 1);
    toast(on ? `${what} bookmarked` : "Bookmark removed");
  };

  // ----- Rendering helpers -----
  const groups = (overview?.structure?.length ? overview.structure : [{ from: 1, to: total, title: "" }]);
  const group = groups.find((g) => chn >= g.from && chn <= g.to);
  const yearOf = tr.year ? String(tr.year) : tr.detail;
  const sampleRange = availSections.length < total ? `${label}s ${availSections[0]}–${availSections[availSections.length - 1]} of ${total}` : null;
  const status = transcriptionLabel(tr.editorial);
  // The text's own status only: a checked verse alignment says nothing about the transcription.
  // Editions with an edition header show their status line there instead.
  const banner = edition ? "" : [sampleRange && `Sample passage · ${sampleRange}`, status].filter(Boolean).join(" · ");
  const map = edition?.refmap ?? null;
  const editor = map?.editionName.split(" ")[0] ?? tr.label;
  const preview = w.publication?.status === "preview";
  const previewTag = preview && edition ? <span className="ed-preview" data-preview>Preview · not yet released</span> : null;
  const inline = sec.segments.every((s) => s.runs);
  const selSegs = new Set(sel?.segs ?? []);
  const anyUnaligned = sec.segments.some((s) => !idx.isAligned(s.id));
  const otherTranslations = translationsFor(id).filter((t) => t.id !== tr.id);
  const otherEdition = map ? otherTranslations.find((t) => t.status === "available" && t.numbering === "source" && t.provenance) : undefined;

  /** Number shown before a segment: canonical verse at the start of each verse, else the source label. */
  const numberFor = (s: Segment, i: number): string | null => {
    if (tr.numbering === "source") return s.n || null;
    const ref = idx.refOf(s.id);
    if (!isVerseRef(ref)) return s.n;
    const prevRef = i > 0 ? idx.refOf(sec.segments[i - 1].id) : null;
    return prevRef === ref ? null : ref.split(".")[2];
  };
  /** Note marker after the last segment of a verse that has notes. */
  const noteAfter = (s: Segment, i: number): string | null => {
    const ref = idx.refOf(s.id);
    if (!verseNotes.has(ref)) return null;
    const nextRef = i + 1 < sec.segments.length ? idx.refOf(sec.segments[i + 1].id) : null;
    return nextRef === ref ? null : ref;
  };

  // Edition sections: toggle, or open Contents at one and bring it into view.
  const toggleSection = (name: EditionSection) => setSections((cur) => ({ ...cur, [name]: !cur[name] }));
  const [shown, setShown] = useState<{ name: EditionSection } | null>(null);
  const showSection = (name: EditionSection) => {
    setPanel("toc", true);
    setSections((cur) => ({ ...cur, [name]: true }));
    setShown({ name });
  };
  // Once Contents is open (it becomes focusable as its slide-in starts), focus the section and scroll to it.
  useEffect(() => {
    if (!shown) return;
    const go = () => {
      const h = document.getElementById(`${SECTION_ID[shown.name]}-h`);
      if (!h || document.activeElement === h) return;
      h.focus({ preventScroll: true });
      h.scrollIntoView({ block: "start" });
    };
    // Again once the slide-in has finished, in case the panel was not yet focusable.
    const ts = [30, 300].map((ms) => window.setTimeout(go, ms));
    return () => ts.forEach((t) => window.clearTimeout(t));
  }, [shown]);
  const marks = edition ? provisionalMarks(id, tr, edition, chn, sec.segments, (seg) => idx.refOf(seg)) : new Map<string, MarkInfo[]>();
  const markNode = (m: MarkInfo) => (
    <ProvisionalMark key={m.key} mark={m} open={openMark === m.key} onToggle={() => setOpenMark((cur) => (cur === m.key ? null : m.key))}
      onMore={() => { setOpenMark(null); showSection("notes"); }} />
  );

  const segments = sec.segments.map((s, i) => {
    const num = numberFor(s, i);
    const noteRef = noteAfter(s, i);
    const ref = idx.refOf(s.id);
    const cls = `psg${selSegs.has(s.id) ? " sel" : ""}${isMarked(ref) || isMarked(ref, anchorOf(tr.id, s.id)) ? " marked" : ""}${!inline ? " block" : ""}${!inline && s.stanza ? " stanza" : ""}`;
    const info = map ? numberInfo(map, s.id, editor) : null;
    const pnClass = `pn${info?.className ? ` ${info.className}` : ""}`;
    const pn = num !== null && (
      inline
        ? <sup className={pnClass} title={info?.title} onClick={() => selectSeg(s.id, true)}>{num}</sup>
        : <span className={pnClass} title={info?.title} onClick={() => selectSeg(s.id, true)}>{num}</span>
    );
    const segMarks = marks.get(s.id) ?? [];
    // Reading markers follow their reading; mapping and editorial-number markers follow the number.
    const numMarks = segMarks.filter((m) => !m.key.startsWith("unc-")).map(markNode);
    const markFor = (k: number) => segMarks.filter((m) => m.key === `unc-${s.id}-${k}`).map(markNode);
    const mark = noteRef && <button className="nmark" aria-label={`Notes on ${formatRef(w.title, noteRef)}`} onClick={() => { selectSeg(s.id); openNotes(noteRef); }} />;
    return inline ? (
      <span key={s.id} className={cls} id={`s-${s.id}`} data-seg={s.id} data-ref={ref}>{pn}{numMarks}{runsOf(s, markFor)}{mark}{" "}</span>
    ) : (
      <div key={s.id} className={cls} id={`s-${s.id}`} data-seg={s.id} data-ref={ref}>{pn || <span className="pn" />}<div>{numMarks}{runsOf(s, markFor)}{mark}</div></div>
    );
  });

  // Editions with a reference map also name the passage in the edition's own numbering.
  const edRef = (segs: string[]) => (map ? editionRef(map, segs) : null);
  // Printed paragraphs (prose): a segment marked `para` starts a new one; otherwise one paragraph.
  const paragraphs = sec.segments.reduce<number[][]>((acc, s, i) => { if (i === 0 || s.para) acc.push([i]); else acc[acc.length - 1].push(i); return acc; }, []);
  const selEdition = sel ? edRef(sel.segs) : null;
  const selLabel = sel ? (selEdition ? `${formatRef(w.title, sel.ref)} · ${selEdition}` : sel.anchor ? `${formatRef(w.title, sel.ref)} · ${tr.label} ${parseAnchor(sel.anchor).seg}` : formatRef(w.title, sel.ref)) : "";
  const passageUrl = (s: Selection) => location.origin + readPath(id, s.ref, s.anchor ? { seg: parseAnchor(s.anchor).seg, tr: tr.id } : { tr: tr.id });
  const citation = (s: Selection) => {
    const ed = edRef(s.segs);
    const where = ed ? `${formatRef(w.title, s.ref)} (${ed})` : s.anchor ? `${formatRef(w.title, s.ref)} (${tr.label} passage ${parseAnchor(s.anchor).seg})` : formatRef(w.title, s.ref);
    return `${where}, trans. ${tr.label}${tr.detail ? ` (${tr.detail})` : ""}. SCRIPTORIAS, ${passageUrl(s)}`;
  };
  // Suspected-error reports (GitHub issue form), prefilled with work, edition and passage.
  const editionName = `${tr.label}, ${tr.detail}`;
  const reportFor = (s: Selection | null) => reportUrl({
    work: id,
    edition: editionName,
    ref: s
      ? `${shortRef(s.ref)}${edRef(s.segs) ? ` (${edRef(s.segs)})` : s.anchor ? ` (${tr.label} passage ${parseAnchor(s.anchor).seg})` : ""} ${passageUrl(s)}`
      : `${chn} ${location.origin}${readPath(id, chRef, { tr: tr.id })}`,
  });

  const noteItem = (n: Note, key: number) => {
    const inner = <><span className="rd-kind">{n.kind}</span><b>{n.title}</b><span>{n.note}</span></>;
    return n.to && "work" in n.to
      ? <Link key={key} className="rd-note" to={n.to.ref ? readPath(n.to.work, n.to.ref) : workPath(n.to.work)}>{inner}</Link>
      : <div key={key} className="rd-note">{inner}</div>;
  };

  const bookmarksHere = getBookmarks().filter((b) => b.work === id);
  const chMarked = isMarked(chRef);

  return (
    <div className="rd" id="rd" data-work={id} data-ch={chn} data-tr={tr.id} data-theme={prefs.theme}
      style={{ "--rd-size": `${prefs.size}px`, "--rd-leading": LEADING[prefs.leading] } as CSSProperties}>
      <div className="rd-progress"><span ref={progress} /></div>
      <header className="rd-bar">
        <div className="rd-start">
          <Link className="rd-back" to={workPath(id)} aria-label={`Back to ${w.title} overview`}><Icon name="left" /><span>{w.title}</span></Link>
          {edition && otherEdition && (
            <LanguageToggle tr={tr} other={otherEdition} target={switchTarget(edition.refmap, sel?.segs ?? [], chRef)}
              onSwitch={(t, ref) => { store.set(`rd.tr.${id}`, t); navigate(readPath(id, ref)); }} />
          )}
        </div>
        <div className="rd-run">
          <b>{w.title}</b>
          <span>{tr.label}{yearOf ? ` (${yearOf})` : ""} · {label} {chn}</span>
          {/* Narrow screens: the language switch names the language, so the edition name stays short. */}
          {otherEdition && <span className="rd-run-short">{tr.label.split(" · ")[0]} · {label} {chn}</span>}
        </div>
        <div className="rd-tools">
          <button className={`rd-tool${panels.toc ? " on" : ""}`} aria-label="Contents" onClick={() => setPanel("toc")}><Icon name="contents" /><span>Contents</span></button>
          <button className={`rd-tool${panels.settings ? " on" : ""}`} aria-label="Text settings" onClick={() => setPanel("settings")}><Icon name="type" /><span>Text</span></button>
          <button className={`rd-tool${chMarked ? " on marked" : ""}`} aria-label={`Bookmark this ${label.toLowerCase()}`} onClick={() => toggle(chRef, undefined, label)}><Icon name="bookmark" /><span>Bookmark</span></button>
          <button className={`rd-tool${panels.notes ? " on" : ""}`} aria-label="Notes and connections" onClick={() => setPanel("notes")}><Icon name="notes" /><span>Notes</span></button>
        </div>
      </header>

      <aside className={`rd-panel rd-left${panels.toc ? " open" : ""}`} id="rd-toc" aria-label="Contents">
        <div className="rd-panel-head"><h2>Contents</h2><button className="icon-btn" aria-label="Close" onClick={() => setPanel("toc", false)}><Icon name="close" /></button></div>
        <div className="rd-panel-body">
          <div className="rd-block">
            <h3>Translation</h3>
            <button className="rd-choice on"><b>{tr.label}</b><span>{tr.detail}{status ? ` · ${status.toLowerCase()}` : ""}</span></button>
            {otherTranslations.map((t) => t.status === "available" ? (
              <button key={t.id} className="rd-choice" onClick={() => { store.set(`rd.tr.${id}`, t.id); navigate(readSection(id, chn)); }}><b>{t.label}</b><span>{t.detail}</span></button>
            ) : (
              <div key={t.id} className="rd-choice off"><b>{t.label}</b><span>{t.detail} · planned</span></div>
            ))}
            <p className="rd-hint">Side-by-side comparison will be available once a second translation is added.</p>
          </div>
          <div className="rd-block">
            <h3>{label}s <span className="rd-count">{done.length} of {total} read</span></h3>
            {groups.map((g) => (
              <div key={g.from}>
                {g.title && <h4>{g.title}</h4>}
                <ol className="rd-toc">
                  {Array.from({ length: g.to - g.from + 1 }, (_, i) => g.from + i).map((n) => (
                    <li key={n}>
                      {availSections.includes(n)
                        ? <Link to={readSection(id, n)} className={n === chn ? "on" : ""}>{label} {n}{done.includes(n) && <i className="rd-done" aria-label="Read" />}</Link>
                        : <span className="off">{label} {n}<small>not yet available</small></span>}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
          <div className="rd-block">
            <h3>Bookmarks</h3>
            {bookmarksHere.length ? (
              <ul className="rd-bms">
                {bookmarksHere.map((b) => {
                  const seg = b.anchor ? parseAnchor(b.anchor).seg : undefined;
                  return <li key={bookmarkKey(b)}><Link to={readPath(id, b.ref, seg ? { seg, tr: b.tr } : {})}>{formatRef(w.title, b.ref)}{seg && !isVerseRef(b.ref) ? ` · ${seg}` : ""}</Link></li>;
                })}
              </ul>
            ) : <p className="rd-hint">No bookmarks yet.</p>}
          </div>
          {edition && (
            <EditionSections work={id} tr={tr} data={edition} chapter={chn} selected={sel?.segs ?? []} reportHref={reportFor(null)}
              open={sections} onToggle={toggleSection} />
          )}
        </div>
      </aside>

      <aside className={`rd-panel rd-right${panels.notes ? " open" : ""}`} id="rd-notes" aria-label="Notes and connections">
        <div className="rd-panel-head"><h2>Notes &amp; connections</h2><button className="icon-btn" aria-label="Close" onClick={() => setPanel("notes", false)}><Icon name="close" /></button></div>
        <div className="rd-panel-body">
          {notesPlaceholder && <p className="rd-sample-tag">Placeholder notes · not research</p>}
          {sectionNotes.length > 0 && <div className="rd-block"><h3>This {label.toLowerCase()}</h3>{sectionNotes.map(noteItem)}</div>}
          {verseNotes.size > 0 && (
            <div className="rd-block">
              <h3>Passages</h3>
              {[...verseNotes.entries()].map(([ref, ns]) => (
                <div key={ref} className={`rd-note-group${focusNote === ref ? " on" : ""}`} data-for={ref}>
                  <Link className="rd-ref" to={readPath(id, ref)}>{formatRef(w.title, ref)}</Link>
                  {ns.map(noteItem)}
                </div>
              ))}
            </div>
          )}
          {!sectionNotes.length && !verseNotes.size && <p className="rd-hint">No notes for this {label.toLowerCase()} yet.</p>}
          <div className="rd-block"><Link className="rd-link" to={workPath(id)}>Historical overview<Icon name="right" /></Link></div>
          <Notice kind="cc0" className="rd-hint" text={CC0_NOTICE} />
        </div>
      </aside>

      <div className={`rd-pop${panels.settings ? " open" : ""}`} id="rd-settings" role="dialog" aria-label="Reading settings">
        <div className="rd-set"><span>Text size</span>
          <div className="rd-seg">
            <button aria-label="Smaller text" onClick={() => { const i = SIZES.indexOf(prefs.size); updatePrefs({ ...prefs, size: SIZES[Math.max(0, (i < 0 ? 3 : i) - 1)] }); }}>A−</button>
            <output id="rd-size-out">{prefs.size}</output>
            <button aria-label="Larger text" onClick={() => { const i = SIZES.indexOf(prefs.size); updatePrefs({ ...prefs, size: SIZES[Math.min(SIZES.length - 1, (i < 0 ? 3 : i) + 1)] }); }}>A+</button>
          </div>
        </div>
        <div className="rd-set"><span>Line spacing</span>
          <div className="rd-seg">{(Object.keys(LEADING) as ReaderPrefs["leading"][]).map((k) => <button key={k} className={prefs.leading === k ? "on" : ""} onClick={() => updatePrefs({ ...prefs, leading: k })}>{k[0].toUpperCase() + k.slice(1)}</button>)}</div>
        </div>
        <div className="rd-set"><span>Theme</span>
          <div className="rd-seg">{(["light", "dark"] as const).map((k) => <button key={k} className={prefs.theme === k ? "on" : ""} onClick={() => updatePrefs({ ...prefs, theme: k })}>{k === "light" ? "Light" : "Dark"}</button>)}</div>
        </div>
      </div>
      <div className={`rd-scrim${panels.settings || (narrow() && (panels.toc || panels.notes)) ? " show" : ""}`} onClick={closeAll} />

      <main className="rd-page">
        {banner && <p className="rd-sample">{banner} · {tr.label}{tr.detail ? `, ${tr.detail}` : ""}</p>}
        <header className="rd-head">
          {previewTag}
          <p className="rd-kicker">{label}</p>
          <h1 className="rd-num">{chn}</h1>
          {(sec.title || group?.title) && <p className="rd-group">{sec.title || group!.title}</p>}
        </header>
        <article ref={textEl} className={`rd-text ${inline ? "prose-mode" : "verse-mode"}`}>
          {inline ? paragraphs.map((g, k) => <p key={k} className={sec.segments[g[0]].heading ? "rd-heading" : undefined}>{g.map((i) => segments[i])}</p>) : segments}
        </article>
        <nav className="rd-pager" aria-label="Chapters">
          {prev ? <Link to={readSection(id, prev)} data-dir="prev"><Icon name="left" />{label} {prev}</Link> : <span />}
          {next ? <Link to={readSection(id, next)} data-dir="next" className="next">{label} {next}<Icon name="right" /></Link>
            : chn < total ? <span className="rd-end">{label} {chn + 1} is not yet available</span> : <span className="rd-end">End of {w.title}</span>}
        </nav>
        <footer className="rd-colophon">
          <p>
            <b>{tr.label}</b>{tr.detail ? `, ${tr.detail}` : ""} · {tr.license.name}
            {tr.source && <> · <a href={tr.source.href} target="_blank" rel="noopener">{tr.source.label}</a></>}
          </p>
          {tr.notices?.publicDomain && !edition && <p data-notice="public-domain">{richText(tr.notices.publicDomain)}</p>}
          {edition && (
            <p data-status-cue>
              {status ? `${status}. ` : ""}Sources, licensing and notices: <button type="button" className="ed-linkbtn" onClick={() => showSection("about")}>About this edition</button> (in Contents).
            </p>
          )}
          {tr.attribution && <p>{tr.attribution}</p>}
          {tr.italics && <p>{tr.italics}</p>}
          <p>
            Select a passage number to bookmark or cite it. References follow the work's own numbering, e.g. <code>{id}.{chn}.1</code>
            {anyUnaligned ? `; passages in this ${label.toLowerCase()} are not yet aligned to verse numbers, so their numbers follow this translation and references resolve to the ${label.toLowerCase()}` : ""}.
          </p>
        </footer>
      </main>

      {sel && (
        <div className="rd-actions" id="rd-actions">
          <span className="rd-actions-ref">{selLabel}</span>
          <button className={isMarked(sel.ref, sel.anchor) ? "on" : ""} aria-label={isMarked(sel.ref, sel.anchor) ? "Bookmarked" : "Bookmark"} onClick={() => toggle(sel.ref, sel.anchor)}>
            <Icon name="bookmark" /><span>{isMarked(sel.ref, sel.anchor) ? "Bookmarked" : "Bookmark"}</span>
          </button>
          <button aria-label="Copy citation" onClick={() => navigator.clipboard?.writeText(citation(sel)).then(() => toast("Citation copied"), () => toast("Copy failed"))}>
            <Icon name="quote" /><span>Copy citation</span>
          </button>
          {verseNotes.has(sel.ref) && <button aria-label="Notes" onClick={() => openNotes(sel.ref)}><Icon name="notes" /><span>Notes</span></button>}
          <a className="rd-report" href={reportFor(sel)} target="_blank" rel="noopener" data-report aria-label={`Report a suspected error ${REPORT_NOTE}`} title={`Report a suspected error ${REPORT_NOTE}`}>
            <Icon name="flag" /><span>Report a suspected error</span><small>{REPORT_NOTE}</small>
          </a>
          <button aria-label="Clear selection" onClick={() => setSel(null)}><Icon name="close" /></button>
        </div>
      )}
    </div>
  );
}
