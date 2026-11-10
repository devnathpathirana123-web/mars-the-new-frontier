import { test, expect } from "@playwright/test";

const maxima = {
  Habitat: 15,
  Greenhouse: 10,
  Research: 15,
  Mine: 15,
  Water: 15,
  Solar: 10,
};

async function review(page, name, level, animated = false) {
  await page.evaluate(
    ([n, l, a]) => window.reviewModel(n, l, a),
    [name, level, animated],
  );
  await page.waitForFunction(
    ([n, l]) =>
      window.modelReport?.name === n && window.modelReport?.level === l,
    [name, level],
  );
  return page.evaluate(() => window.modelReport);
}

function checkBounds(report) {
  for (const n of [...report.min, ...report.max])
    expect(Number.isFinite(n)).toBe(true);
  expect(report.min[1]).toBeCloseTo(0, 3);
  for (const axis of [0, 2]) {
    expect(report.min[axis]).toBeGreaterThanOrEqual(-3.45 - 0.001);
    expect(report.max[axis]).toBeLessThanOrEqual(3.45 + 0.001);
  }
}

test("all 80 upgrades fit their plots, stay grounded, and change visibly", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/tests/model-review.html");
  await page.waitForFunction(() => !!window.modelReport);
  let checked = 0;
  for (const [name, max] of Object.entries(maxima)) {
    let previous = "";
    for (let level = 1; level <= max; level++) {
      const report = await review(page, name, level);
      checkBounds(report);
      expect(
        report.signature,
        `${name} ${level} must add or refine geometry`,
      ).not.toBe(previous);
      expect(report.meshes).toBeLessThan(500);
      expect(report.triangles).toBeLessThan(100000);
      previous = report.signature;
      checked++;
    }
  }
  expect(checked).toBe(80);
  expect(errors).toEqual([]);
});

test("moving equipment stays inside its plot", async ({ page }) => {
  await page.goto("/tests/model-review.html");
  await page.waitForFunction(() => !!window.modelReport);
  for (const name of ["Mine", "Water", "Research", "Solar"]) {
    await review(page, name, maxima[name], true);
    // Exercise multiple poses, not just the mount-time bounds.
    for (let i = 0; i < 8; i++) {
      await page.evaluate((t) => {
        window.modelTime = t;
      }, i * 17);
      await page.waitForTimeout(100);
      checkBounds(await page.evaluate(() => window.animatedBounds));
    }
  }
});

test("game loads and preserves its existing save format", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "START SANDBOX COLONY" }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForFunction(
    () => !!localStorage.getItem("mars-new-frontier-save-v2"),
  );
  const buildings = [
    { id: 1, type: "habitat", level: 15, x: -8, z: 0 },
    { id: 2, type: "greenhouse", level: 10, x: 0, z: 0 },
    { id: 3, type: "research", level: 15, x: 8, z: 0 },
    { id: 4, type: "mine", level: 15, x: -8, z: 8 },
    { id: 5, type: "extractor", level: 15, x: 0, z: 8 },
    { id: 6, type: "solar", level: 10, x: 8, z: 8 },
  ];
  await page.evaluate((items) => {
    const save = JSON.parse(localStorage.getItem("mars-new-frontier-save-v2"));
    save.buildings = items;
    save.nextId = 7;
    save.paused = true;
    localStorage.setItem("mars-new-frontier-save-v2", JSON.stringify(save));
  }, buildings);
  await page.reload();
  await expect(page.locator("canvas")).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("mars-new-frontier-save-v2")),
  );
  expect(saved.version).toBe(2);
  expect(saved.buildings).toEqual(buildings);
  await expect(
    page.getByRole("button", { name: /Habitat LVL 15 MAX/ }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("oversized off-center geometry is fitted and grounded", async ({
  page,
}) => {
  await page.goto("/tests/model-review.html");
  await page.waitForFunction(() => !!window.modelReport);
  const report = await review(page, "Oversized", 1);
  checkBounds(report);
  expect(report.max[2] - report.min[2]).toBeCloseTo(6.9, 3);
  expect(report.min[1]).toBeCloseTo(0, 3);
});
