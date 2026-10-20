/**
 * Catalog: small records loaded with the app bundle (traditions, collections, work records,
 * translation records, connections, pathways). Larger content loads on demand (see loaders.ts).
 *
 * Content is validated at build time (`npm run content:check`), so it is not re-parsed here.
 * Defaults declared in the schema are applied defensively where they matter.
 */
import type { Collection, Connection, Pathway, Target, Tradition, Translation, Work } from "./schema";
import traditionsJson from "../../content/traditions.json";

const glob = <T,>(mods: Record<string, unknown>) => Object.values(mods) as T[];

const TRADITIONS = (traditionsJson as Tradition[]).slice().sort((a, b) => a.order - b.order);
const COLLECTIONS = glob<Collection>(import.meta.glob("/content/collections/*.json", { eager: true, import: "default" }));
const WORKS = glob<Work>(import.meta.glob("/content/works/*/work.json", { eager: true, import: "default" }));
const TRANSLATIONS = glob<Translation>(import.meta.glob("/content/works/*/translations/*/translation.json", { eager: true, import: "default" }));
const CONNECTIONS = glob<Connection[]>(import.meta.glob("/content/works/*/connections.json", { eager: true, import: "default" })).flat();
const PATHWAYS = glob<Pathway>(import.meta.glob("/content/pathways/*.json", { eager: true, import: "default" }));

const workById = new Map(WORKS.map((w) => [w.id, w]));
const collectionById = new Map(COLLECTIONS.map((c) => [c.id, c]));

export const traditions = () => TRADITIONS;
export const tradition = (id: string) => TRADITIONS.find((t) => t.id === id);
export const work = (id: string) => workById.get(id);
export const collection = (id: string) => collectionById.get(id);
export const pathways = () => PATHWAYS;
export const pathway = (id: string) => PATHWAYS.find((p) => p.id === id);
export const allWorks = () => WORKS;

/** Collections shown on a tradition's overview, in editorial order. */
export const listedCollections = (traditionId: string) =>
  COLLECTIONS.filter((c) => c.tradition === traditionId && c.listed !== false).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

export type Member = { kind: "work"; work: Work } | { kind: "collection"; collection: Collection };
export function members(c: Collection): Member[] {
  return c.members.flatMap((m): Member[] => {
    if ("work" in m) { const w = workById.get(m.work); return w ? [{ kind: "work", work: w }] : []; }
    const sub = collectionById.get(m.collection);
    return sub ? [{ kind: "collection", collection: sub }] : [];
  });
}
export const countLabel = (c: Collection) => c.countLabel ?? `${c.members.length} ${c.members.length === 1 ? "work" : "works"}`;

/** Every collection (including canons) that contains a work. */
export const collectionsFor = (workId: string) => COLLECTIONS.filter((c) => c.members.some((m) => "work" in m && m.work === workId));
/** Parent collection of a sub-collection (group), if any. */
export const parentCollection = (id: string) => COLLECTIONS.find((c) => c.members.some((m) => "collection" in m && m.collection === id));

/**
 * The collection a work is shown under (breadcrumbs, back links). Parts follow their parent;
 * otherwise the first listed collection wins, then any other.
 */
export function primaryCollection(w: Work): Collection | undefined {
  if (w.partOf) { const p = workById.get(w.partOf); return p ? primaryCollection(p) : undefined; }
  const all = collectionsFor(w.id).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  return all.find((c) => c.listed !== false) ?? all[0];
}

/** Translations and editions of a work: default first, then available, then planned. */
export const translationsFor = (workId: string) =>
  TRANSLATIONS.filter((t) => t.work === workId).sort(
    (a, b) => Number(Boolean(b.default)) - Number(Boolean(a.default)) || Number(b.status === "available") - Number(a.status === "available") || (a.year ?? 0) - (b.year ?? 0),
  );
export const availableTranslations = (workId: string) => translationsFor(workId).filter((t) => t.status === "available");
export const defaultTranslation = (workId: string) => availableTranslations(workId)[0];

/** Connections touching a work, from either end. Incoming ones use the inverse label. */
export function connectionsFor(workId: string): { rel: string; target: Target; note: string; disputed: boolean }[] {
  const out = CONNECTIONS.filter((c) => c.from.work === workId).map((c) => ({ rel: c.rel, target: c.to, note: c.note, disputed: Boolean(c.disputed) }));
  for (const c of CONNECTIONS) {
    if ("work" in c.to && c.to.work === workId && c.from.work !== workId && c.inverse) {
      out.push({ rel: c.inverse, target: { work: c.from.work, ...(c.from.ref ? { ref: c.from.ref } : {}) }, note: c.note, disputed: Boolean(c.disputed) });
    }
  }
  return out;
}
