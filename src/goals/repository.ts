/** A goal as stored; progress fields are derived from transactions. */
export type StoredGoal = {
  id: string;
  category: string;
  monthlyBudget: number;
};

export type NewGoal = Omit<StoredGoal, "id">;

/**
 * Where customers' goals live. Each customer starts with their seed goals
 * (from the demo fixtures) the first time their goals are read or changed.
 */
export interface GoalsRepository {
  list(customerId: string): Promise<StoredGoal[]>;
  /** Null when the customer already has a goal for that category. */
  create(customerId: string, goal: NewGoal): Promise<StoredGoal | null>;
  /** Null when there is no such goal. */
  updateBudget(
    customerId: string,
    goalId: string,
    monthlyBudget: number,
  ): Promise<StoredGoal | null>;
  /** False when there is no such goal. */
  delete(customerId: string, goalId: string): Promise<boolean>;
}

export type SeedGoals = (customerId: string) => StoredGoal[];
