/**
 * TrendAnalysisResponse
 * トレンド分析レスポンス型
 * FR-027: 収支推移のトレンド表示
 */

export type TrendTargetType = 'income' | 'expense' | 'balance';

export interface DataPoint {
  date: string; // YYYY-MM
  value: number;
}

export interface TrendLine {
  slope: number;
  intercept: number;
  points: DataPoint[];
}

export interface Insight {
  type: 'trend' | 'pattern' | 'anomaly';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  recommendation?: string;
}

export interface TrendAnalysisResponse {
  period: {
    start: string; // YYYY-MM
    end: string; // YYYY-MM
  };
  targetType: TrendTargetType;
  actual: DataPoint[];
  movingAverage: {
    period: number;
    data: DataPoint[];
  };
  trendLine: TrendLine;
  statistics: {
    mean: number;
    standardDeviation: number;
    coefficientOfVariation: number;
  };
  insights: Insight[];
}
