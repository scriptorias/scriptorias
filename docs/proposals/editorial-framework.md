# Proposal: Editorial publishing framework (Phase 2)

Status: **approved in principle (2026-10-20)**, revised with the publisher's decisions (§0). Nothing here is implemented yet.

Goal: a rigorous, repeatable, lightweight way to publish historical texts that readers can trust.
The Didache is the pilot. The process must scale to thousands of works across traditions without
a separate editorial management system: content stays as JSON in git, review happens through
pull requests, and the validator enforces the rules.

---

## 0. Decisions (publisher, 2026-10-20)

- **Roles.** The project owner is the **publisher** and makes final publication decisions. I
  (Consuelo) prepare research and verification evidence. Neither of us designates scholarly content
  as fully verified without **qualified editorial review**. *Provisionally reviewed* material may be
  published with transparent labelling.
- **English translation:** Lightfoot & Harmer (1891) is preferred, subject to confirming the exact
  edition and reproduction rights.
- **Greek base text:** Bryennios (1883) is preferred and will be investigated, with Lake (1912) for
  comparison. Availability, textual suitability, and rights to be confirmed before finalising.
- **Transcription:** investigate transcribing public-domain page scans independently, to avoid
  share-alike obligations from existing digitizations. Recommend a licence for our original
  writing; rights decisions are not final without appropriate review.
- **Verse divisions:** Holmes is an important modern reference where accessible. Disagreements
  between editions are recorded, never silently resolved.
- **Translations:** original wording and paragraphing are preserved. Where a sentence crosses a
  verse boundary, alignment metadata handles it (one segment → several verses).
- **Overviews:** concise, readable, and neutral. Established facts are presented prominently;
  disputed interpretations go in clearly identified sections, with sources.
- **Manuscript images:** link externally at first. Image permissions are not a prerequisite for the pilot.
- **Didache 16:** clearly explain the textual ending and the manuscript evidence, without implying
  more survives than does.
- **Proportionate review** (§5): major textual verification and scholarly approval need qualified
  human review; minor metadata or formatting corrections do not need two independent scholars.
- **Separate dimensions** (§5): transcription fidelity, attribution and provenance, and scholarly
  certainty of claims are tracked separately, not as one blanket status.

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

## 5. Editorial status: separate dimensions, proportionate review

One blanket status would mix up different questions. Each record answers only the ones that
apply to it.

| Dimension | Question | Values | Applies to |
|---|---|---|---|
| **Content kind** | Is this real material or a design placeholder? | `placeholder` / `authentic` | everything |
| **Transcription** | Does our text match the named printed edition exactly? | `unchecked` → `proofread` (one documented pass against page scans) → `editor-reviewed` (qualified reviewer) | texts, alignments, verse tables |
| **Provenance** | Are the edition, pages, translator/editor attribution, and rights correctly identified? | `recorded` → `confirmed` (checked against scans and catalogue records; rights decided by the publisher after any required review) | translations, editions, sources, manuscript records |
| **Claim review** | Has a historical statement been checked against its cited sources? | `draft` → `reviewed` → `approved` (qualified reviewer) | facts, background paragraphs, notes, connections |

Separately from review status, each claim keeps its existing `basis` (`established` / `disputed`
/ `unknown`) for *scholarly certainty*. A claim can be fully approved and still be marked
disputed, because that's what the scholarship says.

**Reader-facing labels (no redesign; existing badge style):**
- `placeholder` → "Placeholder" (never published as content).
- Published, not yet editor-reviewed or approved → "Provisionally reviewed".
- Fully reviewed → no badge. The colophon and overview still show the evidence.
- Disputed claims stay in their labelled *Disputed* sections regardless of review status.

**Proportionate review tiers:**

| Tier | Examples | Who must approve |
|---|---|---|
| **A: Scholarly and textual** | transcription and verse divisions, alignment, dates, authorship, origin, interpretations, manuscript descriptions | qualified editorial reviewer for `editor-reviewed` / `approved`; the publisher decides whether provisionally reviewed material is published |
| **B: Editorial / metadata** | typos in our own prose, links, catalogue numbers already evidenced, formatting, blurbs | one review (publisher or maintainer) via pull request |
| **C: Mechanical** | validator-checked changes, regenerated outputs, renames with aliases | CI plus the usual merge approval |

Review entries record who, when, which tier, against what evidence, and the result. The merged
pull request is the approval record; the JSON keeps a summary.

Validator rules: no `placeholder` in published works; published texts need provenance
`confirmed` with rights cleared; published claims need at least one citation with a locator;
`editor-reviewed` / `approved` need a review entry from someone listed as a qualified reviewer.

Mapping from today: the overviews and notes I wrote → `placeholder`; Lightfoot and Charles texts →
`authentic`, transcription `unchecked`, provenance `recorded`; Didache ch. 1 alignment →
`proofread` (the Lake/Greek cross-check), awaiting editor review.

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

Answered by the publisher (§0): roles and sign-off; base translation (Lightfoot & Harmer 1891);
Greek base text (investigate Bryennios 1883, compare Lake 1912); Holmes as the modern reference;
preserving translators' paragraphing; overview style; linking to manuscript images; explaining
the Didache's ending.

Still open:
1. **Qualified reviewer.** Who will do Tier A review for the Didache (an academic in early
   Christian literature or Greek, or another named reviewer)?
2. **Licences** for our own writing and data (recommendation in the source report; needs review).
3. The specific source and rights questions in `docs/proposals/didache-sources.md`.

---

## 10. Didache pilot plan (all 16 chapters)

| Step | Work | Output | Who |
|---|---|---|---|
| 0 | Approve sources (see didache-sources.md); name a qualified reviewer | decisions recorded | publisher |
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
| 11 | Qualified editorial review (Tier A) | review entries; `editor-reviewed` / `approved` where earned | qualified reviewer |
| 12 | Release (dev → preview → approval → v0.2.0) | Didache published; anything not fully reviewed is labelled *Provisionally reviewed* | publisher |

Readers see progress honestly throughout: chapters can ship as *Provisionally reviewed* before
Tier A review is complete, if the publisher chooses.

Effort: steps 1–4 and 6–7 are mostly automatable (a few sessions of my time). Steps 5, 8, and 11
need human scholarly time, roughly a few hours of proofreading for a text this short, plus
review of the overview research.

---

## 11. Implementation sequence (after approval)

1. **Schema (small, backward-compatible):** the three status dimensions (§5) + migration of existing
   records; `checks`/`reviews` with review tier; `{source, locator}` citations; source `role` and `edition`
   fields; `rights` block; translation `version` + `revisions.json`; `refAliases`; `genre` and
   canonical status per tradition.
2. **Validator rules:** publish gates (provenance confirmed with rights cleared, no placeholders,
   citations with locators, Tier A statuses need a qualified reviewer's entry).
3. **Reports:** a script that generates the transcription-difference and divisions reports as
   Markdown for proofreading. No editing UI.
4. **Interface (labels only):** map the four statuses to the existing badge styles; link the
   colophon to the revision log; bibliography generated from citations. No redesign.
5. **Didache pilot** (§10), released as v0.2.0.
6. **Write the process up** as `docs/EDITORIAL.md`, reusable for every following work.

Deliberately out of scope: an editorial CMS, user accounts for editors, in-app error reporting,
manuscript image hosting, and any database. Git, pull requests, and the validator are enough at this
scale and grow with the library.
