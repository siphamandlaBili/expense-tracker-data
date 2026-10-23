# Moya Bank API

The Customer Spending Insights API behind the Moya Bank dashboard: profile,
spending summary, categories, monthly trends, transactions and budget goals.

Express 5 and TypeScript, deployed to Vercel as a function. Goals are stored in
MongoDB; everything else is demo data generated from a fixed seed, so every
customer's figures are realistic, consistent and the same on every request.

## Endpoints

All routes are under `/api`. Responses are JSON; errors are
`{ "message": "…" }` with the matching status.

| Method   | Path                                         | Notes                                                           |
| -------- | -------------------------------------------- | --------------------------------------------------------------- |
| `GET`    | `/health`                                    | `{ "status": "ok" }`                                            |
| `POST`   | `/auth/sign-in`                              | `{ accountNumber, pin }` → `{ customerId, name }`               |
| `GET`    | `/customers/:customerId/profile`             |                                                                 |
| `GET`    | `/customers/:customerId/spending/summary`    | `period` = `7d` \| `30d` \| `90d` \| `1y`                       |
| `GET`    | `/customers/:customerId/spending/categories` | `period`, or `startDate` + `endDate` (`YYYY-MM-DD`)             |
| `GET`    | `/customers/:customerId/spending/trends`     | `months` 1–24 (default 12)                                      |
| `GET`    | `/customers/:customerId/transactions`        | `limit`, `offset`, `category`, `startDate`, `endDate`, `sortBy` |
| `GET`    | `/customers/:customerId/goals`               |                                                                 |
| `POST`   | `/customers/:customerId/goals`               | `{ category, monthlyBudget }`; 409 if one exists                |
| `PATCH`  | `/customers/:customerId/goals/:goalId`       | `{ monthlyBudget }`                                             |
| `DELETE` | `/customers/:customerId/goals/:goalId`       | 204                                                             |
| `GET`    | `/customers/:customerId/filters`             | categories and date presets                                     |

Response shapes are defined by the zod schemas in `src/schemas.ts`, the same
contract the frontend parses every response with.

### Demo customers

| Account number   | PIN     | Customer | Behaviour                                    |
| ---------------- | ------- | -------- | -------------------------------------------- |
| `12345678901234` | `12345` | 12345    | Two years of transactions and two goals      |
| `23456789012345` | `23456` | 23456    | A new customer: no transactions or goals     |
| `34567890123456` | `34567` | 34567    | Spending endpoints return 500; profile works |

## Configuration

Set these as environment variables (in Vercel: Project → Settings →
Environment Variables). See `.env.example`.

| Variable      | Required | Default     | Purpose                                |
| ------------- | -------- | ----------- | -------------------------------------- |
| `MONGODB_URI` | yes      |             | MongoDB connection string (e.g. Atlas) |
| `MONGODB_DB`  | no       | `moya-bank` | Database name                          |

The app checks these at startup and fails with a clear message if
`MONGODB_URI` is missing.

## Deploy to Vercel

1. Create a MongoDB database, for example a free MongoDB Atlas cluster (or add
   the MongoDB Atlas integration from the Vercel marketplace, which sets
   `MONGODB_URI` for you). In Atlas, allow access from anywhere
   (`0.0.0.0/0`): Vercel functions have no fixed IP addresses.
2. Import this repository in Vercel. No build settings are needed: Vercel
   detects the Express app in `src/index.ts`.
3. Set the environment variables above and deploy.
4. Check `https://<your-app>.vercel.app/api/health`, then give the frontend
   `https://<your-app>.vercel.app/api` as its API base URL.

## How it works

- **Data:** `src/data` generates about 1,300 transactions over 25 months for the
  active customer, ending at the current time. Summary, categories, trends,
  goal progress and profile totals are all calculated from that one list.
- **Goals:** stored per customer in the `customer_goals` collection, one
  document each. A customer starts with their demo goals the first time their
  goals are used. Every change is one atomic update, so concurrent requests
  can't lose edits or create two goals for the same category.
- **Database connection:** one shared client per function instance, opened on
  the first request that needs it.
- **Hardening:** input validated with zod (400 with the reason), JSON bodies
  limited to 10 KB, security headers (helmet), `Cache-Control: no-store`,
  CORS open to any origin (a public demo with no cookies), and unexpected errors logged but returned as
  a generic 500.

## Develop

Requires Node.js 24.

```sh
npm ci
npm run typecheck
npm run lint
npm run format:check
```
