'use client';

import React, { useMemo, useId } from 'react';
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
  ComposedChart,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency } from '@account-book/utils';
import type { YearlyBalanceResponse } from '@/lib/api/aggregation';
import { CustomTooltip } from './CustomTooltip';

interface YearlyBalanceGraphProps {
  data: YearlyBalanceResponse;
}

// グラフのカラー定数
const COLOR_INCOME = '#4CAF50';
const COLOR_EXPENSE = '#F44336';
const COLOR_BALANCE_POSITIVE = '#2196F3';
const COLOR_BALANCE_NEGATIVE = '#FF9800';

/**
 * 年間収支グラフコンポーネント
 * FR-024: 年間収支グラフ表示
 */
export function YearlyBalanceGraph({ data }: YearlyBalanceGraphProps): React.JSX.Element {
  // 一意なIDを生成（linearGradientのID衝突を防ぐ）
  const uniqueId = useId();
  const balanceGradientId = `colorBalance-${uniqueId}`;

  // 月別データをグラフ用に変換
  const monthlyData = useMemo(() => {
    return data.months.map((month) => {
      const monthNum = parseInt(month.month.split('-')[1] || '1', 10);
      return {
        month: `${monthNum}月`,
        monthNum,
        income: month.income.total,
        expense: month.expense.total,
        balance: month.balance,
        savingsRate: month.savingsRate,
      };
    });
  }, [data]);

  // 年間サマリーデータ
  const annualSummary = useMemo(() => {
    return [
      {
        name: '年間収入',
        value: data.annual.totalIncome,
        color: COLOR_INCOME,
      },
      {
        name: '年間支出',
        value: data.annual.totalExpense,
        color: COLOR_EXPENSE,
      },
      {
        name: '年間収支',
        value: data.annual.totalBalance,
        color: data.annual.totalBalance >= 0 ? COLOR_BALANCE_POSITIVE : COLOR_BALANCE_NEGATIVE,
      },
    ];
  }, [data]);

  return (
    <div className="space-y-6">
      {/* 年間サマリーバーグラフ */}
      <Card>
        <CardHeader>
          <CardTitle>年間サマリー</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">年間収入</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(data.annual.totalIncome)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                平均: {formatCurrency(data.annual.averageIncome)}/月
              </p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">年間支出</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(data.annual.totalExpense)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                平均: {formatCurrency(data.annual.averageExpense)}/月
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">年間収支</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(data.annual.totalBalance)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                貯蓄率: {data.annual.savingsRate.toFixed(1)}%
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={annualSummary}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value: number) => formatCurrency(value)} />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value">
                {annualSummary.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 月別折れ線グラフ */}
      <Card>
        <CardHeader>
          <CardTitle>月別推移（折れ線グラフ）</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value: number) => formatCurrency(value)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                stroke={COLOR_INCOME}
                strokeWidth={2}
                name="収入"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                stroke={COLOR_EXPENSE}
                strokeWidth={2}
                name="支出"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke={COLOR_BALANCE_POSITIVE}
                strokeWidth={2}
                name="収支"
                dot={{ r: 4 }}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 月別積み上げ棒グラフ */}
      <Card>
        <CardHeader>
          <CardTitle>月別収支（積み上げ棒グラフ）</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value: number) => formatCurrency(value)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="income" stackId="a" fill={COLOR_INCOME} name="収入" />
              <Bar dataKey="expense" stackId="a" fill={COLOR_EXPENSE} name="支出" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 収支差額エリアグラフ */}
      <Card>
        <CardHeader>
          <CardTitle>収支差額推移</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id={balanceGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLOR_BALANCE_POSITIVE} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLOR_BALANCE_POSITIVE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value: number) => formatCurrency(value)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="balance"
                stroke={COLOR_BALANCE_POSITIVE}
                fill={`url(#${balanceGradientId})`}
                name="収支"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
