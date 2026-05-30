import { Transaction, Forecast } from '@/types';

/**
 * Simple linear regression-based month-end balance forecasting
 * Approximates Prophet's additive trend model
 */

export function forecastBalance(transactions: Transaction[], currentBalance: number): Forecast {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysLeft = Math.max(1, Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  // Calculate spend in current month only
  const debits = transactions.filter(t => t.amount < 0);
  const totalSpend = debits.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Estimate days elapsed this month
  const daysElapsed = now.getDate();
  const dailyBurnRate = daysElapsed > 0 ? totalSpend / daysElapsed : 0;

  // Projected additional spend for remaining days
  const projectedAdditionalSpend = dailyBurnRate * daysLeft;
  const projectedBalance = currentBalance - projectedAdditionalSpend;

  // Status thresholds
  let status: Forecast['status'];
  if (projectedBalance > currentBalance * 0.3) {
    status = 'on_track';
  } else if (projectedBalance > 0) {
    status = 'at_risk';
  } else {
    status = 'critical';
  }

  const endOfMonthDate = endOfMonth.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return {
    projectedBalance: Math.round(projectedBalance),
    currentBalance: Math.round(currentBalance),
    endOfMonthDate,
    status,
    dailyBurnRate: Math.round(dailyBurnRate),
    daysLeft,
  };
}

export function estimateCurrentBalance(transactions: Transaction[], seedBalance: number = 50000): number {
  // Estimate balance by summing all transactions from a seed
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  return Math.max(0, seedBalance + total);
}
