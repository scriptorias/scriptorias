/**
 * The Didache in Lightfoot & Harmer (1891), Greek and English: navigation, edition-aware
 * references (incl. the provisional 16.8 mapping), bookmarks, notes, legacy links and stored data
 * from the retired Wikisource text, status labels, notices and suspected-error reports.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const GRC = "lightfoot-1891-grc";
const EN = "lightfoot-1891-en";
const panel = (page: Page) => page.locator(".ed-panel");
const FORM = "https://github.com/scriptorias/scriptorias/issues/new?template=transcription-error.yml";

test("all 16 chapters in both languages; the English is the default", async ({ page }) => {
  await page.goto("/works/didache/read/1");
  await expect(page.locator("#rd")).toHaveAttribute("data-tr", EN);
  for (const tr of [EN, GRC]) {
    await page.goto(`/works/didache/read/1?tr=${tr}`);
    await page.getByRole("button", { name: "Contents" }).click();
    await expect(page.locator("#rd-toc .rd-toc a")).toHaveCount(16);
    await expect(page.locator("#rd-toc .rd-toc .off")).toHaveCount(0);
  }
});

test("chapter navigation through all chapters", async ({ page }) => {
  await page.goto(`/works/didache/read/1?tr=${GRC}`);
  for (let n = 2; n <= 16; n++) {
    await page.locator(".rd-pager .next").click();
    await expect(page).toHaveURL(`/works/didache/read/${n}`);
    await expect(page.locator(".rd-num")).toHaveText(String(n));
  }
  await expect(page.locator(".rd-end")).toHaveText("End of The Didache");
  await page.keyboard.press("ArrowLeft");
  await expect(page).toHaveURL("/works/didache/read/15");
});

test("Greek/English switching keeps the passage and the choice", async ({ page }) => {
  await page.goto(`/works/didache/read/16/8?tr=${EN}`);
  await expect(page.locator(".psg.sel")).toHaveAttribute("data-seg", "16.1h");
  await panel(page).getByRole("button", { name: /Read this passage in Greek \(16\.8\)/ }).click();
  await expect(page).toHaveURL("/works/didache/read/16/8");
  await expect(page.locator("#rd")).toHaveAttribute("data-tr", GRC);
  await expect(page.locator(".psg.sel")).toHaveAttribute("data-seg", "16.7");
  await page.reload();
  await expect(page.locator("#rd")).toHaveAttribute("data-tr", GRC);
  await page.getByRole("button", { name: "Contents" }).click();
  await page.locator("#rd-toc .rd-choice", { hasText: "Lightfoot & Harmer · English" }).click();
  await expect(page.locator("#rd")).toHaveAttribute("data-tr", EN);
});

test("Greek keeps Lightfoot's printed numbering: chapter XVI ends at verse 7", async ({ page }) => {
  await page.goto(`/works/didache/read/16?tr=${GRC}`);
  await expect(page.locator(".rd-text .pn")).toHaveText(["1", "2", "3", "4", "5", "6", "7"]);
  await expect(panel(page).locator("[data-edition-ref]")).toContainText("chapter XVI, printed verses 1–7, pp. 224–225");
  const last = page.locator('.psg[data-seg="16.7"]');
  await expect(last).toContainText("ἐρχόμενον ἐπάνω τῶν νεφελῶν τοῦ οὐρανοῦ");
  await expect(last).toHaveAttribute("data-ref", "didache.16.8");
  await expect(page.locator('.psg[data-seg="16.8"]')).toHaveCount(0);
});

test("16.8 maps into Lightfoot XVI.7, marked Provisional with the explanation", async ({ page }) => {
  await page.goto(`/works/didache/read/16/8?tr=${GRC}`);
  await expect(page.locator(".rd-actions-ref")).toHaveText("The Didache 16.8 · Lightfoot Greek XVI.7, p. 225 · provisional mapping");
  const row = panel(page).locator('[data-mapping-callout] tr[data-segs="16.7"]');
  await expect(row).toHaveAttribute("data-certainty", "uncertain");
  await expect(row).toContainText("Provisional");
  await expect(row).toContainText("Lightfoot prints no verse 8");
  await expect(row).toContainText("no verse 8 is inserted");
  await expect(row).toContainText("Lake 1912");
  await expect(page.locator('.pn[title*="XVI.7 = SCRIPTORIAS 16.8 (provisional mapping)"]')).toHaveCount(1);
  await expect(panel(page).locator('[data-question="chapter-16-numbering"]')).toContainText("Provisional");
  for (const v of ["6", "7"]) {
    await page.goto(`/works/didache/read/16/${v}?tr=${GRC}`);
    await expect(page.locator(".psg.sel")).toHaveAttribute("data-seg", "16.6");
  }
  const multi = panel(page).locator('[data-mapping-callout] tr[data-segs="16.6"]');
  await expect(multi).toContainText("one to many");
  await expect(multi).toContainText("16.7 begins “οὐ πάντων δέ”");
});

test("English verse numbers are a provisional editorial alignment; elsewhere chapters only", async ({ page }) => {
  await page.goto(`/works/didache/read/16?tr=${EN}`);
  await expect(page.locator(".rd-text .pn")).toHaveText(["[1]", "[2]", "[3]", "[4]", "[5]", "[6]", "[7]", "[8]"]);
  await expect(page.locator(".rd-text .pn.pn-editorial")).toHaveCount(8);
  await expect(page.locator(".rd-text .pn").first()).toHaveAttribute("title", /Editorial alignment.*Not Lightfoot's numbering/);
  await expect(panel(page)).toContainText("Verse numbers in [brackets] are an editorial alignment, not Lightfoot's; they are provisional.");
  await expect(panel(page).locator('tr[data-basis="editorial"]').first()).toContainText("Editorial alignment (not Lightfoot's numbering)");
  await page.locator(".rd-text .pn", { hasText: "[8]" }).click();
  await expect(page.locator(".rd-actions-ref")).toHaveText("The Didache 16.8 · Lightfoot English ch. 16, p. 235 · editorial alignment");
  await page.goto(`/works/didache/read/4?tr=${EN}`);
  await expect(page.locator(".rd-text p")).toHaveCount(4);
  await expect(page.locator(".rd-text .pn.pn-editorial")).toHaveCount(0);
  await page.locator(".rd-text .pn").nth(1).click();
  await expect(page.locator(".rd-actions-ref")).toHaveText("The Didache 4 · Lightfoot English ch. 4, ¶ 2, pp. 230–231");
  await expect(panel(page).locator("[data-mapping-callout]")).toContainText("many to one");
});

test("labels: internally checked, never verified; text release; provisional readings", async ({ page }) => {
  for (const tr of [GRC, EN]) {
    await page.goto(`/works/didache/read/3?tr=${tr}`);
    await expect(panel(page).locator(".ed-status")).toContainText("Internally checked transcription · not independently verified.");
    await expect(panel(page).locator("[data-preview]")).toHaveCount(0); // text release: no preview tag
    const body = (await page.locator("body").innerText()).toLowerCase();
    for (const m of body.matchAll(/verified/g)) expect(body.slice(Math.max(0, m.index! - 18), m.index)).toMatch(/(not independently |un)$/);
    expect(body).not.toMatch(/\bapproved\b|\bcleared\b|independently verified(?!\.)/);
  }
  await page.goto(`/works/didache/read/3?tr=${GRC}`);
  await expect(page.locator(".rd-text .unc")).toHaveText("⟦?ἄτερ⟧");
  await expect(panel(page).locator('[data-question="greek-3-10-ater"]')).toContainText("Provisional");
  await expect(page.locator(".rd-text .pb", { hasText: "[p. 219]" })).toBeVisible();
  await page.goto(`/works/didache/read/3?tr=${EN}`);
  await expect(panel(page).locator('[data-question="english-3-6-self-willed"]')).toBeVisible();
  await page.goto(`/works/didache/read/16?tr=${EN}`);
  await expect(panel(page).locator('[data-ocr-page="235"]')).toContainText("Page 235 was drafted from the Internet Archive's machine-read text and then corrected against both copies.");
  await page.goto(`/works/didache/read/4?tr=${GRC}`);
  await expect(panel(page).locator("[data-ocr-page]")).toHaveCount(0);
  await panel(page).getByText(/Edition differences in this chapter/).click();
  await expect(panel(page).locator('[data-section="differences"]')).toContainText("ποιήσεις");
});

test("notices: status line, public domain, sources, CC0, factual data; no Wikisource notice", async ({ page }) => {
  await page.goto(`/works/didache/read/1?tr=${GRC}`);
  await expect(panel(page).locator('[data-notice="status"]')).toHaveText(
    "Internally checked transcription · not independently verified. Readings and verse mappings marked Provisional are open questions, not established findings. Changes are listed in the correction history. Report a suspected error (requires a free GitHub account; reports are public).",
  );
  await expect(page.locator('[data-notice="public-domain"]')).toHaveText(
    "Public domain. This is a transcription of J. B. Lightfoot and J. R. Harmer, The Apostolic Fathers (London: Macmillan, 1891), Greek text, pp. 217–225. It is in the public domain in the United States, where it was published in 1891, and in the United Kingdom and the European Union, where copyright ended 70 years after the death of its last author (J. B. Lightfoot died in 1889, J. R. Harmer in 1944). Its status in other countries has not been assessed. SCRIPTORIAS claims no copyright in this text.",
  );
  await panel(page).getByText("Sources, provenance and correction history").click();
  const prov = panel(page).locator('[data-section="provenance"]');
  await expect(prov.locator('[data-notice="sources"]')).toContainText("Transcribed from page images of the Cornell University Library copy (a 1907 reprint of the second edition) and checked page by page against the University of Toronto copy (1891); no differences were found on these pages.");
  await expect(prov.locator('[data-notice="sources"]')).toContainText("The transcription was prepared with AI assistance and internally checked against the page images.");
  await expect(prov.getByRole("link", { name: "Cornell copy" })).toHaveAttribute("href", "https://archive.org/details/cu31924024254744");
  await expect(prov.getByRole("link", { name: "Toronto copy" })).toHaveAttribute("href", "https://archive.org/details/apostolicfathers00lighuoft");
  await expect(prov.getByRole("link", { name: "HathiTrust copy" })).toHaveAttribute("href", "https://hdl.handle.net/2027/uc2.ark:/13960/t7zk5j13p");
  await expect(prov.locator('[data-notice="factual"]')).toHaveText("Bibliographic details, page numbers, identifiers, checksums and reference correspondences are factual information. No rights are claimed in them.");
  await expect(prov.locator(".ed-hash")).toHaveCount(3);
  await expect(prov.locator(".ed-hash").first()).toHaveText(/^[0-9a-f]{64}$/);
  await expect(prov.locator("[data-revisions]")).toContainText("1.0");
  await expect(panel(page).locator('[data-notice="cc0"]').first()).toContainText("dedicated to the public domain under CC0 1.0 Universal");
  // No page images: provenance links out only.
  await expect(page.locator(".rd img, .ed-panel img")).toHaveCount(0);
  const imgLinks = await page.locator("a[href]").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href).filter((h) => /\.(jpe?g|png|tiff?)$|\/page\/n\d+/i.test(h)));
  expect(imgLinks).toEqual([]);
  await expect(page.locator("body")).not.toContainText("Wikisource, “Didache (Lightfoot translation)”");
  await page.getByRole("button", { name: "Notes and connections" }).click();
  await expect(page.locator('#rd-notes [data-notice="cc0"]')).toBeVisible();
});

test("report a suspected error: chapter link and selection link with prefilled fields", async ({ page }) => {
  await page.goto(`/works/didache/read/16/8?tr=${GRC}`);
  const chapterHref = await panel(page).locator("[data-report]").getAttribute("href");
  expect(chapterHref!.startsWith(FORM + "&")).toBe(true);
  const ch = new URL(chapterHref!);
  expect(ch.searchParams.get("work")).toBe("didache");
  expect(ch.searchParams.get("edition")).toBe("Lightfoot & Harmer · Greek, The Apostolic Fathers (1891), Greek text, pp. 217–225");
  expect(ch.searchParams.get("ref")).toMatch(/^16 http:\/\/localhost:\d+\/works\/didache\/read\/16\?tr=lightfoot-1891-grc$/);
  expect(chapterHref).toContain("edition=Lightfoot%20%26%20Harmer%20%C2%B7%20Greek"); // URL-encoded, spaces as %20
  const link = page.locator(".rd-actions [data-report]");
  await expect(link).toContainText("Report a suspected error");
  await expect(link).toContainText("(requires a free GitHub account; reports are public)");
  const sel = new URL((await link.getAttribute("href"))!);
  expect(sel.searchParams.get("template")).toBe("transcription-error.yml");
  expect(sel.searchParams.get("ref")).toMatch(/^16\.8 \(Lightfoot Greek XVI\.7, p\. 225 · provisional mapping\) http:\/\/localhost:\d+\/works\/didache\/read\/16\/8\?tr=lightfoot-1891-grc$/);
  // A paragraph without verse alignment reports its anchor.
  await page.goto(`/works/didache/read/4?tr=${EN}`);
  await page.locator(".rd-text .pn").nth(1).click();
  const para = new URL((await page.locator(".rd-actions [data-report]").getAttribute("href"))!);
  expect(para.searchParams.get("ref")).toMatch(/^4 \(Lightfoot English ch\. 4, ¶ 2, pp\. 230–231\) .*\/works\/didache\/read\/4\?seg=4\.2&tr=lightfoot-1891-en$/);
  expect(para.searchParams.get("edition")).toBe("Lightfoot & Harmer · English, The Apostolic Fathers (1891), English translation, pp. 229–235");
});

test("stable passage URLs: verse, edition segment, and chapter", async ({ page }) => {
  await page.goto(`/works/didache/read/1/3?tr=${GRC}`);
  await expect(page.locator(".psg.sel")).toHaveAttribute("data-seg", "1.3");
  await page.goto(`/works/didache/read/1/3?tr=${EN}`);
  await expect(page.locator(".psg.sel")).toHaveAttribute("data-seg", "1.1c");
  await page.goto(`/works/didache/read/16?tr=${GRC}&seg=16.7`);
  await expect(page.locator(".rd-actions-ref")).toContainText("Lightfoot Greek XVI.7");
  await page.goto("/works/didache/read/16");
  await expect(page.locator(".rd-num")).toHaveText("16");
});

test("bookmarks: verse, editorial verse and paragraph bookmarks persist and reopen", async ({ page }) => {
  await page.goto(`/works/didache/read/16?tr=${GRC}`);
  await page.locator(".rd-text .pn", { hasText: "7" }).click();
  await page.locator(".rd-actions").getByRole("button", { name: "Bookmark" }).click();
  await page.goto(`/works/didache/read/4?tr=${EN}`);
  await page.locator(".rd-text .pn").nth(1).click();
  await page.locator(".rd-actions").getByRole("button", { name: "Bookmark" }).click();
  await page.reload();
  await expect(page.locator('.psg[data-seg="4.2"]')).toHaveClass(/marked/);
  await page.goto("/bookmarks");
  await expect(page.locator(".row")).toHaveCount(2);
  await page.locator(".row", { hasText: "16.8" }).click();
  await expect(page).toHaveURL(/\/works\/didache\/read\/16\/8/);
  await expect(page.locator(".psg.sel")).toHaveAttribute("data-seg", "16.7");
  await page.goto("/bookmarks");
  await page.locator(".row", { hasText: "The Didache 4" }).click();
  await expect(page.locator("#rd")).toHaveAttribute("data-tr", EN);
  await expect(page.locator(".psg.sel")).toHaveAttribute("data-seg", "4.2");
});

test("notes attach to SCRIPTORIAS refs in both languages", async ({ page }) => {
  for (const tr of [GRC, EN]) {
    await page.goto(`/works/didache/read/1?tr=${tr}`);
    await page.getByRole("button", { name: "Notes on The Didache 1.3" }).click();
    await expect(page.locator("#rd-notes")).toHaveClass(/open/);
    await expect(page.locator('.rd-note-group[data-for="didache.1.3"]')).toHaveClass(/on/);
  }
});

test("retired translation ids in links open the same passage in the new editions", async ({ page }) => {
  await page.goto("/works/didache/read/1?seg=1.7&tr=lightfoot");
  await expect(page).toHaveURL(`/works/didache/read/1/3?tr=${EN}`);
  await expect(page.locator(".psg.sel")).toHaveAttribute("data-ref", "didache.1.3");
  await page.goto("/works/didache/read/2?seg=2.3&tr=lightfoot");
  await expect(page).toHaveURL(`/works/didache/read/2?seg=2.1&tr=${EN}`);
  await expect(page.locator(".psg.sel")).toContainText("the double tongue is a snare of death");
  await page.goto("/works/didache/read/1/5?tr=lightfoot");
  await expect(page).toHaveURL(`/works/didache/read/1/5?tr=${EN}`);
  await page.goto("/works/didache/read/16/8?tr=lightfoot-greek");
  await expect(page).toHaveURL(`/works/didache/read/16/8?tr=${GRC}`);
  await expect(page.locator(".psg.sel")).toHaveAttribute("data-seg", "16.7");
  await page.goto("/works/didache/read/3?n=1");
  await expect(page).toHaveURL(`/works/didache/read/3?seg=3.1&tr=${EN}`);
  await expect(page.locator(".psg.sel")).toContainText("flee from every evil");
});

test("stored v2 data keyed to the retired id migrates to the same passages", async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem("sc.seeded")) return;
    localStorage.setItem("sc.seeded", "1");
    localStorage.setItem("sc.schema", "2");
    localStorage.setItem("sc.bookmarks", JSON.stringify([
      { ref: "didache.2", work: "didache", ch: 2, anchor: "lightfoot:2.3", tr: "lightfoot", at: 1 },
      { ref: "didache.1.5", work: "didache", ch: 1, tr: "lightfoot", at: 2 },
      { ref: "didache.2", work: "didache", ch: 2, anchor: "lightfoot:2.5", tr: "lightfoot", at: 3 },
      { ref: "1-enoch.1.9", work: "1-enoch", ch: 1, tr: "charles", at: 4 },
    ]));
    localStorage.setItem("sc.rd.tr.didache", JSON.stringify("lightfoot"));
    localStorage.setItem("sc.rd.pos.didache", JSON.stringify({ ch: 1, anchor: "lightfoot:1.10" }));
  });
  await page.goto("/bookmarks");
  await expect(page.getByRole("heading", { name: "Bookmarks" })).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("sc.bookmarks")!));
  expect(stored.map((b: { ref: string; anchor?: string; tr?: string }) => [b.ref, b.anchor ?? null, b.tr ?? null])).toEqual([
    ["didache.2", `${EN}:2.1`, EN],
    ["didache.1.5", null, EN],
    ["1-enoch.1.9", null, "charles"],
  ]);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("sc.rd.tr.didache")!))).toBe(EN);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("sc.rd.pos.didache")!))).toEqual({ ch: 1, anchor: `${EN}:1.1d` });
  expect(await page.evaluate(() => localStorage.getItem("sc.schema"))).toBe("3");
  // The resume position reopens at the same passage (Wikisource segment 1.10 = verse 1.4).
  await page.goto("/works/didache/read");
  await expect(page.locator(".rd-num")).toHaveText("1");
  await expect(page.locator("#s-1\\.1d")).toBeInViewport();
  await page.goto("/bookmarks");
  await page.locator(".row", { hasText: "The Didache 2" }).click();
  await expect(page.locator(".psg.sel")).toContainText("the double tongue is a snare of death");
  await expect(page.locator(".rd-actions").getByRole("button", { name: "Bookmarked" })).toBeVisible();
});

test("work page lists the two editions and no Wikisource text", async ({ page }) => {
  await page.goto("/works/didache");
  await expect(page.locator(".ov-item", { hasText: "Lightfoot & Harmer · Greek" })).toContainText("Read");
  await expect(page.locator(".ov-item", { hasText: "Lightfoot & Harmer · English" })).toContainText("Read");
  await expect(page.locator(".ov-item", { hasText: "Wikisource" })).toHaveCount(0);
});

test("accessibility: Didache reader has no serious axe violations", async ({ page }) => {
  for (const url of [`/works/didache/read/16?tr=${GRC}`, `/works/didache/read/16/8?tr=${EN}`]) {
    await page.goto(url);
    await page.locator(".ed-details summary").first().click();
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`);
    expect(serious, url).toEqual([]);
  }
});
