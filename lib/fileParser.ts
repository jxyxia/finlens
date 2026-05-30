// parses bank statements in csv, xls/xlsx, txt, pdf formats
// all formats normalize into the same Transaction[] shape
// bank statements are a mess — every bank does something different

import Papa from 'papaparse';
import { Transaction } from '@/types';
import { normalizeMerchant } from './merchantNormalizer';

interface RawRow {
  [key: string]: string;
}

let txCounter = 0;

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findField(row: RawRow, candidates: string[]): string {
  const keys = Object.keys(row);
  // try exact match first
  for (const candidate of candidates) {
    const norm = normalizeKey(candidate);
    const match = keys.find(k => normalizeKey(k) === norm);
    if (match && row[match]?.trim()) return row[match].trim();
  }
  // then partial — "Debit Amount" should match candidate "debit"
  for (const candidate of candidates) {
    const norm = normalizeKey(candidate);
    const match = keys.find(k => normalizeKey(k).includes(norm) || norm.includes(normalizeKey(k)));
    if (match && row[match]?.trim()) return row[match].trim();
  }
  return '';
}

export function parseAmount(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[₹$€£,\s]/g, '').trim();
  return parseFloat(cleaned) || 0;
}

export function formatDate(raw: string): string {
  if (!raw) return '';

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmy = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const fullYear = y.length === 2 ? `20${y}` : y;
    const date = new Date(`${fullYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }
  }

  // DD MMM YYYY  or  DD-MMM-YYYY
  const dMonthY = raw.match(/^(\d{1,2})[\s\-]([A-Za-z]{3,9})[\s\-](\d{2,4})$/);
  if (dMonthY) {
    const date = new Date(raw);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }
  }

  // ISO YYYY-MM-DD
  const iso = new Date(raw);
  if (!isNaN(iso.getTime())) {
    return iso.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  return raw;
}

// builds Transaction[] from a list of header→value row objects
function rowsToTransactions(rows: RawRow[]): Transaction[] {
  const out: Transaction[] = [];

  for (const row of rows) {
    // ── Description ──────────────────────────────────────
    const description =
      findField(row, [
        'description', 'narration', 'particulars', 'details',
        'merchant', 'name', 'remarks', 'transaction details',
        'cheque details', 'transaction narration', 'trans details',
        'beneficiary name', 'transaction description', 'transaction remarks',
        'chq details', 'ref details',
      ]) || Object.values(row)[1] || Object.values(row)[0] || 'Unknown';

    // ── Date ─────────────────────────────────────────────
    const rawDate =
      findField(row, [
        'date', 'txn date', 'transaction date', 'value date',
        'posting date', 'trans date', 'tran date', 'valuedate',
        'value dt', 'book date', 'entry date', 'trdate', 'trandate',
      ]) || '';

    // ── Amount ───────────────────────────────────────────
    let amount = 0;
    const debitRaw  = findField(row, [
      'debit', 'withdrawal', 'dr', 'debit amount', 'withdrawal amt',
      'withdrawal amount', 'dr amount', 'dr amt', 'debit(inr)',
      'amount debited', 'paid out', 'money out', 'charges',
    ]);
    const creditRaw = findField(row, [
      'credit', 'deposit', 'cr', 'credit amount', 'deposit amt',
      'deposit amount', 'cr amount', 'cr amt', 'credit(inr)',
      'amount credited', 'paid in', 'money in',
    ]);
    const amountRaw = findField(row, [
      'amount', 'transaction amount', 'txn amount', 'net amount',
      'transaction value', 'value', 'amt',
    ]);

    if (debitRaw || creditRaw) {
      const debit  = parseAmount(debitRaw);
      const credit = parseAmount(creditRaw);
      if (debit  > 0) amount = -debit;
      else if (credit > 0) amount = credit;
    } else if (amountRaw) {
      amount = parseAmount(amountRaw);
      if (amountRaw.toLowerCase().includes('dr')) amount = -Math.abs(amount);
      else if (amountRaw.toLowerCase().includes('cr')) amount = Math.abs(amount);
    }

    // Skip rows with no meaningful amount AND no debit/credit columns at all
    // (don't skip if debitRaw/creditRaw exist but happen to be blank — those are valid rows)
    const hasAmountCol = debitRaw !== '' || creditRaw !== '' || amountRaw !== '';
    if (!hasAmountCol && amount === 0) continue;
    if (hasAmountCol && amount === 0) continue; // truly zero-value rows

    const cleanDesc = description.replace(/\s+/g, ' ').trim();
    if (!cleanDesc || cleanDesc.length < 2) continue;

    const merchant = normalizeMerchant(cleanDesc);

    out.push({
      id: `tx-${++txCounter}`,
      description: cleanDesc,
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

  return out;
}

// ─────────────────────────────────────────────────────────
// CSV Parser  (PapaParse)
// ─────────────────────────────────────────────────────────

function parseCSV(file: File): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          resolve(rowsToTransactions(results.data));
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(err),
    });
  });
}

// xls/xlsx — the messy one. every bank exports headers differently.
// hdfc uses "Date", icici uses "Transaction Date", axis uses "Tran Date" etc.
// solution: score every row in the first 30 by how many known col keywords it has

const HEADER_KEYWORDS = {
  date: [
    'date', 'txndate', 'trandate', 'transdate', 'transactiondate',
    'valuedate', 'valuedt', 'postingdate', 'bookdate', 'entrydate', 'trdate',
  ],
  description: [
    'narration', 'particulars', 'description', 'transactiondetails',
    'transdetails', 'details', 'remarks', 'chequedetails', 'refdetails',
    'transactionnarration', 'transactiondescription', 'merchant',
    'beneficiaryname', 'transactionremarks', 'chqdetails', 'chequeno',
    'refno', 'utrno', 'info', 'summary',
  ],
  debit: [
    'debit', 'debitamount', 'withdrawal', 'withdrawalamt', 'withdrawalamount',
    'dramount', 'dramt', 'dr', 'debitinr', 'amountdebited', 'paidout',
    'moneyout', 'charges', 'debits',
  ],
  credit: [
    'credit', 'creditamount', 'deposit', 'depositamt', 'depositamount',
    'cramount', 'cramt', 'cr', 'creditinr', 'amountcredited', 'paidin',
    'moneyin', 'credits',
  ],
  amount: [
    'amount', 'transactionamount', 'txnamount', 'netamount',
    'transactionvalue', 'amt',
  ],
};

function normKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// higher score = more likely this row is the header
function scoreRow(cells: string[]): number {
  const allKws = Object.values(HEADER_KEYWORDS).flat();
  let score = 0;
  for (const cell of cells) {
    const n = normKey(cell);
    if (!n) continue;
    // Direct hit
    if (allKws.some(kw => normKey(kw) === n)) { score += 2; continue; }
    // Partial: cell contains keyword or keyword contains cell
    if (allKws.some(kw => n.includes(normKey(kw)) || normKey(kw).includes(n))) { score += 1; }
  }
  return score;
}

// scan first 30 rows, return whichever scores highest (min score 1)
function findHeaderRow(raw: unknown[][]): number {
  let bestIdx = -1, bestScore = 0;
  for (let i = 0; i < Math.min(raw.length, 30); i++) {
    const cells = (raw[i] as unknown[]).map(c => String(c ?? '').trim());
    const s = scoreRow(cells);
    if (s > bestScore) { bestScore = s; bestIdx = i; }
  }
  console.log('[FINLENS] Header scores (first 30 rows):',
    (raw.slice(0, 30) as unknown[][]).map((r, i) => ({
      row: i,
      score: scoreRow((r as unknown[]).map(c => String(c ?? '').trim())),
      cells: (r as unknown[]).map(c => String(c ?? '').trim()).filter(Boolean).slice(0, 6),
    }))
  );
  return bestScore >= 1 ? bestIdx : -1;
}

function classifyCol(h: string): string {
  const n = normKey(h);
  if (!n) return h;
  for (const [logical, kws] of Object.entries(HEADER_KEYWORDS)) {
    if (kws.some(kw => normKey(kw) === n || n.includes(normKey(kw)) || normKey(kw).includes(n))) {
      return logical;
    }
  }
  return h; // keep verbatim so findField can still try it
}

// excel stores dates as serial numbers from 1900-01-01
// there's a famous lotus 1-2-3 bug where 1900 is treated as a leap year
// so serial 60 = feb 29 1900 which didn't exist, everything after is off by 1
function excelSerialToDate(serial: number): string {
  if (serial < 1 || serial > 99999) return '';
  // Adjust for Lotus bug (serial 60 = Feb 29, 1900 which didn't exist)
  const adjusted = serial > 60 ? serial - 1 : serial;
  const msFromEpoch = (adjusted - 1) * 86400 * 1000;
  const date = new Date(Date.UTC(1900, 0, 1) + msFromEpoch);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

function cellToString(cell: unknown): string {
  if (cell === null || cell === undefined) return '';
  if (cell instanceof Date) {
    return cell.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
  const s = String(cell).trim();
  // Excel serial number range (dates from ~1990 to ~2050)
  const num = Number(s);
  if (!isNaN(num) && num > 33000 && num < 55000 && s === String(Math.floor(num))) {
    return excelSerialToDate(Math.floor(num));
  }
  return s;
}

/**
 * Positional inference fallback:
 * Score each column for date-likeness, text-likeness, number-likeness.
 * Works with both formatted strings AND raw Excel serial numbers.
 */
function positionalInference(raw: unknown[][]): RawRow[] {
  if (raw.length < 2) return [];

  // Patterns
  const DATE_STR_RE = /^\d{1,2}[\\/\-\.]\d{1,2}[\\/\-\.]\d{2,4}$|^\d{1,2}\s+[A-Za-z]{3}/;
  const EXCEL_DATE_RE = /^3[3-9]\d{3}$|^4\d{4}$|^5[0-4]\d{3}$/; // ~1990–2050 serials
  const NUM_RE = /^[\d,]+\.?\d{0,2}$/;

  const colCount = Math.max(...raw.map(r => (r as unknown[]).length));
  const scores = Array.from({ length: colCount }, () =>
    ({ date: 0, text: 0, num: 0 })
  );

  for (const row of raw) {
    (row as unknown[]).forEach((rawCell, i) => {
      if (i >= colCount) return;
      const cell = rawCell instanceof Date ? 'DATE_OBJ' : String(rawCell ?? '').trim();
      if (!cell || cell === '0') return;
      if (rawCell instanceof Date || EXCEL_DATE_RE.test(cell) || DATE_STR_RE.test(cell)) {
        scores[i].date++;
      } else if (NUM_RE.test(cell.replace(/,/g, '')) && parseFloat(cell.replace(/,/g, '')) > 0) {
        scores[i].num++;
      } else if (cell.length > 3 && isNaN(parseFloat(cell.replace(/,/g, '')))) {
        scores[i].text++;
      }
    });
  }

  console.log('[FINLENS] Positional column scores:', scores.map((s, i) => ({ col: i, ...s })));

  const dateCol  = scores.reduce((b, c, i) => c.date > scores[b].date ? i : b, 0);
  const textCol  = scores.reduce((b, c, i) => c.text > scores[b].text ? i : b, 0);
  const numCols  = scores
    .map((c, i) => ({ i, n: c.num }))
    .filter(x => x.i !== dateCol && x.i !== textCol && x.n > 0)
    .sort((a, b) => b.n - a.n);

  const debitCol  = numCols[0]?.i ?? -1;
  const creditCol = numCols[1]?.i ?? -1;
  const amtCol    = debitCol >= 0 ? debitCol : scores
    .map((c, i) => ({ i, n: c.num })).sort((a, b) => b.n - a.n)[0]?.i ?? -1;

  console.log('[FINLENS] Positional columns chosen — date:', dateCol, 'desc:', textCol,
    'debit:', debitCol, 'credit:', creditCol, 'amt:', amtCol);

  const rows: RawRow[] = [];
  for (const row of raw) {
    const cells = row as unknown[];
    rows.push({
      date:        cellToString(cells[dateCol]),
      description: cellToString(cells[textCol]),
      debit:       debitCol  >= 0 ? cellToString(cells[debitCol])  : '',
      credit:      creditCol >= 0 ? cellToString(cells[creditCol]) : '',
      amount:      amtCol    >= 0 ? cellToString(cells[amtCol])    : '',
    });
  }
  return rows;
}

async function parseXLS(file: File): Promise<Transaction[]> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();

  // Read twice: once with cellDates for Date objects, once raw for diagnostics
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true, raw: true });

  console.log('[FINLENS] Sheet names:', wb.SheetNames);

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];

    // raw:true gives us native cell values (numbers, Date objects, strings)
    const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      raw: true,
    });

    if (raw.length < 2) {
      console.log(`[FINLENS] Sheet "${sheetName}": only ${raw.length} rows, skipping`);
      continue;
    }

    // Log first 8 rows so we can see the actual content
    console.log(`[FINLENS] Sheet "${sheetName}" (${raw.length} rows) — first 8 rows:`);
    raw.slice(0, 8).forEach((r, i) =>
      console.log(`  row[${i}]:`, (r as unknown[]).map(c =>
        c instanceof Date ? `DATE(${c.toLocaleDateString()})` : JSON.stringify(c)
      ))
    );

    // ── Step 1: Try header-based detection ─────────────────
    const headerIdx = findHeaderRow(raw);
    let rows: RawRow[];

    if (headerIdx >= 0) {
      const rawHeaders = (raw[headerIdx] as unknown[]).map(c => String(c ?? '').trim());
      console.log(`[FINLENS] Header row ${headerIdx}:`, rawHeaders);

      // Map column indices to logical names
      const colMap: Record<number, string> = {};
      const used = new Set<string>();
      rawHeaders.forEach((h, idx) => {
        if (!h) return;
        const logical = classifyCol(h);
        // If logical was recognized (i.e. it changed), deduplicate by logical name
        const isRecognized = logical !== h;
        if (isRecognized && used.has(logical)) {
          // duplicate logical — keep verbatim
          colMap[idx] = `${h}_${idx}`;
        } else {
          colMap[idx] = logical;
          if (isRecognized) used.add(logical);
        }
      });
      console.log('[FINLENS] Column map:', colMap);

      rows = [];
      for (let i = headerIdx + 1; i < raw.length; i++) {
        const cells = raw[i] as unknown[];
        if (cells.every(c => String(c ?? '').trim() === '' || c === 0)) continue;
        const row: RawRow = {};
        Object.entries(colMap).forEach(([idxStr, name]) => {
          row[name] = cellToString(cells[Number(idxStr)]);
        });
        rows.push(row);
      }

      const txns = rowsToTransactions(rows);
      console.log(`[FINLENS] Header strategy → ${txns.length} transactions`);
      if (txns.length > 0) return txns;

      console.warn('[FINLENS] Header strategy found 0 tx — trying positional on same data');
    } else {
      console.warn('[FINLENS] No header row detected');
    }

    // ── Step 2: Positional inference (always try as fallback) ──
    rows = positionalInference(raw);
    const txns2 = rowsToTransactions(rows);
    console.log(`[FINLENS] Positional strategy → ${txns2.length} transactions`);
    if (txns2.length > 0) return txns2;

    // ── Step 3: Last resort — convert sheet to CSV and re-parse ──
    console.warn('[FINLENS] Trying CSV conversion fallback');
    const csvText = XLSX.utils.sheet_to_csv(sheet);
    console.log('[FINLENS] CSV preview:\n', csvText.split('\n').slice(0, 8).join('\n'));
    const csvRows: RawRow[] = [];
    Papa.parse<RawRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: r => csvRows.push(...r.data),
    });
    const txns3 = rowsToTransactions(csvRows);
    console.log(`[FINLENS] CSV-conversion strategy → ${txns3.length} transactions`);
    if (txns3.length > 0) return txns3;
  }

  throw new Error(
    'Could not extract transactions from this XLS/XLSX file.\n\n' +
    'FINLENS logged full diagnostics in the browser console (F12 → Console). ' +
    'Look for [FINLENS] lines — they show the exact column names and row content detected.\n\n' +
    'Sharing those lines will let us add support for your bank\'s format instantly.'
  );
}

// ─────────────────────────────────────────────────────────
// TXT Parser  (delimiter auto-detection)
// ─────────────────────────────────────────────────────────

function parseTXT(file: File): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = (e.target?.result as string) || '';
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);

        if (lines.length < 2) {
          resolve([]);
          return;
        }

        // Auto-detect delimiter from the first few lines
        const sample = lines.slice(0, 5).join('\n');
        const delimiter = detectDelimiter(sample);

        // Parse as CSV with detected delimiter
        Papa.parse<RawRow>(text, {
          header: true,
          delimiter,
          skipEmptyLines: true,
          complete: (results) => resolve(rowsToTransactions(results.data)),
          error: (err: Error) => reject(err),
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read TXT file'));
    reader.readAsText(file, 'utf-8');
  });
}

/** Count occurrences of a character in a string */
function countChar(str: string, ch: string): number {
  return str.split(ch).length - 1;
}

function detectDelimiter(sample: string): string {
  const candidates: [string, number][] = [
    ['\t',  countChar(sample, '\t')],
    ['|',   countChar(sample, '|')],
    [',',   countChar(sample, ',')],
    [';',   countChar(sample, ';')],
  ];
  candidates.sort((a, b) => b[1] - a[1]);
  // Fall back to comma if nothing wins decisively
  return candidates[0][1] > 2 ? candidates[0][0] : ',';
}

// ─────────────────────────────────────────────────────────
// PDF Parser  (pdfjs-dist — runs entirely in the browser)
// ─────────────────────────────────────────────────────────

async function parsePDF(file: File): Promise<Transaction[]> {
  // Dynamically import to keep bundle lean and avoid SSR issues
  const pdfjsLib = await import('pdfjs-dist');

  // Point the worker at the CDN copy so we don't have to bundle it
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  // Extract all text from every page
  let fullText = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    // Group text items by their Y position (same row ≈ same line)
    const yMap = new Map<number, string[]>();
    for (const item of content.items) {
      if (!('str' in item)) continue;
      const y = Math.round((item as { transform: number[] }).transform[5]);
      if (!yMap.has(y)) yMap.set(y, []);
      yMap.get(y)!.push((item as { str: string }).str);
    }

    // Sort lines top-to-bottom (descending Y in PDF coords)
    const sortedYs = [...yMap.keys()].sort((a, b) => b - a);
    for (const y of sortedYs) {
      fullText += yMap.get(y)!.join('\t') + '\n';
    }
  }

  // Now parse the extracted text as tab-delimited TXT
  const rows = parsePDFText(fullText);
  return rowsToTransactions(rows);
}

/**
 * Heuristic PDF text → RawRow[] converter.
 * Scans for lines that contain a date + an amount and treats them as transactions.
 */
function parsePDFText(text: string): RawRow[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Patterns
  const datePattern = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})\b/;
  const amountPattern = /[₹$€£]?\s*[\d,]+\.?\d{0,2}/;

  // Try to find a header row first
  const headerIdx = findPDFHeaderRow(lines);
  if (headerIdx !== -1) {
    return parsePDFWithHeaders(lines, headerIdx);
  }

  // Fallback: heuristic line-by-line extraction
  const rows: RawRow[] = [];
  for (const line of lines) {
    const dateMatch = line.match(datePattern);
    const amountMatch = line.match(/[\d,]+\.\d{2}/g);
    if (!dateMatch || !amountMatch) continue;

    const date = dateMatch[0];
    // Remove the date and amounts from description
    let desc = line
      .replace(datePattern, '')
      .replace(/[₹$€£]?\s*[\d,]+\.?\d{0,2}/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!desc || desc.length < 2) desc = 'Transaction';

    // Last amount on the line is usually the debit/credit
    const lastAmt = amountMatch[amountMatch.length - 1];
    const amt = parseAmount(lastAmt);

    // Determine sign: if there's a Cr/Dr indicator near it
    const lineLower = line.toLowerCase();
    const isCr = lineLower.includes(' cr') || lineLower.includes('credit');
    const isDr = lineLower.includes(' dr') || lineLower.includes('debit');

    rows.push({
      date,
      description: desc,
      amount: isCr ? String(amt) : isDr ? String(-amt) : String(-amt),
    });
  }
  return rows;
}

function findPDFHeaderRow(lines: string[]): number {
  const headerKeywords = ['date', 'description', 'narration', 'particulars', 'debit', 'credit', 'amount'];
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const lower = lines[i].toLowerCase();
    const hits = headerKeywords.filter(kw => lower.includes(kw)).length;
    if (hits >= 2) return i;
  }
  return -1;
}

function parsePDFWithHeaders(lines: string[], headerIdx: number): RawRow[] {
  // Reconstruct a tab-delimited string and let PapaParse handle it
  const relevant = lines.slice(headerIdx).join('\n');
  let parsed: RawRow[] = [];
  Papa.parse<RawRow>(relevant, {
    header: true,
    delimiter: '\t',
    skipEmptyLines: true,
    complete: (r) => { parsed = r.data; },
  });
  return parsed;
}

// ─────────────────────────────────────────────────────────
// Public entry point — dispatches by file type
// ─────────────────────────────────────────────────────────

export type SupportedFormat = 'csv' | 'xls' | 'xlsx' | 'txt' | 'pdf';

export function getFileFormat(file: File): SupportedFormat | null {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv'))  return 'csv';
  if (name.endsWith('.xlsx')) return 'xlsx';
  if (name.endsWith('.xls'))  return 'xls';
  if (name.endsWith('.txt'))  return 'txt';
  if (name.endsWith('.pdf'))  return 'pdf';
  // Fallback to MIME type
  if (file.type === 'text/csv')                   return 'csv';
  if (file.type === 'text/plain')                 return 'txt';
  if (file.type === 'application/pdf')            return 'pdf';
  if (file.type.includes('spreadsheet') || file.type.includes('excel')) return 'xlsx';
  return null;
}

export async function parseFile(file: File): Promise<Transaction[]> {
  const format = getFileFormat(file);
  switch (format) {
    case 'csv':          return parseCSV(file);
    case 'xlsx':
    case 'xls':         return parseXLS(file);
    case 'txt':          return parseTXT(file);
    case 'pdf':          return parsePDF(file);
    default:
      throw new Error(`Unsupported file format. Please upload a CSV, XLS, XLSX, TXT, or PDF file.`);
  }
}
