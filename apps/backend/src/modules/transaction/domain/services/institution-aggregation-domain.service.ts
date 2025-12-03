import { Injectable } from '@nestjs/common';
import { CategoryType } from '@account-book/types';
import { TransactionEntity } from '../entities/transaction.entity';
import { InstitutionEntity } from '../../../institution/domain/entities/institution.entity';
import { AccountEntity } from '../../../institution/domain/entities/account.entity';

/**
 * InstitutionAggregationData Value Object
 * 金融機関別の集計データを表現
 */
export interface InstitutionAggregationData {
  totalIncome: number;
  totalExpense: number;
  periodBalance: number;
  transactionCount: number;
  transactions: TransactionEntity[];
}

/**
 * AccountAggregationData Value Object
 * 口座別の集計データを表現
 */
export interface AccountAggregationData {
  income: number;
  expense: number;
  periodBalance: number;
  transactionCount: number;
  transactions: TransactionEntity[];
}

/**
 * InstitutionAggregationDomainService
 * 金融機関別集計のドメインロジック
 */
@Injectable()
export class InstitutionAggregationDomainService {
  /**
   * 金融機関別に集計
   * @param transactions 取引リスト
   * @param institutions 金融機関リスト
   * @returns 金融機関IDをキーとした集計データのMap
   */
  aggregateByInstitution(
    transactions: TransactionEntity[],
    institutions: InstitutionEntity[],
  ): Map<string, InstitutionAggregationData> {
    const result = new Map<string, InstitutionAggregationData>();

    // 金融機関IDのセットを作成（存在確認用）
    const institutionIds = new Set(institutions.map((inst) => inst.id));

    // 各金融機関に対して初期化
    for (const institution of institutions) {
      result.set(institution.id, {
        totalIncome: 0,
        totalExpense: 0,
        periodBalance: 0,
        transactionCount: 0,
        transactions: [],
      });
    }

    // 取引を金融機関別に集計
    for (const transaction of transactions) {
      // 指定された金融機関の取引のみを処理
      if (!institutionIds.has(transaction.institutionId)) {
        continue;
      }

      const existing = result.get(transaction.institutionId);
      if (!existing) {
        continue;
      }

      existing.transactionCount += 1;
      existing.transactions.push(transaction);

      // 収入・支出を分類
      if (transaction.category.type === CategoryType.INCOME) {
        existing.totalIncome += transaction.amount;
      } else if (transaction.category.type === CategoryType.EXPENSE) {
        existing.totalExpense += Math.abs(transaction.amount);
      }

      // 期間内の収支差額を計算
      existing.periodBalance = existing.totalIncome - existing.totalExpense;
    }

    return result;
  }

  /**
   * 口座別に集計
   * @param transactions 取引リスト
   * @param accounts 口座リスト
   * @returns 口座IDをキーとした集計データのMap
   */
  aggregateByAccount(
    transactions: TransactionEntity[],
    accounts: AccountEntity[],
  ): Map<string, AccountAggregationData> {
    const result = new Map<string, AccountAggregationData>();

    // 口座IDのセットを作成（存在確認用）
    const accountIds = new Set(accounts.map((acc) => acc.id));

    // 各口座に対して初期化
    for (const account of accounts) {
      result.set(account.id, {
        income: 0,
        expense: 0,
        periodBalance: 0,
        transactionCount: 0,
        transactions: [],
      });
    }

    // 取引を口座別に集計
    for (const transaction of transactions) {
      // 指定された口座の取引のみを処理
      if (!accountIds.has(transaction.accountId)) {
        continue;
      }

      const existing = result.get(transaction.accountId);
      if (!existing) {
        continue;
      }

      existing.transactionCount += 1;
      existing.transactions.push(transaction);

      // 収入・支出を分類
      if (transaction.category.type === CategoryType.INCOME) {
        existing.income += transaction.amount;
      } else if (transaction.category.type === CategoryType.EXPENSE) {
        existing.expense += Math.abs(transaction.amount);
      }

      // 期間内の収支差額を計算
      existing.periodBalance = existing.income - existing.expense;
    }

    return result;
  }

  /**
   * 収支差額を計算
   * @param income 収入
   * @param expense 支出
   * @returns 収支差額（income - expense）
   */
  calculateInstitutionBalance(income: number, expense: number): number {
    return income - expense;
  }

  /**
   * 指定された金融機関IDの取引のみをフィルタリング
   * @param transactions 取引リスト
   * @param institutionIds 金融機関IDの配列（未指定の場合は全取引を返す）
   * @returns フィルタリングされた取引リスト
   */
  filterByInstitutionIds(
    transactions: TransactionEntity[],
    institutionIds?: string[],
  ): TransactionEntity[] {
    if (!institutionIds || institutionIds.length === 0) {
      return transactions;
    }

    const institutionIdSet = new Set(institutionIds);
    return transactions.filter((transaction) =>
      institutionIdSet.has(transaction.institutionId),
    );
  }
}
