import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';

/**
 * 取引ID取得ユースケース
 * Issue #109: [TASK] E-3: 取引詳細画面の実装
 */
@Injectable()
export class GetTransactionByIdUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(id: string): Promise<TransactionEntity> {
    const transaction = await this.transactionRepository.findById(id);

    if (!transaction) {
      throw new NotFoundException({
        message: `取引ID ${id} が見つかりません`,
        code: 'TRANSACTION_NOT_FOUND',
      });
    }

    return transaction;
  }
}
