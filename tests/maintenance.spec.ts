import { expect, test } from "@playwright/test";

test.describe("v0.1.1 maintenance fixes", () => {
  test("nonexistent chapters show Not Found instead of another chapter", async ({ page }) => {
    for (const url of ["/works/didache/read/99", "/works/didache/read/0", "/works/didache/read/abc", "/works/1-enoch/read/109"]) {
      await page.goto(url);
      await expect(page.getByRole("heading", { name: "Not found" }), url).toBeVisible();
      await expect(page.locator(".rd-text"), url).toHaveCount(0);
    }
  });

  test("chapters outside the edition's coverage explain why", async ({ page }) => {
    await page.goto("/works/didache/read/4");
    await expect(page.locator(".soon-page")).toContainText("Chapter 4 is not available in this edition yet");
    await page.getByRole("link", { name: "Read from chapter 1" }).click();
    await expect(page).toHaveURL("/works/didache/read/1");
    await expect(page.locator(".rd-num")).toHaveText("1");
  });

  test("reader back link and passage actions have accessible names", async ({ page }) => {
    await page.goto("/works/didache/read/1");
    await expect(page.getByRole("link", { name: "Back to The Didache overview" })).toBeVisible();
    await page.locator(".rd-text .pn", { hasText: "3" }).click();
    for (const name of ["Bookmark", "Copy citation", "Notes", "Clear selection"]) {
      await expect(page.locator(".rd-actions").getByRole("button", { name, exact: true })).toBeVisible();
    }
  });

  test("no horizontal overflow at 320px", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 320, height: 640 } });
    const page = await ctx.newPage();
    for (const url of ["/", "/home", "/collections/early-christian", "/works/didache", "/works/didache/read/1", "/pathways/the-watchers", "/search?q=hermon"]) {
      await page.goto(url);
      await expect(page.locator("h1").first()).toBeVisible();
      const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
      expect(sw, url).toBeLessThanOrEqual(iw);
    }
    await ctx.close();
  });
});
