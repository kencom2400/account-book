import { Inject, Injectable } from '@nestjs/common';
import type { PaymentStatusRepository } from '../../domain/repositories/payment-status.repository.interface';
import { PAYMENT_STATUS_REPOSITORY } from '../../payment-status.tokens';
import { PaymentStatusRecord } from '../../domain/entities/payment-status-record.entity';

/**
 * 支払いステータス一括取得 UseCase
 *
 * 複数のカード集計IDに対応するステータス記録を一括取得する
 */
@Injectable()
export class GetPaymentStatusesUseCase {
  constructor(
    @Inject(PAYMENT_STATUS_REPOSITORY)
    private readonly paymentStatusRepository: PaymentStatusRepository,
  ) {}

  /**
   * 複数のカード集計IDに対応するステータス記録を一括取得
   *
   * @param cardSummaryIds カード集計IDの配列
   * @returns カード集計IDをキーとしたMap（存在しないIDは含まれない）
   */
  async execute(
    cardSummaryIds: string[],
  ): Promise<Map<string, PaymentStatusRecord>> {
    if (cardSummaryIds.length === 0) {
      return new Map<string, PaymentStatusRecord>();
    }

    return this.paymentStatusRepository.findByCardSummaryIds(cardSummaryIds);
  }
}
