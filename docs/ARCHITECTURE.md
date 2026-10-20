# Architecture

Scriptorias is a static, client-rendered React application. All library content is
version-controlled JSON in `content/`, compiled into the build by Vite.

```
content/                 Library content (see CONTENT.md)
src/
  main.tsx               Entry: legacy URL redirect, storage migration, router
  App.tsx                Routes
  content/
    schema.ts            Zod schemas = content types (shared with scripts)
    catalog.ts           Eager catalog: traditions, collections, works, translations, connections, pathways
    loaders.ts           On-demand chunks: overviews, manuscripts, notes, texts, alignments
    refs.ts              Canonical references and segment ↔ ref alignment index
  components/            Shell (sidebar, tab bar, mobile header, hero, breadcrumb), Icon
  pages/                 Library, Collection, Work overview, Manuscript, Pathways, Search, Bookmarks, misc
  reader/Reader.tsx      Reusable reader
  lib/                   storage adapter, migrations, paths, toast, hooks
  styles/app.css         Design system (unchanged visual identity)
scripts/content/         Importers, import runner, validator
scripts/legacy/          One-time prototype → content migration (kept for the record)
tests/                   Playwright end-to-end tests
docs/                    Architecture, content model, decisions, migrations
```

## Routing

Browser-history routing (`react-router`) with clean URLs:

| Path | Page |
|---|---|
| `/` | Christianity library (as before) |
| `/home` | Home |
| `/library/:tradition[/:tab]` | Tradition overview / Coming Soon |
| `/collections/:id` | Collection, canon, or group |
| `/works/:id` | Work overview |
| `/works/:id/read[/:chapter[/:verse]]` | Reader (`?seg=`, `?n=`, `?tr=` optional) |
| `/works/:id/manuscripts/:ms` | Manuscript record |
| `/pathways`, `/pathways/:id` | Pathways |
| `/search?q=` | Search |
| `/bookmarks`, `/about`, `/settings`, … | Other pages |

Vercel rewrites every path to `index.html` (`vercel.json`); static assets are served first.
Prototype hash links (`#/w/…`) are rewritten on load (docs/MIGRATION.md).

## Loading

The catalog (≈50 small work records plus collections) ships with the main bundle. Each overview,
manuscript list, notes file, text, and alignment is a separate chunk loaded when a page needs it
(`import.meta.glob`). Search currently loads all texts on first use; see DECISIONS.md.

## Persistence

Browser `localStorage`, keys prefixed `sc.`, behind `src/lib/storage.ts` so a native store can
replace it for Capacitor. Stored: bookmarks, last read, resume positions, sections read,
reader preferences, translation choice, sort order, storage schema version. No accounts or sync.

## Fonts

Self-hosted via Fontsource (`@fontsource-variable/source-serif-4` with optical sizes and
italics, `@fontsource/cormorant-garamond` 500/600). No requests to Google Fonts.

## Capacitor readiness

The build is a static SPA in `dist/` with absolute asset paths and history routing, which
Capacitor's iOS/Android web views serve directly (unknown paths fall back to `index.html`).
Fonts and content are bundled, so the app works offline once installed. Before packaging:
swap the storage adapter for Capacitor Preferences (iOS can evict web-view localStorage),
and add safe-area and status-bar handling (CSS already uses `env(safe-area-inset-*)`).

## Checks

`npm run content:check` · `npm run typecheck` · `npm run build` · `npm test` (Playwright against
`vite preview`). GitHub Actions runs all four on pushes to `main`/`dev` and on pull requests.
