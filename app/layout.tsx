import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FINLENS — Personal Finance Anomaly Detector',
  description:
    'Upload your bank statement and let FINLENS detect spending anomalies, flag unusual transactions, and predict your month-end balance using ML-powered analysis.',
  keywords: ['finance', 'anomaly detection', 'bank statement', 'spending analysis', 'machine learning', 'fintech'],
  openGraph: {
    title: 'FINLENS — Personal Finance Anomaly Detector',
    description: 'ML-powered anomaly detection for your bank transactions. Upload CSV, get insights instantly.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
