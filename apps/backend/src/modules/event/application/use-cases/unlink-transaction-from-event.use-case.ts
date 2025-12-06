import { Inject, Injectable } from '@nestjs/common';
import type { IEventRepository } from '../../domain/repositories/event.repository.interface';
import { EVENT_REPOSITORY } from '../../domain/repositories/event.repository.interface';
import { EventNotFoundException } from '../../domain/errors/event.errors';

/**
 * UnlinkTransactionFromEventUseCase
 * 取引とイベントの紐付け解除のユースケース
 */
@Injectable()
export class UnlinkTransactionFromEventUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  /**
   * 取引とイベントの紐付けを解除
   */
  async execute(eventId: string, transactionId: string): Promise<void> {
    // イベントの存在確認
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new EventNotFoundException(eventId);
    }

    // 紐付け存在チェック（既に紐付けられているか）
    const transactionIds =
      await this.eventRepository.getTransactionIdsByEventId(eventId);
    if (!transactionIds.includes(transactionId)) {
      return; // 紐付けられていない場合は何もしない
    }

    // 紐付け解除を実行
    await this.eventRepository.unlinkTransaction(eventId, transactionId);
  }
}
