import React from 'react';
import { render, screen } from '@testing-library/react';
import { YearlyBalanceGraph } from '../YearlyBalanceGraph';
import type { YearlyBalanceResponse } from '@/lib/api/aggregation';

// Rechartsのモック（Tooltipにcontentプロパティを渡せるようにする）
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children, data }: { children: React.ReactNode; data?: unknown[] }) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  LineChart: ({ children, data }: { children: React.ReactNode; data?: unknown[] }) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  AreaChart: ({ children, data }: { children: React.ReactNode; data?: unknown[] }) => (
    <div data-testid="area-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  ComposedChart: ({ children, data }: { children: React.ReactNode; data?: unknown[] }) => (
    <div data-testid="composed-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Bar: ({ children }: { children?: React.ReactNode }) => <div data-testid="bar">{children}</div>,
  Line: () => <div data-testid="line" />,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Cell: () => <div data-testid="cell" />,
}));

describe('YearlyBalanceGraph', () => {
  const mockData: YearlyBalanceResponse = {
    year: 2025,
    months: [
      {
        month: '2025-01',
        income: {
          total: 500000,
          count: 5,
          byCategory: [],
          byInstitution: [],
          transactions: [],
        },
        expense: {
          total: 300000,
          count: 10,
          byCategory: [],
          byInstitution: [],
          transactions: [],
        },
        balance: 200000,
        savingsRate: 40,
      },
      {
        month: '2025-02',
        income: {
          total: 500000,
          count: 5,
          byCategory: [],
          byInstitution: [],
          transactions: [],
        },
        expense: {
          total: 250000,
          count: 8,
          byCategory: [],
          byInstitution: [],
          transactions: [],
        },
        balance: 250000,
        savingsRate: 50,
      },
    ],
    annual: {
      totalIncome: 6000000,
      totalExpense: 3600000,
      totalBalance: 2400000,
      averageIncome: 500000,
      averageExpense: 300000,
      savingsRate: 40,
    },
    trend: {
      incomeProgression: {
        direction: 'increasing',
        changeRate: 2.5,
        standardDeviation: 15000,
      },
      expenseProgression: {
        direction: 'stable',
        changeRate: 0.5,
        standardDeviation: 20000,
      },
      balanceProgression: {
        direction: 'increasing',
        changeRate: 3.0,
        standardDeviation: 25000,
      },
    },
    highlights: {
      maxIncomeMonth: '2025-12',
      maxExpenseMonth: '2025-01',
      bestBalanceMonth: '2025-02',
      worstBalanceMonth: '2025-01',
    },
  };

  it('should render yearly balance graph with all sections', () => {
    render(<YearlyBalanceGraph data={mockData} />);

    // 年間サマリーセクション
    expect(screen.getByText('年間サマリー')).toBeInTheDocument();
    expect(screen.getByText('年間収入')).toBeInTheDocument();
    expect(screen.getByText('年間支出')).toBeInTheDocument();
    expect(screen.getByText('年間収支')).toBeInTheDocument();

    // 月別推移グラフ
    expect(screen.getByText('月別推移（折れ線グラフ）')).toBeInTheDocument();

    // 月別積み上げ棒グラフ
    expect(screen.getByText('月別収支（積み上げ棒グラフ）')).toBeInTheDocument();

    // 収支差額エリアグラフ
    expect(screen.getByText('収支差額推移')).toBeInTheDocument();
  });

  it('should display annual summary values', () => {
    render(<YearlyBalanceGraph data={mockData} />);

    // 年間収入の表示を確認（全角￥を使用）
    expect(screen.getByText(/￥6,000,000/)).toBeInTheDocument();
    expect(screen.getByText(/平均: ￥500,000\/月/)).toBeInTheDocument();

    // 年間支出の表示を確認
    expect(screen.getByText(/￥3,600,000/)).toBeInTheDocument();
    expect(screen.getByText(/平均: ￥300,000\/月/)).toBeInTheDocument();

    // 年間収支の表示を確認
    expect(screen.getByText(/￥2,400,000/)).toBeInTheDocument();
    expect(screen.getByText(/貯蓄率: 40\.0%/)).toBeInTheDocument();
  });

  it('should render all chart types', () => {
    render(<YearlyBalanceGraph data={mockData} />);

    // バーグラフ（年間サマリー）
    expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThan(0);

    // 折れ線グラフ（月別推移）
    expect(screen.getAllByTestId('line-chart').length).toBeGreaterThan(0);

    // 積み上げ棒グラフ（月別収支）
    expect(screen.getAllByTestId('composed-chart').length).toBeGreaterThan(0);

    // エリアグラフ（収支差額）
    expect(screen.getAllByTestId('area-chart').length).toBeGreaterThan(0);
  });

  it('should format currency correctly', () => {
    render(<YearlyBalanceGraph data={mockData} />);

    // 通貨フォーマットの確認（カンマ区切り、全角￥を使用）
    const incomeText = screen.getByText(/￥6,000,000/);
    expect(incomeText).toBeInTheDocument();
  });

  it('should handle empty months array', () => {
    const emptyData: YearlyBalanceResponse = {
      ...mockData,
      months: [],
    };

    render(<YearlyBalanceGraph data={emptyData} />);

    // グラフは表示されるが、データが空
    expect(screen.getByText('年間サマリー')).toBeInTheDocument();
  });
});
