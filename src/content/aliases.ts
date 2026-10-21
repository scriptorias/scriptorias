/**
 * Reference aliases (docs/EDITORIAL.md §7). When a division is corrected, the superseded ref
 * maps to its replacement in `work.refAliases`, so old bookmarks, links and citations still
 * resolve. Exact refs only, one step (the validator forbids chains).
 */
export type AliasMap = Record<string, string>;

export function resolveAlias(aliases: AliasMap | undefined, ref: string): string {
  return aliases?.[ref] ?? ref;
}

/** Section number of a ref ("didache.1.6" → 1). */
export const sectionOf = (ref: string) => Number(ref.split(".")[1]);
