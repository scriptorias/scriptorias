/** Editorial status labels (docs/EDITORIAL.md §9): wording only, nothing labelled verified. */
import { expect, test } from "@playwright/test";

test("reader labels the transcription as unverified, never verified", async ({ page }) => {
  await page.goto("/works/didache/read/1");
  await expect(page.locator(".rd-sample")).toContainText("Sample passage · Chapters 1–3 of 16 · Unverified transcription");
  await expect(page.locator("body")).not.toContainText(/\bverified\b(?! transcription)/i);
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
