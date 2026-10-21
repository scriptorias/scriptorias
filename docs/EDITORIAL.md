# Editorial process

How Scriptorias records sources, rights, and review. The approved design is in
`docs/proposals/editorial-framework.md`; the Didache source and rights report is in
`docs/proposals/didache-sources.md`. This document is the working reference. The validator
(`npm run content:check`) enforces the rules marked **(enforced)**.

## 1. Roles

| Role | Who | May do |
|---|---|---|
| Publisher | project owner | final publication decisions; clears rights; approves releases |
| Qualified reviewer | **not yet appointed** (brief: `docs/editorial/REVIEWER.md`) | tier A review: `editor-reviewed`, `approved`, adopting text corrections |
| Assistant / maintainer | Consuelo | research, transcription, first-pass checks, tier B/C changes |

People are listed in `content/editorial/reviewers.json`. Only a record with `qualified: true` and
the `reviewer` or `editor` role counts for tier A **(enforced)**. Nobody is qualified today, so no
content can reach `editor-reviewed` or `approved`. That is intended.

## 2. Status dimensions

Each record carries an `editorial` block. The dimensions are independent:

| Field | Values | Meaning |
|---|---|---|
| `content` | `placeholder` · `authentic` | design filler vs real material |
| `transcription` | `unchecked` → `proofread` → `editor-reviewed` | does our text match the named printed edition? |
| `provenance` | `recorded` → `confirmed` | are edition, pages, attribution and rights correctly identified? |
| `review` | `draft` → `reviewed` → `approved` | have the claims been checked against their sources? |
| `reviews[]` | review entries | who checked what, when, which tier, against which evidence, result |

Scholarly certainty is separate: claims keep `basis` (`established` / `disputed` / `unknown`).
An approved claim can still be disputed.

Evidence rules **(enforced)**:
- `proofread` needs a passing `transcription`, `divisions` or `alignment` review entry.
- `editor-reviewed` and `approved` need a passing **tier A** entry by a **qualified** reviewer.
- `provenance: confirmed` needs a passing `provenance` or `rights` entry.
- Placeholder content cannot be proofread, reviewed or approved.
- Review entries must name someone in `reviewers.json`; their `against` citations must resolve.

## 3. Review tiers

| Tier | Examples | Approval |
|---|---|---|
| A: scholarly and textual | transcription, verse divisions, alignment, dates, authorship, origin, interpretations, manuscript descriptions, text corrections | qualified reviewer for the top status; publisher decides publication |
| B: editorial and metadata | our own typos, links, evidenced catalogue numbers, blurbs | one review (publisher or maintainer) via pull request |
| C: mechanical | regenerated output, validator-checked renames with aliases | CI plus merge approval |

The merged pull request is the approval record; the JSON holds a summary.

### Decision classes (S / T / P)

Every editorial decision is classed **S** (needs qualified scholarly judgement; only a qualified
editor may decide), **T** (technical or mechanical; staff carry it out once the policy or ruling
exists), or **P** (publisher policy; decided by the publisher). Decision registers and review
packets record the class of each item. A decision can carry a secondary class when one part of it
belongs elsewhere, e.g. **S (→T)**: the editor rules, then staff apply the ruling. Classes say who
decides; tiers (above) say how a resulting change is approved. S decisions lead to tier A changes.

## 4. Sources and citations

`content/sources.json` is the bibliography. Each source records `role`
(`manuscript`, `indirect-witness`, `base-edition`, `reference-edition`, `translation`,
`digitization`, `secondary`, `catalog`), `use` (`reproduce`, `compare`, `consult-only`, `cite`),
structured `edition` details, `scans[]` (repository, identifier, holding library, digitizer, rights
code), and a `rights` layer.

Citations are a source id or `{ "source": "...", "locator": "p. 229", "note": "..." }`. Every
cited id must exist **(enforced)**. Published claims need at least one citation with a locator
**(enforced at publication)**.

A `consult-only` source (e.g. Holmes 2007) can never be a translation's edition base
**(enforced)**. It may be consulted and cited for facts and numbering, never reproduced.

## 5. Rights

Each translation or edition has a `rights` record with separate layers, so a public-domain work is
never confused with the rights in its edition or digitization:

| Layer | Question |
|---|---|
| `work` | is the ancient work itself protected? |
| `edition` | is the printed edition or translation protected (by jurisdiction)? |
| `digitization` | do the scans or transcription we use carry terms (e.g. CC BY-SA)? |
| `siteTerms` | do the hosting site's terms add conditions (e.g. Google-digitized HathiTrust files)? |
| `ours` | proposed licence for our own output (`preferred` until decided) |

Each layer has `status`, `basis`, optional `jurisdictions`, `obligations`, and `legalReview`
(`required` · `recommended` · `not-needed` · `done`). International questions stay open in
`jurisdictions` until reviewed.

`decision` is `open`, `cleared` or `restricted`. Rules **(enforced)**:
- An available translation must have a rights record.
- `cleared` is impossible while any layer has legal review `required` or `recommended`, or a
  status of `unknown` or `restricted`.
- Only the publisher can clear rights (`decidedBy`).

Licensing directions (not final): CC0 for structured data and eligible transcriptions; CC BY 4.0
for editorial writing. Recorded as `ours.status: "preferred"`.

Raw third-party snapshots under `content/_raw/` each need a `NOTICE.md` with source, licence,
attribution and retrieval date **(enforced)**.

## 6. Transcription policy

The step-by-step workflow, and where unpublished transcriptions are kept, is in
`docs/editorial/TRANSCRIPTION.md`.

Transcriptions are made independently from cleared page scans of the named edition:
- Preserve the printed wording, spelling, punctuation and editorial features (brackets, italics,
  the editor's paragraphing).
- Record every normalization in the translation's `transcriptionPolicy.normalizations`.
- Record proposed corrections separately in `corrections.json` (`printed`, `proposed`, `basis`).
  The printed text stays as printed. A correction is adopted only after a tier A review by a
  qualified reviewer **(enforced)**. Bryennios is preserved as printed on this basis.

## 7. References, corrections, revisions

- Canonical refs never change meaning. If a division is corrected, the old ref becomes an alias in
  `work.refAliases` (`{ "didache.2.4": "didache.2.3" }`). Aliases must belong to the work, point at
  an aligned ref, never chain, and never replace a ref that is still live **(enforced)**. Reader
  URLs, bookmarks and links follow aliases; stored bookmarks are moved to the current ref.
  Browser tests use invented aliases from `tests/fixtures/ref-aliases.json`, compiled only into a
  separate test build (`npm run build:alias-fixture`); production content has no aliases.
- Each translation has a `version`. Published changes are logged in `revisions.json` (version,
  date, type, refs, description, tier, by), validated if present, and listed in `CHANGELOG.md`
  under *Content*.

## 8. Publication gate

A work is published only when `work.publication.status` is `published` and `approvedBy` is the
publisher. The gate then requires **(enforced)**: an authentic overview, no placeholder notes,
connections or manuscript records, cited locators on every claim, a default translation that is at
least proofread with provenance confirmed and rights cleared, and an authentic reference scheme.
Works in `draft` or `preview` are not gated; they show their status labels instead.

## 9. Reader-facing labels

Wording only; the existing badge styles are unchanged.

| State | Label |
|---|---|
| placeholder overview / notes / metadata / record | "Placeholder content", "Placeholder notes", "Placeholder metadata", "Placeholder record" |
| authentic record not yet reviewed | "Draft record · not yet reviewed" |
| text `unchecked` | "Unverified transcription" |
| text `proofread` | "Provisionally reviewed" |
| text `editor-reviewed` | "Editor reviewed" |
| partial text | "Sample passage · Chapters 1–3 of 16"; missing chapters "not yet available" |

Nothing is labelled "verified" without a qualified tier A review and the publisher's approval.

## 10. Current state (2026-10-20)

- Didache: Lightfoot translation chs. 1–3, transcription unchecked (Wikisource import), rights
  open. Ch. 1 verse alignment proofread by the assistant against Lake 1912 and the Greek text;
  awaiting qualified review. Overview, notes, and most manuscript records are placeholders.
  P.Oxy. XV 1782 is an authentic draft record (parchment; contents range open).
- 1 Enoch: Charles 1917 sample chapters, unchecked, rights open, placeholder overview.
- Exact scans and rights findings: `docs/proposals/didache-sources.md` and `content/sources.json`.
