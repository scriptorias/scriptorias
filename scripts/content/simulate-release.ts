/**
 * Dry run of the Didache release data change (docs/releases/didache-release-steps.md). Copies
 * content/ to a temporary folder, applies exactly the documented field changes, and runs the
 * validator as a production build would. Nothing in content/ is modified.
 *
 *   npm run release:simulate -- text   text release: editions cleared, work status draft
 *   npm run release:simulate -- full   full publication under EDITORIAL.md §8 (status published)
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { CONTENT } from "./load.ts";

const mode = process.argv[2] === "full" ? "full" : "text";
const DATE = new Date().toISOString().slice(0, 10);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sc-release-"));
fs.cpSync(CONTENT, tmp, { recursive: true });
const edit = (file: string, f: (d: any) => void) => {
  const p = path.join(tmp, file);
  const d = JSON.parse(fs.readFileSync(p, "utf8"));
  f(d);
  fs.writeFileSync(p, JSON.stringify(d, null, 2));
};

/** The release fields, as listed in the release steps (keep the two in sync). */
for (const tr of ["lightfoot-1891-grc", "lightfoot-1891-en"]) {
  edit(`works/didache/translations/${tr}/translation.json`, (t) => {
    t.rights.siteTerms.status = "licensed";
    t.rights.siteTerms.basis = "(publisher's recorded source-reuse basis)";
    t.rights.decision = "cleared";
    t.rights.decidedBy = "publisher";
    t.rights.date = DATE;
    t.editorial.provenance = "confirmed";
  });
}
edit("works/didache/work.json", (w) => {
  w.publication = mode === "full" ? { status: "published", approvedBy: "publisher", date: DATE } : { status: "draft", date: DATE };
});

const r = spawnSync(process.execPath, ["--import", "tsx", path.join(import.meta.dirname, "validate.ts")], {
  env: { ...process.env, CONTENT_DIR: tmp, SCRIPTORIAS_TARGET: "production" }, encoding: "utf8",
});
fs.rmSync(tmp, { recursive: true, force: true });
process.stdout.write(r.stdout + r.stderr);
console.log(`${r.status === 0 ? "✓" : "✗"} simulated ${mode} release of the Didache (production build)`);
process.exit(r.status ?? 1);
