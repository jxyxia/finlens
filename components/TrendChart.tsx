'use client';

import { useEffect, useRef } from 'react';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler,
} from 'chart.js';
import { Transaction } from '@/types';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Filler);

interface TrendChartProps {
  transactions: Transaction[];
}

export default function TrendChart({ transactions }: TrendChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<Chart | null>(null);

  // Aggregate daily debit totals
  const dailyMap: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.amount >= 0 || !tx.date) continue;
    dailyMap[tx.date] = (dailyMap[tx.date] ?? 0) + Math.abs(tx.amount);
  }

  // Sort by insertion order (already in date order from parsing)
  const entries = Object.entries(dailyMap)
    .slice(-20); // last 20 data points

  const labels = entries.map(([d]) => d);
  const data   = entries.map(([, v]) => v);
  const maxVal = Math.max(...data, 1);

  useEffect(() => {
    if (!canvasRef.current || entries.length === 0) return;
    chartRef.current?.destroy();

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, 200);
    grad.addColorStop(0, '#7c3aed55');
    grad.addColorStop(1, '#7c3aed00');

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Daily Spend',
          data,
          backgroundColor: data.map(v =>
            v === maxVal ? '#ff4757cc' : '#7c3aed88'
          ),
          borderColor: data.map(v =>
            v === maxVal ? '#ff4757' : '#7c3aed'
          ),
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
          hoverBackgroundColor: '#8b5cf6cc',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#111118',
            borderColor: '#1e1e2e',
            borderWidth: 1,
            titleColor: '#e8e8f0',
            bodyColor: '#6b6b8a',
            padding: 10,
            callbacks: {
              title: (items) => items[0].label,
              label: (ctx) => ` ₹${(ctx.raw as number).toLocaleString('en-IN')}`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: '#1e1e2e', drawTicks: false },
            ticks: {
              color: '#3d3d55',
              font: { family: 'JetBrains Mono', size: 9 },
              maxRotation: 45,
            },
            border: { color: '#1e1e2e' },
          },
          y: {
            grid: { color: '#151520', drawTicks: false },
            ticks: {
              color: '#3d3d55',
              font: { family: 'JetBrains Mono', size: 9 },
              callback: (v) => `₹${Number(v) >= 1000 ? `${(Number(v)/1000).toFixed(0)}k` : v}`,
            },
            border: { color: 'transparent' },
          },
        },
      },
    });

    return () => { chartRef.current?.destroy(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(entries)]);

  if (entries.length === 0) return null;

  const avg = data.reduce((a, b) => a + b, 0) / data.length;

  return (
    <div className="trend-chart-panel">
      <div className="panel-header">
        <h2 className="panel-title">Daily Spending Trend</h2>
        <div className="trend-meta">
          <span className="trend-peak">
            Peak: <span style={{ color: '#ff4757' }}>₹{maxVal.toLocaleString('en-IN')}</span>
          </span>
          <span className="trend-avg">
            Avg: <span style={{ color: '#7c3aed' }}>₹{Math.round(avg).toLocaleString('en-IN')}</span>
          </span>
        </div>
      </div>
      <div className="trend-chart-wrap">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
