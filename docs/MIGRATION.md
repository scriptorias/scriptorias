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
  `{ref, work, ch, anchor?, tr?, at}` using the table above. Nothing is dropped; a bookmark whose
  passage cannot be resolved falls back to its chapter.
- `sc.rd.pos.<work>`: `{ch, ref}` becomes `{ch, anchor}`.
- `sc.rd.tr.1-enoch`: `main` becomes `charles`.
- `sc.last`, `sc.rd.prefs`, `sc.rd.done.<work>`, `sc.sort`: unchanged.

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
