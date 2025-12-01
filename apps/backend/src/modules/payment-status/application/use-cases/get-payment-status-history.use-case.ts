import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PaymentStatusRepository } from '../../domain/repositories/payment-status.repository.interface';
import { PAYMENT_STATUS_REPOSITORY } from '../../payment-status.tokens';
import { PaymentStatusHistory } from '../../domain/entities/payment-status-history.entity';

/**
 * 支払いステータス履歴取得 UseCase
 *
 * ステータス変更履歴を取得する
 */
@Injectable()
export class GetPaymentStatusHistoryUseCase {
  constructor(
    @Inject(PAYMENT_STATUS_REPOSITORY)
    private readonly paymentStatusRepository: PaymentStatusRepository,
  ) {}

  /**
   * ステータス変更履歴を取得
   *
   * @param cardSummaryId カード集計ID
   * @returns ステータス変更履歴
   */
  async execute(cardSummaryId: string): Promise<PaymentStatusHistory> {
    const history =
      await this.paymentStatusRepository.findHistoryByCardSummaryId(
        cardSummaryId,
      );

    if (history.statusChanges.length === 0) {
      throw new NotFoundException(
        `Payment status history not found: ${cardSummaryId}`,
      );
    }

    return history;
  }
}
