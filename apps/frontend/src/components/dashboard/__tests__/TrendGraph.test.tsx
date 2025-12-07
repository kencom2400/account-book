import React from 'react';
import { render, screen } from '@testing-library/react';
import { TrendGraph } from '../TrendGraph';
import type { TrendAnalysisResponse } from '@/lib/api/aggregation';

// Rechartsのモック
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  ComposedChart: ({ children, data }: { children: React.ReactNode; data?: unknown[] }) => (
    <div data-testid="composed-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe('TrendGraph', () => {
  const mockData: TrendAnalysisResponse = {
    period: {
      start: '2024-01',
      end: '2024-12',
    },
    targetType: 'balance',
    actual: [
      { date: '2024-01', value: 100000 },
      { date: '2024-02', value: 110000 },
      { date: '2024-03', value: 120000 },
      { date: '2024-04', value: 130000 },
      { date: '2024-05', value: 140000 },
      { date: '2024-06', value: 150000 },
    ],
    movingAverage: {
      period: 6,
      data: [
        { date: '2024-01', value: NaN },
        { date: '2024-02', value: NaN },
        { date: '2024-03', value: NaN },
        { date: '2024-04', value: NaN },
        { date: '2024-05', value: NaN },
        { date: '2024-06', value: 125000 },
      ],
    },
    trendLine: {
      slope: 10000,
      intercept: 90000,
      points: [
        { date: '2024-01', value: 100000 },
        { date: '2024-02', value: 110000 },
        { date: '2024-03', value: 120000 },
        { date: '2024-04', value: 130000 },
        { date: '2024-05', value: 140000 },
        { date: '2024-06', value: 150000 },
      ],
    },
    statistics: {
      mean: 125000,
      standardDeviation: 18257.42,
      coefficientOfVariation: 0.146,
    },
    insights: [],
  };

  it('should render trend graph with data', () => {
    render(<TrendGraph data={mockData} />);

    expect(screen.getByText('収支のトレンド分析')).toBeInTheDocument();
  });

  it('should render loading state', () => {
    render(<TrendGraph data={mockData} loading={true} />);

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('should render error state', () => {
    const errorMessage = 'データの取得に失敗しました';
    render(<TrendGraph data={mockData} error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should render empty state when data is empty', () => {
    const emptyData: TrendAnalysisResponse = {
      ...mockData,
      actual: [],
      movingAverage: { period: 6, data: [] },
      trendLine: { slope: 0, intercept: 0, points: [] },
    };

    render(<TrendGraph data={emptyData} />);

    expect(screen.getByText('データがありません')).toBeInTheDocument();
  });

  it('should display correct target type label for income', () => {
    const incomeData: TrendAnalysisResponse = {
      ...mockData,
      targetType: 'income',
    };

    render(<TrendGraph data={incomeData} />);

    expect(screen.getByText('収入のトレンド分析')).toBeInTheDocument();
  });

  it('should display correct target type label for expense', () => {
    const expenseData: TrendAnalysisResponse = {
      ...mockData,
      targetType: 'expense',
    };

    render(<TrendGraph data={expenseData} />);

    expect(screen.getByText('支出のトレンド分析')).toBeInTheDocument();
  });

  it('should display correct target type label for balance', () => {
    render(<TrendGraph data={mockData} />);

    expect(screen.getByText('収支のトレンド分析')).toBeInTheDocument();
  });

  it('should render graph with ResponsiveContainer', () => {
    render(<TrendGraph data={mockData} />);

    // ResponsiveContainerがレンダリングされていることを確認
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
  });
});
