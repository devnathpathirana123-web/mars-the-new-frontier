
export const TERRAIN_SIZE = 24;

export function generateFallbackTerrain(size = TERRAIN_SIZE) {
  return Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => {
      const noise =
        Math.sin(x * 0.43) * 0.45 +
        Math.cos(y * 0.37) * 0.35 +
        Math.sin((x + y) * 0.21) * 0.2;

      return {
        height: Math.round((noise + 1) * 3),
        roughness: Math.abs(noise),
        slope: 0,
        source: "procedural",
      };
    })
  );
}

export function processElevationGrid(elevations) {
  const heights = elevations.flat();

  if (
    elevations.length !== TERRAIN_SIZE ||
    elevations.some(
      row => !Array.isArray(row) || row.length !== TERRAIN_SIZE
    ) ||
    heights.some(value => !Number.isFinite(value))
  ) {
    throw new Error("Invalid terrain elevation grid.");
  }

  const min = Math.min(...heights);
  const max = Math.max(...heights);
  const range = Math.max(max - min, 1);

  return elevations.map((row, y) =>
    row.map((elevation, x) => {
      const left = row[Math.max(0, x - 1)];
      const right = row[Math.min(TERRAIN_SIZE - 1, x + 1)];

      const upper =
        elevations[Math.max(0, y - 1)][x];

      const lower =
        elevations[Math.min(TERRAIN_SIZE - 1, y + 1)][x];

      const slope = Math.hypot(
        right - left,
        lower - upper
      );

      return {
        height: Math.round(
          ((elevation - min) / range) * 12
        ),
        elevation,
        roughness: slope / range,
        slope,
        source: "mola",
      };
    })
  );
}

export async function loadSiteTerrain(site) {
  try {
    const response = await fetch(site.terrainFile);

    if (!response.ok) {
      throw new Error("Terrain dataset unavailable.");
    }

    const data = await response.json();

    return {
      terrain: processElevationGrid(data.elevations),
      source: data.source,
      dataset: data.dataset,
    };
  } catch (error) {
    console.warn(
      `Using fallback terrain for ${site.name}:`,
      error.message
    );

    return {
      terrain: generateFallbackTerrain(),
      source: "procedural",
      dataset: null,
    };
  }
}
