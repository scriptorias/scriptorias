import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { allWorks, primaryCollection, work } from "../content/catalog";
import { loadText, textKeys } from "../content/loaders";
import { formatRef } from "../content/refs";
import { Icon } from "../components/Icon";
import { Hero, Page } from "../components/Shell";
import { getBookmarks } from "../lib/storage";
import { readPath, workPath } from "../lib/paths";
import { useAsync } from "../lib/useAsync";
import { useTitle } from "../lib/useTitle";

export function NotFound() {
  useTitle("Not found");
  return (
    <Page>
      <h1>Not found</h1>
      <div className="empty"><b>This page isn't in the library.</b><Link to="/">Return to the collections</Link></div>
    </Page>
  );
}

const SOON: Record<string, [string, string]> = {
  explore: ["Explore", "Browse the whole library by era, region, and genre."],
  timeline: ["Timeline", "See every work on one timeline, from the Torah to the medieval mystics."],
  maps: ["Maps", "See where texts were written, copied, and rediscovered."],
  people: ["People", "Authors, translators, and the figures the texts are about."],
  notes: ["Notes", "Your notes and highlights, kept alongside the text."],
  downloads: ["Downloads", "Save works for offline reading."],
  settings: ["Settings", "Reading preferences and account settings."],
};
export const SOON_ROUTES = Object.keys(SOON);

export function Soon({ page }: { page: string }) {
  const [name, text] = SOON[page];
  useTitle(name);
  return (
    <Page>
      <h1>{name}</h1>
      <div className="empty"><b>Coming soon.</b>{text}</div>
    </Page>
  );
}

export function About() {
  useTitle("About");
  return (
    <Page>
      <h1>About</h1>
      <div className="prose" style={{ marginTop: 20 }}>
        <p>Scriptorias is a digital library for preserving, exploring, and understanding ancient religious and historical writings.</p>
        <p>It isn't a devotional app. The focus is historical discovery: where each work came from, how it was transmitted, and how texts speak to one another across centuries. Curated <em>Pathways</em> guide readers through those connections.</p>
        <p>Scriptorias begins with Christianity: biblical texts, apocrypha, early Christian writings, and the Church Fathers. It will grow to include other religious, mythological, and philosophical traditions.</p>
      </div>
    </Page>
  );
}

export function Bookmarks() {
  useTitle("Bookmarks");
  const bs = getBookmarks();
  return (
    <Page>
      <h1>Bookmarks</h1>
      {bs.length ? (
        <div className="rows" style={{ marginTop: 24 }}>
          {bs.map((b, i) => {
            const w = work(b.work);
            if (!w) return null;
            const seg = b.anchor?.split(":")[1];
            return (
              <Link key={i} className="row" to={readPath(b.work, b.ref, { seg, tr: b.tr })}>
                <span className="n">{i + 1}</span>
                <div><h2>{formatRef(w.title, b.ref)}{seg && !b.ref.split(".")[2] ? ` · passage ${seg}` : ""}</h2><p>{b.ref.split(".").length === 3 || seg ? "Passage" : "Chapter"} bookmark</p></div>
                <span className="chev"><Icon name="right" /></span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="empty"><b>No bookmarks yet.</b>Bookmark a chapter or passage while reading to save your place.</div>
      )}
    </Page>
  );
}

// ---------- Search ----------
// Client-side substring search over the catalog and every loaded text. Adequate for the sample
// library; a build-time index should replace it before large imports (docs/DECISIONS.md).
interface Hit { kind: "work" | "verse"; title: string; sub: string; to: string }

async function buildIndex(): Promise<Hit[]> {
  const out: Hit[] = allWorks().map((w) => ({
    kind: "work", title: w.title, sub: `${primaryCollection(w)?.title ?? ""} · ${w.blurb}`, to: workPath(w.id),
  }));
  for (const { work: id, tr } of textKeys()) {
    const w = work(id);
    const text = await loadText(id, tr);
    if (!w || !text) continue;
    for (const s of text.sections) {
      for (const seg of s.segments) {
        const body = seg.runs ? seg.runs.map((r) => r.t).join("") : (seg.lines ?? []).map((l) => (typeof l === "string" ? l : l.t)).join(" ");
        out.push({ kind: "verse", title: `${w.title} ${s.n}.${seg.n}`, sub: body, to: readPath(id, `${id}.${s.n}`, { seg: seg.id, tr }) });
      }
    }
  }
  return out;
}

const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function Mark({ text, q }: { text: string; q: string }) {
  const parts = text.split(new RegExp(`(${escRe(q)})`, "gi"));
  return <>{parts.map((p, i) => (i % 2 ? <mark key={i}>{p}</mark> : p))}</>;
}

export function Search() {
  useTitle("Search");
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const index = useAsync(buildIndex, []);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!("ontouchstart" in window)) input.current?.focus(); }, []);

  const query = q.trim();
  const hits = useMemo(() => {
    if (query.length < 2 || !index) return [];
    const re = new RegExp(escRe(query), "i");
    return index.filter((h) => re.test(h.title) || re.test(h.sub));
  }, [index, query]);

  const group = (kind: Hit["kind"], label: string) => {
    const g = hits.filter((h) => h.kind === kind).slice(0, 40);
    return g.length ? (
      <>
        <h2 className="section-label">{label}</h2>
        {g.map((h, i) => <Link key={i} className="hit" to={h.to}><b><Mark text={h.title} q={query} /></b><span><Mark text={h.sub} q={query} /></span></Link>)}
      </>
    ) : null;
  };

  return (
    <Page>
      <Hero title="Search" />
      <label className="search-box">
        <Icon name="search" />
        <input
          ref={input} id="q" type="search" placeholder="Search works and passages" autoComplete="off" value={q}
          onChange={(e) => { setQ(e.target.value); setParams(e.target.value ? { q: e.target.value } : {}, { replace: true }); }}
        />
      </label>
      <div id="results">
        {query.length < 2 ? (
          <p className="section-label">Try "Watchers", "Didache", or "Hermon"</p>
        ) : !index ? null : hits.length ? (
          <>{group("work", "Works")}{group("verse", "Passages")}</>
        ) : (
          <p className="section-label">No results for "{query}"</p>
        )}
      </div>
    </Page>
  );
}
