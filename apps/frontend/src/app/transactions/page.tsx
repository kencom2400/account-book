'use client';

import { useEffect, useState, useCallback } from 'react';
import { TransactionList } from '@/components/transactions/TransactionList';
import { getTransactions, exportTransactions, type ExportFormat } from '@/lib/api/transactions';
import type { Transaction } from '@account-book/types';

/**
 * 取引一覧ページ
 * FR-010: 費目の手動修正機能
 */
export default function TransactionsPage(): React.JSX.Element {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);

  const loadTransactions = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTransactions();
      setTransactions(data);
    } catch (err) {
      console.error('取引データの取得に失敗しました:', err);
      setError('取引データの取得に失敗しました。再読み込みしてください。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  const handleTransactionUpdate = useCallback((updatedTransaction: Transaction): void => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t))
    );
  }, []);

  const handleExport = useCallback(async (format: ExportFormat): Promise<void> => {
    try {
      setExporting(true);
      setError(null);
      await exportTransactions({ format });
    } catch (err) {
      console.error('エクスポートに失敗しました:', err);
      setError('エクスポートに失敗しました。もう一度お試しください。');
    } finally {
      setExporting(false);
    }
  }, []);

  // 共通レイアウト
  const PageLayout = ({ children }: { children: React.ReactNode }): React.JSX.Element => (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">取引一覧</h1>
        <div className="flex gap-2">
          <button
            onClick={() => void handleExport('csv')}
            disabled={exporting || transactions.length === 0}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {exporting ? 'エクスポート中...' : 'CSVエクスポート'}
          </button>
          <button
            onClick={() => void handleExport('json')}
            disabled={exporting || transactions.length === 0}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {exporting ? 'エクスポート中...' : 'JSONエクスポート'}
          </button>
        </div>
      </div>
      {children}
    </div>
  );

  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">読み込み中...</span>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="bg-red-50 border border-red-500 rounded p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
        <button
          onClick={() => void loadTransactions()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          再読み込み
        </button>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <TransactionList transactions={transactions} onTransactionUpdate={handleTransactionUpdate} />
    </PageLayout>
  );
}
