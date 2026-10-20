/**
 * One-time migration of the prototype catalog (data/library.js) into /content.
 * Kept for the record; /content is the source of truth after this runs.
 *
 *   npx tsx scripts/legacy/migrate-prototype.ts
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "../..");
const out = (p: string, data: unknown) => {
  const file = path.join(root, "content", p);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
};

const sandbox: any = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "data/library.js"), "utf8"), sandbox);
const L = sandbox.window.LIBRARY;
const SAMPLE = { status: "sample" as const, note: "Prototype sample content; not yet verified." };

// Traditions
out("traditions.json", L.traditions.map((t: any, i: number) => ({
  id: t.id, name: t.name, icon: t.icon, status: t.live ? "live" : "planned", order: i + 1,
  facets: t.id === "christianity" ? L.christianity.facets : [],
})));

// Biblical Canon groups become their own (unlisted) group collections.
const GROUP_IDS = new Set(["torah", "historical-books", "wisdom-poetry", "prophets", "gospels-acts", "epistles", "revelation"]);

L.christianity.collections.forEach((c: any, i: number) => {
  const members = c.works.map((w: any) => (GROUP_IDS.has(w.id) ? { collection: w.id } : { work: w.id }));
  out(`collections/${c.id}.json`, {
    id: c.id, tradition: "christianity", kind: "collection", title: c.title, blurb: c.blurb,
    ...(c.intro ? { intro: c.intro } : {}),
    ...(c.count === "Multiple Canons" ? { countLabel: "Multiple Canons" } : {}),
    listed: true, order: i + 1, sample: Boolean(c.sample), members,
  });
  for (const w of c.works) {
    if (GROUP_IDS.has(w.id)) {
      out(`collections/${w.id}.json`, {
        id: w.id, tradition: "christianity", kind: "group", title: w.title, blurb: w.blurb,
        countLabel: (w.tags || []).find((t: string) => /book/.test(t)), listed: false, members: [],
      });
      continue;
    }
    const work: any = { id: w.id, title: w.title, tradition: "christianity", blurb: w.blurb };
    if (w.author) work.author = w.author;
    if (w.date) work.date = w.date;
    if (w.parts) { work.parts = w.parts.map((p: any) => p.id); work.partLabel = w.partLabel; }
    out(`works/${w.id}/work.json`, work);
    for (const p of w.parts || []) {
      out(`works/${p.id}/work.json`, {
        id: p.id, title: p.title, tradition: "christianity", partOf: w.id,
        blurb: `${p.title}, one of the seven letters of Ignatius of Antioch.`,
      });
    }
  }
});

// Canon collections: unlisted, membership limited to works already in the catalog.
const canonNote = { status: "unverified" as const, note: "Membership limited to works already in the catalog; full canon lists pending." };
const deutero = ["tobit", "judith", "additions-esther", "wisdom-solomon", "sirach", "baruch", "1-maccabees", "2-maccabees", "additions-daniel"];
out("collections/catholic-canon.json", { id: "catholic-canon", tradition: "christianity", kind: "canon", title: "Catholic Canon", blurb: "The biblical canon of the Catholic Church.", listed: false, verification: canonNote, members: deutero.map((work) => ({ work })) });
out("collections/orthodox-canon.json", { id: "orthodox-canon", tradition: "christianity", kind: "canon", title: "Eastern Orthodox Canon", blurb: "The biblical canon of the Eastern Orthodox churches.", listed: false, verification: canonNote, members: [...deutero, "prayer-manasseh"].map((work) => ({ work })) });
out("collections/ethiopian-canon.json", { id: "ethiopian-canon", tradition: "christianity", kind: "canon", title: "Ethiopian Orthodox Canon", blurb: "The broader biblical canon of the Ethiopian Orthodox Tewahedo Church.", listed: false, verification: canonNote, members: ["1-enoch", "jubilees", ...deutero].map((work) => ({ work })) });

// Pathways reference canonical refs instead of reader URLs.
for (const p of L.paths) {
  out(`pathways/${p.id}.json`, {
    id: p.id, title: p.title, blurb: p.blurb, sample: true,
    steps: p.steps.map((s: any) => ({
      title: s.title, note: s.note,
      target: s.work ? { work: s.work, ...(s.ch ? { ref: `${s.work}.${s.ch}${s.v ? "." + s.v : ""}` } : {}) } : { label: s.title },
    })),
  });
}

// Overviews, manuscripts, connections, notes.
const range = (r: string) => { const [a, b] = r.split(/[–-]/).map(Number); return { from: a, to: b || a }; };
for (const [id, w] of Object.entries<any>(L.works)) {
  out(`works/${id}/overview.json`, {
    work: id, verification: SAMPLE,
    ...(w.aka ? { aka: w.aka } : {}),
    ...(w.intro ? { intro: w.intro } : {}),
    facts: w.facts.map((f: any) => ({ label: f.label, value: f.value, basis: f.basis, sources: [] })),
    background: w.background.map((p: any) => ({ kind: p.kind, text: p.text, sources: [] })),
    structure: (w.structure || []).map(([r, title]: [string, string]) => ({ ...range(r), title })),
    sourceGroups: (w.sources?.groups || []).map((g: any) => ({ title: g.title, sources: [] })),
  });
  if (w.manuscripts) out(`works/${id}/manuscripts.json`, w.manuscripts.map((m: any) => ({
    id: m.id, work: id, name: m.name, date: m.date, note: m.note, contents: [], images: [], sources: [], verification: SAMPLE,
  })));
  if (w.connections) out(`works/${id}/connections.json`, w.connections.map((c: any) => ({
    from: { work: id }, to: c.work ? { work: c.work } : { label: c.title }, rel: c.rel,
    ...(c.work ? { inverse: c.rel } : {}), note: c.note, disputed: Boolean(c.disputed), sources: [], verification: SAMPLE,
  })));
}
console.log("migrated catalog into content/");
