# Didache pre-release content audit

Date: 2026-10-21 · Branch `didache-import` (local only) · Audited by: Consuelo (assistant). Result:
**clean** — no private or rights-restricted material in the branch or the build.

## Method

1. Listed every file the branch adds, changes or deletes against `dev` (`git diff --stat dev`).
2. Listed every file in `dist/` after `npm run build` (and scanned `dist-alias-fixture/`).
3. Checked file names and types: no scan or crop images (jpg/png/tiff/pdf), no IA or HathiTrust OCR
   (OCR text or DjVu files), no HTML/terms snapshots, no reports, packet, rights or legal memos, no
   Bryennios transcription, no private folder names.
4. Marker scan (script kept outside the repository so the markers themselves are not published):
   - 439 content markers: up to four 32-character slices from each of 123 private files (reports,
     publication memos and editorial packet, transcription notes and briefs, Bryennios
     transcriptions and corrigenda, terms snapshots, scan records, the Lake 1912 check), excluding
     the six Lightfoot transcription files (whose text is expected) and any slice already present in
     the public repository or in those transcriptions;
   - 21 fixed sentinels: the names of the private working repository, the staging repository and
     its private content folder, report and memo file names, scan file-name prefixes, OCR and DjVu file extensions,
     staging banner text and report-only phrases;
   - every file scanned as raw text and in `\u`/JSON-escaped form, including source maps.
   - Positive control: all 439 markers were found in their own source files.

## Results

| Scope | Files | Hits |
|---|---|---|
| `dist/` + `dist-alias-fixture/` (all files incl. source maps) | 136 | **0** |
| Files added or modified on the branch vs `dev` (incl. this report) | 52 | **0** |

- Content added under `content/`: only the generated data of the two approved editions
  (`lightfoot-1891-grc`, `lightfoot-1891-en`: `text.json`, `refmap.json`, `alignment.json`,
  `translation.json`), their `revisions.json`, the Greek `corrections.json` (one proposed, unapplied
  correction), and SCRIPTORIAS editorial data (`questions.json`, `differences.json`).
  `translation.json` records the working-file commit, sizes and SHA-256 only; file names are bare
  (no paths).
- No page images are hosted or linked as images; provenance links to the Internet Archive item
  pages only (e2e test checks there are no image URLs).
- Wikisource: no Wikisource Didache text is in `dist/`. `dist/` still names Wikisource as a
  comparison source (bibliographic record) and contains 1 Enoch's Wikisource text with its own
  attribution. Decision on the remaining repository snapshots: `docs/DECISIONS.md` §9.
- The importer has no built-in path to the working files (`--from` or `$SCRIPTORIAS_TRANSCRIPTIONS`).

## Files changed vs `dev`

```
 .github/ISSUE_TEMPLATE/transcription-error.yml                         |   52 +++
 CHANGELOG.md                                                           |   17 +
 content/_raw/wikisource/didache-lightfoot/NOTICE.md                    |    4 +
 content/sources.json                                                   |   22 +-
 content/works/didache/differences.json                                 |  125 +++++++
 content/works/didache/questions.json                                   |  145 ++++++++
 content/works/didache/translations/lightfoot-1891-en/alignment.json    |   54 +++
 content/works/didache/translations/lightfoot-1891-en/refmap.json       |  677 +++++++++++++++++++++++++++++++++++
 content/works/didache/translations/lightfoot-1891-en/revisions.json    |   11 +
 content/works/didache/translations/lightfoot-1891-en/text.json         |  839 +++++++++++++++++++++++++++++++++++++++++++
 content/works/didache/translations/lightfoot-1891-en/translation.json  |  264 ++++++++++++++
 content/works/didache/translations/lightfoot-1891-grc/alignment.json   |  310 ++++++++++++++++
 content/works/didache/translations/lightfoot-1891-grc/corrections.json |   17 +
 content/works/didache/translations/lightfoot-1891-grc/refmap.json      | 2347 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 content/works/didache/translations/lightfoot-1891-grc/revisions.json   |   11 +
 content/works/didache/translations/lightfoot-1891-grc/text.json        | 1555 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 content/works/didache/translations/lightfoot-1891-grc/translation.json |  260 ++++++++++++++
 content/works/didache/translations/lightfoot-greek/translation.json    |   24 --
 content/works/didache/translations/lightfoot/alignment.json            |   97 -----
 content/works/didache/translations/lightfoot/text.json                 |  547 ----------------------------
 content/works/didache/translations/lightfoot/translation.json          |  118 ------
 content/works/didache/work.json                                        |  180 ++++++++++
 docs/CONTENT.md                                                        |    3 +
 docs/DECISIONS.md                                                      |   19 +
 docs/EDITORIAL.md                                                      |   21 +-
 docs/MIGRATION.md                                                      |   17 +
 docs/releases/didache-release-steps.md                                 |   84 +++++
 package.json                                                           |    6 +-
 scripts/content/import-lightfoot-1891.ts                               |  515 +++++++++++++++++++++++++++
 scripts/content/simulate-release.ts                                    |   47 +++
 scripts/content/transcription.ts                                       |  124 +++++++
 scripts/content/validate.ts                                            |   99 +++++-
 src/components/Icon.tsx                                                |    1 +
 src/components/Notice.tsx                                              |   26 ++
 src/content/catalog.ts                                                 |   14 +
 src/content/editions.ts                                                |   43 +++
 src/content/labels.ts                                                  |   12 +-
 src/content/loaders.ts                                                 |   10 +-
 src/content/notices.ts                                                 |   23 ++
 src/content/schema.ts                                                  |  125 ++++++-
 src/lib/migrate.ts                                                     |  100 +++++-
 src/reader/EditionPanel.tsx                                            |  180 ++++++++++
 src/reader/Reader.tsx                                                  |  108 +++++-
 src/styles/app.css                                                     |   47 ++-
 tests/aliases.spec.ts                                                  |    8 +-
 tests/bookmark-migration.spec.ts                                       |    9 +-
 tests/content/labels.test.ts                                           |   27 ++
 tests/content/lightfoot-1891.test.ts                                   |  100 ++++++
 tests/content/validate.test.ts                                         |   69 +++-
 tests/didache.spec.ts                                                  |  278 +++++++++++++++
 tests/editorial.spec.ts                                                |   13 +-
 tests/maintenance.spec.ts                                              |    7 +-
 tests/migration.spec.ts                                                |   11 +-
 tests/navigation.spec.ts                                               |    2 +-
 tests/reader.spec.ts                                                   |   22 +-
 55 files changed, 8956 insertions(+), 890 deletions(-)
```

## Files in `dist/`

```
assets/alignment-BkMpCaXr.js
assets/alignment-BkMpCaXr.js.map
assets/alignment-Cv212zD_.js
assets/alignment-Cv212zD_.js.map
assets/alignment-DwJwZvzN.js
assets/alignment-DwJwZvzN.js.map
assets/cormorant-garamond-cyrillic-500-normal-CyAY5ZLS.woff2
assets/cormorant-garamond-cyrillic-500-normal-DkJXBcIH.woff
assets/cormorant-garamond-cyrillic-600-normal-C2atO-64.woff2
assets/cormorant-garamond-cyrillic-600-normal-FNmA3REe.woff
assets/cormorant-garamond-cyrillic-ext-500-normal-Yta7XZ9C.woff2
assets/cormorant-garamond-cyrillic-ext-500-normal-lsPpqi9g.woff
assets/cormorant-garamond-cyrillic-ext-600-normal-BMhMHfrj.woff2
assets/cormorant-garamond-cyrillic-ext-600-normal-CsIYWmWK.woff
assets/cormorant-garamond-latin-500-normal-BsRWmXhO.woff2
assets/cormorant-garamond-latin-500-normal-zIXX3Q-H.woff
assets/cormorant-garamond-latin-600-normal-2CBVLo0M.woff
assets/cormorant-garamond-latin-600-normal-Co1r35X9.woff2
assets/cormorant-garamond-latin-ext-500-normal-CH1kM7og.woff2
assets/cormorant-garamond-latin-ext-500-normal-DYeaGGzO.woff
assets/cormorant-garamond-latin-ext-600-normal-DaBc-lu7.woff2
assets/cormorant-garamond-latin-ext-600-normal-Dk3-quAP.woff
assets/cormorant-garamond-vietnamese-500-normal-BZGLGj12.woff2
assets/cormorant-garamond-vietnamese-500-normal-DqXqCC0q.woff
assets/cormorant-garamond-vietnamese-600-normal-BoXdMtcr.woff2
assets/cormorant-garamond-vietnamese-600-normal-C4HEjEaf.woff
assets/differences-DmQ-TFFi.js
assets/differences-DmQ-TFFi.js.map
assets/index-BuRlZWch.css
assets/index-DrQ2t8kJ.js
assets/index-DrQ2t8kJ.js.map
assets/manuscripts-Dml_5pnV.js
assets/manuscripts-Dml_5pnV.js.map
assets/notes-C4F61NGX.js
assets/notes-C4F61NGX.js.map
assets/overview-BYqXGBLr.js
assets/overview-BYqXGBLr.js.map
assets/overview-ZFdh2Res.js
assets/overview-ZFdh2Res.js.map
assets/questions-Do73VSOG.js
assets/questions-Do73VSOG.js.map
assets/refmap-BWF5Fj2J.js
assets/refmap-BWF5Fj2J.js.map
assets/refmap-BrfVtNyV.js
assets/refmap-BrfVtNyV.js.map
assets/revisions-Cc62s7Cm.js
assets/revisions-Cc62s7Cm.js.map
assets/revisions-DCHBzrjz.js
assets/revisions-DCHBzrjz.js.map
assets/source-serif-4-cyrillic-ext-opsz-italic-Bl6DJqma.woff2
assets/source-serif-4-cyrillic-ext-opsz-normal-DIwfbPUE.woff2
assets/source-serif-4-cyrillic-opsz-italic-Dibx14aP.woff2
assets/source-serif-4-cyrillic-opsz-normal-C0olyEE-.woff2
assets/source-serif-4-greek-opsz-italic-CMW9dfKg.woff2
assets/source-serif-4-greek-opsz-normal-DrHU7SY7.woff2
assets/source-serif-4-latin-ext-opsz-italic-BhUEwDRF.woff2
assets/source-serif-4-latin-ext-opsz-normal-HoL-AExg.woff2
assets/source-serif-4-latin-opsz-italic-BOLXpvkj.woff2
assets/source-serif-4-latin-opsz-normal-BpEBLj1O.woff2
assets/source-serif-4-vietnamese-opsz-italic-Hh3oeMt5.woff2
assets/source-serif-4-vietnamese-opsz-normal-DX68cEVD.woff2
assets/text-B3vXvc5o.js
assets/text-B3vXvc5o.js.map
assets/text-DoOoVYCN.js
assets/text-DoOoVYCN.js.map
assets/text-Dyfe_mlz.js
assets/text-Dyfe_mlz.js.map
index.html
```
