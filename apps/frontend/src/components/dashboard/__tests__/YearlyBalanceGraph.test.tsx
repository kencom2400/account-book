import React from 'react';
import { render, screen } from '@testing-library/react';
import { YearlyBalanceGraph } from '../YearlyBalanceGraph';
import type { YearlyBalanceResponse } from '@/lib/api/aggregation';

// Rechartsのモック
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children, data }: { children: React.ReactNode; data?: unknown[] }) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  BarChart: ({ children, data }: { children: React.ReactNode; data?: unknown[] }) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  ComposedChart: ({ children, data }: { children: React.ReactNode; data?: unknown[] }) => (
    <div data-testid="composed-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe('YearlyBalanceGraph', () => {
  const mockData: YearlyBalanceResponse = {
    year: 2025,
    months: [
      {
        month: '2025-01',
        income: {
          total: 300000,
          count: 1,
          byCategory: [],
          byInstitution: [],
          transactions: [],
        },
        expense: {
          total: 200000,
          count: 5,
          byCategory: [],
          byInstitution: [],
          transactions: [],
        },
        balance: 100000,
        savingsRate: 33.33,
      },
      {
        month: '2025-02',
        income: {
          total: 300000,
          count: 1,
          byCategory: [],
          byInstitution: [],
          transactions: [],
        },
        expense: {
          total: 180000,
          count: 4,
          byCategory: [],
          byInstitution: [],
          transactions: [],
        },
        balance: 120000,
        savingsRate: 40.0,
      },
      {
        month: '2025-03',
        income: {
          total: 300000,
          count: 1,
          byCategory: [],
          byInstitution: [],
          transactions: [],
        },
        expense: {
          total: 250000,
          count: 6,
          byCategory: [],
          byInstitution: [],
          transactions: [],
        },
        balance: 50000,
        savingsRate: 16.67,
      },
    ],
    annual: {
      totalIncome: 900000,
      totalExpense: 630000,
      totalBalance: 270000,
      averageIncome: 300000,
      averageExpense: 210000,
      savingsRate: 30.0,
    },
    trend: {
      incomeProgression: {
        direction: 'stable',
        changeRate: 0.0,
        standardDeviation: 0,
      },
      expenseProgression: {
        direction: 'decreasing',
        changeRate: -1.5,
        standardDeviation: 15000,
      },
      balanceProgression: {
        direction: 'increasing',
        changeRate: 2.0,
        standardDeviation: 10000,
      },
    },
    highlights: {
      maxIncomeMonth: '2025-01',
      maxExpenseMonth: '2025-03',
      bestBalanceMonth: '2025-02',
      worstBalanceMonth: '2025-03',
    },
  };

  it('月別推移（折れ線グラフ）を表示する', () => {
    render(<YearlyBalanceGraph data={mockData} />);
    expect(screen.getByText('月別推移（折れ線グラフ）')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('月別比較（棒グラフ）を表示する', () => {
    render(<YearlyBalanceGraph data={mockData} />);
    expect(screen.getByText('月別比較（棒グラフ）')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('収支差額（エリアグラフ）を表示する', () => {
    render(<YearlyBalanceGraph data={mockData} />);
    expect(screen.getByText('収支差額（エリアグラフ）')).toBeInTheDocument();
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
  });

  it('月別データが正しく変換される', () => {
    render(<YearlyBalanceGraph data={mockData} />);
    const lineChart = screen.getByTestId('line-chart');
    const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]');

    expect(chartData.length).toBe(3);
    expect(chartData[0]).toHaveProperty('month', '1月');
    expect(chartData[0]).toHaveProperty('income', 300000);
    expect(chartData[0]).toHaveProperty('expense', 200000);
    expect(chartData[0]).toHaveProperty('balance', 100000);
  });

  it('データが空の場合でもエラーなく表示する', () => {
    const emptyData: YearlyBalanceResponse = {
      year: 2025,
      months: [],
      annual: {
        totalIncome: 0,
        totalExpense: 0,
        totalBalance: 0,
        averageIncome: 0,
        averageExpense: 0,
        savingsRate: 0,
      },
      trend: {
        incomeProgression: {
          direction: 'stable',
          changeRate: 0,
          standardDeviation: 0,
        },
        expenseProgression: {
          direction: 'stable',
          changeRate: 0,
          standardDeviation: 0,
        },
        balanceProgression: {
          direction: 'stable',
          changeRate: 0,
          standardDeviation: 0,
        },
      },
      highlights: {
        maxIncomeMonth: null,
        maxExpenseMonth: null,
        bestBalanceMonth: null,
        worstBalanceMonth: null,
      },
    };

    render(<YearlyBalanceGraph data={emptyData} />);
    expect(screen.getByText('月別推移（折れ線グラフ）')).toBeInTheDocument();
    expect(screen.getByText('月別比較（棒グラフ）')).toBeInTheDocument();
    expect(screen.getByText('収支差額（エリアグラフ）')).toBeInTheDocument();
  });

  it('12ヶ月分のデータを正しく処理する', () => {
    const fullYearData: YearlyBalanceResponse = {
      ...mockData,
      months: Array.from({ length: 12 }, (_, i) => ({
        month: `2025-${String(i + 1).padStart(2, '0')}`,
        income: {
          total: 300000,
          count: 1,
          byCategory: [],
          byInstitution: [],
          transactions: [],
        },
        expense: {
          total: 200000,
          count: 5,
          byCategory: [],
          byInstitution: [],
          transactions: [],
        },
        balance: 100000,
        savingsRate: 33.33,
      })),
    };

    render(<YearlyBalanceGraph data={fullYearData} />);
    const lineChart = screen.getByTestId('line-chart');
    const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]');

    expect(chartData.length).toBe(12);
    expect(chartData[0]).toHaveProperty('month', '1月');
    expect(chartData[11]).toHaveProperty('month', '12月');
  });

  it('収支差額エリアグラフでプラスとマイナスが正しく分離される', () => {
    const mixedBalanceData: YearlyBalanceResponse = {
      ...mockData,
      months: [
        {
          month: '2025-01',
          income: {
            total: 300000,
            count: 1,
            byCategory: [],
            byInstitution: [],
            transactions: [],
          },
          expense: {
            total: 200000,
            count: 5,
            byCategory: [],
            byInstitution: [],
            transactions: [],
          },
          balance: 100000, // プラス
          savingsRate: 33.33,
        },
        {
          month: '2025-02',
          income: {
            total: 200000,
            count: 1,
            byCategory: [],
            byInstitution: [],
            transactions: [],
          },
          expense: {
            total: 250000,
            count: 6,
            byCategory: [],
            byInstitution: [],
            transactions: [],
          },
          balance: -50000, // マイナス
          savingsRate: -25.0,
        },
      ],
    };

    render(<YearlyBalanceGraph data={mixedBalanceData} />);
    const composedChart = screen.getByTestId('composed-chart');
    const chartData = JSON.parse(composedChart.getAttribute('data-chart-data') || '[]');

    expect(chartData[0]).toHaveProperty('positiveBalance', 100000);
    expect(chartData[0]).toHaveProperty('negativeBalance', 0);
    expect(chartData[1]).toHaveProperty('positiveBalance', 0);
    expect(chartData[1]).toHaveProperty('negativeBalance', -50000);
  });

  it('ツールチップコンポーネントが存在する', () => {
    render(<YearlyBalanceGraph data={mockData} />);
    const tooltips = screen.getAllByTestId('tooltip');
    // 3つのグラフすべてにツールチップがあることを確認
    expect(tooltips.length).toBe(3);
  });
});
