export function pickCountKey<One extends string, Many extends string>(
  oneKey: One,
  manyKey: Many,
  count: number
): One | Many {
  return count === 1 ? oneKey : manyKey
}
