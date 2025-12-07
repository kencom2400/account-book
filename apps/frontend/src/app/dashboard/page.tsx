'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { TransactionList } from '@/components/transactions/TransactionList';
import { MonthlySummaryCard } from '@/components/dashboard/MonthlySummaryCard';
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown';
import { MonthlyBalanceGraph } from '@/components/dashboard/MonthlyBalanceGraph';
import { YearlyBalanceGraph } from '@/components/dashboard/YearlyBalanceGraph';
import { CategoryPieChartContainer } from '@/components/dashboard/CategoryPieChartContainer';
import { AssetBalanceContainer } from '@/components/dashboard/AssetBalanceContainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { getTransactions, getMonthlySummary, type MonthlySummary } from '@/lib/api/transactions';
import {
  aggregationApi,
  type MonthlyBalanceResponse,
  type YearlyBalanceResponse,
} from '@/lib/api/aggregation';
import { Transaction } from '@account-book/types';

/**
 * ダッシュボードページ
 */
export default function DashboardPage(): React.JSX.Element {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [balanceData, setBalanceData] = useState<MonthlyBalanceResponse | null>(null);
  const [yearlyBalanceData, setYearlyBalanceData] = useState<YearlyBalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yearlyLoading, setYearlyLoading] = useState(false);
  const [yearlyError, setYearlyError] = useState<string | null>(null);

  // 年の選択範囲の定数
  const YEAR_SELECTION_RANGE = 10; // 選択可能な年の数
  const YEAR_SELECTION_OFFSET = 5; // 現在年から前後何年まで表示するか

  // 現在の年月を取得
  const now: Date = new Date();
  const currentYear: number = now.getFullYear();
  const currentMonth: number = now.getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        // 取引データ、月次サマリー、月別収支集計を並行取得
        const [transactionsData, summaryData, balanceResponse] = await Promise.all([
          getTransactions({ year: currentYear, month: currentMonth }),
          getMonthlySummary(currentYear, currentMonth),
          aggregationApi.getMonthlyBalance(currentYear, currentMonth),
        ]);

        setTransactions(transactionsData);
        setSummary(summaryData);
        setBalanceData(balanceResponse);
      } catch (_err) {
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [currentYear, currentMonth]);

  // 年間収支データの取得
  const fetchYearlyData = useCallback(async (): Promise<void> => {
    try {
      setYearlyLoading(true);
      setYearlyError(null);
      const yearlyResponse = await aggregationApi.getYearlyBalance(selectedYear);
      setYearlyBalanceData(yearlyResponse);
    } catch (_err) {
      setYearlyError('年間データの取得に失敗しました');
    } finally {
      setYearlyLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    void fetchYearlyData();
  }, [fetchYearlyData]);

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ダッシュボード</h1>
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

        {/* 月間グラフセクション */}
        {balanceData && (
          <div className="mb-8">
            <MonthlyBalanceGraph data={balanceData} />
          </div>
        )}

        {/* カテゴリ別円グラフセクション */}
        <div className="mb-8">
          <CategoryPieChartContainer />
        </div>

        {/* 資産残高セクション */}
        <div className="mb-8">
          <AssetBalanceContainer />
        </div>

        {/* 年間グラフセクション */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>年間収支グラフ</CardTitle>
                <div className="flex items-center gap-2">
                  <label htmlFor="year-select" className="text-sm text-gray-600">
                    年:
                  </label>
                  <select
                    id="year-select"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from(
                      { length: YEAR_SELECTION_RANGE },
                      (_, i) => currentYear - YEAR_SELECTION_OFFSET + i
                    ).map((year) => (
                      <option key={year} value={year}>
                        {year}年
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {yearlyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">読み込み中...</p>
                  </div>
                </div>
              ) : yearlyError ? (
                <div className="text-center py-12">
                  <p className="text-red-600 mb-4">{yearlyError}</p>
                  <button
                    onClick={() => {
                      void fetchYearlyData();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    再試行
                  </button>
                </div>
              ) : yearlyBalanceData ? (
                <YearlyBalanceGraph data={yearlyBalanceData} />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">データがありません</p>
                </div>
              )}
            </CardContent>
          </Card>
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
