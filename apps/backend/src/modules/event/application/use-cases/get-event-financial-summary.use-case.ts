import { Inject, Injectable } from '@nestjs/common';
import { EventEntity } from '../../domain/entities/event.entity';
import type { IEventRepository } from '../../domain/repositories/event.repository.interface';
import { EVENT_REPOSITORY } from '../../domain/repositories/event.repository.interface';
import type { ITransactionRepository } from '../../../transaction/domain/repositories/transaction.repository.interface';
import { TRANSACTION_REPOSITORY } from '../../../transaction/domain/repositories/transaction.repository.interface';
import { TransactionEntity } from '../../../transaction/domain/entities/transaction.entity';
import { EventNotFoundException } from '../../domain/errors/event.errors';
import { CategoryType } from '@account-book/types';

/**
 * EventFinancialSummary
 * イベント別収支サマリーのApplication層データ構造
 */
export interface EventFinancialSummary {
  event: EventEntity;
  relatedTransactions: TransactionEntity[];
  totalIncome: number; // 総収入（円）
  totalExpense: number; // 総支出（円）
  netAmount: number; // 純収支（totalIncome - totalExpense）
  transactionCount: number; // 関連取引件数
}

/**
 * GetEventFinancialSummaryUseCase
 * イベント別収支サマリーを取得するユースケース
 */
@Injectable()
export class GetEventFinancialSummaryUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  /**
   * イベント別収支サマリーを取得
   */
  async execute(eventId: string): Promise<EventFinancialSummary> {
    // 1. イベント情報を取得
    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw new EventNotFoundException(eventId);
    }

    // 2. イベントに関連付けられた取引ID一覧を取得
    const transactionIds =
      await this.eventRepository.getTransactionIdsByEventId(eventId);

    // 3. 取引エンティティを取得
    const relatedTransactions: TransactionEntity[] =
      transactionIds.length > 0
        ? await this.transactionRepository.findByIds(transactionIds)
        : [];

    // 4. 収支を集計
    const summary = this.calculateSummary(relatedTransactions);

    // 5. サマリーを構築して返却
    return {
      event,
      relatedTransactions,
      totalIncome: summary.totalIncome,
      totalExpense: summary.totalExpense,
      netAmount: summary.netAmount,
      transactionCount: summary.transactionCount,
    };
  }

  /**
   * 収支を集計
   */
  private calculateSummary(transactions: TransactionEntity[]): {
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
    transactionCount: number;
  } {
    let totalIncome = 0;
    let totalExpense = 0;

    for (const transaction of transactions) {
      if (transaction.category.type === CategoryType.INCOME) {
        totalIncome += transaction.amount;
      } else if (transaction.category.type === CategoryType.EXPENSE) {
        // 支出は負の値として記録されている可能性があるため、絶対値を取る
        totalExpense += Math.abs(transaction.amount);
      }
      // TRANSFER、REPAYMENT、INVESTMENTは集計対象外
    }

    const netAmount = totalIncome - totalExpense;
    const transactionCount = transactions.length;

    return {
      totalIncome,
      totalExpense,
      netAmount,
      transactionCount,
    };
  }
}
