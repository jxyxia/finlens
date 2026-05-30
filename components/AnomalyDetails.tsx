'use client';

import { AnomalyDetail, Forecast } from '@/types';

interface AnomalyDetailsProps {
  anomalies: AnomalyDetail[];
  forecast: Forecast;
}

const TYPE_ICONS: Record<string, string> = {
  high_amount:    '💸',
  unknown_merchant: '👤',
  unusual_time:   '🌙',
  duplicate:      '🔁',
  category_spike: '📈',
};

const TYPE_LABELS: Record<string, string> = {
  high_amount:      'High Amount',
  unknown_merchant: 'Unknown Merchant',
  unusual_time:     'Unusual Time',
  duplicate:        'Possible Duplicate',
  category_spike:   'Category Spike',
};

function fmt(n: number) { return new Intl.NumberFormat('en-IN').format(Math.abs(n)); }

function ConfidenceBar({ confidence }: { confidence: number }) {
  const color = confidence >= 85 ? '#ff4757' : confidence >= 70 ? '#ff6b35' : '#f59e0b';
  return (
    <div className="confidence-container">
      <div className="confidence-track">
        <div
          className="confidence-fill"
          style={{ width: `${confidence}%`, background: `linear-gradient(90deg, ${color}66, ${color})` }}
        />
      </div>
      <span className="confidence-label">{confidence}% confidence</span>
    </div>
  );
}

function AnomalyCard({ anomaly, rank }: { anomaly: AnomalyDetail; rank: number }) {
  const tx = anomaly.transaction;
  const icon = TYPE_ICONS[anomaly.type] ?? '⚠';
  const label = TYPE_LABELS[anomaly.type] ?? anomaly.type;
  const severity = anomaly.confidence >= 85 ? 'high' : anomaly.confidence >= 70 ? 'med' : 'low';

  return (
    <div className={`anomaly-card anomaly-sev-${severity}`}>
      <div className="anomaly-card-top">
        <div className="anomaly-rank">#{rank}</div>
        <span className="anomaly-type-badge">
          {icon} {label}
        </span>
        <span className="anomaly-amount">-₹{fmt(tx.amount)}</span>
      </div>
      <div className="anomaly-merchant">
        <span className="anomaly-emoji">{tx.merchantEmoji}</span>
        {tx.merchantName}
      </div>
      {tx.merchantName !== tx.description && (
        <div className="anomaly-raw-desc">{tx.description}</div>
      )}
      <p className="anomaly-explanation">{anomaly.explanation}</p>
      <ConfidenceBar confidence={anomaly.confidence} />
    </div>
  );
}

function ForecastWidget({ forecast }: { forecast: Forecast }) {
  const clr = forecast.status === 'on_track' ? '#2ed573' : forecast.status === 'at_risk' ? '#f59e0b' : '#ff4757';
  const label = forecast.status === 'on_track' ? 'On Track' : forecast.status === 'at_risk' ? 'At Risk' : 'Critical';
  const pct = Math.min(100, Math.max(5, (forecast.projectedBalance / Math.max(forecast.currentBalance, 1)) * 100));

  return (
    <div className="forecast-widget">
      <div className="forecast-header">
        <span className="forecast-label">MONTH-END FORECAST</span>
        <span className="forecast-status-badge" style={{ background: `${clr}18`, color: clr, border: `1px solid ${clr}33` }}>
          {label}
        </span>
      </div>
      <div className="forecast-balance">₹{fmt(forecast.projectedBalance)}</div>
      <p className="forecast-sub">Projected balance on {forecast.endOfMonthDate.split(' ').slice(0, 3).join(' ')}</p>

      <div className="forecast-stats-row">
        <div className="forecast-stat">
          <span className="forecast-stat-label">Daily burn</span>
          <span className="forecast-stat-val">₹{fmt(forecast.dailyBurnRate)}</span>
        </div>
        <div className="forecast-stat">
          <span className="forecast-stat-label">Days left</span>
          <span className="forecast-stat-val">{forecast.daysLeft}d</span>
        </div>
        <div className="forecast-stat">
          <span className="forecast-stat-label">Current</span>
          <span className="forecast-stat-val">₹{fmt(forecast.currentBalance)}</span>
        </div>
      </div>

      <div className="forecast-progress">
        <div className="forecast-progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${clr}44, ${clr})` }} />
      </div>
      <div className="forecast-progress-labels">
        <span>₹0</span>
        <span style={{ color: clr }}>₹{fmt(forecast.projectedBalance)}</span>
        <span>₹{fmt(forecast.currentBalance)}</span>
      </div>
    </div>
  );
}

export default function AnomalyDetails({ anomalies, forecast }: AnomalyDetailsProps) {
  return (
    <div className="anomaly-panel">
      <div className="panel-header">
        <h2 className="panel-title">Anomaly Details</h2>
        <span className="flagged-badge">⚠ {anomalies.length} flagged</span>
      </div>

      {anomalies.length === 0 ? (
        <div className="anomaly-empty">
          <span className="anomaly-empty-icon">✅</span>
          <p>No anomalies detected — your spending looks normal.</p>
        </div>
      ) : (
        <div className="anomaly-list">
          {anomalies.slice(0, 5).map((a, i) => (
            <AnomalyCard key={`${a.transaction.id}-${i}`} anomaly={a} rank={i + 1} />
          ))}
        </div>
      )}

      <ForecastWidget forecast={forecast} />
    </div>
  );
}
