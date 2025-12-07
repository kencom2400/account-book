import React from 'react';
import { render, screen } from '@testing-library/react';
import { TrendInsights } from '../TrendInsights';
import type { TrendAnalysisResponse } from '@account-book/types';

describe('TrendInsights', () => {
  const mockData: TrendAnalysisResponse = {
    period: {
      start: '2024-01',
      end: '2024-12',
    },
    targetType: 'balance',
    actual: [],
    movingAverage: {
      period: 6,
      data: [],
    },
    trendLine: {
      slope: 0,
      intercept: 0,
      points: [],
    },
    statistics: {
      mean: 0,
      standardDeviation: 0,
      coefficientOfVariation: 0,
    },
    insights: [
      {
        type: 'trend',
        severity: 'warning',
        title: '支出が増加傾向です',
        description: '過去12ヶ月間で支出が継続的に増加しています。',
        recommendation: 'カテゴリ別の内訳を確認し、増加要因を特定しましょう。',
      },
      {
        type: 'pattern',
        severity: 'info',
        title: '季節的なパターンを検出',
        description: '特定の時期に支出が増加する傾向があります。',
        recommendation: '予算計画に季節変動を織り込みましょう。',
      },
      {
        type: 'anomaly',
        severity: 'critical',
        title: '収支が悪化傾向です',
        description: '過去12ヶ月間で収支が継続的に悪化しています。',
        recommendation: '支出の見直しと収入の増加を検討しましょう。',
      },
    ],
  };

  it('should render insights', () => {
    render(<TrendInsights data={mockData} />);

    expect(screen.getByText('トレンド分析レポート')).toBeInTheDocument();
    expect(screen.getByText('支出が増加傾向です')).toBeInTheDocument();
    expect(screen.getByText('季節的なパターンを検出')).toBeInTheDocument();
    expect(screen.getByText('収支が悪化傾向です')).toBeInTheDocument();
  });

  it('should render empty state when no insights', () => {
    const emptyData: TrendAnalysisResponse = {
      ...mockData,
      insights: [],
    };

    render(<TrendInsights data={emptyData} />);

    expect(screen.getByText('インサイトはありません')).toBeInTheDocument();
  });

  it('should sort insights by severity (critical > warning > info)', () => {
    render(<TrendInsights data={mockData} />);

    const insights = screen.getAllByRole('heading', { level: 3 });

    // criticalが最初に来ることを確認
    expect(insights[0]).toHaveTextContent('収支が悪化傾向です');
    // warningが次に来ることを確認
    expect(insights[1]).toHaveTextContent('支出が増加傾向です');
    // infoが最後に来ることを確認
    expect(insights[2]).toHaveTextContent('季節的なパターンを検出');
  });

  it('should display recommendations when available', () => {
    render(<TrendInsights data={mockData} />);

    // 重要度順にソートされるため、順序は異なる可能性がある
    expect(
      screen.getByText(/カテゴリ別の内訳を確認し、増加要因を特定しましょう。/)
    ).toBeInTheDocument();
    expect(screen.getByText(/予算計画に季節変動を織り込みましょう。/)).toBeInTheDocument();
    expect(screen.getByText(/支出の見直しと収入の増加を検討しましょう。/)).toBeInTheDocument();
  });

  it('should apply correct styling for critical severity', () => {
    const criticalData: TrendAnalysisResponse = {
      ...mockData,
      insights: [
        {
          type: 'trend',
          severity: 'critical',
          title: 'Critical Insight',
          description: 'Critical description',
        },
      ],
    };

    const { container } = render(<TrendInsights data={criticalData} />);

    const insightCard = container.querySelector('.bg-red-50');
    expect(insightCard).toBeInTheDocument();
  });

  it('should apply correct styling for warning severity', () => {
    const warningData: TrendAnalysisResponse = {
      ...mockData,
      insights: [
        {
          type: 'trend',
          severity: 'warning',
          title: 'Warning Insight',
          description: 'Warning description',
        },
      ],
    };

    const { container } = render(<TrendInsights data={warningData} />);

    const insightCard = container.querySelector('.bg-yellow-50');
    expect(insightCard).toBeInTheDocument();
  });

  it('should apply correct styling for info severity', () => {
    const infoData: TrendAnalysisResponse = {
      ...mockData,
      insights: [
        {
          type: 'trend',
          severity: 'info',
          title: 'Info Insight',
          description: 'Info description',
        },
      ],
    };

    const { container } = render(<TrendInsights data={infoData} />);

    const insightCard = container.querySelector('.bg-blue-50');
    expect(insightCard).toBeInTheDocument();
  });
});
