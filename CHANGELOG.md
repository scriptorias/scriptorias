# Changelog

All notable changes to Scriptorias. Versions follow [Semantic Versioning](https://semver.org/);
the project stays in the 0.x series until public launch. In 0.x, MINOR versions (0.2.0) add
features or change behavior and PATCH versions (0.1.1) are fixes only.

Releases are cut only for approved milestones (see docs/RELEASING.md). Changes merged since the
last release are listed under **Unreleased**.

## [Unreleased]

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

[Unreleased]: https://github.com/scriptorias/scriptorias/compare/v0.1.1...dev
[0.1.1]: https://github.com/scriptorias/scriptorias/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/scriptorias/scriptorias/compare/prototype-v1...v0.1.0
