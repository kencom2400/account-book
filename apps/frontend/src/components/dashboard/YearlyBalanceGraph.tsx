'use client';

import React, { useMemo, useId } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
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
  const balancePositiveGradientId = `colorBalancePositive-${uniqueId}`;
  const balanceNegativeGradientId = `colorBalanceNegative-${uniqueId}`;

  // 月別データをグラフ用に変換（1月〜12月）
  const monthlyData = useMemo(() => {
    return data.months.map((month) => {
      // 月のラベル（1月、2月...）
      const monthNum = parseInt(month.month.split('-')[1] || '0', 10);
      const monthLabel = `${monthNum}月`;

      return {
        month: monthLabel,
        monthNum,
        income: month.income.total,
        expense: month.expense.total,
        balance: month.balance,
        savingsRate: month.savingsRate,
      };
    });
  }, [data.months]);

  // 月別折れ線グラフ用データ（収入・支出・収支の3本の線）
  const lineChartData = useMemo(() => {
    return monthlyData;
  }, [monthlyData]);

  // 月別積み上げ棒グラフ用データ（収入バーと支出バー）
  const barChartData = useMemo(() => {
    return monthlyData;
  }, [monthlyData]);

  // 収支差額エリアグラフ用データ（0を基準にプラス/マイナス）
  // プラスとマイナスを分けて描画するため、2つのデータセットを作成
  const areaChartData = useMemo(() => {
    return monthlyData.map((item) => ({
      month: item.month,
      monthNum: item.monthNum,
      balance: item.balance,
      positiveBalance: item.balance >= 0 ? item.balance : 0,
      negativeBalance: item.balance < 0 ? item.balance : 0,
    }));
  }, [monthlyData]);

  return (
    <div className="space-y-6">
      {/* 月別折れ線グラフ */}
      <Card>
        <CardHeader>
          <CardTitle>月別推移（折れ線グラフ）</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                stroke={
                  data.annual.totalBalance >= 0 ? COLOR_BALANCE_POSITIVE : COLOR_BALANCE_NEGATIVE
                }
                strokeWidth={2}
                name="収支"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 月別積み上げ棒グラフ */}
      <Card>
        <CardHeader>
          <CardTitle>月別比較（棒グラフ）</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value: number) => formatCurrency(value)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="income" fill={COLOR_INCOME} name="収入" />
              <Bar dataKey="expense" fill={COLOR_EXPENSE} name="支出" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 収支差額エリアグラフ */}
      <Card>
        <CardHeader>
          <CardTitle>収支差額（エリアグラフ）</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={areaChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id={balancePositiveGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLOR_BALANCE_POSITIVE} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLOR_BALANCE_POSITIVE} stopOpacity={0} />
                </linearGradient>
                <linearGradient id={balanceNegativeGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLOR_BALANCE_NEGATIVE} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLOR_BALANCE_NEGATIVE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value: number) => formatCurrency(value)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {/* プラスのエリア */}
              <Area
                type="monotone"
                dataKey="positiveBalance"
                stroke={COLOR_BALANCE_POSITIVE}
                fillOpacity={1}
                fill={`url(#${balancePositiveGradientId})`}
                name="収支（プラス）"
              />
              {/* マイナスのエリア */}
              <Area
                type="monotone"
                dataKey="negativeBalance"
                stroke={COLOR_BALANCE_NEGATIVE}
                fillOpacity={1}
                fill={`url(#${balanceNegativeGradientId})`}
                name="収支（マイナス）"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
