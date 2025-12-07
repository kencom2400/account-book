'use client';

import React, { useMemo, useId } from 'react';
import {
  Line,
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
import type { TrendAnalysisResponse } from '@/lib/api/aggregation';
import { CustomTooltip } from './CustomTooltip';

interface TrendGraphProps {
  data: TrendAnalysisResponse;
  loading?: boolean;
  error?: string | null;
}

// グラフのカラー定数
const COLOR_ACTUAL = '#2196F3'; // 実績データ: 太線（青）
const COLOR_MOVING_AVERAGE = '#FF9800'; // 移動平均: 破線（オレンジ）
const COLOR_TREND_LINE = '#4CAF50'; // トレンドライン: 点線（緑）

/**
 * トレンドグラフコンポーネント
 * FR-027: 収支推移のトレンド表示
 */
export function TrendGraph({
  data,
  loading = false,
  error = null,
}: TrendGraphProps): React.JSX.Element {
  // 一意なIDを生成（linearGradientのID衝突を防ぐ）
  const uniqueId = useId();

  // グラフ用データを準備（実績、移動平均、トレンドラインを結合）
  const chartData = useMemo(() => {
    const result: Array<{
      month: string;
      monthNum: number;
      actual: number;
      movingAverage: number | null;
      trendLine: number;
    }> = [];

    // 実績データを基準に結合
    for (let i = 0; i < data.actual.length; i++) {
      const actualPoint = data.actual[i];
      const monthPart = actualPoint.date.split('-')[1];
      if (!monthPart) {
        continue;
      }
      const monthNum = parseInt(monthPart, 10);
      const monthLabel = `${monthNum}月`;

      // 移動平均（NaNの場合はnull）
      const movingAveragePoint = data.movingAverage.data[i];
      const movingAverageValue =
        movingAveragePoint && !isNaN(movingAveragePoint.value) ? movingAveragePoint.value : null;

      // トレンドライン
      const trendLinePoint = data.trendLine.points[i];
      const trendLineValue = trendLinePoint ? trendLinePoint.value : 0;

      result.push({
        month: monthLabel,
        monthNum,
        actual: actualPoint.value,
        movingAverage: movingAverageValue,
        trendLine: trendLineValue,
      });
    }

    return result;
  }, [data]);

  // 対象タイプに応じたラベルを取得
  const targetLabel = useMemo(() => {
    switch (data.targetType) {
      case 'income':
        return '収入';
      case 'expense':
        return '支出';
      case 'balance':
        return '収支';
      default:
        return '収支';
    }
  }, [data.targetType]);

  // エラー表示
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>トレンド分析グラフ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ローディング表示
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>トレンド分析グラフ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">読み込み中...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 空データ表示
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>トレンド分析グラフ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-600">データがありません</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{targetLabel}のトレンド分析</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              {/* 実績データ用のグラデーション */}
              <linearGradient id={`colorActual-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLOR_ACTUAL} stopOpacity={0.8} />
                <stop offset="95%" stopColor={COLOR_ACTUAL} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value: number) => formatCurrency(value)} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {/* 実績データ: 太線 */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke={COLOR_ACTUAL}
              strokeWidth={3}
              name={`${targetLabel}（実績）`}
              dot={{ r: 4 }}
            />
            {/* 移動平均: 破線 */}
            <Line
              type="monotone"
              dataKey="movingAverage"
              stroke={COLOR_MOVING_AVERAGE}
              strokeWidth={2}
              strokeDasharray="5 5"
              name={`移動平均（${data.movingAverage.period}ヶ月）`}
              dot={false}
              connectNulls={false}
            />
            {/* トレンドライン: 点線 */}
            <Line
              type="monotone"
              dataKey="trendLine"
              stroke={COLOR_TREND_LINE}
              strokeWidth={2}
              strokeDasharray="3 3"
              name="トレンドライン"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
