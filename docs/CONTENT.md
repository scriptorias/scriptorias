# Content architecture

All library content lives as version-controlled JSON under `content/`. Each file is validated
against the schemas in `src/content/schema.ts` (zod), which are also the app's types.

```
content/
  traditions.json                     Traditions / religious libraries
  collections/<id>.json               Collections, canons, and groups (membership lives here)
  works/<id>/work.json                Catalog record (always loaded): title, blurb, author, date, refScheme
  works/<id>/overview.json            Historical overview (loaded on demand)
  works/<id>/manuscripts.json         Manuscript records
  works/<id>/connections.json         Connections from this work to works, passages, or labels
  works/<id>/notes.json               Reader notes on canonical references
  works/<id>/translations/<tid>/translation.json   Edition/translation record with provenance
  works/<id>/translations/<tid>/text.json          Generated text (sections → segments)
  works/<id>/translations/<tid>/alignment.json     Segment → canonical reference map
  sources.json                        Bibliographic sources (referenced by id from any claim)
  pathways/<id>.json                  Curated pathways (point at works and refs; never copy text)
  _raw/                               Raw source snapshots used by importers
```

## Relationships

- **Tradition → Collection.** Every collection belongs to one tradition. `kind` is `collection`
  (browsable), `canon` (a tradition's scriptural canon), or `group` (a sub-collection such as
  "The Torah" inside Biblical Canon). `listed: false` keeps a collection off the overview page.
- **Collection → Work (many-to-many).** Membership is stored on the collection, so a work exists
  once and can appear in any number of collections and canons. Example: Tobit is a member of
  `deuterocanonical`, `catholic-canon`, `orthodox-canon`, and `ethiopian-canon`.
- **Work → parts.** Grouped works (Letters of Ignatius) list `parts`; each part is its own work with
  `partOf`, so letters can be read, bookmarked, and cited individually.
- **Work → Translation/Edition (one-to-many).** Translations are separate records under the work.
  `status: planned` editions have no text yet. Exactly one available translation is the default.
- **Translation → Text → Segments.** Text is split into sections (chapters) and segments. Segment
  ids (`"1.7"`) are local to that translation and follow its source's numbering.
- **Alignment.** Maps translation segments to canonical references. Unaligned segments are anchored
  at section level only.
- **Notes, connections, pathways, manuscripts** point at canonical references, never at segments.
- **Claims → Sources.** Facts, background paragraphs, manuscripts, connections, and notes carry
  `sources` (citations: a source id or `{ source, locator }`) and an `editorial` block (content
  kind, transcription, provenance, claim review, and review entries; see `docs/EDITORIAL.md`).
  `basis` (`established`/`disputed`/`unknown`) and `kind` (`fact`/`interpretation`) describe the
  claim; `editorial` describes what we have checked and who checked it.

## Canonical references

A canonical reference follows the work's own citation system (`refScheme`), never a
translation's segmentation:

- `didache.1` is chapter 1, and `didache.1.2` is chapter 1, verse 2.
- `1-enoch.6.7` is chapter 6, verse 7, using R. H. Charles' numbering.

Bookmarks, citations, notes, connections, and pathway steps use these references, so they keep working
when a new translation with different paragraphing is added. A translation that is not yet
aligned at verse level is still readable; references to it resolve at chapter level, and the
reader keeps a translation-local anchor (`lightfoot:1.7`) for precise scrolling.

## Provenance and licensing

Every translation records `license`, `attribution`, `source` (label, URL, retrieval date),
`importer` (name, raw snapshot, sections), `coverage`, `edition` (source and pages),
`transcriptionPolicy`, `version`, layered `rights`, and `editorial`. Wikisource
transcriptions are CC BY-SA 4.0 even when the underlying text is public domain; the attribution
string says so and is shown in the reader colophon. Each raw snapshot folder has a `NOTICE.md`.
Rights layers and decisions are described in `docs/EDITORIAL.md` §5.

## Workflow

```
npm run content:import          # regenerate text.json (and generated alignments) from content/_raw
npm run content:import -- --check   # fail if committed text differs from importer output
npm run content:validate        # schema + cross-reference checks
npm run content:check           # both; runs in CI
npm run test:content            # validator rule tests; runs in CI
```

Adding a text:

1. Save the raw source under `content/_raw/<source>/…` (never edit it by hand) with a `NOTICE.md`.
2. Add the edition to `content/sources.json`, then create `translation.json` with provenance,
   `edition`, `importer`, `coverage`, `rights`, and `editorial` (`transcription: "unchecked"`).
3. Run `npm run content:import`, then review the generated `text.json`.
4. Add or review `alignment.json` (segment → canonical refs); record any check as a review entry.
5. Run `npm run content:check`; fix every error. Warnings flag references no reader can reach yet.

Importers live in `scripts/content/importers.ts`. They are deterministic: the same snapshot always
produces byte-identical output, which CI checks.

## Scale notes

`work.json` files are small and loaded eagerly for the catalog; overviews, texts, alignments,
manuscripts and notes load on demand per work. At a few thousand works the eager catalog should
move to a generated index file (one request) and search to a build-time index.
