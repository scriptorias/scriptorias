/** The reader's English/Greek choice for one book. Kept in sessionStorage and cleared when the reader
 *  leaves the book, so every book opens in its default (English) edition. */
const key = (work: string) => `sc.rd.tr.session.${work}`;
const ss = (): Storage | null => { try { return window.sessionStorage; } catch { return null; } };
export const trChoice = {
  get: (work: string): string | null => ss()?.getItem(key(work)) ?? null,
  set: (work: string, tr: string) => { ss()?.setItem(key(work), tr); },
  clear: (work: string) => { ss()?.removeItem(key(work)); },
  clearAll: () => { const s = ss(); if (!s) return; for (const k of Object.keys(s)) if (k.startsWith("sc.rd.tr.session.")) s.removeItem(k); },
};
