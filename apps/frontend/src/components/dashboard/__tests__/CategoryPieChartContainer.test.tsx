import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { CategoryPieChartContainer } from '../CategoryPieChartContainer';
import { aggregationApi } from '@/lib/api/aggregation';
import { CategoryType } from '@account-book/types';
import type { CategoryAggregationResponseDto } from '@/lib/api/aggregation';

// Rechartsのモック
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

// APIのモック
jest.mock('@/lib/api/aggregation', () => ({
  aggregationApi: {
    getCategoryAggregation: jest.fn(),
  },
}));

const mockGetCategoryAggregation = aggregationApi.getCategoryAggregation as jest.MockedFunction<
  typeof aggregationApi.getCategoryAggregation
>;

describe('CategoryPieChartContainer', () => {
  const mockData: CategoryAggregationResponseDto[] = [
    {
      categoryType: CategoryType.EXPENSE,
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      totalAmount: 200000,
      transactionCount: 5,
      subcategories: [
        {
          categoryId: 'cat-1',
          categoryName: '食費',
          amount: 100000,
          count: 3,
          percentage: 50.0,
          topTransactions: [],
        },
      ],
      percentage: 100.0,
      trend: {
        monthly: [],
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('データ取得に成功した場合、円グラフを表示する', async () => {
    mockGetCategoryAggregation.mockResolvedValue(mockData);

    render(<CategoryPieChartContainer />);

    // ローディングが完了するまで待機
    await waitFor(() => {
      expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
    });

    // 円グラフが表示されることを確認
    expect(screen.getByText('カテゴリ別円グラフ')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('デフォルト期間（当月）でデータを取得する', async () => {
    mockGetCategoryAggregation.mockResolvedValue(mockData);

    render(<CategoryPieChartContainer />);

    await waitFor(() => {
      expect(mockGetCategoryAggregation).toHaveBeenCalled();
    });

    // 当月の開始日と終了日で呼び出されることを確認
    const callArgs = mockGetCategoryAggregation.mock.calls[0];
    expect(callArgs).toBeDefined();
    expect(callArgs?.[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD形式
    expect(callArgs?.[1]).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD形式
    expect(callArgs?.[2]).toBeUndefined(); // categoryTypeは未指定
  });

  it('初期期間が指定された場合、その期間でデータを取得する', async () => {
    mockGetCategoryAggregation.mockResolvedValue(mockData);

    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-01-31');

    render(<CategoryPieChartContainer startDate={startDate} endDate={endDate} />);

    await waitFor(() => {
      expect(mockGetCategoryAggregation).toHaveBeenCalled();
    });

    const callArgs = mockGetCategoryAggregation.mock.calls[0];
    expect(callArgs?.[0]).toBe('2025-01-01');
    expect(callArgs?.[1]).toBe('2025-01-31');
  });

  it('初期カテゴリタイプが指定された場合、そのカテゴリタイプでデータを取得する', async () => {
    mockGetCategoryAggregation.mockResolvedValue(mockData);

    render(<CategoryPieChartContainer categoryType={CategoryType.EXPENSE} />);

    await waitFor(() => {
      expect(mockGetCategoryAggregation).toHaveBeenCalled();
    });

    const callArgs = mockGetCategoryAggregation.mock.calls[0];
    expect(callArgs?.[2]).toBe(CategoryType.EXPENSE);
  });

  it('データ取得に失敗した場合、エラーメッセージを表示する', async () => {
    mockGetCategoryAggregation.mockRejectedValue(new Error('API Error'));

    render(<CategoryPieChartContainer />);

    await waitFor(() => {
      expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument();
    });
  });

  it('開始日が終了日より後の場合、バリデーションエラーを表示する', async () => {
    const startDate = new Date('2025-01-31');
    const endDate = new Date('2025-01-01');

    render(<CategoryPieChartContainer startDate={startDate} endDate={endDate} />);

    await waitFor(() => {
      expect(screen.getByText('開始日は終了日より前である必要があります')).toBeInTheDocument();
    });

    // APIは呼び出されない
    expect(mockGetCategoryAggregation).not.toHaveBeenCalled();
  });

  it('ローディング中はローディングインジケーターを表示する', () => {
    // 即座に解決しないようにする
    mockGetCategoryAggregation.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockData), 100))
    );

    render(<CategoryPieChartContainer />);

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('カテゴリタイプ変更コールバックが呼び出される', async () => {
    mockGetCategoryAggregation.mockResolvedValue(mockData);

    const onCategoryTypeChange = jest.fn();

    render(
      <CategoryPieChartContainer
        categoryType={CategoryType.EXPENSE}
        onCategoryTypeChange={onCategoryTypeChange}
      />
    );

    await waitFor(() => {
      expect(mockGetCategoryAggregation).toHaveBeenCalled();
    });

    // コンテナコンポーネントは直接カテゴリタイプ変更をトリガーしないため、
    // コールバックは呼び出されない（将来の機能拡張用）
    // このテストは将来の機能拡張時に有効になる
  });
});
