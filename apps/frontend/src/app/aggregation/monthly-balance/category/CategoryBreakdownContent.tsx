'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { aggregationApi, type MonthlyBalanceResponse } from '@/lib/api/aggregation';
import { formatCurrency } from '@account-book/utils';
import { CategoryType } from '@account-book/types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * カテゴリ別内訳画面
 * FR-016: 月別収支集計 - カテゴリ別内訳
 */
export function CategoryBreakdownContent(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URLパラメータから年月とタイプを取得
  const yearParam = searchParams.get('year');
  const monthParam = searchParams.get('month');
  const typeParam = searchParams.get('type') || 'expense';

  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
  const month = monthParam ? parseInt(monthParam, 10) : new Date().getMonth() + 1;
  const categoryType = typeParam === 'income' ? CategoryType.INCOME : CategoryType.EXPENSE;

  const [data, setData] = useState<MonthlyBalanceResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'amount' | 'count' | 'percentage'>('amount');
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

  // カテゴリ別データの取得
  const categoryData = useMemo(() => {
    if (!data) return [];
    return categoryType === CategoryType.INCOME ? data.income.byCategory : data.expense.byCategory;
  }, [data, categoryType]);

  // ソート処理
  const sortedData = useMemo(() => {
    const sorted = [...categoryData];
    sorted.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortField) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'count':
          aValue = a.count;
          bValue = b.count;
          break;
        case 'percentage':
          aValue = a.percentage;
          bValue = b.percentage;
          break;
        default:
          aValue = a.amount;
          bValue = b.amount;
      }

      if (sortOrder === 'asc') {
        return aValue - bValue;
      }
      return bValue - aValue;
    });
    return sorted;
  }, [categoryData, sortField, sortOrder]);

  // 円グラフ用データの変換
  const pieChartData = useMemo(() => {
    return categoryData.map((item) => ({
      name: item.categoryName,
      value: item.amount,
      percentage: item.percentage,
    }));
  }, [categoryData]);

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

  // カテゴリタイプの切り替え
  const handleTypeChange = (newType: CategoryType): void => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', newType === CategoryType.INCOME ? 'income' : 'expense');
    router.push(`/aggregation/monthly-balance/category?${params.toString()}`);
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
  if (!data || categoryData.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href={`/aggregation/monthly-balance?year=${year}&month=${month}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← 月次レポートに戻る
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">カテゴリ別内訳</h1>
        <div className="text-center py-8">
          <div className="text-gray-500">データがありません</div>
        </div>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/aggregation/monthly-balance?year=${year}&month=${month}`}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← 月次レポートに戻る
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-4">カテゴリ別内訳</h1>
      <p className="text-gray-600 mb-6">
        {year}年{month}月
      </p>

      {/* 収入/支出切り替え */}
      <div className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => handleTypeChange(CategoryType.INCOME)}
            className={`px-4 py-2 rounded-lg font-medium ${
              categoryType === CategoryType.INCOME
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            収入
          </button>
          <button
            onClick={() => handleTypeChange(CategoryType.EXPENSE)}
            className={`px-4 py-2 rounded-lg font-medium ${
              categoryType === CategoryType.EXPENSE
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            支出
          </button>
        </div>
      </div>

      {/* 円グラフ */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>カテゴリ別内訳</CardTitle>
        </CardHeader>
        <CardContent>
          {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
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
          ) : (
            <div className="text-center py-8 text-gray-500">データがありません</div>
          )}
        </CardContent>
      </Card>

      {/* ソートコントロール */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>詳細一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <label htmlFor="sort-field" className="text-sm font-medium text-gray-700">
              並び替え:
            </label>
            <select
              id="sort-field"
              value={sortField}
              onChange={(e) => setSortField(e.target.value as 'amount' | 'count' | 'percentage')}
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

          {/* テーブル */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">カテゴリ名</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">金額</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">件数</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">割合</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedData.map((item) => (
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
        </CardContent>
      </Card>
    </div>
  );
}
