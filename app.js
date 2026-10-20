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
  library: '<path d="M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1z"/><path d="M12 6v14"/>',
};
const icon = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ""}</svg>`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// ---------- Storage ----------
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem("sc." + k)) ?? d; } catch { return d; } },
  set: (k, v) => localStorage.setItem("sc." + k, JSON.stringify(v)),
};
const SIZES = [16, 18, 20, 23];
const applySize = () => document.documentElement.style.setProperty("--read-size", SIZES[store.get("size", 1)] + "px");
applySize();

// ---------- Catalog lookup ----------
const trad = L.christianity;
function findWork(id) {
  for (const [ci, c] of trad.collections.entries()) {
    const wi = c.works.findIndex((w) => w.id === id);
    if (wi >= 0) return { col: c, ci, wi, work: { ...c.works[wi], ...(L.works[id] || {}) } };
  }
  return null;
}
const findCol = (id) => trad.collections.find((c) => c.id === id);
const readHref = (work, ch, v) => `#/w/${work}/read/${ch}${v ? "/" + v : ""}`;

// ---------- Shell ----------
const NAV = [
  ["home", "Home"], ["explore", "Explore"], ["paths", "Paths"], ["timeline", "Timeline"], ["maps", "Maps"],
  ["people", "People"], ["bookmarks", "Bookmarks"], ["notes", "Notes"], ["downloads", "Downloads"], ["search", "Search"],
];
const FOOT = [["settings", "Settings"], ["about", "About"]];
const TABBAR = [["library", "Library", "#/"], ["search", "Search", "#/search"], ["notes", "Notes", "#/notes"], ["bookmark", "Bookmarks", "#/bookmarks"], ["more", "More", "menu"]];

function renderShell(active) {
  const link = ([id, name]) => `<a href="#/${id}" class="${active === id ? "on" : ""}">${icon(id)}${name}</a>`;
  document.getElementById("nav-main").innerHTML = NAV.map(link).join("");
  document.getElementById("nav-foot").innerHTML = FOOT.map(link).join("");
  document.getElementById("nav-libraries").innerHTML = L.traditions
    .map((t) => `<a href="#/library/${t.id}" class="${active === "lib:" + t.id ? "on" : ""} ${t.live ? "" : "off"}" ${t.live ? "" : 'title="Coming soon"'}>${icon(t.icon)}${t.name}</a>`)
    .join("");
  const tabActive = active.startsWith("lib:") || active === "home" ? "library" : active === "bookmarks" ? "bookmark" : active;
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
    : `<a class="mark" href="#/">Scriptorias</a>`;
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
    <div class="section-label">Featured path</div>
    ${pathCards()}
    <div class="section-label">Libraries</div>
    <div class="libs">${L.traditions.map((t) => `<a class="lib ${t.live ? "" : "off"}" href="#/library/${t.id}">${icon(t.icon)}${t.name}${t.live ? "" : '<span class="soon">Soon</span>'}</a>`).join("")}</div>
  </div>`;
}

const LIB_TABS = [["collections", "Collections"], ["paths", "Paths"], ["timeline", "Timeline"], ["figures", "Key Figures"], ["topics", "Topics"]];

function viewLibrary(id, tab = "collections") {
  const t = L.traditions.find((x) => x.id === id);
  if (!t) return viewMissing();
  if (!t.live) return `${topbar()}<div class="page"><h1>${t.name}</h1>
    <div class="empty"><b>This library is being assembled.</b>Scriptorias starts with Christianity. ${t.name} is next on the shelf.</div></div>`;
  const body =
    tab === "collections"
      ? `<div class="cards">${trad.collections.map((c, i) => `
          <a class="card" href="#/c/${c.id}">
            <span class="num">${i + 1}</span>
            <div><h3>${esc(c.title)}</h3><p>${esc(c.blurb)}</p></div>
            <span class="count">${esc(c.count)}</span><span class="chev">${icon("right")}</span>
          </a>`).join("")}</div>`
      : tab === "paths"
      ? pathCards()
      : `<div class="empty"><b>${LIB_TABS.find((x) => x[0] === tab)[1]} is coming soon.</b>This view will connect works by date, author, and theme.</div>`;
  return `${topbar()}<div class="page">
    <div class="head-row"><div><h1>${t.name}</h1><p class="facets">${trad.facets.map((f) => `<span>${f}</span>`).join("")}</p></div>
      <button class="icon-btn" aria-label="More">${icon("more")}</button></div>
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

function viewPath(id) {
  const p = L.paths.find((x) => x.id === id);
  if (!p) return viewMissing();
  const back = { href: "#/library/christianity/paths", label: "Paths" };
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

const COL_TABS = [["works", "Works"], ["about", "About"], ["themes", "Themes"], ["related", "Related"]];

function viewCollection(id, tab = "works") {
  const c = findCol(id);
  if (!c) return viewMissing();
  const n = trad.collections.indexOf(c) + 1;
  const back = { href: "#/library/christianity", label: "Christianity" };
  let body;
  if (tab === "works") {
    body = `<div class="list-head"><span>${c.works.length} works</span><span class="sort">Sort: Traditional Order</span></div>
      <div class="rows">${c.works.map((w, i) => `
        <a class="row" href="#/w/${w.id}"><span class="n">${i + 1}</span>
          <div><h4>${esc(w.title)}${w.text ? '<span class="avail">Read</span>' : ""}</h4><p>${esc(w.blurb)}</p></div>
          <span class="chev">${icon("right")}</span></a>`).join("")}</div>`;
  } else if (tab === "about") {
    body = `<div class="prose"><p>${esc(c.about)}</p></div>`;
  } else if (tab === "themes" && c.themes) {
    body = `<div class="pills">${c.themes.map((t) => `<span class="pill">${esc(t)}</span>`).join("")}</div>`;
  } else {
    body = `<div class="empty"><b>Coming soon.</b>Connections between this collection and the rest of the library will appear here.</div>`;
  }
  return `${topbar(back)}<div class="page">${crumb(back)}
    <div class="col-head"><span class="num">${n}</span><h1>${esc(c.title)}</h1></div>
    <p class="lede">${esc(c.blurb)}</p>
    <div class="seg">${COL_TABS.map(([k, name]) => `<a href="#/c/${id}/${k}" class="${tab === k ? "on" : ""}">${name}</a>`).join("")}</div>
    ${body}
  </div>`;
}

const WORK_TABS = [["read", "Read"], ["about", "About"], ["themes", "Themes"], ["related", "Related"]];

function viewWork(id, tab, ch, v) {
  const f = findWork(id);
  if (!f) return viewMissing();
  const { work, col, ci } = f;
  const text = work.text && TEXTS[work.text];
  tab = tab || (text ? "read" : "about");
  const back = { href: `#/c/${col.id}`, label: `${ci + 1}. ${col.title}` };
  const tabs = `<div class="utabs">${WORK_TABS.map(([k, n]) => `<a href="#/w/${id}/${k}" class="${tab === k ? "on" : ""}">${n}</a>`).join("")}</div>`;
  const head = `<div class="work-head"><div class="head-row"><h1>${esc(work.title)}</h1></div>
    ${work.tags ? `<div class="tags">${work.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>` : ""}</div>`;

  let body = "";
  if (tab === "read") {
    if (!text) {
      body = `<div class="empty"><b>The text is on its way.</b>${esc(work.blurb)}. We're preparing a public-domain edition of this work.</div>`;
    } else {
      const chapters = text.chapters;
      const chn = Math.min(Math.max(1, Number(ch) || store.get("pos." + id, 1)), chapters.length);
      const chap = chapters[chn - 1];
      store.set("pos." + id, chn);
      store.set("last", { work: id, ch: chn });
      const marked = store.get("bookmarks", []).some((b) => b.work === id && b.ch === chn);
      body = `<div class="reader">
        <div class="toolbar">
          <label class="select"><select data-chapter aria-label="Chapter">${chapters.map((c) => `<option value="${c.n}" ${c.n === chn ? "selected" : ""}>Chapter ${c.n}</option>`).join("")}</select>${icon("down")}</label>
          <button class="icon-btn aa" data-size aria-label="Text size">A<small>A</small></button>
          <button class="icon-btn ${marked ? "on" : ""}" data-bookmark="${chn}" aria-label="Bookmark">${icon("bookmark")}</button>
          <button class="icon-btn" data-share aria-label="Copy link">${icon("more")}</button>
        </div>
        <article class="chapter">
          <h2>Chapter ${chn}</h2>
          <p class="sub">${esc(chap.title)}</p>
          ${chap.verses.map((vs) => `<div class="verse${vs.stanza ? " stanza" : ""}${String(vs.n) === String(v) ? " hl" : ""}" id="v${esc(vs.n)}"><span class="vn">${esc(vs.n)}</span><div>${vs.lines
            .map((l) => (typeof l === "string" ? `<span class="ln">${esc(l)}</span>` : `<span class="ln stanza">${esc(l.t)}</span>`))
            .join("")}</div></div>`).join("")}
        </article>
        <div class="pager">
          ${chn > 1 ? `<a href="${readHref(id, chn - 1)}">${icon("left")}Chapter ${chn - 1}</a>` : ""}
          ${chn < chapters.length ? `<a class="next" href="${readHref(id, chn + 1)}">Chapter ${chn + 1}${icon("right")}</a>` : ""}
        </div>
        <p class="attrib">Translation: ${esc(text.translation)}. Public domain. Chapters 1–${chapters.length} of 108 are available in this preview.</p>
      </div>`;
    }
  } else if (tab === "about") {
    body = `<div class="prose">
      ${work.facts ? `<dl class="facts">${work.facts.map(([k, val]) => `<dt>${esc(k)}</dt><dd>${esc(val)}</dd>`).join("")}</dl>` : ""}
      ${(work.about || [work.blurb + "."]).map((p) => `<p>${esc(p)}</p>`).join("")}
      ${work.sections ? `<h2>Structure</h2>${work.sections.map(([r, n]) => `<div class="def"><b>${esc(n)}</b><span>Chapters ${esc(r)}</span></div>`).join("")}` : ""}
    </div>`;
  } else if (tab === "themes" && work.themes) {
    body = `<div class="prose" style="margin-top:8px">${work.themes.map(([n, d]) => `<div class="def"><b>${esc(n)}</b><span>${esc(d)}</span></div>`).join("")}</div>`;
  } else if (tab === "related" && work.related) {
    body = `<div class="prose" style="margin-top:8px">${work.related.map((r) => {
      const inner = `<span class="rel">${esc(r.rel)}</span><b>${esc(r.title)}</b><span>${esc(r.note)}</span>`;
      return r.work ? `<a class="def" style="display:block" href="#/w/${r.work}">${inner}</a>` : `<div class="def">${inner}</div>`;
    }).join("")}</div>`;
  } else {
    body = `<div class="empty"><b>Coming soon.</b>Themes and connections for this work are still being written.</div>`;
  }
  return `${topbar(back)}<div class="page">${crumb(back)}${head}${tabs}<div style="padding-top:${tab === "read" ? 0 : 24}px">${body}</div></div>`;
}

function searchIndex() {
  const out = [];
  trad.collections.forEach((c) => c.works.forEach((w) => out.push({ kind: "work", title: w.title, sub: `${c.title} · ${w.blurb}`, href: `#/w/${w.id}` })));
  for (const [id, t] of Object.entries(TEXTS)) {
    const w = findWork(id);
    t.chapters.forEach((ch) => ch.verses.forEach((v) => {
      const s = v.lines.map((l) => (typeof l === "string" ? l : l.t)).join(" ");
      out.push({ kind: "verse", title: `${w.work.title} ${ch.n}:${v.n}`, sub: s, href: readHref(id, ch.n, v.n) });
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
  const bs = store.get("bookmarks", []);
  return `${topbar()}<div class="page"><h1>Bookmarks</h1>
    ${bs.length ? `<div class="rows" style="margin-top:24px">${bs.map((b, i) => {
      const w = findWork(b.work);
      return `<a class="row" href="${readHref(b.work, b.ch)}"><span class="n">${i + 1}</span><div><h4>${esc(w.work.title)} · Chapter ${b.ch}</h4><p>${esc(TEXTS[b.work].chapters[b.ch - 1].title)}</p></div><span class="chev">${icon("right")}</span></a>`;
    }).join("")}</div>` : `<div class="empty"><b>No bookmarks yet.</b>Tap the bookmark icon while reading to save your place.</div>`}</div>`;
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
    <p>It isn't a devotional app. The focus is historical discovery: where each work came from, how it was transmitted, and how texts speak to one another across centuries. Curated <em>Paths</em> guide readers through those connections.</p>
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
  else if (r === "c") html = viewCollection(a, b);
  else if (r === "w") html = viewWork(a, b, c, d);
  else if (r === "path" || r === "paths") { html = a ? viewPath(a) : viewLibrary("christianity", "paths"); active = "paths"; }
  else if (r === "search") { html = viewSearch(a || ""); active = "search"; }
  else if (r === "bookmarks") { html = viewBookmarks(); active = "bookmarks"; }
  else if (r === "about") { html = viewAbout(); active = "about"; }
  else if (SOON[r]) { html = viewSoon(r); active = r; }
  else html = viewMissing();

  renderShell(active);
  const main = document.getElementById("main");
  main.innerHTML = html;
  const hl = main.querySelector(".verse.hl");
  if (hl) hl.scrollIntoView({ block: "center" });
  else window.scrollTo(0, 0);
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
document.addEventListener("change", (e) => {
  const sel = e.target.closest("[data-chapter]");
  if (sel) location.hash = readHref(location.hash.split("/")[2], sel.value);
});
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-size]")) {
    store.set("size", (store.get("size", 1) + 1) % SIZES.length);
    applySize();
  }
  const bm = e.target.closest("[data-bookmark]");
  if (bm) {
    const work = location.hash.split("/")[2], ch = Number(bm.dataset.bookmark);
    let bs = store.get("bookmarks", []);
    const had = bs.some((b) => b.work === work && b.ch === ch);
    bs = had ? bs.filter((b) => !(b.work === work && b.ch === ch)) : [...bs, { work, ch }];
    store.set("bookmarks", bs);
    bm.classList.toggle("on", !had);
    toast(had ? "Bookmark removed" : "Bookmarked");
  }
  if (e.target.closest("[data-share]")) {
    navigator.clipboard?.writeText(location.href).then(() => toast("Link copied"), () => toast(location.href));
  }
});
document.addEventListener("keydown", (e) => {
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if (e.key === "/" && !typing) { e.preventDefault(); location.hash = "#/search"; }
  const pager = document.querySelector(".pager");
  if (pager && !typing && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
    const a = e.key === "ArrowRight" ? pager.querySelector(".next") : pager.querySelector("a:not(.next)");
    if (a) location.hash = a.getAttribute("href");
  }
});

window.addEventListener("hashchange", route);
route();
