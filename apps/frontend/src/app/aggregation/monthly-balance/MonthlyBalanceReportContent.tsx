'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { MonthlyBalanceGraph } from '@/components/dashboard/MonthlyBalanceGraph';
import { CategoryPieChartContainer } from '@/components/dashboard/CategoryPieChartContainer';
import { aggregationApi, type MonthlyBalanceResponse } from '@/lib/api/aggregation';
import { formatCurrency } from '@account-book/utils';
import { CategoryType } from '@account-book/types';
import Link from 'next/link';

/**
 * 月次レポート画面
 * FR-016: 月別収支集計
 */

// 内訳セクションで表示する最大項目数
const MAX_BREAKDOWN_ITEMS = 5;

export function MonthlyBalanceReportContent(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URLパラメータから年月を取得（デフォルトは当月）
  const now = new Date();
  const defaultYear = now.getFullYear();
  const defaultMonth = now.getMonth() + 1;

  const yearParam = searchParams.get('year');
  const monthParam = searchParams.get('month');

  const [year, setYear] = useState<number>(yearParam ? parseInt(yearParam, 10) : defaultYear);
  const [month, setMonth] = useState<number>(monthParam ? parseInt(monthParam, 10) : defaultMonth);

  const [data, setData] = useState<MonthlyBalanceResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isMonthSelectorOpen, setIsMonthSelectorOpen] = useState<boolean>(false);

  // データ取得
  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await aggregationApi.getMonthlyBalance(year, month);
      setData(response);

      // URLパラメータを更新
      const params = new URLSearchParams();
      params.set('year', year.toString());
      params.set('month', month.toString());
      router.replace(`/aggregation/monthly-balance?${params.toString()}`, { scroll: false });
    } catch (err) {
      setError('データの取得に失敗しました');
      console.error('Failed to fetch monthly balance:', err);
    } finally {
      setLoading(false);
    }
  }, [year, month, router]);

  // データ取得のトリガー
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // 前月・次月の計算
  const previousMonth = useMemo(() => {
    if (month === 1) {
      return { year: year - 1, month: 12 };
    }
    return { year, month: month - 1 };
  }, [year, month]);

  const nextMonth = useMemo(() => {
    if (month === 12) {
      return { year: year + 1, month: 1 };
    }
    return { year, month: month + 1 };
  }, [year, month]);

  // 前月・次月への移動
  const handlePreviousMonth = (): void => {
    setYear(previousMonth.year);
    setMonth(previousMonth.month);
  };

  const handleNextMonth = (): void => {
    setYear(nextMonth.year);
    setMonth(nextMonth.month);
  };

  // 月選択モーダルの開閉
  const handleMonthSelect = (selectedYear: number, selectedMonth: number): void => {
    setYear(selectedYear);
    setMonth(selectedMonth);
    setIsMonthSelectorOpen(false);
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
          <h1 className="text-3xl font-bold text-gray-900">月別収支レポート</h1>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            ダッシュボードに戻る
          </Link>
        </div>

        {/* 月選択コントロール */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePreviousMonth}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            aria-label="前月"
          >
            ←
          </button>
          <button
            onClick={() => setIsMonthSelectorOpen(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            {year}年{month}月
          </button>
          <button
            onClick={handleNextMonth}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            aria-label="次月"
          >
            →
          </button>
        </div>
      </div>

      {/* 月選択モーダル */}
      {isMonthSelectorOpen && (
        <MonthSelectorModal
          currentYear={year}
          currentMonth={month}
          onSelect={handleMonthSelect}
          onClose={() => setIsMonthSelectorOpen(false)}
        />
      )}

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard title="収入" amount={data.income.total} color="text-green-600" />
        <SummaryCard title="支出" amount={data.expense.total} color="text-red-600" />
        <SummaryCard title="収支" amount={data.balance} color="text-blue-600" />
        <SummaryCard title="貯蓄率" amount={data.savingsRate} color="text-blue-600" suffix="%" />
      </div>

      {/* 前月比・前年同月比 */}
      {(data.comparison.previousMonth || data.comparison.sameMonthLastYear) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {data.comparison.previousMonth && (
            <ComparisonCard title="前月比" comparison={data.comparison.previousMonth} />
          )}
          {data.comparison.sameMonthLastYear && (
            <ComparisonCard title="前年同月比" comparison={data.comparison.sameMonthLastYear} />
          )}
        </div>
      )}

      {/* グラフセクション */}
      <div className="mb-6">
        <MonthlyBalanceGraph data={data} />
      </div>

      {/* カテゴリ別円グラフ（支出のみ） */}
      <div className="mb-6">
        <CategoryPieChartContainer
          startDate={new Date(year, month - 1, 1)}
          endDate={new Date(year, month, 0)}
          categoryType={CategoryType.EXPENSE}
        />
      </div>

      {/* 内訳セクション */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* カテゴリ別内訳 */}
        <BreakdownSection
          title="カテゴリ別内訳"
          incomeBreakdown={data.income.byCategory}
          expenseBreakdown={data.expense.byCategory}
          type="category"
          year={year}
          month={month}
        />

        {/* 金融機関別内訳 */}
        <BreakdownSection
          title="金融機関別内訳"
          incomeBreakdown={data.income.byInstitution}
          expenseBreakdown={data.expense.byInstitution}
          type="institution"
          year={year}
          month={month}
        />
      </div>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  amount: number;
  color: string;
  suffix?: string;
}

function SummaryCard({ title, amount, color, suffix }: SummaryCardProps): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-gray-600 mb-1">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${color}`}>
          {suffix === '%' ? `${amount.toFixed(2)}${suffix}` : formatCurrency(amount)}
        </div>
      </CardContent>
    </Card>
  );
}

interface ComparisonCardProps {
  title: string;
  comparison: {
    incomeDiff: number;
    expenseDiff: number;
    balanceDiff: number;
    incomeChangeRate: number;
    expenseChangeRate: number;
  };
}

function ComparisonCard({ title, comparison }: ComparisonCardProps): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-800 text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 mb-1">収入</span>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-semibold ${
                  comparison.incomeDiff >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {comparison.incomeDiff >= 0 ? '+' : ''}
                {formatCurrency(Math.abs(comparison.incomeDiff))}
              </span>
              <span className="text-xs text-gray-500">
                ({comparison.incomeChangeRate >= 0 ? '+' : ''}
                {comparison.incomeChangeRate.toFixed(1)}%)
              </span>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 mb-1">支出</span>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-semibold ${
                  comparison.expenseDiff >= 0 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {comparison.expenseDiff >= 0 ? '+' : ''}
                {formatCurrency(Math.abs(comparison.expenseDiff))}
              </span>
              <span className="text-xs text-gray-500">
                ({comparison.expenseChangeRate >= 0 ? '+' : ''}
                {comparison.expenseChangeRate.toFixed(1)}%)
              </span>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 mb-1">収支</span>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-semibold ${
                  comparison.balanceDiff >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {comparison.balanceDiff >= 0 ? '+' : ''}
                <span>{formatCurrency(Math.abs(comparison.balanceDiff))}</span>
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface BreakdownSectionProps {
  title: string;
  incomeBreakdown: Array<{
    categoryId?: string;
    institutionId?: string;
    categoryName?: string;
    institutionName?: string;
    amount: number;
    percentage: number;
  }>;
  expenseBreakdown: Array<{
    categoryId?: string;
    institutionId?: string;
    categoryName?: string;
    institutionName?: string;
    amount: number;
    percentage: number;
  }>;
  type: 'category' | 'institution';
  year: number;
  month: number;
}

function BreakdownSection({
  title,
  incomeBreakdown,
  expenseBreakdown,
  type,
  year,
  month,
}: BreakdownSectionProps): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-800 ">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">収入</h3>
            <div className="space-y-2">
              {incomeBreakdown.slice(0, MAX_BREAKDOWN_ITEMS).map((item) => (
                <div
                  key={item.categoryId || item.institutionId}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">
                      {item.categoryName || item.institutionName}
                    </span>
                    <span className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">支出</h3>
            <div className="space-y-2">
              {expenseBreakdown.slice(0, MAX_BREAKDOWN_ITEMS).map((item) => (
                <div
                  key={item.categoryId || item.institutionId}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">
                      {item.categoryName || item.institutionName}
                    </span>
                    <span className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-red-600">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t">
            <Link
              href={`/aggregation/monthly-balance/${type}?year=${year}&month=${month}`}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              詳細を見る →
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MonthSelectorModalProps {
  currentYear: number;
  currentMonth: number;
  onSelect: (year: number, month: number) => void;
  onClose: () => void;
}

function MonthSelectorModal({
  currentYear,
  currentMonth,
  onSelect,
  onClose,
}: MonthSelectorModalProps): React.JSX.Element {
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  // 年の選択範囲（現在年から前後5年）
  const years = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const years: number[] = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  }, []);

  const handleSelect = (): void => {
    onSelect(selectedYear, selectedMonth);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">月を選択</h2>

        {/* 年選択 */}
        <div className="mb-4">
          <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 mb-2">
            年
          </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}年
              </option>
            ))}
          </select>
        </div>

        {/* 月選択 */}
        <div className="mb-6">
          <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-2">
            月
          </label>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`px-4 py-2 rounded-lg border ${
                  selectedMonth === m
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {m}月
              </button>
            ))}
          </div>
        </div>

        {/* ボタン */}
        <div className="flex gap-2">
          <button
            onClick={handleSelect}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            選択
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
