import { useState } from "react";
import { Link, useParams } from "react-router";
import { availableTranslations, collection, countLabel, members, parentCollection, tradition } from "../content/catalog";
import type { Work } from "../content/schema";
import { Icon } from "../components/Icon";
import { Breadcrumb, Page } from "../components/Shell";
import { NotFound } from "./Misc";
import { store } from "../lib/storage";
import { collectionPath, workPath } from "../lib/paths";
import { useTitle } from "../lib/useTitle";

const SORTS: [string, string][] = [["date", "Date"], ["title", "A–Z"]];
const sortTitle = (t: string) => t.replace(/^the\s+/i, "").toLowerCase();

export function authorLabel(a: NonNullable<Work["author"]>): string {
  switch (a.basis) {
    case "known": return a.name ?? "";
    case "attributed": return `Attributed to ${a.name}`;
    case "traditional": return `Traditionally attributed to ${a.name}`;
    case "anonymous": return a.name ? `Anonymous, ${a.name}` : "Anonymous";
  }
}

/** Date with its disputed marker. When the date carries an explanation, the marker toggles it. */
function WorkDate({ w, open, onToggle }: { w: Work; open: boolean; onToggle: () => void }) {
  if (!w.date) return null;
  const d = w.date.debated;
  const info = d && typeof d === "object" && d.note ? d : null;
  return (
    <span className="wdate">
      {w.date.label}
      {d && (info
        ? <button className="debated" aria-expanded={open} onClick={onToggle}>debated</button>
        : <small>debated</small>)}
    </span>
  );
}

function WorkCard({ w }: { w: Work }) {
  const [open, setOpen] = useState(false);
  const d = w.date?.debated;
  const note = d && typeof d === "object" && d.note ? d.note : null;
  const readable = availableTranslations(w.id).length > 0;
  return (
    <article className="card plain work">
      <div>
        <h3><Link className="stretch" to={workPath(w.id)}>{w.title}</Link>{readable && <span className="avail">Read</span>}</h3>
        {w.author && (
          <div className="wmeta">
            <span className={w.author.basis !== "known" ? "unsure" : ""}>{authorLabel(w.author)}</span>
            <span className="m-date">{w.date?.label ?? ""}</span>
          </div>
        )}
        <p>{w.blurb}{w.parts && <span className="parts">{w.parts.length} {w.partLabel ?? "parts"}</span>}</p>
        {note && <div className="date-note" hidden={!open}><p>{note}</p></div>}
      </div>
      <span className="count"><WorkDate w={w} open={open} onToggle={() => setOpen((o) => !o)} /></span>
      <span className="chev"><Icon name="right" /></span>
    </article>
  );
}

export function CollectionPage() {
  const c = collection(useParams().id!);
  const [sort, setSort] = useState<string>(() => store.get("sort", "date"));
  useTitle(c?.title);
  if (!c) return <NotFound />;

  const t = tradition(c.tradition)!;
  const parent = parentCollection(c.id);
  const crumbs = [{ to: `/library/${t.id}`, label: t.name }, ...(parent ? [{ to: collectionPath(parent.id), label: parent.title }] : [])];
  const back = { to: crumbs[crumbs.length - 1].to, label: crumbs[crumbs.length - 1].label };

  const list = members(c);
  const works = list.flatMap((m) => (m.kind === "work" ? [m.work] : []));
  const hasDates = works.some((w) => w.date);
  const order = hasDates ? sort : "title";
  if (hasDates) {
    works.sort((a, b) =>
      order === "date"
        ? (a.date?.sort ?? 1e9) - (b.date?.sort ?? 1e9) || sortTitle(a.title).localeCompare(sortTitle(b.title))
        : sortTitle(a.title).localeCompare(sortTitle(b.title)),
    );
  }
  const subs = list.flatMap((m) => (m.kind === "collection" ? [m.collection] : []));
  const choose = (k: string) => { store.set("sort", k); setSort(k); };

  return (
    <Page back={back}>
      <Breadcrumb items={crumbs} current={c.title} />
      <h1 className="col-title">{c.title}</h1>
      <p className="lede wide-lede">{c.intro ?? c.blurb}</p>
      <div className="list-head works-head">
        <span>{subs.length && !works.length ? `${subs.length} sections` : `${works.length} works`}{c.sample && <em className="sample">Sample metadata</em>}</span>
        {hasDates && (
          <div className="sorter" role="group" aria-label="Sort works">
            <span>Sort by</span>
            {SORTS.map(([k, n]) => <button key={k} className={order === k ? "on" : ""} aria-pressed={order === k} onClick={() => choose(k)}>{n}</button>)}
          </div>
        )}
      </div>
      <div className="cards">
        {subs.map((s) => (
          <Link key={s.id} className="card plain" to={collectionPath(s.id)}>
            <div><h3>{s.title}</h3><p>{s.blurb}</p></div>
            <span className="count">{countLabel(s)}</span><span className="chev"><Icon name="right" /></span>
          </Link>
        ))}
        {works.map((w) => <WorkCard key={w.id} w={w} />)}
      </div>
      {!list.length && <div className="empty"><b>No works added yet.</b>Texts for this section will be added as they are prepared and verified.</div>}
      {hasDates && (
        <p className="legend"><b>c.</b> circa, approximate date&ensp;·&ensp;<i>Italic</i> authorship is attributed, traditional, or anonymous&ensp;·&ensp;<b>debated</b> scholarly estimates vary widely</p>
      )}
    </Page>
  );
}
