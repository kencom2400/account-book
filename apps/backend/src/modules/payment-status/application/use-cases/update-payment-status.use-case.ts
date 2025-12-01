import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AggregationRepository } from '../../../aggregation/domain/repositories/aggregation.repository.interface';
import { AGGREGATION_REPOSITORY } from '../../../aggregation/aggregation.tokens';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import type { PaymentStatusRepository } from '../../domain/repositories/payment-status.repository.interface';
import { PAYMENT_STATUS_REPOSITORY } from '../../payment-status.tokens';
import { PaymentStatusRecord } from '../../domain/entities/payment-status-record.entity';

/**
 * 支払いステータス更新 UseCase
 *
 * 支払いステータスの更新を実行する（手動・自動両対応）
 */
@Injectable()
export class UpdatePaymentStatusUseCase {
  constructor(
    @Inject(PAYMENT_STATUS_REPOSITORY)
    private readonly paymentStatusRepository: PaymentStatusRepository,
    @Inject(AGGREGATION_REPOSITORY)
    private readonly aggregationRepository: AggregationRepository,
  ) {}

  /**
   * ステータスを更新（手動）
   *
   * @param cardSummaryId カード集計ID
   * @param newStatus 新しいステータス
   * @param updatedBy 更新者
   * @param notes ユーザー入力メモ（オプション）
   * @returns 更新されたステータス記録
   */
  async executeManually(
    cardSummaryId: string,
    newStatus: PaymentStatus,
    updatedBy: 'system' | 'user',
    notes?: string,
  ): Promise<PaymentStatusRecord> {
    const currentRecord = await this.getValidRecordForTransition(
      cardSummaryId,
      newStatus,
    );

    // ステータスを遷移
    const newRecord = currentRecord.transitionTo(
      newStatus,
      updatedBy,
      `手動更新: ${newStatus}`,
      notes,
    );

    // 保存
    return await this.paymentStatusRepository.save(newRecord);
  }

  /**
   * ステータスを更新（自動）
   *
   * @param cardSummaryId カード集計ID
   * @param newStatus 新しいステータス
   * @param reason ステータス変更理由
   * @param reconciliationId 照合ID（オプション）
   * @returns 更新されたステータス記録
   */
  async executeAutomatically(
    cardSummaryId: string,
    newStatus: PaymentStatus,
    reason: string,
    reconciliationId?: string,
  ): Promise<PaymentStatusRecord> {
    const currentRecord = await this.getValidRecordForTransition(
      cardSummaryId,
      newStatus,
    );

    // ステータスを遷移
    const newRecord = currentRecord.transitionTo(
      newStatus,
      'system',
      reason,
      undefined,
      reconciliationId,
    );

    // 保存
    return await this.paymentStatusRepository.save(newRecord);
  }

  /**
   * ステータス遷移のための有効なレコードを取得
   * （共通ロジックの抽出）
   *
   * @param cardSummaryId カード集計ID
   * @param newStatus 新しいステータス
   * @returns 有効なステータス記録
   * @throws NotFoundException 請求データが見つからない場合
   * @throws Error ステータス遷移が不可能な場合
   */
  private async getValidRecordForTransition(
    cardSummaryId: string,
    newStatus: PaymentStatus,
  ): Promise<PaymentStatusRecord> {
    // 請求データを取得
    const summary = await this.aggregationRepository.findById(cardSummaryId);
    if (!summary) {
      throw new NotFoundException(
        `Monthly card summary not found: ${cardSummaryId}`,
      );
    }

    // 現在のステータス記録を取得
    let currentRecord =
      await this.paymentStatusRepository.findByCardSummaryId(cardSummaryId);

    // ステータス記録が存在しない場合は初期ステータスを作成
    if (!currentRecord) {
      currentRecord = PaymentStatusRecord.createInitial(
        cardSummaryId,
        PaymentStatus.PENDING,
        'system',
        '初期ステータス',
      );
    }

    // ステータス遷移の検証
    if (!currentRecord.canTransitionTo(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentRecord.status} to ${newStatus}`,
      );
    }

    return currentRecord;
  }
}
