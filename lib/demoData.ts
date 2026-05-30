import { Transaction } from '@/types';
import { normalizeMerchant } from './merchantNormalizer';

/**
 * Demo data — realistic Indian bank statement
 * All merchant info auto-derived from normalizeMerchant()
 */

function tx(
  id: string, description: string, date: string, amount: number,
  isAnomaly = false, anomalyScore = 0, confidence = 0, explanation = ''
): Transaction {
  const m = normalizeMerchant(description);
  return { id, description, merchantName: m.name, merchantEmoji: m.emoji, date, amount, category: m.category, isAnomaly, anomalyScore, confidence, explanation };
}

export const DEMO_TRANSACTIONS: Transaction[] = [
  tx('demo-1',  'Amazon Pay',        '19 May', -3400, true,  0.78, 70,  "3.2x your usual shopping spend. Unusual time: 2:47 AM. Possible impulse or unauthorized charge."),
  tx('demo-2',  'Swiggy',            '18 May', -340),
  tx('demo-3',  'Salary Credit',     '17 May', 55000),
  tx('demo-4',  'Unknown Merchant',  '16 May', -12000, true, 0.95, 91, "4.8x above your average transaction. No prior history with this merchant. Flagged by Isolation Forest."),
  tx('demo-5',  'Zomato',            '15 May', -290),
  tx('demo-6',  'Uber',              '14 May', -180),
  tx('demo-7',  'Netflix',           '13 May', -3200, true, 0.65, 65, "Your usual Netflix charge is ₹649. This is 4.9x higher — possible plan upgrade or duplicate charge."),
  tx('demo-8',  'HDFC ATM',          '12 May', -2000),
  tx('demo-9',  'Dunzo',             '11 May', -450),
  tx('demo-10', 'Zepto',             '10 May', -1200),
  tx('demo-11', 'Airtel Broadband',  '9 May',  -999),
  tx('demo-12', 'Groww SIP',         '8 May',  -5000),
  tx('demo-13', 'Blinkit',           '7 May',  -650),
  tx('demo-14', 'IRCTC',             '5 May',  -2400),
  tx('demo-15', 'Swiggy',            '3 May',  -520),
];

export const DEMO_STATS = {
  totalTransactions: 247,
  anomaliesFound:    8,
  totalSpend:        42860,
  spendChange:       18,
  predictedBalance:  12340,
};
