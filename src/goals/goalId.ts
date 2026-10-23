import { randomUUID } from "node:crypto";

/** A new goal ID. Random, so concurrent creates never collide. */
export const newGoalId = () => `goal_${randomUUID()}`;
