'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { aggregationApi, type MonthlyBalanceResponse } from '@/lib/api/aggregation';
import { formatCurrency } from '@account-book/utils';
import { CategoryType } from '@account-book/types';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

/**
 * カテゴリ別内訳画面
 * FR-016: 月別収支集計 - カテゴリ別内訳
 */
function CategoryBreakdownContent(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URLパラメータから年月を取得
  const yearParam = searchParams.get('year');
  const monthParam = searchParams.get('month');
  const typeParam = searchParams.get('type') || 'expense'; // デフォルトは支出

  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
  const month = monthParam ? parseInt(monthParam, 10) : new Date().getMonth() + 1;
  const categoryType = typeParam === 'income' ? CategoryType.INCOME : CategoryType.EXPENSE;

  const [data, setData] = useState<MonthlyBalanceResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'amount' | 'count' | 'percentage'>('amount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // データ取得
  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await aggregationApi.getMonthlyBalance(year, month);
      setData(response);
    } catch (err) {
      setError('データの取得に失敗しました');
      console.error('Failed to fetch monthly balance:', err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  // データ取得のトリガー
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // ソート処理
  const sortedBreakdown = React.useMemo(() => {
    if (!data) return [];

    const breakdown =
      categoryType === CategoryType.INCOME ? data.income.byCategory : data.expense.byCategory;

    const sorted = [...breakdown].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'count':
          comparison = a.count - b.count;
          break;
        case 'percentage':
          comparison = a.percentage - b.percentage;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [data, categoryType, sortBy, sortOrder]);

  // 円グラフ用データ
  const pieChartData = React.useMemo(() => {
    return sortedBreakdown.map((item) => ({
      name: item.categoryName,
      value: item.amount,
      percentage: item.percentage,
    }));
  }, [sortedBreakdown]);

  // 色の配列（円グラフ用）
  const COLORS = [
    '#4CAF50',
    '#F44336',
    '#2196F3',
    '#FF9800',
    '#9C27B0',
    '#00BCD4',
    '#FFC107',
    '#795548',
    '#607D8B',
    '#E91E63',
  ];

  // カスタムツールチップ
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; payload: { percentage: number } }>;
  }): React.JSX.Element | null => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const data = payload[0];
    const percentage = data.payload.percentage;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm mb-1">{data.name}</p>
        <p className="text-sm text-gray-600">金額: {formatCurrency(data.value)}</p>
        <p className="text-sm text-gray-600">割合: {percentage.toFixed(1)}%</p>
      </div>
    );
  };

  // カスタム凡例
  const CustomLegend = ({
    payload,
  }: {
    payload?: Array<{ value: string; color: string; payload: { percentage: number } }>;
  }): React.JSX.Element | null => {
    if (!payload || payload.length === 0) {
      return null;
    }

    return (
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        {payload.map((entry) => {
          const percentage = entry.payload.percentage;
          return (
            <div key={entry.value} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: entry.color }} />
              <span className="text-sm text-gray-700">{entry.value}</span>
              <span className="text-sm text-gray-500">({percentage.toFixed(1)}%)</span>
            </div>
          );
        })}
      </div>
    );
  };

  // ローディング表示
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => void fetchData()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  // データがない場合
  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <div className="text-gray-500">データがありません</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">カテゴリ別内訳</h1>
          <Link
            href={`/aggregation/monthly-balance?year=${year}&month=${month}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← 月次レポートに戻る
          </Link>
        </div>

        <div className="text-lg text-gray-600">
          {year}年{month}月
        </div>
      </div>

      {/* カテゴリタイプ選択 */}
      <div className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={() =>
              router.push(
                `/aggregation/monthly-balance/category?year=${year}&month=${month}&type=income`
              )
            }
            className={`px-4 py-2 rounded-lg ${
              categoryType === CategoryType.INCOME
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            収入
          </button>
          <button
            onClick={() =>
              router.push(
                `/aggregation/monthly-balance/category?year=${year}&month=${month}&type=expense`
              )
            }
            className={`px-4 py-2 rounded-lg ${
              categoryType === CategoryType.EXPENSE
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            支出
          </button>
        </div>
      </div>

      {/* ソートコントロール */}
      <div className="mb-6 flex items-center gap-4">
        <label htmlFor="sort-by" className="text-sm font-medium text-gray-700">
          並び替え:
        </label>
        <select
          id="sort-by"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'amount' | 'count' | 'percentage')}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="amount">金額</option>
          <option value="count">件数</option>
          <option value="percentage">割合</option>
        </select>
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          {sortOrder === 'asc' ? '↑ 昇順' : '↓ 降順'}
        </button>
      </div>

      {/* 円グラフ */}
      {pieChartData.length > 0 && (
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>カテゴリ別構成比</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend content={<CustomLegend />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* カテゴリ別内訳テーブル */}
      <Card>
        <CardHeader>
          <CardTitle>カテゴリ別内訳</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedBreakdown.length === 0 ? (
            <div className="text-center py-8 text-gray-500">データがありません</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">カテゴリ名</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">金額</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">件数</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">割合</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBreakdown.map((item) => (
                    <tr key={item.categoryId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">{item.categoryName}</td>
                      <td
                        className={`py-3 px-4 text-right font-semibold ${
                          categoryType === CategoryType.INCOME ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700">{item.count}件</td>
                      <td className="py-3 px-4 text-right text-gray-700">
                        {item.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CategoryBreakdownPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">読み込み中...</div>}>
      <CategoryBreakdownContent />
    </Suspense>
  );
}
