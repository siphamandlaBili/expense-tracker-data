import type { Transaction } from "../schemas.js";
import { categoriesFixture } from "./fixtures.js";

type Seed = Pick<
  Transaction,
  "date" | "merchant" | "category" | "amount" | "description" | "paymentMethod"
>;

/**
 * Fixed transactions for the start of November 2026, so the month has
 * spending from day one instead of depending on the generator's dice.
 * Times are UTC (South Africa is UTC+2).
 */
const SEEDS: Seed[] = [
  {
    date: "2026-11-01T04:00:00.000Z",
    merchant: "City of Johannesburg",
    category: "Utilities",
    amount: 1185.4,
    description: "Rates and water",
    paymentMethod: "Debit Order",
  },
  {
    date: "2026-11-01T04:05:00.000Z",
    merchant: "Netflix",
    category: "Entertainment",
    amount: 199,
    description: "Monthly subscription",
    paymentMethod: "Debit Order",
  },
  {
    date: "2026-11-01T04:10:00.000Z",
    merchant: "Vodacom",
    category: "Utilities",
    amount: 599,
    description: "Contract",
    paymentMethod: "Debit Order",
  },
  {
    date: "2026-11-01T08:12:00.000Z",
    merchant: "Mugg & Bean",
    category: "Dining",
    amount: 148.5,
    description: "Breakfast",
    paymentMethod: "Tap to Pay",
  },
  {
    date: "2026-11-01T09:34:00.000Z",
    merchant: "Pick n Pay",
    category: "Groceries",
    amount: 586.35,
    description: "Weekly groceries",
    paymentMethod: "Credit Card",
  },
  {
    date: "2026-11-01T11:20:00.000Z",
    merchant: "Mr Price",
    category: "Shopping",
    amount: 459.99,
    description: "Clothing",
    paymentMethod: "Debit Card",
  },
  {
    date: "2026-11-02T05:45:00.000Z",
    merchant: "Engen",
    category: "Transportation",
    amount: 720,
    description: "Fuel",
    paymentMethod: "Debit Card",
  },
  {
    date: "2026-11-02T06:30:00.000Z",
    merchant: "Gautrain",
    category: "Transportation",
    amount: 64,
    description: "Train fare",
    paymentMethod: "Tap to Pay",
  },
  {
    date: "2026-11-02T10:15:00.000Z",
    merchant: "Uber Eats",
    category: "Dining",
    amount: 189.9,
    description: "Food delivery",
    paymentMethod: "Credit Card",
  },
  {
    date: "2026-11-02T15:05:00.000Z",
    merchant: "Checkers",
    category: "Groceries",
    amount: 342.6,
    description: "Groceries top-up",
    paymentMethod: "Debit Card",
  },
  {
    date: "2026-11-02T17:40:00.000Z",
    merchant: "Takealot",
    category: "Shopping",
    amount: 1249,
    description: "Online order",
    paymentMethod: "Credit Card",
  },
];

/** The seeded transactions dated up to `now`, so none is in the future. */
export function seededTransactions(now: Date): Transaction[] {
  const metaByName = new Map(categoriesFixture.map((c) => [c.name, c]));
  const cutoff = now.toISOString();

  return SEEDS.map((seed, index) => {
    const meta = metaByName.get(seed.category);
    return {
      id: `txn_${String(200001 + index)}`,
      ...seed,
      icon: meta?.icon ?? "circle",
      categoryColor: meta?.color ?? "#999999",
    };
  }).filter((txn) => txn.date <= cutoff);
}
