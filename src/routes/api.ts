import { Router, type RequestHandler, type Response } from "express";
import { z } from "zod";
import {
  categoryBreakdown,
  customRange,
  describeRange,
  goalProgress,
  inRange,
  monthlyTrends,
  periodRange,
  queryTransactions,
  spendingSummary,
  sum,
} from "../data/compute.js";
import {
  categoriesFixture,
  dateRangePresetsFixture,
  DEMO_USERS,
  findUser,
  type DemoUser,
} from "../data/fixtures.js";
import { generateTransactions } from "../data/generateTransactions.js";
import type { GoalsRepository, StoredGoal } from "../goals/repository.js";
import { HttpError, parse } from "../http.js";
import {
  createGoalInputSchema,
  isoDateSchema,
  periodSchema,
  sortBySchema,
  updateGoalInputSchema,
  type Transaction,
} from "../schemas.js";

// The spending API. Validates input, returns 400/401/404/409 errors, and
// derives every figure from one transaction history, so all endpoints agree.
// Which data a customer gets depends on their scenario in DEMO_USERS.

const signInBodySchema = z.object({
  accountNumber: z.string(),
  pin: z.string(),
});

const periodQuerySchema = z.object({
  period: periodSchema.default("30d"),
});

const categoriesQuerySchema = z
  .object({
    period: periodSchema.default("30d"),
    startDate: isoDateSchema.optional(),
    endDate: isoDateSchema.optional(),
  })
  .refine(
    ({ startDate, endDate }) => !startDate || !endDate || startDate <= endDate,
    { error: "startDate must be on or before endDate" },
  );

const trendsQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).default(12),
});

const knownCategory = z
  .string()
  .refine((name) => categoriesFixture.some((c) => c.name === name), {
    error: "Unknown category",
  });

const transactionsQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    category: knownCategory.optional(),
    startDate: isoDateSchema.optional(),
    endDate: isoDateSchema.optional(),
    sortBy: sortBySchema.default("date_desc"),
  })
  .refine(
    ({ startDate, endDate }) => !startDate || !endDate || startDate <= endDate,
    { error: "startDate must be on or before endDate" },
  );

const createGoalBodySchema = createGoalInputSchema.extend({
  category: knownCategory,
});

/** The customer in the URL, set by `loadCustomer`. */
type CustomerLocals = { user: DemoUser };
const customerOf = (response: Response) =>
  (response.locals as CustomerLocals).user;

const loadCustomer: RequestHandler<{ customerId: string }> = (
  request,
  response,
  next,
) => {
  const user = findUser(request.params.customerId);
  if (!user) {
    throw new HttpError(404, `Customer ${request.params.customerId} not found`);
  }
  (response.locals as CustomerLocals).user = user;
  next();
};

/** The "error" demo customer: every spending endpoint is down. */
const failInErrorScenario: RequestHandler = (_request, response, next) => {
  if (customerOf(response).scenario === "error") {
    throw new HttpError(500, "The spending service is temporarily unavailable");
  }
  next();
};

export function createApiRouter({
  goals,
  now,
}: {
  goals: GoalsRepository;
  now: () => Date;
}) {
  const transactionsOf = (user: DemoUser): Transaction[] =>
    user.scenario === "active" ? generateTransactions(now()) : [];

  const goalResponse = (user: DemoUser, goal: StoredGoal) =>
    goalProgress(goal, transactionsOf(user), now());

  const api = Router();

  api.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  api.post("/auth/sign-in", (request, response) => {
    const body = parse(signInBodySchema, request.body);
    const user = DEMO_USERS.find(
      (candidate) =>
        candidate.accountNumber === body.accountNumber &&
        candidate.pin === body.pin,
    );
    if (!user) throw new HttpError(401, "Incorrect account number or PIN");

    response.json({ customerId: user.customerId, name: user.profile.name });
  });

  const customer = Router({ mergeParams: true });
  customer.use(loadCustomer);

  // Stays up for the "error" customer, so the dashboard shell still renders.
  customer.get("/profile", (_request, response) => {
    const user = customerOf(response);
    response.json({
      customerId: user.customerId,
      ...user.profile,
      totalSpent: sum(transactionsOf(user)),
    });
  });

  customer.get(
    "/spending/summary",
    failInErrorScenario,
    (request, response) => {
      const query = parse(periodQuerySchema, request.query);
      response.json(
        spendingSummary(
          transactionsOf(customerOf(response)),
          categoriesFixture,
          query.period,
          now(),
        ),
      );
    },
  );

  customer.get(
    "/spending/categories",
    failInErrorScenario,
    (request, response) => {
      const query = parse(categoriesQuerySchema, request.query);
      const range =
        query.startDate && query.endDate
          ? customRange(query.startDate, query.endDate)
          : periodRange(query.period, now());

      response.json({
        dateRange: describeRange(range),
        ...categoryBreakdown(
          inRange(transactionsOf(customerOf(response)), range),
          categoriesFixture,
        ),
      });
    },
  );

  customer.get("/spending/trends", failInErrorScenario, (request, response) => {
    const query = parse(trendsQuerySchema, request.query);
    response.json({
      trends: monthlyTrends(
        transactionsOf(customerOf(response)),
        query.months,
        now(),
      ),
    });
  });

  customer.get("/transactions", failInErrorScenario, (request, response) => {
    const query = parse(transactionsQuerySchema, request.query);
    response.json(
      queryTransactions(transactionsOf(customerOf(response)), query),
    );
  });

  customer.get("/goals", failInErrorScenario, async (_request, response) => {
    const user = customerOf(response);
    const stored = await goals.list(user.customerId);
    response.json({ goals: stored.map((goal) => goalResponse(user, goal)) });
  });

  customer.post("/goals", failInErrorScenario, async (request, response) => {
    const user = customerOf(response);
    const body = parse(createGoalBodySchema, request.body);
    const goal = await goals.create(user.customerId, body);
    if (!goal) {
      throw new HttpError(409, `A goal for ${body.category} already exists`);
    }
    response.status(201).json(goalResponse(user, goal));
  });

  customer.patch(
    "/goals/:goalId",
    failInErrorScenario,
    async (request, response) => {
      const user = customerOf(response);
      const { goalId } = request.params as { goalId: string };
      const body = parse(updateGoalInputSchema, request.body);
      const goal = await goals.updateBudget(
        user.customerId,
        goalId,
        body.monthlyBudget,
      );
      if (!goal) {
        throw new HttpError(404, `Goal ${goalId} not found`);
      }
      response.json(goalResponse(user, goal));
    },
  );

  customer.delete(
    "/goals/:goalId",
    failInErrorScenario,
    async (request, response) => {
      const user = customerOf(response);
      const { goalId } = request.params as { goalId: string };
      const deleted = await goals.delete(user.customerId, goalId);
      if (!deleted) {
        throw new HttpError(404, `Goal ${goalId} not found`);
      }
      response.status(204).end();
    },
  );

  customer.get("/filters", failInErrorScenario, (_request, response) => {
    response.json({
      categories: categoriesFixture,
      dateRangePresets: dateRangePresetsFixture,
    });
  });

  api.use("/customers/:customerId", customer);
  return api;
}
