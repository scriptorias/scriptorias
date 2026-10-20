const L = window.LIBRARY;
const TEXTS = window.TEXTS || {};

// ---------- Icons ----------
const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  explore: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  paths: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H16"/>',
  timeline: '<path d="M12 3v18"/><path d="M12 7h6M6 12h6M12 17h5"/>',
  maps: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  people: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  bookmarks: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  notes: '<path d="M5 3h10l4 4v14H5z"/><path d="M9 8h3M9 12h6M9 16h6"/>',
  downloads: '<circle cx="12" cy="12" r="9"/><path d="M12 7v9M8 12l4 4 4-4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  about: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  cross: '<path d="M12 3v18M6 9h12"/>',
  star: '<path d="M12 3 20 17H4z"/><path d="M12 21 4 7h16z"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  rune: '<path d="M6 21V3l12 12M18 21V3L6 15"/>',
  temple: '<path d="M3 9 12 4l9 5z"/><path d="M5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 21h18"/>',
  ankh: '<ellipse cx="12" cy="6.5" rx="3.5" ry="4"/><path d="M12 10.5V21M6 12.5h12"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
  right: '<path d="m9 6 6 6-6 6"/>',
  left: '<path d="m15 6-6 6 6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  contents: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  type: '<path d="M4 19 9 5l5 14M5.8 14h6.4"/><path d="M15 19l3-8 3 8M15.9 16.5h4.2"/>',
  quote: '<path d="M7 17c-2 0-3-1.5-3-3.5C4 10 6 7.5 9 7M17 17c-2 0-3-1.5-3-3.5 0-3.5 2-6 5-6.5"/>',
  library: '<path d="M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1z"/><path d="M12 6v14"/>',
};
const icon = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ""}</svg>`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// ---------- Storage ----------
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem("sc." + k)) ?? d; } catch { return d; } },
  set: (k, v) => localStorage.setItem("sc." + k, JSON.stringify(v)),
};

// ---------- Catalog lookup ----------
const trad = L.christianity;
function findWork(id) {
  for (const [ci, c] of trad.collections.entries()) {
    const wi = c.works.findIndex((w) => w.id === id);
    if (wi >= 0) return { col: c, ci, wi, work: { ...c.works[wi], ...(L.works[id] || {}) } };
    // Grouped entries (e.g. the letters of Ignatius) expose each part as its own work.
    for (const [wj, w] of c.works.entries()) {
      const part = w.parts?.find((p) => p.id === id);
      if (part) return { col: c, ci, wi: wj, parent: w, work: { author: w.author, date: w.date, ...part, ...(L.works[id] || {}) } };
    }
  }
  return null;
}
const findCol = (id) => trad.collections.find((c) => c.id === id);
const readHref = (work, ch, v) => `#/w/${work}/read/${ch}${v ? "/" + v : ""}`;

// ---------- Shell ----------
const NAV = [["home", "Home"], ["paths", "Pathways"], ["search", "Search"]];
const FOOT = [["settings", "Settings"], ["about", "About"]];
const TABBAR = [["home", "Home", "#/home"], ["library", "Library", "#/"], ["paths", "Pathways", "#/paths"], ["search", "Search", "#/search"], ["more", "More", "menu"]];

function renderShell(active) {
  const link = ([id, name]) => `<a href="#/${id}" class="${active === id ? "on" : ""}">${icon(id)}${name}</a>`;
  document.getElementById("nav-main").innerHTML = NAV.map(link).join("");
  document.getElementById("nav-foot").innerHTML = FOOT.map(link).join("");
  document.getElementById("nav-libraries").innerHTML = L.traditions
    .map((t) => `<a href="#/library/${t.id}" class="${active === "lib:" + t.id ? "on" : ""}${t.live ? "" : " off"}">${icon(t.icon)}${t.name}</a>`)
    .join("");
  const tabActive = active.startsWith("lib:") ? "library" : active;
  document.getElementById("tabbar").innerHTML = TABBAR
    .map(([ic, name, href]) => `<a href="${href === "menu" ? "#" : href}" ${href === "menu" ? "data-menu" : ""} class="${tabActive === ic ? "on" : ""}">${icon(ic)}${name}</a>`)
    .join("");
}

const app = document.querySelector(".app");
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-menu]")) { e.preventDefault(); app.classList.toggle("drawer"); }
  else if (e.target.closest("#scrim") || e.target.closest(".sidebar a")) app.classList.remove("drawer");
});

// Mobile top bar: back link or wordmark, plus a menu button.
function topbar(back) {
  const left = back
    ? `<a class="back" href="${back.href}">${icon("left")}${esc(back.label)}</a>`
    : `<a class="mark" href="#/">Scriptorias<sup class="tm">™</sup></a>`;
  return `<div class="topbar">${left}<button class="icon-btn" data-menu aria-label="Menu">${icon("more")}</button></div>`;
}
const crumb = (back) => (back ? `<a class="crumb" href="${back.href}">${icon("left")}${esc(back.label)}</a>` : "");

function toast(msg) {
  let t = document.querySelector(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.append(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("show"), 1800);
}

// ---------- Views ----------
function viewHome() {
  const last = store.get("last", null);
  const lw = last && findWork(last.work);
  return `${topbar()}<div class="page">
    <div class="hero"><h1>Discover Your Path.</h1>
      <p>A library of ancient religious and historical writings: scripture, apocrypha, early Christian texts, and the Church Fathers, with the history behind each one.</p></div>
    ${lw ? `<div class="section-label">Continue reading</div>
      <a class="continue" href="${readHref(last.work, last.ch)}"><small>${esc(lw.col.title)}</small><h3>${esc(lw.work.title)} · Chapter ${last.ch}</h3><p>${esc(lw.work.blurb)}</p></a>` : ""}
    <div class="section-label">Featured pathway</div>
    ${pathCards()}
    <div class="section-label">Libraries</div>
    <div class="libs">${L.traditions.map((t) => `<a class="lib" href="#/library/${t.id}">${icon(t.icon)}${t.name}</a>`).join("")}</div>
  </div>`;
}

const LIB_TABS = [["collections", "Collections"], ["paths", "Pathways"], ["timeline", "Timeline"], ["figures", "Key Figures"], ["topics", "Topics"]];

function viewLibrary(id, tab = "collections") {
  const t = L.traditions.find((x) => x.id === id);
  if (!t) return viewMissing();
  if (!t.live) return `${topbar()}<div class="soon-page"><h1>${t.name}</h1><p>Coming soon</p></div>`;
  const body =
    tab === "collections"
      ? `<div class="cards">${trad.collections.map((c, i) => `
          <a class="card plain" href="#/c/${c.id}">
            <div><h3>${esc(c.title)}</h3><p>${esc(c.blurb)}</p></div>
            <span class="count">${esc(c.count)}</span><span class="chev">${icon("right")}</span>
          </a>`).join("")}</div>`
      : tab === "paths"
      ? pathCards()
      : `<div class="empty"><b>${LIB_TABS.find((x) => x[0] === tab)[1]} is coming soon.</b>This view will connect works by date, author, and theme.</div>`;
  return `${topbar()}<div class="page">
    <div><h1>${t.name}</h1><p class="facets">${trad.facets.map((f) => `<span>${f}</span>`).join("")}</p></div>
    <div class="seg">${LIB_TABS.map(([k, n]) => `<a href="#/library/${id}/${k}" class="${tab === k ? "on" : ""}">${n}</a>`).join("")}</div>
    ${body}
  </div>`;
}

function pathCards() {
  return `<div class="cards">${L.paths.map((p) => `
    <a class="card" href="#/path/${p.id}"><span class="num">${icon("paths")}</span>
      <div><h3>${esc(p.title)}</h3><p>${esc(p.blurb)}</p></div>
      <span class="count">${esc(p.length)}</span><span class="chev">${icon("right")}</span></a>`).join("")}</div>`;
}

function viewPaths() {
  return `${topbar()}<div class="page"><h1>Pathways</h1>
    <p class="lede">Curated reading journeys that follow one idea, figure, or story across texts and centuries.</p>
    <div style="margin-top:28px">${pathCards()}</div></div>`;
}

function viewPath(id) {
  const p = L.paths.find((x) => x.id === id);
  if (!p) return viewMissing();
  const back = { href: "#/paths", label: "Pathways" };
  return `${topbar(back)}<div class="page">${crumb(back)}
    <div class="col-head"><span class="num">${icon("paths")}</span><h1>${esc(p.title)}</h1></div>
    <p class="lede">${esc(p.blurb)}</p>
    <div class="list-head" style="margin-top:28px"><span>${esc(p.length)}</span></div>
    <div class="rows">${p.steps.map((s, i) => {
      const href = s.work ? (s.ch ? readHref(s.work, s.ch, s.v) : `#/w/${s.work}`) : null;
      const inner = `<span class="n">${i + 1}</span><div><h4>${esc(s.title)}${s.ch ? '<span class="avail">Read</span>' : ""}</h4><p>${esc(s.note)}</p></div>${href ? `<span class="chev">${icon("right")}</span>` : "<span></span>"}`;
      return href ? `<a class="row" href="${href}">${inner}</a>` : `<div class="row">${inner}</div>`;
    }).join("")}</div>
  </div>`;
}

// Reusable collection page. Works may carry optional `author` and `date` metadata:
//   author: { name, basis: "known" | "attributed" | "traditional" | "anonymous", note? }
//   date:   { label, sort, debated? }   (label is shown as written, e.g. "c. 96 CE")
const AUTHOR_LABEL = {
  known: (a) => esc(a.name),
  attributed: (a) => `Attributed to ${esc(a.name)}`,
  traditional: (a) => `Traditionally attributed to ${esc(a.name)}`,
  anonymous: (a) => (a.name ? `Anonymous, ${esc(a.name)}` : "Anonymous"),
};
const SORTS = [["date", "Date"], ["title", "A–Z"]];
const sortTitle = (t) => t.replace(/^the\s+/i, "").toLowerCase();

function workMeta(w) {
  const parts = [];
  if (w.author) {
    const uncertain = w.author.basis !== "known";
    parts.push(`<span class="${uncertain ? "unsure" : ""}">${AUTHOR_LABEL[w.author.basis](w.author)}</span>`);
  }
  return parts.join("");
}
// date.debated may be `true` or an object { note, refs: [{ label, href }] }.
// When a note exists the marker renders as a button that opens an explanation;
// until notes are written it stays a static label.
function workDate(w) {
  if (!w.date) return "";
  const d = w.date.debated;
  const info = d && typeof d === "object" && d.note ? d : null;
  const marker = !d ? "" : info
    ? `<button class="debated" data-debated="${esc(w.id)}" aria-expanded="false">debated</button>`
    : `<small>debated</small>`;
  return `<span class="wdate">${esc(w.date.label)}${marker}</span>`;
}
function debatedNote(w) {
  const d = w.date?.debated;
  if (!d || typeof d !== "object" || !d.note) return "";
  return `<div class="date-note" id="note-${esc(w.id)}" hidden><p>${esc(d.note)}</p>${(d.refs || []).length ? `<ul>${d.refs.map((r) => `<li>${r.href ? `<a href="${esc(r.href)}">${esc(r.label)}</a>` : esc(r.label)}</li>`).join("")}</ul>` : ""}</div>`;
}

function viewCollection(id) {
  const c = findCol(id);
  if (!c) return viewMissing();
  const hasDates = c.works.some((w) => w.date);
  const sort = hasDates ? store.get("sort", "date") : "title";
  const works = [...c.works];
  if (sort === "date" && hasDates) works.sort((a, b) => (a.date?.sort ?? 1e9) - (b.date?.sort ?? 1e9) || sortTitle(a.title).localeCompare(sortTitle(b.title)));
  else if (hasDates) works.sort((a, b) => sortTitle(a.title).localeCompare(sortTitle(b.title)));
  const back = { href: "#/library/christianity", label: "Christianity" };
  const sorter = hasDates
    ? `<div class="sorter" role="group" aria-label="Sort works"><span>Sort by</span>${SORTS.map(([k, n]) => `<button data-sort="${k}" class="${sort === k ? "on" : ""}" aria-pressed="${sort === k}">${n}</button>`).join("")}</div>`
    : "";
  return `${topbar(back)}<div class="page">
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="${back.href}">Christianity</a>${icon("right")}<span aria-current="page">${esc(c.title)}</span></nav>
    <h1 class="col-title">${esc(c.title)}</h1>
    <p class="lede wide-lede">${esc(c.intro || c.blurb)}</p>
    <div class="list-head works-head"><span>${c.works.length} works${c.sample ? '<em class="sample">Sample metadata</em>' : ""}</span>${sorter}</div>
    <div class="cards">${works.map((w) => `
      <article class="card plain work">
        <div>
          <h3><a class="stretch" href="#/w/${w.id}">${esc(w.title)}</a>${w.text ? '<span class="avail">Read</span>' : ""}</h3>
          ${w.author ? `<div class="wmeta">${workMeta(w)}<span class="m-date">${w.date ? esc(w.date.label) : ""}</span></div>` : ""}
          <p>${esc(w.blurb)}${w.parts ? `<span class="parts">${w.parts.length} ${esc(w.partLabel || "parts")}</span>` : ""}</p>
          ${debatedNote(w)}
        </div>
        <span class="count">${workDate(w)}</span><span class="chev">${icon("right")}</span>
      </article>`).join("")}</div>
    ${hasDates ? `<p class="legend"><b>c.</b> circa, approximate date&ensp;·&ensp;<i>Italic</i> authorship is attributed, traditional, or anonymous&ensp;·&ensp;<b>debated</b> scholarly estimates vary widely</p>` : ""}
  </div>`;
}

// ---------- Work overview (reusable for every work) ----------
// Overview data lives in L.works[id]; every field is optional:
//   sample        true → shows a "Sample content" label (unverified research)
//   aka           alternate title, e.g. "The Teaching of the Twelve Apostles"
//   intro         one or two sentences under the title
//   facts         [{ label, value, basis: "established" | "disputed" | "unknown" }]
//   background    [{ text, kind: "fact" | "interpretation" }]
//   structure     [[range, title]]
//   manuscripts   [{ name, date, note }]
//   editions      [{ title, detail, status: "available" | "planned" }]
//   connections   [{ rel, title, note, work?, disputed? }]
// Works without overview data fall back to their collection metadata.
const BASIS = { disputed: "Disputed", unknown: "Unknown" };

function workCrumbs(f) {
  const items = [["#/library/christianity", "Christianity"], [`#/c/${f.col.id}`, f.col.title]];
  if (f.parent) items.push([`#/w/${f.parent.id}`, f.parent.title]);
  return `<nav class="breadcrumb" aria-label="Breadcrumb">${items.map(([h, t]) => `<a href="${h}">${esc(t)}</a>${icon("right")}`).join("")}<span aria-current="page">${esc(f.work.title)}</span></nav>`;
}
const workBack = (f) => (f.parent ? { href: `#/w/${f.parent.id}`, label: f.parent.title } : { href: `#/c/${f.col.id}`, label: f.col.title });

function derivedFacts(w) {
  const out = [];
  if (w.date) out.push({ label: "Composed", value: w.date.label, basis: w.date.debated ? "disputed" : "established" });
  if (w.author) out.push({ label: "Authorship", value: AUTHOR_LABEL[w.author.basis](w.author), basis: w.author.basis === "known" ? "established" : "disputed", html: true });
  return out;
}

function section(title, body) {
  return body ? `<section class="ov-section"><h2>${title}</h2>${body}</section>` : "";
}

function viewWork(id) {
  const f = findWork(id);
  if (!f) return viewMissing();
  const w = f.work;
  const facts = w.facts || derivedFacts(w);
  const hasText = Boolean(TEXTS[w.text || id]);
  const readTarget = w.parts ? null : `#/w/${id}/read`;

  const factList = facts.length
    ? `<dl class="ov-facts">${facts.map((x) => `<div class="${x.basis !== "established" ? "is-" + x.basis : ""}"><dt>${esc(x.label)}${BASIS[x.basis] ? `<small>${BASIS[x.basis]}</small>` : ""}</dt><dd>${x.html ? x.value : esc(x.value)}</dd></div>`).join("")}</dl>`
    : `<p class="ov-muted">Historical details for this work are being prepared.</p>`;

  const background = w.background
    ? w.background.map((p) => p.kind === "interpretation"
        ? `<div class="ov-interp"><span class="ov-tag">Scholarly interpretation</span><p>${esc(p.text)}</p></div>`
        : `<p>${esc(p.text)}</p>`).join("")
    : `<p class="ov-muted">A fuller historical background is in preparation.</p>`;

  const parts = w.parts
    ? `<div class="ov-list">${w.parts.map((p) => `<a class="ov-item link" href="#/w/${p.id}"><b>${esc(p.title)}</b>${icon("right")}</a>`).join("")}</div>`
    : "";
  const structure = w.structure
    ? `<div class="ov-list">${w.structure.map(([r, t]) => `<div class="ov-item"><span class="ov-range">${esc(r)}</span><b>${esc(t)}</b></div>`).join("")}</div>`
    : "";
  // Manuscripts open a record page (placeholder until records exist); editions with a text open the reader.
  const manuscripts = w.manuscripts
    ? `<div class="ov-list">${w.manuscripts.map((m) => `<a class="ov-item link" href="#/w/${id}/ms/${esc(m.id)}"><div><b>${esc(m.name)}</b><span>${esc(m.note)}</span></div><span class="ov-date">${esc(m.date)}</span>${icon("right")}</a>`).join("")}</div>`
    : "";
  const editions = w.editions
    ? `<div class="ov-list">${w.editions.map((e) => {
        const inner = `<div><b>${esc(e.title)}</b><span>${esc(e.detail)}</span></div><span class="ov-status ${e.status}">${e.status === "available" ? "Read" : "Planned"}</span>`;
        return e.text ? `<a class="ov-item link" href="#/w/${id}/read" data-tr="${esc(id)}:${esc(e.text)}">${inner}${icon("right")}</a>` : `<div class="ov-item">${inner}</div>`;
      }).join("")}</div>`
    : "";
  const sources = w.sources
    ? `${w.sources.text ? `<div class="src-group"><h3>Text</h3><ul>${w.sources.text.map((t) => `<li>${t.href ? `<a href="${esc(t.href)}" target="_blank" rel="noopener">${esc(t.label)}</a>` : esc(t.label)}</li>`).join("")}</ul></div>` : ""}
       ${(w.sources.groups || []).map((g) => `<div class="src-group"><h3>${esc(g.title)}</h3>${g.items.length
         ? `<ul>${g.items.map((i) => `<li>${esc(i.citation)}</li>`).join("")}</ul>`
         : `<p class="src-placeholder">Placeholder · awaiting verified sources</p>`}</div>`).join("")}`
    : `<p class="src-placeholder">Placeholder · sources for this work have not yet been compiled</p>`;
  const connections = w.connections
    ? `<div class="ov-list">${w.connections.map((c) => {
        const inner = `<div><span class="ov-rel">${esc(c.rel)}${c.disputed ? " · disputed" : ""}</span><b>${esc(c.title)}</b><span>${esc(c.note)}</span></div>${c.work ? icon("right") : ""}`;
        return c.work ? `<a class="ov-item link" href="#/w/${c.work}">${inner}</a>` : `<div class="ov-item">${inner}</div>`;
      }).join("")}</div>`
    : "";

  return `${topbar(workBack(f))}<div class="page overview">
    ${workCrumbs(f)}
    <header class="ov-head">
      ${w.sample ? '<span class="sample">Sample content · not yet verified</span>' : ""}
      <h1>${esc(w.title)}</h1>
      ${w.aka ? `<p class="ov-aka">${esc(w.aka)}</p>` : ""}
      <p class="lede wide-lede">${esc(w.intro || w.blurb.replace(/\.?$/, "."))}</p>
      ${readTarget ? `<a class="btn-read" href="${readTarget}">Read This Work${icon("right")}</a>${hasText ? "" : '<span class="ov-muted ov-note">Reading view in design</span>'}` : ""}
    </header>
    <div class="ov-grid">
      <aside class="ov-aside"><h2>At a glance</h2>${factList}</aside>
      <div class="ov-main">
        ${section("Historical background", background)}
        ${section(w.partLabel ? w.partLabel[0].toUpperCase() + w.partLabel.slice(1) : "Parts", parts)}
        ${section("Structure", structure)}
        ${section("Manuscripts &amp; preservation", manuscripts)}
        ${section("Translations &amp; editions", editions)}
        ${section("Connections", connections)}
        <section class="ov-section ov-sources"><h2>Sources &amp; further reading</h2>${sources}</section>
        <p class="legend"><b>Disputed</b> scholars disagree&ensp;·&ensp;<b>Scholarly interpretation</b> a reading of the evidence, not settled fact${w.sample ? "&ensp;·&ensp;Sample content is placeholder research awaiting verification." : ""}</p>
      </div>
    </div>
  </div>`;
}

function viewManuscript(id, msId) {
  const f = findWork(id);
  const m = f?.work.manuscripts?.find((x) => x.id === msId);
  if (!m) return viewMissing();
  const back = { href: `#/w/${id}`, label: f.work.title };
  return `${topbar(back)}<div class="page overview">
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="#/c/${f.col.id}">${esc(f.col.title)}</a>${icon("right")}<a href="#/w/${id}">${esc(f.work.title)}</a>${icon("right")}<span aria-current="page">Manuscripts</span></nav>
    <header class="ov-head"><span class="sample">Placeholder record</span><h1>${esc(m.name)}</h1><p class="ov-aka">${esc(m.date)}</p><p class="lede wide-lede">${esc(m.note)}</p></header>
    <div class="empty" style="margin-top:36px"><b>Detailed record in preparation.</b>Provenance, contents, and images (where legally usable) will appear here. No images or catalog links have been sourced yet.</div>
  </div>`;
}

function searchIndex() {
  const out = [];
  trad.collections.forEach((c) => c.works.forEach((w) => out.push({ kind: "work", title: w.title, sub: `${c.title} · ${w.blurb}`, href: `#/w/${w.id}` })));
  for (const id of Object.keys(TEXTS)) {
    const t = readerText(id), w = findWork(id);
    const tr = t.translations[t.default];
    tr.sections.forEach((sec) => sec.passages.forEach((p) => {
      const text = p.runs ? p.runs.map((r) => r.t).join("") : p.lines.map((l) => (typeof l === "string" ? l : l.t)).join(" ");
      out.push({ kind: "verse", title: `${w.work.title} ${sec.n}.${p.n}`, sub: text, href: readHref(id, sec.n, p.n) });
    }));
  }
  return out;
}
let INDEX;
function searchResults(q) {
  q = q.trim();
  if (q.length < 2) return `<p class="section-label">Try "Watchers", "Didache", or "Hermon"</p>`;
  INDEX ||= searchIndex();
  const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const hits = INDEX.filter((x) => re.test(x.title) || re.test(x.sub));
  const mark = (s) => esc(s).replace(new RegExp(esc(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), (m) => `<mark>${m}</mark>`);
  const group = (kind, label) => {
    const g = hits.filter((h) => h.kind === kind).slice(0, 40);
    return g.length ? `<div class="section-label">${label}</div>${g.map((h) => `<a class="hit" href="${h.href}"><b>${mark(h.title)}</b><span>${mark(h.sub)}</span></a>`).join("")}` : "";
  };
  return group("work", "Works") + group("verse", "Passages") || `<p class="section-label">No results for "${esc(q)}"</p>`;
}
function viewSearch(q = "") {
  return `${topbar()}<div class="page"><h1>Search</h1>
    <label class="search-box">${icon("search")}<input id="q" type="search" placeholder="Search works and passages" value="${esc(q)}" autocomplete="off" /></label>
    <div id="results">${searchResults(q)}</div></div>`;
}

function viewBookmarks() {
  const bs = rdBookmarks();
  return `${topbar()}<div class="page"><h1>Bookmarks</h1>
    ${bs.length ? `<div class="rows" style="margin-top:24px">${bs.map((b, i) => {
      const w = findWork(b.work);
      return `<a class="row" href="${readHref(b.work, b.ch, b.n)}"><span class="n">${i + 1}</span><div><h4>${esc(w.work.title)} ${b.ch}${b.n ? "." + esc(b.n) : ""}</h4><p>${b.n ? "Passage" : "Chapter"} bookmark</p></div><span class="chev">${icon("right")}</span></a>`;
    }).join("")}</div>` : `<div class="empty"><b>No bookmarks yet.</b>Bookmark a chapter or passage while reading to save your place.</div>`}</div>`;
}

const SOON = {
  explore: "Browse the whole library by era, region, and genre.",
  timeline: "See every work on one timeline, from the Torah to the medieval mystics.",
  maps: "See where texts were written, copied, and rediscovered.",
  people: "Authors, translators, and the figures the texts are about.",
  notes: "Your notes and highlights, kept alongside the text.",
  downloads: "Save works for offline reading.",
  settings: "Reading preferences and account settings.",
};
function viewSoon(key) {
  const name = NAV.concat(FOOT).find((x) => x[0] === key)?.[1] || key;
  return `${topbar()}<div class="page"><h1>${name}</h1><div class="empty"><b>Coming soon.</b>${SOON[key] || ""}</div></div>`;
}
function viewAbout() {
  return `${topbar()}<div class="page"><h1>About</h1><div class="prose" style="margin-top:20px">
    <p>Scriptorias is a digital library for preserving, exploring, and understanding ancient religious and historical writings.</p>
    <p>It isn't a devotional app. The focus is historical discovery: where each work came from, how it was transmitted, and how texts speak to one another across centuries. Curated <em>Pathways</em> guide readers through those connections.</p>
    <p>Scriptorias begins with Christianity: biblical texts, apocrypha, early Christian writings, and the Church Fathers. It will grow to include other religious, mythological, and philosophical traditions.</p></div></div>`;
}
const viewMissing = () => `${topbar()}<div class="page"><h1>Not found</h1><div class="empty"><b>This page isn't in the library.</b><a href="#/">Return to the collections</a></div></div>`;

// ---------- Router ----------
function route() {
  const parts = location.hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
  const [r, a, b, c, d] = parts;
  let html, active = "lib:christianity";
  if (!r) html = viewLibrary("christianity");
  else if (r === "home") { html = viewHome(); active = "home"; }
  else if (r === "library") { html = viewLibrary(a, b); active = "lib:" + a; }
  else if (r === "c") html = viewCollection(a);
  else if (r === "w") html = b === "read" ? viewReader(a, c, d) : b === "ms" ? viewManuscript(a, c) : viewWork(a);
  else if (r === "path" || r === "paths") { html = a ? viewPath(a) : viewPaths(); active = "paths"; }
  else if (r === "search") { html = viewSearch(a || ""); active = "search"; }
  else if (r === "bookmarks") { html = viewBookmarks(); active = "bookmarks"; }
  else if (r === "about") { html = viewAbout(); active = "about"; }
  else if (SOON[r]) { html = viewSoon(r); active = r; }
  else html = viewMissing();

  const reading = r === "w" && b === "read" && html.startsWith('<div class="rd"');
  document.body.classList.toggle("reading", reading);
  if (!reading) document.body.classList.remove("reading-dark");
  renderShell(active);
  const main = document.getElementById("main");
  main.innerHTML = html;
  window.scrollTo(0, 0);
  if (reading) mountReader();
  const q = document.getElementById("q");
  if (q && !("ontouchstart" in window)) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
  document.title = (main.querySelector("h1")?.textContent || "Scriptorias") + " — Scriptorias";
}

document.addEventListener("input", (e) => {
  if (e.target.id === "q") {
    document.getElementById("results").innerHTML = searchResults(e.target.value);
    history.replaceState(null, "", "#/search/" + encodeURIComponent(e.target.value));
  }
});
document.addEventListener("click", (e) => {
  const db = e.target.closest("[data-debated]");
  if (db) {
    const note = document.getElementById("note-" + db.dataset.debated);
    if (note) { note.hidden = !note.hidden; db.setAttribute("aria-expanded", String(!note.hidden)); }
    return;
  }
  const so = e.target.closest("[data-sort]");
  if (so) { store.set("sort", so.dataset.sort); route(); return; }
  if (e.target.closest("[data-share]")) {
    navigator.clipboard?.writeText(location.href).then(() => toast("Link copied"), () => toast(location.href));
  }
});
document.addEventListener("keydown", (e) => {
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if (e.key === "/" && !typing) { e.preventDefault(); location.hash = "#/search"; }
});

window.addEventListener("hashchange", route);
// reader.js loads after this file, so the first render waits for all scripts.
document.addEventListener("DOMContentLoaded", route);
