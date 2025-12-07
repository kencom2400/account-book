'use client';

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency } from '@account-book/utils';
import type { CategoryAggregationResponseDto } from '@/lib/api/aggregation';
import { CategoryType } from '@account-book/types';

interface CategoryPieChartProps {
  data: CategoryAggregationResponseDto[];
  selectedCategoryType?: CategoryType;
  onCategoryTypeChange?: (categoryType?: CategoryType) => void;
  loading?: boolean;
  error?: string | null;
}

interface PieChartData {
  name: string;
  value: number;
  percentage: number;
  color: string;
  categoryId?: string;
}

// カラーパレット
const CATEGORY_COLORS: Record<string, string> = {
  // 支出カテゴリ
  食費: '#FF6B6B',
  交通費: '#4ECDC4',
  光熱費: '#95E1D3',
  娯楽: '#F38181',
  医療: '#AA96DA',
  教育: '#FCBAD3',
  住居: '#A8D8EA',
  その他: '#FFFFD2',

  // 収入カテゴリ
  給与: '#81C784',
  賞与: '#66BB6A',
  投資: '#4CAF50',
  その他収入: '#C8E6C9',

  // カテゴリタイプ（フォールバック）
  INCOME: '#4CAF50',
  EXPENSE: '#F44336',
  TRANSFER: '#2196F3',
  REPAYMENT: '#FF9800',
  INVESTMENT: '#9C27B0',
};

// カテゴリ名から色を取得
function getColorForCategory(categoryName: string): string {
  return CATEGORY_COLORS[categoryName] || CATEGORY_COLORS['その他'] || '#CCCCCC';
}

// カテゴリタイプから色を取得
function getColorForCategoryType(categoryType: CategoryType): string {
  return CATEGORY_COLORS[categoryType] || '#CCCCCC';
}

// APIレスポンスをグラフ用データに変換
function transformToPieChartData(data: CategoryAggregationResponseDto[]): PieChartData[] {
  const result: PieChartData[] = [];

  for (const category of data) {
    if (category.totalAmount === 0) {
      continue; // 金額が0のカテゴリはスキップ
    }

    // サブカテゴリがある場合は、サブカテゴリごとにセグメントを作成
    if (category.subcategories.length > 0) {
      for (const subcategory of category.subcategories) {
        if (subcategory.amount === 0) {
          continue; // 金額が0のサブカテゴリはスキップ
        }
        result.push({
          name: subcategory.categoryName,
          value: subcategory.amount,
          percentage: subcategory.percentage,
          color: getColorForCategory(subcategory.categoryName),
          categoryId: subcategory.categoryId,
        });
      }
    } else {
      // サブカテゴリがない場合は、カテゴリタイプ名でセグメントを作成
      result.push({
        name: category.categoryType,
        value: category.totalAmount,
        percentage: category.percentage,
        color: getColorForCategoryType(category.categoryType),
      });
    }
  }

  return result;
}

// カスタムツールチップ（円グラフ用）
interface PieChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: PieChartData;
  }>;
}

function PieChartTooltip({ active, payload }: PieChartTooltipProps): React.JSX.Element | null {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0];
  const pieData = data.payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="font-semibold text-sm mb-1" style={{ color: pieData.color }}>
        {data.name}
      </p>
      <p className="text-sm text-gray-600">金額: {formatCurrency(data.value)}</p>
      <p className="text-sm text-gray-600">
        割合: {typeof pieData.percentage === 'number' ? pieData.percentage.toFixed(1) : '0.0'}%
      </p>
    </div>
  );
}

// カスタム凡例
interface CustomLegendProps {
  payload?: Array<{
    value: string;
    color: string;
    payload: PieChartData;
  }>;
}

function CustomLegend({ payload }: CustomLegendProps): React.JSX.Element | null {
  if (!payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-4 justify-center mt-4">
      {payload.map((entry) => {
        const pieData = entry.payload;
        return (
          <div key={entry.value} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: entry.color }} />
            <span className="text-sm text-gray-700">{entry.value}</span>
            <span className="text-sm text-gray-500">({pieData.percentage.toFixed(1)}%)</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * カテゴリ別円グラフコンポーネント
 * FR-025: カテゴリ別円グラフ表示
 */
export function CategoryPieChart({
  data,
  loading = false,
  error = null,
}: CategoryPieChartProps): React.JSX.Element {
  // データをグラフ用に変換
  const pieChartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }
    return transformToPieChartData(data);
  }, [data]);

  // 合計金額を計算
  const totalAmount = useMemo(() => {
    return pieChartData.reduce((sum, item) => sum + item.value, 0);
  }, [pieChartData]);

  // エラー表示
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>カテゴリ別円グラフ</CardTitle>
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
          <CardTitle>カテゴリ別円グラフ</CardTitle>
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
  if (pieChartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>カテゴリ別円グラフ</CardTitle>
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
        <CardTitle>カテゴリ別円グラフ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 合計金額表示 */}
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
            <p className="text-sm text-gray-600 mt-1">合計金額</p>
          </div>

          {/* 円グラフ */}
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }: { name: string; percentage: number }) =>
                  `${name} ${typeof percentage === 'number' ? percentage.toFixed(1) : '0.0'}%`
                }
                outerRadius={120}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<PieChartTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
