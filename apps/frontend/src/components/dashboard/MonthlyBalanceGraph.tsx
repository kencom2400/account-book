'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency } from '@account-book/utils';
import type { MonthlyBalanceResponse } from '@/lib/api/aggregation';

interface MonthlyBalanceGraphProps {
  data: MonthlyBalanceResponse;
}

/**
 * 月間収支グラフコンポーネント
 * FR-023: 月間収支グラフ表示
 */
export function MonthlyBalanceGraph({ data }: MonthlyBalanceGraphProps): React.JSX.Element {
  // 月間サマリーデータ（横棒グラフ用）
  const summaryData = useMemo(() => {
    return [
      {
        name: '収入',
        value: data.income.total,
        color: '#4CAF50',
      },
      {
        name: '支出',
        value: data.expense.total,
        color: '#F44336',
      },
      {
        name: '収支',
        value: data.balance,
        color: data.balance >= 0 ? '#2196F3' : '#FF9800',
      },
    ];
  }, [data]);

  // 日別推移データ（折れ線グラフ用）
  const dailyData = useMemo(() => {
    // 取引データを日付ごとに集計
    const dailyMap = new Map<string, { income: number; expense: number }>();

    // 収入取引を日付ごとに集計
    for (const transaction of data.income.transactions) {
      const date = new Date(transaction.date);
      const day = date.getDate();
      const key = day.toString();

      if (!dailyMap.has(key)) {
        dailyMap.set(key, { income: 0, expense: 0 });
      }

      const daily = dailyMap.get(key)!;
      daily.income += Math.abs(transaction.amount);
    }

    // 支出取引を日付ごとに集計
    for (const transaction of data.expense.transactions) {
      const date = new Date(transaction.date);
      const day = date.getDate();
      const key = day.toString();

      if (!dailyMap.has(key)) {
        dailyMap.set(key, { income: 0, expense: 0 });
      }

      const daily = dailyMap.get(key)!;
      daily.expense += Math.abs(transaction.amount);
    }

    // 月の日数を取得
    const [year, month] = data.month.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    // 1日から月末まで、データがない日は0で埋める
    const result: Array<{ date: number; income: number; expense: number; balance: number }> = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const key = day.toString();
      const daily = dailyMap.get(key) || { income: 0, expense: 0 };

      result.push({
        date: day,
        income: daily.income,
        expense: daily.expense,
        balance: daily.income - daily.expense,
      });
    }

    return result;
  }, [data]);

  // 累積データ（エリアグラフ用）
  const cumulativeData = useMemo(() => {
    let cumulativeIncome = 0;
    let cumulativeExpense = 0;

    return dailyData.map((daily) => {
      cumulativeIncome += daily.income;
      cumulativeExpense += daily.expense;

      return {
        date: daily.date,
        cumulativeIncome,
        cumulativeExpense,
        cumulativeBalance: cumulativeIncome - cumulativeExpense,
      };
    });
  }, [dailyData]);

  // カスタムツールチップ
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
  }): React.JSX.Element | null => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        {payload.map((item, index) => (
          <p key={index} className="text-sm" style={{ color: item.color }}>
            {`${item.name}: ${formatCurrency(item.value)}`}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 月間サマリーバーグラフ */}
      <Card>
        <CardHeader>
          <CardTitle>月間サマリー</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={summaryData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value: number) => formatCurrency(value)} />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value">
                {summaryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 日別推移グラフ */}
      <Card>
        <CardHeader>
          <CardTitle>日別推移</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" label={{ value: '日', position: 'insideBottom', offset: -5 }} />
              <YAxis tickFormatter={(value: number) => formatCurrency(value)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#4CAF50"
                strokeWidth={2}
                name="収入"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                stroke="#F44336"
                strokeWidth={2}
                name="支出"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 累積グラフ */}
      <Card>
        <CardHeader>
          <CardTitle>累積推移</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={cumulativeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F44336" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#F44336" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" label={{ value: '日', position: 'insideBottom', offset: -5 }} />
              <YAxis tickFormatter={(value: number) => formatCurrency(value)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="cumulativeIncome"
                stroke="#4CAF50"
                fillOpacity={1}
                fill="url(#colorIncome)"
                name="累積収入"
              />
              <Area
                type="monotone"
                dataKey="cumulativeExpense"
                stroke="#F44336"
                fillOpacity={1}
                fill="url(#colorExpense)"
                name="累積支出"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
