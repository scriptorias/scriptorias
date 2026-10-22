import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { traditions } from "../content/catalog";
import { Icon } from "./Icon";

const NAV: [string, string, string][] = [["home", "Home", "/home"], ["paths", "Pathways", "/pathways"], ["search", "Search", "/search"]];
const FOOT: [string, string, string][] = [["settings", "Settings", "/settings"], ["about", "About", "/about"]];
const TABBAR: [string, string, string | null][] = [["home", "Home", "/home"], ["library", "Library", "/"], ["paths", "Pathways", "/pathways"], ["search", "Search", "/search"], ["more", "More", null]];

const DrawerContext = createContext<{ toggle: () => void }>({ toggle: () => {} });

/** Which navigation item a path belongs to. */
function activeFor(path: string): string {
  const [first, second] = path.split("/").filter(Boolean);
  if (!first) return "lib:christianity";
  if (first === "library") return `lib:${second}`;
  if (first === "collections" || first === "works") return "lib:christianity";
  if (first === "pathways") return "paths";
  return first;
}

/** App chrome (sidebar, tab bar, drawer) around routed pages. */
export function Shell() {
  return <ShellFrame><Outlet /></ShellFrame>;
}

/** The same chrome around arbitrary content, for pages rendered outside the Shell route. */
export function ShellFrame({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [drawer, setDrawer] = useState(false);
  const active = activeFor(pathname);
  useEffect(() => setDrawer(false), [pathname]);

  const tabActive = active.startsWith("lib:") ? "library" : active;
  return (
    <DrawerContext.Provider value={{ toggle: () => setDrawer((d) => !d) }}>
      <div className={`app${drawer ? " drawer" : ""}`}>
        <aside className="sidebar" id="sidebar" aria-label="Site">
          <Link className="brand" to="/home">
            <span className="brand-name">Scriptorias<sup className="tm">™</sup></span>
            <span className="brand-sub">Discover Your Path</span>
          </Link>
          <nav className="nav" aria-label="Main">
            {NAV.map(([id, name, to]) => (
              <Link key={id} to={to} className={active === id ? "on" : ""}><Icon name={id} />{name}</Link>
            ))}
          </nav>
          <div className="nav-label">Libraries</div>
          <nav className="nav" aria-label="Libraries">
            {traditions().map((t) => (
              <Link key={t.id} to={`/library/${t.id}`} className={`${active === "lib:" + t.id ? "on" : ""}${t.status === "live" ? "" : " off"}`}>
                <Icon name={t.icon} />{t.name}
              </Link>
            ))}
          </nav>
          <nav className="nav nav-foot" aria-label="Settings and information">
            {FOOT.map(([id, name, to]) => (
              <Link key={id} to={to} className={active === id ? "on" : ""}><Icon name={id} />{name}</Link>
            ))}
          </nav>
        </aside>
        <div className="scrim" id="scrim" onClick={() => setDrawer(false)} />
        <main className="main" id="main">{children}</main>
        <nav className="tabbar" aria-label="Sections">
          {TABBAR.map(([icon, name, to]) =>
            to ? (
              <Link key={icon} to={to} className={tabActive === icon ? "on" : ""}><Icon name={icon} />{name}</Link>
            ) : (
              <a key={icon} href="#" onClick={(e) => { e.preventDefault(); setDrawer((d) => !d); }}><Icon name={icon} />{name}</a>
            ),
          )}
        </nav>
      </div>
    </DrawerContext.Provider>
  );
}

export interface Back { to: string; label: string }

/** Mobile header: back link (or wordmark) and menu button. Hidden on desktop by CSS. */
export function Topbar({ back }: { back?: Back }) {
  const { toggle } = useContext(DrawerContext);
  return (
    <div className="topbar">
      {back ? (
        <Link className="back" to={back.to}><Icon name="left" />{back.label}</Link>
      ) : (
        <Link className="mark" to="/home">Scriptorias<sup className="tm">™</sup></Link>
      )}
      <button className="icon-btn" aria-label="Menu" onClick={toggle}><Icon name="more" /></button>
    </div>
  );
}

/** Page wrapper with the mobile header. */
export function Page({ back, className = "page", children }: { back?: Back; className?: string; children: ReactNode }) {
  return (
    <>
      <Topbar back={back} />
      <div className={className}>{children}</div>
    </>
  );
}

export function Hero({ title, tm = false, icon }: { title: string; tm?: boolean; icon?: string }) {
  return (
    <div className="hero">
      <h1>{icon && <Icon name={icon} />}{title}{tm && <sup className="tm">™</sup>}</h1>
      <hr className="hero-rule" />
    </div>
  );
}

export function Breadcrumb({ items, current }: { items: { to: string; label: string }[]; current: string }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((i) => (
        <span key={i.to} style={{ display: "contents" }}><Link to={i.to}>{i.label}</Link><Icon name="right" /></span>
      ))}
      <span aria-current="page">{current}</span>
    </nav>
  );
}
