import { Injectable } from '@nestjs/common';

/**
 * DataPoint Value Object
 * トレンド分析用のデータポイント
 */
export interface DataPoint {
  date: string; // YYYY-MM
  value: number;
}

/**
 * TrendLine Value Object
 * トレンドラインの計算結果
 */
export interface TrendLine {
  slope: number;
  intercept: number;
  points: DataPoint[];
}

/**
 * SeasonalPattern Value Object
 * 季節性パターン（将来機能として準備）
 */
export interface SeasonalPattern {
  pattern: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  confidence: number;
}

/**
 * TrendAnalysisDomainService
 * トレンド分析のドメインロジック
 * FR-027: 収支推移のトレンド表示
 */
@Injectable()
export class TrendAnalysisDomainService {
  /**
   * 移動平均（SMA: Simple Moving Average）を計算
   * @param data 月別の金額配列
   * @param period 移動平均の期間（3, 6, 12ヶ月）
   * @returns 移動平均の配列（データ不足の場合はNaN）
   */
  calculateSMA(data: number[], period: number): number[] {
    if (data.length === 0 || period <= 0) {
      return [];
    }

    const sma: number[] = [];

    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        // データ不足の場合はNaN
        sma.push(NaN);
      } else {
        // 過去periodヶ月分の平均を計算
        const sum = data
          .slice(i - period + 1, i + 1)
          .reduce((a, b) => a + b, 0);
        sma.push(sum / period);
      }
    }

    return sma;
  }

  /**
   * 線形回帰によるトレンドラインを計算
   * @param data 月別の金額配列
   * @param dates 月の配列（YYYY-MM形式）
   * @returns トレンドラインの計算結果
   */
  calculateTrendLine(data: number[], dates: string[]): TrendLine {
    if (
      data.length === 0 ||
      dates.length === 0 ||
      data.length !== dates.length
    ) {
      return {
        slope: 0,
        intercept: 0,
        points: [],
      };
    }

    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i + 1); // 1, 2, 3, ..., n

    // 平均値
    const xMean = x.reduce((sum, val) => sum + val, 0) / n;
    const yMean = data.reduce((sum, val) => sum + val, 0) / n;

    // 傾きと切片の計算: 線形回帰
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = data[i] - yMean;
      numerator += xDiff * yDiff;
      denominator += xDiff * xDiff;
    }

    const slope = denominator === 0 ? 0 : numerator / denominator;
    const intercept = yMean - slope * xMean;

    // トレンドラインのポイントを生成
    const points: DataPoint[] = dates.map((date, i) => ({
      date,
      value: slope * (i + 1) + intercept,
    }));

    return {
      slope,
      intercept,
      points,
    };
  }

  /**
   * 季節性パターンを分析（将来機能として準備）
   * @param _data 月別の金額配列
   * @param _dates 月の配列（YYYY-MM形式）
   * @returns 季節性パターンの配列
   */
  analyzeSeasonality(_data: number[], _dates: string[]): SeasonalPattern[] {
    // 将来機能として実装予定
    // 現時点では空配列を返す
    return [];
  }

  /**
   * 標準偏差を計算
   * @param data 月別の金額配列
   * @param mean 平均値（省略可能、指定されない場合は計算）
   * @returns 標準偏差
   */
  calculateStandardDeviation(data: number[], mean?: number): number {
    if (data.length === 0) {
      return 0;
    }

    const n = data.length;
    const dataMean = mean ?? data.reduce((sum, val) => sum + val, 0) / n;

    // 分散を計算
    const variance =
      data.reduce((sum, val) => sum + Math.pow(val - dataMean, 2), 0) / n;

    // 標準偏差 = √分散
    return Math.sqrt(variance);
  }

  /**
   * 変動係数（Coefficient of Variation）を計算
   * @param data 月別の金額配列
   * @param mean 平均値（省略可能、指定されない場合は計算）
   * @param stdDev 標準偏差（省略可能、指定されない場合は計算）
   * @returns 変動係数
   */
  calculateCoefficientOfVariation(
    data: number[],
    mean?: number,
    stdDev?: number,
  ): number {
    if (data.length === 0) {
      return 0;
    }

    const dataMean =
      mean ?? data.reduce((sum, val) => sum + val, 0) / data.length;
    if (dataMean === 0) {
      return 0;
    }

    const standardDeviation =
      stdDev ?? this.calculateStandardDeviation(data, dataMean);
    // 平均値が負の場合も考慮し、絶対値で割る
    return standardDeviation / Math.abs(dataMean);
  }
}
