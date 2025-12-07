import { TrendTargetType } from './get-trend-analysis.dto';
import type { DataPoint } from '../../domain/services/trend-analysis-domain.service';

/**
 * DataPointDto
 * プレゼンテーション層用のDataPoint（ドメイン層のDataPointと同一）
 */
export type DataPointDto = DataPoint;

/**
 * TrendLineDto
 * プレゼンテーション層用のTrendLine（ドメイン層のTrendLineと同一）
 */
export interface TrendLineDto {
  slope: number;
  intercept: number;
  points: DataPointDto[];
}

/**
 * InsightDto
 * インサイト情報
 */
export interface InsightDto {
  type: 'trend' | 'pattern' | 'anomaly';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  recommendation?: string;
}

/**
 * TrendAnalysisResponseDto
 * トレンド分析レスポンスDTO
 * FR-027: 収支推移のトレンド表示
 */
export interface TrendAnalysisResponseDto {
  period: {
    start: string; // YYYY-MM
    end: string; // YYYY-MM
  };
  targetType: TrendTargetType;
  actual: DataPointDto[];
  movingAverage: {
    period: number;
    data: DataPointDto[];
  };
  trendLine: TrendLineDto;
  statistics: {
    mean: number;
    standardDeviation: number;
    coefficientOfVariation: number;
  };
  insights: InsightDto[];
}
