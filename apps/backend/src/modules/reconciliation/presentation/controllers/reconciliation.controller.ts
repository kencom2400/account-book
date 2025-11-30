import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  NotFoundException,
  UnprocessableEntityException,
  BadGatewayException,
  Inject,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReconcileCreditCardUseCase } from '../../application/use-cases/reconcile-credit-card.use-case';
import type { ReconciliationRepository } from '../../domain/repositories/reconciliation.repository.interface';
import { Reconciliation } from '../../domain/entities/reconciliation.entity';
import { ReconcileCreditCardRequestDto } from '../dto/reconcile-credit-card.dto';
import {
  ReconciliationResponseDto,
  ReconciliationListItemDto,
} from '../dto/reconciliation.dto';
import {
  CardSummaryNotFoundError,
  BankTransactionNotFoundError,
  InvalidPaymentDateError,
  MultipleCandidateError,
} from '../../domain/errors/reconciliation.errors';
import { RECONCILIATION_REPOSITORY } from '../../reconciliation.tokens';

/**
 * 照合コントローラー
 * クレジットカード引落額照合機能を提供
 */
@ApiTags('reconciliation')
@Controller('api/reconciliations')
export class ReconciliationController {
  constructor(
    private readonly reconcileCreditCardUseCase: ReconcileCreditCardUseCase,
    @Inject(RECONCILIATION_REPOSITORY)
    private readonly reconciliationRepository: ReconciliationRepository,
  ) {}

  /**
   * POST /api/reconciliations
   * クレジットカード照合を実行
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'クレジットカード照合を実行' })
  @ApiResponse({
    status: 201,
    description: '照合成功',
    type: ReconciliationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  @ApiResponse({ status: 404, description: 'カード請求データが見つからない' })
  @ApiResponse({ status: 422, description: '引落予定日が未来、複数候補' })
  @ApiResponse({ status: 502, description: '外部サービスへの接続失敗' })
  @ApiResponse({ status: 503, description: 'サービス一時利用不可' })
  async reconcileCreditCard(
    @Body() dto: ReconcileCreditCardRequestDto,
  ): Promise<{
    success: boolean;
    data: ReconciliationResponseDto;
  }> {
    try {
      const reconciliation = await this.reconcileCreditCardUseCase.execute(
        dto.cardId,
        dto.billingMonth,
      );

      return {
        success: true,
        data: this.toResponseDto(reconciliation),
      };
    } catch (error) {
      this.handleError(error);
      // handleErrorは常に例外をスローするため、ここには到達しない
    }
  }

  /**
   * GET /api/reconciliations
   * 照合結果一覧を取得
   */
  @Get()
  @ApiOperation({ summary: '照合結果一覧を取得' })
  @ApiResponse({
    status: 200,
    description: '取得成功',
    type: [ReconciliationListItemDto],
  })
  async listReconciliations(
    @Query('cardId') cardId?: string,
    @Query('billingMonth') billingMonth?: string,
    @Query('startMonth') startMonth?: string,
    @Query('endMonth') endMonth?: string,
  ): Promise<{
    success: boolean;
    data: ReconciliationListItemDto[];
  }> {
    let reconciliations: Reconciliation[];

    if (cardId && startMonth && endMonth) {
      reconciliations = await this.reconciliationRepository.findByCard(
        cardId,
        startMonth,
        endMonth,
      );
    } else if (cardId && billingMonth) {
      const reconciliation =
        await this.reconciliationRepository.findByCardAndMonth(
          cardId,
          billingMonth,
        );
      reconciliations = reconciliation ? [reconciliation] : [];
    } else if (cardId) {
      // cardIdのみの場合は全期間を取得
      reconciliations = await this.reconciliationRepository.findByCard(
        cardId,
        '',
        '',
      );
    } else {
      reconciliations = await this.reconciliationRepository.findAll();
    }

    return {
      success: true,
      data: reconciliations.map((r) => this.toListItemDto(r)),
    };
  }

  /**
   * GET /api/reconciliations/:id
   * 照合結果詳細を取得
   */
  @Get(':id')
  @ApiOperation({ summary: '照合結果詳細を取得' })
  @ApiResponse({
    status: 200,
    description: '取得成功',
    type: ReconciliationResponseDto,
  })
  @ApiResponse({ status: 404, description: '照合結果が見つからない' })
  async getReconciliation(@Param('id') id: string): Promise<{
    success: boolean;
    data: ReconciliationResponseDto;
  }> {
    const reconciliation = await this.reconciliationRepository.findById(id);

    if (!reconciliation) {
      throw new NotFoundException('照合結果が見つかりません');
    }

    return {
      success: true,
      data: this.toResponseDto(reconciliation),
    };
  }

  /**
   * エラーハンドリング
   */
  private handleError(error: unknown): never {
    if (error instanceof NotFoundException) {
      const innerError = (error as { cause?: unknown }).cause;
      if (innerError instanceof CardSummaryNotFoundError) {
        throw new NotFoundException({
          success: false,
          statusCode: 404,
          message: innerError.message,
          code: innerError.code,
          errors: [],
          ...innerError.details,
          timestamp: new Date().toISOString(),
          path: '/api/reconciliations',
        });
      }
      throw error;
    }

    if (error instanceof CardSummaryNotFoundError) {
      throw new NotFoundException({
        success: false,
        statusCode: 404,
        message: error.message,
        code: error.code,
        errors: [],
        ...error.details,
        timestamp: new Date().toISOString(),
        path: '/api/reconciliations',
      });
    }

    if (error instanceof BankTransactionNotFoundError) {
      throw new BadGatewayException({
        success: false,
        statusCode: 502,
        message: error.message,
        code: error.code,
        errors: [],
        ...error.details,
        timestamp: new Date().toISOString(),
        path: '/api/reconciliations',
      });
    }

    if (error instanceof InvalidPaymentDateError) {
      throw new UnprocessableEntityException({
        success: false,
        statusCode: 422,
        message: error.message,
        code: error.code,
        errors: [],
        ...error.details,
        timestamp: new Date().toISOString(),
        path: '/api/reconciliations',
      });
    }

    if (error instanceof MultipleCandidateError) {
      throw new UnprocessableEntityException({
        success: false,
        statusCode: 422,
        message: error.message,
        code: error.code,
        errors: [],
        ...error.details,
        timestamp: new Date().toISOString(),
        path: '/api/reconciliations',
      });
    }

    // その他のエラー
    throw error;
  }

  /**
   * ReconciliationエンティティをResponseDTOに変換
   */
  private toResponseDto(
    reconciliation: Reconciliation,
  ): ReconciliationResponseDto {
    return {
      id: reconciliation.id,
      cardId: reconciliation.cardId,
      billingMonth: reconciliation.billingMonth,
      status: reconciliation.status,
      executedAt: reconciliation.executedAt.toISOString(),
      results: reconciliation.results.map((r) => ({
        isMatched: r.isMatched,
        confidence: r.confidence,
        bankTransactionId: r.bankTransactionId,
        cardSummaryId: r.cardSummaryId,
        matchedAt: r.matchedAt?.toISOString() ?? null,
        discrepancy: r.discrepancy
          ? {
              amountDifference: r.discrepancy.amountDifference,
              dateDifference: r.discrepancy.dateDifference,
              descriptionMatch: r.discrepancy.descriptionMatch,
              reason: r.discrepancy.reason,
            }
          : null,
      })),
      summary: {
        total: reconciliation.summary.total,
        matched: reconciliation.summary.matched,
        unmatched: reconciliation.summary.unmatched,
        partial: reconciliation.summary.partial,
      },
      createdAt: reconciliation.createdAt.toISOString(),
      updatedAt: reconciliation.updatedAt.toISOString(),
    };
  }

  /**
   * ReconciliationエンティティをListItemDTOに変換
   */
  private toListItemDto(
    reconciliation: Reconciliation,
  ): ReconciliationListItemDto {
    return {
      id: reconciliation.id,
      cardId: reconciliation.cardId,
      billingMonth: reconciliation.billingMonth,
      status: reconciliation.status,
      executedAt: reconciliation.executedAt.toISOString(),
      summary: {
        total: reconciliation.summary.total,
        matched: reconciliation.summary.matched,
        unmatched: reconciliation.summary.unmatched,
        partial: reconciliation.summary.partial,
      },
      createdAt: reconciliation.createdAt.toISOString(),
      updatedAt: reconciliation.updatedAt.toISOString(),
    };
  }
}
