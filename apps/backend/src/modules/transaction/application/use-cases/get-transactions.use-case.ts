import { Inject, Injectable } from '@nestjs/common';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';

export interface GetTransactionsQuery {
  institutionId?: string;
  accountId?: string;
  year?: number;
  month?: number;
  startDate?: Date;
  endDate?: Date;
}

/**
 * 取引取得ユースケース
 */
@Injectable()
export class GetTransactionsUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(query: GetTransactionsQuery): Promise<TransactionEntity[]> {
    // 月指定がある場合
    if (query.year && query.month) {
      return await this.transactionRepository.findByMonth(
        query.year,
        query.month,
      );
    }

    // 年指定がある場合
    if (query.year) {
      return await this.transactionRepository.findByYear(query.year);
    }

    // 期間指定がある場合
    if (query.startDate && query.endDate) {
      return await this.transactionRepository.findByDateRange(
        query.startDate,
        query.endDate,
      );
    }

    // 金融機関IDで絞り込み
    if (query.institutionId) {
      return await this.transactionRepository.findByInstitutionId(
        query.institutionId,
      );
    }

    // 口座IDで絞り込み
    if (query.accountId) {
      return await this.transactionRepository.findByAccountId(query.accountId);
    }

    // すべての取引を取得
    return await this.transactionRepository.findAll();
  }
}
