export interface Transaction {
  id: string;
  /** Raw description from the bank statement */
  description: string;
  /** Clean human-readable merchant name e.g. "Swiggy" */
  merchantName: string;
  /** Visual emoji for the merchant e.g. "🧡" */
  merchantEmoji: string;
  date: string;
  amount: number; // negative = debit, positive = credit
  category: string;
  isAnomaly: boolean;
  anomalyScore: number; // 0–1
  confidence: number; // 0–100
  explanation: string;
  time?: string;
}

export interface AnomalyDetail {
  transaction: Transaction;
  confidence: number;
  explanation: string;
  type: 'high_amount' | 'unknown_merchant' | 'unusual_time' | 'duplicate' | 'category_spike';
}

export interface Forecast {
  projectedBalance: number;
  currentBalance: number;
  endOfMonthDate: string;
  status: 'on_track' | 'at_risk' | 'critical';
  dailyBurnRate: number;
  daysLeft: number;
}

export interface DashboardStats {
  totalTransactions: number;
  anomaliesFound: number;
  totalSpend: number;
  spendChange: number; // % vs last month estimate
  predictedBalance: number;
}
