# Didache release steps (Lightfoot & Harmer 1891, Greek and English)

Status on branch `didache-import` (2026-10-21): **not released, rights not cleared.** The branch is
local only. Every step below is a publisher (P) decision or happens only after one. Nothing here
authorizes a push, a preview, or a deployment.

## How the reader behaves now

- `work.publication.status` is `preview`. The validator refuses a **production** build while any
  work is in preview (`VERCEL_ENV=production`, i.e. a deployment from `main`; simulate locally with
  `SCRIPTORIAS_TARGET=production npm run content:check`). If the branch reached `main` by mistake,
  the Vercel production build would fail at `content:check` and the previous production
  deployment would stay live. Preview deployments and CI build normally.
- In any build that does run (local, CI, preview), the Didache reader shows both editions with:
  "Preview · not yet released"; the status line "Internally checked transcription · not
  independently verified" with the error-report link; provisional mappings and questions; the
  public-domain, sources, CC0 and factual-data notices. Nothing is labelled verified, approved or
  cleared, and both editions keep `rights.decision: "open"`.
- The publication gate of `docs/EDITORIAL.md` §8 (status `published`) is **not** met today: it
  needs an authentic overview with located citations and no placeholder notes, connections or
  manuscript records. These are content tasks, not data flags (see "Full publication" below).

## Release: the exact data change

Prerequisites (publisher decisions, recorded outside this repository):

1. Source-reuse basis for the Internet Archive page images recorded (checklist P8 / B5).
2. Per-work public-domain checklist signed off (D4).
3. Approval to push the branch and review the Vercel preview (import plan step 8).

Then, in both `content/works/didache/translations/lightfoot-1891-grc/translation.json` and
`.../lightfoot-1891-en/translation.json`:

| Field | Now | At release |
|---|---|---|
| `rights.siteTerms.status` | `"unknown"` | `"licensed"` (use within the repository's terms, as recorded by the publisher) or `"permission"` (written confirmation) |
| `rights.siteTerms.basis` | open question | one sentence naming the recorded basis and its date |
| `rights.decision` | `"open"` | `"cleared"` |
| `rights.decidedBy` | — | `"publisher"` |
| `rights.date` | — | release date (`YYYY-MM-DD`) |
| `rights.note` | "Not cleared …" | short record of the decision |
| `editorial.provenance` | `"recorded"` | `"confirmed"` (the passing internal provenance check is already recorded) |

And in `content/works/didache/work.json`, `publication`:

| Release type | `publication` |
|---|---|
| **Text release** (both editions public, work page still partly placeholder and labelled as such) | `{ "status": "draft", "date": "YYYY-MM-DD" }` — the state of every other live work; removes the production hold and the "Preview" tag |
| **Full publication** (`docs/EDITORIAL.md` §8) | `{ "status": "published", "approvedBy": "publisher", "date": "YYYY-MM-DD" }` — only after the overview, notes, connections and manuscript records are authentic and cited |

Nothing else changes: no code, no text. `transcription` stays `proofread` ("Internally checked
transcription · not independently verified"); open questions stay open; `editor-reviewed`
("Independently verified") needs a qualified reviewer's tier A review.

Also at release: add a `revisions.json` entry only if the text changed (it should not), and a
`CHANGELOG.md` *Content* line.

## Commands

```
# 1. Dry run of the release fields on a temporary copy, as a production build
npm run release:simulate -- text      # expected: ✓ (0 errors)
npm run release:simulate -- full      # expected today: ✗ (placeholder overview/notes/connections/manuscripts)

# 2. Make the data change above, then
npm run content:check                 # import check (rebuilds text from recorded checksums) + validator
SCRIPTORIAS_TARGET=production npm run content:check   # must pass: the production hold is lifted
npm run test:content
npm run typecheck
npm run build && npm run build:alias-fixture
npx playwright test                   # update the "Preview · not yet released" expectations in tests/didache.spec.ts
SCRIPTORIAS_TRANSCRIPTIONS=<working-files folder> npm run test:content   # byte-for-byte against the working files

# 3. Content audit again (docs/releases/didache-content-audit.md), then follow docs/RELEASING.md
```

To regenerate the editions after a transcription correction:
`SCRIPTORIAS_TRANSCRIPTIONS=<folder> npm run content:import-lightfoot` (reads the working files,
records the new commit and checksums), then add a `revisions.json` entry for the correction.

## Rollback

Follow `docs/RELEASING.md` (Vercel Instant Rollback, or restore the previous release on a branch).
Setting `publication.status` back to `preview` is not a rollback: it makes production builds fail.
