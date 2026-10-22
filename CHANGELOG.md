# Changelog

All notable changes to Scriptorias. Versions follow [Semantic Versioning](https://semver.org/);
the project stays in the 0.x series until public launch. In 0.x, MINOR versions (0.2.0) add
features or change behavior and PATCH versions (0.1.1) are fixes only.

Releases are cut only for approved milestones (see docs/RELEASING.md). Changes merged since the
last release are listed under **Unreleased**.

## [Unreleased]

## [0.2.5] - 2026-10-22

### Changed
- Mobile reader: the bottom tool bar contrasts with the page, charcoal in light mode (like the
  app's tab bar) and cream in dark mode.

## [0.2.4] - 2026-10-22

### Changed
- Mobile tab bar: the Library tab is removed (Home, Pathways, Search, More).

### Fixed
- Reader: reopening a chapter you had not scrolled into now starts at the top of the page, with
  the chapter heading, instead of at the first verse.

## [0.2.3] - 2026-10-22

### Changed
- Home: the title is now "My Scriptorias".
- Christianity uses the Orthodox cross icon (sidebar, Home library button), and the icon also
  appears before the title on the Christianity library page.

## [0.2.2] - 2026-10-22

### Changed
- Mobile: the header bar and the bottom tab bar use the sidebar's charcoal; the current tab is
  shown in light text with a gold icon.
- Library page: the Collections, Pathways, Timeline and Key Figures buttons have icons.

## [0.2.1] - 2026-10-21

### Changed
- Library page: the facets line under the tradition title is replaced by the Home-style divider,
  and the section bar by separate buttons shaped like the Home library buttons (Collections,
  Pathways, Timeline, Key Figures). The Topics section is removed.

### Fixed
- An end-to-end test now waits for the work page before reopening the reader (WebKit flake).

## [0.2.0] - 2026-10-21

### Added
- The Didache in Lightfoot & Harmer (1891), Greek and English, all 16 chapters, transcribed by
  SCRIPTORIAS from page images (internally checked; not independently verified), verified against
  a third printing (HathiTrust, 1898). Text release: public domain in the US, UK and EU; overview,
  notes and manuscript records still labelled incomplete (docs/releases/didache-release-steps.md).
- Edition-aware references (`refmap.json`): the edition's own numbering next to SCRIPTORIAS refs,
  with provisional mappings (e.g. 16.8 ↔ Lightfoot XVI.7) and editorial verse alignment labelled.
- Reader: printed paragraphs and page breaks, uncial and uncertain-reading marks, open questions,
  edition differences, provenance with external source links only, correction history, approved
  public notices, and "Report a suspected error" (GitHub issue form) on every passage.
- Retired translation ids (`work.retiredTranslations`) with link redirects and storage schema 3.
- Validator: reference-map, retired-translation and open-question rules; production hold for works
  in preview. Importer `npm run content:import-lightfoot` with byte-for-byte rebuild checks.
- Editorial infrastructure (docs/EDITORIAL.md): separate statuses for content kind,
  transcription, provenance and claim review, with recorded review entries and tiers.
- Bibliography with exact editions, page ranges and scans (`content/sources.json`); layered rights
  records (work, edition, digitization, site terms) with open decisions and legal-review flags.
- Reviewer register (`content/editorial/reviewers.json`) and an external reviewer brief
  (docs/editorial/REVIEWER.md).
- Validator rules for citations, review evidence, rights clearance, raw-snapshot notices,
  reference aliases, corrections, revisions and a publication gate, with rule tests
  (`npm run test:content`).
- Reference aliases (`work.refAliases`): reader URLs and bookmarks follow corrected divisions.
  Tested with invented aliases in a separate test-only build; no aliases in published content.
- Transcription workflow (docs/editorial/TRANSCRIPTION.md).
- CC BY-SA 4.0 attribution notices for the Wikisource snapshots.

### Changed
- Didache reader layout: the text comes first. An English / Greek switch sits in the top bar and
  keeps the chapter (and selected verse where possible). No edition header above the text. About
  this edition (with the transcription status), Licensing & notices, References & textual notes,
  Correction history and Report a suspected error live in the Contents drawer, closed by default.
  Provisional readings and mappings (3.10 ⟦?ἄτερ⟧, 16.8 ↔ XVI.7, editorial verse numbers in
  English chapters 1 and 16) carry small, muted markers that open their explanation.
- English is always the default edition when one exists (validator rule); a switch to another
  language lasts only while reading that book.
- Status labels: "Internally checked transcription · not independently verified" (proofread) and
  "Independently verified" (editor-reviewed), per docs/EDITORIAL.md §9.
- The Didache's Wikisource English (chapters 1–3) is replaced by the new edition; old links and
  bookmarks open the same passages.
- `content/sources.json`: the Cornell copy of Lightfoot & Harmer is recorded as the 1907 reprint
  (reading copy); the Toronto copy as the 1891 printing (check copy).
- Status labels: "Sample" wording replaced by "Placeholder content/notes/metadata",
  "Unverified transcription", and "not yet available" for missing chapters. No visual changes.
- P.Oxy. XV 1782 recorded as parchment, with holding, catalogue links and its open contents question.

### Fixed
- The Scriptorias logo (sidebar and mobile header) now opens the home page (`/home`) instead of
  the Christianity library.

## [0.1.1] - 2026-10-20

Maintenance release: accessibility, robustness, and release documentation. No new features,
content, or visual redesign.

### Fixed
- **Accessible names:** the reader's back link and the passage actions (Bookmark, Copy citation,
  Notes, Clear) now have names on phones, where their text labels are hidden. The Text settings
  button's name now matches its visible label.
- **Invalid chapter URLs:** chapters that don't exist (e.g. `/works/didache/read/99`) show Not
  Found instead of silently opening another chapter. Chapters outside an edition's coverage (e.g.
  Didache 4) say so and link to the first available chapter. The reading placeholder for works
  without text keeps the site navigation again.
- **320px screens:** the facets line on the Christianity page no longer overflows.
- **Keyboard navigation:** arrow keys pressed immediately after changing chapter use the new
  chapter's neighbours.

### Changed
- **Text contrast:** muted text, small gold labels, and the "Read" status now meet WCAG AA (4.5:1)
  on the cream backgrounds, in light and dark reader themes. The palette is the same, slightly
  deepened for readable text only. Decorative accents and intentionally disabled items (Coming
  Soon libraries, planned editions, chapters outside the sample) are unchanged.
- **Structure:** page headings follow a correct outline (cards and section labels are proper
  sub-headings), navigation regions and side panels are labelled, and the duplicate-landmark
  warnings are resolved. No visual change.
- **Rollback docs:** the primary rollback method is now restoring a release's files on a branch
  (tested; preserves history). `git revert` is kept for single commits.
- `package.json` version corrected to `0.1.1` (the v0.1.0 commit carries a placeholder `0.2.0`).

### Added
- Release process, rollback procedure (docs/RELEASING.md), and this changelog.
- Automated accessibility checks (axe-core) on 16 views, on Chromium and WebKit, desktop and
  mobile, plus regression tests for every fix above.

### Known limitations
- Unchanged from 0.1.0, except the items fixed above. Intentionally de-emphasised disabled items
  remain below 4.5:1 contrast by design.

## [0.1.0] - 2026-10-20

First versioned release: the React/TypeScript foundation and the structured content architecture.
Tag `v0.1.0` → commit `5c477de`, deployed to https://scriptorias.vercel.app and verified on
Chrome desktop and Safari iPhone.

### Added
- **Content architecture.** Version-controlled JSON in `content/` with Zod schemas:
  traditions, collections and canons (many-to-many membership), works with parts, historical
  overviews, manuscripts, translations/editions with provenance and licensing, texts, alignments,
  connections, reader notes, sources, and pathways.
- **Canonical passage references** (`didache.1.3`) independent of any translation's numbering,
  with per-translation alignment and verification status.
- **Repeatable imports** from committed Wikisource snapshots; `content:check` fails on importer
  drift or broken references.
- **Automated checks.** Playwright end-to-end tests (Chromium, WebKit, mobile) and GitHub Actions
  CI; Vercel preview deployments for the `dev` branch.
- Documentation: architecture, content model, reference systems, decisions, migrations.

### Changed
- **Application rebuilt in React + TypeScript + Vite** with the same visual design. Clean URLs
  replace `#/` routes, and old links redirect.
- Works and translations load on demand; fonts are self-hosted (no Google Fonts requests).
- Didache chapter 1 shows conventional verse numbers 1–6 (proposed alignment, cross-checked
  against Lake 1912 and the Greek text).
- Biblical Canon opens a page of its sections; Ignatius' seven letters are individual works.

### Migrated
- Saved bookmarks, reading positions, and translation preferences are upgraded once in the
  browser (`sc.schema = 2`). Prototype passage bookmarks map to canonical verses.

### Known limitations
- All user data is stored in the browser only: no accounts and no sync between devices.
- Library content is sample or unverified. Didache chapter 1 references are *proposed*;
  chapters 2–3 are not verse-aligned.
- Public pages are rendered client-side (not yet prerendered for search engines); unknown URLs
  return the app's Not Found page with HTTP 200.
- Search is a simple client-side scan.
- Wikisource transcription attribution (CC BY-SA 4.0) still needs a licensing review.

## prototype-v1 - 2026-10-20

Static HTML/CSS/JS prototype, preserved at tag `prototype-v1` (commit `02c831d`).

[Unreleased]: https://github.com/scriptorias/scriptorias/compare/v0.2.1...dev
[0.2.1]: https://github.com/scriptorias/scriptorias/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/scriptorias/scriptorias/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/scriptorias/scriptorias/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/scriptorias/scriptorias/compare/prototype-v1...v0.1.0
