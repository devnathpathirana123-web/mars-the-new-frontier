/** Sample an expanded footprint so even coarse terrain triangles stay below the deck. */
export function constructionPad(building, terrainHeight) {
  let low = Infinity,
    high = -Infinity;
  for (let x = -5.5; x <= 5.5; x += 0.5)
    for (let z = -5.5; z <= 5.5; z += 0.5) {
      const y = terrainHeight(building.x + x, building.z + z);
      low = Math.min(low, y);
      high = Math.max(high, y);
    }
  return { top: high + 0.25, bottom: low - 0.15, height: high - low + 0.4 };
}
