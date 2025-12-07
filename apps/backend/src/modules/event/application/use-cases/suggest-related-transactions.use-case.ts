import { Inject, Injectable } from '@nestjs/common';
import { EventCategory } from '../../domain/enums/event-category.enum';
import type { IEventRepository } from '../../domain/repositories/event.repository.interface';
import { EVENT_REPOSITORY } from '../../domain/repositories/event.repository.interface';
import type { ITransactionRepository } from '../../../transaction/domain/repositories/transaction.repository.interface';
import { TRANSACTION_REPOSITORY } from '../../../transaction/domain/repositories/transaction.repository.interface';
import { TransactionEntity } from '../../../transaction/domain/entities/transaction.entity';
import { EventNotFoundException } from '../../domain/errors/event.errors';

/**
 * SuggestedTransaction
 * 推奨取引のApplication層データ構造
 */
export interface SuggestedTransaction {
  transaction: TransactionEntity;
  score: number; // 推奨スコア（0-100）
  reasons: string[]; // 推奨理由の配列
}

/**
 * SuggestRelatedTransactionsUseCase
 * イベントに関連する取引を推奨するユースケース
 */
@Injectable()
export class SuggestRelatedTransactionsUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  /**
   * イベントに関連する取引を推奨
   */
  async execute(eventId: string): Promise<SuggestedTransaction[]> {
    // 1. イベント情報を取得
    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw new EventNotFoundException(eventId);
    }

    // 2. イベント日付の前後7日間の取引を取得
    const startDate = new Date(event.date);
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date(event.date);
    endDate.setDate(endDate.getDate() + 7);

    const transactions = await this.transactionRepository.findByDateRange(
      startDate,
      endDate,
    );

    // 3. イベントカテゴリに応じたフィルタリング
    const filteredTransactions = this.filterByCategory(
      transactions,
      event.category,
    );

    // 4. スコアリング
    const scoredTransactions = filteredTransactions.map((transaction) => {
      const scoreAndReasonParts = [
        this.calculateDateScore(transaction.date, event.date),
        this.calculateAmountScore(transaction.amount),
        this.calculateCategoryScore(transaction, event.category),
      ];

      const score = scoreAndReasonParts.reduce(
        (sum, part) => sum + part.score,
        0,
      );
      const reasons = scoreAndReasonParts
        .map((part) => part.reason)
        .filter((reason): reason is string => reason !== null);

      return {
        transaction,
        score,
        reasons,
      };
    });

    // 5. スコア順にソート
    scoredTransactions.sort((a, b) => b.score - a.score);

    // 6. 上位10件を返却
    return scoredTransactions.slice(0, 10);
  }

  /**
   * イベントカテゴリに応じたフィルタリング
   */
  private filterByCategory(
    transactions: TransactionEntity[],
    eventCategory: EventCategory,
  ): TransactionEntity[] {
    // OTHERカテゴリの場合はすべての取引を返す
    if (eventCategory === EventCategory.OTHER) {
      return transactions;
    }

    // 関連カテゴリ名のリストを取得
    const relatedCategoryNames = this.getRelatedCategoryNames(eventCategory);

    // 関連カテゴリ名に一致する取引をフィルタリング
    return transactions.filter((transaction) => {
      const categoryName = transaction.category.name.toLowerCase();
      return relatedCategoryNames.some((relatedName) =>
        categoryName.includes(relatedName.toLowerCase()),
      );
    });
  }

  /**
   * イベントカテゴリに関連する取引カテゴリ名のリストを取得
   */
  private getRelatedCategoryNames(eventCategory: EventCategory): string[] {
    const mapping: Record<EventCategory, string[]> = {
      [EventCategory.TRAVEL]: ['交通', '宿泊', '飲食', '娯楽'],
      [EventCategory.EDUCATION]: ['教育', '書籍', '文具'],
      [EventCategory.PURCHASE]: ['家具', '家電', '自動車', '住宅', '購入'],
      [EventCategory.MEDICAL]: ['医療', '薬', '健康診断'],
      [EventCategory.LIFE_EVENT]: ['結婚', '出産', '引越'],
      [EventCategory.INVESTMENT]: ['投資', '証券'],
      [EventCategory.OTHER]: [],
    };

    return mapping[eventCategory] || [];
  }

  /**
   * 日付の近さによるスコア（50点満点）
   */
  private calculateDateScore(
    transactionDate: Date,
    eventDate: Date,
  ): { score: number; reason: string | null } {
    const diffDays = Math.abs(
      Math.floor(
        (transactionDate.getTime() - eventDate.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );

    const scores = [50, 45, 40, 35, 30, 25, 20, 15];
    // トランザクションは既にイベント日付の前後7日以内にフィルタリングされているため、
    // diffDays <= 7は常にtrueとなる
    return {
      score: scores[diffDays],
      reason: `日付が近い（${diffDays}日差）`,
    };
  }

  /**
   * 金額の大きさによるスコア（30点満点）
   */
  private calculateAmountScore(amount: number): {
    score: number;
    reason: string | null;
  } {
    const absAmount = Math.abs(amount);
    const thresholds = [
      { limit: 100000, score: 30, reason: '高額取引（10万円以上）' },
      { limit: 50000, score: 25, reason: '高額取引（5万円以上）' },
      { limit: 30000, score: 20, reason: '高額取引（3万円以上）' },
      { limit: 10000, score: 15, reason: '高額取引（1万円以上）' },
      { limit: 5000, score: 10, reason: null },
    ];

    for (const threshold of thresholds) {
      if (absAmount >= threshold.limit) {
        return { score: threshold.score, reason: threshold.reason };
      }
    }
    return { score: 5, reason: null };
  }

  /**
   * カテゴリマッチによるスコア（20点満点）
   */
  private calculateCategoryScore(
    transaction: TransactionEntity,
    eventCategory: EventCategory,
  ): { score: number; reason: string | null } {
    // OTHERカテゴリの場合は5点
    if (eventCategory === EventCategory.OTHER) {
      return { score: 5, reason: null };
    }

    const categoryName = transaction.category.name.toLowerCase();
    const relatedCategoryNames = this.getRelatedCategoryNames(eventCategory);

    // 関連カテゴリ名に含まれる場合は20点
    if (
      relatedCategoryNames.some((relatedName) =>
        categoryName.includes(relatedName.toLowerCase()),
      )
    ) {
      return {
        score: 20,
        reason: `カテゴリが関連（${transaction.category.name}）`,
      };
    }

    // その他の場合は5点
    return { score: 5, reason: null };
  }
}
