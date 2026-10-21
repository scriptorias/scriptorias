/** Reader-facing labels (docs/EDITORIAL.md §9) and the suspected-error report URL. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { transcriptionLabel } from "../../src/content/labels";
import { reportUrl } from "../../src/content/notices";

const ed = (transcription: "unchecked" | "proofread" | "editor-reviewed") => ({ content: "authentic" as const, transcription, reviews: [] });

test("status labels follow EDITORIAL.md §9", () => {
  assert.equal(transcriptionLabel(ed("unchecked")), "Unverified transcription");
  assert.equal(transcriptionLabel(ed("proofread")), "Internally checked transcription · not independently verified");
  assert.equal(transcriptionLabel(ed("editor-reviewed")), "Independently verified");
});

test("report URL opens the issue form with URL-encoded work, edition and ref", () => {
  const u = reportUrl({ work: "didache", edition: "Lightfoot & Harmer · Greek", ref: "16.8 (XVI.7) https://x/works/didache/read/16/8?tr=lightfoot-1891-grc" });
  assert.equal(u, "https://github.com/scriptorias/scriptorias/issues/new?template=transcription-error.yml&work=didache&edition=Lightfoot%20%26%20Harmer%20%C2%B7%20Greek&ref=16.8%20(XVI.7)%20https%3A%2F%2Fx%2Fworks%2Fdidache%2Fread%2F16%2F8%3Ftr%3Dlightfoot-1891-grc");
  const p = new URL(u).searchParams;
  assert.equal(p.get("template"), "transcription-error.yml");
  assert.equal(p.get("edition"), "Lightfoot & Harmer · Greek");
});

test("report URL field ids match the issue form", async () => {
  const fs = await import("node:fs");
  const form = fs.readFileSync(new URL("../../.github/ISSUE_TEMPLATE/transcription-error.yml", import.meta.url), "utf8");
  for (const id of ["work", "edition", "ref"]) assert.match(form, new RegExp(`\\n    id: ${id}\\n`));
});
