import { Controller, Get, Query } from '@nestjs/common';
import { CalculateMonthlyBalanceUseCase } from '../../application/use-cases/calculate-monthly-balance.use-case';
import type { MonthlyBalanceResponseDto } from '../../application/use-cases/calculate-monthly-balance.use-case';
import { GetMonthlyBalanceDto } from '../dto/get-monthly-balance.dto';
import { CalculateCategoryAggregationUseCase } from '../../application/use-cases/calculate-category-aggregation.use-case';
import type { CategoryAggregationResponseDto } from '../dto/get-category-aggregation.dto';
import { GetCategoryAggregationQueryDto } from '../dto/get-category-aggregation.dto';

/**
 * AggregationController
 * 集計機能のREST APIエンドポイント
 */
@Controller('api/aggregation')
export class AggregationController {
  constructor(
    private readonly calculateMonthlyBalanceUseCase: CalculateMonthlyBalanceUseCase,
    private readonly calculateCategoryAggregationUseCase: CalculateCategoryAggregationUseCase,
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
}
