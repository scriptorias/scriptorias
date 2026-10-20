import { expect, test } from "@playwright/test";

test.describe("prototype data and links", () => {
  test("legacy bookmarks, positions, and translation prefs are upgraded", async ({ page }) => {
    await page.addInitScript(() => {
      if (localStorage.getItem("sc.seeded")) return;
      localStorage.setItem("sc.seeded", "1");
      localStorage.setItem("sc.bookmarks", JSON.stringify([
        { work: "1-enoch", ch: 6 },                                                            // oldest format: chapter
        { ref: "didache.1.7", work: "didache", ch: 1, n: "7", tr: "lightfoot", at: 1 },        // Wikisource segment 7
        { ref: "didache.2.3", work: "didache", ch: 2, n: "3", tr: "lightfoot", at: 2 },        // unaligned chapter
        { ref: "1-enoch.1.9", work: "1-enoch", ch: 1, n: "9", tr: "main", at: 3 },             // Charles verse
        { ref: "1-enoch.5.b", work: "1-enoch", ch: 5, n: "b", tr: "main", at: 4 },             // sub-verse label
      ]));
      localStorage.setItem("sc.rd.pos.didache", JSON.stringify({ ch: 1, ref: "didache.1.10" }));
      localStorage.setItem("sc.rd.tr.1-enoch", JSON.stringify("main"));
    });
    await page.goto("/bookmarks");
    await expect(page.getByRole("heading", { name: "Bookmarks" })).toBeVisible(); // rendered after migration
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("sc.bookmarks")!));
    expect(stored.map((b: { ref: string; anchor?: string }) => [b.ref, b.anchor ?? null])).toEqual([
      ["1-enoch.6", null],
      ["didache.1.3", null],
      ["didache.2", "lightfoot:2.3"],
      ["1-enoch.1.9", null],
      ["1-enoch.5.6", null],
    ]);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("sc.rd.pos.didache")!))).toEqual({ ch: 1, anchor: "lightfoot:1.10" });
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("sc.rd.tr.1-enoch")!))).toBe("charles");
    expect(await page.evaluate(() => localStorage.getItem("sc.schema"))).toBe("2");
    await expect(page.locator(".row")).toHaveCount(5);
  });

  test("legacy hash links redirect to clean URLs", async ({ page }) => {
    const cases: [string, RegExp][] = [
      ["/#/c/early-christian", /\/collections\/early-christian$/],
      ["/#/w/didache", /\/works\/didache$/],
      ["/#/w/1-enoch/read/1/9", /\/works\/1-enoch\/read\/1\/9$/],
      ["/#/w/didache/read/1/7", /\/works\/didache\/read\/1\?n=7$/],
      ["/#/w/didache/ms/p-oxy-1782", /\/works\/didache\/manuscripts\/p-oxy-1782$/],
      ["/#/path/the-watchers", /\/pathways\/the-watchers$/],
      ["/#/search/hermon", /\/search\?q=hermon$/],
      ["/#/home", /\/home$/],
    ];
    for (const [from, to] of cases) {
      await page.goto(from);
      await expect(page).toHaveURL(to);
    }
    await page.goto("/#/w/didache/read/1/7");
    await expect(page.locator(".rd-actions-ref")).toHaveText("The Didache 1.3"); // segment 7 lies in verse 3
  });
});
