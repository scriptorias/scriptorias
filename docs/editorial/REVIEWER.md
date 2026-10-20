# External reviewer: qualifications and scope of work

Scriptorias is a digital library of ancient religious and historical texts. We are looking for an
external reviewer for the **Didache** pilot. The publisher appoints the reviewer; this brief
describes the role.

## Qualifications

Required:
- Doctorate (or doctoral candidacy at an advanced stage) in early Christian studies, patristics,
  New Testament, or classics with a focus on early Christian literature.
- Reading knowledge of Koine and patristic Greek sufficient to check a printed Greek text and its
  apparatus line by line.
- Working familiarity with textual criticism: editions, apparatus, witnesses, and how verse
  divisions differ between editions.
- Familiarity with the Apostolic Fathers and the Didache scholarship (e.g. the editions of
  Bryennios, Harnack, Lake, Rordorf–Tuilier, Holmes; commentaries such as Niederwimmer).

Helpful:
- Experience with papyrology or manuscript catalogues (P.Oxy. XV 1782; Codex Hierosolymitanus 54).
- Some acquaintance with the Coptic and Ethiopic witnesses, or a willingness to flag where a
  specialist is needed.
- Prior editorial or peer-review work on editions or translations.

Conflicts of interest are disclosed. The reviewer may hold scholarly positions on disputed
questions; the site presents disputes as named positions, so review checks fairness and citation,
not agreement.

## Scope of work (Didache pilot)

| Item | Task | Evidence provided | Output |
|---|---|---|---|
| 1. Greek text (Bryennios 1883) | Proofread our transcription against the page scans; confirm it preserves the print; assess each proposed correction | scans, transcription, difference report, `corrections.json` | pass / changes requested per chapter; decision per correction |
| 2. English text (Lightfoot & Harmer 1891) | Proofread against the page scans | scans, transcription, difference report | pass / changes requested per chapter |
| 3. Verse divisions | Confirm chapter and verse boundaries for 1–16 against at least two editions; review recorded disagreements | verse table, divisions report | approved table or corrections |
| 4. Alignment | Check that each English segment maps to the right Greek verses | alignment file, side-by-side view | pass / corrections |
| 5. Overview claims | Check dates, authorship, origin, genre, canonical status, manuscript summary and disputes against the cited sources | overview with citations and locators | per-claim result |
| 6. Manuscript records | Check descriptions of H54, P.Oxy. 1782, BL Or. 9271 and the versions, especially the ending (ch. 16) | records with sources | per-record result |

Out of scope: rights and licensing (legal review is separate), design, and code.

## How review is recorded

Each result becomes a review entry: reviewer, date, tier A, aspect, sections, the editions
checked against (with pages), method, result, and notes. The reviewer can work in whatever format
is convenient (annotated PDF, spreadsheet, or pull-request comments); we transcribe the results
into the record and the reviewer confirms them. The reviewer is credited by name on reviewed
texts unless they prefer otherwise.

## Estimated effort

The Didache is short (16 chapters; nine printed pages of Greek in Lightfoot & Harmer). Items 1–4 are perhaps 10–20 hours;
items 5–6 perhaps 5–10 hours, depending on how much needs correction. Terms and compensation are
set by the publisher.
