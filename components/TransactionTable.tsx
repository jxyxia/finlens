'use client';

import { useState, useMemo } from 'react';
import { Transaction } from '@/types';

interface TransactionTableProps {
  transactions: Transaction[];
  totalCount: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining':   '#ff6b35',
  'Transport':       '#3b82f6',
  'Shopping':        '#8b5cf6',
  'Subscription':    '#ec4899',
  'Healthcare':      '#10b981',
  'Utilities':       '#f59e0b',
  'Entertainment':   '#06b6d4',
  'Finance':         '#14b8a6',
  'Income':          '#2ed573',
  'Cash & ATM':      '#94a3b8',
  'Uncategorized':   '#6366f1',
};

function catColor(cat: string) { return CATEGORY_COLORS[cat] ?? '#7c3aed'; }

function fmt(amount: number): string {
  return new Intl.NumberFormat('en-IN').format(Math.abs(amount));
}

type SortKey = 'date' | 'amount';
type FilterType = 'all' | 'debit' | 'credit' | 'anomaly';

export default function TransactionTable({ transactions, totalCount, selectedId, onSelect }: TransactionTableProps) {
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState<FilterType>('all');
  const [catFilter, setCatFilter] = useState('all');
  const [sort, setSort]         = useState<SortKey>('date');
  const [sortDir, setSortDir]   = useState<'asc' | 'desc'>('desc');

  const categories = useMemo(() =>
    ['all', ...Array.from(new Set(transactions.map(t => t.category))).sort()],
    [transactions]
  );

  const filtered = useMemo(() => {
    let list = [...transactions];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.description.toLowerCase().includes(q));
    }
    if (filter === 'debit')   list = list.filter(t => t.amount < 0);
    if (filter === 'credit')  list = list.filter(t => t.amount > 0);
    if (filter === 'anomaly') list = list.filter(t => t.isAnomaly);
    if (catFilter !== 'all')  list = list.filter(t => t.category === catFilter);

    list.sort((a, b) => {
      let diff = 0;
      if (sort === 'amount') diff = Math.abs(a.amount) - Math.abs(b.amount);
      else diff = a.date.localeCompare(b.date);
      return sortDir === 'desc' ? -diff : diff;
    });

    return list;
  }, [transactions, search, filter, catFilter, sort, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sort === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSort(key); setSortDir('desc'); }
  };

  const anomalyCount = transactions.filter(t => t.isAnomaly).length;

  return (
    <div className="tx-panel">
      {/* Header */}
      <div className="panel-header">
        <h2 className="panel-title">Transactions</h2>
        <span className="entry-badge">{totalCount.toLocaleString('en-IN')} entries</span>
      </div>

      {/* Search + Filter bar */}
      <div className="tx-toolbar">
        <div className="tx-search-wrap">
          <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="tx-search"
            placeholder="Search transactions…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        <div className="tx-filter-chips">
          {(['all', 'debit', 'credit', 'anomaly'] as FilterType[]).map(f => (
            <button
              key={f}
              className={`chip ${filter === f ? 'chip-active' : ''} ${f === 'anomaly' ? 'chip-anomaly' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'anomaly' ? `⚠ ${anomalyCount}` : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div className="cat-filter-bar">
        {categories.map(cat => (
          <button
            key={cat}
            className={`cat-chip ${catFilter === cat ? 'cat-chip-active' : ''}`}
            onClick={() => setCatFilter(cat)}
            style={catFilter === cat && cat !== 'all'
              ? { borderColor: catColor(cat), color: catColor(cat), background: `${catColor(cat)}18` }
              : {}}
          >
            {cat !== 'all' && (
              <span className="cat-chip-dot" style={{ background: catColor(cat) }} />
            )}
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="tx-table">
        <div className="tx-thead">
          <span>DESCRIPTION</span>
          <button className="sort-btn" onClick={() => toggleSort('date')}>
            DATE {sort === 'date' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
          </button>
          <button className="sort-btn" onClick={() => toggleSort('amount')}>
            AMOUNT {sort === 'amount' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
          </button>
          <span>STATUS</span>
        </div>

        <div className="tx-body">
          {filtered.length === 0 ? (
            <div className="tx-empty">
              <span>No transactions match your filters</span>
            </div>
          ) : (
            filtered.map(tx => (
              <div
                key={tx.id}
                className={`tx-row ${tx.isAnomaly ? 'anomaly-row' : ''} ${selectedId === tx.id ? 'selected-row' : ''}`}
                onClick={() => onSelect(tx.id)}
              >
                <div className="tx-desc">
                  <span className="tx-name">
                    <span className="tx-emoji">{tx.merchantEmoji}</span>
                    {tx.merchantName}
                  </span>
                  <div className="tx-meta">
                    <span className="tx-cat-badge" style={{ color: catColor(tx.category), background: `${catColor(tx.category)}15` }}>
                      {tx.category}
                    </span>
                    {tx.merchantName !== tx.description && (
                      <span className="tx-raw" title={tx.description}>
                        {tx.description.slice(0, 28)}{tx.description.length > 28 ? '…' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className="tx-date">{tx.date || '—'}</div>
                <div className={`tx-amount ${tx.amount < 0 ? 'debit' : 'credit'}`}>
                  {tx.amount < 0 ? '-' : '+'}₹{fmt(tx.amount)}
                </div>
                <div className="tx-status">
                  {tx.isAnomaly ? (
                    <span className="status-anomaly">⚠ Anomaly</span>
                  ) : (
                    <span className="status-normal">● Normal</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer count */}
        <div className="tx-footer">
          Showing {filtered.length} of {transactions.length} transactions
        </div>
      </div>
    </div>
  );
}
