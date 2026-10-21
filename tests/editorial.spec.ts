/** Editorial status labels (docs/EDITORIAL.md §9): wording only, nothing labelled verified. */
import { expect, test } from "@playwright/test";

test("reader labels the Didache as internally checked, never verified", async ({ page }) => {
  await page.goto("/works/didache/read/1");
  await expect(page.locator(".ed-head [data-status-line]")).toContainText("Internally checked transcription · not independently verified");
  await expect(page.locator(".ed-status")).toContainText("Internally checked transcription · not independently verified."); // in About this edition
  // Every "verified" is negated ("not independently verified", "unverified").
  const body = await page.locator("body").innerText();
  for (const m of body.matchAll(/verified/gi)) expect(body.slice(Math.max(0, m.index! - 18), m.index)).toMatch(/(not independently |un)$/i);
});

test("other texts keep their own status label", async ({ page }) => {
  await page.goto("/works/1-enoch/read/1");
  await expect(page.locator(".rd-sample")).toContainText("Unverified transcription");
});

test("placeholder overview is labelled as placeholder", async ({ page }) => {
  await page.goto("/works/didache");
  await expect(page.locator(".ov-head .sample")).toHaveText("Placeholder content · not research");
});

test("P.Oxy. 1782 is a draft record: parchment, with catalogue links and the open question", async ({ page }) => {
  await page.goto("/works/didache/manuscripts/p-oxy-1782");
  await expect(page.locator(".ov-head .sample")).toHaveText("Draft record · not yet reviewed");
  await expect(page.locator(".ov-facts")).toContainText("parchment");
  await expect(page.getByRole("link", { name: "University of Oxford record" })).toHaveAttribute("href", /portal\.sds\.ox\.ac\.uk/);
  await expect(page.locator(".ov-facts")).toContainText("Open question");
});

test("other manuscript records stay placeholders", async ({ page }) => {
  await page.goto("/works/didache/manuscripts/hierosolymitanus-54");
  await expect(page.locator(".ov-head .sample")).toHaveText("Placeholder record");
});
