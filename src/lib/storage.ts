/**
 * Persistent browser storage. All keys are prefixed "sc." (unchanged from the prototype, so
 * existing readers keep their data). Kept behind this module so a native store (e.g. Capacitor
 * Preferences or SQLite) can replace localStorage without touching callers.
 */
const PREFIX = "sc.";

export const store = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* storage full or unavailable */ }
  },
  remove(key: string) { localStorage.removeItem(PREFIX + key); },
  keys(): string[] {
    return Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).map((k) => k.slice(PREFIX.length));
  },
};

// ---------- Typed records ----------

export interface Bookmark {
  /** Canonical ref: verse-level when aligned, else section-level. */
  ref: string;
  work: string;
  ch: number;
  /** Translation-local anchor ("lightfoot:1.7") for passages without verse-level alignment. */
  anchor?: string;
  tr?: string;
  at: number;
}
export const bookmarkKey = (b: Pick<Bookmark, "ref" | "anchor">) => (b.anchor ? `${b.ref}@${b.anchor}` : b.ref);
export const getBookmarks = () => store.get<Bookmark[]>("bookmarks", []);
export function toggleBookmark(b: Omit<Bookmark, "at">): boolean {
  const all = getBookmarks();
  const key = bookmarkKey(b);
  const had = all.some((x) => bookmarkKey(x) === key);
  store.set("bookmarks", had ? all.filter((x) => bookmarkKey(x) !== key) : [...all, { ...b, at: Date.now() }]);
  return !had;
}

export interface ReaderPrefs { size: number; leading: "compact" | "comfortable" | "airy"; theme: "light" | "dark" }
export const getPrefs = (): ReaderPrefs => ({ size: 19, leading: "comfortable", theme: "light", ...store.get<Partial<ReaderPrefs>>("rd.prefs", {}) });
export const setPrefs = (p: ReaderPrefs) => store.set("rd.prefs", p);

export interface Position { ch: number; anchor?: string | null }
export interface LastRead { work: string; ch: number }
