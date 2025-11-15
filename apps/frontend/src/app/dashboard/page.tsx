'use client';

import React, { useEffect, useState } from 'react';
import { TransactionList } from '@/components/transactions/TransactionList';
import { MonthlySummaryCard } from '@/components/dashboard/MonthlySummaryCard';
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { getTransactions, getMonthlySummary, type MonthlySummary } from '@/lib/api/transactions';
import { Transaction } from '@account-book/types';

/**
 * ダッシュボードページ
 */
export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 現在の年月を取得
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 取引データと月次サマリーを並行取得
        const [transactionsData, summaryData] = await Promise.all([
          getTransactions({ year: currentYear, month: currentMonth }),
          getMonthlySummary(currentYear, currentMonth),
        ]);

        setTransactions(transactionsData);
        setSummary(summaryData);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch data:', err);
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentYear, currentMonth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ダッシュボード
          </h1>
          <p className="text-gray-600">
            {currentYear}年{currentMonth}月の収支状況
          </p>
        </div>

        {/* サマリーセクション */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {summary && (
            <>
              <MonthlySummaryCard
                year={summary.year}
                month={summary.month}
                income={summary.income}
                expense={summary.expense}
                balance={summary.balance}
                transactionCount={summary.transactionCount}
              />
              <CategoryBreakdown byCategory={summary.byCategory} />
            </>
          )}
        </div>

        {/* 取引一覧セクション */}
        <Card>
          <CardHeader>
            <CardTitle>取引一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionList transactions={transactions} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

