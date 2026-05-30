'use client';

import { useEffect, useRef, useState } from 'react';

interface StatCardsProps {
  totalTransactions: number;
  anomaliesFound: number;
  totalSpend: number;
  spendChange: number;
  predictedBalance: number;
  forecastDate: string;
}

function useCountUp(target: number, duration = 800) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const start = prev.current;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const step = (now: number) => {
      const pct = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      setDisplay(Math.round(start + diff * ease));
      if (pct < 1) requestAnimationFrame(step);
      else prev.current = target;
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return display;
}

function StatCard({
  label, value, sub, color, prefix = '',
}: {
  label: string; value: number; sub: string; color?: string; prefix?: string;
}) {
  const displayed = useCountUp(Math.abs(value));
  const formatted = new Intl.NumberFormat('en-IN').format(displayed);

  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={color ? { color } : {}}>
        {prefix}{formatted}
      </div>
      <div className="stat-sub" dangerouslySetInnerHTML={{ __html: sub }} />
    </div>
  );
}

export default function StatCards({
  totalTransactions, anomaliesFound, totalSpend,
  spendChange, predictedBalance, forecastDate,
}: StatCardsProps) {
  const anomalyPct = ((anomaliesFound / Math.max(totalTransactions, 1)) * 100).toFixed(1);

  return (
    <div className="stat-cards">
      <StatCard
        label="Transactions"
        value={totalTransactions}
        sub="in this statement"
      />
      <StatCard
        label="Anomalies"
        value={anomaliesFound}
        sub={`${anomalyPct}% flagged`}
        color="var(--red)"
      />
      <StatCard
        label="Total spend"
        value={totalSpend}
        prefix="₹"
        sub={`<span style="color:var(--red)">↑ ${spendChange}%</span> vs last month`}
      />
      <StatCard
        label="Predicted balance"
        value={predictedBalance}
        prefix="₹"
        sub={`end of month · ${forecastDate}`}
        color={predictedBalance > 0 ? 'var(--green)' : 'var(--red)'}
      />
    </div>
  );
}
