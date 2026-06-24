/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  value: number;
  category: string;
  type: TransactionType;
  dizimoSeparado?: boolean; // Only for income
}

export type CurrencyType = 'BRL' | 'USD' | 'EUR' | 'EGP';

export interface Subscription {
  id: string;
  name: string;
  category: string;
  value: number;
  currency: CurrencyType;
  billingDate: number; // Day of the month
  autoRenew: boolean;
}

export interface FixedCost {
  id: string;
  name: string;
  value: number;
  dueDate: number; // Day of the month
  required: boolean;
}

export type AccountType = 'corrente' | 'poupança' | 'físico' | 'internacional';

export interface PatrimonioAccount {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: CurrencyType;
}

export interface PlanningGoal {
  needs: number;       // default 50
  leisure: number;     // default 20
  emergency: number;   // default 10
  investments: number; // default 10
  goals: number;       // default 10
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface CurrencyRates {
  BRL: number; // Base currency
  USD: number; // e.g. 1 USD = 5.40 BRL
  EUR: number; // e.g. 1 EUR = 5.80 BRL
  EGP: number; // e.g. 1 EGP = 0.11 BRL
}
