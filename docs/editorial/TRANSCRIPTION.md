# Transcription workflow

How a text is prepared from page scans. Demonstrated on Didache chapter 1 (Lightfoot & Harmer
1891, English p. 229 and Greek pp. 217–218) on 2026-10-21.

## Where the work lives

While rights are open, transcriptions, scan images and difference reports are kept in a
**private, local-only working area** (`~/scriptorias-private/`, git history, no remote). They are
not committed to this public repository, not deployed, and not on the preview. They move here
only after the publisher clears rights for the text (docs/EDITORIAL.md §5).

## Steps (per chapter, per edition)

1. **Fetch scans** of every physical copy available (e.g. Toronto and Cornell copies of the same
   printing). Record repository, identifier, image index, printed page and SHA-256 checksum.
   Check the page identification. Published leaf maps can be off by one (Cornell's is).
2. **Transcribe by eye** from the cleanest copy, line by line at full resolution, enlarging
   anything small (Greek accents, breathings, subscripts, punctuation). Never copy a digitization.
3. **Check against the second copy** of the same printing, to separate print features from damage
   in one copy (e.g. broken type).
4. **Compare with independent witnesses** using `tools/diff.py` (word, punctuation and italic
   tokens):
   - an OCR of the same edition (same text; differences are OCR errors or our mistakes);
   - other digitizations and other editions (differences may be genuine).
5. **Settle every difference on the scan** and classify it: our mistake (fixed), the other
   witness's mistake, a genuine edition difference, a print feature or defect, or
   structure/typography only.
6. **Record** in the chapter notes: pages, copies, typography (italic, uncial type), marginalia,
   uncertainties, normalizations. Put proposed corrections in `corrections.json`. The text stays as
   printed.
7. **Divisions**: list each edition's chapter/verse structure and check verse openings against our
   reference scheme. Anything not checked against the base text stays provisional.

Conventions (markup, normalizations) are in the working area's `CONVENTIONS.md` and will be
copied into each translation's `transcriptionPolicy` when imported.

## Status labels

A chapter that has passed steps 1–7 can be `proofread` (first pass, by the assistant). Only a
qualified reviewer can make it `editor-reviewed`. The pilot texts are not imported yet.
