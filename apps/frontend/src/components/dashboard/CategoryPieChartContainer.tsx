'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CategoryPieChart } from './CategoryPieChart';
import { aggregationApi, type CategoryAggregationResponseDto } from '@/lib/api/aggregation';
import { CategoryType } from '@account-book/types';

interface CategoryPieChartContainerProps {
  startDate?: Date;
  endDate?: Date;
  categoryType?: CategoryType;
  onDateChange?: (startDate: Date, endDate: Date) => void;
}

// 現在の年月を取得（コンポーネント外で定義）
const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

const getCurrentMonth = (): number => {
  return new Date().getMonth() + 1;
};

// デフォルト期間（当月の開始日と終了日）
const getDefaultStartDate = (): Date => {
  const currentYear = getCurrentYear();
  const currentMonth = getCurrentMonth();
  return new Date(currentYear, currentMonth - 1, 1);
};

const getDefaultEndDate = (): Date => {
  const currentYear = getCurrentYear();
  const currentMonth = getCurrentMonth();
  return new Date(currentYear, currentMonth, 0);
};

/**
 * カテゴリ別円グラフコンテナコンポーネント
 * FR-025: カテゴリ別円グラフ表示
 */
export function CategoryPieChartContainer({
  startDate: initialStartDate,
  endDate: initialEndDate,
  categoryType: initialCategoryType,
}: CategoryPieChartContainerProps): React.JSX.Element {
  const [startDate] = useState<Date>(initialStartDate || getDefaultStartDate());
  const [endDate] = useState<Date>(initialEndDate || getDefaultEndDate());
  const [categoryType] = useState<CategoryType | undefined>(initialCategoryType);
  const [data, setData] = useState<CategoryAggregationResponseDto[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // データ取得
  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // バリデーション
      if (startDate > endDate) {
        setError('開始日は終了日より前である必要があります');
        setLoading(false);
        return;
      }

      // API呼び出し
      const response = await aggregationApi.getCategoryAggregation(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        categoryType
      );

      setData(response);
    } catch (err) {
      setError('データの取得に失敗しました');
      console.error('Failed to fetch category aggregation:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, categoryType]);

  // データ取得のトリガー
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return <CategoryPieChart data={data || []} loading={loading} error={error} />;
}
