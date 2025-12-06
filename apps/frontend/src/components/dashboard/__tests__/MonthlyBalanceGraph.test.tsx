import React from 'react';
import { render, screen } from '@testing-library/react';
import { MonthlyBalanceGraph } from '../MonthlyBalanceGraph';
import type { MonthlyBalanceResponse } from '@/lib/api/aggregation';

// Rechartsのモック
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
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
});
