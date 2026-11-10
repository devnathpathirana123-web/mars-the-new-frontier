/** Normalize persisted or preview input without producing invalid geometry. */
export function modelLevel(value, max = 15) {
  const parsed = Number(value);
  return Math.max(
    1,
    Math.min(max, Number.isFinite(parsed) ? Math.floor(parsed) : 1),
  );
}
