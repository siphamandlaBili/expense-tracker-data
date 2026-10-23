import type { StoredGoal } from "../goals/repository.js";
import type { CategoryMeta, Filters } from "../schemas.js";

/**
 * - active: two years of transactions and two goals.
 * - empty:  a new customer with no transactions or goals (empty states).
 * - error:  signs in, but every spending endpoint returns 500 (error states).
 */
export type DemoScenario = "active" | "empty" | "error";

export type DemoUser = {
  customerId: string;
  accountNumber: string;
  pin: string;
  scenario: DemoScenario;
  profile: {
    name: string;
    email: string;
    joinDate: string;
    accountType: string;
    currency: string;
  };
  goals: StoredGoal[];
};

// Demo sign-in credentials. Not secrets: they only unlock demo data.
export const DEMO_USERS: DemoUser[] = [
  {
    customerId: "12345",
    accountNumber: "12345678901234",
    pin: "12345",
    scenario: "active",
    profile: {
      name: "John Doe",
      email: "john.doe@email.com",
      joinDate: "2023-01-15",
      accountType: "premium",
      currency: "ZAR",
    },
    goals: [
      { id: "goal_001", category: "Entertainment", monthlyBudget: 1000 },
      { id: "goal_002", category: "Groceries", monthlyBudget: 1500 },
    ],
  },
  {
    customerId: "23456",
    accountNumber: "23456789012345",
    pin: "23456",
    scenario: "empty",
    profile: {
      name: "Thandi Nkosi",
      email: "thandi.nkosi@email.com",
      joinDate: "2024-09-01",
      accountType: "standard",
      currency: "ZAR",
    },
    goals: [],
  },
  {
    customerId: "34567",
    accountNumber: "34567890123456",
    pin: "34567",
    scenario: "error",
    profile: {
      name: "Pieter van Wyk",
      email: "pieter.vanwyk@email.com",
      joinDate: "2022-06-20",
      accountType: "business",
      currency: "ZAR",
    },
    goals: [],
  },
];

const userWithScenario = (scenario: DemoScenario) =>
  DEMO_USERS.find((user) => user.scenario === scenario) as DemoUser;

export const ACTIVE_USER = userWithScenario("active");
export const EMPTY_USER = userWithScenario("empty");
export const ERROR_USER = userWithScenario("error");

/** The customer with data; the default in tests. */
export const CUSTOMER_ID = ACTIVE_USER.customerId;

export const findUser = (customerId: string) =>
  DEMO_USERS.find((user) => user.customerId === customerId);

export const categoriesFixture: CategoryMeta[] = [
  { name: "Groceries", color: "#FF6B6B", icon: "shopping-cart" },
  { name: "Entertainment", color: "#4ECDC4", icon: "film" },
  { name: "Transportation", color: "#45B7D1", icon: "car" },
  { name: "Dining", color: "#F7DC6F", icon: "utensils" },
  { name: "Shopping", color: "#BB8FCE", icon: "shopping-bag" },
  { name: "Utilities", color: "#85C1E9", icon: "zap" },
];

export const dateRangePresetsFixture: Filters["dateRangePresets"] = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "Last year", value: "1y" },
];

type Merchant = {
  name: string;
  min: number;
  max: number;
  description: string;
  paymentMethods: string[];
};

/**
 * How transactions are generated per category. `weight` is the relative
 * share of transactions; amounts are in rand.
 */
export const merchantsByCategory: Record<
  string,
  { weight: number; merchants: Merchant[] }
> = {
  Groceries: {
    weight: 30,
    merchants: [
      {
        name: "Pick n Pay",
        min: 80,
        max: 650,
        description: "Weekly groceries",
        paymentMethods: ["Credit Card", "Debit Card"],
      },
      {
        name: "Woolworths Food",
        min: 60,
        max: 520,
        description: "Groceries",
        paymentMethods: ["Credit Card", "Debit Card"],
      },
      {
        name: "Checkers",
        min: 70,
        max: 600,
        description: "Groceries top-up",
        paymentMethods: ["Debit Card"],
      },
      {
        name: "Spar",
        min: 30,
        max: 250,
        description: "Convenience groceries",
        paymentMethods: ["Debit Card", "Tap to Pay"],
      },
    ],
  },
  Entertainment: {
    weight: 10,
    merchants: [
      {
        name: "Netflix",
        min: 199,
        max: 199,
        description: "Monthly subscription",
        paymentMethods: ["Debit Order"],
      },
      {
        name: "Showmax",
        min: 99,
        max: 99,
        description: "Monthly subscription",
        paymentMethods: ["Debit Order"],
      },
      {
        name: "Spotify",
        min: 69.99,
        max: 69.99,
        description: "Music subscription",
        paymentMethods: ["Credit Card"],
      },
      {
        name: "Ster-Kinekor",
        min: 90,
        max: 280,
        description: "Movie tickets",
        paymentMethods: ["Credit Card", "Tap to Pay"],
      },
      {
        name: "Computicket",
        min: 150,
        max: 750,
        description: "Event tickets",
        paymentMethods: ["Credit Card"],
      },
    ],
  },
  Transportation: {
    weight: 22,
    merchants: [
      {
        name: "Uber",
        min: 45,
        max: 220,
        description: "Ride",
        paymentMethods: ["Credit Card"],
      },
      {
        name: "Bolt",
        min: 40,
        max: 180,
        description: "Ride",
        paymentMethods: ["Credit Card"],
      },
      {
        name: "Engen",
        min: 300,
        max: 950,
        description: "Fuel",
        paymentMethods: ["Debit Card", "Credit Card"],
      },
      {
        name: "Shell",
        min: 300,
        max: 950,
        description: "Fuel",
        paymentMethods: ["Debit Card"],
      },
      {
        name: "Gautrain",
        min: 30,
        max: 120,
        description: "Train fare",
        paymentMethods: ["Tap to Pay"],
      },
    ],
  },
  Dining: {
    weight: 18,
    merchants: [
      {
        name: "Nando's",
        min: 110,
        max: 380,
        description: "Dinner",
        paymentMethods: ["Credit Card", "Tap to Pay"],
      },
      {
        name: "Mugg & Bean",
        min: 70,
        max: 260,
        description: "Breakfast",
        paymentMethods: ["Tap to Pay"],
      },
      {
        name: "Ocean Basket",
        min: 180,
        max: 520,
        description: "Dinner",
        paymentMethods: ["Credit Card"],
      },
      {
        name: "Steers",
        min: 60,
        max: 180,
        description: "Takeaway",
        paymentMethods: ["Tap to Pay"],
      },
      {
        name: "Uber Eats",
        min: 90,
        max: 320,
        description: "Food delivery",
        paymentMethods: ["Credit Card"],
      },
    ],
  },
  Shopping: {
    weight: 12,
    merchants: [
      {
        name: "Takealot",
        min: 120,
        max: 2400,
        description: "Online order",
        paymentMethods: ["Credit Card"],
      },
      {
        name: "Mr Price",
        min: 100,
        max: 800,
        description: "Clothing",
        paymentMethods: ["Debit Card", "Tap to Pay"],
      },
      {
        name: "Woolworths",
        min: 150,
        max: 1200,
        description: "Clothing and home",
        paymentMethods: ["Credit Card"],
      },
      {
        name: "Superbalist",
        min: 200,
        max: 1500,
        description: "Online order",
        paymentMethods: ["Credit Card"],
      },
    ],
  },
  Utilities: {
    weight: 8,
    merchants: [
      {
        name: "City of Johannesburg",
        min: 650,
        max: 1400,
        description: "Rates and water",
        paymentMethods: ["Debit Order"],
      },
      {
        name: "Eskom Prepaid",
        min: 200,
        max: 800,
        description: "Electricity",
        paymentMethods: ["Debit Card"],
      },
      {
        name: "Vodacom",
        min: 399,
        max: 899,
        description: "Contract",
        paymentMethods: ["Debit Order"],
      },
      {
        name: "Telkom",
        min: 459,
        max: 459,
        description: "Fibre",
        paymentMethods: ["Debit Order"],
      },
    ],
  },
};
