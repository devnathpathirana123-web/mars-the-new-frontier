import { test, expect } from "@playwright/test";

const SAVE_KEY = "mars-new-frontier-save-v2";

test.beforeEach(({ page }) => {
  page.setDefaultTimeout(15000);
});

async function savedGame(page) {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)),
    SAVE_KEY,
  );
}

async function seedColony(
  page,
  {
    buildings = ["solar", "extractor", "greenhouse", "mine", "research"],
    links = [],
    damaged = null,
  } = {},
) {
  await page.goto("/");
  await page.evaluate(
    async ({ key, types, links, damaged }) => {
      const { freshGame, dispatchColony } = await import("/src/game/colony.js");
      let game = freshGame("survival");
      const coordinates = {
        solar: [8, 0],
        extractor: [8, 8],
        greenhouse: [0, 8],
        mine: [-8, 8],
        research: [-8, 0],
      };
      for (const buildingType of types) {
        const [x, z] = coordinates[buildingType];
        const result = dispatchColony(game, {
          type: "place",
          buildingType,
          x,
          z,
        });
        if (result.game === game)
          throw new Error(`Fixture construction rejected: ${result.message}`);
        game = result.game;
      }
      for (const link of links) {
        const result = dispatchColony(game, { type: "connect", ...link });
        if (result.game === game)
          throw new Error(`Fixture link rejected: ${result.message}`);
        game = result.game;
      }
      game.paused = true;
      if (damaged)
        game.buildings = game.buildings.map((b) =>
          b.id === damaged.id ? { ...b, condition: damaged.condition } : b,
        );
      localStorage.setItem(key, JSON.stringify(game));
    },
    { key: SAVE_KEY, types: buildings, links, damaged },
  );
  await page.reload();
  await expect(page.locator("canvas")).toBeVisible();
  await expect.poll(async () => (await savedGame(page))?.version).toBe(3);
}

async function openOperations(page, section) {
  await page.getByRole("button", { name: "OPERATIONS", exact: true }).click();
  await page.getByRole("tab", { name: section, exact: true }).click();
}

test("new survival colonies wait for the player and Escape cancels construction", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "START SURVIVAL COLONY" }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "RESUME SIMULATION" }),
  ).toBeVisible();
  await expect.poll(async () => (await savedGame(page))?.paused).toBe(true);
  await page.getByRole("button", { name: "BUILD", exact: true }).click();
  await page.getByRole("button", { name: /Solar Array.*LVL/ }).click();
  await expect(
    page.getByRole("button", { name: "CANCEL CONSTRUCTION" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "CANCEL CONSTRUCTION" }),
  ).toHaveCount(0);
  expect((await savedGame(page)).buildings).toHaveLength(1);
  expect(errors).toEqual([]);
});

async function connectUtility(page, kind, from, to) {
  await page.getByRole("button", { name: kind, exact: true }).click();
  await page
    .getByLabel("From building", { exact: true })
    .selectOption(String(from));
  await page
    .getByLabel("To building", { exact: true })
    .selectOption(String(to));
  await page
    .getByRole("button", { name: "Connect utility", exact: true })
    .click();
}

test("utility controls connect a working food loop and persist it across reload", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await seedColony(page, { buildings: ["solar", "extractor", "greenhouse"] });
  const before = await savedGame(page);
  expect(before.links).toHaveLength(0);
  await openOperations(page, "Utilities");
  await connectUtility(page, "Power", 2, 1);
  await expect.poll(async () => (await savedGame(page)).links.length).toBe(1);
  await connectUtility(page, "Power", 2, 3);
  await connectUtility(page, "Power", 2, 4);
  await connectUtility(page, "Water", 3, 4);
  await expect.poll(async () => (await savedGame(page)).links.length).toBe(4);
  const connected = await savedGame(page);
  expect(connected.resources.metal).toBeLessThan(before.resources.metal);
  const greenhouse = await page.evaluate(async (key) => {
    const { getColonyReport } = await import("/src/game/colony.js");
    return getColonyReport(
      JSON.parse(localStorage.getItem(key)),
    ).buildings.find((b) => b.id === 4);
  }, SAVE_KEY);
  expect(greenhouse.powered).toBe(true);
  expect(greenhouse.waterConnected).toBe(true);
  expect(greenhouse.production).toBeGreaterThan(0);
  await page.reload();
  await expect(page.locator("canvas")).toBeVisible();
  expect((await savedGame(page)).links).toEqual(connected.links);
  expect(errors).toEqual([]);
});

test("the campaign rewards a completed objective once and survives reload", async ({
  page,
}) => {
  await seedColony(page, {
    buildings: ["solar"],
    links: [{ kind: "power", from: 2, to: 1 }],
  });
  await openOperations(page, "Mission");
  const before = await savedGame(page);
  await page.getByRole("button", { name: "Claim reward", exact: true }).click();
  await expect
    .poll(async () => JSON.stringify((await savedGame(page)).campaign))
    .not.toBe(JSON.stringify(before.campaign));
  const claimed = await savedGame(page);
  expect(claimed.resources.metal).toBeGreaterThan(before.resources.metal);
  await expect(
    page.getByRole("button", { name: "Claim reward", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(page.locator("canvas")).toBeVisible();
  expect((await savedGame(page)).campaign).toEqual(claimed.campaign);
  expect((await savedGame(page)).resources).toEqual(claimed.resources);
});

test("crew assignments, care policies, and repairs persist through actual controls", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await seedColony(page, {
    links: [{ kind: "corridor", from: 1, to: 6 }],
    damaged: { id: 6, condition: 70 },
  });
  await openOperations(page, "Crew");
  await page
    .getByRole("button", {
      name: "Assign worker to Research Centre #6",
      exact: true,
    })
    .click();
  await expect
    .poll(
      async () =>
        (await savedGame(page)).buildings.find((b) => b.id === 6).workers,
    )
    .toBe(1);
  await page.getByRole("checkbox", { name: "Healthcare", exact: true }).check();
  await page.getByRole("checkbox", { name: "Recreation", exact: true }).check();
  await page.getByRole("tab", { name: "Maintenance", exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Storm preparation", exact: true })
    .check();
  await expect
    .poll(async () => (await savedGame(page)).policies)
    .toEqual({ healthcare: true, recreation: true, stormPrep: true });
  await page.getByRole("tab", { name: "Maintenance", exact: true }).click();
  const beforeRepair = await savedGame(page);
  await page
    .getByRole("button", { name: "Repair Research Centre #6", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (await savedGame(page)).buildings.find((b) => b.id === 6).condition,
    )
    .toBe(100);
  const afterRepair = await savedGame(page);
  expect(afterRepair.resources.metal).toBe(beforeRepair.resources.metal - 8);
  await expect(
    page.getByRole("button", {
      name: "Repair Research Centre #6",
      exact: true,
    }),
  ).toBeDisabled();
  await page.reload();
  await expect(page.locator("canvas")).toBeVisible();
  const restored = await savedGame(page);
  expect(restored.policies).toEqual(afterRepair.policies);
  expect(restored.buildings.find((b) => b.id === 6).workers).toBe(1);
  expect(restored.buildings.find((b) => b.id === 6).condition).toBe(100);
  expect(errors).toEqual([]);
});

test("mobile layout keeps the map and operations controls usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedColony(page, { buildings: ["solar"] });
  // R3F sizes its canvas asynchronously through ResizeObserver.
  await expect
    .poll(async () => (await page.locator("canvas").boundingBox())?.width)
    .toBeGreaterThan(250);
  await expect
    .poll(async () => (await page.locator("canvas").boundingBox())?.height)
    .toBeGreaterThan(200);
  await openOperations(page, "Utilities");
  await expect(page.getByLabel("From building", { exact: true })).toBeVisible();
  await connectUtility(page, "Power", 2, 1);
  await expect.poll(async () => (await savedGame(page)).links.length).toBe(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
});

async function projectWorldPoint(page, point) {
  return page.evaluate(async ([x, y, z]) => {
    const { PerspectiveCamera, Vector3 } =
      await import("/node_modules/.vite/deps/three.js");
    const bounds = document.querySelector("canvas").getBoundingClientRect();
    const camera = new PerspectiveCamera(
      50,
      bounds.width / bounds.height,
      0.1,
      1000,
    );
    camera.position.set(35, 45, 55);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    const position = new Vector3(x, y, z).project(camera);
    return {
      x: bounds.left + ((position.x + 1) * bounds.width) / 2,
      y: bounds.top + ((1 - position.y) * bounds.height) / 2,
    };
  }, point);
}

test("surface clicks build a facility and draw a cable between buildings", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await seedColony(page, { buildings: [] });
  await expect
    .poll(async () => (await page.locator("canvas").boundingBox())?.height)
    .toBeGreaterThan(500);
  await page.getByRole("button", { name: "BUILD", exact: true }).click();
  await page.getByRole("button", { name: /Solar Array.*LVL/ }).click();
  const plot = await projectWorldPoint(page, [8, 0, 0]);
  await page.mouse.move(plot.x, plot.y);
  await expect(page.locator(".mars-plot-readout")).toContainText(
    "Solar Array · 8, 0",
  );
  await page.mouse.click(plot.x, plot.y);
  await expect
    .poll(async () => (await savedGame(page)).buildings.length)
    .toBe(2);
  expect(
    (await savedGame(page)).buildings.find((b) => b.type === "solar"),
  ).toMatchObject({ x: 8, z: 0 });
  await openOperations(page, "Utilities");
  await page
    .getByRole("button", { name: "Draw cable on surface", exact: true })
    .click();
  const solar = await projectWorldPoint(page, [8, 2, 0]);
  const habitat = await projectWorldPoint(page, [0, 2, 0]);
  await page.mouse.click(solar.x, solar.y);
  await expect(page.locator(".mars-link-hint")).toContainText(/destination/i);
  await page.mouse.click(habitat.x, habitat.y);
  await expect.poll(async () => (await savedGame(page)).links.length).toBe(1);
  expect((await savedGame(page)).links[0]).toMatchObject({
    kind: "power",
    from: 2,
    to: 1,
  });
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", {
      name: "Cancel surface connection",
      exact: true,
    }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});
