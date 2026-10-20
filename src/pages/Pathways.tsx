import { Link, useParams } from "react-router";
import { pathway, pathways } from "../content/catalog";
import { Icon } from "../components/Icon";
import { Hero, Page } from "../components/Shell";
import { NotFound } from "./Misc";
import { pathwayPath, targetPath } from "../lib/paths";
import { useTitle } from "../lib/useTitle";

const stepsLabel = (n: number) => `${n} ${n === 1 ? "step" : "steps"}`;

export function PathwayCards() {
  return (
    <div className="cards">
      {pathways().map((p) => (
        <Link key={p.id} className="card" to={pathwayPath(p.id)}>
          <span className="num"><Icon name="paths" /></span>
          <div><h3>{p.title}</h3><p>{p.blurb}</p></div>
          <span className="count">{stepsLabel(p.steps.length)}</span><span className="chev"><Icon name="right" /></span>
        </Link>
      ))}
    </div>
  );
}

export function Pathways() {
  useTitle("Pathways");
  return (
    <Page>
      <Hero title="Explore Pathways" />
      <div style={{ marginTop: 44 }}><PathwayCards /></div>
    </Page>
  );
}

export function PathwayPage() {
  const p = pathway(useParams().id!);
  useTitle(p?.title);
  if (!p) return <NotFound />;
  const back = { to: "/pathways", label: "Pathways" };
  return (
    <Page back={back}>
      <Link className="crumb" to={back.to}><Icon name="left" />{back.label}</Link>
      <div className="col-head"><span className="num"><Icon name="paths" /></span><h1>{p.title}</h1></div>
      <p className="lede">{p.blurb}</p>
      <div className="list-head" style={{ marginTop: 28 }}><span>{stepsLabel(p.steps.length)}</span></div>
      <div className="rows">
        {p.steps.map((s, i) => {
          const to = targetPath(s.target);
          const reads = "work" in s.target && Boolean(s.target.ref);
          const inner = (
            <>
              <span className="n">{i + 1}</span>
              <div><h4>{s.title}{reads && <span className="avail">Read</span>}</h4><p>{s.note}</p></div>
              {to ? <span className="chev"><Icon name="right" /></span> : <span />}
            </>
          );
          return to ? <Link key={i} className="row" to={to}>{inner}</Link> : <div key={i} className="row">{inner}</div>;
        })}
      </div>
    </Page>
  );
}
