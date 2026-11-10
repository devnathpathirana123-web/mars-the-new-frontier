import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_LINK_LENGTH,
  NETWORK_KINDS,
  migrateLegacyLinks,
  networkStatus,
  terrainProfile,
  validateLink,
} from "../src/game/networks.js";

const buildings = [
  { id: 1, type: "habitat", x: 0, z: 0 },
  { id: 2, type: "solar", x: 8, z: 0 },
  { id: 3, type: "extractor", x: 16, z: 0 },
  { id: 4, type: "greenhouse", x: 16, z: 8 },
];
const link = (id, kind, from, to) => ({ id, kind, from, to });

test("utility routes reject dangling, duplicate, over-range, self and obstructed connections", () => {
  const game = { buildings, links: [link(1, "power", 1, 2)] };
  assert.equal(
    validateLink(game, { kind: "power", from: 2, to: 1 }).valid,
    false,
  );
  assert.equal(
    validateLink(game, { kind: "power", from: 1, to: 1 }).valid,
    false,
  );
  assert.equal(
    validateLink(game, { kind: "power", from: 1, to: 99 }).valid,
    false,
  );
  assert.equal(
    validateLink(game, { kind: "gas", from: 1, to: 2 }).valid,
    false,
  );
  assert.match(
    validateLink(game, { kind: "power", from: 1, to: 3 }).reason,
    /crosses building #2/,
  );
  const distant = {
    buildings: [...buildings, { id: 5, type: "mine", x: 80, z: 80 }],
    links: [],
  };
  assert.equal(
    validateLink(distant, { kind: "power", from: 1, to: 5 }).valid,
    false,
  );
  const allowed = validateLink(game, { kind: "water", from: 1, to: 2 });
  assert.equal(allowed.valid, true);
  assert.equal(allowed.length, 8);
  assert.deepEqual(allowed.cost, { metal: 7 });
});

test("power reaches relays, and water requires an extractor with a live power connection", () => {
  const game = {
    buildings,
    links: [link(1, "power", 2, 3), link(2, "water", 3, 4)],
  };
  let status = networkStatus(game);
  assert.equal(status.byBuilding[4].water, true);
  assert.equal(status.byBuilding[4].power, false);
  assert.equal(status.byBuilding[1].corridor, true);
  assert.equal(status.byBuilding[4].corridor, false);
  game.links.push(link(3, "power", 3, 4));
  status = networkStatus(game);
  assert.deepEqual(status.connected.power, [2, 3, 4]);
  game.links = game.links.filter((l) => l.id !== 1);
  assert.equal(networkStatus(game).byBuilding[4].water, false);
});

test("broken sources and relays stop supply; malformed stored edges cannot bypass route limits", () => {
  const game = {
    buildings: buildings.map((b) => ({ ...b })),
    links: [
      link(1, "power", 2, 3),
      link(2, "power", 3, 4),
      link(3, "power", 2, 999),
    ],
  };
  game.buildings[2].condition = 0;
  const status = networkStatus(game);
  assert.deepEqual(status.connected.power, [2]);
  assert.equal(status.byBuilding[3].power, false);
  assert.equal(status.byBuilding[4].power, false);
  assert.match(status.byBuilding[3].reasons.power, /Repair/);
  const blocked = {
    buildings,
    links: [link(1, "power", 2, 1), link(2, "power", 1, 3)],
  };
  assert.equal(networkStatus(blocked).byBuilding[3].power, false);
  game.buildings[1].condition = 0;
  assert.deepEqual(networkStatus(game).connected.power, []);
});

test("network graphs handle loops and disconnected islands without mutating input", () => {
  const game = {
    buildings,
    links: [
      link(1, "power", 1, 2),
      link(2, "power", 2, 3),
      link(3, "power", 3, 4),
      link(4, "power", 4, 2),
    ],
  };
  const before = JSON.stringify(game);
  const status = networkStatus(game);
  assert.deepEqual(status.connected.power, [1, 2, 3, 4]);
  assert.equal(JSON.stringify(game), before);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.deepEqual(
    networkStatus({ buildings: [], links: [] }).connected.power,
    [],
  );
});

test("maintenance threshold disables sources and relays consistently with the simulation", () => {
  const game = {
    buildings: buildings.map((b) => ({ ...b, condition: 100 })),
    links: [link(1, "power", 2, 3), link(2, "power", 3, 4)],
  };
  game.buildings[1].condition = 15;
  assert.deepEqual(networkStatus(game).connected.power, []);
  game.buildings[1].condition = 15.01;
  assert.deepEqual(networkStatus(game).connected.power, [2, 3, 4]);
  game.buildings[2].condition = 15;
  assert.deepEqual(networkStatus(game).connected.power, [2]);
  game.buildings[2].condition = 16;
  assert.deepEqual(networkStatus(game).connected.power, [2, 3, 4]);
});

test("legacy conversion creates deterministic valid forests with distinct IDs and no dangling edges", () => {
  const links = migrateLegacyLinks(buildings);
  assert.equal(links.length, (buildings.length - 1) * NETWORK_KINDS.length);
  assert.equal(new Set(links.map((l) => l.id)).size, links.length);
  assert.deepEqual(links, migrateLegacyLinks(buildings));
  const game = { buildings, links: [] };
  for (const edge of links) {
    assert.equal(validateLink(game, edge).valid, true);
    game.links.push(edge);
  }
  const status = networkStatus(game);
  for (const kind of NETWORK_KINDS)
    assert.deepEqual(status.connected[kind], [1, 2, 3, 4]);
  const isolated = [
    ...buildings,
    { id: 99, type: "mine", x: MAX_LINK_LENGTH * 10, z: 0 },
  ];
  assert.equal(
    migrateLegacyLinks(isolated).some(
      (edge) => edge.from === 99 || edge.to === 99,
    ),
    false,
  );
});

test("terrain yields are deterministic, finite, spatially varying and bounded", () => {
  assert.deepEqual(terrainProfile(16, 24), terrainProfile(16, 24));
  assert.notDeepEqual(terrainProfile(0, 0), terrainProfile(80, -40));
  for (let x = -160; x <= 160; x += 16)
    for (let z = -160; z <= 160; z += 16) {
      const p = terrainProfile(x, z);
      assert.ok(p.ore >= 0.6 && p.ore <= 1.6);
      assert.ok(p.ice >= 0.6 && p.ice <= 1.6);
      assert.ok(p.roughness >= 0 && p.roughness <= 1);
    }
  assert.doesNotThrow(() => terrainProfile(Number.NaN, Infinity));
  assert.ok(
    Object.values(terrainProfile(Number.NaN, Infinity)).every(Number.isFinite),
  );
});
