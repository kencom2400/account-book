import { Controller, Get, Query } from '@nestjs/common';
import { CalculateMonthlyBalanceUseCase } from '../../application/use-cases/calculate-monthly-balance.use-case';
import type { MonthlyBalanceResponseDto } from '../../application/use-cases/calculate-monthly-balance.use-case';
import { GetMonthlyBalanceDto } from '../dto/get-monthly-balance.dto';

/**
 * AggregationController
 * 集計機能のREST APIエンドポイント
 */
@Controller('api/aggregation')
export class AggregationController {
  constructor(
    private readonly calculateMonthlyBalanceUseCase: CalculateMonthlyBalanceUseCase,
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
}
