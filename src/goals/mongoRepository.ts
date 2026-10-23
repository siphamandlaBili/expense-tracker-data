import type { Collection, Db } from "mongodb";
import { newGoalId } from "./goalId.js";
import type { GoalsRepository, SeedGoals, StoredGoal } from "./repository.js";

/** One document per customer, holding all of their goals. */
type CustomerGoalsDocument = {
  _id: string;
  goals: StoredGoal[];
};

export const GOALS_COLLECTION = "customer_goals";

/**
 * Goals in MongoDB. Every change is a single atomic update on the
 * customer's document, so concurrent requests can't lose writes or create
 * two goals for the same category.
 */
export function createMongoGoalsRepository(
  /** Resolves the database; the connection is opened on first use. */
  getDb: () => Promise<Db>,
  seedGoals: SeedGoals,
): GoalsRepository {
  const goalsCollection = async (): Promise<
    Collection<CustomerGoalsDocument>
  > => (await getDb()).collection(GOALS_COLLECTION);

  // Creates the customer's document with their seed goals if it doesn't
  // exist yet; never touches an existing one.
  const ensureSeeded = async (
    collection: Collection<CustomerGoalsDocument>,
    customerId: string,
  ) => {
    await collection.updateOne(
      { _id: customerId },
      { $setOnInsert: { goals: seedGoals(customerId) } },
      { upsert: true },
    );
  };

  return {
    async list(customerId) {
      const collection = await goalsCollection();
      await ensureSeeded(collection, customerId);
      const document = await collection.findOne({ _id: customerId });
      return document?.goals ?? [];
    },

    async create(customerId, input) {
      const collection = await goalsCollection();
      await ensureSeeded(collection, customerId);
      const goal = { id: newGoalId(), ...input };
      // Only matches when no goal has this category, so a duplicate (even
      // from a concurrent request) adds nothing.
      const result = await collection.updateOne(
        { _id: customerId, "goals.category": { $ne: input.category } },
        { $push: { goals: goal } },
      );
      return result.modifiedCount === 1 ? goal : null;
    },

    async updateBudget(customerId, goalId, monthlyBudget) {
      const collection = await goalsCollection();
      await ensureSeeded(collection, customerId);
      const document = await collection.findOneAndUpdate(
        { _id: customerId, "goals.id": goalId },
        { $set: { "goals.$.monthlyBudget": monthlyBudget } },
        { returnDocument: "after" },
      );
      return document?.goals.find(({ id }) => id === goalId) ?? null;
    },

    async delete(customerId, goalId) {
      const collection = await goalsCollection();
      await ensureSeeded(collection, customerId);
      const result = await collection.updateOne(
        { _id: customerId },
        { $pull: { goals: { id: goalId } } },
      );
      return result.modifiedCount === 1;
    },
  };
}
