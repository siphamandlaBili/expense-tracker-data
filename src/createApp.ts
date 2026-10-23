import cors from "cors";
import express from "express";
import helmet from "helmet";
import type { GoalsRepository } from "./goals/repository.js";
import { errorHandler, notFound } from "./http.js";
import { createApiRouter } from "./routes/api.js";

export type AppOptions = {
  goals: GoalsRepository;
};

export function createApp({ goals }: AppOptions) {
  const app = express();

  app.use(helmet());
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
  // Customer data: never cached by browsers or proxies.
  app.use((_request, response, next) => {
    response.set("Cache-Control", "no-store");
    next();
  });

  app.use("/api", createApiRouter({ goals, now: () => new Date() }));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
