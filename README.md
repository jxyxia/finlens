# FinLens

detect weird charges before they become an "i definitely didn't buy that" situation.

upload a bank statement and get anomaly detection, spending insights, merchant cleanup, and a month-end balance prediction.

**everything runs in your browser.**
no backend, no database, no data leaving your device.

---

## what it does

* upload **csv, xls, xlsx, txt, or pdf** statements
* flag suspicious transactions using statistical anomaly detection
* automatically categorize spending across 40+ categories
* normalize messy merchant names

```text
SWGY*O123 UPI 9988@okaxis
```

becomes

```text
Swiggy
```

* spending breakdown with charts
* transaction search, sorting, and filtering
* end-of-month balance prediction

---

## stack

* Next.js 16
* TypeScript
* Chart.js
* SheetJS
* PDF.js
* PapaParse

all processing happens client-side.

---

## run locally

```bash
git clone https://github.com/yourusername/finlens.git
cd finlens
npm install
npm run dev
```

open `http://localhost:3000`

---

## how it works

transactions are compared against your usual spending patterns using z-score based anomaly detection.

a ₹12,000 food delivery order might be perfectly normal for someone.

for most people, it probably deserves a second look.

merchant names are cleaned up using a pattern-matching system built around common Indian banking descriptions because banks seem committed to making transaction names unreadable.

---

## supported banks

tested with exports from:

* HDFC
* ICICI
* SBI
* Axis
* Kotak

and hopefully whatever spreadsheet format your bank's intern invented.

---

## known limitations

* scanned PDF statements are not supported yet
* forecasting uses simple spending trends, not financial wizardry
* some local merchants may not be recognized

---

## roadmap

* OCR support for scanned PDFs
* recurring subscription detection
* budgeting tools
* PDF report exports
* smarter forecasting

---

built out of equal parts curiosity and annoyance with Indian banking UX.
