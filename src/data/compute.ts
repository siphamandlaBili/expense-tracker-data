import type {
  CategoryMeta,
  CategorySpend,
  Goal,
  GoalStatus,
  MonthlyTrend,
  Period,
  SortBy,
  SpendingSummary,
  Transaction,
} from "../schemas.js";
import {
  addUtcDays,
  DAY_MS,
  parseIsoDate,
  startOfUtcDay,
  startOfUtcMonth,
  toIsoDate,
  toIsoMonth,
} from "./dates.js";
import type { StoredGoal } from "../goals/repository.js";

// Pure calculations behind the endpoints. Every aggregate is derived from the same
// transaction list, so all endpoints agree with each other.

const PERIOD_DAYS: Record<Period, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
};

/** [start, end) */
export type DateRange = { start: Date; end: Date };

const round = (value: number, decimals: number) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};
export const sum = (transactions: Transaction[]) =>
  round(
    transactions.reduce((total, txn) => total + txn.amount, 0),
    2,
  );
const average = (transactions: Transaction[]) =>
  transactions.length === 0
    ? 0
    : round(sum(transactions) / transactions.length, 2);
const percentChange = (current: number, previous: number) =>
  previous === 0 ? 0 : round(((current - previous) / previous) * 100, 1);

export function periodRange(period: Period, now: Date): DateRange {
  const end = addUtcDays(startOfUtcDay(now), 1);
  return { start: addUtcDays(end, -PERIOD_DAYS[period]), end };
}

/** Inclusive YYYY-MM-DD dates to a [start, end) range. */
export function customRange(startDate: string, endDate: string): DateRange {
  return {
    start: parseIsoDate(startDate),
    end: addUtcDays(parseIsoDate(endDate), 1),
  };
}

export function describeRange({ start, end }: DateRange) {
  return {
    startDate: toIsoDate(start),
    endDate: toIsoDate(addUtcDays(end, -1)),
  };
}

export function inRange(
  transactions: Transaction[],
  { start, end }: DateRange,
) {
  const from = start.toISOString();
  const to = end.toISOString();
  return transactions.filter((txn) => txn.date >= from && txn.date < to);
}

export function categoryBreakdown(
  transactions: Transaction[],
  categories: CategoryMeta[],
): { totalAmount: number; categories: CategorySpend[] } {
  const totalAmount = sum(transactions);

  const breakdown = categories
    .map((meta) => {
      const inCategory = transactions.filter(
        (txn) => txn.category === meta.name,
      );
      const amount = sum(inCategory);
      return {
        ...meta,
        amount,
        percentage:
          totalAmount === 0 ? 0 : round((amount / totalAmount) * 100, 1),
        transactionCount: inCategory.length,
      };
    })
    .filter((category) => category.transactionCount > 0)
    .sort((a, b) => b.amount - a.amount);

  return { totalAmount, categories: breakdown };
}

export function spendingSummary(
  transactions: Transaction[],
  categories: CategoryMeta[],
  period: Period,
  now: Date,
): SpendingSummary {
  const range = periodRange(period, now);
  const length = range.end.getTime() - range.start.getTime();
  const previousRange = {
    start: new Date(range.start.getTime() - length),
    end: range.start,
  };

  const current = inRange(transactions, range);
  const previous = inRange(transactions, previousRange);
  const totalSpent = sum(current);

  return {
    period,
    totalSpent,
    transactionCount: current.length,
    averageTransaction: average(current),
    topCategory:
      categoryBreakdown(current, categories).categories[0]?.name ?? null,
    comparedToPrevious: {
      spentChange: percentChange(totalSpent, sum(previous)),
      transactionChange: percentChange(current.length, previous.length),
    },
  };
}

/** The last `months` calendar months, oldest first, including this month. */
export function monthlyTrends(
  transactions: Transaction[],
  months: number,
  now: Date,
): MonthlyTrend[] {
  return Array.from({ length: months }, (_, index) => {
    const offset = index - (months - 1);
    const range = {
      start: startOfUtcMonth(now, offset),
      end: startOfUtcMonth(now, offset + 1),
    };
    const inMonth = inRange(transactions, range);
    return {
      month: toIsoMonth(range.start),
      totalSpent: sum(inMonth),
      transactionCount: inMonth.length,
      averageTransaction: average(inMonth),
    };
  });
}

export function goalStatus(percentageUsed: number): GoalStatus {
  if (percentageUsed > 100) return "exceeded";
  if (percentageUsed >= 80) return "warning";
  return "on_track";
}

/** Progress against a monthly budget for the current calendar month. */
export function goalProgress(
  goal: StoredGoal,
  transactions: Transaction[],
  now: Date,
): Goal {
  const monthStart = startOfUtcMonth(now);
  const nextMonth = startOfUtcMonth(now, 1);
  const spent = sum(
    inRange(transactions, { start: monthStart, end: nextMonth }).filter(
      (txn) => txn.category === goal.category,
    ),
  );
  const percentageUsed = round((spent / goal.monthlyBudget) * 100, 2);
  const daysRemaining =
    Math.round((nextMonth.getTime() - startOfUtcDay(now).getTime()) / DAY_MS) -
    1;

  return {
    ...goal,
    currentSpent: spent,
    percentageUsed,
    daysRemaining,
    status: goalStatus(percentageUsed),
  };
}

const SORTERS: Record<SortBy, (a: Transaction, b: Transaction) => number> = {
  date_desc: (a, b) => b.date.localeCompare(a.date),
  date_asc: (a, b) => a.date.localeCompare(b.date),
  amount_desc: (a, b) => b.amount - a.amount,
  amount_asc: (a, b) => a.amount - b.amount,
};

export function queryTransactions(
  transactions: Transaction[],
  options: {
    limit: number;
    offset: number;
    sortBy: SortBy;
    category?: string;
    startDate?: string;
    endDate?: string;
  },
) {
  let result = transactions;
  if (options.category) {
    result = result.filter((txn) => txn.category === options.category);
  }
  if (options.startDate) {
    const from = parseIsoDate(options.startDate).toISOString();
    result = result.filter((txn) => txn.date >= from);
  }
  if (options.endDate) {
    const to = addUtcDays(parseIsoDate(options.endDate), 1).toISOString();
    result = result.filter((txn) => txn.date < to);
  }

  const sorted = [...result].sort(SORTERS[options.sortBy]);
  const page = sorted.slice(options.offset, options.offset + options.limit);

  return {
    transactions: page,
    pagination: {
      total: sorted.length,
      limit: options.limit,
      offset: options.offset,
      hasMore: options.offset + page.length < sorted.length,
    },
  };
}
