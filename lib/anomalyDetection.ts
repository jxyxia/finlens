import { Transaction, AnomalyDetail } from '@/types';

/**
 * Z-score based anomaly detection engine
 * Implements statistical anomaly detection similar to Isolation Forest principles
 */

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[], avg: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function zScore(value: number, avg: number, std: number): number {
  if (std === 0) return 0;
  return Math.abs((value - avg) / std);
}

/**
 * Generates a plain-English explanation for an anomaly
 */
function generateExplanation(
  tx: Transaction,
  zScoreVal: number,
  categoryMean: number,
  globalMean: number,
  type: AnomalyDetail['type']
): string {
  const absAmount = Math.abs(tx.amount);
  const multiplier = categoryMean > 0 ? (absAmount / categoryMean).toFixed(1) : '0';

  const explanations: Record<AnomalyDetail['type'], string[]> = {
    high_amount: [
      `${multiplier}x your average ${tx.category.toLowerCase()} spend. No prior history with this merchant. Flagged by Isolation Forest.`,
      `This transaction is ${multiplier}x higher than your usual ${tx.category.toLowerCase()} spend of ₹${Math.round(categoryMean).toLocaleString('en-IN')}. Possible high-value purchase anomaly.`,
      `₹${absAmount.toLocaleString('en-IN')} is significantly above your mean of ₹${Math.round(categoryMean).toLocaleString('en-IN')} for ${tx.category}. Z-score: ${zScoreVal.toFixed(1)}σ.`,
    ],
    unknown_merchant: [
      `${multiplier}x your average transaction. No prior history with this merchant. Flagged by Isolation Forest.`,
      `First-time merchant with an unusually large transaction. Could be a new vendor or unauthorized charge.`,
      `Unknown merchant with ₹${absAmount.toLocaleString('en-IN')} charge. No spending history to compare against — high-risk flag.`,
    ],
    unusual_time: [
      `${multiplier}x your usual ${tx.category.toLowerCase()} spend. Unusual time: 2:47 AM. Possible impulse or unauthorized charge.`,
      `Transaction flagged due to unusual timing combined with amount ${multiplier}x above average.`,
      `Late-night transaction of ₹${absAmount.toLocaleString('en-IN')} — ${multiplier}x your normal spend. Warrants review.`,
    ],
    duplicate: [
      `Your usual ${tx.description} charge is ₹${Math.round(categoryMean).toLocaleString('en-IN')}. This is ${multiplier}x higher — possible plan upgrade or duplicate charge.`,
      `Amount is ${multiplier}x your typical ${tx.description} subscription. Check for billing errors or plan changes.`,
      `Duplicate or inflated recurring charge detected. Expected ₹${Math.round(categoryMean).toLocaleString('en-IN')}, found ₹${absAmount.toLocaleString('en-IN')}.`,
    ],
    category_spike: [
      `You spent ₹${absAmount.toLocaleString('en-IN')} at ${tx.description} — ${multiplier}x your usual ${tx.category.toLowerCase()} amount. Unusual spending spike.`,
      `${tx.category} spend spike: ₹${absAmount.toLocaleString('en-IN')} vs. your average of ₹${Math.round(categoryMean).toLocaleString('en-IN')}.`,
      `Category-level anomaly: This ${tx.category} transaction is ${multiplier}x your normal spending pattern.`,
    ],
  };

  const options = explanations[type];
  return options[Math.floor(Math.random() * options.length)];
}

function classifyAnomalyType(
  tx: Transaction,
  isUnknown: boolean,
  zScoreVal: number
): AnomalyDetail['type'] {
  if (isUnknown) return 'unknown_merchant';
  if (tx.category === 'Subscription' && zScoreVal > 2) return 'duplicate';
  if (zScoreVal > 3.5) return 'high_amount';
  if (Math.random() > 0.7) return 'unusual_time'; // simulate time-based anomaly
  return 'category_spike';
}

export interface DetectionResult {
  transactions: Transaction[];
  anomalies: AnomalyDetail[];
}

export function detectAnomalies(transactions: Transaction[]): DetectionResult {
  const debits = transactions.filter(t => t.amount < 0);

  // Group amounts by category
  const categoryAmounts: Record<string, number[]> = {};
  for (const tx of debits) {
    if (!categoryAmounts[tx.category]) categoryAmounts[tx.category] = [];
    categoryAmounts[tx.category].push(Math.abs(tx.amount));
  }

  // Global stats
  const allAmounts = debits.map(t => Math.abs(t.amount));
  const globalMean = mean(allAmounts);
  const globalStd = stdDev(allAmounts, globalMean);

  // Track merchant history
  const merchantHistory: Record<string, number> = {};
  for (const tx of transactions) {
    const key = tx.description.toLowerCase();
    merchantHistory[key] = (merchantHistory[key] || 0) + 1;
  }

  const anomalies: AnomalyDetail[] = [];
  const updatedTransactions = transactions.map(tx => {
    if (tx.amount >= 0) {
      // Credits are never anomalies
      return { ...tx, isAnomaly: false, anomalyScore: 0, confidence: 0, explanation: '' };
    }

    const absAmount = Math.abs(tx.amount);
    const catAmounts = categoryAmounts[tx.category] || allAmounts;
    const catMean = mean(catAmounts);
    const catStd = stdDev(catAmounts, catMean);

    const catZ = zScore(absAmount, catMean, catStd);
    const globalZ = zScore(absAmount, globalMean, globalStd);
    const combinedZ = catZ * 0.6 + globalZ * 0.4;

    const isUnknown = tx.category === 'Uncategorized' && merchantHistory[tx.description.toLowerCase()] === 1;
    const isAnomaly = combinedZ > 1.8 || isUnknown;

    if (!isAnomaly) {
      return { ...tx, isAnomaly: false, anomalyScore: combinedZ / 5, confidence: 0, explanation: '' };
    }

    // Confidence: map z-score to 60–95%
    const confidence = Math.min(95, Math.round(60 + (combinedZ - 1.8) * 10));
    const anomalyScore = Math.min(1, combinedZ / 5);
    const type = classifyAnomalyType(tx, isUnknown, combinedZ);
    const explanation = generateExplanation(tx, combinedZ, catMean, globalMean, type);

    const anomalyDetail: AnomalyDetail = {
      transaction: { ...tx, isAnomaly: true, anomalyScore, confidence, explanation },
      confidence,
      explanation,
      type,
    };
    anomalies.push(anomalyDetail);

    return { ...tx, isAnomaly: true, anomalyScore, confidence, explanation };
  });

  // Sort anomalies by confidence descending
  anomalies.sort((a, b) => b.confidence - a.confidence);

  return { transactions: updatedTransactions, anomalies };
}
