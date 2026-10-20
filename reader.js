// ---------- Reader (reusable for every work) ----------
// Text data, one entry per work:
//   TEXTS[workId] = { sectionLabel, totalSections, default, translations: { [key]: Translation } }
//   Translation   = { label, detail, license, source: { label, href }, sample, refScheme, italics,
//                     sections: [{ n, title?, passages: [Passage] }] }
//   Passage       = { ref: "work.section.n", n, runs?: [{ t, em? }], lines?: (string | { t, stanza })[], stanza? }
// `ref` is the stable identifier for bookmarks, citations, notes, and links. It is shared across
// translations, so a side-by-side view can align passages by ref without changing this format.

const RD_SIZES = [16, 17, 18, 19, 20, 22, 24];
const RD_LEADING = { compact: 1.55, comfortable: 1.75, airy: 1.95 };
const rdPrefs = () => ({ size: 19, leading: "comfortable", theme: "light", ...store.get("rd.prefs", {}) });
const rdUI = { toc: false, notes: false, settings: false, sel: null };

// Older single-translation data (1 Enoch) is normalized into the format above on first use.
function readerText(id) {
  const t = TEXTS[id];
  if (!t || t.translations) return t || null;
  TEXTS[id] = {
    sectionLabel: "Chapter",
    totalSections: L.works[id]?.totalSections || t.chapters.length,
    default: "main",
    translations: {
      main: {
        label: t.label || t.translation,
        detail: t.detail || "",
        license: "Public domain",
        sample: true,
        sections: t.chapters.map((c) => ({
          n: c.n, title: c.title,
          passages: c.verses.map((v) => ({ ref: `${id}.${c.n}.${v.n}`, n: v.n, lines: v.lines, stanza: v.stanza })),
        })),
      },
    },
  };
  return TEXTS[id];
}

const rdTranslationKey = (id, t) => {
  const k = store.get("rd.tr." + id, t.default);
  return t.translations[k] ? k : t.default;
};

// Bookmarks: { ref, work, ch, n?, tr, at }. Older entries ({ work, ch }) are upgraded in place.
function rdBookmarks() {
  return store.get("bookmarks", []).map((b) => (b.ref ? b : { ref: `${b.work}.${b.ch}`, work: b.work, ch: b.ch }));
}
const rdIsMarked = (ref) => rdBookmarks().some((b) => b.ref === ref);
function rdToggleBookmark(entry) {
  let bs = rdBookmarks();
  const had = bs.some((b) => b.ref === entry.ref);
  bs = had ? bs.filter((b) => b.ref !== entry.ref) : [...bs, { ...entry, at: Date.now() }];
  store.set("bookmarks", bs);
  return !had;
}

// Groups for the table of contents come from the work's `structure` ranges, e.g. ["1–6", "The Two Ways"].
function rdGroups(work, total) {
  const groups = (work.structure || []).map(([r, title]) => {
    const [a, b] = r.split(/[–-]/).map(Number);
    return { title, from: a, to: b || a };
  });
  return groups.length ? groups : [{ title: null, from: 1, to: total }];
}

function rdRuns(p) {
  if (p.runs) return p.runs.map((r) => (r.em ? `<em>${esc(r.t)}</em>` : esc(r.t))).join("");
  return p.lines.map((l) => (typeof l === "string" ? `<span class="ln">${esc(l)}</span>` : `<span class="ln stanza">${esc(l.t)}</span>`)).join("");
}

function viewReader(id, ch, seg) {
  const f = findWork(id);
  if (!f) return viewMissing();
  const w = f.work;
  const t = readerText(w.text || id);
  if (!t) {
    return `${topbar({ href: `#/w/${id}`, label: w.title })}<div class="soon-page"><h1>${esc(w.title)}</h1><p>Reading view coming soon</p><a class="crumb-link" href="#/w/${id}">${icon("left")}Back to overview</a></div>`;
  }
  const trKey = rdTranslationKey(id, t);
  const tr = t.translations[trKey];
  const avail = tr.sections.map((s) => s.n);
  const saved = store.get("rd.pos." + id, null);
  const chn = avail.includes(Number(ch)) ? Number(ch) : saved && avail.includes(saved.ch) ? saved.ch : avail[0];
  const sec = tr.sections.find((s) => s.n === chn);
  const total = t.totalSections || avail.length;
  const label = t.sectionLabel || "Chapter";
  const notes = w.notes || {};
  const groups = rdGroups(w, total);
  const group = groups.find((g) => chn >= g.from && chn <= g.to);
  const done = store.get("rd.done." + id, []);
  const prefs = rdPrefs();
  const chRef = `${id}.${chn}`;
  const target = seg ? `${id}.${chn}.${seg}` : null;
  rdUI.sel = target;
  if (window.innerWidth < 1200) rdUI.toc = rdUI.notes = false;
  rdUI.settings = false;
  store.set("last", { work: id, ch: chn });

  // Text: inline passages share a paragraph (prose); line-based passages render as verse blocks.
  const inline = sec.passages.every((p) => p.runs);
  const passage = (p) => {
    const mark = notes[p.ref] ? `<button class="nmark" data-note-ref="${esc(p.ref)}" aria-label="Notes on ${esc(p.ref)}"></button>` : "";
    const cls = `psg${p.ref === target ? " sel" : ""}${rdIsMarked(p.ref) ? " marked" : ""}`;
    return inline
      ? `<span class="${cls}" id="${esc(p.ref)}" data-ref="${esc(p.ref)}"><sup class="pn" data-pn>${esc(p.n)}</sup>${rdRuns(p)}${mark}</span> `
      : `<div class="${cls} block${p.stanza ? " stanza" : ""}" id="${esc(p.ref)}" data-ref="${esc(p.ref)}"><span class="pn" data-pn>${esc(p.n)}</span><div>${rdRuns(p)}${mark}</div></div>`;
  };
  const body = inline ? `<p>${sec.passages.map(passage).join("")}</p>` : sec.passages.map(passage).join("");

  const sampleRange = avail.length < total ? `${label}s ${avail[0]}–${avail[avail.length - 1]} of ${total}` : null;
  const prev = avail.filter((n) => n < chn).pop();
  const next = avail.find((n) => n > chn);

  // Panels
  const toc = `<aside class="rd-panel rd-left ${rdUI.toc ? "open" : ""}" id="rd-toc" aria-label="Contents">
    <div class="rd-panel-head"><h2>Contents</h2><button class="icon-btn" data-rd="toc" aria-label="Close">${icon("close")}</button></div>
    <div class="rd-panel-body">
      <div class="rd-block"><h3>Translation</h3>
        ${Object.entries(t.translations).map(([k, x]) => `<button class="rd-choice ${k === trKey ? "on" : ""}" data-rd-tr="${esc(k)}"><b>${esc(x.label)}</b><span>${esc(x.detail)}${x.sample ? " · sample" : ""}</span></button>`).join("")}
        ${(w.editions || []).filter((e) => !e.text).map((e) => `<div class="rd-choice off"><b>${esc(e.title)}</b><span>${esc(e.detail.split(" · ")[0])} · planned</span></div>`).join("")}
        <p class="rd-hint">Side-by-side comparison will be available once a second translation is added.</p>
      </div>
      <div class="rd-block"><h3>${label}s <span class="rd-count">${done.length} of ${total} read</span></h3>
        ${groups.map((g) => `${g.title ? `<h4>${esc(g.title)}</h4>` : ""}<ol class="rd-toc">${Array.from({ length: g.to - g.from + 1 }, (_, i) => g.from + i).map((n) =>
          avail.includes(n)
            ? `<li><a href="${readHref(id, n)}" class="${n === chn ? "on" : ""}">${label} ${n}${done.includes(n) ? `<i class="rd-done" aria-label="Read"></i>` : ""}</a></li>`
            : `<li><span class="off">${label} ${n}<small>not in sample</small></span></li>`).join("")}</ol>`).join("")}
      </div>
      <div class="rd-block"><h3>Bookmarks</h3>
        ${(() => {
          const bs = rdBookmarks().filter((b) => b.work === id);
          return bs.length
            ? `<ul class="rd-bms">${bs.map((b) => `<li><a href="${readHref(id, b.ch, b.n)}">${esc(w.title)} ${b.ch}${b.n ? "." + esc(b.n) : ""}</a></li>`).join("")}</ul>`
            : `<p class="rd-hint">No bookmarks yet.</p>`;
        })()}
      </div>
    </div>
  </aside>`;

  const chNotes = notes[chRef] || [];
  const psgNotes = sec.passages.filter((p) => notes[p.ref]);
  const noteItem = (n) => {
    const inner = `<span class="rd-kind">${esc(n.kind)}</span><b>${esc(n.title)}</b><span>${esc(n.note)}</span>`;
    return n.work ? `<a class="rd-note" href="#/w/${esc(n.work)}">${inner}</a>` : `<div class="rd-note">${inner}</div>`;
  };
  const notesPanel = `<aside class="rd-panel rd-right ${rdUI.notes ? "open" : ""}" id="rd-notes" aria-label="Notes and connections">
    <div class="rd-panel-head"><h2>Notes &amp; connections</h2><button class="icon-btn" data-rd="notes" aria-label="Close">${icon("close")}</button></div>
    <div class="rd-panel-body">
      ${w.sample ? '<p class="rd-sample-tag">Sample notes · not yet verified</p>' : ""}
      ${chNotes.length ? `<div class="rd-block"><h3>This ${label.toLowerCase()}</h3>${chNotes.map(noteItem).join("")}</div>` : ""}
      ${psgNotes.length ? `<div class="rd-block"><h3>Passages</h3>${psgNotes.map((p) => `<div class="rd-note-group" data-for="${esc(p.ref)}"><a class="rd-ref" href="${readHref(id, chn, p.n)}">${esc(w.title)} ${chn}.${esc(p.n)}</a>${notes[p.ref].map(noteItem).join("")}</div>`).join("")}</div>` : ""}
      ${!chNotes.length && !psgNotes.length ? `<p class="rd-hint">No notes for this ${label.toLowerCase()} yet.</p>` : ""}
      <div class="rd-block"><a class="rd-link" href="#/w/${id}">Historical overview${icon("right")}</a></div>
    </div>
  </aside>`;

  const settings = `<div class="rd-pop ${rdUI.settings ? "open" : ""}" id="rd-settings" role="dialog" aria-label="Reading settings">
    <div class="rd-set"><span>Text size</span><div class="rd-seg"><button data-rd-size="-1" aria-label="Smaller text">A−</button><output id="rd-size-out">${prefs.size}</output><button data-rd-size="1" aria-label="Larger text">A+</button></div></div>
    <div class="rd-set"><span>Line spacing</span><div class="rd-seg">${Object.keys(RD_LEADING).map((k) => `<button data-rd-leading="${k}" class="${prefs.leading === k ? "on" : ""}">${k[0].toUpperCase() + k.slice(1)}</button>`).join("")}</div></div>
    <div class="rd-set"><span>Theme</span><div class="rd-seg">${["light", "dark"].map((k) => `<button data-rd-theme="${k}" class="${prefs.theme === k ? "on" : ""}">${k === "light" ? "Light" : "Dark"}</button>`).join("")}</div></div>
  </div>`;

  const tools = `
    <button class="rd-tool ${rdUI.toc ? "on" : ""}" data-rd="toc" aria-label="Contents">${icon("contents")}<span>Contents</span></button>
    <button class="rd-tool ${rdUI.settings ? "on" : ""}" data-rd="settings" aria-label="Reading settings">${icon("type")}<span>Text</span></button>
    <button class="rd-tool ${rdIsMarked(chRef) ? "on marked" : ""}" data-rd-bookmark="${esc(chRef)}" aria-label="Bookmark this ${label.toLowerCase()}">${icon("bookmark")}<span>Bookmark</span></button>
    <button class="rd-tool ${rdUI.notes ? "on" : ""}" data-rd="notes" aria-label="Notes and connections">${icon("notes")}<span>Notes</span></button>`;

  return `<div class="rd" id="rd" data-work="${esc(id)}" data-ch="${chn}" data-tr="${esc(trKey)}" data-theme="${prefs.theme}"
      style="--rd-size:${prefs.size}px; --rd-leading:${RD_LEADING[prefs.leading]}">
    <div class="rd-progress"><span id="rd-progress"></span></div>
    <header class="rd-bar">
      <a class="rd-back" href="#/w/${id}">${icon("left")}<span>${esc(w.title)}</span></a>
      <div class="rd-run"><b>${esc(w.title)}</b><span>${esc(tr.label)}${tr.detail ? ` (${esc(tr.detail.match(/\d{4}/)?.[0] || tr.detail)})` : ""} · ${label} ${chn}</span></div>
      <div class="rd-tools">${tools}</div>
    </header>
    ${toc}${notesPanel}${settings}
    <div class="rd-scrim ${rdUI.settings ? "show" : ""}" data-rd-close></div>
    <main class="rd-page">
      ${tr.sample ? `<p class="rd-sample">Sample passage${sampleRange ? ` · ${sampleRange}` : ""} · ${esc(tr.label)}${tr.detail ? `, ${esc(tr.detail)}` : ""}</p>` : ""}
      <header class="rd-head">
        <p class="rd-kicker">${label}</p>
        <h1 class="rd-num">${chn}</h1>
        ${group?.title || sec.title ? `<p class="rd-group">${esc(sec.title || group.title)}</p>` : ""}
      </header>
      <article class="rd-text ${inline ? "prose-mode" : "verse-mode"}">${body}</article>
      <nav class="rd-pager">
        ${prev ? `<a href="${readHref(id, prev)}" data-dir="prev">${icon("left")}${label} ${prev}</a>` : "<span></span>"}
        ${next ? `<a href="${readHref(id, next)}" data-dir="next" class="next">${label} ${next}${icon("right")}</a>`
          : chn < total ? `<span class="rd-end">${label} ${chn + 1} is not in this sample</span>` : `<span class="rd-end">End of ${esc(w.title)}</span>`}
      </nav>
      <footer class="rd-colophon">
        <p><b>${esc(tr.label)}</b>${tr.detail ? `, ${esc(tr.detail)}` : ""}${tr.license ? ` · ${esc(tr.license)}` : ""}${tr.source ? ` · <a href="${esc(tr.source.href)}" target="_blank" rel="noopener">${esc(tr.source.label)}</a>` : ""}</p>
        ${tr.italics ? `<p>${esc(tr.italics)}</p>` : ""}
        <p>Select a passage number to bookmark or cite it. References take the form <code>${esc(id)}.${chn}.1</code>${tr.refScheme === "provisional" ? "; passage numbering in this sample is provisional" : ""}.</p>
      </footer>
    </main>
    <div class="rd-actions" id="rd-actions" hidden>
      <span class="rd-actions-ref" id="rd-actions-ref"></span>
      <button data-rd-act="bookmark">${icon("bookmark")}<span>Bookmark</span></button>
      <button data-rd-act="cite">${icon("quote")}<span>Copy citation</span></button>
      <button data-rd-act="notes" id="rd-act-notes">${icon("notes")}<span>Notes</span></button>
      <button data-rd-act="clear" aria-label="Clear selection">${icon("close")}</button>
    </div>
  </div>`;
}

// ---------- Behaviour ----------
function rdEl() { return document.getElementById("rd"); }

function rdSetPanel(name, open) {
  const rd = rdEl();
  if (!rd) return;
  const narrow = window.innerWidth < 1200;
  rdUI[name] = open ?? !rdUI[name];
  // Wide screens keep both side panels open beside the text; narrow screens show one at a time.
  if (rdUI[name]) for (const k of ["toc", "notes", "settings"]) if (k !== name && (narrow || k === "settings" || name === "settings")) rdUI[k] = false;
  rd.querySelector("#rd-toc").classList.toggle("open", rdUI.toc);
  rd.querySelector("#rd-notes").classList.toggle("open", rdUI.notes);
  rd.querySelector("#rd-settings").classList.toggle("open", rdUI.settings);
  rd.querySelector(".rd-scrim").classList.toggle("show", rdUI.settings || (narrow && (rdUI.toc || rdUI.notes)));
  rd.querySelectorAll("[data-rd]").forEach((b) => b.classList.toggle("on", Boolean(rdUI[b.dataset.rd])));
}

function rdApplyPrefs(p) {
  store.set("rd.prefs", p);
  const rd = rdEl();
  rd.dataset.theme = p.theme;
  rd.style.setProperty("--rd-size", p.size + "px");
  rd.style.setProperty("--rd-leading", RD_LEADING[p.leading]);
  document.body.classList.toggle("reading-dark", p.theme === "dark");
  rd.querySelector("#rd-size-out").textContent = p.size;
  rd.querySelectorAll("[data-rd-leading]").forEach((b) => b.classList.toggle("on", b.dataset.rdLeading === p.leading));
  rd.querySelectorAll("[data-rd-theme]").forEach((b) => b.classList.toggle("on", b.dataset.rdTheme === p.theme));
}

function rdSelect(ref) {
  const rd = rdEl();
  rd.querySelectorAll(".psg.sel").forEach((x) => x.classList.remove("sel"));
  rdUI.sel = ref;
  const bar = rd.querySelector("#rd-actions");
  if (!ref) { bar.hidden = true; return; }
  const el = document.getElementById(ref);
  el?.classList.add("sel");
  const [, ch, n] = ref.split(".");
  const f = findWork(rd.dataset.work);
  rd.querySelector("#rd-actions-ref").textContent = `${f.work.title} ${ch}.${n}`;
  rd.querySelector("#rd-act-notes").hidden = !(f.work.notes || {})[ref];
  const bm = bar.querySelector('[data-rd-act="bookmark"]');
  bm.classList.toggle("on", rdIsMarked(ref));
  bm.querySelector("span").textContent = rdIsMarked(ref) ? "Bookmarked" : "Bookmark";
  bar.hidden = false;
}

function rdCitation(ref) {
  const rd = rdEl();
  const [, ch, n] = ref.split(".");
  const f = findWork(rd.dataset.work);
  const tr = readerText(f.work.text || rd.dataset.work).translations[rd.dataset.tr];
  const url = location.href.split("#")[0] + readHref(rd.dataset.work, ch, n);
  return `${f.work.title} ${ch}.${n}, trans. ${tr.label}${tr.detail ? ` (${tr.detail})` : ""}. Scriptorias, ${url}`;
}

// Progress: a thin bar for the current section, a resume position, and sections read.
let rdTick = false;
function rdOnScroll() {
  if (rdTick) return;
  rdTick = true;
  requestAnimationFrame(() => {
    rdTick = false;
    const rd = rdEl();
    if (!rd) return;
    const text = rd.querySelector(".rd-text");
    const r = text.getBoundingClientRect();
    const span = r.height - window.innerHeight * 0.6;
    const pct = Math.max(0, Math.min(1, span > 0 ? -r.top / span : 1));
    rd.querySelector("#rd-progress").style.width = (pct * 100).toFixed(1) + "%";
    const work = rd.dataset.work, ch = Number(rd.dataset.ch);
    const top = [...rd.querySelectorAll(".psg")].find((p) => p.getBoundingClientRect().bottom > 90);
    store.set("rd.pos." + work, { ch, ref: top?.dataset.ref || null });
    if (pct > 0.92) {
      const done = store.get("rd.done." + work, []);
      if (!done.includes(ch)) store.set("rd.done." + work, [...done, ch]);
    }
  });
}
window.addEventListener("scroll", rdOnScroll, { passive: true });

// Called by the router after the reader renders.
function mountReader() {
  const rd = rdEl();
  if (!rd) return;
  document.body.classList.toggle("reading-dark", rd.dataset.theme === "dark");
  const saved = store.get("rd.pos." + rd.dataset.work, null);
  const target = rdUI.sel ? document.getElementById(rdUI.sel) : saved?.ch === Number(rd.dataset.ch) && saved.ref && !location.hash.match(/\/read\/\d+$/) ? document.getElementById(saved.ref) : null;
  if (rdUI.sel) { rdSelect(rdUI.sel); target?.scrollIntoView({ block: "center" }); }
  else if (target) target.scrollIntoView({ block: "start" });
  rdOnScroll();
}

document.addEventListener("click", (e) => {
  const rd = rdEl();
  const trLink = e.target.closest("[data-tr]");
  if (trLink && !rd) { const [w, k] = trLink.dataset.tr.split(":"); store.set("rd.tr." + w, k); return; }
  if (!rd) return;
  const t = e.target;
  const panel = t.closest("[data-rd]");
  if (panel) { rdSetPanel(panel.dataset.rd); return; }
  if (t.closest("[data-rd-close]")) { for (const k of ["settings", "toc", "notes"]) if (rdUI[k] && (k === "settings" || window.innerWidth < 1200)) rdSetPanel(k, false); return; }
  const tr = t.closest("[data-rd-tr]");
  if (tr) { store.set("rd.tr." + rd.dataset.work, tr.dataset.rdTr); route(); return; }

  const p = rdPrefs();
  const sz = t.closest("[data-rd-size]");
  if (sz) { const i = RD_SIZES.indexOf(p.size); p.size = RD_SIZES[Math.max(0, Math.min(RD_SIZES.length - 1, (i < 0 ? 3 : i) + Number(sz.dataset.rdSize)))]; rdApplyPrefs(p); return; }
  const ld = t.closest("[data-rd-leading]");
  if (ld) { p.leading = ld.dataset.rdLeading; rdApplyPrefs(p); return; }
  const th = t.closest("[data-rd-theme]");
  if (th) { p.theme = th.dataset.rdTheme; rdApplyPrefs(p); return; }

  const bm = t.closest("[data-rd-bookmark]");
  if (bm) {
    const on = rdToggleBookmark({ ref: bm.dataset.rdBookmark, work: rd.dataset.work, ch: Number(rd.dataset.ch), tr: rd.dataset.tr });
    bm.classList.toggle("on", on); bm.classList.toggle("marked", on);
    toast(on ? "Chapter bookmarked" : "Bookmark removed");
    return;
  }
  const nm = t.closest("[data-note-ref]");
  if (nm) { rdSelect(nm.dataset.noteRef); rdSetPanel("notes", true); rdFocusNote(nm.dataset.noteRef); return; }
  const pn = t.closest("[data-pn]");
  if (pn) { const ref = pn.closest(".psg").dataset.ref; rdSelect(rdUI.sel === ref ? null : ref); return; }

  const act = t.closest("[data-rd-act]");
  if (act && rdUI.sel) {
    const ref = rdUI.sel;
    if (act.dataset.rdAct === "clear") rdSelect(null);
    if (act.dataset.rdAct === "bookmark") {
      const [, ch, n] = ref.split(".");
      const on = rdToggleBookmark({ ref, work: rd.dataset.work, ch: Number(ch), n, tr: rd.dataset.tr });
      document.getElementById(ref)?.classList.toggle("marked", on);
      rdSelect(ref);
      toast(on ? "Passage bookmarked" : "Bookmark removed");
    }
    if (act.dataset.rdAct === "cite") navigator.clipboard?.writeText(rdCitation(ref)).then(() => toast("Citation copied"), () => toast("Copy failed"));
    if (act.dataset.rdAct === "notes") { rdSetPanel("notes", true); rdFocusNote(ref); }
  }
});

function rdFocusNote(ref) {
  const g = document.querySelector(`.rd-note-group[data-for="${CSS.escape(ref)}"]`);
  document.querySelectorAll(".rd-note-group.on").forEach((x) => x.classList.remove("on"));
  if (g) { g.classList.add("on"); g.scrollIntoView({ block: "nearest" }); }
}

document.addEventListener("keydown", (e) => {
  const rd = rdEl();
  if (!rd || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
  if (e.key === "Escape") { if (rdUI.sel) rdSelect(null); for (const k of ["toc", "notes", "settings"]) rdSetPanel(k, false); }
  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    const a = rd.querySelector(`.rd-pager [data-dir="${e.key === "ArrowRight" ? "next" : "prev"}"]`);
    if (a) location.hash = a.getAttribute("href");
  }
});
