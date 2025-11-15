import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import { CategoryType } from '@account-book/types';

export interface UpdateTransactionCategoryDto {
  transactionId: string;
  category: {
    id: string;
    name: string;
    type: CategoryType;
  };
}

/**
 * 取引カテゴリ更新ユースケース
 */
@Injectable()
export class UpdateTransactionCategoryUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(dto: UpdateTransactionCategoryDto): Promise<TransactionEntity> {
    const transaction = await this.transactionRepository.findById(
      dto.transactionId,
    );

    if (!transaction) {
      throw new NotFoundException(
        `Transaction with id ${dto.transactionId} not found`,
      );
    }

    const updatedTransaction = transaction.updateCategory(dto.category);
    return await this.transactionRepository.update(updatedTransaction);
  }
}

