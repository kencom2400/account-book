import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Reconciliation } from '../../domain/entities/reconciliation.entity';
import { ReconciliationStatus } from '../../domain/enums/reconciliation-status.enum';
import { ReconciliationResult } from '../../domain/value-objects/reconciliation-result.vo';
import { ReconciliationSummary } from '../../domain/value-objects/reconciliation-summary.vo';
import { ReconciliationService } from '../../domain/services/reconciliation.service';
import type { ReconciliationRepository } from '../../domain/repositories/reconciliation.repository.interface';
import type { AggregationRepository } from '../../../aggregation/domain/repositories/aggregation.repository.interface';
import type { ITransactionRepository } from '../../../transaction/domain/repositories/transaction.repository.interface';
import { TransactionEntity } from '../../../transaction/domain/entities/transaction.entity';
import { CardSummaryNotFoundError } from '../../domain/errors/reconciliation.errors';
import { InvalidPaymentDateError } from '../../domain/errors/reconciliation.errors';
import { RECONCILIATION_REPOSITORY } from '../../reconciliation.tokens';
import { AGGREGATION_REPOSITORY } from '../../../aggregation/aggregation.tokens';
import { TRANSACTION_REPOSITORY } from '../../../transaction/domain/repositories/transaction.repository.interface';

/**
 * クレジットカード引落額照合 UseCase
 */
@Injectable()
export class ReconcileCreditCardUseCase {
  constructor(
    @Inject(RECONCILIATION_REPOSITORY)
    private readonly reconciliationRepository: ReconciliationRepository,
    @Inject(AGGREGATION_REPOSITORY)
    private readonly aggregationRepository: AggregationRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    private readonly reconciliationService: ReconciliationService,
  ) {}

  /**
   * クレジットカード引落額照合を実行
   */
  async execute(cardId: string, billingMonth: string): Promise<Reconciliation> {
    // 1. カード月別集計データ取得
    const cardSummary = await this.aggregationRepository.findByCardAndMonth(
      cardId,
      billingMonth,
    );

    if (!cardSummary) {
      throw new NotFoundException(
        new CardSummaryNotFoundError(cardId, billingMonth),
      );
    }

    // 2. 引落予定日が未来でないか確認
    const currentDate = new Date();
    if (cardSummary.paymentDate > currentDate) {
      throw new InvalidPaymentDateError(cardSummary.paymentDate, currentDate);
    }

    // 3. 引落予定日前後3営業日の銀行取引取得
    const bankTransactions = await this.fetchBankTransactions(
      cardSummary.paymentDate,
    );

    // 4. 照合処理実行
    const reconciliationResult = this.reconciliationService.reconcilePayment(
      cardSummary,
      bankTransactions,
    );

    // 5. 既存の照合結果を検索（Upsertロジック）
    const existingReconciliation =
      await this.reconciliationRepository.findByCardAndMonth(
        cardId,
        billingMonth,
      );

    // 6. 照合結果エンティティを作成
    const results = [reconciliationResult];
    const summary = ReconciliationSummary.calculateSummary(results);

    const reconciliation = new Reconciliation(
      existingReconciliation?.id ?? uuidv4(),
      cardId,
      billingMonth,
      this.determineStatus(reconciliationResult),
      new Date(),
      results,
      summary,
      existingReconciliation?.createdAt ?? new Date(),
      new Date(),
    );

    // 7. 照合結果を保存
    return await this.reconciliationRepository.save(reconciliation);
  }

  /**
   * 引落予定日前後3営業日の銀行取引を取得
   */
  private async fetchBankTransactions(
    paymentDate: Date,
  ): Promise<TransactionEntity[]> {
    // 営業日計算（±3営業日）
    const startDate = this.subtractBusinessDays(paymentDate, 3);
    const endDate = this.addBusinessDays(paymentDate, 3);

    return await this.transactionRepository.findByDateRange(startDate, endDate);
  }

  /**
   * 営業日を減算
   */
  private subtractBusinessDays(date: Date, days: number): Date {
    const currentDate = new Date(date);
    let remainingDays = days;

    while (remainingDays > 0) {
      currentDate.setDate(currentDate.getDate() - 1);

      if (this.isBusinessDay(currentDate)) {
        remainingDays--;
      }
    }

    return currentDate;
  }

  /**
   * 営業日を加算
   */
  private addBusinessDays(date: Date, days: number): Date {
    const currentDate = new Date(date);
    let remainingDays = days;

    while (remainingDays > 0) {
      currentDate.setDate(currentDate.getDate() + 1);

      if (this.isBusinessDay(currentDate)) {
        remainingDays--;
      }
    }

    return currentDate;
  }

  /**
   * 営業日かどうかを判定（土日を除外）
   */
  private isBusinessDay(date: Date): boolean {
    const dayOfWeek = date.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6; // 0=日曜日, 6=土曜日
  }

  /**
   * 照合結果からステータスを決定
   */
  private determineStatus(result: ReconciliationResult): ReconciliationStatus {
    if (result.isMatched && result.confidence === 100) {
      return ReconciliationStatus.MATCHED;
    }
    if (result.confidence === 70) {
      return ReconciliationStatus.PARTIAL;
    }
    return ReconciliationStatus.UNMATCHED;
  }
}
