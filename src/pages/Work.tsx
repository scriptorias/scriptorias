import type { ReactNode } from "react";
import { Link, useParams } from "react-router";
import { connectionsFor, primaryCollection, translationsFor, tradition, work as getWork } from "../content/catalog";
import { hasText, loadManuscripts, loadOverview } from "../content/loaders";
import type { Collection, Overview, Work } from "../content/schema";
import { Icon } from "../components/Icon";
import { Breadcrumb, Page, type Back } from "../components/Shell";
import { authorLabel } from "./Collection";
import { NotFound } from "./Misc";
import { collectionPath, manuscriptPath, readPath, targetPath, workPath } from "../lib/paths";
import { useAsync } from "../lib/useAsync";
import { useTitle } from "../lib/useTitle";

const BASIS: Record<string, string> = { disputed: "Disputed", unknown: "Unknown" };

/** Breadcrumb trail and back link for a work (parts follow their parent). */
export function workTrail(w: Work): { crumbs: { to: string; label: string }[]; back: Back; col?: Collection } {
  const col = primaryCollection(w);
  const t = tradition(w.tradition);
  const crumbs = [
    ...(t ? [{ to: `/library/${t.id}`, label: t.name }] : []),
    ...(col ? [{ to: collectionPath(col.id), label: col.title }] : []),
  ];
  const parent = w.partOf ? getWork(w.partOf) : undefined;
  if (parent) crumbs.push({ to: workPath(parent.id), label: parent.title });
  const last = crumbs[crumbs.length - 1];
  return { crumbs, back: last ? { to: last.to, label: last.label } : { to: "/", label: "Library" }, col };
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="ov-section"><h2>{title}</h2>{children}</section>;
}

function facts(w: Work, ov: Overview | null) {
  if (ov?.facts?.length) return ov.facts;
  const out: { label: string; value: string; basis: string }[] = [];
  if (w.date) out.push({ label: "Composed", value: w.date.label, basis: w.date.debated ? "disputed" : "established" });
  if (w.author) out.push({ label: "Authorship", value: authorLabel(w.author), basis: w.author.basis === "known" ? "established" : "disputed" });
  return out;
}

export function WorkPage() {
  const id = useParams().id!;
  const w = getWork(id);
  const ov = useAsync(() => loadOverview(id), [id]);
  const manuscripts = useAsync(() => loadManuscripts(id), [id]);
  useTitle(w?.title);
  if (!w) return <NotFound />;
  if (ov === undefined || manuscripts === undefined) return <Page className="page overview"><div /></Page>;

  const { crumbs, back } = workTrail(w);
  const sample = ov?.verification.status === "sample";
  const translations = translationsFor(id);
  const readable = translations.some((t) => t.status === "available" && hasText(id, t.id));
  const parts = (w.parts ?? []).map((p) => getWork(p)).filter(Boolean) as Work[];
  const connections = connectionsFor(id);
  const fl = facts(w, ov);
  const textSources = translations.filter((t) => t.status === "available" && t.source);

  return (
    <Page back={back} className="page overview">
      <Breadcrumb items={crumbs} current={w.title} />
      <header className="ov-head">
        {sample && <span className="sample">Sample content · not yet verified</span>}
        <h1>{w.title}</h1>
        {ov?.aka && <p className="ov-aka">{ov.aka}</p>}
        <p className="lede wide-lede">{ov?.intro ?? w.blurb.replace(/\.?$/, ".")}</p>
        {!w.parts && (
          <>
            <Link className="btn-read" to={readPath(id)}>Read This Work<Icon name="right" /></Link>
            {!readable && <span className="ov-muted ov-note">Reading view in design</span>}
          </>
        )}
      </header>
      <div className="ov-grid">
        <aside className="ov-aside">
          <h2>At a glance</h2>
          {fl.length ? (
            <dl className="ov-facts">
              {fl.map((x) => (
                <div key={x.label} className={x.basis !== "established" ? `is-${x.basis}` : ""}>
                  <dt>{x.label}{BASIS[x.basis] && <small>{BASIS[x.basis]}</small>}</dt>
                  <dd>{x.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="ov-muted">Historical details for this work are being prepared.</p>
          )}
        </aside>
        <div className="ov-main">
          <Section title="Historical background">
            {ov?.background?.length ? ov.background.map((p, i) =>
              p.kind === "interpretation" ? (
                <div key={i} className="ov-interp"><span className="ov-tag">Scholarly interpretation</span><p>{p.text}</p></div>
              ) : <p key={i}>{p.text}</p>,
            ) : <p className="ov-muted">A fuller historical background is in preparation.</p>}
          </Section>
          {parts.length > 0 && (
            <Section title={w.partLabel ? w.partLabel[0].toUpperCase() + w.partLabel.slice(1) : "Parts"}>
              <div className="ov-list">
                {parts.map((p) => <Link key={p.id} className="ov-item link" to={workPath(p.id)}><b>{p.title}</b><Icon name="right" /></Link>)}
              </div>
            </Section>
          )}
          {ov?.structure?.length ? (
            <Section title="Structure">
              <div className="ov-list">
                {ov.structure.map((s) => (
                  <div key={s.from} className="ov-item"><span className="ov-range">{s.from === s.to ? s.from : `${s.from}–${s.to}`}</span><b>{s.title}</b></div>
                ))}
              </div>
            </Section>
          ) : null}
          {manuscripts.length > 0 && (
            <Section title="Manuscripts & preservation">
              <div className="ov-list">
                {manuscripts.map((m) => (
                  <Link key={m.id} className="ov-item link" to={manuscriptPath(id, m.id)}>
                    <div><b>{m.name}</b><span>{m.note}</span></div><span className="ov-date">{m.date}</span><Icon name="right" />
                  </Link>
                ))}
              </div>
            </Section>
          )}
          {translations.length > 0 && (
            <Section title="Translations & editions">
              <div className="ov-list">
                {translations.map((t) => {
                  const detail = [t.detail, t.license.name.toLowerCase(), t.coverage?.note].filter(Boolean).join(" · ");
                  const inner = (
                    <>
                      <div><b>{t.label}</b><span>{detail}</span></div>
                      <span className={`ov-status ${t.status}`}>{t.status === "available" ? "Read" : "Planned"}</span>
                    </>
                  );
                  return t.status === "available" && hasText(id, t.id)
                    ? <Link key={t.id} className="ov-item link" to={readPath(id, undefined, { tr: t.id })}>{inner}<Icon name="right" /></Link>
                    : <div key={t.id} className="ov-item">{inner}</div>;
                })}
              </div>
            </Section>
          )}
          {connections.length > 0 && (
            <Section title="Connections">
              <div className="ov-list">
                {connections.map((c, i) => {
                  const to = targetPath(c.target);
                  const title = "work" in c.target ? getWork(c.target.work)?.title ?? c.target.work : c.target.label;
                  const inner = (
                    <>
                      <div><span className="ov-rel">{c.rel}{c.disputed ? " · disputed" : ""}</span><b>{title}</b><span>{c.note}</span></div>
                      {to && <Icon name="right" />}
                    </>
                  );
                  return to ? <Link key={i} className="ov-item link" to={to}>{inner}</Link> : <div key={i} className="ov-item">{inner}</div>;
                })}
              </div>
            </Section>
          )}
          <section className="ov-section ov-sources">
            <h2>Sources &amp; further reading</h2>
            {textSources.length > 0 && (
              <div className="src-group">
                <h3>Text</h3>
                <ul>
                  {textSources.map((t) => (
                    <li key={t.id}><a href={t.source!.href} target="_blank" rel="noopener">{`${t.label}, ${t.detail}, via ${t.source!.label.replace(/:.*$/, "")}`}</a></li>
                  ))}
                </ul>
              </div>
            )}
            {ov?.sourceGroups?.length ? ov.sourceGroups.map((g) => (
              <div key={g.title} className="src-group">
                <h3>{g.title}</h3>
                {g.sources.length ? <ul>{g.sources.map((s) => <li key={s}>{s}</li>)}</ul> : <p className="src-placeholder">Placeholder · awaiting verified sources</p>}
              </div>
            )) : !textSources.length && <p className="src-placeholder">Placeholder · sources for this work have not yet been compiled</p>}
          </section>
          <p className="legend">
            <b>Disputed</b> scholars disagree&ensp;·&ensp;<b>Scholarly interpretation</b> a reading of the evidence, not settled fact
            {sample && <>&ensp;·&ensp;Sample content is placeholder research awaiting verification.</>}
          </p>
        </div>
      </div>
    </Page>
  );
}

export function ManuscriptPage() {
  const { id, ms } = useParams();
  const w = getWork(id!);
  const list = useAsync(() => loadManuscripts(id!), [id]);
  const m = list?.find((x) => x.id === ms);
  useTitle(m?.name);
  if (!w) return <NotFound />;
  if (list === undefined) return <Page className="page overview"><div /></Page>;
  if (!m) return <NotFound />;
  const { col } = workTrail(w);
  return (
    <Page back={{ to: workPath(w.id), label: w.title }} className="page overview">
      <Breadcrumb items={[...(col ? [{ to: collectionPath(col.id), label: col.title }] : []), { to: workPath(w.id), label: w.title }]} current="Manuscripts" />
      <header className="ov-head">
        <span className="sample">Placeholder record</span>
        <h1>{m.name}</h1>
        <p className="ov-aka">{m.date}</p>
        <p className="lede wide-lede">{m.note}</p>
      </header>
      <div className="empty" style={{ marginTop: 36 }}>
        <b>Detailed record in preparation.</b>Provenance, contents, and images (where legally usable) will appear here. No images or catalog links have been sourced yet.
      </div>
    </Page>
  );
}
