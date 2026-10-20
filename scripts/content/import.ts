/**
 * Re-runs every translation importer from its committed raw snapshot.
 *
 *   npm run content:import            write text.json (and generated alignment.json)
 *   npm run content:import -- --check fail if committed files differ from importer output
 */
import fs from "node:fs";
import path from "node:path";
import { Translation } from "../../src/content/schema.ts";
import { IMPORTERS } from "./importers.ts";
import { CONTENT, listDirs, readJson, rel, stringify } from "./load.ts";

const check = process.argv.includes("--check");
let drift = 0, count = 0;

for (const work of listDirs(path.join(CONTENT, "works"))) {
  for (const id of listDirs(path.join(CONTENT, "works", work, "translations"))) {
    const dir = path.join(CONTENT, "works", work, "translations", id);
    const tr = Translation.parse(readJson(path.join(dir, "translation.json")));
    if (!tr.importer) continue;
    const importer = IMPORTERS[tr.importer.name];
    if (!importer) throw new Error(`${rel(dir)}: unknown importer "${tr.importer.name}"`);
    const result = importer(tr, path.join(CONTENT, tr.importer.raw));
    const outputs: [string, unknown][] = [["text.json", result.text]];
    if (result.alignment) outputs.push(["alignment.json", result.alignment]);
    for (const [name, data] of outputs) {
      const file = path.join(dir, name);
      const next = stringify(data);
      const prev = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
      if (check) {
        if (prev !== next) { drift++; console.error(`✗ ${rel(file)} differs from importer output`); }
      } else if (prev !== next) {
        fs.writeFileSync(file, next);
        console.log(`wrote ${rel(file)}`);
      }
    }
    count++;
  }
}
if (check && drift) { console.error(`${drift} file(s) out of date. Run: npm run content:import`); process.exit(1); }
console.log(`${check ? "checked" : "imported"} ${count} translation(s)`);
