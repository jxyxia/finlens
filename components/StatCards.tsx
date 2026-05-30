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

function useCountUp(target: number, duration = 900) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const start = prev.current;
    const diff  = target - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const step = (now: number) => {
      const pct = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3); // cubic ease-out
      setDisplay(Math.round(start + diff * ease));
      if (pct < 1) requestAnimationFrame(step);
      else prev.current = target;
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return display;
}

function StatCard({
  label, value, sub, color, prefix = '', suffix = '', icon,
}: {
  label: string; value: number; sub: string; color?: string;
  prefix?: string; suffix?: string; icon: string;
}) {
  const displayed = useCountUp(Math.abs(value));
  const formatted = new Intl.NumberFormat('en-IN').format(displayed);

  return (
    <div className="stat-card">
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={color ? { color } : {}}>
        {prefix}{formatted}{suffix}
      </div>
      <div className="stat-sub" dangerouslySetInnerHTML={{ __html: sub }} />
    </div>
  );
}

export default function StatCards({
  totalTransactions, anomaliesFound, totalSpend,
  spendChange, predictedBalance, forecastDate,
}: StatCardsProps) {
  return (
    <div className="stat-cards">
      <StatCard
        label="TOTAL TRANSACTIONS"
        value={totalTransactions}
        sub="Last 30 days"
        icon="🔢"
      />
      <StatCard
        label="ANOMALIES FOUND"
        value={anomaliesFound}
        sub={`${((anomaliesFound / Math.max(totalTransactions, 1)) * 100).toFixed(1)}% of total`}
        color="#ff4757"
        icon="⚠️"
      />
      <StatCard
        label="TOTAL SPEND"
        value={totalSpend}
        prefix="₹"
        sub={`<span style="color:#ff4757">↑ ${spendChange}%</span> vs last month`}
        icon="💳"
      />
      <StatCard
        label="PREDICTED BALANCE"
        value={predictedBalance}
        prefix="₹"
        sub={`On ${forecastDate}`}
        color={predictedBalance > 0 ? '#2ed573' : '#ff4757'}
        icon="📊"
      />
    </div>
  );
}
