import { test, expect } from "@playwright/test";
async function project(page, point) {
  const box = await page.locator("canvas").boundingBox();
  return page.evaluate(
    async ({ box, point }) => {
      const T = await import("/node_modules/three/build/three.module.js");
      const camera = new T.PerspectiveCamera(
        50,
        box.width / box.height,
        0.1,
        1000,
      );
      camera.position.set(35, 45, 55);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();
      const v = new T.Vector3(...point).project(camera);
      return {
        x: box.x + ((v.x + 1) * box.width) / 2,
        y: box.y + ((1 - v.y) * box.height) / 2,
      };
    },
    { box, point },
  );
}
const saved = (page) =>
  page.evaluate(() =>
    JSON.parse(localStorage.getItem("mars-new-frontier-save-v2")),
  );
async function setup(page) {
  await page.goto("/");
  await page.evaluate(async () => {
    const { freshGame, dispatchColony } = await import("/src/game/colony.js");
    let g = freshGame("survival");
    g = dispatchColony(g, {
      type: "place",
      buildingType: "mine",
      x: 8,
      z: 0,
    }).game;
    localStorage.setItem("mars-new-frontier-save-v2", JSON.stringify(g));
  });
  await page.reload();
  await expect
    .poll(async () => (await page.locator("canvas").boundingBox())?.height)
    .toBeGreaterThan(400);
  const p = await project(page, [8, 2, 0]);
  await page.mouse.click(p.x, p.y);
  await expect(
    page.getByRole("button", { name: "MOVE BUILDING", exact: true }),
  ).toBeVisible();
}
test("move by dragging, cancel safely, confirm demolition and persist layout", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await setup(page);
  await page
    .getByRole("button", { name: "MOVE BUILDING", exact: true })
    .click();
  const source = await project(page, [8, 0.25, 0]),
    target = await project(page, [16, 0.25, 0]);
  await page.mouse.move(source.x, source.y);
  await page.mouse.down();
  await page.mouse.move(target.x, target.y, { steps: 12 });
  await page.mouse.up();
  await expect
    .poll(async () => (await saved(page)).buildings.find((b) => b.id === 2).x)
    .toBe(16);
  await page.reload();
  await expect
    .poll(async () => (await page.locator("canvas").boundingBox())?.height)
    .toBeGreaterThan(400);
  const p = await project(page, [16, 2, 0]);
  await page.mouse.click(p.x, p.y);
  await page
    .getByRole("button", { name: "MOVE BUILDING", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Cancel move" })).toHaveCount(
    0,
  );
  const before = await saved(page);
  page.once("dialog", (d) => d.dismiss());
  await page
    .getByRole("button", { name: "DEMOLISH BUILDING", exact: true })
    .click();
  expect((await saved(page)).buildings).toEqual(before.buildings);
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "DEMOLISH BUILDING", exact: true })
    .click();
  await expect.poll(async () => (await saved(page)).buildings.length).toBe(1);
  await page.reload();
  expect((await saved(page)).buildings.length).toBe(1);
  expect(errors).toEqual([]);
});

test("menu exposes saves, export/import, title continuation and support toggle", async ({
  page,
}) => {
  await setup(page);
  await page.getByRole("button", { name: "MENU", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "SAVE NOW", exact: true }).click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "EXPORT SAVE FILE", exact: true })
    .click();
  expect((await download).suggestedFilename()).toContain(".json");
  await page.getByLabel("Show adaptive support pillars").uncheck();
  const before = await saved(page);
  page.once("dialog", (d) => d.accept());
  await page
    .getByLabel("Import colony save")
    .setInputFiles({
      name: "colony.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({ ...before, sol: 7 })),
    });
  await expect.poll(async () => (await saved(page)).sol).toBe(7);
  await page.getByRole("button", { name: "MENU", exact: true }).click();
  await page
    .getByRole("button", { name: "RETURN TO TITLE", exact: true })
    .click();
  await page
    .getByRole("button", { name: "CONTINUE SAVED COLONY", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "MENU", exact: true }),
  ).toBeVisible();
  expect((await saved(page)).sol).toBe(7);
});
