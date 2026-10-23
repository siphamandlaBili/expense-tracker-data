import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  MONGODB_DB: z.string().min(1).default("moya-bank"),
});

export type Config = {
  mongodbUri: string;
  mongodbDb: string;
};

/** Reads and checks the environment; throws a readable error if invalid. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    throw new Error(`Invalid configuration:\n${z.prettifyError(result.error)}`);
  }
  return {
    mongodbUri: result.data.MONGODB_URI,
    mongodbDb: result.data.MONGODB_DB,
  };
}
