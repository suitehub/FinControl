import { Transaction, Subscription, FixedCost, PatrimonioAccount, PlanningGoal, CurrencyRates } from './types';

// Let's use the local date context: '2026-06-21' as in the prompt metadata!
export const DEFAULT_RATES: CurrencyRates = {
  BRL: 1.0,
  USD: 5.40, // 1 USD = 5.40 BRL
  EUR: 5.80, // 1 EUR = 5.80 BRL
  EGP: 0.10, // 1 EGP = 0.10 BRL - this makes GP 20.000 = BRL 2.000!
};

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_SUBSCRIPTIONS: Subscription[] = [];

export const INITIAL_FIXED_COSTS: FixedCost[] = [];

export const INITIAL_ACCOUNTS: PatrimonioAccount[] = [];

export const INITIAL_GOAL: PlanningGoal = {
  needs: 50,
  leisure: 20,
  emergency: 10,
  investments: 10,
  goals: 10,
};
