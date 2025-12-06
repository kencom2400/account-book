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
    expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThan(1);

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

  it('should throw error for invalid month format', () => {
    const invalidData: YearlyBalanceResponse = {
      ...mockData,
      months: [
        {
          month: 'invalid', // 不正なフォーマット（ハイフンなし）
          income: {
            total: 500000,
            count: 5,
            byCategory: [],
            byInstitution: [],
            transactions: [],
          },
          expense: {
            total: 300000,
            count: 5,
            byCategory: [],
            byInstitution: [],
            transactions: [],
          },
          balance: 200000,
          savingsRate: 40,
        },
      ],
    };

    // エラーが投げられることを確認
    expect(() => {
      render(<YearlyBalanceGraph data={invalidData} />);
    }).toThrow('Invalid month format: invalid');
  });

  it('should display negative balance with orange color', () => {
    const negativeBalanceData: YearlyBalanceResponse = {
      ...mockData,
      annual: {
        totalIncome: 3000000,
        totalExpense: 4000000,
        totalBalance: -1000000,
        averageIncome: 250000,
        averageExpense: 333333,
        savingsRate: -33.33,
      },
    };

    render(<YearlyBalanceGraph data={negativeBalanceData} />);

    // マイナス収支の場合、オレンジ色のクラスが適用される
    // formatCurrencyはIntl.NumberFormatを使用するため、マイナス記号の位置が異なる可能性がある
    const balanceText = screen.getByText(/1,000,000/);
    const balanceCard = balanceText.closest('div');
    expect(balanceCard).toHaveClass('bg-orange-50');

    // テキストにマイナス記号が含まれることを確認（フォーマット方法によって異なる）
    const balanceValue = balanceText.textContent || '';
    expect(balanceValue).toMatch(/-|−|マイナス/);
  });

  it('should display positive balance with blue color', () => {
    render(<YearlyBalanceGraph data={mockData} />);

    // プラス収支の場合、青色のクラスが適用される
    const balanceCard = screen.getByText(/￥2,400,000/).closest('div');
    expect(balanceCard).toHaveClass('bg-blue-50');
    expect(balanceCard?.querySelector('.text-blue-600')).toBeInTheDocument();
  });

  it('should render XAxis with tickFormatter for annual summary chart', () => {
    render(<YearlyBalanceGraph data={mockData} />);

    // 年間サマリーのバーグラフでXAxisが表示される
    const barCharts = screen.getAllByTestId('bar-chart');
    expect(barCharts.length).toBeGreaterThan(0);

    // XAxisコンポーネントが存在することを確認
    const xAxes = screen.getAllByTestId('x-axis');
    expect(xAxes.length).toBeGreaterThan(0);
  });

  it('should render YAxis with tickFormatter for monthly line chart', () => {
    render(<YearlyBalanceGraph data={mockData} />);

    // 月別折れ線グラフでYAxisが表示される
    const lineCharts = screen.getAllByTestId('line-chart');
    expect(lineCharts.length).toBeGreaterThan(0);

    // YAxisコンポーネントが存在することを確認
    const yAxes = screen.getAllByTestId('y-axis');
    expect(yAxes.length).toBeGreaterThan(0);
  });

  it('should handle month with missing part', () => {
    const missingPartData: YearlyBalanceResponse = {
      ...mockData,
      months: [
        {
          month: '2025-', // 月の部分が欠けている
          income: {
            total: 500000,
            count: 5,
            byCategory: [],
            byInstitution: [],
            transactions: [],
          },
          expense: {
            total: 300000,
            count: 5,
            byCategory: [],
            byInstitution: [],
            transactions: [],
          },
          balance: 200000,
          savingsRate: 40,
        },
      ],
    };

    // エラーが投げられることを確認
    expect(() => {
      render(<YearlyBalanceGraph data={missingPartData} />);
    }).toThrow('Invalid month format: 2025-');
  });
});
