/**
 * Accessibility checks (axe-core, WCAG 2.1 A/AA rules) on the main views, desktop and mobile.
 * Intentionally de-emphasised, non-actionable items are excluded from the contrast rule only:
 * unreleased libraries ("Coming soon"), planned editions, and chapters outside the sample.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const DISABLED = [".lib.off", ".nav a.off", ".rd-choice.off", ".rd-toc .off"];

async function audit(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
    .analyze();
  let contrastBuilder = new AxeBuilder({ page }).withRules(["color-contrast"]);
  for (const sel of DISABLED) contrastBuilder = contrastBuilder.exclude(sel);
  const contrast = await contrastBuilder.analyze();
  const serious = [...results.violations.filter((v) => v.id !== "color-contrast"), ...contrast.violations]
    .filter((v) => v.impact === "serious" || v.impact === "critical" || v.id === "heading-order" || v.id === "landmark-unique");
  return serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`);
}

const VIEWS: [string, string?][] = [
  ["/"],
  ["/home"],
  ["/collections/early-christian"],
  ["/collections/biblical-canon"],
  ["/works/didache"],
  ["/works/didache/manuscripts/p-oxy-1782"],
  ["/pathways"],
  ["/pathways/the-watchers"],
  ["/search?q=hermon"],
  ["/bookmarks"],
  ["/library/judaism"],
  ["/works/didache/read/1"],
  ["/works/didache/read/1", "panels"],
  ["/works/didache/read/1", "dark"],
  ["/works/didache/read/1", "selection"],
  ["/works/1-enoch/read/5"],
];

for (const [path, state] of VIEWS) {
  test(`a11y ${path}${state ? ` (${state})` : ""}`, async ({ page, isMobile }) => {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    if (state === "panels") {
      await page.getByRole("button", { name: "Contents" }).click();
      if (!isMobile) await page.getByRole("button", { name: "Notes and connections" }).click();
    }
    if (state === "dark") {
      await page.getByRole("button", { name: "Text settings" }).click();
      await page.getByRole("button", { name: "Dark" }).click();
      await page.keyboard.press("Escape");
    }
    if (state === "selection") await page.locator(".rd-text .pn", { hasText: "3" }).click();
    await page.waitForTimeout(350); // panel transitions
    expect(await audit(page)).toEqual([]);
  });
}
