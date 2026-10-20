/**
 * On-demand content. Each file becomes its own chunk, fetched the first time a page needs it.
 */
import type { Alignment, Manuscript, Note, Overview, Text } from "./schema";

type Loader<T> = () => Promise<T>;
const lazy = <T,>(mods: Record<string, unknown>) => mods as Record<string, Loader<T>>;

const OVERVIEWS = lazy<Overview>(import.meta.glob("/content/works/*/overview.json", { import: "default" }));
const MANUSCRIPTS = lazy<Manuscript[]>(import.meta.glob("/content/works/*/manuscripts.json", { import: "default" }));
const NOTES = lazy<Note[]>(import.meta.glob("/content/works/*/notes.json", { import: "default" }));
const TEXTS = lazy<Text>(import.meta.glob("/content/works/*/translations/*/text.json", { import: "default" }));
const ALIGNMENTS = lazy<Alignment>(import.meta.glob("/content/works/*/translations/*/alignment.json", { import: "default" }));

const cache = new Map<string, Promise<unknown>>();
function load<T>(table: Record<string, Loader<T>>, key: string, fallback: T): Promise<T> {
  if (!cache.has(key)) cache.set(key, table[key] ? table[key]() : Promise.resolve(fallback));
  return cache.get(key) as Promise<T>;
}

const w = (id: string, file: string) => `/content/works/${id}/${file}`;
const t = (id: string, tr: string, file: string) => `/content/works/${id}/translations/${tr}/${file}`;

export const loadOverview = (id: string) => load<Overview | null>(OVERVIEWS, w(id, "overview.json"), null);
export const loadManuscripts = (id: string) => load<Manuscript[]>(MANUSCRIPTS, w(id, "manuscripts.json"), []);
export const loadNotes = (id: string) => load<Note[]>(NOTES, w(id, "notes.json"), []);
export const loadText = (id: string, tr: string) => load<Text | null>(TEXTS, t(id, tr, "text.json"), null);
export const loadAlignment = (id: string, tr: string) => load<Alignment | null>(ALIGNMENTS, t(id, tr, "alignment.json"), null);
export const hasText = (id: string, tr: string) => Boolean(TEXTS[t(id, tr, "text.json")]);
/** Every work/translation pair with text (used by search until a build-time index exists). */
export const textKeys = () =>
  Object.keys(TEXTS).map((k) => { const m = k.match(/works\/([^/]+)\/translations\/([^/]+)\//)!; return { work: m[1], tr: m[2] }; });
