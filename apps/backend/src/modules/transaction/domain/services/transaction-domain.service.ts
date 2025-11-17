import { Injectable } from '@nestjs/common';
import { CategoryType } from '@account-book/types';
import { TransactionEntity } from '../entities/transaction.entity';

/**
 * Transaction Domain Service
 * 複数のエンティティにまたがるビジネスロジックを実装
 */
@Injectable()
export class TransactionDomainService {
  /**
   * 取引のペアが振替として照合可能かどうかを判定
   */
  canReconcileAsTransfer(
    transaction1: TransactionEntity,
    transaction2: TransactionEntity,
  ): boolean {
    // 両方とも振替タイプであること
    if (
      transaction1.category.type !== CategoryType.TRANSFER ||
      transaction2.category.type !== CategoryType.TRANSFER
    ) {
      return false;
    }

    // 金額の絶対値が一致すること
    if (Math.abs(transaction1.amount) !== Math.abs(transaction2.amount)) {
      return false;
    }

    // 一方がプラス、他方がマイナスであること
    if (
      (transaction1.amount > 0 && transaction2.amount > 0) ||
      (transaction1.amount < 0 && transaction2.amount < 0)
    ) {
      return false;
    }

    // 同じ日付であること（または数日以内）
    const daysDiff = this.getDaysDifference(
      transaction1.date,
      transaction2.date,
    );
    if (daysDiff > 3) {
      return false;
    }

    return true;
  }

  /**
   * クレジットカード取引と銀行引落しの照合が可能かどうかを判定
   */
  canReconcileCreditCardPayment(
    cardTransactions: TransactionEntity[],
    bankWithdrawal: TransactionEntity,
  ): { canReconcile: boolean; totalAmount: number } {
    // 銀行引落しが振替タイプであること
    if (bankWithdrawal.category.type !== CategoryType.TRANSFER) {
      return { canReconcile: false, totalAmount: 0 };
    }

    // カード取引の合計金額を計算
    const totalAmount = cardTransactions.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0,
    );

    // 合計金額が銀行引落し額と一致するか
    const canReconcile =
      Math.abs(totalAmount - Math.abs(bankWithdrawal.amount)) < 0.01;

    return { canReconcile, totalAmount };
  }

  /**
   * 取引リストから期間の収支を計算
   */
  calculateBalance(transactions: TransactionEntity[]): {
    income: number;
    expense: number;
    balance: number;
  } {
    let income = 0;
    let expense = 0;

    for (const transaction of transactions) {
      switch (transaction.category.type) {
        case CategoryType.INCOME:
          income += transaction.amount;
          break;
        case CategoryType.EXPENSE:
          expense += Math.abs(transaction.amount);
          break;
        // 振替、返済、投資は収支計算に含めない
        default:
          break;
      }
    }

    return {
      income,
      expense,
      balance: income - expense,
    };
  }

  /**
   * 取引をカテゴリ別に集計
   */
  aggregateByCategory(transactions: TransactionEntity[]): Map<
    CategoryType,
    {
      count: number;
      total: number;
      transactions: TransactionEntity[];
    }
  > {
    const result = new Map<
      CategoryType,
      {
        count: number;
        total: number;
        transactions: TransactionEntity[];
      }
    >();

    for (const transaction of transactions) {
      const categoryType = transaction.category.type;
      const existing = result.get(categoryType) || {
        count: 0,
        total: 0,
        transactions: [],
      };

      existing.count += 1;
      existing.total += transaction.amount;
      existing.transactions.push(transaction);

      result.set(categoryType, existing);
    }

    return result;
  }

  /**
   * 取引を金融機関別に集計
   */
  aggregateByInstitution(transactions: TransactionEntity[]): Map<
    string,
    {
      count: number;
      total: number;
      transactions: TransactionEntity[];
    }
  > {
    const result = new Map<
      string,
      {
        count: number;
        total: number;
        transactions: TransactionEntity[];
      }
    >();

    for (const transaction of transactions) {
      const institutionId = transaction.institutionId;
      const existing = result.get(institutionId) || {
        count: 0,
        total: 0,
        transactions: [],
      };

      existing.count += 1;
      existing.total += transaction.amount;
      existing.transactions.push(transaction);

      result.set(institutionId, existing);
    }

    return result;
  }

  /**
   * 2つの日付の差を日数で返す
   */
  private getDaysDifference(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
