import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Account Book',
  description: '個人資産管理アプリケーション',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

