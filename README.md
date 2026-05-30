# FinLens

**Privacy-first bank statement analyzer for Indian banking.**

Upload a bank statement and instantly detect suspicious transactions, analyze spending patterns, normalize merchant names, and forecast your month-end balance — all directly in your browser.

No servers. No databases. No data uploads.

---

## Overview

FinLens helps users understand their financial activity by transforming raw bank statements into actionable insights.

Most banking exports are difficult to read, inconsistent across banks, and make it easy to miss unusual charges. FinLens solves this by automatically parsing statements, categorizing transactions, identifying anomalies, and generating visual spending reports.

All processing happens locally in the browser, ensuring complete privacy.

---

## Features

### Transaction Analysis

* Upload statements in **CSV, XLS, XLSX, TXT, or PDF** format
* Automatic transaction extraction across major Indian banks
* Search, sort, and filter transaction history

### Anomaly Detection

* Detects unusually large or suspicious transactions
* Uses statistical outlier analysis with:

  * Z-Score Detection
  * Isolation Forest–inspired anomaly scoring
* Confidence scoring for flagged transactions

### Merchant Normalization

Converts noisy banking descriptions into recognizable merchant names.

Examples:

```text
SWGY*O123456 UPI 9988@okaxis
```

↓

```text
Swiggy 🧡
```

Supports 220+ commonly used Indian merchants across:

* Food Delivery
* E-Commerce
* Streaming Services
* Airlines
* Fintech
* Healthcare
* Telecom
* Utilities

### Spending Intelligence

* Automatic categorization into 40+ spending categories
* Category-wise spend breakdown
* Interactive donut charts
* Daily spending trend analysis

### Balance Forecasting

Predicts end-of-month account balance using current spending behavior and daily burn rate calculations.

---

## Privacy

FinLens is designed with privacy as a core principle.

✅ 100% client-side processing

✅ No backend

✅ No database

✅ No analytics

✅ No transaction data leaves your device

Your financial data remains entirely local.

---

## Tech Stack

| Technology | Purpose                  |
| ---------- | ------------------------ |
| Next.js 16 | Application Framework    |
| Turbopack  | Development Build System |
| TypeScript | Type Safety              |
| Chart.js   | Data Visualization       |
| SheetJS    | XLS/XLSX Parsing         |
| PDF.js     | PDF Extraction           |
| PapaParse  | CSV/TXT Parsing          |

---

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/yourusername/finlens.git
cd finlens
```

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## How Anomaly Detection Works

For every transaction, FinLens calculates a statistical Z-score relative to similar transactions in the same category.

Formula:

```math
z = (x - μ) / σ
```

Where:

* `x` = transaction amount
* `μ` = category mean
* `σ` = category standard deviation

Transactions beyond a threshold are flagged as anomalies.

Additional cross-category validation helps detect unusual spending patterns that may not appear abnormal within the user's overall spending profile.

Confidence scores are normalized between **0–95%** to avoid presenting any prediction as absolute certainty.

---

## Merchant Normalization Pipeline

Bank transaction descriptions are often noisy and inconsistent.

Example:

```text
SWGY*O987654 UPI 9988776655@okaxis
```

Normalization process:

1. Remove transaction IDs
2. Remove UPI addresses and routing noise
3. Strip branch identifiers and metadata
4. Match against merchant pattern database
5. Apply canonical merchant name
6. Fallback to cleaned title-cased text

This significantly improves readability and spending categorization accuracy.

---

## Multi-Bank Statement Support

Different banks export statements using different formats.

Supported formats include:

| Bank  | Date Column      | Amount Columns              |
| ----- | ---------------- | --------------------------- |
| HDFC  | Date             | Debit Amount, Credit Amount |
| ICICI | Transaction Date | Debit, Credit               |
| Axis  | Tran Date        | DR, CR                      |
| SBI   | Txn Date         | Debit, Credit               |
| Kotak | Date             | Withdrawal Amt, Deposit Amt |

### Intelligent Header Detection

FinLens automatically:

* Scans the first 30 rows
* Scores candidate header rows
* Detects known banking column patterns
* Falls back to content-based inference when necessary

This allows a single parser to work across multiple statement formats without manual configuration.

---

## Project Structure

```text
lib/
├── fileParser.ts
├── merchantNormalizer.ts
├── anomalyDetection.ts
├── forecasting.ts
└── categorizer.ts

components/
├── UploadZone.tsx
├── TransactionTable.tsx
├── CategoryChart.tsx
├── TrendChart.tsx
└── AnomalyDetails.tsx
```

### Core Modules

| File                  | Responsibility               |
| --------------------- | ---------------------------- |
| fileParser.ts         | Unified parsing entry point  |
| merchantNormalizer.ts | Merchant detection & cleanup |
| anomalyDetection.ts   | Outlier detection engine     |
| forecasting.ts        | Balance prediction           |
| categorizer.ts        | Transaction categorization   |

---

## Limitations

### PDF Support

PDF parsing performs best with digitally generated statements.

Scanned image PDFs are currently not supported.

### Forecasting

The forecasting model uses linear spending extrapolation and daily burn-rate calculations.

It is intentionally lightweight and should be treated as an estimate rather than financial advice.

### Merchant Coverage

While the normalization engine covers 220+ merchants, smaller regional businesses may not yet be recognized.

Contributions are welcome.

---

## Roadmap

* [ ] OCR support for scanned PDF statements
* [ ] Recurring subscription detection
* [ ] Monthly spending alerts
* [ ] Budget tracking goals
* [ ] Custom merchant mapping
* [ ] Export reports as PDF
* [ ] Advanced forecasting models
* [ ] Multi-account comparison

---

## Contributing

Contributions, bug reports, and feature requests are welcome.

If you discover an unsupported merchant or bank statement format, feel free to open an issue or submit a pull request.

---

## License

Released under the MIT License.

---

Built for people who want better visibility into their finances without sacrificing privacy.
