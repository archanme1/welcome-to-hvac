/** Tiny fuzzy matcher: subsequence match with contiguity + prefix bonuses. */
export function fuzzyScore(query: string, target: string): number {
  if (!query) return 0;
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  const direct = t.indexOf(q);
  if (direct === 0) return 1000 - t.length;
  if (direct > 0) return 700 - direct - t.length * 0.1;

  let score = 0;
  let ti = 0;
  let streak = 0;
  for (const ch of q) {
    const found = t.indexOf(ch, ti);
    if (found === -1) return -1;
    streak = found === ti ? streak + 1 : 0;
    score += 10 + streak * 6 - Math.min(found - ti, 12);
    ti = found + 1;
  }
  return score - t.length * 0.1;
}

export function fuzzyFilter<T>(
  query: string,
  items: T[],
  key: (item: T) => string[],
  limit = 40,
): T[] {
  if (!query.trim()) return items.slice(0, limit);
  const scored: { item: T; score: number }[] = [];
  for (const item of items) {
    let best = -1;
    const fields = key(item);
    for (let i = 0; i < fields.length; i++) {
      const s = fuzzyScore(query, fields[i]!);
      if (s > best) best = s - i * 5;
    }
    if (best > 0) scored.push({ item, score: best });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.item);
}
