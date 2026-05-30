# finlens

detect anomalies in your bank statement. upload a csv/xls/pdf, get flagged transactions, spending breakdown, and end-of-month balance prediction. runs 100% in the browser — nothing leaves your device.

built this because i kept missing weird charges in my hdfc statement until way too late.

![demo](https://img.shields.io/badge/status-working-2ed573?style=flat-square) ![next](https://img.shields.io/badge/next.js-16-black?style=flat-square) ![license](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

---

## what it does

- upload bank statements in **csv, xls, xlsx, txt, or pdf**
- flags anomalous transactions using z-score + isolation forest logic
- categorizes spend across 40+ categories automatically
- **merchant normalization** — maps raw descriptions like `SWGY*O123 UPI 9988@okaxis` → `Swiggy 🧡` (covers 220+ indian merchants)
- predicts your end-of-month balance based on daily burn rate
- spending breakdown by category (donut chart + trend bars)
- search, filter, and sort transactions

## stack

- **next.js 16** with turbopack
- **chart.js** for the donut + bar charts
- **sheetjs** for xls/xlsx parsing
- **pdfjs-dist** for pdf text extraction
- **papaparse** for csv/txt
- zero backend, zero database. all ml runs client-side.

## running locally

```bash
git clone https://github.com/yourusername/finlens
cd finlens
npm install
npm run dev
```

open http://localhost:3000

## how the anomaly detection works

for each transaction i compute a z-score against the category's mean and standard deviation. anything beyond 2.5σ gets flagged. i also do cross-category comparisons — a ₹12,000 "food" charge is suspicious even if your total spend is high.

```
z = (x - μ) / σ
```

the confidence score is the z-score normalized to 0-100 and capped at 95 (never 100% confident).

## how merchant normalization works

bank descriptions are a mess. `SWGY*O987654 UPI 9988776655@okaxis` is swiggy, but you'd never know that from the raw string.

the normalizer:
1. strips noise (upi vpa addresses, transaction ids, branch names)
2. matches against a pattern dictionary of 220+ merchants
3. falls back to title-casing the cleaned string if no match

covers food delivery, e-commerce, streaming, fintech apps, airlines, healthcare, telecom — the full set of merchants that actually appear in indian bank statements.

## file format support

the xls parser was the hardest part. every bank exports differently:

| bank | date col | amount cols |
|------|----------|-------------|
| hdfc | `Date` | `Debit Amount`, `Credit Amount` |
| icici | `Transaction Date` | `Debit`, `Credit` |
| axis | `Tran Date` | `DR`, `CR` |
| sbi | `Txn Date` | `Debit`, `Credit` |
| kotak | `Date` | `Withdrawal Amt`, `Deposit Amt` |

i handle this with a header-scoring system — each row in the first 30 rows gets a score based on how many recognized column keywords it contains, and the highest-scoring row is treated as the header. if nothing scores ≥1, it falls back to positional inference (figures out columns by content type).

## known issues / todo

- pdf parsing works best with digital pdfs. scanned pdfs (images) won't work.
- the forecasting is a simple linear extrapolation of daily burn rate — not arima, not prophet. good enough for now.
- merchant normalization misses regional/local merchants by design. if yours is missing, add it to `lib/merchantNormalizer.ts` — the pattern is straightforward.

## project structure

```
lib/
  fileParser.ts         — unified entry point, dispatches by format
  merchantNormalizer.ts — 220+ merchant patterns + noise stripping
  anomalyDetection.ts   — z-score based flagging
  forecasting.ts        — end-of-month balance prediction
  categorizer.ts        — fallback category keywords
components/
  CategoryChart.tsx     — donut chart
  TrendChart.tsx        — daily spend bar chart
  TransactionTable.tsx  — searchable/filterable table
  AnomalyDetails.tsx    — anomaly cards + forecast widget
  UploadZone.tsx        — drag-drop + format detection
```

---

made with too much chai and a lot of frustration at indian bank ux.
