import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '가계부 앱',
  description: '간단한 가계부 웹앱',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
