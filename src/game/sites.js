
export const LANDING_SITES = {
  jezero: {
    id: "jezero",
    name: "Jezero Crater",
    region: "Isidis Planitia",
    latitude: 18.38,
    longitude: 77.58,
    description:
      "Ancient river delta with scientifically interesting sedimentary geology.",
    difficulty: "Moderate",
    terrainFile: "/data/terrain/jezero.json",
  },

  gale: {
    id: "gale",
    name: "Gale Crater",
    region: "Aeolis Palus",
    latitude: -5.4,
    longitude: 137.8,
    description:
      "Large impact crater featuring layered geological formations.",
    difficulty: "Challenging",
    terrainFile: "/data/terrain/gale.json",
  },

  elysium: {
    id: "elysium",
    name: "Elysium Planitia",
    region: "Elysium",
    latitude: 4.5,
    longitude: 135.9,
    description:
      "Broad volcanic plains offering a different settlement environment.",
    difficulty: "Beginner",
    terrainFile: "/data/terrain/elysium.json",
  },
};

export const DEFAULT_SITE = "jezero";
