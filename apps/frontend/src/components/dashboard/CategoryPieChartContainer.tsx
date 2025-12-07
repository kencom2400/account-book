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
  onCategoryTypeChange?: (categoryType?: CategoryType) => void;
}

/**
 * カテゴリ別円グラフコンテナコンポーネント
 * FR-025: カテゴリ別円グラフ表示
 */
export function CategoryPieChartContainer({
  startDate: initialStartDate,
  endDate: initialEndDate,
  categoryType: initialCategoryType,
  onCategoryTypeChange,
}: CategoryPieChartContainerProps): React.JSX.Element {
  // 現在の年月を取得
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // デフォルト期間（当月の開始日と終了日）
  const getDefaultStartDate = (): Date => {
    return new Date(currentYear, currentMonth - 1, 1);
  };

  const getDefaultEndDate = (): Date => {
    return new Date(currentYear, currentMonth, 0);
  };

  const [startDate] = useState<Date>(initialStartDate || getDefaultStartDate());
  const [endDate] = useState<Date>(initialEndDate || getDefaultEndDate());
  const [categoryType, setCategoryType] = useState<CategoryType | undefined>(initialCategoryType);
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

  // 期間変更ハンドラ（将来対応）
  // const handleDateChange = useCallback(
  //   (newStartDate: Date, newEndDate: Date) => {
  //     setStartDate(newStartDate);
  //     setEndDate(newEndDate);
  //     if (onDateChange) {
  //       onDateChange(newStartDate, newEndDate);
  //     }
  //   },
  //   [onDateChange]
  // );

  // カテゴリタイプ変更ハンドラ
  const handleCategoryTypeChange = useCallback(
    (newCategoryType?: CategoryType) => {
      setCategoryType(newCategoryType);
      if (onCategoryTypeChange) {
        onCategoryTypeChange(newCategoryType);
      }
    },
    [onCategoryTypeChange]
  );

  return (
    <CategoryPieChart
      data={data || []}
      selectedCategoryType={categoryType}
      onCategoryTypeChange={handleCategoryTypeChange}
      loading={loading}
      error={error}
    />
  );
}
