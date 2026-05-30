'use client';

import { useEffect, useRef } from 'react';
import {
  Chart,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Transaction } from '@/types';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

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

function getCategoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? '#7c3aed';
}

interface CategoryChartProps {
  transactions: Transaction[];
}

export default function CategoryChart({ transactions }: CategoryChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  // Aggregate spend by category (debits only)
  const categoryMap: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.amount >= 0) continue;
    categoryMap[tx.category] = (categoryMap[tx.category] ?? 0) + Math.abs(tx.amount);
  }

  const sorted = Object.entries(categoryMap)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const labels = sorted.map(([k]) => k);
  const data   = sorted.map(([, v]) => v);
  const colors = labels.map(l => getCategoryColor(l));
  const total  = data.reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (!canvasRef.current || sorted.length === 0) return;
    chartRef.current?.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.map(c => `${c}cc`),
          borderColor:     colors,
          borderWidth: 1.5,
          hoverBorderWidth: 2.5,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#111118',
            borderColor: '#1e1e2e',
            borderWidth: 1,
            titleColor: '#e8e8f0',
            bodyColor: '#6b6b8a',
            padding: 12,
            callbacks: {
              label: (ctx) => {
                const val = ctx.raw as number;
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                return ` ₹${val.toLocaleString('en-IN')}  (${pct}%)`;
              },
            },
          },
        },
      },
    });

    return () => { chartRef.current?.destroy(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(sorted)]);

  if (sorted.length === 0) return null;

  return (
    <div className="category-chart-panel">
      <div className="panel-header">
        <h2 className="panel-title">Spend by Category</h2>
        <span className="panel-sub">{sorted.length} categories</span>
      </div>

      <div className="category-chart-body">
        {/* Donut */}
        <div className="donut-wrapper">
          <canvas ref={canvasRef} />
          <div className="donut-center">
            <div className="donut-total">₹{(total / 1000).toFixed(1)}k</div>
            <div className="donut-label">total spend</div>
          </div>
        </div>

        {/* Legend */}
        <div className="category-legend">
          {sorted.map(([cat, val]) => (
            <div key={cat} className="legend-row">
              <span className="legend-dot" style={{ background: getCategoryColor(cat) }} />
              <span className="legend-name">{cat}</span>
              <span className="legend-bar-wrap">
                <span
                  className="legend-bar-fill"
                  style={{
                    width: `${(val / total) * 100}%`,
                    background: `${getCategoryColor(cat)}55`,
                    borderRight: `2px solid ${getCategoryColor(cat)}`,
                  }}
                />
              </span>
              <span className="legend-val">₹{val.toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
