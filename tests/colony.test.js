import test from "node:test";
import assert from "node:assert/strict";
import {
  freshGame,
  validateSave,
  dispatchColony,
  getColonyReport,
  simulateSol,
  weatherFor,
  workerCapacity,
  repairCost,
  campaignObjectives,
} from "../src/game/colony.js";

function action(game, payload) {
  const result = dispatchColony(game, payload);
  assert.notEqual(result.game, game, result.message);
  return result.game;
}
function loop() {
  let game = freshGame("survival");
  for (const [buildingType, x, z] of [
    ["solar", 8, 0],
    ["extractor", 0, 8],
    ["greenhouse", 8, 8],
    ["mine", -8, 0],
    ["research", -8, 8],
    ["solar", 16, 0],
    ["solar", 16, 8],
  ])
    game = action(game, { type: "place", buildingType, x, z });
  for (const [from, to] of [
    [1, 2],
    [1, 3],
    [3, 4],
    [1, 5],
    [5, 6],
    [2, 7],
    [4, 8],
  ])
    game = action(game, { type: "connect", kind: "power", from, to });
  for (const [from, to] of [
    [3, 1],
    [3, 4],
  ])
    game = action(game, { type: "connect", kind: "water", from, to });
  for (const [from, to] of [
    [1, 3],
    [3, 4],
    [1, 5],
    [5, 6],
  ])
    game = action(game, { type: "connect", kind: "corridor", from, to });
  for (const id of [3, 4, 5, 6])
    game = action(game, { type: "assign", id, workers: 1 });
  return game;
}

test("starts safely paused; rejected actions cannot mutate state or spend funds", () => {
  const game = freshGame("survival");
  assert.equal(game.paused, true);
  const snapshot = structuredClone(game);
  for (const payload of [
    { type: "place", buildingType: "constructor", x: 8, z: 0 },
    { type: "place", buildingType: "solar", x: NaN, z: 0 },
    { type: "place", buildingType: "solar", x: 1, z: 0 },
    { type: "place", buildingType: "solar", x: 0, z: 0 },
    { type: "place", buildingType: "solar", x: 80, z: 0 },
    { type: "assign", id: 1, workers: -1 },
    { type: "policy", key: "__proto__", value: true },
    { type: "research", id: "missing" },
    { type: "claim" },
  ])
    assert.equal(dispatchColony(game, payload).game, game);
  assert.deepEqual(game, snapshot);
  assert.ok(getColonyReport(game).alerts.some((a) => a.id === "onboarding"));
});

test("v2 migration preserves buildings and funds; v3 round trip preserves operations", () => {
  const old = freshGame();
  old.version = 2;
  old.buildings.push({ id: 2, type: "solar", level: 10, x: 8, z: 0 });
  old.nextId = 3;
  delete old.links;
  delete old.energyStorage;
  delete old.policies;
  delete old.campaign;
  const migrated = validateSave(old);
  assert.equal(migrated.version, 3);
  assert.equal(migrated.paused, true);
  assert.equal(migrated.buildings[1].level, 10);
  assert.equal(migrated.buildings[1].condition, 100);
  assert.deepEqual(migrated.resources, old.resources);
  assert.ok(migrated.links.length > 0);
  const game = loop();
  const restored = validateSave(JSON.parse(JSON.stringify(game)));
  assert.deepEqual(restored.buildings, game.buildings);
  assert.deepEqual(restored.links, game.links);
  assert.deepEqual(restored.energyStorage, game.energyStorage);
  assert.equal(getColonyReport(restored).byBuilding[4].operating, true);
  assert.equal(
    validateSave({
      ...game,
      links: [{ id: 1, kind: "power", from: 1, to: 999 }],
    }),
    null,
  );
  assert.equal(validateSave({ ...game, links: [null] }), null);
  assert.equal(
    validateSave({
      ...game,
      buildings: [game.buildings[0], game.buildings[0]],
    }),
    null,
  );
  assert.equal(validateSave({ ...game, energyStorage: { 1: Infinity } }), null);
});

test("utilities gate production, workers need corridors, resource transactions are atomic", () => {
  let game = loop();
  const snapshot = structuredClone(game);
  assert.ok(getColonyReport(game).byBuilding[4].production > 0);
  const pipe = game.links.find(
    (l) => l.kind === "water" && [l.from, l.to].includes(4),
  );
  const disconnected = action(game, { type: "disconnect", id: pipe.id });
  assert.equal(getColonyReport(disconnected).byBuilding[4].production, 0);
  const cord = game.links.find(
    (l) => l.kind === "corridor" && [l.from, l.to].includes(6),
  );
  const isolated = action(game, { type: "disconnect", id: cord.id });
  assert.equal(getColonyReport(isolated).byBuilding[6].effectiveWorkers, 0);
  assert.equal(
    dispatchColony(isolated, { type: "assign", id: 6, workers: 1 }).game,
    isolated,
  );
  assert.equal(
    dispatchColony(game, { type: "assign", id: 6, workers: 2 }).game,
    game,
  );
  assert.equal(
    dispatchColony(game, { type: "assign", id: 6, workers: 0.5 }).game,
    game,
  );
  assert.deepEqual(game, snapshot);
  const request = { type: "connect", kind: "power", from: 1, to: 2 };
  assert.equal(
    dispatchColony(game, request).game,
    game,
    "duplicate cable rejected",
  );
  const noPower = {
    ...game,
    links: game.links.filter(
      (l) => !(l.kind === "power" && [l.from, l.to].includes(3)),
    ),
  };
  assert.equal(getColonyReport(noPower).byBuilding[3].production, 0);
});

test("an isolated solar island cannot charge another island through the total resource counter", () => {
  const game = freshGame();
  game.resources.energy = 0;
  game.energyStorage = { 1: 0 };
  game.buildings.push(
    { id: 2, type: "solar", level: 1, x: 8, z: 0, condition: 16, workers: 0 },
    {
      id: 3,
      type: "solar",
      level: 10,
      x: -24,
      z: 0,
      condition: 100,
      workers: 0,
    },
    {
      id: 4,
      type: "research",
      level: 1,
      x: 0,
      z: 8,
      condition: 100,
      workers: 0,
    },
  );
  game.nextId = 5;
  game.links = [
    { id: 1, kind: "power", from: 1, to: 2 },
    { id: 2, kind: "power", from: 1, to: 4 },
  ];
  game.nextLinkId = 3;
  const report = getColonyReport(game);
  assert.equal(report.byBuilding[4].operating, false);
  assert.match(report.byBuilding[4].reason, /this power grid/);
  const advanced = simulateSol(game);
  assert.ok(advanced.energyStorage[3] > 0);
  assert.equal(getColonyReport(advanced).byBuilding[4].operating, false);
});

test("forecast is deterministic; paid preparation reduces damage and recovers storm yield", () => {
  let game = loop();
  game.sol = 10;
  const before = structuredClone(game);
  const unprepared = simulateSol(game);
  game = action(game, { type: "policy", key: "stormPrep", value: true });
  const prepared = simulateSol(game);
  assert.equal(weatherFor(10).kind, "storm");
  assert.deepEqual(weatherFor(10), weatherFor(26));
  assert.ok(
    prepared.buildings[1].condition > unprepared.buildings[1].condition,
  );
  assert.ok(prepared.resources.energy > unprepared.resources.energy);
  assert.equal(prepared.campaign.preparedStormSols, 1);
  assert.deepEqual(before.buildings, game.buildings);
  const dry = { ...game, resources: { ...game.resources, metal: 0 } };
  assert.equal(getColonyReport(dry).policies.stormPrep.active, false);
  assert.ok(getColonyReport(dry).alerts.some((a) => a.id === "policy"));
});

test("maintenance charges exactly once, restores output, and rejects unfunded repairs", () => {
  let game = loop();
  game.buildings[2].condition = 10;
  assert.equal(getColonyReport(game).byBuilding[3].operating, false);
  const cost = repairCost(game.buildings[2]).metal;
  const poor = { ...game, resources: { ...game.resources, metal: 0 } };
  assert.equal(dispatchColony(poor, { type: "repair", id: 3 }).game, poor);
  const repaired = action(game, { type: "repair", id: 3 });
  assert.equal(repaired.resources.metal, game.resources.metal - cost);
  assert.equal(repaired.buildings[2].condition, 100);
  assert.equal(getColonyReport(repaired).byBuilding[3].operating, true);
  assert.equal(
    dispatchColony(repaired, { type: "repair", id: 3 }).game,
    repaired,
  );
});

test("healthcare and recreation consume upkeep and aid recovering colonists without permanent death spirals", () => {
  const game = loop();
  game.colony.health = 70;
  game.colony.morale = 60;
  const ordinary = simulateSol(game);
  const supported = simulateSol({
    ...game,
    policies: { healthcare: true, recreation: true, stormPrep: false },
  });
  assert.ok(supported.colony.health > ordinary.colony.health);
  assert.ok(supported.colony.morale > ordinary.colony.morale);
  assert.ok(supported.resources.food < ordinary.resources.food);
  let failed = freshGame();
  failed.resources.food = 0;
  failed.resources.water = 0;
  for (let i = 0; i < 40; i++) failed = simulateSol(failed);
  assert.equal(failed.colony.population, 4);
  assert.equal(failed.colony.health, 10);
  assert.ok(getColonyReport(failed).alerts.some((a) => a.id === "health"));
});

test("sandbox with survival off preserves resources, buildings and reports zero next-sol rates", () => {
  const game = loop();
  game.mode = "sandbox";
  game.sandboxSurvival = false;
  const next = simulateSol(game);
  assert.deepEqual(next.resources, game.resources);
  assert.deepEqual(next.buildings, game.buildings);
  assert.equal(next.sol, game.sol + 1);
  assert.equal(getColonyReport(game).simulationActive, false);
  assert.ok(Object.values(getColonyReport(game).rates).every((n) => n === 0));
});

test("self sufficiency streak only starts once eight colonists are supported", () => {
  let game = loop();
  game.buildings[0].level = 2;
  game.campaign.selfSufficientSols = 0;
  game = simulateSol(game);
  assert.equal(game.campaign.selfSufficientSols, 0);
  game.colony.population = 8;
  game = simulateSol(game);
  assert.equal(game.campaign.selfSufficientSols, 1);
});

test("campaign can complete through legal placement and actions; rewards cannot replay", () => {
  let game = loop();
  game = action(game, { type: "upgrade", id: 1 });
  game = action(game, { type: "policy", key: "stormPrep", value: true });
  const completed = [];
  for (let i = 0; i < 70 && !getColonyReport(game).campaign.finished; i++) {
    let report = getColonyReport(game);
    while (report.campaign.current?.complete) {
      const id = report.campaign.current.id;
      assert.ok(!completed.includes(id));
      completed.push(id);
      game = action(game, { type: "claim" });
      report = getColonyReport(game);
    }
    if (!game.technologies.solarEfficiency && game.resources.research >= 100)
      game = action(game, { type: "research", id: "solarEfficiency" });
    for (const b of game.buildings)
      if (b.condition < 80) game = action(game, { type: "repair", id: b.id });
    game = action(game, { type: "advance" });
    assert.ok(
      Object.entries(game.resources).every(
        ([, n]) => Number.isFinite(n) && n >= 0,
      ),
    );
    assert.equal(validateSave(JSON.parse(JSON.stringify(game)))?.version, 3);
  }
  const report = getColonyReport(game);
  assert.equal(
    report.campaign.finished,
    true,
    JSON.stringify({
      sol: game.sol,
      pop: game.colony.population,
      current: report.campaign.current,
      rates: report.rates,
    }),
  );
  assert.equal(completed.length, campaignObjectives(game).length);
  assert.equal(dispatchColony(game, { type: "claim" }).game, game);
  assert.equal(workerCapacity(game.buildings[0]), 0);
});
