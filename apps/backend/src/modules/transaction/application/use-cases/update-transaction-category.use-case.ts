import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import type { ITransactionCategoryChangeHistoryRepository } from '../../domain/repositories/transaction-category-change-history.repository.interface';
import { TRANSACTION_CATEGORY_CHANGE_HISTORY_REPOSITORY } from '../../domain/repositories/transaction-category-change-history.repository.interface';
import { TransactionCategoryChangeHistoryEntity } from '../../domain/entities/transaction-category-change-history.entity';
import { CategoryType } from '@account-book/types';
import { v4 as uuidv4 } from 'uuid';

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
 * FR-010: 費目の手動修正機能
 */
@Injectable()
export class UpdateTransactionCategoryUseCase {
  private readonly logger = new Logger(UpdateTransactionCategoryUseCase.name);

  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    @Inject(TRANSACTION_CATEGORY_CHANGE_HISTORY_REPOSITORY)
    private readonly historyRepository: ITransactionCategoryChangeHistoryRepository,
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

    const oldCategory = transaction.category;
    const updatedTransaction = transaction.updateCategory(dto.category);

    // 変更履歴を記録
    const history = new TransactionCategoryChangeHistoryEntity(
      uuidv4(),
      transaction.id,
      oldCategory,
      dto.category,
      new Date(),
    );

    await this.historyRepository.create(history);
    this.logger.log(
      `カテゴリ変更履歴を記録: ${history.getChangeDescription()}`,
    );

    return await this.transactionRepository.update(updatedTransaction);
  }
}
