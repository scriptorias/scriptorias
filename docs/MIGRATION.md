# Migrations

## Identifiers (prototype → content model v2)

The prototype keyed passages by the translation's own numbering (`didache.1.7` was Wikisource
segment 7 of Lightfoot's chapter 1). Canonical references now follow each work's citation system.

| Prototype ref | Meaning then | Now |
|---|---|---|
| `didache.<c>` | Didache chapter | `didache.<c>` (unchanged) |
| `didache.<c>.<n>` | Lightfoot/Wikisource segment n | anchor `lightfoot:<c>.<n>`; ref = aligned verse (chapter 1, proposed alignment) or `didache.<c>` |
| `1-enoch.<c>` | Enoch chapter | unchanged |
| `1-enoch.<c>.<v>` | Charles verse v | unchanged; sub-verses (`6a`, `b`) resolve to their parent verse, anchor kept |

Translation ids: Enoch's translation was `main`; it is now `charles`. Didache `lightfoot` is unchanged.

## Browser data (localStorage)

Keys keep the `sc.` prefix. On first load the app runs a one-time migration and records
`sc.schema = 2`:

- `sc.bookmarks`: `[{work, ch}]` and `[{ref, work, ch, n?, tr}]` entries become
  `{ref, work, ch, anchor?, tr?, at}` using the table above. No bookmarked passage is lost; a bookmark whose
  passage cannot be resolved falls back to its chapter. Verse-level results carry no anchor
  (the verse identifies the passage); several old bookmarks in the same verse merge into one,
  keeping the first.
- Known limitation: in 1 Enoch chapter 5 the prototype could not tell apart Charles' two sub-verses
  labelled `b` (after 6a and after 7a). Such bookmarks resolve to the first, verse 5.6.
- Regression tests: `tests/bookmark-migration.spec.ts` checks all 23 Didache chapter 1 segments
  against verses taken from the cross-check in docs/REFERENCES.md, and checks that each migrated
  bookmark opens on the originally bookmarked words.
- `sc.rd.pos.<work>`: `{ch, ref}` becomes `{ch, anchor}`.
- `sc.rd.tr.1-enoch`: `main` becomes `charles`.
- `sc.last`, `sc.rd.prefs`, `sc.rd.done.<work>`, `sc.sort`: unchanged.

## Retired translations (schema 3, 2026-10-21)

The Didache's Wikisource English (`lightfoot`, chapters 1–3) and the planned `lightfoot-greek` record
were retired for `lightfoot-1891-en` and `lightfoot-1891-grc` (`work.retiredTranslations`). On first
load the app records `sc.schema = 3`:

- `sc.rd.tr.<work>`: a retired id becomes its replacement.
- `sc.bookmarks`: `tr` becomes the replacement; anchors into the retired text (`lightfoot:2.3`) become
  the same passage in the replacement: a verse ref without anchor (chapter 1) or the chapter
  paragraph (`lightfoot-1891-en:2.1`). Bookmarks that now name the same passage merge (first kept).
- `sc.rd.pos.<work>`: anchors move the same way (verse refs to the replacement's first segment of
  that verse, e.g. `lightfoot:1.10` → verse 1.4 → `lightfoot-1891-en:1.1d`).
- Prototype data (schema 1) is resolved through the same map.
- Links: `?tr=lightfoot[&seg=…]`, `?tr=lightfoot-greek` and prototype `?n=` Didache links redirect to
  the same passage in the new editions. Tests: `tests/didache.spec.ts`, `tests/migration.spec.ts`,
  `tests/bookmark-migration.spec.ts`.

## URLs

Hash routes are replaced by clean paths. Old links keep working: on load, `#/…` is rewritten to
the matching path.

| Old | New |
|---|---|
| `#/` | `/` |
| `#/home` | `/home` |
| `#/library/<id>[/<tab>]` | `/library/<id>[/<tab>]` |
| `#/c/<id>` | `/collections/<id>` |
| `#/w/<id>` | `/works/<id>` |
| `#/w/<id>/read/<c>[/<n>]` | `/works/<id>/read/<c>[/<v>]` (Didache segment n → `?seg=<c>.<n>`) |
| `#/w/<id>/ms/<m>` | `/works/<id>/manuscripts/<m>` |
| `#/paths`, `#/path/<id>` | `/pathways`, `/pathways/<id>` |
| `#/search/<q>` | `/search?q=<q>` |
| `#/bookmarks`, `#/about`, … | `/bookmarks`, `/about`, … |
