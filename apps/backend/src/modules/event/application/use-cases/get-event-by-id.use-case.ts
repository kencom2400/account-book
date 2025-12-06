import { Inject, Injectable } from '@nestjs/common';
import { EventEntity } from '../../domain/entities/event.entity';
import type { IEventRepository } from '../../domain/repositories/event.repository.interface';
import { EVENT_REPOSITORY } from '../../domain/repositories/event.repository.interface';
import type { ITransactionRepository } from '../../../transaction/domain/repositories/transaction.repository.interface';
import { TRANSACTION_REPOSITORY } from '../../../transaction/domain/repositories/transaction.repository.interface';
import { TransactionEntity } from '../../../transaction/domain/entities/transaction.entity';
import { EventNotFoundException } from '../../domain/errors/event.errors';

/**
 * GetEventByIdResult
 * イベント詳細取得の結果
 */
export interface GetEventByIdResult {
  event: EventEntity;
  relatedTransactions: TransactionEntity[];
}

/**
 * GetEventByIdUseCase
 * イベント詳細取得のユースケース
 */
@Injectable()
export class GetEventByIdUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  /**
   * イベント詳細を取得
   */
  async execute(id: string): Promise<GetEventByIdResult> {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new EventNotFoundException(id);
    }

    // 関連取引IDを取得
    const transactionIds =
      await this.eventRepository.getTransactionIdsByEventId(id);

    // 関連取引を一括取得（N+1クエリ問題を回避）
    const relatedTransactions: TransactionEntity[] =
      transactionIds.length > 0
        ? await this.transactionRepository.findByIds(transactionIds)
        : [];

    return {
      event,
      relatedTransactions,
    };
  }
}
