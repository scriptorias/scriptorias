/**
 * One-time upgrades from the prototype (see docs/MIGRATION.md):
 * - hash URLs ("#/w/didache/read/1/7") → clean paths
 * - localStorage records keyed by translation numbering → canonical refs + anchors
 */
import { loadAlignment, loadText } from "../content/loaders";
import { AlignmentIndex, anchorOf, sectionRef } from "../content/refs";
import { bookmarkKey, store, type Bookmark } from "./storage";

export const STORAGE_VERSION = 2;

/** Prototype translation ids that were renamed. */
const RENAMED_TR: Record<string, Record<string, string>> = { "1-enoch": { main: "charles" } };
const DEFAULT_TR: Record<string, string> = { didache: "lightfoot", "1-enoch": "charles" };

/** Maps a prototype hash route to a clean path, or null if the hash is not a legacy route. */
export function legacyHashToPath(hash: string): string | null {
  if (!hash.startsWith("#/")) return null;
  const parts = hash.slice(2).split("/").map(decodeURIComponent);
  const [r, a, b, c, d] = parts;
  const enc = encodeURIComponent;
  switch (r) {
    case "": case undefined: return "/";
    case "c": return `/collections/${enc(a)}`;
    case "w":
      if (b === "read") return `/works/${enc(a)}/read${c ? `/${enc(c)}` : ""}${d ? (/^\d+$/.test(d) && a !== "didache" ? `/${enc(d)}` : `?n=${enc(d)}`) : ""}`;
      if (b === "ms") return `/works/${enc(a)}/manuscripts/${enc(c)}`;
      return `/works/${enc(a)}`;
    case "path": return `/pathways/${enc(a)}`;
    case "paths": return "/pathways";
    case "search": return a ? `/search?q=${enc(a)}` : "/search";
    default: return "/" + parts.filter(Boolean).map(enc).join("/");
  }
}

interface LegacyBookmark { ref?: string; work: string; ch: number; n?: string; tr?: string; at?: number; anchor?: string }

/** Resolves a prototype passage (work, chapter, source label n) to a canonical ref + anchor. */
async function resolvePassage(work: string, ch: number, n: string, tr: string) {
  const [text, alignment] = await Promise.all([loadText(work, tr), loadAlignment(work, tr)]);
  const seg = text?.sections.find((s) => s.n === ch)?.segments.find((s) => s.n === n);
  if (!seg) return { ref: sectionRef(work, ch) };
  const idx = new AlignmentIndex(work, text, alignment);
  const ref = idx.refOf(seg.id);
  // Verse-level refs identify the passage on their own; section-level ones keep a precise anchor.
  return idx.isAligned(seg.id) ? { ref, tr } : { ref, anchor: anchorOf(tr, seg.id), tr };
}

export async function migrateStorage() {
  if (store.get("schema", 1) >= STORAGE_VERSION) return;

  // Translation preferences
  for (const [work, map] of Object.entries(RENAMED_TR)) {
    const cur = store.get<string | null>(`rd.tr.${work}`, null);
    if (cur && map[cur]) store.set(`rd.tr.${work}`, map[cur]);
  }

  // Bookmarks
  const old = store.get<LegacyBookmark[]>("bookmarks", []);
  const next: Bookmark[] = [];
  for (const b of old) {
    if (!b?.work || !b.ch) continue;
    const tr = RENAMED_TR[b.work]?.[b.tr ?? ""] ?? b.tr ?? DEFAULT_TR[b.work];
    const n = b.n ?? (b.ref && b.ref.split(".").length === 3 ? b.ref.split(".")[2] : undefined);
    if (!n || !tr) { next.push({ ref: sectionRef(b.work, b.ch), work: b.work, ch: b.ch, at: b.at ?? 0 }); continue; }
    try {
      const r = await resolvePassage(b.work, b.ch, n, tr);
      next.push({ ...r, work: b.work, ch: b.ch, at: b.at ?? 0 });
    } catch {
      next.push({ ref: sectionRef(b.work, b.ch), work: b.work, ch: b.ch, at: b.at ?? 0 });
    }
  }
  // Several prototype segments can fall in one verse; keep one bookmark per passage (the first).
  const seen = new Set<string>();
  store.set("bookmarks", next.filter((b) => { const k = bookmarkKey(b); if (seen.has(k)) return false; seen.add(k); return true; }));

  // Resume positions: {ch, ref} → {ch, anchor}
  for (const key of store.keys().filter((k) => k.startsWith("rd.pos."))) {
    const work = key.slice("rd.pos.".length);
    const pos = store.get<{ ch: number; ref?: string | null; anchor?: string | null } | null>(key, null);
    if (!pos || pos.anchor !== undefined) continue;
    const n = pos.ref?.split(".")[2];
    const tr = DEFAULT_TR[work];
    let anchor: string | null = null;
    if (n && tr) {
      try {
        const text = await loadText(work, tr);
        const seg = text?.sections.find((s) => s.n === pos.ch)?.segments.find((s) => s.n === n);
        anchor = seg ? anchorOf(tr, seg.id) : null;
      } catch { anchor = null; }
    }
    store.set(key, { ch: pos.ch, anchor });
  }

  store.set("schema", STORAGE_VERSION);
}
