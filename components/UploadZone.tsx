'use client';

import { useCallback, useState } from 'react';

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

const BANKS = ['HDFC', 'ICICI', 'Axis', 'SBI', 'Kotak', 'Yes Bank', 'IDFC'];

export default function UploadZone({ onFileUpload, isProcessing }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && isSupportedFile(file)) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

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
        <div className="spinner" />
        <p className="upload-title">Analysing your statement…</p>
        <p className="upload-subtitle">parsing · categorising · running anomaly detection</p>
      </div>
    );
  }

  return (
    <div
      className={`upload-zone ${isDragging ? 'dragging' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="upload-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </div>

      <div className="upload-text">
        <p className="upload-title">
          {isDragging ? 'Release to upload' : 'Drop your bank statement here'}
        </p>
        <p className="upload-subtitle">CSV, XLS, XLSX, TXT or PDF</p>
      </div>

      <label className="browse-btn" htmlFor="csv-input">
        Choose file
        <input
          id="csv-input"
          type="file"
          accept=".csv,.xls,.xlsx,.txt,.pdf"
          style={{ display: 'none' }}
          onChange={handleFileInput}
        />
      </label>

      <div className="bank-support">
        <span className="bank-support-label">Works with</span>
        {BANKS.map(b => (
          <span key={b} className="bank-tag">{b}</span>
        ))}
      </div>
    </div>
  );
}
