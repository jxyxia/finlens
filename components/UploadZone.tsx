'use client';

import { useCallback, useState } from 'react';
import { useToast } from '@/components/Toast';

interface UploadZoneProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
}

const SUPPORTED_EXTENSIONS = ['.csv', '.xls', '.xlsx', '.txt', '.pdf'];

function isSupportedFile(file: File): boolean {
  const name = file.name.toLowerCase();
  if (SUPPORTED_EXTENSIONS.some(ext => name.endsWith(ext))) return true;
  const mime = file.type;
  return (
    mime === 'text/csv' ||
    mime === 'text/plain' ||
    mime === 'application/pdf' ||
    mime.includes('spreadsheet') ||
    mime.includes('excel')
  );
}

const FEATURES = [
  {
    icon: '🤖',
    title: 'ML Anomaly Detection',
    desc: 'Isolation Forest algorithm flags unusual transactions automatically.',
    color: '#7c3aed',
  },
  {
    icon: '📊',
    title: 'Smart Categorisation',
    desc: 'Auto-labels merchants — Swiggy, Uber, Amazon and 200+ more.',
    color: '#3b82f6',
  },
  {
    icon: '📈',
    title: 'Balance Forecasting',
    desc: 'Predicts your month-end balance based on your daily burn rate.',
    color: '#2ed573',
  },
];

const BANKS = ['HDFC', 'ICICI', 'Axis', 'SBI', 'Kotak', 'Yes Bank', 'IDFC'];

/* ── Processing animation steps ── */
const STEPS = ['Parsing file', 'Categorising', 'Running ML', 'Forecasting'];

export default function UploadZone({ onFileUpload, isProcessing }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const toast = useToast();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && isSupportedFile(file)) {
      onFileUpload(file);
    } else if (file) {
      toast.error('Unsupported file type', 'Please upload a CSV, XLS, XLSX, TXT, or PDF file.');
    }
  }, [onFileUpload, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileUpload(file);
  }, [onFileUpload]);

  if (isProcessing) {
    return (
      <div className="upload-zone processing">
        <div className="processing-ring">
          <div className="processing-spinner" />
          <span className="processing-icon-inner">🔍</span>
        </div>
        <h3 className="upload-title">Analysing your statement…</h3>
        <div className="processing-steps">
          {STEPS.map((step, i) => (
            <span key={step} className={`step ${i <= activeStep ? 'step-active' : ''}`}>
              {i < activeStep ? '✓ ' : i === activeStep ? '⟳ ' : ''}{step}
              {i < STEPS.length - 1 && <span className="step-dot"> → </span>}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="hero-section">
      {/* ── Feature cards ── */}
      <div className="hero-features">
        {FEATURES.map(f => (
          <div className="hero-feature-card" key={f.title} style={{ '--card-color': f.color } as React.CSSProperties}>
            <span className="hero-feature-icon">{f.icon}</span>
            <div>
              <div className="hero-feature-title">{f.title}</div>
              <div className="hero-feature-desc">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Drop zone ── */}
      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="upload-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>

        <h3 className="upload-title">
          {isDragging ? 'Drop to analyse →' : 'Drop your bank statement here'}
        </h3>
        <p className="upload-subtitle">or browse to upload a file from your device</p>

        <div className="format-badges">
          {['CSV', 'XLS', 'XLSX', 'TXT', 'PDF'].map(fmt => (
            <span key={fmt} className="format-badge">{fmt}</span>
          ))}
        </div>

        <label className="browse-btn" htmlFor="csv-input">
          Choose File
          <input
            id="csv-input"
            type="file"
            accept=".csv,.xls,.xlsx,.txt,.pdf"
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />
        </label>

        {/* Bank logos row */}
        <div className="hero-banks">
          <span className="hero-banks-label">Works with</span>
          {BANKS.map(b => (
            <span key={b} className="hero-bank-badge">{b}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
