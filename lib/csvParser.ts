import Papa from 'papaparse';
import { Transaction } from '@/types';
import { normalizeMerchant } from './merchantNormalizer';

interface RawRow {
  [key: string]: string;
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findField(row: RawRow, candidates: string[]): string {
  const keys = Object.keys(row);
  for (const candidate of candidates) {
    const match = keys.find(k => normalizeKey(k) === normalizeKey(candidate));
    if (match && row[match]?.trim()) return row[match].trim();
  }
  return '';
}

function parseAmount(raw: string): number {
  if (!raw) return 0;
  // Remove currency symbols, commas, spaces
  const cleaned = raw.replace(/[₹,\s]/g, '').trim();
  return parseFloat(cleaned) || 0;
}

function formatDate(raw: string): string {
  if (!raw) return '';
  // Handle DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD MMM YYYY formats
  const dmy = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const fullYear = y.length === 2 ? `20${y}` : y;
    const date = new Date(`${fullYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }
  }
  // Try ISO format
  const isoDate = new Date(raw);
  if (!isNaN(isoDate.getTime())) {
    return isoDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
  return raw;
}

let txCounter = 0;

export function parseCSV(file: File): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const transactions: Transaction[] = [];

          for (const row of results.data) {
            // Try to extract description
            const description =
              findField(row, ['description', 'narration', 'particulars', 'details', 'merchant', 'name', 'remarks']) ||
              Object.values(row)[0] ||
              'Unknown';

            // Try to extract date
            const rawDate =
              findField(row, ['date', 'txn date', 'transaction date', 'value date', 'posting date']) ||
              '';

            // Try to extract amount — handle debit/credit split columns
            let amount = 0;
            const debitRaw = findField(row, ['debit', 'withdrawal', 'dr', 'debit amount']);
            const creditRaw = findField(row, ['credit', 'deposit', 'cr', 'credit amount']);
            const amountRaw = findField(row, ['amount', 'transaction amount', 'txn amount']);

            if (debitRaw || creditRaw) {
              const debit = parseAmount(debitRaw);
              const credit = parseAmount(creditRaw);
              if (debit > 0) amount = -debit;
              else if (credit > 0) amount = credit;
            } else if (amountRaw) {
              amount = parseAmount(amountRaw);
              // If the raw string has Dr/Cr indicator
              if (amountRaw.toLowerCase().includes('dr')) amount = -Math.abs(amount);
              else if (amountRaw.toLowerCase().includes('cr')) amount = Math.abs(amount);
            }

            if (amount === 0 && !debitRaw && !creditRaw) continue;

            const cleanDesc = description.replace(/\s+/g, ' ').trim();
            const merchant  = normalizeMerchant(cleanDesc);

            transactions.push({
              id: `tx-${++txCounter}`,
              description:   cleanDesc,
              merchantName:  merchant.name,
              merchantEmoji: merchant.emoji,
              date: formatDate(rawDate),
              amount,
              category: merchant.category,
              isAnomaly: false,
              anomalyScore: 0,
              confidence: 0,
              explanation: '',
            });
          }

          resolve(transactions);
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(err),
    });
  });
}
