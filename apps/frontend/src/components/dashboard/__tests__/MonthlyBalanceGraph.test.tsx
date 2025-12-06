import React from 'react';
import { render, screen } from '@testing-library/react';
import { MonthlyBalanceGraph } from '../MonthlyBalanceGraph';
import type { MonthlyBalanceResponse } from '@/lib/api/aggregation';

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

describe('MonthlyBalanceGraph', () => {
  const mockData: MonthlyBalanceResponse = {
    month: '2025-01',
    income: {
      total: 500000,
      count: 5,
      byCategory: [],
      byInstitution: [],
      transactions: [
        {
          id: 'tx-1',
          date: '2025-01-05T00:00:00.000Z',
          amount: 300000,
          categoryType: 'INCOME',
          categoryId: 'cat-1',
          institutionId: 'inst-1',
          accountId: 'acc-1',
          description: '給与',
        },
        {
          id: 'tx-2',
          date: '2025-01-15T00:00:00.000Z',
          amount: 200000,
          categoryType: 'INCOME',
          categoryId: 'cat-2',
          institutionId: 'inst-2',
          accountId: 'acc-2',
          description: 'ボーナス',
        },
      ],
    },
    expense: {
      total: 300000,
      count: 10,
      byCategory: [],
      byInstitution: [],
      transactions: [
        {
          id: 'tx-3',
          date: '2025-01-10T00:00:00.000Z',
          amount: 100000,
          categoryType: 'EXPENSE',
          categoryId: 'cat-3',
          institutionId: 'inst-3',
          accountId: 'acc-3',
          description: '食費',
        },
        {
          id: 'tx-4',
          date: '2025-01-20T00:00:00.000Z',
          amount: 200000,
          categoryType: 'EXPENSE',
          categoryId: 'cat-4',
          institutionId: 'inst-4',
          accountId: 'acc-4',
          description: '光熱費',
        },
      ],
    },
    balance: 200000,
    savingsRate: 40,
    comparison: {
      previousMonth: null,
      sameMonthLastYear: null,
    },
  };

  it('月間サマリーバーグラフを表示する', () => {
    render(<MonthlyBalanceGraph data={mockData} />);
    expect(screen.getByText('月間サマリー')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('日別推移グラフを表示する', () => {
    render(<MonthlyBalanceGraph data={mockData} />);
    expect(screen.getByText('日別推移')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('累積グラフを表示する', () => {
    render(<MonthlyBalanceGraph data={mockData} />);
    expect(screen.getByText('累積推移')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('データが空の場合でもエラーなく表示する', () => {
    const emptyData: MonthlyBalanceResponse = {
      month: '2025-01',
      income: {
        total: 0,
        count: 0,
        byCategory: [],
        byInstitution: [],
        transactions: [],
      },
      expense: {
        total: 0,
        count: 0,
        byCategory: [],
        byInstitution: [],
        transactions: [],
      },
      balance: 0,
      savingsRate: 0,
      comparison: {
        previousMonth: null,
        sameMonthLastYear: null,
      },
    };

    render(<MonthlyBalanceGraph data={emptyData} />);
    expect(screen.getByText('月間サマリー')).toBeInTheDocument();
    expect(screen.getByText('日別推移')).toBeInTheDocument();
    expect(screen.getByText('累積推移')).toBeInTheDocument();
  });

  it('収支が負の値の場合、収支の色がオレンジになる', () => {
    const negativeBalanceData: MonthlyBalanceResponse = {
      ...mockData,
      balance: -50000,
    };

    render(<MonthlyBalanceGraph data={negativeBalanceData} />);
    const barChart = screen.getByTestId('bar-chart');
    const chartData = JSON.parse(barChart.getAttribute('data-chart-data') || '[]');
    const balanceEntry = chartData.find((entry: { name: string }) => entry.name === '収支');
    expect(balanceEntry?.color).toBe('#FF9800');
  });

  it('収支が正の値の場合、収支の色が青になる', () => {
    render(<MonthlyBalanceGraph data={mockData} />);
    const barChart = screen.getByTestId('bar-chart');
    const chartData = JSON.parse(barChart.getAttribute('data-chart-data') || '[]');
    const balanceEntry = chartData.find((entry: { name: string }) => entry.name === '収支');
    expect(balanceEntry?.color).toBe('#2196F3');
  });

  it('同じ日に複数の取引がある場合、正しく集計される', () => {
    const sameDayData: MonthlyBalanceResponse = {
      ...mockData,
      income: {
        ...mockData.income,
        transactions: [
          {
            id: 'tx-1',
            date: '2025-01-05T00:00:00.000Z',
            amount: 100000,
            categoryType: 'INCOME',
            categoryId: 'cat-1',
            institutionId: 'inst-1',
            accountId: 'acc-1',
            description: '給与1',
          },
          {
            id: 'tx-2',
            date: '2025-01-05T12:00:00.000Z',
            amount: 200000,
            categoryType: 'INCOME',
            categoryId: 'cat-2',
            institutionId: 'inst-2',
            accountId: 'acc-2',
            description: '給与2',
          },
        ],
      },
    };

    render(<MonthlyBalanceGraph data={sameDayData} />);
    const lineChart = screen.getByTestId('line-chart');
    const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]');
    const day5Data = chartData.find((entry: { date: number }) => entry.date === 5);
    expect(day5Data?.income).toBe(300000); // 100000 + 200000
  });

  it('累積データが正しく計算される', () => {
    render(<MonthlyBalanceGraph data={mockData} />);
    const areaChart = screen.getByTestId('area-chart');
    const chartData = JSON.parse(areaChart.getAttribute('data-chart-data') || '[]');

    // 累積データが存在することを確認
    expect(chartData.length).toBeGreaterThan(0);
    expect(chartData[0]).toHaveProperty('cumulativeIncome');
    expect(chartData[0]).toHaveProperty('cumulativeExpense');
    expect(chartData[0]).toHaveProperty('cumulativeBalance');

    // 累積値が増加していることを確認
    if (chartData.length > 1) {
      expect(chartData[chartData.length - 1].cumulativeIncome).toBeGreaterThanOrEqual(
        chartData[0].cumulativeIncome
      );
    }
  });

  it('ツールチップコンポーネントが存在する', () => {
    render(<MonthlyBalanceGraph data={mockData} />);
    const tooltips = screen.getAllByTestId('tooltip');
    // 3つのグラフすべてにツールチップがあることを確認
    expect(tooltips.length).toBe(3);
  });

  it('2月（うるう年）のデータを正しく処理する', () => {
    const februaryData: MonthlyBalanceResponse = {
      ...mockData,
      month: '2024-02', // 2024年はうるう年
      income: {
        ...mockData.income,
        transactions: [
          {
            id: 'tx-1',
            date: '2024-02-29T00:00:00.000Z',
            amount: 100000,
            categoryType: 'INCOME',
            categoryId: 'cat-1',
            institutionId: 'inst-1',
            accountId: 'acc-1',
            description: '給与',
          },
        ],
      },
    };

    render(<MonthlyBalanceGraph data={februaryData} />);
    const lineChart = screen.getByTestId('line-chart');
    const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]');

    // 2月は29日まで（うるう年）
    expect(chartData.length).toBe(29);
    const day29Data = chartData.find((entry: { date: number }) => entry.date === 29);
    expect(day29Data?.income).toBe(100000);
  });

  it('2月（平年）のデータを正しく処理する', () => {
    const februaryData: MonthlyBalanceResponse = {
      ...mockData,
      month: '2025-02', // 2025年は平年
      income: {
        ...mockData.income,
        transactions: [],
      },
    };

    render(<MonthlyBalanceGraph data={februaryData} />);
    const lineChart = screen.getByTestId('line-chart');
    const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]');

    // 2月は28日まで（平年）
    expect(chartData.length).toBe(28);
  });
});
