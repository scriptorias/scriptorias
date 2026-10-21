/**
 * One-time upgrades of browser data and old links (see docs/MIGRATION.md):
 * - hash URLs ("#/w/didache/read/1/7") → clean paths
 * - v2: localStorage records keyed by translation numbering → canonical refs + anchors
 * - v3: records naming a retired translation id (work.retiredTranslations) → its replacement
 */
import { resolveRetired, retiredTranslation } from "../content/catalog";
import { loadAlignment, loadText } from "../content/loaders";
import { AlignmentIndex, anchorOf, isVerseRef, parseAnchor, sectionRef } from "../content/refs";
import { bookmarkKey, store, type Bookmark } from "./storage";

export const STORAGE_VERSION = 3;

/** Prototype translation ids that were renamed. */
const RENAMED_TR: Record<string, Record<string, string>> = { "1-enoch": { main: "charles" } };
/** The translation whose numbering prototype links and records used (`n`, `?n=`). */
const PROTOTYPE_TR: Record<string, string> = { didache: "lightfoot", "1-enoch": "charles" };
export const prototypeTranslation = (work: string) => PROTOTYPE_TR[work];

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

/**
 * A passage of a retired translation as {ref, anchor?, tr} in its replacement: verse refs need
 * no anchor; chapter refs keep the replacement's segment as the anchor.
 */
function fromRetired(work: string, tr: string, seg: string): { ref: string; anchor?: string; tr: string } | null {
  const r = resolveRetired(work, tr, seg);
  if (!r) return null;
  return isVerseRef(r.ref) || !r.seg ? { ref: r.ref, tr: r.tr } : { ref: r.ref, anchor: anchorOf(r.tr, r.seg), tr: r.tr };
}

/** Segment anchor in `tr` for a ref (first aligned segment), for resume positions. */
async function anchorFor(work: string, tr: string, ref: string, anchor?: string) {
  if (anchor) return anchor;
  if (!isVerseRef(ref)) return null;
  const [text, alignment] = await Promise.all([loadText(work, tr), loadAlignment(work, tr)]);
  const seg = new AlignmentIndex(work, text, alignment).segsOf(ref)[0];
  return seg ? anchorOf(tr, seg) : null;
}

interface LegacyBookmark { ref?: string; work: string; ch: number; n?: string; tr?: string; at?: number; anchor?: string }

/** Resolves a prototype passage (work, chapter, source label n) to a canonical ref + anchor. */
async function resolvePassage(work: string, ch: number, n: string, tr: string): Promise<{ ref: string; anchor?: string; tr?: string }> {
  const retired = fromRetired(work, tr, `${ch}.${n}`);
  if (retired) return retired;
  const [text, alignment] = await Promise.all([loadText(work, tr), loadAlignment(work, tr)]);
  const seg = text?.sections.find((s) => s.n === ch)?.segments.find((s) => s.n === n);
  if (!seg) return { ref: sectionRef(work, ch) };
  const idx = new AlignmentIndex(work, text, alignment);
  const ref = idx.refOf(seg.id);
  // Verse-level refs identify the passage on their own; section-level ones keep a precise anchor.
  return idx.isAligned(seg.id) ? { ref, tr } : { ref, anchor: anchorOf(tr, seg.id), tr };
}

/** Several old passages can fall in one verse or paragraph; keep one bookmark per passage (the first). */
function dedupe(bs: Bookmark[]) {
  const seen = new Set<string>();
  return bs.filter((b) => { const k = bookmarkKey(b); if (seen.has(k)) return false; seen.add(k); return true; });
}

/** v2: prototype records (translation numbering) → canonical refs and anchors. */
async function toV2() {
  for (const [work, map] of Object.entries(RENAMED_TR)) {
    const cur = store.get<string | null>(`rd.tr.${work}`, null);
    if (cur && map[cur]) store.set(`rd.tr.${work}`, map[cur]);
  }

  const old = store.get<LegacyBookmark[]>("bookmarks", []);
  const next: Bookmark[] = [];
  for (const b of old) {
    if (!b?.work || !b.ch) continue;
    const tr = RENAMED_TR[b.work]?.[b.tr ?? ""] ?? b.tr ?? PROTOTYPE_TR[b.work];
    const n = b.n ?? (b.ref && b.ref.split(".").length === 3 ? b.ref.split(".")[2] : undefined);
    if (!n || !tr) { next.push({ ref: sectionRef(b.work, b.ch), work: b.work, ch: b.ch, at: b.at ?? 0 }); continue; }
    try {
      const r = await resolvePassage(b.work, b.ch, n, tr);
      next.push({ ...r, work: b.work, ch: b.ch, at: b.at ?? 0 });
    } catch {
      next.push({ ref: sectionRef(b.work, b.ch), work: b.work, ch: b.ch, at: b.at ?? 0 });
    }
  }
  store.set("bookmarks", dedupe(next));

  // Resume positions: {ch, ref} → {ch, anchor}
  for (const key of store.keys().filter((k) => k.startsWith("rd.pos."))) {
    const work = key.slice("rd.pos.".length);
    const pos = store.get<{ ch: number; ref?: string | null; anchor?: string | null } | null>(key, null);
    if (!pos || pos.anchor !== undefined) continue;
    const n = pos.ref?.split(".")[2];
    const tr = PROTOTYPE_TR[work];
    let anchor: string | null = null;
    if (n && tr) {
      try {
        const r = await resolvePassage(work, pos.ch, n, tr);
        anchor = r.tr ? await anchorFor(work, r.tr, r.ref, r.anchor) : null;
      } catch { anchor = null; }
    }
    store.set(key, { ch: pos.ch, anchor });
  }
}

/** v3: records naming a retired translation id move to its replacement, at the same passage. */
async function toV3() {
  for (const key of store.keys().filter((k) => k.startsWith("rd.tr."))) {
    const work = key.slice("rd.tr.".length);
    const cur = store.get<string | null>(key, null);
    const r = cur ? retiredTranslation(work, cur) : undefined;
    if (r) store.set(key, r.replacedBy);
  }

  const bs = store.get<Bookmark[]>("bookmarks", []);
  store.set("bookmarks", dedupe(bs.map((b) => {
    const old = b.anchor ? parseAnchor(b.anchor) : null;
    const moved = old ? fromRetired(b.work, old.tr, old.seg) : null;
    if (moved) {
      const { anchor: _old, ...rest } = b;
      return { ...rest, ...moved, ch: Number(moved.ref.split(".")[1]) };
    }
    const r = b.tr ? retiredTranslation(b.work, b.tr) : undefined;
    return r ? { ...b, tr: r.replacedBy } : b;
  })));

  for (const key of store.keys().filter((k) => k.startsWith("rd.pos."))) {
    const work = key.slice("rd.pos.".length);
    const pos = store.get<{ ch: number; anchor?: string | null } | null>(key, null);
    const old = pos?.anchor ? parseAnchor(pos.anchor) : null;
    const moved = old ? fromRetired(work, old.tr, old.seg) : null;
    if (!pos || !moved) continue;
    let anchor: string | null = null;
    try { anchor = await anchorFor(work, moved.tr, moved.ref, moved.anchor); } catch { anchor = null; }
    store.set(key, { ch: Number(moved.ref.split(".")[1]), anchor });
  }
}

export async function migrateStorage() {
  const version = store.get("schema", 1);
  if (version >= STORAGE_VERSION) return;
  if (version < 2) await toV2();
  await toV3();
  store.set("schema", STORAGE_VERSION);
}
