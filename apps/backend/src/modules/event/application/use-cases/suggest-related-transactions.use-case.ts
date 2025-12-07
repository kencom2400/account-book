import { Inject, Injectable } from '@nestjs/common';
import { EventEntity } from '../../domain/entities/event.entity';
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
      const score = this.calculateScore(transaction, event);
      const reasons = this.generateReasons(transaction, event, score);
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
      [EventCategory.TRAVEL]: [
        '交通費',
        '宿泊費',
        '飲食費',
        '娯楽費',
        '交通',
        '宿泊',
        '飲食',
        '娯楽',
      ],
      [EventCategory.EDUCATION]: [
        '教育費',
        '書籍費',
        '文具費',
        '教育',
        '書籍',
        '文具',
      ],
      [EventCategory.PURCHASE]: ['家具', '家電', '自動車', '住宅', '購入'],
      [EventCategory.MEDICAL]: [
        '医療費',
        '薬代',
        '健康診断費',
        '医療',
        '薬',
        '健康診断',
      ],
      [EventCategory.LIFE_EVENT]: [
        '結婚式',
        '出産',
        '引越し',
        '結婚',
        '出産',
        '引越',
      ],
      [EventCategory.INVESTMENT]: ['投資', '証券', '投資関連', '証券関連'],
      [EventCategory.OTHER]: [],
    };

    return mapping[eventCategory] || [];
  }

  /**
   * スコアを計算
   */
  private calculateScore(
    transaction: TransactionEntity,
    event: EventEntity,
  ): number {
    const dateScore = this.calculateDateScore(transaction.date, event.date);
    const amountScore = this.calculateAmountScore(transaction.amount);
    const categoryScore = this.calculateCategoryScore(
      transaction,
      event.category,
    );

    return dateScore + amountScore + categoryScore;
  }

  /**
   * 日付の近さによるスコア（50点満点）
   */
  private calculateDateScore(transactionDate: Date, eventDate: Date): number {
    const diffDays = Math.abs(
      Math.floor(
        (transactionDate.getTime() - eventDate.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );

    if (diffDays === 0) return 50;
    if (diffDays === 1) return 45;
    if (diffDays === 2) return 40;
    if (diffDays === 3) return 35;
    if (diffDays === 4) return 30;
    if (diffDays === 5) return 25;
    if (diffDays === 6) return 20;
    if (diffDays === 7) return 15;
    return 0;
  }

  /**
   * 金額の大きさによるスコア（30点満点）
   */
  private calculateAmountScore(amount: number): number {
    const absAmount = Math.abs(amount);

    if (absAmount >= 100000) return 30;
    if (absAmount >= 50000) return 25;
    if (absAmount >= 30000) return 20;
    if (absAmount >= 10000) return 15;
    if (absAmount >= 5000) return 10;
    return 5;
  }

  /**
   * カテゴリマッチによるスコア（20点満点）
   */
  private calculateCategoryScore(
    transaction: TransactionEntity,
    eventCategory: EventCategory,
  ): number {
    // OTHERカテゴリの場合は5点
    if (eventCategory === EventCategory.OTHER) {
      return 5;
    }

    const categoryName = transaction.category.name.toLowerCase();
    const relatedCategoryNames = this.getRelatedCategoryNames(eventCategory);

    // 完全一致チェック（イベントカテゴリ名と取引カテゴリ名が一致する場合）
    // これは実装が複雑になるため、関連カテゴリ名に含まれる場合は15点とする
    // 完全一致の判定は将来的に拡張可能

    // 関連カテゴリ名に含まれる場合は15点
    if (
      relatedCategoryNames.some((relatedName) =>
        categoryName.includes(relatedName.toLowerCase()),
      )
    ) {
      return 15;
    }

    // その他の場合は5点
    return 5;
  }

  /**
   * 推奨理由を生成
   */
  private generateReasons(
    transaction: TransactionEntity,
    event: EventEntity,
    _score: number,
  ): string[] {
    const reasons: string[] = [];

    // 日付の近さ
    const diffDays = Math.abs(
      Math.floor(
        (transaction.date.getTime() - event.date.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );
    if (diffDays <= 7) {
      reasons.push(`日付が近い（${diffDays}日差）`);
    }

    // 金額の大きさ
    const absAmount = Math.abs(transaction.amount);
    if (absAmount >= 100000) {
      reasons.push('高額取引（10万円以上）');
    } else if (absAmount >= 50000) {
      reasons.push('高額取引（5万円以上）');
    } else if (absAmount >= 30000) {
      reasons.push('高額取引（3万円以上）');
    } else if (absAmount >= 10000) {
      reasons.push('高額取引（1万円以上）');
    }

    // カテゴリマッチ
    const categoryScore = this.calculateCategoryScore(
      transaction,
      event.category,
    );
    if (categoryScore >= 15) {
      reasons.push(`カテゴリが関連（${transaction.category.name}）`);
    }

    return reasons;
  }
}
