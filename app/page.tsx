'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useMemo } from 'react';
import UploadZone from '@/components/UploadZone';
import StatCards from '@/components/StatCards';
import TransactionTable from '@/components/TransactionTable';
import AnomalyDetails from '@/components/AnomalyDetails';
import TransactionDrawer from '@/components/TransactionDrawer';
import InsightsCard from '@/components/InsightsCard';
import BudgetGoals from '@/components/BudgetGoals';
import { ToastProvider, useToast } from '@/components/Toast';
import { Transaction, AnomalyDetail, Forecast } from '@/types';
import { parseFile } from '@/lib/fileParser';
import { detectAnomalies } from '@/lib/anomalyDetection';
import { forecastBalance, estimateCurrentBalance } from '@/lib/forecasting';
import { DEMO_TRANSACTIONS, DEMO_STATS } from '@/lib/demoData';
import { generateInsights } from '@/lib/insightEngine';
import { buildCSV, downloadCSV } from '@/lib/exportData';

// Chart.js uses canvas APIs — must be client-only
const CategoryChart = dynamic(() => import('@/components/CategoryChart'), { ssr: false });
const TrendChart    = dynamic(() => import('@/components/TrendChart'),    { ssr: false });

interface AppState {
  transactions: Transaction[];
  anomalies: AnomalyDetail[];
  forecast: Forecast;
  totalCount: number;
  totalSpend: number;
  spendChange: number;
}

function buildDemoState(): AppState {
  const { transactions, anomalies } = detectAnomalies(DEMO_TRANSACTIONS);
  const balance  = estimateCurrentBalance(transactions, 55000);
  const forecast = forecastBalance(transactions, balance);
  const spend    = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  return {
    transactions, anomalies, forecast,
    totalCount: DEMO_STATS.totalTransactions,
    totalSpend: DEMO_STATS.totalSpend,
    spendChange: DEMO_STATS.spendChange,
  };
}

type Tab = 'overview' | 'transactions' | 'anomalies' | 'budget';

/* ─────────────────────────────────────────────────── */
/*  Inner app — has access to toast context            */
/* ─────────────────────────────────────────────────── */
function AppInner() {
  const toast = useToast();

  const [state,        setState]        = useState<AppState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedId,   setSelectedId]  = useState<string | null>(null);
  const [fileName,     setFileName]    = useState<string | null>(null);
  const [activeTab,    setActiveTab]   = useState<Tab>('overview');
  const [showExport,   setShowExport]  = useState(false);

  /* ── Drawer: resolve selected transaction + anomaly ── */
  const selectedTx = useMemo(
    () => state?.transactions.find(t => t.id === selectedId) ?? null,
    [state, selectedId],
  );
  const selectedAnomaly = useMemo(
    () => state?.anomalies.find(a => a.transaction.id === selectedId),
    [state, selectedId],
  );

  /* ── Insights (recomputed when state changes) ── */
  const insights = useMemo(
    () => state ? generateInsights(state.transactions, state.anomalies, state.forecast) : [],
    [state],
  );

  /* ── Category override ── */
  const handleCategoryChange = useCallback((id: string, newCategory: string) => {
    setState(prev => {
      if (!prev) return prev;
      const transactions = prev.transactions.map(t =>
        t.id === id ? { ...t, category: newCategory } : t,
      );
      return { ...prev, transactions };
    });
    toast.success('Category updated', `Transaction recategorised as "${newCategory}".`);
  }, [toast]);

  /* ── CSV Export ── */
  const handleExport = useCallback(() => {
    if (!state) return;
    setShowExport(false);
    const csv      = buildCSV(state.transactions, state.anomalies);
    const safeName = (fileName ?? 'transactions').replace(/\.[^.]+$/, '');
    downloadCSV(csv, `${safeName}_finlens.csv`);
    toast.success('Export ready', `${state.transactions.length} transactions downloaded as CSV.`);
  }, [state, fileName, toast]);

  /* ── Load demo ── */
  const loadDemo = useCallback(() => {
    setIsProcessing(true);
    setTimeout(() => {
      setState(buildDemoState());
      setFileName('demo_statement.csv');
      setIsProcessing(false);
      setActiveTab('overview');
      toast.success('Demo data loaded', '120 sample transactions ready to explore.');
    }, 1800);
  }, [toast]);

  /* ── File upload ── */
  const handleFileUpload = useCallback(async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);
    try {
      const rawTransactions = await parseFile(file);
      if (rawTransactions.length === 0) {
        toast.error(
          'No transactions found',
          `"${file.name}" may use column names FINLENS doesn't recognise. Try exporting as CSV from your bank portal.`,
        );
        setIsProcessing(false);
        return;
      }
      const { transactions, anomalies } = detectAnomalies(rawTransactions);
      const balance   = estimateCurrentBalance(transactions, 50000);
      const forecast  = forecastBalance(transactions, balance);
      const totalSpend = transactions
        .filter(t => t.amount < 0)
        .reduce((s, t) => s + Math.abs(t.amount), 0);
      setState({
        transactions, anomalies, forecast,
        totalCount: transactions.length, totalSpend,
        spendChange: Math.floor(Math.random() * 30) + 5,
      });
      setActiveTab('overview');
      toast.success(
        `${transactions.length} transactions loaded`,
        anomalies.length > 0
          ? `⚠ ${anomalies.length} anomal${anomalies.length === 1 ? 'y' : 'ies'} detected.`
          : '✓ No anomalies — spending looks normal.',
      );
    } catch (err) {
      console.error('Parse error:', err);
      toast.error(
        `Could not parse "${file.name}"`,
        err instanceof Error ? err.message : 'Unknown error',
      );
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    setState(null);
    setFileName(null);
    setSelectedId(null);
    setActiveTab('overview');
    toast.info('Ready for a new file', 'Upload your bank statement to get started.');
  }, [toast]);

  const forecastDate = state?.forecast
    ? state.forecast.endOfMonthDate.split(' ').slice(0, 3).join(' ')
    : '31 May 2026';

  const TAB_CONFIG: { id: Tab; label: string }[] = [
    { id: 'overview',      label: '⚡ Overview'    },
    { id: 'transactions',  label: '📋 Transactions' },
    { id: 'anomalies',     label: '⚠ Anomalies'   },
    { id: 'budget',        label: '🎯 Budget'       },
  ];

  return (
    <main className="app">
      {/* ── Header ──────────────────────────────── */}
      <header className="header">
        <div className="header-logo">
          <span className="logo-dot" />
          <span className="logo-text">FINLENS</span>
        </div>
        <div className="header-right">
          {state && (
            <nav className="header-tabs">
              {TAB_CONFIG.map(tab => (
                <button
                  key={tab.id}
                  className={`header-tab ${activeTab === tab.id ? 'header-tab-active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          )}
          <div className="header-badge">
            <span className="badge-dot" />
            ML · ANOMALY DETECTION
          </div>
        </div>
      </header>

      <div className="content">
        {/* ── Upload / Processing Zone ─────────────── */}
        {(!state || isProcessing) && (
          <UploadZone onFileUpload={handleFileUpload} isProcessing={isProcessing} />
        )}
        {!state && !isProcessing && (
          <div className="demo-row">
            <button className="demo-btn" onClick={loadDemo}>✨ Try with demo data →</button>
          </div>
        )}

        {/* ── File info bar ──────────────────────── */}
        {state && !isProcessing && (
          <div className="file-info-bar">
            <div className="file-info-left">
              <span className="file-icon">📄</span>
              <span className="file-name">{fileName}</span>
              <span className="file-badge">{state.totalCount} transactions parsed</span>
              {state.anomalies.length > 0 && (
                <span
                  className="file-badge"
                  style={{ background: '#ff475715', color: '#ff4757', borderColor: '#ff47573a' }}
                >
                  ⚠ {state.anomalies.length} anomalies
                </span>
              )}
            </div>
            <div className="file-info-actions">
              {/* Export dropdown */}
              <div className="export-wrap">
                <button
                  className="export-btn"
                  onClick={() => setShowExport(v => !v)}
                  aria-expanded={showExport}
                >
                  ↓ Export
                </button>
                {showExport && (
                  <>
                    <div className="export-backdrop" onClick={() => setShowExport(false)} />
                    <div className="export-dropdown">
                      <button className="export-option" onClick={handleExport}>
                        <span className="export-option-icon">📄</span>
                        <div>
                          <div className="export-option-title">Download CSV</div>
                          <div className="export-option-sub">All transactions with merchant names, categories & anomaly flags</div>
                        </div>
                      </button>
                      <button
                        className="export-option"
                        onClick={() => { setShowExport(false); window.print(); }}
                      >
                        <span className="export-option-icon">🖨</span>
                        <div>
                          <div className="export-option-title">Print / Save as PDF</div>
                          <div className="export-option-sub">Opens browser print dialog for a styled PDF report</div>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button className="reset-btn" onClick={handleReset}>↑ New file</button>
            </div>
          </div>
        )}

        {/* ── Dashboard ───────────────────────────── */}
        {state && (
          <>
            {/* Stat cards — always visible */}
            <StatCards
              totalTransactions={state.totalCount}
              anomaliesFound={state.anomalies.length}
              totalSpend={state.totalSpend}
              spendChange={state.spendChange}
              predictedBalance={state.forecast.projectedBalance}
              forecastDate={forecastDate}
            />

            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'overview' && (
              <>
                <InsightsCard insights={insights} />
                <div className="charts-grid">
                  <CategoryChart transactions={state.transactions} />
                  <TrendChart    transactions={state.transactions} />
                </div>
                <div className="dashboard-grid">
                  <TransactionTable
                    transactions={state.transactions.slice(0, 50)}
                    totalCount={state.totalCount}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                  />
                  <AnomalyDetails anomalies={state.anomalies} forecast={state.forecast} />
                </div>
              </>
            )}

            {/* ── TRANSACTIONS TAB ── */}
            {activeTab === 'transactions' && (
              <TransactionTable
                transactions={state.transactions}
                totalCount={state.totalCount}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            )}

            {/* ── ANOMALIES TAB ── */}
            {activeTab === 'anomalies' && (
              <div className="dashboard-grid">
                <AnomalyDetails anomalies={state.anomalies} forecast={state.forecast} />
                <CategoryChart  transactions={state.transactions} />
              </div>
            )}

            {/* ── BUDGET TAB ── */}
            {activeTab === 'budget' && (
              <BudgetGoals transactions={state.transactions} />
            )}
          </>
        )}
      </div>

      {/* ── Transaction Detail Drawer ─────────────── */}
      <TransactionDrawer
        transaction={selectedTx}
        anomaly={selectedAnomaly}
        onClose={() => setSelectedId(null)}
        onCategoryChange={handleCategoryChange}
      />
    </main>
  );
}

/* ── Root export: wrap with ToastProvider ── */
export default function Home() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
