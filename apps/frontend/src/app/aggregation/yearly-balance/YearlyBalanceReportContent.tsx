'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { YearlyBalanceGraph } from '@/components/dashboard/YearlyBalanceGraph';
import { aggregationApi, type YearlyBalanceResponse } from '@/lib/api/aggregation';
import { formatCurrency } from '@account-book/utils';
import Link from 'next/link';

/**
 * 年次レポート画面
 * FR-020: 年間収支推移表示
 */

export function YearlyBalanceReportContent(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URLパラメータから年を取得（デフォルトは今年）
  const now = new Date();
  const defaultYear = now.getFullYear();

  const yearParam = searchParams.get('year');

  const [year, setYear] = useState<number>(yearParam ? parseInt(yearParam, 10) : defaultYear);

  const [data, setData] = useState<YearlyBalanceResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isYearSelectorOpen, setIsYearSelectorOpen] = useState<boolean>(false);

  // URLパラメータの変更を検知してyearステートを同期
  useEffect(() => {
    const yearFromParams = yearParam ? parseInt(yearParam, 10) : defaultYear;
    if (yearFromParams !== year) {
      setYear(yearFromParams);
    }
  }, [yearParam, defaultYear, year]);

  // データ取得
  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await aggregationApi.getYearlyBalance(year);
      setData(response);

      // URLパラメータを更新
      const params = new URLSearchParams();
      params.set('year', year.toString());
      router.replace(`/aggregation/yearly-balance?${params.toString()}`, { scroll: false });
    } catch (err) {
      setError('データの取得に失敗しました');
      console.error('Failed to fetch yearly balance:', err);
    } finally {
      setLoading(false);
    }
  }, [year, router]);

  // データ取得のトリガー
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // 前年・次年への移動
  const handlePreviousYear = (): void => {
    setYear(year - 1);
  };

  const handleNextYear = (): void => {
    setYear(year + 1);
  };

  // 年選択モーダルの開閉
  const handleYearSelect = (selectedYear: number): void => {
    setYear(selectedYear);
    setIsYearSelectorOpen(false);
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
          <h1 className="text-3xl font-bold text-gray-900">年次収支レポート</h1>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            ダッシュボードに戻る
          </Link>
        </div>

        {/* 年選択コントロール */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePreviousYear}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            aria-label="前年"
          >
            ←
          </button>
          <button
            onClick={() => setIsYearSelectorOpen(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            {year}年
          </button>
          <button
            onClick={handleNextYear}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            aria-label="次年"
          >
            →
          </button>
        </div>
      </div>

      {/* 年選択モーダル */}
      {isYearSelectorOpen && (
        <YearSelectorModal
          currentYear={year}
          onSelect={handleYearSelect}
          onClose={() => setIsYearSelectorOpen(false)}
        />
      )}

      {/* 年間サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SummaryCard title="年間収入合計" amount={data.annual.totalIncome} color="text-green-600" />
        <SummaryCard title="年間支出合計" amount={data.annual.totalExpense} color="text-red-600" />
        <SummaryCard
          title="年間収支"
          amount={data.annual.totalBalance}
          color={data.annual.totalBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}
        />
      </div>

      {/* 平均・貯蓄率カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SummaryCard title="月平均収入" amount={data.annual.averageIncome} color="text-green-600" />
        <SummaryCard title="月平均支出" amount={data.annual.averageExpense} color="text-red-600" />
        <SummaryCard
          title="年間貯蓄率"
          amount={data.annual.savingsRate}
          color="text-blue-600"
          suffix="%"
        />
      </div>

      {/* トレンド分析セクション */}
      <div className="mb-6">
        <TrendAnalysisSection trend={data.trend} />
      </div>

      {/* ハイライト情報セクション */}
      <div className="mb-6">
        <HighlightsSection highlights={data.highlights} />
      </div>

      {/* グラフセクション */}
      <div className="mb-6">
        <YearlyBalanceGraph data={data} />
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

interface TrendAnalysisSectionProps {
  trend: {
    incomeProgression: {
      direction: 'increasing' | 'decreasing' | 'stable';
      changeRate: number;
      standardDeviation: number;
    };
    expenseProgression: {
      direction: 'increasing' | 'decreasing' | 'stable';
      changeRate: number;
      standardDeviation: number;
    };
    balanceProgression: {
      direction: 'increasing' | 'decreasing' | 'stable';
      changeRate: number;
      standardDeviation: number;
    };
  };
}

// トレンド方向の情報を定義
const directionInfo = {
  increasing: { label: '増加傾向', color: 'text-green-600', icon: '↑' },
  decreasing: { label: '減少傾向', color: 'text-red-600', icon: '↓' },
  stable: { label: '横ばい', color: 'text-gray-600', icon: '→' },
} as const;

interface TrendItemProps {
  title: string;
  trendData: {
    direction: 'increasing' | 'decreasing' | 'stable';
    changeRate: number;
    standardDeviation: number;
  };
}

function TrendItem({ title, trendData }: TrendItemProps): React.JSX.Element {
  const info = directionInfo[trendData.direction] || {
    label: '不明',
    color: 'text-gray-600',
    icon: '?',
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${info.color}`}>{info.icon}</span>
          <span className={`text-sm font-semibold ${info.color}`}>{info.label}</span>
        </div>
        <div className="text-xs text-gray-500">
          変化率: {trendData.changeRate >= 0 ? '+' : ''}
          {trendData.changeRate.toFixed(2)}% / 月
        </div>
        <div className="text-xs text-gray-500">
          標準偏差: {formatCurrency(Math.abs(trendData.standardDeviation))}
        </div>
      </div>
    </div>
  );
}

function TrendAnalysisSection({ trend }: TrendAnalysisSectionProps): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-800">トレンド分析</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TrendItem title="収入" trendData={trend.incomeProgression} />
          <TrendItem title="支出" trendData={trend.expenseProgression} />
          <TrendItem title="収支" trendData={trend.balanceProgression} />
        </div>
      </CardContent>
    </Card>
  );
}

interface HighlightsSectionProps {
  highlights: {
    maxIncomeMonth: string | null;
    maxExpenseMonth: string | null;
    bestBalanceMonth: string | null;
    worstBalanceMonth: string | null;
  };
}

interface HighlightItemProps {
  title: string;
  month: string | null;
  color: string;
}

function HighlightItem({ title, month, color }: HighlightItemProps): React.JSX.Element {
  const formatMonth = (monthString: string | null): string => {
    if (!monthString) {
      return 'データなし';
    }
    const [, m] = monthString.split('-');
    const monthNum = parseInt(m, 10);
    return `${monthNum}月`;
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
      <div className={`text-lg font-bold ${color}`}>{formatMonth(month)}</div>
    </div>
  );
}

function HighlightsSection({ highlights }: HighlightsSectionProps): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-800">ハイライト情報</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <HighlightItem
            title="最大収入月"
            month={highlights.maxIncomeMonth}
            color="text-green-600"
          />
          <HighlightItem
            title="最大支出月"
            month={highlights.maxExpenseMonth}
            color="text-red-600"
          />
          <HighlightItem
            title="最高収支月"
            month={highlights.bestBalanceMonth}
            color="text-blue-600"
          />
          <HighlightItem
            title="最低収支月"
            month={highlights.worstBalanceMonth}
            color="text-orange-600"
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface YearSelectorModalProps {
  currentYear: number;
  onSelect: (year: number) => void;
  onClose: () => void;
}

function YearSelectorModal({
  currentYear,
  onSelect,
  onClose,
}: YearSelectorModalProps): React.JSX.Element {
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // 年の選択範囲（現在年から前後10年、選択中の年も含める）
  const years = useMemo(() => {
    const now = new Date();
    const realCurrentYear = now.getFullYear();
    const yearList: number[] = [];
    for (let i = realCurrentYear - 10; i <= realCurrentYear + 10; i++) {
      yearList.push(i);
    }

    // 選択中の年がリストに含まれていない場合は追加
    if (!yearList.includes(currentYear)) {
      yearList.push(currentYear);
      yearList.sort((a, b) => a - b);
    }

    return yearList;
  }, [currentYear]);

  const handleSelect = (): void => {
    onSelect(selectedYear);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">年を選択</h2>

        {/* 年選択 */}
        <div className="mb-6">
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
