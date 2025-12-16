import React from 'react';
import { render, screen } from '@testing-library/react';
import { AssetBalanceGraph } from '../AssetBalanceGraph';
import type { InstitutionAssetDto } from '@/lib/api/aggregation';
import { InstitutionType } from '@account-book/types';

// Rechartsのモック
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children, data }: { children: React.ReactNode; data?: unknown[] }) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Bar: ({ children }: { children?: React.ReactNode }) => <div data-testid="bar">{children}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Cell: () => <div data-testid="cell" />,
}));

describe('AssetBalanceGraph', () => {
  const mockInstitutions: InstitutionAssetDto[] = [
    {
      institutionId: 'inst-001',
      institutionName: '三菱UFJ銀行',
      institutionType: InstitutionType.BANK,
      icon: '🏦',
      accounts: [],
      total: 3234567,
      percentage: 61.8,
    },
    {
      institutionId: 'inst-002',
      institutionName: '楽天カード',
      institutionType: InstitutionType.CREDIT_CARD,
      icon: '💳',
      accounts: [],
      total: -123456,
      percentage: 0.0,
    },
    {
      institutionId: 'inst-003',
      institutionName: 'SBI証券',
      institutionType: InstitutionType.SECURITIES,
      icon: '📈',
      accounts: [],
      total: 2000000,
      percentage: 38.2,
    },
  ];

  it('資産構成グラフを表示する', () => {
    render(<AssetBalanceGraph institutions={mockInstitutions} />);

    expect(screen.getByText('資産構成グラフ')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('資産のみをグラフに表示する（負債は除外）', () => {
    render(<AssetBalanceGraph institutions={mockInstitutions} />);

    const barChart = screen.getByTestId('bar-chart');
    const chartData = JSON.parse(barChart.getAttribute('data-chart-data') || '[]');

    // 資産のみが含まれる（負債は除外）
    expect(chartData.length).toBe(2);
    expect(chartData.find((d: { name: string }) => d.name === '三菱UFJ銀行')).toBeDefined();
    expect(chartData.find((d: { name: string }) => d.name === 'SBI証券')).toBeDefined();
    expect(chartData.find((d: { name: string }) => d.name === '楽天カード')).toBeUndefined();
  });

  it('資産を降順でソートする', () => {
    render(<AssetBalanceGraph institutions={mockInstitutions} />);

    const barChart = screen.getByTestId('bar-chart');
    const chartData = JSON.parse(barChart.getAttribute('data-chart-data') || '[]');

    // 降順でソートされていることを確認
    expect(chartData[0]?.value).toBe(3234567); // 三菱UFJ銀行
    expect(chartData[1]?.value).toBe(2000000); // SBI証券
  });

  it('データが空の場合は「データがありません」を表示する', () => {
    render(<AssetBalanceGraph institutions={[]} />);

    expect(screen.getByText('データがありません')).toBeInTheDocument();
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
  });

  it('負債のみの場合は「データがありません」を表示する', () => {
    const liabilitiesOnly: InstitutionAssetDto[] = [
      {
        institutionId: 'inst-001',
        institutionName: '楽天カード',
        institutionType: InstitutionType.CREDIT_CARD,
        icon: '💳',
        accounts: [],
        total: -123456,
        percentage: 0.0,
      },
    ];

    render(<AssetBalanceGraph institutions={liabilitiesOnly} />);

    expect(screen.getByText('データがありません')).toBeInTheDocument();
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
  });
});
