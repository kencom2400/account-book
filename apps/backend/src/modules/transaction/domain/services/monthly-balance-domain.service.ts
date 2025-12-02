import { Injectable } from '@nestjs/common';
import { TransactionEntity } from '../entities/transaction.entity';
import { TransactionDomainService } from './transaction-domain.service';

/**
 * BalanceResult Value Object
 */
export interface BalanceResult {
  income: number;
  expense: number;
  balance: number;
}

/**
 * AggregationData Value Object
 */
export interface AggregationData {
  total: number;
  count: number;
}

/**
 * MonthComparison Value Object
 */
export interface MonthComparison {
  incomeDiff: number;
  expenseDiff: number;
  balanceDiff: number;
  incomeChangeRate: number;
  expenseChangeRate: number;
}

/**
 * MonthlyBalanceDomainService
 * 月別収支集計のドメインロジック
 */
@Injectable()
export class MonthlyBalanceDomainService {
  constructor(
    private readonly transactionDomainService: TransactionDomainService,
  ) {}

  /**
   * 収入・支出・収支差額を計算
   */
  calculateBalance(transactions: TransactionEntity[]): BalanceResult {
    return this.transactionDomainService.calculateBalance(transactions);
  }

  /**
   * カテゴリID別に集計
   * @param transactions 取引リスト
   * @returns カテゴリIDをキーとした集計データのMap
   */
  aggregateByCategory(
    transactions: TransactionEntity[],
  ): Map<string, AggregationData> {
    const result = new Map<string, AggregationData>();

    for (const transaction of transactions) {
      const categoryId = transaction.category.id;
      const existing = result.get(categoryId) || {
        total: 0,
        count: 0,
      };

      existing.total += transaction.amount;
      existing.count += 1;

      result.set(categoryId, existing);
    }

    return result;
  }

  /**
   * 金融機関別に集計
   * @param transactions 取引リスト
   * @returns 金融機関IDをキーとした集計データのMap
   */
  aggregateByInstitution(
    transactions: TransactionEntity[],
  ): Map<string, AggregationData> {
    const result = new Map<string, AggregationData>();

    for (const transaction of transactions) {
      const institutionId = transaction.institutionId;
      const existing = result.get(institutionId) || {
        total: 0,
        count: 0,
      };

      existing.total += transaction.amount;
      existing.count += 1;

      result.set(institutionId, existing);
    }

    return result;
  }

  /**
   * 貯蓄率を計算
   * @param income 収入
   * @param expense 支出
   * @returns 貯蓄率（%）。incomeが0の場合は0を返す
   */
  calculateSavingsRate(income: number, expense: number): number {
    if (income === 0) {
      return 0;
    }
    const balance = income - expense;
    return (balance / income) * 100;
  }

  /**
   * 月次比較データを計算
   * @param current 当月の収支データ
   * @param previous 前月（または前年同月）の収支データ
   * @returns 月次比較データ
   */
  calculateMonthComparison(
    current: BalanceResult,
    previous: BalanceResult,
  ): MonthComparison {
    const incomeDiff = current.income - previous.income;
    const expenseDiff = current.expense - previous.expense;
    const balanceDiff = current.balance - previous.balance;

    const incomeChangeRate = this.calculateChangeRate(
      previous.income,
      current.income,
    );
    const expenseChangeRate = this.calculateChangeRate(
      previous.expense,
      current.expense,
    );

    return {
      incomeDiff,
      expenseDiff,
      balanceDiff,
      incomeChangeRate,
      expenseChangeRate,
    };
  }

  /**
   * 増減率を計算
   * @param previous 前の値
   * @param current 現在の値
   * @returns 増減率（%）。previousが0の場合は0を返す
   */
  calculateChangeRate(previous: number, current: number): number {
    if (previous === 0) {
      return 0;
    }
    return ((current - previous) / previous) * 100;
  }
}
