'use client';

import { useEffect, useState, useCallback } from 'react';
import { TransactionList } from '@/components/transactions/TransactionList';
import { getTransactions } from '@/lib/api/transactions';
import type { Transaction } from '@account-book/types';

/**
 * 取引一覧ページ
 * FR-010: 費目の手動修正機能
 */
export default function TransactionsPage(): React.JSX.Element {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  // 共通レイアウト
  const PageLayout = ({ children }: { children: React.ReactNode }): React.JSX.Element => (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">取引一覧</h1>
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
