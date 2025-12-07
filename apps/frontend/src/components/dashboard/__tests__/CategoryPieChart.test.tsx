import React from 'react';
import { render, screen } from '@testing-library/react';
import { CategoryPieChart } from '../CategoryPieChart';
import type { CategoryAggregationResponseDto } from '@/lib/api/aggregation';
import { CategoryType } from '@account-book/types';

// Rechartsのモック
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children, data }: { children: React.ReactNode; data?: unknown[] }) => (
    <div data-testid="pie-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Pie: ({ children, data }: { children?: React.ReactNode; data?: unknown[] }) => (
    <div data-testid="pie" data-pie-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Cell: () => <div data-testid="cell" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe('CategoryPieChart', () => {
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
        {
          categoryId: 'cat-2',
          categoryName: '交通費',
          amount: 50000,
          count: 1,
          percentage: 25.0,
          topTransactions: [],
        },
        {
          categoryId: 'cat-3',
          categoryName: '娯楽',
          amount: 50000,
          count: 1,
          percentage: 25.0,
          topTransactions: [],
        },
      ],
      percentage: 100.0,
      trend: {
        monthly: [],
      },
    },
  ];

  it('円グラフを表示する', () => {
    render(<CategoryPieChart data={mockData} />);
    expect(screen.getByText('カテゴリ別円グラフ')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('合計金額を表示する', () => {
    render(<CategoryPieChart data={mockData} />);
    expect(screen.getByText('合計金額')).toBeInTheDocument();
    // 200000円が表示されることを確認（formatCurrencyの形式）
    expect(screen.getByText(/200,000/)).toBeInTheDocument();
  });

  it('サブカテゴリごとにセグメントを作成する', () => {
    render(<CategoryPieChart data={mockData} />);
    const pie = screen.getByTestId('pie');
    const pieData = JSON.parse(pie.getAttribute('data-pie-data') || '[]');
    expect(pieData.length).toBe(3); // 食費、交通費、娯楽の3つ
    expect(pieData.find((d: { name: string }) => d.name === '食費')).toBeDefined();
    expect(pieData.find((d: { name: string }) => d.name === '交通費')).toBeDefined();
    expect(pieData.find((d: { name: string }) => d.name === '娯楽')).toBeDefined();
  });

  it('データが空の場合、「データがありません」を表示する', () => {
    render(<CategoryPieChart data={[]} />);
    expect(screen.getByText('データがありません')).toBeInTheDocument();
    expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument();
  });

  it('すべてのtotalAmountが0の場合、「データがありません」を表示する', () => {
    const emptyData: CategoryAggregationResponseDto[] = [
      {
        categoryType: CategoryType.EXPENSE,
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        totalAmount: 0,
        transactionCount: 0,
        subcategories: [],
        percentage: 0,
        trend: {
          monthly: [],
        },
      },
    ];
    render(<CategoryPieChart data={emptyData} />);
    expect(screen.getByText('データがありません')).toBeInTheDocument();
  });

  it('エラーがある場合、エラーメッセージを表示する', () => {
    render(<CategoryPieChart data={mockData} error="データの取得に失敗しました" />);
    expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument();
    expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument();
  });

  it('ローディング中の場合、ローディングインジケーターを表示する', () => {
    render(<CategoryPieChart data={mockData} loading={true} />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument();
  });

  it('複数のカテゴリタイプがある場合、すべてのサブカテゴリを表示する', () => {
    const multiCategoryData: CategoryAggregationResponseDto[] = [
      {
        categoryType: CategoryType.INCOME,
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        totalAmount: 300000,
        transactionCount: 2,
        subcategories: [
          {
            categoryId: 'cat-4',
            categoryName: '給与',
            amount: 300000,
            count: 1,
            percentage: 100.0,
            topTransactions: [],
          },
        ],
        percentage: 60.0,
        trend: {
          monthly: [],
        },
      },
      ...mockData,
    ];

    render(<CategoryPieChart data={multiCategoryData} />);
    const pie = screen.getByTestId('pie');
    const pieData = JSON.parse(pie.getAttribute('data-pie-data') || '[]');
    // 給与、食費、交通費、娯楽の4つ
    expect(pieData.length).toBe(4);
    expect(pieData.find((d: { name: string }) => d.name === '給与')).toBeDefined();
  });

  it('サブカテゴリがない場合、カテゴリタイプ名でセグメントを作成する', () => {
    const noSubcategoryData: CategoryAggregationResponseDto[] = [
      {
        categoryType: CategoryType.TRANSFER,
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        totalAmount: 100000,
        transactionCount: 2,
        subcategories: [],
        percentage: 20.0,
        trend: {
          monthly: [],
        },
      },
    ];

    render(<CategoryPieChart data={noSubcategoryData} />);
    const pie = screen.getByTestId('pie');
    const pieData = JSON.parse(pie.getAttribute('data-pie-data') || '[]');
    expect(pieData.length).toBe(1);
    expect(pieData[0]?.name).toBe('TRANSFER');
  });

  it('金額が0のサブカテゴリはスキップする', () => {
    const dataWithZeroSubcategory: CategoryAggregationResponseDto[] = [
      {
        categoryType: CategoryType.EXPENSE,
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        totalAmount: 100000,
        transactionCount: 2,
        subcategories: [
          {
            categoryId: 'cat-1',
            categoryName: '食費',
            amount: 100000,
            count: 2,
            percentage: 100.0,
            topTransactions: [],
          },
          {
            categoryId: 'cat-2',
            categoryName: '交通費',
            amount: 0,
            count: 0,
            percentage: 0.0,
            topTransactions: [],
          },
        ],
        percentage: 100.0,
        trend: {
          monthly: [],
        },
      },
    ];

    render(<CategoryPieChart data={dataWithZeroSubcategory} />);
    const pie = screen.getByTestId('pie');
    const pieData = JSON.parse(pie.getAttribute('data-pie-data') || '[]');
    // 食費のみが表示される（交通費は金額が0なのでスキップ）
    expect(pieData.length).toBe(1);
    expect(pieData[0]?.name).toBe('食費');
  });

  it('ツールチップと凡例が表示される', () => {
    render(<CategoryPieChart data={mockData} />);
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });

  it('各セグメントにCellコンポーネントが存在する', () => {
    render(<CategoryPieChart data={mockData} />);
    const cells = screen.getAllByTestId('cell');
    // 3つのサブカテゴリに対して3つのCellが存在する
    expect(cells.length).toBe(3);
  });
});
