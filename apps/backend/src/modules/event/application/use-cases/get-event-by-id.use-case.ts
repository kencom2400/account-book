import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IEventRepository } from '../../domain/repositories/event.repository.interface';
import { EVENT_REPOSITORY } from '../../domain/repositories/event.repository.interface';
import type { ITransactionRepository } from '../../../transaction/domain/repositories/transaction.repository.interface';
import { TRANSACTION_REPOSITORY } from '../../../transaction/domain/repositories/transaction.repository.interface';
import { TransactionEntity } from '../../../transaction/domain/entities/transaction.entity';

/**
 * EventResponseDto
 * イベント詳細取得のレスポンスDTO
 */
export interface EventResponseDto {
  id: string;
  date: Date;
  title: string;
  description: string | null;
  category: string;
  tags: string[];
  relatedTransactions: TransactionEntity[];
  createdAt: Date;
  updatedAt: Date;
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
  async execute(id: string): Promise<EventResponseDto> {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    // 関連取引IDを取得
    const transactionIds =
      await this.eventRepository.getTransactionIdsByEventId(id);

    // 関連取引を取得
    const relatedTransactions: TransactionEntity[] = [];
    if (transactionIds.length > 0) {
      for (const transactionId of transactionIds) {
        const transaction =
          await this.transactionRepository.findById(transactionId);
        if (transaction) {
          relatedTransactions.push(transaction);
        }
      }
    }

    return {
      id: event.id,
      date: event.date,
      title: event.title,
      description: event.description,
      category: event.category,
      tags: event.tags,
      relatedTransactions,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }
}
