import { createApp } from "./createApp.js";
import { loadConfig } from "./config.js";
import { findUser } from "./data/fixtures.js";
import { getDb } from "./db.js";
import { createMongoGoalsRepository } from "./goals/mongoRepository.js";

// Entry point. Vercel serves the exported Express app as a function. A
// missing or invalid environment variable fails here, at startup.

const config = loadConfig();

const goals = createMongoGoalsRepository(
  () => getDb(config.mongodbUri, config.mongodbDb),
  (customerId) => structuredClone(findUser(customerId)?.goals ?? []),
);

export default createApp({ goals });
