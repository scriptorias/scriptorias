/**
 * Regression tests for upgrading prototype bookmarks (Wikisource segment numbering) to canonical
 * references. Expected verses come from the cross-check in docs/REFERENCES.md (Lake 1912 and
 * the Greek text), not from the app's own alignment file.
 */
import { expect, test, type Browser, type Page } from "@playwright/test";

// Lightfoot/Wikisource segment in Didache chapter 1 → verse (Lake 1912 / Greek text)
const CH1_EXPECTED: Record<number, number> = {
  1: 1, 2: 2, 3: 2, 4: 2, 5: 2, 6: 3, 7: 3, 8: 3, 9: 4, 10: 4, 11: 4, 12: 4, 13: 4,
  14: 5, 15: 5, 16: 5, 17: 5, 18: 5, 19: 5, 20: 5, 21: 5, 22: 6, 23: 6,
};

type Legacy = Record<string, unknown>;
async function seeded(browser: Browser, bookmarks: Legacy[], extra: Record<string, unknown> = {}): Promise<Page> {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await ctx.newPage();
  await page.addInitScript(({ bookmarks, extra }) => {
    if (localStorage.getItem("sc.seeded")) return;
    localStorage.setItem("sc.seeded", "1");
    localStorage.setItem("sc.bookmarks", JSON.stringify(bookmarks));
    for (const [k, v] of Object.entries(extra)) localStorage.setItem(k, JSON.stringify(v));
  }, { bookmarks, extra });
  return page;
}
const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("sc.bookmarks")!));
const legacyDidache = (ch: number, n: number, at = n) => ({ ref: `didache.${ch}.${n}`, work: "didache", ch, n: String(n), tr: "lightfoot", at });

test.describe("legacy bookmark migration", () => {
  test("every Didache 1 segment maps to the verse that contains it", async ({ browser }) => {
    for (const [n, verse] of Object.entries(CH1_EXPECTED)) {
      const page = await seeded(browser, [legacyDidache(1, Number(n))]);
      await page.goto("/bookmarks");
      expect((await stored(page))[0], `segment 1.${n}`).toMatchObject({ ref: `didache.1.${verse}`, work: "didache", ch: 1 });
      expect((await stored(page))[0].anchor, `segment 1.${n} needs no anchor`).toBeUndefined();
      await page.context().close();
    }
  });

  const cases: { name: string; legacy: Legacy; ref: string; anchor?: string; phrase: string }[] = [
    { name: "Didache seg 1.7 → 1.3", legacy: legacyDidache(1, 7), ref: "didache.1.3", phrase: "Bless them that curse you" },
    { name: "Didache seg 1.10 → 1.4", legacy: legacyDidache(1, 10), ref: "didache.1.4", phrase: "blow on thy right cheek" },
    { name: "Didache seg 1.23 → 1.6", legacy: legacyDidache(1, 23), ref: "didache.1.6", phrase: "Let thine alms sweat" },
    { name: "Didache seg 2.3 (unaligned) → chapter + anchor", legacy: legacyDidache(2, 3), ref: "didache.2", anchor: "lightfoot:2.3", phrase: "the double tongue is a snare of death" },
    { name: "Didache seg 3.1 (unaligned) → chapter + anchor", legacy: legacyDidache(3, 1), ref: "didache.3", anchor: "lightfoot:3.1", phrase: "flee from every evil" },
    { name: "1 Enoch 1.9 (Charles verse) unchanged", legacy: { ref: "1-enoch.1.9", work: "1-enoch", ch: 1, n: "9", tr: "main", at: 1 }, ref: "1-enoch.1.9", phrase: "ten thousands of His holy ones" },
    { name: "1 Enoch 5.b (sub-verse) → parent verse 5.6", legacy: { ref: "1-enoch.5.b", work: "1-enoch", ch: 5, n: "b", tr: "main", at: 1 }, ref: "1-enoch.5.6", phrase: "And by you shall all who curse, curse" },
  ];

  for (const c of cases) {
    test(`preserves the intended passage: ${c.name}`, async ({ browser }) => {
      const page = await seeded(browser, [c.legacy]);
      await page.goto("/bookmarks");
      const [b] = await stored(page);
      expect(b.ref).toBe(c.ref);
      expect(b.anchor).toBe(c.anchor);
      // Opening the bookmark selects a passage containing the originally bookmarked words.
      await page.locator(".row").first().click();
      await expect(page.locator(".rd-actions")).toBeVisible();
      await expect(page.locator(".psg.sel").first()).toBeVisible();
      expect((await page.locator(".psg.sel").allTextContents()).join(" ")).toContain(c.phrase);
      // …and the reader shows it as bookmarked.
      await expect(page.locator(".rd-actions").getByRole("button", { name: "Bookmarked" })).toBeVisible();
      await page.context().close();
    });
  }

  test("segments in the same verse collapse to one bookmark (first kept)", async ({ browser }) => {
    const page = await seeded(browser, [legacyDidache(1, 8, 30), legacyDidache(1, 6, 10), legacyDidache(1, 7, 20), legacyDidache(1, 10, 40)]);
    await page.goto("/bookmarks");
    const bs = await stored(page);
    expect(bs.map((b: { ref: string }) => b.ref)).toEqual(["didache.1.3", "didache.1.4"]);
    expect(bs[0].at).toBe(30); // the first entry in stored order is kept
    await page.context().close();
  });

  test("a migrated bookmark can be removed from the reader without duplicating", async ({ browser }) => {
    const page = await seeded(browser, [legacyDidache(1, 7)]);
    await page.goto("/works/didache/read/1/3");
    const btn = page.locator(".rd-actions").getByRole("button", { name: "Bookmarked" });
    await expect(btn).toBeVisible();
    await btn.click();
    expect(await stored(page)).toEqual([]);
    await page.context().close();
  });

  test("migration runs once and is stable across reloads", async ({ browser }) => {
    const page = await seeded(browser, [legacyDidache(1, 7), { work: "1-enoch", ch: 6 }]);
    await page.goto("/bookmarks");
    const first = await stored(page);
    await page.reload();
    expect(await stored(page)).toEqual(first);
    expect(await page.evaluate(() => localStorage.getItem("sc.schema"))).toBe("2");
    await page.context().close();
  });

  test("legacy resume position reopens at the same passage", async ({ browser }) => {
    const page = await seeded(browser, [], { "sc.rd.pos.didache": { ch: 1, ref: "didache.1.14" } });
    await page.goto("/works/didache/read");
    await expect(page.locator(".rd-num")).toHaveText("1");
    await expect(page.locator("#s-1\\.14")).toBeInViewport();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("sc.rd.pos.didache")!))).toMatchObject({ ch: 1 });
    await page.context().close();
  });
});
