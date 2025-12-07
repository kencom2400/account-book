import { Controller, Get, Query } from '@nestjs/common';
import { CalculateMonthlyBalanceUseCase } from '../../application/use-cases/calculate-monthly-balance.use-case';
import type { MonthlyBalanceResponseDto } from '../../application/use-cases/calculate-monthly-balance.use-case';
import { GetMonthlyBalanceDto } from '../dto/get-monthly-balance.dto';
import { CalculateYearlyBalanceUseCase } from '../../application/use-cases/calculate-yearly-balance.use-case';
import type { YearlyBalanceResponseDto } from '../../application/use-cases/calculate-yearly-balance.use-case';
import { GetYearlyBalanceDto } from '../dto/get-yearly-balance.dto';
import { CalculateCategoryAggregationUseCase } from '../../application/use-cases/calculate-category-aggregation.use-case';
import type { CategoryAggregationResponseDto } from '../dto/get-category-aggregation.dto';
import { GetCategoryAggregationQueryDto } from '../dto/get-category-aggregation.dto';
import { CalculateInstitutionSummaryUseCase } from '../../application/use-cases/calculate-institution-summary.use-case';
import type { InstitutionSummaryResponseDto } from '../../application/use-cases/calculate-institution-summary.use-case';
import { GetInstitutionSummaryDto } from '../dto/get-institution-summary.dto';
import { CalculateSubcategoryAggregationUseCase } from '../../application/use-cases/calculate-subcategory-aggregation.use-case';
import type { SubcategoryAggregationResponseDto } from '../dto/get-subcategory-aggregation.dto';
import { GetSubcategoryAggregationQueryDto } from '../dto/get-subcategory-aggregation.dto';
import { CalculateAssetBalanceUseCase } from '../../application/use-cases/calculate-asset-balance.use-case';
import type { AssetBalanceResponseDto } from '../dto/asset-balance-response.dto';
import { GetAssetBalanceDto } from '../dto/get-asset-balance.dto';
import { CalculateTrendAnalysisUseCase } from '../../application/use-cases/calculate-trend-analysis.use-case';
import type { TrendAnalysisResponseDto } from '../dto/trend-analysis-response.dto';
import { GetTrendAnalysisDto } from '../dto/get-trend-analysis.dto';

/**
 * AggregationController
 * 集計機能のREST APIエンドポイント
 */
@Controller('aggregation')
export class AggregationController {
  constructor(
    private readonly calculateMonthlyBalanceUseCase: CalculateMonthlyBalanceUseCase,
    private readonly calculateYearlyBalanceUseCase: CalculateYearlyBalanceUseCase,
    private readonly calculateCategoryAggregationUseCase: CalculateCategoryAggregationUseCase,
    private readonly calculateInstitutionSummaryUseCase: CalculateInstitutionSummaryUseCase,
    private readonly calculateSubcategoryAggregationUseCase: CalculateSubcategoryAggregationUseCase,
    private readonly calculateAssetBalanceUseCase: CalculateAssetBalanceUseCase,
    private readonly calculateTrendAnalysisUseCase: CalculateTrendAnalysisUseCase,
  ) {}

  /**
   * 月別収支集計情報を取得
   * GET /api/aggregation/monthly-balance?year=2025&month=1
   */
  @Get('monthly-balance')
  async getMonthlyBalance(@Query() query: GetMonthlyBalanceDto): Promise<{
    success: boolean;
    data: MonthlyBalanceResponseDto;
  }> {
    const result = await this.calculateMonthlyBalanceUseCase.execute(
      query.year,
      query.month,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * 年間収支推移情報を取得
   * GET /api/aggregation/yearly-balance?year=2025
   */
  @Get('yearly-balance')
  async getYearlyBalance(@Query() query: GetYearlyBalanceDto): Promise<{
    success: boolean;
    data: YearlyBalanceResponseDto;
  }> {
    const result = await this.calculateYearlyBalanceUseCase.execute(query.year);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * カテゴリ別集計情報を取得
   * GET /api/aggregation/category?startDate=2025-01-01&endDate=2025-01-31&categoryType=EXPENSE
   */
  @Get('category')
  async getCategoryAggregation(
    @Query() query: GetCategoryAggregationQueryDto,
  ): Promise<{
    success: boolean;
    data: CategoryAggregationResponseDto[];
  }> {
    const result = await this.calculateCategoryAggregationUseCase.execute(
      new Date(query.startDate),
      new Date(query.endDate),
      query.categoryType,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * 金融機関別集計情報を取得
   * GET /api/aggregation/institution-summary?startDate=2025-01-01&endDate=2025-01-31&institutionIds=inst-001&includeTransactions=false
   */
  @Get('institution-summary')
  async getInstitutionSummary(
    @Query() query: GetInstitutionSummaryDto,
  ): Promise<{
    success: boolean;
    data: InstitutionSummaryResponseDto;
  }> {
    const result = await this.calculateInstitutionSummaryUseCase.execute(
      new Date(query.startDate),
      new Date(query.endDate),
      query.institutionIds,
      query.includeTransactions ?? false,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * 費目別集計情報を取得
   * GET /api/aggregation/subcategory?startDate=2025-01-01&endDate=2025-01-31&categoryType=EXPENSE&itemId=cat-food
   */
  @Get('subcategory')
  async getSubcategoryAggregation(
    @Query() query: GetSubcategoryAggregationQueryDto,
  ): Promise<{
    success: boolean;
    data: SubcategoryAggregationResponseDto;
  }> {
    const result = await this.calculateSubcategoryAggregationUseCase.execute(
      new Date(query.startDate),
      new Date(query.endDate),
      query.categoryType,
      query.itemId,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * 資産残高情報を取得
   * GET /api/aggregation/asset-balance?asOfDate=2025-01-15
   */
  @Get('asset-balance')
  async getAssetBalance(@Query() query: GetAssetBalanceDto): Promise<{
    success: boolean;
    data: AssetBalanceResponseDto;
  }> {
    const asOfDate = query.asOfDate ? new Date(query.asOfDate) : undefined;
    const result = await this.calculateAssetBalanceUseCase.execute(asOfDate);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * トレンド分析情報を取得
   * GET /api/aggregation/trend?startYear=2024&startMonth=1&endYear=2024&endMonth=12&targetType=balance&movingAveragePeriod=6
   * FR-027: 収支推移のトレンド表示
   */
  @Get('trend')
  async getTrendAnalysis(@Query() query: GetTrendAnalysisDto): Promise<{
    success: boolean;
    data: TrendAnalysisResponseDto;
  }> {
    const result = await this.calculateTrendAnalysisUseCase.execute(
      query.startYear,
      query.startMonth,
      query.endYear,
      query.endMonth,
      query.targetType,
      query.movingAveragePeriod,
    );

    return {
      success: true,
      data: result,
    };
  }
}
