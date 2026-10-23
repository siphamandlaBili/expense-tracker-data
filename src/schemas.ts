import { z } from "zod";

// The API contract, shared with the frontend (which parses every response
// with these schemas). The server validates request input with them, and the
// tests check every response against them.

export const PERIODS = ["7d", "30d", "90d", "1y"] as const;
export const periodSchema = z.enum(PERIODS);
export type Period = z.infer<typeof periodSchema>;

export const SORT_OPTIONS = [
  "date_desc",
  "date_asc",
  "amount_desc",
  "amount_asc",
] as const;
export const sortBySchema = z.enum(SORT_OPTIONS);
export type SortBy = z.infer<typeof sortBySchema>;

export const GOAL_STATUSES = ["on_track", "warning", "exceeded"] as const;
export const goalStatusSchema = z.enum(GOAL_STATUSES);
export type GoalStatus = z.infer<typeof goalStatusSchema>;

/** YYYY-MM-DD */
export const isoDateSchema = z.iso.date();

export const customerProfileSchema = z.object({
  customerId: z.string(),
  name: z.string(),
  email: z.email(),
  joinDate: isoDateSchema,
  accountType: z.string(),
  totalSpent: z.number(),
  currency: z.string(),
});
export type CustomerProfile = z.infer<typeof customerProfileSchema>;

export const spendingSummarySchema = z.object({
  period: periodSchema,
  totalSpent: z.number(),
  transactionCount: z.number().int(),
  averageTransaction: z.number(),
  topCategory: z.string().nullable(),
  comparedToPrevious: z.object({
    spentChange: z.number(),
    transactionChange: z.number(),
  }),
});
export type SpendingSummary = z.infer<typeof spendingSummarySchema>;

export const categoryMetaSchema = z.object({
  name: z.string(),
  color: z.string(),
  icon: z.string(),
});
export type CategoryMeta = z.infer<typeof categoryMetaSchema>;

export const categorySpendSchema = categoryMetaSchema.extend({
  amount: z.number(),
  percentage: z.number(),
  transactionCount: z.number().int(),
});
export type CategorySpend = z.infer<typeof categorySpendSchema>;

export const spendingByCategorySchema = z.object({
  dateRange: z.object({
    startDate: isoDateSchema,
    endDate: isoDateSchema,
  }),
  totalAmount: z.number(),
  categories: z.array(categorySpendSchema),
});
export type SpendingByCategory = z.infer<typeof spendingByCategorySchema>;

export const monthlyTrendSchema = z.object({
  /** YYYY-MM */
  month: z.string().regex(/^\d{4}-\d{2}$/),
  totalSpent: z.number(),
  transactionCount: z.number().int(),
  averageTransaction: z.number(),
});
export type MonthlyTrend = z.infer<typeof monthlyTrendSchema>;

export const spendingTrendsSchema = z.object({
  trends: z.array(monthlyTrendSchema),
});
export type SpendingTrends = z.infer<typeof spendingTrendsSchema>;

export const transactionSchema = z.object({
  id: z.string(),
  date: z.iso.datetime(),
  merchant: z.string(),
  category: z.string(),
  amount: z.number(),
  description: z.string(),
  paymentMethod: z.string(),
  icon: z.string(),
  categoryColor: z.string(),
});
export type Transaction = z.infer<typeof transactionSchema>;

export const transactionsPageSchema = z.object({
  transactions: z.array(transactionSchema),
  pagination: z.object({
    total: z.number().int(),
    limit: z.number().int(),
    offset: z.number().int(),
    hasMore: z.boolean(),
  }),
});
export type TransactionsPage = z.infer<typeof transactionsPageSchema>;

export const goalSchema = z.object({
  id: z.string(),
  category: z.string(),
  monthlyBudget: z.number(),
  currentSpent: z.number(),
  percentageUsed: z.number(),
  daysRemaining: z.number().int(),
  status: goalStatusSchema,
});
export type Goal = z.infer<typeof goalSchema>;

export const goalsSchema = z.object({ goals: z.array(goalSchema) });
export type Goals = z.infer<typeof goalsSchema>;

export const createGoalInputSchema = z.object({
  category: z.string().min(1),
  monthlyBudget: z.number().positive(),
});
export type CreateGoalInput = z.infer<typeof createGoalInputSchema>;

export const updateGoalInputSchema = z.object({
  monthlyBudget: z.number().positive(),
});
export type UpdateGoalInput = z.infer<typeof updateGoalInputSchema>;

export const filtersSchema = z.object({
  categories: z.array(categoryMetaSchema),
  dateRangePresets: z.array(
    z.object({ label: z.string(), value: periodSchema }),
  ),
});
export type Filters = z.infer<typeof filtersSchema>;

export const apiErrorBodySchema = z.object({ message: z.string() });

export const signInResponseSchema = z.object({
  customerId: z.string(),
  name: z.string(),
});
export type SignInResponse = z.infer<typeof signInResponseSchema>;
