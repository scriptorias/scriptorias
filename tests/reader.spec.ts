import { expect, test } from "@playwright/test";

test.describe("reader", () => {
  test("chapter navigation: pager, keyboard, contents", async ({ page }) => {
    await page.goto("/works/didache/read/1");
    await page.locator(".rd-pager .next").click();
    await expect(page).toHaveURL("/works/didache/read/2");
    await expect(page.locator(".rd-num")).toHaveText("2");
    await page.keyboard.press("ArrowRight");
    await expect(page).toHaveURL("/works/didache/read/3");
    await expect(page.locator(".rd-end")).toHaveText("Chapter 4 is not in this sample");
    await expect(page.locator(".rd-num")).toHaveText("3");
    await page.keyboard.press("ArrowLeft");
    await expect(page).toHaveURL("/works/didache/read/2");
    await page.getByRole("button", { name: "Contents" }).click();
    await expect(page.locator("#rd-toc")).toHaveClass(/open/);
    await page.locator("#rd-toc").getByRole("link", { name: "Chapter 1" }).click();
    await expect(page).toHaveURL("/works/didache/read/1");
  });

  test("canonical verse numbers and notes panel", async ({ page }) => {
    await page.goto("/works/didache/read/1");
    await expect(page.locator(".rd-text .pn")).toHaveText(["1", "2", "3", "4", "5", "6"]);
    await page.getByRole("button", { name: "Notes on The Didache 1.3" }).click();
    await expect(page.locator("#rd-notes")).toHaveClass(/open/);
    await expect(page.locator('.rd-note-group[data-for="didache.1.3"]')).toHaveClass(/on/);
    await expect(page.locator("#rd-notes")).toContainText("Epistle of Barnabas 18–20");
  });

  test("passage bookmark and chapter bookmark persist across reloads", async ({ page }) => {
    await page.goto("/works/didache/read/1");
    await page.locator(".rd-text .pn", { hasText: "3" }).click();
    await expect(page.locator(".rd-actions-ref")).toHaveText("The Didache 1.3");
    await page.locator(".rd-actions").getByRole("button", { name: "Bookmark" }).click();
    await page.getByRole("button", { name: "Bookmark this chapter" }).click();
    await page.reload();
    await expect(page.getByRole("button", { name: "Bookmark this chapter" })).toHaveClass(/marked/);
    await page.goto("/bookmarks");
    await expect(page.locator(".row")).toHaveCount(2);
    await expect(page.locator(".rows")).toContainText("The Didache 1.3");
    await page.locator(".row", { hasText: "The Didache 1.3" }).click();
    await expect(page).toHaveURL(/\/works\/didache\/read\/1\/3(\?tr=lightfoot)?$/);
    await expect(page.locator(".rd-actions-ref")).toHaveText("The Didache 1.3");
  });

  test("unaligned passages bookmark at chapter level with an anchor", async ({ page }) => {
    await page.goto("/works/didache/read/2");
    await page.locator(".rd-text .pn", { hasText: /^3$/ }).click();
    await expect(page.locator(".rd-actions-ref")).toHaveText("The Didache 2 · J. B. Lightfoot 2.3");
    await page.locator(".rd-actions").getByRole("button", { name: "Bookmark" }).click();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("sc.bookmarks")!));
    expect(stored[0]).toMatchObject({ ref: "didache.2", anchor: "lightfoot:2.3", work: "didache", ch: 2 });
  });

  test("text size, line spacing, and theme persist", async ({ page }) => {
    await page.goto("/works/didache/read/1");
    await page.getByRole("button", { name: "Reading settings" }).click();
    await page.getByRole("button", { name: "Larger text" }).click();
    await page.getByRole("button", { name: "Airy" }).click();
    await page.getByRole("button", { name: "Dark" }).click();
    await page.reload();
    await expect(page.locator("#rd")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("#rd")).toHaveAttribute("style", /--rd-size: 20px/);
    await expect(page.locator("#rd")).toHaveAttribute("style", /--rd-leading: 1.95/);
  });

  test("continue reading and progress", async ({ page }) => {
    await page.goto("/works/1-enoch/read/6");
    await expect(page.locator(".rd-text")).toContainText("children of men");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await page.goto("/home");
    await expect(page.locator(".continue")).toContainText("1 Enoch · Chapter 6");
    await page.locator(".continue").click();
    await expect(page).toHaveURL("/works/1-enoch/read/6");
    await page.getByRole("button", { name: "Contents" }).click();
    await expect(page.locator(".rd-count")).toHaveText("1 of 108 read");
  });

  test("works without text show the reading placeholder", async ({ page }) => {
    await page.goto("/works/1-clement/read");
    await expect(page.locator(".soon-page")).toContainText("Reading view coming soon");
  });
});
