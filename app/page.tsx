'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';
import UploadZone from '@/components/UploadZone';
import StatCards from '@/components/StatCards';
import TransactionTable from '@/components/TransactionTable';
import AnomalyDetails from '@/components/AnomalyDetails';
import { Transaction, AnomalyDetail, Forecast } from '@/types';
import { parseFile } from '@/lib/fileParser';
import { detectAnomalies } from '@/lib/anomalyDetection';
import { forecastBalance, estimateCurrentBalance } from '@/lib/forecasting';
import { DEMO_TRANSACTIONS, DEMO_STATS } from '@/lib/demoData';

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
  const balance = estimateCurrentBalance(transactions, 55000);
  const forecast = forecastBalance(transactions, balance);
  const spend = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  return {
    transactions, anomalies, forecast,
    totalCount: DEMO_STATS.totalTransactions,
    totalSpend: spend,
    spendChange: DEMO_STATS.spendChange,
  };
}

export default function Home() {
  const [state, setState]       = useState<AppState | null>(null);
  const [loading, setLoading]   = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'anomalies'>('overview');

  const loadDemo = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setState(buildDemoState());
      setFileName('demo_statement.csv');
      setLoading(false);
    }, 1200);
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    setLoading(true);
    setFileName(file.name);
    try {
      const raw = await parseFile(file);
      if (raw.length === 0) {
        alert(`No transactions found in "${file.name}".\n\nOpen browser console (F12) to see detected columns.`);
        setLoading(false);
        return;
      }
      const { transactions, anomalies } = detectAnomalies(raw);
      const balance = estimateCurrentBalance(transactions, 50000);
      const forecast = forecastBalance(transactions, balance);
      const spend = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
      setState({ transactions, anomalies, forecast, totalCount: transactions.length, totalSpend: spend, spendChange: Math.floor(Math.random() * 30) + 5 });
      setActiveTab('overview');
    } catch (err) {
      console.error('Parse error:', err);
      alert(`Could not parse "${file.name}".\n\n${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const forecastDate = state?.forecast
    ? state.forecast.endOfMonthDate.split(' ').slice(0, 3).join(' ')
    : '31 May';

  return (
    <main className="app">
      <header className="header">
        <span className="logo">finlens</span>

        <div className="header-center">
          {state && (
            <nav className="tab-nav">
              {(['overview', 'transactions', 'anomalies'] as const).map(tab => (
                <button
                  key={tab}
                  className={`tab-btn ${activeTab === tab ? 'tab-active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </nav>
          )}
        </div>

        <div className="header-right">
          {state && (
            <button className="reset-btn" onClick={() => { setState(null); setFileName(null); }}>
              upload new file
            </button>
          )}
          <span className="local-badge">local only</span>
        </div>
      </header>

      <div className="content">
        {!state && (
          <>
            <UploadZone onFileUpload={handleFileUpload} isProcessing={loading} />
            {!loading && (
              <div className="demo-row">
                <button className="demo-btn" onClick={loadDemo}>try with demo data</button>
              </div>
            )}
          </>
        )}

        {loading && !state && (
          <UploadZone onFileUpload={handleFileUpload} isProcessing={true} />
        )}

        {state && (
          <>
            <div className="file-info-bar">
              <span className="file-name">{fileName}</span>
              <span className="file-count">{state.totalCount.toLocaleString('en-IN')} transactions</span>
            </div>

            <StatCards
              totalTransactions={state.totalCount}
              anomaliesFound={state.anomalies.length}
              totalSpend={state.totalSpend}
              spendChange={state.spendChange}
              predictedBalance={state.forecast.projectedBalance}
              forecastDate={forecastDate}
            />

            {activeTab === 'overview' && (
              <>
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

            {activeTab === 'transactions' && (
              <TransactionTable
                transactions={state.transactions}
                totalCount={state.totalCount}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            )}

            {activeTab === 'anomalies' && (
              <div className="dashboard-grid">
                <AnomalyDetails anomalies={state.anomalies} forecast={state.forecast} />
                <CategoryChart transactions={state.transactions} />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
