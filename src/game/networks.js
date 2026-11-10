/**
 * Serializable infrastructure graph shared by the simulation and the UI.
 * Links are undirected {id, kind, from, to}; every building can relay a utility.
 * Power originates at working solar arrays; water at working, powered extractors;
 * pressurized access originates at working habitats. Buildings at or below 15%
 * condition require maintenance and cannot supply or relay utilities.
 * validateLink checks geometry only: the simulation remains responsible for payment.
 */
export const NETWORK_KINDS = Object.freeze(["power", "water", "corridor"]);
export const MAX_LINK_LENGTH = 24;
const HALF_BUILDING = 3.25;

function indexBuildings(buildings = []) {
  const result = new Map();
  for (const building of buildings) {
    if (
      building &&
      Number.isInteger(building.id) &&
      building.id > 0 &&
      Number.isFinite(building.x) &&
      Number.isFinite(building.z) &&
      !result.has(building.id)
    ) {
      result.set(building.id, building);
    }
  }
  return result;
}

function working(building) {
  return (
    building.condition === undefined ||
    (Number.isFinite(building.condition) && building.condition > 15)
  );
}

function intersectsPlot(a, b, building) {
  // Slab intersection in the horizontal plane, excluding both endpoint plots.
  let enter = 0;
  let leave = 1;
  for (const axis of ["x", "z"]) {
    const direction = b[axis] - a[axis];
    const minimum = building[axis] - HALF_BUILDING;
    const maximum = building[axis] + HALF_BUILDING;
    if (Math.abs(direction) < 1e-9) {
      if (a[axis] < minimum || a[axis] > maximum) return false;
    } else {
      const first = (minimum - a[axis]) / direction;
      const last = (maximum - a[axis]) / direction;
      enter = Math.max(enter, Math.min(first, last));
      leave = Math.min(leave, Math.max(first, last));
      if (enter > leave) return false;
    }
  }
  return enter <= leave;
}

function routeIssue(index, from, to) {
  const a = index.get(from);
  const b = index.get(to);
  if (!a || !b) return "Choose two existing buildings.";
  if (from === to) return "Choose two different buildings.";
  const distance = Math.hypot(b.x - a.x, b.z - a.z);
  if (distance <= 0.001) return "The buildings occupy the same position.";
  if (distance > MAX_LINK_LENGTH + 1e-9) {
    return `Buildings are too far apart. Each link can span ${MAX_LINK_LENGTH} units; connect through a closer building.`;
  }
  for (const building of index.values()) {
    if (building.id === from || building.id === to) continue;
    if (intersectsPlot(a, b, building)) {
      return `The route crosses building #${building.id}. Connect through that building instead.`;
    }
  }
  return "";
}

function costFor(kind, length) {
  const base = kind === "corridor" ? 6 : kind === "water" ? 4 : 2;
  const divisor = kind === "corridor" ? 2 : kind === "water" ? 3 : 4;
  return { metal: base + Math.ceil(length / divisor) };
}

/** Result: {valid, reason, cost:{metal}, length}; no state mutation. */
export function validateLink(game, { kind, from, to } = {}) {
  const index = indexBuildings(game?.buildings);
  const a = index.get(from);
  const b = index.get(to);
  const length = a && b ? Math.hypot(b.x - a.x, b.z - a.z) : 0;
  const cost =
    NETWORK_KINDS.includes(kind) && a && b
      ? costFor(kind, length)
      : { metal: 0 };
  if (!NETWORK_KINDS.includes(kind)) {
    return {
      valid: false,
      reason: "Choose power, water, or corridor infrastructure.",
      cost,
      length,
    };
  }
  const issue = routeIssue(index, from, to);
  if (issue) return { valid: false, reason: issue, cost, length };
  if (
    (game?.links || []).some(
      (link) =>
        link &&
        link.kind === kind &&
        ((link.from === from && link.to === to) ||
          (link.from === to && link.to === from)),
    )
  ) {
    return {
      valid: false,
      reason: "These buildings already have this connection.",
      cost,
      length,
    };
  }
  return { valid: true, reason: "Route clear.", cost, length };
}

function graphFor(kind, index, links) {
  const graph = new Map([...index].map(([id]) => [id, new Set()]));
  for (const link of links) {
    if (!link || link.kind !== kind || routeIssue(index, link.from, link.to))
      continue;
    if (!working(index.get(link.from)) || !working(index.get(link.to)))
      continue;
    graph.get(link.from).add(link.to);
    graph.get(link.to).add(link.from);
  }
  return graph;
}

function componentsOf(graph) {
  const remaining = new Set(graph.keys());
  const result = [];
  for (const id of graph.keys()) {
    if (!remaining.has(id)) continue;
    const component = [];
    const queue = [id];
    remaining.delete(id);
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const current = queue[cursor];
      component.push(current);
      for (const neighbor of graph.get(current)) {
        if (!remaining.has(neighbor)) continue;
        remaining.delete(neighbor);
        queue.push(neighbor);
      }
    }
    result.push(component.sort((a, b) => a - b));
  }
  return result;
}

function suppliedIds(components, sourceIds) {
  const result = new Set();
  for (const component of components) {
    if (component.some((id) => sourceIds.has(id)))
      component.forEach((id) => result.add(id));
  }
  return result;
}

/**
 * Returns {byBuilding, components, connected}. byBuilding[id] contains boolean
 * power/water/corridor and reasons of the same keys. No Sets/Maps escape this API.
 */
export function networkStatus(game) {
  const index = indexBuildings(game?.buildings);
  const links = Array.isArray(game?.links) ? game.links : [];
  const components = {};
  for (const kind of NETWORK_KINDS) {
    components[kind] = componentsOf(graphFor(kind, index, links));
  }
  const solar = new Set(
    [...index]
      .filter(([, b]) => b.type === "solar" && working(b))
      .map(([id]) => id),
  );
  const habitats = new Set(
    [...index]
      .filter(([, b]) => b.type === "habitat" && working(b))
      .map(([id]) => id),
  );
  const power = suppliedIds(components.power, solar);
  const wells = new Set(
    [...index]
      .filter(
        ([id, b]) => b.type === "extractor" && working(b) && power.has(id),
      )
      .map(([id]) => id),
  );
  const water = suppliedIds(components.water, wells);
  const corridor = suppliedIds(components.corridor, habitats);
  const byBuilding = {};
  for (const [id, building] of index) {
    const offline = !working(building);
    byBuilding[id] = {
      power: !offline && power.has(id),
      water: !offline && water.has(id),
      corridor: !offline && corridor.has(id),
      reasons: {
        power: offline
          ? "Repair this building to restore its utilities."
          : power.has(id)
            ? "Connected to a working solar array."
            : "Connect a power cable to a working solar array.",
        water: offline
          ? "Repair this building to restore its utilities."
          : water.has(id)
            ? "Connected to a powered water plant."
            : "Connect a water pipe to a working, powered water plant.",
        corridor: offline
          ? "Repair this building to restore its utilities."
          : corridor.has(id)
            ? "Pressurized access from a habitat."
            : "Connect a pressurized corridor to a working habitat.",
      },
    };
  }
  return {
    byBuilding,
    components,
    connected: {
      power: [...power].sort((a, b) => a - b),
      water: [...water].sort((a, b) => a - b),
      corridor: [...corridor].sort((a, b) => a - b),
    },
  };
}

function hash(x, z) {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function noise(x, z) {
  const ix = Math.floor(x),
    iz = Math.floor(z);
  const fx = x - ix,
    fz = z - iz;
  const u = fx * fx * (3 - 2 * fx),
    v = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz) * (1 - u) + hash(ix + 1, iz) * u;
  const b = hash(ix, iz + 1) * (1 - u) + hash(ix + 1, iz + 1) * u;
  return a * (1 - v) + b * v;
}

/** Stable ore/ice yield multipliers in [0.6,1.6], roughness in [0,1]. */
export function terrainProfile(x, z) {
  const px = Number.isFinite(x) ? x : 0;
  const pz = Number.isFinite(z) ? z : 0;
  const ore = 0.6 + noise(px / 27 + 6.3, pz / 27 - 2.7);
  const ice = 0.6 + noise(px / 33 - 5.4, pz / 33 + 9.1);
  const roughness = noise(px / 18 + 1.7, pz / 18 + 3.2);
  return { ore, ice, roughness };
}

/** One minimum-distance, obstacle-aware spanning forest for every utility kind. */
export function migrateLegacyLinks(buildings) {
  const index = indexBuildings(buildings);
  const entries = [...index.values()];
  const candidates = [];
  for (let i = 0; i < entries.length; i++)
    for (let j = i + 1; j < entries.length; j++) {
      const from = entries[i].id,
        to = entries[j].id;
      if (!routeIssue(index, from, to)) {
        candidates.push({
          from,
          to,
          length: Math.hypot(
            entries[i].x - entries[j].x,
            entries[i].z - entries[j].z,
          ),
        });
      }
    }
  candidates.sort(
    (a, b) => a.length - b.length || a.from - b.from || a.to - b.to,
  );
  const parent = new Map([...index.keys()].map((id) => [id, id]));
  const root = (id) => {
    let current = id;
    while (parent.get(current) !== current) current = parent.get(current);
    return current;
  };
  const routes = [];
  for (const edge of candidates) {
    const a = root(edge.from),
      b = root(edge.to);
    if (a === b) continue;
    parent.set(b, a);
    routes.push(edge);
  }
  let id = 1;
  return NETWORK_KINDS.flatMap((kind) =>
    routes.map(({ from, to }) => ({ id: id++, kind, from, to })),
  );
}
