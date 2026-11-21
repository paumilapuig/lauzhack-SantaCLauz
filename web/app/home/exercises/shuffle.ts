function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic Fisher-Yates. Never keeps every item in its original position when length > 1. */
export function shuffle<T>(items: readonly T[], seed: number): T[] {
  const random = mulberry32(seed);
  const order = items.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const unchanged = order.every((from, i) => from === i);
  if (unchanged && order.length > 1) order.push(order.shift()!);
  return order.map((i) => items[i]);
}
