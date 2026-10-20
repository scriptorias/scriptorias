# Architecture decisions

## 1. Content as JSON in the repository, validated by Zod
Content is reviewed like code: diffs, history, pull requests, CI. Zod schemas double as
TypeScript types for the app. A database can be introduced later for user data without moving
the library content; if editorial tooling outgrows files, the same schemas can validate a CMS
export.

## 2. Collection membership lives on the collection
Works never name their collections. This lets one work sit in several collections and canons
without duplication, and keeps canon lists (which differ by tradition) in one place each.

## 3. Canonical references follow the work's citation system
Refs (`didache.1.2`) are defined by the work's `refScheme`, not by any translation. Translations
keep their own segmentation and map to refs through `alignment.json`, which has its own
verification status. Unaligned text still works: references resolve to the section, with a
translation-local anchor for precise scrolling. This is what makes side-by-side translations,
cross-translation bookmarks, and stable citations possible.
*Status:* the Didache chapter 1 verse divisions and alignment were cross-checked against Lake
(1912) and the Greek text with no discrepancies (docs/REFERENCES.md). They stay `proposed` until
an editor signs them off against a modern critical edition. Chapters 2–3 are not aligned yet.

## 4. Deterministic importers from committed raw snapshots
Every text is regenerated from a snapshot in `content/_raw` by a named importer. CI fails if the
committed text differs from importer output, so hand edits to generated text are impossible to
miss and imports are reproducible.

## 5. React + TypeScript + Vite, client-rendered, history routing
Matches the requested stack and Capacitor's needs (static output). The prototype's markup and
CSS class names were kept so the visual identity carries over unchanged.

## 6. Indexable public pages: build-time prerendering (planned, not yet implemented)
Collection and work overview pages should be prerendered to static HTML at build time (render the
same React components with a static router for each collection/work/pathway path, write
`dist/<path>/index.html`, hydrate on load). Reader pages can stay client-rendered or be prerendered
per chapter later. Until then, pages are indexable only by crawlers that run JavaScript, and
per-page titles are set client-side. This is the main remaining step for SEO.

## 7. Search stays client-side for now
Search scans the catalog and all loaded texts. Fine for the sample library; before large imports
replace it with a build-time index (e.g. MiniSearch or Pagefind) with ranking and archaic-spelling
normalization.

## 8. Storage behind an adapter, versioned
All persistence goes through `src/lib/storage.ts` with a `sc.schema` version and one-time
migrations, so future changes (or a move to Capacitor Preferences / a synced backend) don't lose
readers' data.
