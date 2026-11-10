import {
  networkStatus,
  validateLink,
  terrainProfile,
  migrateLegacyLinks,
} from "./networks.js";

export const SAVE_VERSION = 3;

export const LIMITS = {
  metal: 10000,
  energy: 6000,
  water: 6000,
  food: 6000,
  research: 10000,
};

export const CATALOG = {
  habitat: {
    name: "Habitat",
    icon: "⌂",
    max: 15,
    cost: { metal: 55, energy: 12 },
    base: 8,
  },
  solar: {
    name: "Solar Array",
    icon: "☀",
    max: 10,
    cost: { metal: 40, energy: 8 },
    base: 24,
  },
  extractor: {
    name: "Water Plant",
    icon: "◉",
    max: 15,
    cost: { metal: 45, energy: 10 },
    base: 15,
  },
  greenhouse: {
    name: "Greenhouse",
    icon: "♧",
    max: 10,
    cost: { metal: 50, energy: 12 },
    base: 12,
  },
  mine: {
    name: "Mining Facility",
    icon: "◇",
    max: 15,
    cost: { metal: 65, energy: 15 },
    base: 18,
  },
  research: {
    name: "Research Centre",
    icon: "✧",
    max: 15,
    cost: { metal: 70, energy: 18 },
    base: 8,
  },
};

export const TECHNOLOGIES = [
  {
    id: "solarEfficiency",
    name: "Solar Efficiency",
    description: "Increase solar power production.",
    cost: 100,
  },
  {
    id: "waterRecycling",
    name: "Water Recycling",
    description: "Increase water extraction output.",
    cost: 150,
  },
  {
    id: "agriculture",
    name: "Advanced Agriculture",
    description: "Improve greenhouse food production.",
    cost: 200,
  },
  {
    id: "mining",
    name: "Automated Mining",
    description: "Increase metal production.",
    cost: 250,
  },
  {
    id: "research",
    name: "Research Optimization",
    description: "Increase research point production.",
    cost: 300,
  },
];

export const HOUSING = [
  0, 8, 12, 18, 26, 36, 48, 64, 82, 104, 130, 160, 195, 235, 280, 340,
];

export const FOOD = [0, 12, 24, 36, 55, 75, 105, 135, 170, 210, 260];

export function output(building, technologies) {
  if (building.type === "habitat") {
    return HOUSING[building.level];
  }

  let amount =
    building.type === "greenhouse"
      ? FOOD[building.level]
      : Math.floor(
          CATALOG[building.type].base * (1 + (building.level - 1) * 0.35),
        );

  const researchBonuses = {
    solar: "solarEfficiency",
    extractor: "waterRecycling",
    greenhouse: "agriculture",
    mine: "mining",
    research: "research",
  };

  const technologyId = researchBonuses[building.type];

  if (technologyId && technologies[technologyId]) {
    amount = Math.floor(amount * 1.25);
  }

  return amount;
}

// =====================================================
// ENERGY CONSUMPTION
// =====================================================

export function energyCost(building) {
  const level = building.level;

  switch (building.type) {
    case "habitat":
      return Math.ceil(6 + (level - 1) * 3.5);

    case "solar":
      return 0;

    case "extractor":
      return Math.ceil(8 + (level - 1) * 1.5);

    case "greenhouse":
      return level <= 3 ? 10 : level <= 5 ? 16 : 24;

    case "mine":
      return Math.ceil(12 + (level - 1) * 2.5);

    case "research":
      return Math.ceil(14 + (level - 1) * 2.5);

    default:
      return 0;
  }
}

// =====================================================
// BUILDING UPGRADE COSTS
// =====================================================

export function upgradeCost(building) {
  const next = building.level + 1;
  const config = CATALOG[building.type];

  const milestones = {
    habitat: [4, 7, 10, 13, 15],
    solar: [4, 7, 9],
    extractor: [4, 7, 11, 15],
    greenhouse: [4, 6],
    mine: [4, 7, 11, 15],
    research: [4, 8, 12, 15],
  };

  const milestone = milestones[building.type].includes(next);

  let research = 0;

  if (next >= 13) {
    research = 90 + (next - 13) * 35;
  } else if (next >= 10) {
    research = 45 + (next - 10) * 15;
  } else if (next >= 7) {
    research = 20 + (next - 7) * 8;
  } else if (next >= 4) {
    research = 10;
  }

  return {
    metal: Math.ceil(
      config.cost.metal * (0.55 + next * 0.32) + (milestone ? next * 13 : 0),
    ),
    research,
  };
}

export const POLICY_DEFINITIONS = {
  healthcare: {
    name: "Healthcare shifts",
    description:
      "Medical shifts restore health faster. Uses 2 energy and 1 water per sol.",
    cost: { energy: 2, water: 1 },
  },
  recreation: {
    name: "Community time",
    description:
      "Shared meals and recreation improve morale. Uses 2 energy and 1 food per sol.",
    cost: { energy: 2, food: 1 },
  },
  stormPrep: {
    name: "Storm preparation",
    description:
      "Protected panels recover solar yield and reduce storm wear by 60%. Uses 3 energy and 1 metal per sol.",
    cost: { energy: 3, metal: 1 },
  },
};
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const number = (n, a, b) =>
  typeof n === "number" && Number.isFinite(n) && n >= a && n <= b;
const own = (object, key) => Object.hasOwn(object, key);
const activeSurvival = (game) =>
  game.mode !== "sandbox" || game.sandboxSurvival;
const freeBuild = (game) => game.mode === "sandbox";
const clone = (value) => structuredClone(value);

export function workerCapacity(building) {
  if (!building || ["habitat", "solar"].includes(building.type)) return 0;
  return (
    (["mine", "research"].includes(building.type) ? 2 : 1) +
    Math.floor((building.level - 1) / 4)
  );
}
export function repairCost(building) {
  return {
    metal: Math.ceil((100 - clamp(building.condition ?? 100, 0, 100)) * 0.25),
  };
}
export function canAfford(resources, price, sandbox = false) {
  if (
    !price ||
    Object.entries(price).some(
      ([key, value]) => !own(LIMITS, key) || !number(value, 0, LIMITS[key]),
    )
  )
    return false;
  return (
    sandbox ||
    Object.entries(price).every(([key, value]) =>
      number(resources[key], value, LIMITS[key]),
    )
  );
}
export function deduct(resources, price, sandbox = false) {
  if (sandbox || !canAfford(resources, price)) return { ...resources };
  const next = { ...resources };
  for (const [key, value] of Object.entries(price)) next[key] -= value;
  return next;
}
export function weatherFor(sol) {
  const phase = (Math.max(1, Math.floor(sol)) - 1) % 16;
  if (phase >= 9 && phase <= 11)
    return {
      kind: "storm",
      label: "Dust storm",
      solarFactor: 0.35,
      wear: 1.8,
      description:
        "Dense dust cuts solar output by 65% and accelerates equipment wear.",
    };
  if (phase === 8 || phase === 12)
    return {
      kind: "dust",
      label: "Dust front",
      solarFactor: 0.7,
      wear: 0.7,
      description:
        "Airborne dust reduces solar output by 30%. A storm follows the incoming front.",
    };
  return {
    kind: "clear",
    label: "Clear skies",
    solarFactor: 1,
    wear: 0.25,
    description: "Normal solar generation and routine equipment wear.",
  };
}

export function freshGame(mode = "survival") {
  return {
    version: SAVE_VERSION,
    mode: mode === "sandbox" ? "sandbox" : "survival",
    sol: 1,
    paused: true,
    sandboxSurvival: false,
    resources: { metal: 600, energy: 300, water: 200, food: 200, research: 0 },
    colony: { population: 4, health: 100, morale: 80, stableSols: 0 },
    technologies: Object.fromEntries(TECHNOLOGIES.map((t) => [t.id, false])),
    policies: { healthcare: false, recreation: false, stormPrep: false },
    buildings: [
      {
        id: 1,
        type: "habitat",
        level: 1,
        x: 0,
        z: 0,
        condition: 100,
        workers: 0,
      },
    ],
    links: [],
    nextId: 2,
    nextLinkId: 1,
    energyStorage: { 1: 300 },
    campaign: { claimed: [], selfSufficientSols: 0, preparedStormSols: 0 },
    history: [
      "Welcome, commander. Simulation paused. Build a solar array, then connect it to your habitat.",
    ],
  };
}

export function validateSave(data) {
  if (
    !data ||
    typeof data !== "object" ||
    ![2, 3].includes(data.version) ||
    !["survival", "sandbox"].includes(data.mode)
  )
    return null;
  if (
    !data.resources ||
    !data.colony ||
    !data.technologies ||
    !Array.isArray(data.buildings) ||
    data.buildings.length > 1000
  )
    return null;
  if (
    Object.entries(LIMITS).some(
      ([key, limit]) => !number(data.resources[key], 0, limit),
    )
  )
    return null;
  if (
    !Number.isInteger(data.colony.population) ||
    !number(data.colony.population, 0, 1000000) ||
    !number(data.colony.health, 0, 100) ||
    !number(data.colony.stableSols, 0, 1000000)
  )
    return null;
  const game = freshGame(data.mode);
  game.resources = { ...data.resources };
  game.colony = {
    population: data.colony.population,
    health: data.colony.health,
    stableSols: data.colony.stableSols,
    morale: number(data.colony.morale, 0, 100) ? data.colony.morale : 80,
  };
  game.sol =
    Number.isInteger(data.sol) && number(data.sol, 1, 1e9) ? data.sol : 1;
  game.paused = Boolean(data.paused);
  game.sandboxSurvival = Boolean(data.sandboxSurvival);
  const ids = new Set();
  game.buildings = [];
  for (const b of data.buildings) {
    if (
      !b ||
      !own(CATALOG, b.type) ||
      !Number.isInteger(b.id) ||
      !number(b.id, 1, Number.MAX_SAFE_INTEGER - 1) ||
      ids.has(b.id) ||
      !Number.isInteger(b.level) ||
      !number(b.level, 1, CATALOG[b.type].max) ||
      !number(b.x, -160, 160) ||
      !number(b.z, -160, 160)
    )
      return null;
    const condition = data.version === 2 ? 100 : (b.condition ?? 100);
    const workers = data.version === 2 ? 0 : (b.workers ?? 0);
    if (
      !number(condition, 0, 100) ||
      !Number.isInteger(workers) ||
      !number(workers, 0, workerCapacity(b))
    )
      return null;
    ids.add(b.id);
    game.buildings.push({
      id: b.id,
      type: b.type,
      level: b.level,
      x: b.x,
      z: b.z,
      condition,
      workers,
    });
  }
  if (
    game.buildings.reduce((sum, b) => sum + b.workers, 0) >
    game.colony.population
  )
    return null;
  for (const key of Object.keys(game.technologies))
    game.technologies[key] = data.technologies[key] === true;
  for (const key of Object.keys(game.policies))
    game.policies[key] = data.policies?.[key] === true;
  const highestId = Math.max(0, ...game.buildings.map((b) => b.id));
  game.nextId =
    Number.isSafeInteger(data.nextId) && data.nextId > highestId
      ? data.nextId
      : highestId + 1;
  if (data.version === 3 && data.energyStorage !== undefined) {
    if (
      !data.energyStorage ||
      typeof data.energyStorage !== "object" ||
      Array.isArray(data.energyStorage) ||
      Object.entries(data.energyStorage).some(
        ([id, amount]) =>
          (!ids.has(Number(id)) && !(id === "0" && !ids.size)) ||
          !number(amount, 0, LIMITS.energy),
      )
    )
      return null;
    if (
      Math.abs(
        Object.values(data.energyStorage).reduce((sum, n) => sum + n, 0) -
          game.resources.energy,
      ) > 0.001
    )
      return null;
    game.energyStorage = { ...data.energyStorage };
  } else {
    game.energyStorage = undefined;
  }
  game.energyStorage = energyStorageFor(game);
  game.links = [];
  const proposed =
    data.version === 2
      ? migrateLegacyLinks(game.buildings)
      : (data.links ?? []);
  if (!Array.isArray(proposed) || proposed.length > 10000) return null;
  const linkIds = new Set();
  for (const link of proposed) {
    if (!link || typeof link !== "object") return null;
    const result = validateLink(game, link);
    if (
      !Number.isSafeInteger(link.id) ||
      link.id < 1 ||
      linkIds.has(link.id) ||
      !result.valid
    )
      return null;
    linkIds.add(link.id);
    game.links.push({
      id: link.id,
      kind: link.kind,
      from: link.from,
      to: link.to,
    });
  }
  game.nextLinkId = Math.max(0, ...game.links.map((link) => link.id)) + 1;
  if (data.version === 3 && data.campaign) {
    const claimed = data.campaign.claimed;
    if (
      !Array.isArray(claimed) ||
      claimed.length > CAMPAIGN.length ||
      claimed.some((id, i) => id !== CAMPAIGN[i].id)
    )
      return null;
    game.campaign.claimed = [...claimed];
    game.campaign.selfSufficientSols = Number.isInteger(
      data.campaign.selfSufficientSols,
    )
      ? clamp(data.campaign.selfSufficientSols, 0, 1e6)
      : 0;
    game.campaign.preparedStormSols = Number.isInteger(
      data.campaign.preparedStormSols,
    )
      ? clamp(data.campaign.preparedStormSols, 0, 1e6)
      : 0;
  }
  game.history = Array.isArray(data.history)
    ? data.history
        .filter((x) => typeof x === "string")
        .map((x) => x.slice(0, 400))
        .slice(-20)
    : [];
  if (data.version === 2) {
    game.paused = true;
    game.history.push(
      "Existing colony migrated safely. Nearby legacy buildings were connected; review distant sites and assign workers before resuming.",
    );
  }
  return game;
}

/** Batteries remain attached to their building, so isolated grids cannot exchange power. */
function energyStorageFor(game) {
  const ids = new Set(game.buildings.map((b) => String(b.id)));
  const storage = {};
  for (const [id, amount] of Object.entries(game.energyStorage ?? {})) {
    if (
      (ids.has(id) || (id === "0" && !ids.size)) &&
      number(amount, 0, LIMITS.energy)
    )
      storage[id] = amount;
  }
  const target = game.resources.energy;
  const total = Object.values(storage).reduce((sum, n) => sum + n, 0);
  if (total > target) {
    let remove = total - target;
    for (const id of Object.keys(storage).sort(
      (a, b) => Number(a) - Number(b),
    )) {
      const taken = Math.min(remove, storage[id]);
      storage[id] -= taken;
      remove -= taken;
      if (remove <= 1e-8) break;
    }
  } else if (total < target) {
    const reserveId =
      game.buildings.find((b) => b.type === "habitat")?.id ??
      game.buildings[0]?.id ??
      0;
    storage[reserveId] = (storage[reserveId] ?? 0) + target - total;
  }
  return storage;
}

/** Simulate one operational cycle without mutating the input or progressing time. */
function cycle(game) {
  const network = networkStatus(game);
  const resources = { ...game.resources };
  const energyStorage = energyStorageFor(game);
  const consumeEnergy = (amount, ids = Object.keys(energyStorage)) => {
    let needed = amount;
    for (const id of ids) {
      const used = Math.min(needed, energyStorage[id] ?? 0);
      energyStorage[id] = (energyStorage[id] ?? 0) - used;
      needed -= used;
      if (needed <= 1e-8) break;
    }
    resources.energy = Math.max(0, resources.energy - amount);
  };
  const weather = weatherFor(game.sol);
  const policies = {};
  const simulation = activeSurvival(game);
  // Reserve policy supplies before generation. Unfunded policies remain selected but inactive.
  for (const [key, definition] of Object.entries(POLICY_DEFINITIONS)) {
    const active =
      game.policies?.[key] === true && canAfford(resources, definition.cost);
    policies[key] = {
      ...definition,
      enabled: game.policies?.[key] === true,
      active,
    };
    if (active && simulation) {
      if (definition.cost.energy) consumeEnergy(definition.cost.energy);
      for (const [key, cost] of Object.entries(definition.cost))
        if (key !== "energy") resources[key] -= cost;
    }
  }
  const assignedWorkers = game.buildings.reduce(
    (sum, b) => sum + (b.workers ?? 0),
    0,
  );
  const statuses = game.buildings.map((b) => {
    const n = network.byBuilding[b.id] ?? {};
    const condition = b.condition ?? 100;
    const site = terrainProfile(b.x, b.z);
    const maxWorkers = workerCapacity(b);
    const workers = n.corridor ? (b.workers ?? 0) : 0;
    const staffing = maxWorkers ? 0.55 + (0.45 * workers) / maxWorkers : 1;
    const efficiency =
      condition <= 15 ? 0 : (0.35 + condition * 0.0065) * staffing;
    return {
      id: b.id,
      type: b.type,
      powered: b.type === "solar" || Boolean(n.power),
      waterConnected: Boolean(n.water),
      corridorConnected: b.type === "habitat" || Boolean(n.corridor),
      condition,
      workers: b.workers ?? 0,
      effectiveWorkers: workers,
      maxWorkers,
      efficiency,
      production: 0,
      energyDemand: energyCost(b),
      operating: false,
      reason: "Awaiting cycle",
      site,
      repairCost: repairCost(b),
      building: b,
    };
  });
  const byBuilding = Object.fromEntries(statuses.map((s) => [s.id, s]));
  // A pipe must reach a powered, serviceable extraction source, not merely an empty pipe network.
  for (const s of statuses) {
    if (!s.waterConnected) continue;
    const component =
      network.components.water.find((ids) => ids.includes(s.id)) ?? [];
    s.waterConnected = component.some(
      (id) =>
        byBuilding[id]?.type === "extractor" &&
        byBuilding[id].powered &&
        byBuilding[id].condition > 15,
    );
  }
  const ordered = [...statuses].sort(
    (a, b) =>
      [
        "solar",
        "habitat",
        "extractor",
        "greenhouse",
        "mine",
        "research",
      ].indexOf(a.type) -
        [
          "solar",
          "habitat",
          "extractor",
          "greenhouse",
          "mine",
          "research",
        ].indexOf(b.type) || a.id - b.id,
  );
  let poweredHousing = 0;
  for (const s of ordered) {
    const b = s.building;
    if (s.condition <= 15) {
      s.reason = "Maintenance required";
      continue;
    }
    if (!s.powered) {
      s.reason = "Connect a power cable to a solar array";
      continue;
    }
    if (b.type === "solar") {
      const factor =
        weather.kind !== "clear" && policies.stormPrep.active
          ? Math.min(1, weather.solarFactor + 0.25)
          : weather.solarFactor;
      s.production = Math.max(
        0,
        Math.floor(output(b, game.technologies) * s.efficiency * factor),
      );
      s.production = Math.min(s.production, LIMITS.energy - resources.energy);
      resources.energy += s.production;
      energyStorage[b.id] = (energyStorage[b.id] ?? 0) + s.production;
      s.operating = true;
      s.reason =
        weather.kind === "clear"
          ? "Generating power"
          : "Dust reduces generation";
      continue;
    }
    if (b.type === "greenhouse") {
      const component =
        network.components.water.find((ids) => ids.includes(s.id)) ?? [];
      s.waterConnected =
        s.waterConnected &&
        component.some(
          (id) =>
            byBuilding[id]?.type === "extractor" && byBuilding[id].operating,
        );
    }
    if (b.type === "greenhouse" && !s.waterConnected) {
      s.reason = "Connect water pipes to a powered water plant";
      continue;
    }
    const requiredWater =
      b.type === "greenhouse" ? Math.ceil(2 + (b.level - 1) * 0.5) : 0;
    const powerComponent = network.components.power.find((ids) =>
      ids.includes(s.id),
    ) ?? [s.id];
    const localEnergy = powerComponent.reduce(
      (sum, id) => sum + (energyStorage[id] ?? 0),
      0,
    );
    if (localEnergy + 1e-8 < s.energyDemand) {
      s.reason = "Insufficient energy in this power grid";
      continue;
    }
    if (resources.water < requiredWater) {
      s.reason = "Insufficient irrigation water";
      continue;
    }
    consumeEnergy(s.energyDemand, powerComponent);
    resources.water -= requiredWater;
    s.operating = true;
    s.reason =
      s.maxWorkers && !s.effectiveWorkers
        ? "Automated output; assign connected workers for full yield"
        : "Operating";
    if (b.type === "habitat") {
      if (!s.waterConnected)
        s.reason =
          "Housing powered; connect water pipes to a powered water plant";
      poweredHousing += output(b, game.technologies);
      s.production = output(b, game.technologies);
      continue;
    }
    const resource = {
      extractor: "water",
      greenhouse: "food",
      mine: "metal",
      research: "research",
    }[b.type];
    const terrain =
      b.type === "extractor" ? s.site.ice : b.type === "mine" ? s.site.ore : 1;
    s.production = Math.max(
      0,
      Math.floor(output(b, game.technologies) * s.efficiency * terrain),
    );
    resources[resource] = Math.min(
      LIMITS[resource],
      resources[resource] + s.production,
    );
  }
  for (const s of statuses) {
    const component =
      network.components.water.find((ids) => ids.includes(s.id)) ?? [];
    s.waterConnected =
      s.waterConnected &&
      component.some(
        (id) =>
          byBuilding[id]?.type === "extractor" && byBuilding[id].operating,
      );
    if (s.type === "habitat" && s.operating && !s.waterConnected)
      s.reason =
        "Housing powered; connect water pipes to an operating water plant";
  }
  const population = game.colony.population;
  const foodConsumed = Math.min(population, resources.food);
  const waterConsumed = Math.min(population, resources.water);
  resources.food -= foodConsumed;
  resources.water -= waterConsumed;
  const housing = statuses
    .filter((s) => s.type === "habitat")
    .reduce((sum, s) => sum + output(s.building, game.technologies), 0);
  const suppliedHousing = statuses
    .filter((s) => s.type === "habitat" && s.operating && s.waterConnected)
    .reduce((sum, s) => sum + output(s.building, game.technologies), 0);
  const ratio = (amount, demand) =>
    demand === 0 ? 100 : clamp(Math.round((amount / demand) * 100), 0, 100);
  const needs = {
    food: ratio(foodConsumed, population),
    water: Math.min(
      ratio(waterConsumed, population),
      ratio(suppliedHousing, population),
    ),
    housing: ratio(housing, population),
    power: ratio(poweredHousing, population),
  };
  const supported =
    population > 0 && Object.values(needs).every((value) => value >= 100);
  const rates = Object.fromEntries(
    Object.keys(LIMITS).map((key) => [
      key,
      simulation
        ? Math.round((resources[key] - game.resources[key]) * 100) / 100
        : 0,
    ]),
  );
  return {
    resources: simulation ? resources : { ...game.resources },
    energyStorage: simulation ? energyStorage : energyStorageFor(game),
    simulationActive: simulation,
    weather,
    policies,
    buildings: statuses.map(({ building: _building, ...s }) => s),
    byBuilding: Object.fromEntries(
      statuses.map(({ building: _building, ...s }) => [s.id, s]),
    ),
    assignedWorkers,
    availableWorkers: Math.max(0, population - assignedWorkers),
    housing,
    poweredHousing,
    needs,
    supported,
    rates,
    health: game.colony.health,
    morale: game.colony.morale ?? 80,
  };
}

export function simulateSol(game) {
  if (!activeSurvival(game)) return { ...game, sol: game.sol + 1 };
  const report = cycle(game);
  const next = clone(game);
  next.sol += 1;
  next.resources = report.resources;
  next.energyStorage = report.energyStorage;
  const supported = report.supported;
  const health = clamp(
    game.colony.health +
      (supported
        ? report.policies.healthcare.active
          ? 5
          : 2
        : report.policies.healthcare.active
          ? -2
          : -5),
    10,
    100,
  );
  const morale = clamp(
    (game.colony.morale ?? 80) +
      (supported ? 1 : -4) +
      (report.policies.recreation.active ? 3 : 0) -
      (report.weather.kind === "storm" && !report.policies.stormPrep.active
        ? 2
        : 0),
    10,
    100,
  );
  let stableSols =
    supported && health >= 80 && morale >= 60 ? game.colony.stableSols + 1 : 0;
  let population = game.colony.population;
  if (
    stableSols >= 5 &&
    population < report.housing &&
    population < report.poweredHousing &&
    population > 0
  ) {
    population += 1;
    stableSols = 0;
  }
  next.colony = { population, health, morale, stableSols };
  next.buildings = next.buildings.map((b) => ({
    ...b,
    condition: Math.max(
      0,
      Math.round(
        (b.condition -
          report.weather.wear *
            (report.policies.stormPrep.active ? 0.4 : 1) *
            (1 + terrainProfile(b.x, b.z).roughness * 0.2)) *
          100,
      ) / 100,
    ),
  }));
  const sufficient =
    supported &&
    population >= 8 &&
    ["energy", "water", "food"].every((k) => report.rates[k] >= 0);
  next.campaign.selfSufficientSols = sufficient
    ? next.campaign.selfSufficientSols + 1
    : 0;
  if (
    report.weather.kind === "storm" &&
    report.policies.stormPrep.active &&
    supported
  )
    next.campaign.preparedStormSols += 1;
  const events = [];
  if (
    report.weather.kind === "storm" &&
    weatherFor(game.sol - 1).kind !== "storm"
  )
    events.push(`Sol ${game.sol}: dust storm reached the colony.`);
  if (!supported)
    events.push(
      `Sol ${game.sol}: essential service shortfall. Check network and resource alerts.`,
    );
  if (population > game.colony.population)
    events.push(
      `Sol ${game.sol}: a new colonist arrived. Population ${population}.`,
    );
  next.history = [...(game.history ?? []), ...events].slice(-20);
  return next;
}

const CAMPAIGN = [
  {
    id: "power",
    title: "First light",
    description: "Build solar generation and run a connected habitat.",
    goal: "Power a habitat",
    target: 1,
    reward: { metal: 60, energy: 50 },
  },
  {
    id: "water",
    title: "A reliable water supply",
    description: "Power a water plant and pipe it to your habitat.",
    goal: "Supply a habitat from an operating water plant",
    target: 1,
    reward: { metal: 60, water: 40 },
  },
  {
    id: "food",
    title: "Grow on Mars",
    description: "Run an irrigated greenhouse with enough yield for the crew.",
    goal: "Operate a greenhouse with nonnegative food balance",
    target: 1,
    reward: { metal: 80, food: 40 },
  },
  {
    id: "crew",
    title: "A place to work",
    description:
      "Connect pressurized corridors and assign two colonists to productive jobs.",
    goal: "Assign connected workers",
    target: 2,
    reward: { metal: 80, research: 30 },
  },
  {
    id: "industry",
    title: "Local industry",
    description: "Run a mine and research facility on your utility grid.",
    goal: "Operate mining and research facilities",
    target: 2,
    reward: { metal: 100, research: 50 },
  },
  {
    id: "science",
    title: "Better tools",
    description: "Unlock a technology to improve colony output.",
    goal: "Research a technology",
    target: 1,
    reward: { metal: 100, research: 50 },
  },
  {
    id: "resilience",
    title: "Weather the storm",
    description:
      "Keep every essential need supplied for a storm sol with preparation active.",
    goal: "Survive a prepared storm sol",
    target: 1,
    reward: { metal: 120, energy: 100 },
  },
  {
    id: "settlement",
    title: "A self-sufficient settlement",
    description:
      "Support eight colonists and sustain nonnegative power, food and water for three consecutive sols.",
    goal: "Sustain three sols with eight colonists",
    target: 3,
    reward: { metal: 200, research: 100 },
  },
];
function objectives(game, report) {
  const operating = (type) =>
    report.buildings.filter((b) => b.type === type && b.operating);
  const progress = {
    power: operating("habitat").length > 0 ? 1 : 0,
    water:
      operating("extractor").length &&
      operating("habitat").some((b) => b.waterConnected)
        ? 1
        : 0,
    food: operating("greenhouse").length && report.rates.food >= 0 ? 1 : 0,
    crew: report.buildings.reduce(
      (sum, b) => sum + (b.operating ? b.effectiveWorkers : 0),
      0,
    ),
    industry:
      Number(operating("mine").length > 0) +
      Number(operating("research").length > 0),
    science: Number(Object.values(game.technologies).some(Boolean)),
    resilience: game.campaign.preparedStormSols,
    settlement:
      game.colony.population >= 8 ? game.campaign.selfSufficientSols : 0,
  };
  return CAMPAIGN.map((objective, index) => ({
    ...objective,
    progress: Math.min(objective.target, progress[objective.id] ?? 0),
    complete: (progress[objective.id] ?? 0) >= objective.target,
    claimed: game.campaign.claimed.includes(objective.id),
    available: index === game.campaign.claimed.length,
  }));
}
export function campaignObjectives(game) {
  return objectives(game, cycle(game));
}
export function getColonyReport(game) {
  const report = cycle(game);
  const all = objectives(game, report);
  const alerts = [];
  if (game.sol === 1 && !game.buildings.some((b) => b.type === "solar"))
    alerts.push({
      id: "onboarding",
      severity: "info",
      title: "Build before resuming",
      message:
        "Your colony starts paused. Build a solar array, connect power to the habitat, then add a powered water plant and water pipes.",
    });
  if (report.needs.water < 100)
    alerts.push({
      id: "water-service",
      severity: "warning",
      title: "Housing water supply missing",
      message:
        "Stored emergency water alone does not supply habitat plumbing. Connect water pipes from a powered water plant to every occupied habitat.",
    });
  if (report.buildings.some((b) => !b.operating && b.type !== "solar"))
    alerts.push({
      id: "offline",
      severity: "warning",
      title: "Facilities offline",
      message:
        "Select a building to see its power, irrigation, staffing, and maintenance status.",
    });
  for (const key of ["food", "water", "energy"]) {
    if (game.resources[key] < Math.max(15, game.colony.population * 3))
      alerts.push({
        id: `reserve-${key}`,
        severity: "danger",
        title: `Low ${key} reserve`,
        message: `${Math.round(game.resources[key])} remaining. Next-sol balance ${report.rates[key] >= 0 ? "+" : ""}${report.rates[key]}.`,
      });
  }
  const warning =
    report.weather.kind !== "clear"
      ? report.weather
      : [1, 2, 3]
          .map((i) => weatherFor(game.sol + i))
          .find((w) => w.kind !== "clear");
  if (warning)
    alerts.push({
      id: "weather",
      severity: "warning",
      title:
        report.weather.kind !== "clear"
          ? report.weather.label
          : "Dust front forecast",
      message: `${warning.description} Prepare reserves and enable storm preparation.`,
    });
  if (report.buildings.some((b) => b.condition < 35))
    alerts.push({
      id: "maintenance",
      severity: "danger",
      title: "Maintenance overdue",
      message:
        "Facilities stop operating at 15% condition. Repair them before they fail.",
    });
  if (Object.entries(report.policies).some(([, p]) => p.enabled && !p.active))
    alerts.push({
      id: "policy",
      severity: "warning",
      title: "Policy supplies missing",
      message:
        "An enabled service has insufficient upkeep supplies and is inactive this sol.",
    });
  if (game.colony.health < 50)
    alerts.push({
      id: "health",
      severity: "danger",
      title: "Crew needs support",
      message:
        "Restore essential services and consider healthcare. Growth pauses until health and morale recover.",
    });
  return {
    ...report,
    forecast: [1, 2, 3].map((i) => ({
      sol: game.sol + i,
      ...weatherFor(game.sol + i),
    })),
    alerts,
    campaign: {
      index: game.campaign.claimed.length,
      current: all[game.campaign.claimed.length] ?? null,
      completed: [...game.campaign.claimed],
      finished: game.campaign.claimed.length === CAMPAIGN.length,
      selfSufficientSols: game.campaign.selfSufficientSols,
    },
  };
}
export function calculateSatisfaction(game) {
  const report = cycle(game);
  const indicators = [
    {
      id: "housing",
      label: "Housing quality",
      value: report.needs.housing,
      implemented: true,
    },
    {
      id: "essentials",
      label: "Food & water security",
      value: Math.min(report.needs.food, report.needs.water),
      implemented: true,
    },
    {
      id: "energy",
      label: "Energy reliability",
      value: report.needs.power,
      implemented: true,
    },
    {
      id: "healthcare",
      label: "Health",
      value: game.colony.health,
      implemented: true,
    },
    {
      id: "recreation",
      label: "Morale & community",
      value: game.colony.morale ?? 80,
      implemented: true,
    },
  ];
  return {
    indicators,
    overall: Math.round(
      indicators.reduce((sum, i) => sum + i.value, 0) / indicators.length,
    ),
  };
}

export function dispatchColony(game, action) {
  const reject = (message) => ({ game, message });
  if (!game || !action || typeof action.type !== "string")
    return reject("Invalid colony action.");
  const next = clone(game);
  const charge = (price) => {
    if (!canAfford(next.resources, price, freeBuild(next))) return false;
    next.resources = deduct(next.resources, price, freeBuild(next));
    next.energyStorage = energyStorageFor(next);
    return true;
  };
  const building = next.buildings.find((b) => b.id === action.id);
  let message;
  switch (action.type) {
    case "place": {
      if (!own(CATALOG, action.buildingType))
        return reject("Choose a valid building type.");
      if (![action.x, action.z].every((n) => Number.isFinite(n) && n % 8 === 0))
        return reject("Choose a valid construction grid position.");
      const width =
        next.colony.population >= 5000
          ? 240
          : next.colony.population >= 1500
            ? 170
            : next.colony.population >= 500
              ? 120
              : 80;
      if (
        Math.abs(action.x) > width / 2 - 3.75 ||
        Math.abs(action.z) > width / 2 - 3.75
      )
        return reject("Construction must stay inside colony territory.");
      if (
        next.buildings.some(
          (b) =>
            Math.abs(b.x - action.x) < 7.5 && Math.abs(b.z - action.z) < 7.5,
        )
      )
        return reject("Another building occupies this plot.");
      const candidate = {
        id: next.nextId,
        type: action.buildingType,
        level: 1,
        x: action.x,
        z: action.z,
        condition: 100,
        workers: 0,
      };
      const geometry = {
        ...next,
        buildings: [...next.buildings, candidate],
        links: [],
      };
      if (next.links.some((link) => !validateLink(geometry, link).valid))
        return reject(
          "This plot crosses existing infrastructure. Remove or reroute the connection first.",
        );
      if (!charge(CATALOG[action.buildingType].cost))
        return reject("Insufficient construction resources.");
      next.buildings.push({
        id: next.nextId++,
        type: action.buildingType,
        level: 1,
        x: action.x,
        z: action.z,
        condition: 100,
        workers: 0,
      });
      message = `${CATALOG[action.buildingType].name} constructed. Connect its utilities to begin operation.`;
      break;
    }
    case "demolish": {
      if (!building) return reject("Select an existing building to demolish.");
      if (
        building.type === "habitat" &&
        next.buildings.filter((b) => b.type === "habitat").length === 1 &&
        next.colony.population > 0
      )
        return reject(
          "Build another habitat before demolishing your last occupied habitat.",
        );
      next.buildings = next.buildings.filter((b) => b.id !== building.id);
      next.links = next.links.filter(
        (l) => l.from !== building.id && l.to !== building.id,
      );
      const lost = next.energyStorage?.[building.id] ?? 0;
      next.resources.energy = Math.max(0, next.resources.energy - lost);
      delete next.energyStorage[building.id];
      const salvage = Math.floor(CATALOG[building.type].cost.metal * 0.5);
      if (!freeBuild(next))
        next.resources.metal = Math.min(
          LIMITS.metal,
          next.resources.metal + salvage,
        );
      message = `${CATALOG[building.type].name} demolished. Attached links removed; ${freeBuild(next) ? 0 : salvage} metal recovered. Stored energy at this building was lost.`;
      break;
    }
    case "move": {
      if (!building) return reject("Select an existing building to move.");
      if (![action.x, action.z].every((n) => Number.isFinite(n) && n % 8 === 0))
        return reject("Choose a valid construction grid position.");
      const width =
        next.colony.population >= 5000
          ? 240
          : next.colony.population >= 1500
            ? 170
            : next.colony.population >= 500
              ? 120
              : 80;
      if (
        Math.abs(action.x) > width / 2 - 3.75 ||
        Math.abs(action.z) > width / 2 - 3.75
      )
        return reject("Keep the building inside colony territory.");
      if (
        next.buildings.some(
          (b) =>
            b.id !== building.id &&
            Math.abs(b.x - action.x) < 7.5 &&
            Math.abs(b.z - action.z) < 7.5,
        )
      )
        return reject("Another building occupies this plot.");
      if (building.x === action.x && building.z === action.z)
        return reject("Choose a different plot.");
      building.x = action.x;
      building.z = action.z;
      const geometry = { ...next, links: [] };
      if (next.links.some((l) => !validateLink(geometry, l).valid))
        return reject(
          "Moving here would stretch or obstruct a utility link. Remove affected links first.",
        );
      message = `${CATALOG[building.type].name} relocated. Connections and crew retained; site yield updated.`;
      break;
    }
    case "upgrade": {
      if (!building) return reject("Select a building to upgrade.");
      if (building.level >= CATALOG[building.type].max)
        return reject("This building is at maximum level.");
      if (!charge(upgradeCost(building)))
        return reject("Insufficient upgrade resources.");
      building.level += 1;
      message = `${CATALOG[building.type].name} upgraded to level ${building.level}.`;
      break;
    }
    case "connect": {
      const validation = validateLink(next, action);
      if (!validation.valid) return reject(validation.reason);
      if (!charge(validation.cost))
        return reject("Insufficient metal for this connection.");
      next.links.push({
        id: next.nextLinkId++,
        kind: action.kind,
        from: action.from,
        to: action.to,
      });
      message = `${action.kind === "power" ? "Power cable" : action.kind === "water" ? "Water pipe" : "Pressurized corridor"} connected.`;
      break;
    }
    case "disconnect": {
      if (
        !Number.isInteger(action.id) ||
        !next.links.some((link) => link.id === action.id)
      )
        return reject("Select an existing connection.");
      next.links = next.links.filter((link) => link.id !== action.id);
      message = "Connection removed. Check affected facility status.";
      break;
    }
    case "assign": {
      if (
        !building ||
        !Number.isInteger(action.workers) ||
        !number(action.workers, 0, workerCapacity(building))
      )
        return reject("Choose a valid whole-number worker assignment.");
      const others = next.buildings.reduce(
        (sum, b) => sum + (b.id === building.id ? 0 : b.workers),
        0,
      );
      if (others + action.workers > next.colony.population)
        return reject("Not enough unassigned colonists.");
      if (
        action.workers > 0 &&
        !networkStatus(next).byBuilding[building.id]?.corridor
      )
        return reject(
          "Connect a pressurized corridor to a habitat before assigning workers.",
        );
      building.workers = action.workers;
      message = `${action.workers} workers assigned to ${CATALOG[building.type].name}.`;
      break;
    }
    case "repair": {
      if (!building) return reject("Select a building to maintain.");
      if (building.condition >= 100)
        return reject("This building is already in full condition.");
      if (!charge(repairCost(building)))
        return reject("Insufficient metal for maintenance.");
      building.condition = 100;
      message = "Maintenance complete. Condition restored to 100%.";
      break;
    }
    case "policy": {
      if (
        !own(POLICY_DEFINITIONS, action.key) ||
        typeof action.value !== "boolean"
      )
        return reject("Choose a valid colony policy.");
      next.policies[action.key] = action.value;
      message = `${POLICY_DEFINITIONS[action.key].name} ${action.value ? "enabled; upkeep applies each simulated sol" : "disabled"}.`;
      break;
    }
    case "research": {
      const technology = TECHNOLOGIES.find((t) => t.id === action.id);
      if (!technology || next.technologies[technology.id])
        return reject("Choose an available technology.");
      if (
        !getColonyReport(next).buildings.some(
          (b) => b.type === "research" && b.operating,
        )
      )
        return reject("An operating research facility is required.");
      if (!charge({ research: technology.cost }))
        return reject("Insufficient research points.");
      next.technologies[technology.id] = true;
      message = `${technology.name} unlocked.`;
      break;
    }
    case "claim": {
      const goal = getColonyReport(next).campaign.current;
      if (!goal || !goal.complete)
        return reject(
          "Complete the current objective before claiming its reward.",
        );
      next.campaign.claimed.push(goal.id);
      for (const [key, amount] of Object.entries(goal.reward))
        next.resources[key] = Math.min(
          LIMITS[key],
          next.resources[key] + amount,
        );
      message = `Objective complete: ${goal.title}. Reward delivered.`;
      break;
    }
    case "advance":
      return { game: simulateSol(next), message: "Advanced one Martian sol." };
    case "pause":
      next.paused = !next.paused;
      message = next.paused ? "Simulation paused." : "Simulation resumed.";
      break;
    case "sandboxSurvival":
      if (next.mode !== "sandbox")
        return reject(
          "Survival simulation is always enabled in survival mode.",
        );
      next.sandboxSurvival = !next.sandboxSurvival;
      message = `Sandbox survival ${next.sandboxSurvival ? "enabled" : "disabled"}.`;
      break;
    default:
      return reject("Unknown colony action.");
  }
  next.energyStorage = energyStorageFor(next);
  next.history = [...(next.history ?? []), message].slice(-20);
  return { game: next, message };
}
