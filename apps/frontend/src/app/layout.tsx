import type { Metadata } from 'next';
import { ToasterContainer } from '@/components/notifications/ErrorToast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Account Book',
  description: '個人資産管理アプリケーション',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="ja">
      <body>
        {children}
        <ToasterContainer />
      </body>
    </html>
  );
}
