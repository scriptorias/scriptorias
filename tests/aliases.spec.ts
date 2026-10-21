/**
 * Reference aliases in the browser. Runs only against the fixture build
 * (npm run build:alias-fixture), which adds invented aliases from tests/fixtures/ref-aliases.json:
 * didache.1.7 → didache.1.6 and didache.1.8 → didache.1.3. Production content has no aliases.
 */
import { expect, test, type Page } from "@playwright/test";

const seed = (page: Page, bookmarks: object[]) =>
  page.addInitScript((b) => {
    localStorage.setItem("sc.schema", "2");
    localStorage.setItem("sc.bookmarks", JSON.stringify(b));
  }, bookmarks);

test("an old verse URL redirects to the current ref and selects it", async ({ page }) => {
  await page.goto("/works/didache/read/1/7");
  await expect(page).toHaveURL(/\/works\/didache\/read\/1\/6(\?|$)/);
  await expect(page.locator(".rd-actions-ref")).toContainText("The Didache 1.6");
});

test("an old verse URL keeps the chosen translation", async ({ page }) => {
  await page.goto("/works/didache/read/1/8?tr=lightfoot-1891-grc");
  await expect(page).toHaveURL(/\/works\/didache\/read\/1\/3\?tr=lightfoot-1891-grc/);
});

test("current refs are not redirected", async ({ page }) => {
  await page.goto("/works/didache/read/1/5");
  await expect(page).toHaveURL(/\/works\/didache\/read\/1\/5$/);
});

test("a bookmark saved under an old ref shows and opens the current ref", async ({ page }) => {
  await seed(page, [{ ref: "didache.1.7", work: "didache", ch: 1, tr: "lightfoot", at: 1 }]);
  await page.goto("/bookmarks");
  const row = page.locator(".row").first();
  await expect(row.locator("h2")).toHaveText("The Didache 1.6");
  await row.click();
  await expect(page).toHaveURL(/\/works\/didache\/read\/1\/6/);
  await expect(page.locator(".rd-actions-ref")).toContainText("The Didache 1.6");
  await expect(page.getByRole("button", { name: "Bookmarked", exact: true })).toBeVisible();
  await expect(page.locator(".rd-text .psg.marked").first()).toBeVisible();
});

test("removing an aliased bookmark from the reader removes the stored entry", async ({ page }) => {
  await seed(page, [{ ref: "didache.1.7", work: "didache", ch: 1, tr: "lightfoot", at: 1 }]);
  await page.goto("/works/didache/read/1/6");
  await page.getByRole("button", { name: "Bookmarked", exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("sc.bookmarks") ?? "[]").length)).toBe(0);
});
