import { Inject, Injectable } from '@nestjs/common';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import { TransactionDomainService } from '../../domain/services/transaction-domain.service';
import { CategoryType } from '@account-book/types';

export interface MonthlySummary {
  year: number;
  month: number;
  income: number;
  expense: number;
  balance: number;
  byCategory: {
    [key in CategoryType]: {
      count: number;
      total: number;
    };
  };
  byInstitution: {
    [institutionId: string]: {
      count: number;
      total: number;
    };
  };
  transactionCount: number;
}

/**
 * 月次集計ユースケース
 */
@Injectable()
export class CalculateMonthlySummaryUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    private readonly transactionDomainService: TransactionDomainService,
  ) {}

  async execute(year: number, month: number): Promise<MonthlySummary> {
    const transactions = await this.transactionRepository.findByMonth(
      year,
      month,
    );

    // 収支計算
    const balance = this.transactionDomainService.calculateBalance(transactions);

    // カテゴリ別集計
    const categoryAggregation =
      this.transactionDomainService.aggregateByCategory(transactions);
    const byCategory: any = {};
    for (const [categoryType, data] of categoryAggregation.entries()) {
      byCategory[categoryType] = {
        count: data.count,
        total: data.total,
      };
    }

    // 金融機関別集計
    const institutionAggregation =
      this.transactionDomainService.aggregateByInstitution(transactions);
    const byInstitution: any = {};
    for (const [institutionId, data] of institutionAggregation.entries()) {
      byInstitution[institutionId] = {
        count: data.count,
        total: data.total,
      };
    }

    return {
      year,
      month,
      income: balance.income,
      expense: balance.expense,
      balance: balance.balance,
      byCategory,
      byInstitution,
      transactionCount: transactions.length,
    };
  }
}

