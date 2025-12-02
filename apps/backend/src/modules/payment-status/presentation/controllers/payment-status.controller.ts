import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetPaymentStatusHistoryUseCase } from '../../application/use-cases/get-payment-status-history.use-case';
import { GetPaymentStatusesUseCase } from '../../application/use-cases/get-payment-statuses.use-case';
import { UpdatePaymentStatusUseCase } from '../../application/use-cases/update-payment-status.use-case';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import type { PaymentStatusRepository } from '../../domain/repositories/payment-status.repository.interface';
import { PAYMENT_STATUS_REPOSITORY } from '../../payment-status.tokens';
import { Inject } from '@nestjs/common';
import {
  PaymentStatusResponseDto,
  PaymentStatusHistoryResponseDto,
  toPaymentStatusResponseDto,
  toPaymentStatusHistoryResponseDto,
} from '../dto/payment-status.dto';
import { UpdatePaymentStatusRequestDto } from '../dto/update-payment-status.dto';

/**
 * 支払いステータス管理コントローラー
 * 支払いステータス管理APIを提供
 */
@ApiTags('payment-status')
@Controller('api/payment-status')
export class PaymentStatusController {
  constructor(
    private readonly updatePaymentStatusUseCase: UpdatePaymentStatusUseCase,
    private readonly getPaymentStatusHistoryUseCase: GetPaymentStatusHistoryUseCase,
    private readonly getPaymentStatusesUseCase: GetPaymentStatusesUseCase,
    @Inject(PAYMENT_STATUS_REPOSITORY)
    private readonly paymentStatusRepository: PaymentStatusRepository,
  ) {}

  /**
   * ステータスを手動更新
   */
  @Put(':cardSummaryId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ステータスを手動更新' })
  @ApiResponse({
    status: 200,
    description: 'ステータス更新成功',
  })
  @ApiResponse({
    status: 400,
    description: 'バリデーションエラー、無効なステータス遷移',
  })
  @ApiResponse({
    status: 404,
    description: '請求データが見つからない',
  })
  async updateStatus(
    @Param('cardSummaryId') cardSummaryId: string,
    @Body() request: UpdatePaymentStatusRequestDto,
  ): Promise<{ success: true; data: PaymentStatusResponseDto }> {
    const record = await this.updatePaymentStatusUseCase.executeManually(
      cardSummaryId,
      request.newStatus,
      'user',
      request.notes,
    );

    return {
      success: true,
      data: toPaymentStatusResponseDto(record),
    };
  }

  /**
   * 複数のカード集計IDに対応するステータス記録を一括取得
   */
  @Get()
  @ApiOperation({ summary: '複数のステータス記録を一括取得' })
  @ApiResponse({
    status: 200,
    description: 'ステータス一括取得成功',
  })
  async getStatuses(
    @Query('summaryIds') summaryIds: string,
  ): Promise<{ success: true; data: PaymentStatusResponseDto[] }> {
    // クエリパラメータを配列に変換（カンマ区切り）
    const cardSummaryIds = summaryIds
      ? summaryIds
          .split(',')
          .map((id) => id.trim())
          .filter((id) => id.length > 0)
      : [];

    const recordsMap =
      await this.getPaymentStatusesUseCase.execute(cardSummaryIds);

    // Mapを配列に変換
    const records = Array.from(recordsMap.values()).map((record) =>
      toPaymentStatusResponseDto(record),
    );

    return {
      success: true,
      data: records,
    };
  }

  /**
   * 現在のステータスを取得
   */
  @Get(':cardSummaryId')
  @ApiOperation({ summary: '現在のステータスを取得' })
  @ApiResponse({
    status: 200,
    description: 'ステータス取得成功',
  })
  @ApiResponse({
    status: 404,
    description: 'ステータス記録が見つからない',
  })
  async getStatus(
    @Param('cardSummaryId') cardSummaryId: string,
  ): Promise<{ success: true; data: PaymentStatusResponseDto }> {
    const record =
      await this.paymentStatusRepository.findByCardSummaryId(cardSummaryId);

    if (!record) {
      throw new Error(`Payment status not found: ${cardSummaryId}`);
    }

    return {
      success: true,
      data: toPaymentStatusResponseDto(record),
    };
  }

  /**
   * ステータス変更履歴を取得
   */
  @Get(':cardSummaryId/history')
  @ApiOperation({ summary: 'ステータス変更履歴を取得' })
  @ApiResponse({
    status: 200,
    description: '履歴取得成功',
  })
  @ApiResponse({
    status: 404,
    description: 'ステータス履歴が見つからない',
  })
  async getStatusHistory(
    @Param('cardSummaryId') cardSummaryId: string,
  ): Promise<{ success: true; data: PaymentStatusHistoryResponseDto }> {
    const history =
      await this.getPaymentStatusHistoryUseCase.execute(cardSummaryId);

    return {
      success: true,
      data: toPaymentStatusHistoryResponseDto(history),
    };
  }

  /**
   * 遷移可能なステータスリストを取得
   */
  @Get(':cardSummaryId/allowed-transitions')
  @ApiOperation({ summary: '遷移可能なステータスリストを取得' })
  @ApiResponse({
    status: 200,
    description: '遷移可能なステータスリスト取得成功',
  })
  @ApiResponse({
    status: 404,
    description: 'ステータス記録が見つからない',
  })
  async getAllowedTransitions(
    @Param('cardSummaryId') cardSummaryId: string,
  ): Promise<{
    success: true;
    data: {
      currentStatus: PaymentStatus;
      allowedTransitions: PaymentStatus[];
    };
  }> {
    const record =
      await this.paymentStatusRepository.findByCardSummaryId(cardSummaryId);

    if (!record) {
      throw new NotFoundException(`Payment status not found: ${cardSummaryId}`);
    }

    return {
      success: true,
      data: {
        currentStatus: record.status,
        allowedTransitions: record.getAllowedTransitions(),
      },
    };
  }
}
