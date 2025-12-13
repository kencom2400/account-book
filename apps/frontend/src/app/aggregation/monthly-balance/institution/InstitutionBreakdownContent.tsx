'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { aggregationApi, type MonthlyBalanceResponse } from '@/lib/api/aggregation';
import { formatCurrency } from '@account-book/utils';
import { CategoryType } from '@account-book/types';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

/**
 * 金融機関別内訳画面
 * FR-016: 月別収支集計 - 金融機関別内訳
 */
export function InstitutionBreakdownContent(): React.JSX.Element {
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
      categoryType === CategoryType.INCOME ? data.income.byInstitution : data.expense.byInstitution;

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

  // 棒グラフ用データ
  const barChartData = React.useMemo(() => {
    return sortedBreakdown.map((item) => ({
      name: item.institutionName,
      amount: item.amount,
      count: item.count,
      percentage: item.percentage,
    }));
  }, [sortedBreakdown]);

  // 色の配列（棒グラフ用）
  const COLOR_INCOME = '#4CAF50';
  const COLOR_EXPENSE = '#F44336';
  const barColor = categoryType === CategoryType.INCOME ? COLOR_INCOME : COLOR_EXPENSE;

  // カテゴリタイプの切り替え
  const handleTypeChange = (newType: CategoryType): void => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', newType === CategoryType.INCOME ? 'income' : 'expense');
    router.push(`/aggregation/monthly-balance/institution?${params.toString()}`);
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
          <h1 className="text-3xl font-bold text-gray-900">金融機関別内訳</h1>
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
            onClick={() => handleTypeChange(CategoryType.INCOME)}
            className={`px-4 py-2 rounded-lg ${
              categoryType === CategoryType.INCOME
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            収入
          </button>
          <button
            onClick={() => handleTypeChange(CategoryType.EXPENSE)}
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

      {/* 棒グラフ */}
      {barChartData.length > 0 && (
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>金融機関別比較</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={barChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} interval={0} />
                  <YAxis tickFormatter={(value: number) => formatCurrency(value)} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                  />
                  <Legend />
                  <Bar dataKey="amount" fill={barColor} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 金融機関別内訳テーブル */}
      <Card>
        <CardHeader>
          <CardTitle>金融機関別内訳</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedBreakdown.length === 0 ? (
            <div className="text-center py-8 text-gray-500">データがありません</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">金融機関名</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">金額</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">件数</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">割合</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBreakdown.map((item) => (
                    <tr
                      key={item.institutionId}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-gray-900">{item.institutionName}</td>
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
