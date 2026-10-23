import type { Transaction } from "../schemas.js";
import { addUtcDays, DAY_MS, startOfUtcDay } from "./dates.js";
import { categoriesFixture, merchantsByCategory } from "./fixtures.js";

/** Days of history to generate: enough for the 24-month trends maximum. */
export const HISTORY_DAYS = 760;

const SEED = 20240916;

/** mulberry32: tiny, fast, seedable PRNG so the data is identical every run. */
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates a realistic, deterministic transaction history ending at `now`,
 * newest first. The same `now` day always produces the same data.
 */
export function generateTransactions(now: Date): Transaction[] {
  const random = createRandom(SEED);
  const pick = <T>(items: readonly T[]) =>
    items[Math.floor(random() * items.length)];

  const categoryEntries = Object.entries(merchantsByCategory);
  const totalWeight = categoryEntries.reduce((sum, [, c]) => sum + c.weight, 0);
  const pickCategory = () => {
    let roll = random() * totalWeight;
    for (const [name, config] of categoryEntries) {
      roll -= config.weight;
      if (roll < 0) return { name, config };
    }
    const [name, config] = categoryEntries[categoryEntries.length - 1];
    return { name, config };
  };
  const metaByName = new Map(categoriesFixture.map((c) => [c.name, c]));

  const today = startOfUtcDay(now);
  const transactions: Transaction[] = [];
  let sequence = 0;

  // Walk forwards from the oldest day so IDs increase with time.
  for (let daysAgo = HISTORY_DAYS - 1; daysAgo >= 0; daysAgo--) {
    const day = addUtcDays(today, -daysAgo);
    // 0-3 transactions a day, averaging about 1.7.
    const count = [0, 1, 1, 2, 2, 2, 3, 3][Math.floor(random() * 8)];
    // Today only has transactions up to the current time.
    const maxOffset = daysAgo === 0 ? now.getTime() - day.getTime() : DAY_MS;

    for (let i = 0; i < count; i++) {
      const { name, config } = pickCategory();
      const merchant = pick(config.merchants);
      const meta = metaByName.get(name);
      const amount = merchant.min + random() * (merchant.max - merchant.min);
      const date = new Date(day.getTime() + Math.floor(random() * maxOffset));

      sequence += 1;
      transactions.push({
        id: `txn_${String(100000 + sequence)}`,
        date: date.toISOString(),
        merchant: merchant.name,
        category: name,
        amount: Math.round(amount * 100) / 100,
        description: merchant.description,
        paymentMethod: pick(merchant.paymentMethods),
        icon: meta?.icon ?? "circle",
        categoryColor: meta?.color ?? "#999999",
      });
    }
  }

  return transactions.sort((a, b) => b.date.localeCompare(a.date));
}
