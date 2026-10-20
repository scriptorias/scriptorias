# Proposal: Editorial publishing framework (Phase 2)

Status: **draft for review**. Nothing here is implemented yet.

Goal: a rigorous, repeatable, lightweight way to publish historical texts that readers can trust.
The Didache is the pilot. The process must scale to thousands of works across traditions without
a separate editorial management system: content stays as JSON in git, review happens through
pull requests, and the validator enforces the rules.

---

## 1. What already exists (v0.1.1)

| Need | Already supported | Gap |
|---|---|---|
| Works separate from translations | `work.json` + `translations/<id>/` | none |
| Stable references | `refScheme`, canonical refs, `alignment.json` | ref aliases for future renumbering |
| Provenance of a text | `translation.json`: license, attribution, source URL, retrieval date, importer, raw snapshot, coverage | structured rights decision; source edition details (editor, year, pages) |
| Reproducible import | committed raw snapshots, deterministic importers, `content:check` in CI | a second-witness comparison step |
| Claims with sources | `facts[].sources`, `background[].sources`, `sources.json` | page/section **locators**; stricter rules for published claims |
| Fact vs interpretation | `basis` (established/disputed/unknown), `kind` (fact/interpretation) | none |
| Verification status | `verification.status`: sample / unverified / proposed / verified | the 4 states need re-defining (§5); no record of *who* reviewed *what* against *which* evidence |
| Manuscripts | `manuscripts.json` with contents refs, images, sources | catalog identifiers, holding institution, image rights |
| Corrections | git history | a reader-facing revision log; versioned translations |

Conclusion: the architecture already covers ~70% of the need. The additions below are small
schema extensions plus written process. No new services are needed.

---

## 2. Source standards

Every published text is tied to identifiable editions. Each source is classified so it's clear
what it can be used for.

| Role | Used for | Didache example |
|---|---|---|
| **Manuscript witness** | the evidence the text rests on | Codex Hierosolymitanus 54 (1056); P.Oxy. 1782; Coptic fragment BL Or. 9271 |
| **Indirect witness** | later reworkings and quotations | Apostolic Constitutions VII; Doctrina Apostolorum |
| **Critical / base edition** | the original-language text we publish, and the verse scheme | public domain: Bryennios (1883), Hitchcock & Brown (1884), Schaff (1885), Lake (1912) |
| **Reference edition** | consulted and cited, never reproduced | in copyright: e.g. Holmes, *The Apostolic Fathers* (3rd ed., 2007); Ehrman, Loeb (2003); Rordorf & Tuilier, SC 248; Niederwimmer's commentary |
| **Translation** | the reading text | public domain: Lightfoot & Harmer (1891), Roberts–Donaldson (ANF 7, 1886), Hoole (1894), Lake (1912) |
| **Digitization** | where our transcription came from | Wikisource transcriptions; page scans (e.g. Internet Archive, HathiTrust) |
| **Secondary literature** | dates, context, disputes | monographs, articles, encyclopedia entries by named scholars |

Rules:
1. **Publish only from editions we can name exactly:** editor, title, year, publisher, and pages.
   A web page that doesn't identify its underlying edition (like the Greek Wikisource Didache) can
   be used as a cross-check, never as a base text.
2. **Proofread every published transcription against page images** of the named printed edition.
   A digitization is never trusted on its own.
3. **Modern copyrighted editions** can be consulted for facts, verse numbering, and dating (facts
   and numbering systems are not copyrightable), and cited, but not reproduced.
4. **Each work records its manuscript tradition,** even when we don't host images.

---

## 3. Text verification

Each published translation or original-language text passes four checks. Each check is
recorded with evidence.

1. **Transcription accuracy.**
   - *Automated:* compare our import against a second independent digitization of the same
     edition (e.g. Wikisource vs. an Internet Archive OCR, or CCEL). Every difference is listed in
     a chapter-by-chapter report.
   - *Human:* proofread each chapter against page scans, resolving every listed difference and
     reading the full text once. Record the edition pages checked.
2. **Divisions.** Chapter and verse boundaries are checked against at least two named editions, at
   least one of them a standard critical or reference edition. Disagreements between editions are
   documented, not silently resolved.
3. **Alignment.** Every translation segment maps to canonical refs, and each mapping is checked
   against the base text. Where a translation's sentence spans two verses, it either maps to both
   or is split at the verse boundary (an editorial decision; see §9 Q6).
4. **References in apparatus.** Notes, connections, pathways, and citations point to refs that
   exist and are reachable (the validator already checks this).

Evidence record (new, small):

```json
"checks": [
  { "kind": "transcription", "sections": [1,2,3], "against": [{ "source": "lightfoot-1891", "locator": "pp. 229–231" }],
    "method": "proofread against page scans; 2 corrections", "by": "editor-id", "date": "2026-11-02" }
]
```

---

## 4. Copyright and licensing

There are four layers, each decided separately and recorded in a `rights` block on the translation:

| Layer | Question | Didache / Lightfoot |
|---|---|---|
| Ancient work | Is the work itself protected? | No (c. 1st–2nd century) |
| Translation / edition | Is the translation or critical text still in copyright? | Lightfoot & Harmer 1891: public domain in the US (published before 1930); worldwide status depends on the death dates of Lightfoot (d. 1889) and J. R. Harmer, to confirm |
| Digitization / transcription | Does the source of our digital text impose terms? | Wikisource: CC BY-SA 4.0 (attribution + share-alike) |
| Our contributions | How do we license our own overviews, notes, alignments? | **Decision needed** (§9 Q4) |

```jsonc
"rights": {
  "status": "cleared",   // cleared | restricted | permission | unknown
  "basis": "Published 1891 (US public domain); translators' deaths more than 70 years ago (to confirm).",
  "transcription": { "license": "CC BY-SA 4.0", "obligations": ["attribution", "share-alike for the text file"] },
  "decidedBy": "…", "date": "…"
}
```

Rule: **a text can't be published with `rights.status` other than `cleared` or `permission`**
(validator-enforced). Attribution strings are shown in the reader colophon, which already exists.

---

## 5. Editorial status (replaces the current four values)

| Status | Meaning | Label shown to readers | Exit criteria |
|---|---|---|---|
| `placeholder` | Written for interface design; not research | "Placeholder" | must be replaced, never promoted |
| `unverified` | Authentic material from a named source, not yet checked by us | "Unverified" | checks begun |
| `reviewed` | Checked by one editor against cited evidence; open questions listed | "Provisionally reviewed" | second, independent review |
| `verified` | Checked by two people (one an approving editor), evidence recorded, no open questions | (no badge; this is the default for published material) | — |

- The status applies to each record: a text, an alignment, a fact, a paragraph, a note, a
  manuscript record. A work's displayed status is the *lowest* status of its required parts.
- Mapping from today: the overviews and notes I wrote (`sample`) → `placeholder`; the Lightfoot
  and Charles texts → `unverified`; the Didache ch. 1 alignment (`proposed`) → `reviewed` only after
  you or an editor confirm the Lake/Greek cross-check, otherwise `unverified`.
- Review entries record who reviewed, when, against what, and the result. The merged pull request
  is the approval record; the JSON keeps a summary so it survives outside GitHub.

Validator rules: `verified` requires ≥2 reviews by different people with evidence; a published
work may not contain `placeholder` records; every published fact and paragraph needs at least one
citation with a locator.

---

## 6. Historical metadata (required per work)

Required to publish: title (and common alternative titles), tradition, author with basis
(known / attributed / traditional / anonymous), date range with basis, original language(s),
place of origin (or "unknown") with basis, genre, canonical status by tradition, a short neutral
introduction, structure (sections), manuscript tradition summary, and at least one cited source
for each of date, authorship, and origin.

Optional: historical context, reception history, major scholarly disputes (each with citations and
named positions), connections to other works.

Disputes are presented as positions with sources ("X dates it to c. 70 [cite]; Y to c. 110–120
[cite]"), never as one blended conclusion. Our own interpretation is never written in the
encyclopedia voice.

Every one of these fields already exists in `work.json` / `overview.json` except genre and
canonical-status-by-tradition (both small additions) and locators on citations.

---

## 7. Citations and provenance (reader-facing)

- **Claims:** each fact or paragraph links to its sources with locators (e.g. "Holmes 2007, p. 337").
  The overview's existing *Sources & further reading* section becomes a real bibliography,
  generated from cited sources.
- **Text:** the reader colophon names the edition, pages, transcription source, license, and
  verification status, and links to the work's revision log.
- **Passage citations:** "Copy citation" already produces a canonical reference. It will add
  the translation version (e.g. "Lightfoot, Scriptorias ed. 1.0").

Source record additions: `role` (from §2), structured `edition` fields (editor, year, publisher,
pages), and an optional `copyright` note. Citations become `{ source, locator }` instead of bare ids.

---

## 8. Corrections and revisions

- Each translation gets a **version** (`1.0`, `1.1` …) and a `revisions.json` log: date, version,
  affected refs, type (`typo`, `reading`, `division`, `alignment`, `metadata`), description, and
  evidence. The reader shows "Revised [date]" with a link to the log.
- **Canonical refs never change meaning.** If a division is corrected, the old ref is kept as an
  alias (`refAliases: { "didache.2.4": "didache.2.3" }`) so bookmarks, citations, and links still
  resolve, using the same mechanism as the prototype migration.
- **Error reports:** start with GitHub issues using a short template (passage ref, problem,
  evidence). No in-app system yet.
- Corrections follow the same branch → review → release path as code. Each published correction
  appears in `CHANGELOG.md` under *Content*.

---

## 9. Questions that need human judgment

1. **Editors and approval.** Who can sign off as editor or reviewer, and what qualifies someone
   (credentials or demonstrated competence)? I can do automated checks and first-pass review, but I
   shouldn't be the approving editor for `verified`.
2. **Base translation(s).** Lightfoot & Harmer (1891) as the reading text? Also Roberts–Donaldson
   (ANF) or Hoole for comparison?
3. **Greek base text.** Which public-domain Greek edition do we publish: Bryennios 1883 (editio
   princeps), Hitchcock & Brown 1884, Schaff 1885, or Lake 1912? Lake is the most convenient (and
   matches our chapter 1 cross-check); Bryennios is the most historically primary.
4. **Licensing of our own work.** What license do we give our overviews, notes, and alignments
   (e.g. CC BY 4.0, CC BY-SA 4.0, or all rights reserved)? And is CC BY-SA *share-alike* acceptable
   for texts derived from Wikisource, or should we transcribe from page scans ourselves to avoid
   it? **I recommend a short review by someone qualified in copyright,** especially for
   non-US jurisdictions.
5. **Verse-scheme authority.** Which modern edition is the arbiter when editions disagree
   (Holmes is the most widely cited in English)? It must be consulted directly; I couldn't access it.
6. **Segmenting translations by verse.** Lightfoot's sentences sometimes cross verse boundaries.
   May we split segments at verse breaks (a documented editorial intervention), or must we keep the
   translator's paragraphing and map one segment to several verses?
7. **Presentation of disputes.** How much scholarly debate belongs on an overview page, and how to
   treat minority positions.
8. **Manuscript images.** Image rights belong to the holding institutions (e.g. the Greek Orthodox
   Patriarchate of Jerusalem for H54). Seek permission, link out, or neither for now?
9. **The Didache's ending.** H54 breaks off at 16.8; some scholars reconstruct a lost ending from
   the Apostolic Constitutions and the Georgian version. We should note this, but how prominently?

---

## 10. Didache pilot plan (all 16 chapters)

| Step | Work | Output | Who |
|---|---|---|---|
| 0 | Decide §9 Q1–Q6 | decisions recorded in `docs/decisions` | you / editor |
| 1 | Locate page scans for the chosen translation and Greek edition; record exact editions and pages | `sources.json` entries with editions and locators; raw snapshots + checksums | me |
| 2 | Clear rights for each layer | `rights` blocks; review note | me draft → you/legal decide |
| 3 | Import all 16 chapters (translation + Greek) from snapshots | `text.json` for both, still `unverified` | me |
| 4 | Second-witness comparison and difference report per chapter | `reports/didache/transcription.md` | me |
| 5 | Proofread against page scans, resolving every difference | corrections + `checks` entries | editor (I can do a first pass, marked `reviewed`) |
| 6 | Verse table for 1–16 from two editions; disagreements listed | `refScheme` + verse table; `reports/didache/divisions.md` | me → editor confirms against Holmes |
| 7 | Align translation segments to verses for all 16 chapters (per Q6) | `alignment.json` for both texts; ref aliases if ch. 1 changes | me → editor |
| 8 | Replace placeholder overview with cited research | `overview.json` with citations and locators; disputes as positions | me draft → editor |
| 9 | Manuscript records with catalog ids, dates, sources, image status | `manuscripts.json` | me → editor |
| 10 | Notes and connections with sources (parallels, Two Ways, Barnabas, Apostolic Constitutions) | `notes.json`, `connections.json` | me → editor |
| 11 | Second review, then verified sign-off | review entries; status `verified` where earned | reviewer + editor |
| 12 | Release (dev → preview → approval → v0.2.0) | Didache published; anything not verified stays labelled | you approve |

Readers see progress honestly throughout: chapters can ship as `reviewed` ("Provisionally
reviewed") before everything is `verified`, if you choose.

Effort: steps 1–4 and 6–7 are mostly automatable (a few sessions of my time). Steps 5, 8, and 11
need human scholarly time, roughly a few hours of proofreading for a text this short, plus
review of the overview research.

---

## 11. Implementation sequence (after approval)

1. **Schema (small, backward-compatible):** new status vocabulary + migration of existing records;
   `checks`/`reviews` on verification; `{source, locator}` citations; source `role` and `edition`
   fields; `rights` block; translation `version` + `revisions.json`; `refAliases`; `genre` and
   canonical status per tradition.
2. **Validator rules:** publish gates (rights cleared, no placeholders, citations with locators,
   `verified` needs two reviews).
3. **Reports:** a script that generates the transcription-difference and divisions reports as
   Markdown for proofreading. No editing UI.
4. **Interface (labels only):** map the four statuses to the existing badge styles; link the
   colophon to the revision log; bibliography generated from citations. No redesign.
5. **Didache pilot** (§10), released as v0.2.0.
6. **Write the process up** as `docs/EDITORIAL.md`, reusable for every following work.

Deliberately out of scope: an editorial CMS, user accounts for editors, in-app error reporting,
manuscript image hosting, and any database. Git, pull requests, and the validator are enough at this
scale and grow with the library.
