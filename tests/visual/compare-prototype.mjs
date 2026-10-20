import { chromium } from "playwright";
import fs from "node:fs";
// Usage: serve the prototype (git worktree add /tmp/proto prototype-v1; python3 -m http.server 8767 in it),
// run `npx vite preview`, then: node tests/visual/compare-prototype.mjs [outDir]
const OLD = process.env.OLD ?? "http://localhost:8767/", NEW = process.env.NEW ?? "http://localhost:4173";
const OUT = process.argv[2] ?? "visual-diff";
const D = [1440, 960], M = [390, 844];
const pages = [
  ["library", D, "#/", "/"],
  ["collection", D, "#/c/early-christian", "/collections/early-christian"],
  ["overview", D, "#/w/didache", "/works/didache"],
  ["enoch-overview", D, "#/w/1-enoch", "/works/1-enoch"],
  ["reader-ch2", D, "#/w/didache/read/2", "/works/didache/read/2"],
  ["reader-ch1", D, "#/w/didache/read/1", "/works/didache/read/1"],
  ["reader-panels", D, "#/w/didache/read/2", "/works/didache/read/2", "panels"],
  ["reader-dark", D, "#/w/didache/read/2", "/works/didache/read/2", "dark"],
  ["enoch-reader", D, "#/w/1-enoch/read/5", "/works/1-enoch/read/5"],
  ["home", D, "#/home", "/home"],
  ["pathways", D, "#/paths", "/pathways"],
  ["pathway", D, "#/path/the-watchers", "/pathways/the-watchers"],
  ["search", D, "#/search/hermon", "/search?q=hermon"],
  ["soon", D, "#/library/judaism", "/library/judaism"],
  ["m-library", M, "#/", "/"],
  ["m-collection", M, "#/c/early-christian", "/collections/early-christian"],
  ["m-overview", M, "#/w/didache", "/works/didache"],
  ["m-reader", M, "#/w/didache/read/2", "/works/didache/read/2"],
  ["m-reader-contents", M, "#/w/didache/read/2", "/works/didache/read/2", "toc"],
];
const b = await chromium.launch();
fs.mkdirSync(OUT, { recursive: true });
async function shot(url, [w, h], action, out) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(url); await p.waitForTimeout(1200);
  await p.evaluate(() => document.fonts.ready);
  if (action === "panels") { await p.click('[aria-label="Contents"]'); await p.click('[aria-label="Notes and connections"]'); }
  if (action === "toc") await p.click('.rd-tools [aria-label="Contents"]');
  if (action === "dark") { await p.click('[aria-label="Text settings"]'); await p.click('text=Dark'); await p.click('[aria-label="Text settings"]'); }
  await p.mouse.move(0, h - 1);
  await p.waitForTimeout(500);
  await p.screenshot({ path: out });
  await ctx.close();
}
const cmp = await b.newPage();
const rows = [];
for (const [name, vp, o, n, action] of pages) {
  const a = `${OUT}/${name}-old.png`, c = `${OUT}/${name}-new.png`;
  await shot(OLD + o, vp, action, a); await shot(NEW + n, vp, action, c);
  const res = await cmp.evaluate(async ([A, B]) => {
    const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
    const [ia, ib] = await Promise.all([load(A), load(B)]);
    const w = ia.width, h = ia.height, cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    const g = cv.getContext("2d"); g.drawImage(ia, 0, 0); const da = g.getImageData(0, 0, w, h).data;
    g.clearRect(0, 0, w, h); g.drawImage(ib, 0, 0); const db = g.getImageData(0, 0, w, h);
    let diff = 0, minY = h, maxY = 0;
    for (let i = 0; i < da.length; i += 4) {
      const d = Math.abs(da[i] - db.data[i]) + Math.abs(da[i + 1] - db.data[i + 1]) + Math.abs(da[i + 2] - db.data[i + 2]);
      if (d > 48) { diff++; const y = Math.floor(i / 4 / w); minY = Math.min(minY, y); maxY = Math.max(maxY, y); db.data[i] = 255; db.data[i + 1] = 0; db.data[i + 2] = 0; }
    }
    g.putImageData(db, 0, 0);
    return { pct: (100 * diff / (w * h)).toFixed(2), rows: diff ? `${minY}-${maxY}` : "", img: cv.toDataURL() };
  }, ["data:image/png;base64," + fs.readFileSync(a).toString("base64"), "data:image/png;base64," + fs.readFileSync(c).toString("base64")]);
  fs.writeFileSync(`${OUT}/${name}-diff.png`, Buffer.from(res.img.split(",")[1], "base64"));
  rows.push(`${name.padEnd(18)} ${res.pct.padStart(6)}%  rows ${res.rows}`);
}
console.log(rows.join("\n"));
await b.close();
