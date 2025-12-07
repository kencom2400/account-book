'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency } from '@account-book/utils';
import type { InstitutionAssetDto } from '@/lib/api/aggregation';

// グラフの色（将来的にテーマカラーに変更可能）
const BAR_CHART_COLOR = '#2196F3'; // blue-500相当

interface AssetBalanceGraphProps {
  institutions: InstitutionAssetDto[];
}

/**
 * 資産構成グラフコンポーネント（横棒グラフ）
 * FR-026: 金融機関別資産残高表示
 */
export function AssetBalanceGraph({ institutions }: AssetBalanceGraphProps): React.JSX.Element {
  // グラフ用データを準備（資産のみ、降順でソート）
  const graphData = useMemo(() => {
    return institutions
      .filter((inst) => inst.total >= 0)
      .sort((a, b) => b.total - a.total)
      .map((institution) => ({
        name: institution.institutionName,
        value: institution.total,
        percentage: institution.percentage,
        icon: institution.icon,
      }));
  }, [institutions]);

  if (graphData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>資産構成グラフ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">データがありません</div>
        </CardContent>
      </Card>
    );
  }

  // カスタムツールチップ
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{
      value: number;
      payload: { percentage: number; icon: string; name: string; value: number };
    }>;
  }): React.JSX.Element | null => {
    if (active && payload && payload.length > 0) {
      const data = payload[0]?.payload;
      if (!data) {
        return null;
      }
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xl">{data.icon}</span>
            <span className="font-semibold text-gray-900">{data.name}</span>
          </div>
          <div className="text-sm">
            <div className="text-gray-600">金額: {formatCurrency(data.value)}</div>
            <div className="text-gray-600">構成比: {data.percentage.toFixed(1)}%</div>
          </div>
        </div>
      );
    }
    return null;
  };

  // カスタムラベル（Y軸のラベルにアイコンを表示）
  const CustomYAxisLabel = (props: {
    y: number;
    payload?: { value: string };
  }): React.JSX.Element => {
    const institution = graphData.find((d) => d.name === props.payload?.value);
    if (!institution) {
      return (
        <text y={props.y} fill="#666" fontSize={12} textAnchor="end" x={-10}>
          {props.payload?.value}
        </text>
      );
    }
    return (
      <text y={props.y} fill="#666" fontSize={12} textAnchor="end" x={-10}>
        <tspan>{institution.icon} </tspan>
        <tspan>{props.payload?.value}</tspan>
      </text>
    );
  };

  // 最大値を取得（グラフのスケール調整用）
  const maxValue = Math.max(...graphData.map((d) => d.value));
  const chartMaxValue = maxValue * 1.1; // 10%のマージンを追加

  return (
    <Card>
      <CardHeader>
        <CardTitle>資産構成グラフ</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={graphData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              tickFormatter={(value: number) => formatCurrency(value)}
              domain={[0, chartMaxValue]}
            />
            <YAxis type="category" dataKey="name" width={90} tick={CustomYAxisLabel} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="value" name="資産残高" fill={BAR_CHART_COLOR} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
