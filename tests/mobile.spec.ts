import { expect, test } from "@playwright/test";

test.describe("mobile", () => {
  test("tab bar, drawer, and reader tools", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".tabbar")).toBeVisible();
    await page.locator(".tabbar").getByText("More").click();
    await expect(page.locator(".app")).toHaveClass(/drawer/);
    await page.locator(".sidebar").getByRole("link", { name: "Pathways" }).click();
    await expect(page).toHaveURL("/pathways");
    await expect(page.locator(".app")).not.toHaveClass(/drawer/);

    await page.locator(".topbar .mark").click();
    await expect(page).toHaveURL("/home");

    await page.goto("/works/didache/read/1");
    await expect(page.locator(".tabbar")).toBeHidden();
    await page.getByRole("button", { name: "Contents" }).click();
    await expect(page.locator("#rd-toc")).toHaveClass(/open/);
    await page.locator("#rd-toc").getByRole("link", { name: "Chapter 2" }).click();
    await expect(page).toHaveURL("/works/didache/read/2");
    await expect(page.locator("#rd-toc")).not.toHaveClass(/open/);

    // Passage actions keep accessible names when their text labels are hidden on phones.
    await page.goto("/works/didache/read/1");
    await page.locator(".rd-text .pn", { hasText: "3" }).click();
    await page.locator(".rd-actions").getByRole("button", { name: "Bookmark", exact: true }).click();
    await expect(page.locator(".rd-actions").getByRole("button", { name: "Bookmarked" })).toBeVisible();
    await expect(page.locator(".rd-actions").getByRole("button", { name: "Copy citation" })).toBeVisible();
  });
});
