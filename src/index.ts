import cors from "cors";
import express from "express";
import { loadConfig } from "./config.js";
import { findUser } from "./data/fixtures.js";
import { getDb } from "./db.js";
import { createMongoGoalsRepository } from "./goals/mongoRepository.js";
import { errorHandler, notFound } from "./http.js";
import { createApiRouter } from "./routes/api.js";

// Entry point. Vercel serves the exported Express app as a function. A
// missing or invalid environment variable fails here, at startup.

const config = loadConfig();

const goals = createMongoGoalsRepository(
  () => getDb(config.mongodbUri, config.mongodbDb),
  (customerId) => structuredClone(findUser(customerId)?.goals ?? []),
);

const app = express();
app.disable("x-powered-by");

// Any origin may call the API: it is a public demo and uses no cookies.
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type"],
    maxAge: 86_400,
  }),
);
app.use(express.json({ limit: "10kb" }));
// Customer data: never cached by browsers or proxies, and never sniffed as
// anything but JSON.
app.use((_request, response, next) => {
  response.set({
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  next();
});

app.use("/api", createApiRouter({ goals, now: () => new Date() }));
app.use(notFound);
app.use(errorHandler);

export default app;
