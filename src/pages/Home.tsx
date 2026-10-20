import { Link } from "react-router";
import { primaryCollection, traditions, work } from "../content/catalog";
import { Icon } from "../components/Icon";
import { Hero, Page } from "../components/Shell";
import { PathwayCards } from "./Pathways";
import { store, type LastRead } from "../lib/storage";
import { readSection } from "../lib/paths";
import { useTitle } from "../lib/useTitle";

export function Home() {
  useTitle("Home");
  const last = store.get<LastRead | null>("last", null);
  const lw = last ? work(last.work) : undefined;
  const col = lw ? primaryCollection(lw) : undefined;
  return (
    <Page>
      <Hero title="Welcome to Scriptorias" tm />
      {last && lw && (
        <>
          <h2 className="section-label">Continue reading</h2>
          <Link className="continue" to={readSection(last.work, last.ch)}>
            {col && <small>{col.title}</small>}
            <h3>{lw.title} · Chapter {last.ch}</h3>
            <p>{lw.blurb}</p>
          </Link>
        </>
      )}
      <h2 className="section-label">Featured pathway</h2>
      <PathwayCards />
      <h2 className="section-label">Libraries</h2>
      <div className="libs">
        {traditions().map((t) => (
          <Link key={t.id} className={`lib${t.status === "live" ? "" : " off"}`} to={`/library/${t.id}`}>
            <Icon name={t.icon} />{t.name}
          </Link>
        ))}
      </div>
    </Page>
  );
}
