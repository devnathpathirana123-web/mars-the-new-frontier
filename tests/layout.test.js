import test from "node:test";
import assert from "node:assert/strict";
import {
  freshGame,
  dispatchColony,
  validateSave,
  getColonyReport,
} from "../src/game/colony.js";
import { constructionPad } from "../src/game/constructionPads.js";
const act = (g, a) => {
  const r = dispatchColony(g, a);
  assert.notEqual(r.game, g, r.message);
  return r.game;
};
function colony() {
  let g = freshGame();
  g = act(g, { type: "place", buildingType: "solar", x: 8, z: 0 });
  return act(g, { type: "connect", kind: "power", from: 1, to: 2 });
}
test("moving preserves identity, upgrades, condition, batteries and valid links", () => {
  let g = colony();
  g.buildings[1].level = 3;
  g.buildings[1].condition = 63;
  const snapshot = structuredClone(g);
  const moved = act(g, { type: "move", id: 2, x: 8, z: 8 });
  assert.equal(moved.buildings[1].id, 2);
  assert.equal(moved.buildings[1].level, 3);
  assert.equal(moved.buildings[1].condition, 63);
  assert.deepEqual(moved.energyStorage, g.energyStorage);
  assert.deepEqual(moved.resources, g.resources);
  assert.deepEqual(moved.links, g.links);
  assert.deepEqual(g, snapshot);
  assert.ok(validateSave(moved));
});
test("invalid rearrangements reject atomically including stretched links and routes through plots", () => {
  const g = colony();
  const snapshot = structuredClone(g);
  for (const a of [
    { id: 2, x: 0, z: 0 },
    { id: 2, x: 32, z: 0 },
    { id: 2, x: 80, z: 0 },
    { id: 2, x: 1, z: 0 },
    { id: 99, x: 8, z: 8 },
    { id: 2, x: NaN, z: 0 },
  ])
    assert.equal(dispatchColony(g, { type: "move", ...a }).game, g);
  assert.deepEqual(g, snapshot);
});
test("demolition removes links, frees jobs, destroys local energy, and refunds only base salvage", () => {
  let g = colony();
  g = act(g, { type: "place", buildingType: "mine", x: 0, z: 8 });
  g = act(g, { type: "connect", kind: "corridor", from: 1, to: 3 });
  g = act(g, { type: "assign", id: 3, workers: 1 });
  const before = g.resources.metal;
  const next = act(g, { type: "demolish", id: 3 });
  assert.equal(next.resources.metal, before + 32);
  assert.ok(next.links.every((l) => l.from !== 3 && l.to !== 3));
  assert.equal(getColonyReport(next).assignedWorkers, 0);
  assert.ok(validateSave(next));
  assert.equal(dispatchColony(next, { type: "demolish", id: 3 }).game, next);
  g.energyStorage = { 1: 100, 2: 100 };
  g.resources.energy = 200;
  const d = act(g, { type: "demolish", id: 2 });
  assert.equal(d.resources.energy, 100);
  assert.deepEqual(d.energyStorage, { 1: 100 });
  assert.ok(validateSave(d));
});
test("last occupied habitat protected; sandbox never gains refund", () => {
  const g = freshGame();
  assert.equal(dispatchColony(g, { type: "demolish", id: 1 }).game, g);
  let s = freshGame("sandbox");
  s = act(s, { type: "place", buildingType: "mine", x: 8, z: 0 });
  const d = act(s, { type: "demolish", id: 2 });
  assert.deepEqual(d.resources, s.resources);
});
test("foundation deck clears expanded terrain footprint on steep and crater-like sites", () => {
  const height = (x, z) => Math.sin(x / 5) * 9 + z * 0.4;
  for (const b of [
    { x: 32, z: 24 },
    { x: -32, z: -16 },
    { x: 0, z: 0 },
  ]) {
    const pad = constructionPad(b, height);
    assert.ok(Number.isFinite(pad.top));
    for (let x = -4.5; x <= 4.5; x += 0.25)
      for (let z = -4.5; z <= 4.5; z += 0.25)
        assert.ok(pad.top > height(b.x + x, b.z + z));
  }
});

test("moving cannot route an existing cable through a third building", () => {
  let g = colony();
  g = act(g, { type: "place", buildingType: "mine", x: 8, z: 8 });
  const result = dispatchColony(g, { type: "move", id: 2, x: 16, z: 16 });
  assert.equal(result.game, g);
  assert.match(result.message, /obstruct/);
});
