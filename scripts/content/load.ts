/** Reads the /content tree for scripts (validation, import). */
import fs from "node:fs";
import path from "node:path";

export const CONTENT = path.resolve(import.meta.dirname, "../../content");

export const readJson = (file: string): unknown => JSON.parse(fs.readFileSync(file, "utf8"));
export const exists = (file: string) => fs.existsSync(file);
export const rel = (file: string) => path.relative(CONTENT, file);

export function listDirs(dir: string): string[] {
  return fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()
    : [];
}
export function listJson(dir: string): string[] {
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => path.join(dir, f)) : [];
}

/** Stable JSON output: two-space indent, trailing newline. */
export const stringify = (data: unknown) => JSON.stringify(data, null, 2) + "\n";
