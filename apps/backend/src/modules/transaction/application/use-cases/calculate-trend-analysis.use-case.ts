import { Inject, Injectable } from '@nestjs/common';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import { MonthlyBalanceDomainService } from '../../domain/services/monthly-balance-domain.service';
import { TrendAnalysisDomainService } from '../../domain/services/trend-analysis-domain.service';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { CategoryType } from '@account-book/types';
import {
  TrendTargetType,
  MovingAveragePeriod,
} from '../../presentation/dto/get-trend-analysis.dto';

/**
 * DataPoint DTO
 */
export interface DataPointDto {
  date: string; // YYYY-MM
  value: number;
}

/**
 * TrendLineDto
 */
export interface TrendLineDto {
  slope: number;
  intercept: number;
  points: DataPointDto[];
}

/**
 * TrendAnalysisResponseDto
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

/**
 * InsightDto
 */
export interface InsightDto {
  type: 'trend' | 'pattern' | 'anomaly';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  recommendation?: string;
}

/**
 * CalculateTrendAnalysisUseCase
 * トレンド分析のユースケース
 * FR-027: 収支推移のトレンド表示
 */
@Injectable()
export class CalculateTrendAnalysisUseCase {
  // 最低必要な月数
  private static readonly MIN_MONTHS = 6;
  // デフォルトの移動平均期間
  private static readonly DEFAULT_MOVING_AVERAGE_PERIOD =
    MovingAveragePeriod.SIX_MONTHS;
  // デフォルトの表示対象
  private static readonly DEFAULT_TARGET_TYPE = TrendTargetType.BALANCE;

  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    private readonly monthlyBalanceDomainService: MonthlyBalanceDomainService,
    private readonly trendAnalysisDomainService: TrendAnalysisDomainService,
  ) {}

  /**
   * トレンド分析を実行
   * @param startYear 開始年
   * @param startMonth 開始月（1-12）
   * @param endYear 終了年
   * @param endMonth 終了月（1-12）
   * @param targetType 表示対象（収入/支出/収支）
   * @param movingAveragePeriod 移動平均の期間（3/6/12ヶ月）
   * @returns トレンド分析結果
   */
  async execute(
    startYear: number,
    startMonth: number,
    endYear: number,
    endMonth: number,
    targetType: TrendTargetType = CalculateTrendAnalysisUseCase.DEFAULT_TARGET_TYPE,
    movingAveragePeriod: MovingAveragePeriod = CalculateTrendAnalysisUseCase.DEFAULT_MOVING_AVERAGE_PERIOD,
  ): Promise<TrendAnalysisResponseDto> {
    // 期間の検証
    const startDate = new Date(startYear, startMonth - 1, 1);
    const endDate = new Date(endYear, endMonth, 0, 23, 59, 59, 999); // 月末日

    if (startDate > endDate) {
      throw new Error('開始日が終了日より後です');
    }

    // 対象期間の取引データを取得
    const transactions = await this.transactionRepository.findByDateRange(
      startDate,
      endDate,
    );

    // 月ごとにグループ化
    const monthlyData = this.groupTransactionsByMonth(
      transactions,
      startYear,
      startMonth,
      endYear,
      endMonth,
    );

    // 最低月数のチェック
    if (monthlyData.length < CalculateTrendAnalysisUseCase.MIN_MONTHS) {
      throw new Error(
        `最低${CalculateTrendAnalysisUseCase.MIN_MONTHS}ヶ月分のデータが必要です`,
      );
    }

    // 対象タイプに応じた値を抽出
    const values = monthlyData.map((m) => {
      switch (targetType) {
        case TrendTargetType.INCOME:
          return m.income;
        case TrendTargetType.EXPENSE:
          return m.expense;
        case TrendTargetType.BALANCE:
          return m.balance;
        default:
          return m.balance;
      }
    });

    const dates = monthlyData.map((m) => m.month);

    // 移動平均を計算
    const smaValues = this.trendAnalysisDomainService.calculateSMA(
      values,
      movingAveragePeriod,
    );
    const movingAverageData: DataPointDto[] = dates.map((date, i) => ({
      date,
      value: smaValues[i],
    }));

    // トレンドラインを計算
    const trendLine = this.trendAnalysisDomainService.calculateTrendLine(
      values,
      dates,
    );
    const trendLineDto: TrendLineDto = {
      slope: trendLine.slope,
      intercept: trendLine.intercept,
      points: trendLine.points,
    };

    // 統計情報を計算
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const standardDeviation =
      this.trendAnalysisDomainService.calculateStandardDeviation(values);
    const coefficientOfVariation =
      this.trendAnalysisDomainService.calculateCoefficientOfVariation(values);

    // インサイトを生成
    const insights = this.generateInsights(
      targetType,
      values,
      trendLineDto,
      mean,
      standardDeviation,
      coefficientOfVariation,
      monthlyData.length,
    );

    return {
      period: {
        start: dates[0] ?? '',
        end: dates[dates.length - 1] ?? '',
      },
      targetType,
      actual: dates.map((date, i) => ({
        date,
        value: values[i],
      })),
      movingAverage: {
        period: movingAveragePeriod,
        data: movingAverageData,
      },
      trendLine: trendLineDto,
      statistics: {
        mean,
        standardDeviation,
        coefficientOfVariation,
      },
      insights,
    };
  }

  /**
   * 取引データを月ごとにグループ化
   * @param transactions 取引データ
   * @param startYear 開始年
   * @param startMonth 開始月
   * @param endYear 終了年
   * @param endMonth 終了月
   * @returns 月別サマリーの配列
   */
  private groupTransactionsByMonth(
    transactions: TransactionEntity[],
    startYear: number,
    startMonth: number,
    endYear: number,
    endMonth: number,
  ): Array<{
    month: string;
    income: number;
    expense: number;
    balance: number;
  }> {
    const monthlyMap = new Map<
      string,
      { income: number; expense: number; balance: number }
    >();

    // 対象期間のすべての月を初期化
    const currentDate = new Date(startYear, startMonth - 1, 1);
    const endDate = new Date(endYear, endMonth, 0);

    while (currentDate <= endDate) {
      const monthString = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1,
      ).padStart(2, '0')}`;
      monthlyMap.set(monthString, { income: 0, expense: 0, balance: 0 });

      // 次の月へ
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // 取引データを月ごとに集計
    for (const transaction of transactions) {
      const monthString = `${transaction.date.getFullYear()}-${String(
        transaction.date.getMonth() + 1,
      ).padStart(2, '0')}`;

      const monthly = monthlyMap.get(monthString);
      if (!monthly) {
        continue; // 対象期間外のデータはスキップ
      }

      if (transaction.category.type === CategoryType.INCOME) {
        monthly.income += transaction.amount;
      } else if (transaction.category.type === CategoryType.EXPENSE) {
        monthly.expense += transaction.amount;
      }
    }

    // 収支を計算
    for (const monthly of monthlyMap.values()) {
      monthly.balance = monthly.income - monthly.expense;
    }

    // 月順にソートして配列に変換
    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
        balance: data.balance,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * インサイトを生成
   * @param targetType 表示対象
   * @param values 値の配列
   * @param trendLine トレンドライン
   * @param mean 平均値
   * @param standardDeviation 標準偏差
   * @param coefficientOfVariation 変動係数
   * @param monthCount 月数
   * @returns インサイトの配列
   */
  private generateInsights(
    targetType: TrendTargetType,
    values: number[],
    trendLine: { slope: number; intercept: number; points: DataPointDto[] },
    mean: number,
    standardDeviation: number,
    coefficientOfVariation: number,
    monthCount: number,
  ): InsightDto[] {
    const insights: InsightDto[] = [];

    // トレンド方向の判定
    const isIncreasing = trendLine.slope > mean * 0.01;
    const isDecreasing = trendLine.slope < -mean * 0.01;

    // 支出増加トレンド
    if (targetType === TrendTargetType.EXPENSE && isIncreasing) {
      insights.push({
        type: 'trend',
        severity: 'warning',
        title: '支出が増加傾向です',
        description: `過去${monthCount}ヶ月間で支出が継続的に増加しています。`,
        recommendation: 'カテゴリ別の内訳を確認し、増加要因を特定しましょう。',
      });
    }

    // 収入減少トレンド
    if (targetType === TrendTargetType.INCOME && isDecreasing) {
      insights.push({
        type: 'trend',
        severity: 'warning',
        title: '収入が減少傾向です',
        description: `過去${monthCount}ヶ月間で収入が継続的に減少しています。`,
        recommendation: '収入源の見直しを検討しましょう。',
      });
    }

    // 収支悪化トレンド
    if (targetType === TrendTargetType.BALANCE && isDecreasing) {
      insights.push({
        type: 'trend',
        severity: 'critical',
        title: '収支が悪化傾向です',
        description: `過去${monthCount}ヶ月間で収支が継続的に悪化しています。`,
        recommendation: '支出の見直しと収入の増加を検討しましょう。',
      });
    }

    // 変動が大きい場合
    if (coefficientOfVariation > 0.3) {
      insights.push({
        type: 'anomaly',
        severity: 'info',
        title: '変動が大きいです',
        description: '月ごとの変動が大きい傾向があります。',
        recommendation: '予算計画に余裕を持たせましょう。',
      });
    }

    // 安定している場合
    if (
      Math.abs(trendLine.slope) < mean * 0.01 &&
      coefficientOfVariation < 0.1
    ) {
      insights.push({
        type: 'pattern',
        severity: 'info',
        title: '安定した傾向です',
        description: `過去${monthCount}ヶ月間で安定した傾向が続いています。`,
      });
    }

    return insights;
  }
}
