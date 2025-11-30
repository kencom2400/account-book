import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MonthlyCardSummary } from '../../domain/entities/monthly-card-summary.entity';
import { AggregateCardTransactionsUseCase } from '../../application/use-cases/aggregate-card-transactions.use-case';
import { FindAllSummariesUseCase } from '../../application/use-cases/find-all-summaries.use-case';
import { FindSummaryByIdUseCase } from '../../application/use-cases/find-summary-by-id.use-case';
import { DeleteSummaryUseCase } from '../../application/use-cases/delete-summary.use-case';
import { AggregateCardTransactionsRequestDto } from '../dto/aggregate-card-transactions.dto';
import {
  MonthlyCardSummaryResponseDto,
  MonthlyCardSummaryListItemDto,
} from '../dto/monthly-card-summary.dto';

/**
 * 月別集計コントローラー
 * カード利用明細の月別集計機能を提供
 */
@ApiTags('aggregation')
@Controller('api/aggregation/card/monthly')
export class AggregationController {
  constructor(
    private readonly aggregateCardTransactionsUseCase: AggregateCardTransactionsUseCase,
    private readonly findAllSummariesUseCase: FindAllSummariesUseCase,
    private readonly findSummaryByIdUseCase: FindSummaryByIdUseCase,
    private readonly deleteSummaryUseCase: DeleteSummaryUseCase,
  ) {}

  /**
   * POST /api/aggregation/card/monthly
   * カード利用明細を月別に集計
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'カード利用明細の月別集計' })
  @ApiResponse({
    status: 201,
    description: '集計成功',
    type: [MonthlyCardSummaryResponseDto],
  })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  @ApiResponse({ status: 404, description: 'カード or 取引が見つからない' })
  async aggregate(@Body() dto: AggregateCardTransactionsRequestDto): Promise<{
    success: boolean;
    data: MonthlyCardSummaryResponseDto[];
  }> {
    const summaries = await this.aggregateCardTransactionsUseCase.execute(
      dto.cardId,
      dto.startMonth,
      dto.endMonth,
    );

    return {
      success: true,
      data: summaries.map((summary) => this.toResponseDto(summary)),
    };
  }

  /**
   * GET /api/aggregation/card/monthly
   * 月別集計の一覧を取得
   */
  @Get()
  @ApiOperation({ summary: '月別集計の一覧を取得' })
  @ApiResponse({
    status: 200,
    description: '取得成功',
    type: [MonthlyCardSummaryListItemDto],
  })
  async findAll(): Promise<{
    success: boolean;
    data: MonthlyCardSummaryListItemDto[];
  }> {
    const summaries = await this.findAllSummariesUseCase.execute();

    return {
      success: true,
      data: summaries.map((summary) => this.toListItemDto(summary)),
    };
  }

  /**
   * GET /api/aggregation/card/monthly/:id
   * 月別集計の詳細を取得
   */
  @Get(':id')
  @ApiOperation({ summary: '月別集計の詳細を取得' })
  @ApiResponse({
    status: 200,
    description: '取得成功',
    type: MonthlyCardSummaryResponseDto,
  })
  @ApiResponse({ status: 404, description: '集計データが見つからない' })
  async findOne(@Param('id') id: string): Promise<{
    success: boolean;
    data: MonthlyCardSummaryResponseDto;
  }> {
    const summary = await this.findSummaryByIdUseCase.execute(id);

    return {
      success: true,
      data: this.toResponseDto(summary),
    };
  }

  /**
   * DELETE /api/aggregation/card/monthly/:id
   * 月別集計を削除
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '月別集計を削除' })
  @ApiResponse({ status: 204, description: '削除成功' })
  @ApiResponse({ status: 404, description: '集計データが見つからない' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteSummaryUseCase.execute(id);
  }

  /**
   * ドメインエンティティ→詳細レスポンスDTO変換
   */
  private toResponseDto(
    summary: MonthlyCardSummary,
  ): MonthlyCardSummaryResponseDto {
    return {
      id: summary.id,
      cardId: summary.cardId,
      cardName: summary.cardName,
      billingMonth: summary.billingMonth,
      closingDate: summary.closingDate.toISOString(),
      paymentDate: summary.paymentDate.toISOString(),
      totalAmount: summary.totalAmount,
      transactionCount: summary.transactionCount,
      categoryBreakdown: summary.categoryBreakdown.map((item) => ({
        category: item.category,
        amount: item.amount,
        count: item.count,
      })),
      transactionIds: summary.transactionIds,
      netPaymentAmount: summary.netPaymentAmount,
      status: summary.status,
      createdAt: summary.createdAt.toISOString(),
      updatedAt: summary.updatedAt.toISOString(),
    };
  }

  /**
   * ドメインエンティティ→リスト項目DTO変換
   */
  private toListItemDto(
    summary: MonthlyCardSummary,
  ): MonthlyCardSummaryListItemDto {
    return {
      id: summary.id,
      cardId: summary.cardId,
      cardName: summary.cardName,
      billingMonth: summary.billingMonth,
      paymentDate: summary.paymentDate.toISOString(),
      totalAmount: summary.totalAmount,
      transactionCount: summary.transactionCount,
      netPaymentAmount: summary.netPaymentAmount,
      status: summary.status,
    };
  }
}
