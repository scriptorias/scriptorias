import { expect, test } from "@playwright/test";

test.describe("navigation", () => {
  test("library → collection → work overview → reader", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Christianity" })).toBeVisible();
    await expect(page.locator(".card.plain")).toHaveCount(7);
    await expect(page.locator(".card", { hasText: "Biblical Canon" })).toContainText("Multiple Canons");

    await page.getByRole("link", { name: /Early Christian Writings/ }).click();
    await expect(page).toHaveURL("/collections/early-christian");
    await expect(page.locator("h1.col-title")).toHaveText("Early Christian Writings");
    await expect(page.locator(".card.work")).toHaveCount(8);

    await page.getByRole("link", { name: "The Didache" }).click();
    await expect(page).toHaveURL("/works/didache");
    await expect(page.locator(".breadcrumb")).toContainText("Christianity");
    await expect(page.locator(".breadcrumb")).toContainText("Early Christian Writings");
    await expect(page.locator(".ov-facts")).toContainText("Koine Greek");

    await page.getByRole("link", { name: "Read This Work" }).click();
    await expect(page).toHaveURL(/\/works\/didache\/read/);
    await expect(page.locator(".rd-num")).toHaveText("1");
    await expect(page.locator(".rd-text")).toContainText("There are two ways");
    expect(errors).toEqual([]);
  });

  test("collection sorting by date and A–Z", async ({ page }) => {
    await page.goto("/collections/early-christian");
    const titles = () => page.locator(".card.work h3 a").allTextContents();
    expect((await titles())[0]).toBe("The Didache");
    await page.getByRole("button", { name: "A–Z" }).click();
    expect((await titles()).slice(0, 3)).toEqual(["1 Clement", "2 Clement", "The Didache"]);
    await page.reload();
    expect((await titles())[0]).toBe("1 Clement"); // sort choice persists
  });

  test("works can belong to several collections", async ({ page }) => {
    await page.goto("/collections/biblical-canon");
    await expect(page.locator(".card")).toHaveCount(7);
    await page.goto("/works/tobit");
    await expect(page.locator(".breadcrumb")).toContainText("Deuterocanonical Books");
  });

  test("grouped work lists its parts, and each part has its own page", async ({ page }) => {
    await page.goto("/works/ignatius");
    await page.getByRole("link", { name: "To the Romans" }).click();
    await expect(page).toHaveURL("/works/ignatius-romans");
    await expect(page.locator(".breadcrumb")).toContainText("Letters of Ignatius of Antioch");
  });

  test("pathway steps open passages by canonical reference", async ({ page }) => {
    await page.goto("/pathways");
    await expect(page.getByRole("heading", { name: "Explore Pathways" })).toBeVisible();
    await page.getByRole("link", { name: /The Watchers/ }).click();
    await page.getByRole("link", { name: /Jude 6, 14–15/ }).click();
    await expect(page).toHaveURL("/works/1-enoch/read/1/9");
    await expect(page.locator(".rd-actions-ref")).toHaveText("1 Enoch 1.9");
    await expect(page.locator("#s-1\\.9")).toHaveClass(/sel/);
  });

  test("search finds works and passages", async ({ page }) => {
    await page.goto("/search?q=hermon");
    await expect(page.locator(".hit")).toHaveCount(2);
    await page.locator(".hit").first().click();
    await expect(page).toHaveURL(/\/works\/1-enoch\/read\/6\?seg=6\.6/);
    await expect(page.locator("#s-6\\.6")).toHaveClass(/sel/);
  });

  test("unreleased libraries show Coming Soon", async ({ page }) => {
    await page.goto("/library/judaism");
    await expect(page.locator(".soon-page")).toContainText("Coming soon");
  });

  test("deep links load directly (clean URLs)", async ({ page }) => {
    for (const url of ["/works/didache", "/collections/deuterocanonical", "/works/didache/manuscripts/p-oxy-1782", "/home", "/about"]) {
      const res = await page.goto(url);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1").first()).toBeVisible();
    }
  });
});
