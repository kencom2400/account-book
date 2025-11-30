import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type {
  ICreditCardRepository,
  ICreditCardTransactionRepository,
} from '../../../credit-card/domain/repositories/credit-card.repository.interface';
import {
  CREDIT_CARD_REPOSITORY,
  CREDIT_CARD_TRANSACTION_REPOSITORY,
} from '../../../credit-card/credit-card.tokens';
import { CreditCardTransactionEntity } from '../../../credit-card/domain/entities/credit-card-transaction.entity';
import { MonthlyCardSummary } from '../../domain/entities/monthly-card-summary.entity';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import type { AggregationRepository } from '../../domain/repositories/aggregation.repository.interface';
import { AGGREGATION_REPOSITORY } from '../../aggregation.tokens';
import { CategoryAmount } from '../../domain/value-objects/category-amount.vo';
import { BillingPeriodCalculator } from '../services/billing-period-calculator.service';

/**
 * カード利用明細の月別集計 UseCase
 *
 * 指定されたカードと期間の取引を取得し、締め日に基づいて請求月を判定し、月別に集計する
 */
@Injectable()
export class AggregateCardTransactionsUseCase {
  constructor(
    @Inject(CREDIT_CARD_REPOSITORY)
    private readonly creditCardRepository: ICreditCardRepository,
    @Inject(CREDIT_CARD_TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ICreditCardTransactionRepository,
    @Inject(AGGREGATION_REPOSITORY)
    private readonly aggregationRepository: AggregationRepository,
    private readonly billingPeriodCalculator: BillingPeriodCalculator,
  ) {}

  /**
   * カード利用明細を月別に集計
   *
   * @param cardId クレジットカードID
   * @param startMonth 集計開始月（YYYY-MM）
   * @param endMonth 集計終了月（YYYY-MM）
   * @returns 月別集計データの配列
   */
  async execute(
    cardId: string,
    startMonth: string,
    endMonth: string,
  ): Promise<MonthlyCardSummary[]> {
    // 1. カード情報取得
    const creditCard = await this.creditCardRepository.findById(cardId);
    if (!creditCard) {
      throw new NotFoundException(`Credit card not found: ${cardId}`);
    }

    // 2. 期間を日付範囲に変換
    const { startDate, endDate } = this.convertMonthRangeToDateRange(
      startMonth,
      endMonth,
    );

    // 3. 取引データ取得
    const transactions =
      await this.transactionRepository.findByCreditCardIdAndDateRange(
        cardId,
        startDate,
        endDate,
      );

    if (transactions.length === 0) {
      throw new NotFoundException(
        'No transactions found for the specified period',
      );
    }

    // 4. 取引を請求月別にグループ化
    const groupedByMonth = this.groupByBillingMonth(
      transactions,
      creditCard.closingDay,
    );

    // 5. 月別に集計
    const summaries: MonthlyCardSummary[] = [];
    for (const [billingMonth, monthTransactions] of groupedByMonth.entries()) {
      const summary = this.aggregateTransactions(
        creditCard.id,
        creditCard.cardName,
        billingMonth,
        creditCard.closingDay,
        creditCard.paymentDay,
        monthTransactions,
      );
      summaries.push(summary);
    }

    // 6. 集計結果を保存（既存データがあればUpsert）
    const existingSummaries = await this.aggregationRepository.findByCard(
      creditCard.id,
      startMonth,
      endMonth,
    );
    const existingSummariesMap = new Map(
      existingSummaries.map((s) => [s.billingMonth, s]),
    );

    const summariesToSave = summaries.map((summary) => {
      const existing = existingSummariesMap.get(summary.billingMonth);
      if (existing) {
        // 既存データのIDを引き継いで更新
        return new MonthlyCardSummary(
          existing.id, // 既存IDを使用
          summary.cardId,
          summary.cardName,
          summary.billingMonth,
          summary.closingDate,
          summary.paymentDate,
          summary.totalAmount,
          summary.transactionCount,
          summary.categoryBreakdown,
          summary.transactionIds,
          summary.netPaymentAmount,
          summary.status,
          existing.createdAt, // createdAtは保持
          new Date(), // updatedAtは更新
        );
      }
      // 新規作成
      return summary;
    });

    // 一括保存
    if (summariesToSave.length > 0) {
      await Promise.all(
        summariesToSave.map((s) => this.aggregationRepository.save(s)),
      );
    }

    // 7. 請求月順にソート（昇順）
    summariesToSave.sort((a, b) =>
      a.billingMonth.localeCompare(b.billingMonth),
    );

    return summariesToSave;
  }

  /**
   * YYYY-MM形式の月範囲を日付範囲に変換
   */
  private convertMonthRangeToDateRange(
    startMonth: string,
    endMonth: string,
  ): { startDate: Date; endDate: Date } {
    const [startYear, startMonthNum] = startMonth.split('-').map(Number);
    const [endYear, endMonthNum] = endMonth.split('-').map(Number);

    // 開始月の1日
    const startDate = new Date(startYear, startMonthNum - 1, 1);

    // 終了月の最終日
    const endDate = new Date(endYear, endMonthNum, 0, 23, 59, 59, 999);

    return { startDate, endDate };
  }

  /**
   * 取引を請求月別にグループ化
   */
  private groupByBillingMonth(
    transactions: CreditCardTransactionEntity[],
    closingDay: number,
  ): Map<string, CreditCardTransactionEntity[]> {
    const grouped = new Map<string, CreditCardTransactionEntity[]>();

    for (const transaction of transactions) {
      const billingMonth = this.billingPeriodCalculator.determineBillingMonth(
        transaction.transactionDate,
        closingDay,
      );

      if (!grouped.has(billingMonth)) {
        grouped.set(billingMonth, []);
      }
      grouped.get(billingMonth)!.push(transaction);
    }

    return grouped;
  }

  /**
   * 月別に取引を集計
   */
  private aggregateTransactions(
    cardId: string,
    cardName: string,
    billingMonth: string,
    closingDay: number,
    paymentDay: number,
    transactions: CreditCardTransactionEntity[],
  ): MonthlyCardSummary {
    // カテゴリ別集計
    const categoryMap = new Map<string, { amount: number; count: number }>();
    let totalAmount = 0;

    for (const transaction of transactions) {
      totalAmount += transaction.amount;

      const category = transaction.category || 'その他';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { amount: 0, count: 0 });
      }
      const categoryData = categoryMap.get(category)!;
      categoryData.amount += transaction.amount;
      categoryData.count += 1;
    }

    // CategoryAmountに変換
    const categoryBreakdown: CategoryAmount[] = [];
    for (const [category, data] of categoryMap.entries()) {
      categoryBreakdown.push(
        new CategoryAmount(category, data.amount, data.count),
      );
    }

    // 締め日・支払日を算出
    const closingDate = this.billingPeriodCalculator.calculateClosingDate(
      billingMonth,
      closingDay,
    );
    const paymentDate = this.billingPeriodCalculator.calculatePaymentDate(
      closingDate,
      paymentDay,
    );

    // 取引IDリスト
    const transactionIds = transactions.map((t) => t.id);

    // 最終支払額（FR-012では割引未実装のため、totalAmountと同額）
    const netPaymentAmount = totalAmount;

    // エンティティ作成
    const now = new Date();
    return new MonthlyCardSummary(
      uuidv4(),
      cardId,
      cardName,
      billingMonth,
      closingDate,
      paymentDate,
      totalAmount,
      transactions.length,
      categoryBreakdown,
      transactionIds,
      netPaymentAmount,
      PaymentStatus.PENDING,
      now,
      now,
    );
  }
}
