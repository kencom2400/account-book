import { Inject, Injectable } from '@nestjs/common';
import type { IEventRepository } from '../../domain/repositories/event.repository.interface';
import { EVENT_REPOSITORY } from '../../domain/repositories/event.repository.interface';
import type { ITransactionRepository } from '../../../transaction/domain/repositories/transaction.repository.interface';
import { TRANSACTION_REPOSITORY } from '../../../transaction/domain/repositories/transaction.repository.interface';

/**
 * LinkTransactionToEventUseCase
 * 取引とイベントの紐付けのユースケース
 */
@Injectable()
export class LinkTransactionToEventUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  /**
   * 取引とイベントを紐付け
   */
  async execute(eventId: string, transactionId: string): Promise<void> {
    // イベントの存在確認
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new Error(`Event with id ${eventId} not found`);
    }

    // 取引の存在確認
    const transaction =
      await this.transactionRepository.findById(transactionId);
    if (!transaction) {
      throw new Error(`Transaction with id ${transactionId} not found`);
    }

    // 紐付けを実行（重複チェックはEventTypeOrmRepository内で実施）
    await this.eventRepository.linkTransaction(eventId, transactionId);
  }
}
