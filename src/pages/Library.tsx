import { Link, useParams } from "react-router";
import { countLabel, listedCollections, tradition } from "../content/catalog";
import { Icon } from "../components/Icon";
import { Hero, Page } from "../components/Shell";
import { PathwayCards } from "./Pathways";
import { NotFound } from "./Misc";
import { collectionPath } from "../lib/paths";
import { useTitle } from "../lib/useTitle";

const TABS: [string, string][] = [["collections", "Collections"], ["paths", "Pathways"], ["timeline", "Timeline"], ["figures", "Key Figures"]];

export function Library({ id: fixedId }: { id?: string }) {
  const params = useParams();
  const id = fixedId ?? params.tradition!;
  const tab = params.tab ?? "collections";
  const t = tradition(id);
  useTitle(t?.name);
  if (!t || !TABS.some(([k]) => k === tab)) return <NotFound />;
  if (t.status !== "live") {
    return (
      <Page className="soon-page"><h1>{t.name}</h1><p>Coming soon</p></Page>
    );
  }
  return (
    <Page>
      <Hero title={t.name} />
      <nav className="tab-buttons" aria-label={`${t.name} library`}>
        {TABS.map(([k, n]) => <Link key={k} to={`/library/${id}/${k}`} className={tab === k ? "on" : ""} aria-current={tab === k ? "page" : undefined}>{n}</Link>)}
      </nav>
      {tab === "collections" ? (
        <div className="cards">
          {listedCollections(id).map((c) => (
            <Link key={c.id} className="card plain" to={collectionPath(c.id)}>
              <div><h2>{c.title}</h2><p>{c.blurb}</p></div>
              <span className="count">{countLabel(c)}</span><span className="chev"><Icon name="right" /></span>
            </Link>
          ))}
        </div>
      ) : tab === "paths" ? (
        <PathwayCards level={2} />
      ) : (
        <div className="empty"><b>{TABS.find(([k]) => k === tab)![1]} is coming soon.</b>This view will connect works by date, author, and theme.</div>
      )}
    </Page>
  );
}
