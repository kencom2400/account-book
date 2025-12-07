'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import type { TrendAnalysisResponse } from '@/lib/api/aggregation';

interface TrendInsightsProps {
  data: TrendAnalysisResponse;
}

/**
 * インサイト表示コンポーネント
 * FR-027: 収支推移のトレンド表示
 */
export function TrendInsights({ data }: TrendInsightsProps): React.JSX.Element {
  if (data.insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>トレンド分析レポート</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600">インサイトはありません</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 重要度順にソート（critical > warning > info）
  const sortedInsights = [...data.insights].sort((a, b) => {
    const severityOrder: Record<string, number> = {
      critical: 3,
      warning: 2,
      info: 1,
    };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });

  // 重要度に応じたアイコンと色を取得
  const getSeverityStyle = (
    severity: string
  ): {
    icon: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    iconColor: string;
  } => {
    switch (severity) {
      case 'critical':
        return {
          icon: '🔴',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
        };
      case 'warning':
        return {
          icon: '⚠️',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
        };
      case 'info':
        return {
          icon: 'ℹ️',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600',
        };
      default:
        return {
          icon: 'ℹ️',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-600',
        };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>トレンド分析レポート</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedInsights.map((insight, index) => {
            const style = getSeverityStyle(insight.severity);
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border ${style.bgColor} ${style.borderColor}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`text-2xl ${style.iconColor}`}>{style.icon}</span>
                  <div className="flex-1">
                    <h3 className={`font-semibold text-lg mb-1 ${style.textColor}`}>
                      {insight.title}
                    </h3>
                    <p className={`text-sm mb-2 ${style.textColor}`}>{insight.description}</p>
                    {insight.recommendation && (
                      <p className={`text-sm font-medium mt-2 ${style.textColor}`}>
                        💡 {insight.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
