import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import type { ITransactionCategoryChangeHistoryRepository } from '../../domain/repositories/transaction-category-change-history.repository.interface';
import { TRANSACTION_CATEGORY_CHANGE_HISTORY_REPOSITORY } from '../../domain/repositories/transaction-category-change-history.repository.interface';
import { TransactionCategoryChangeHistoryEntity } from '../../domain/entities/transaction-category-change-history.entity';
import { TransactionCategoryChangeHistoryOrmEntity } from '../../infrastructure/entities/transaction-category-change-history.orm-entity';
import { TransactionOrmEntity } from '../../infrastructure/entities/transaction.orm-entity';
import { CategoryType } from '@account-book/types';
import { v4 as uuidv4 } from 'uuid';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

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
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    @Inject(TRANSACTION_CATEGORY_CHANGE_HISTORY_REPOSITORY)
    private readonly historyRepository: ITransactionCategoryChangeHistoryRepository,
  ) {}

  async execute(dto: UpdateTransactionCategoryDto): Promise<TransactionEntity> {
    // トランザクション外で取引を取得
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

    // データベーストランザクションを使用して、
    // 変更履歴の作成と取引の更新をアトミックに実行
    return await this.dataSource.transaction(async (entityManager) => {
      // 変更履歴を記録
      const history = new TransactionCategoryChangeHistoryEntity(
        uuidv4(),
        transaction.id,
        oldCategory,
        dto.category,
        new Date(),
      );

      // トランザクション内で変更履歴を保存
      const historyRepo = entityManager.getRepository(
        TransactionCategoryChangeHistoryOrmEntity,
      );
      await historyRepo.save({
        id: history.id,
        transactionId: history.transactionId,
        oldCategoryId: history.oldCategory.id,
        oldCategoryName: history.oldCategory.name,
        oldCategoryType: history.oldCategory.type,
        newCategoryId: history.newCategory.id,
        newCategoryName: history.newCategory.name,
        newCategoryType: history.newCategory.type,
        changedAt: history.changedAt,
        changedBy: history.changedBy,
      });

      this.logger.log(
        `カテゴリ変更履歴を記録: ${history.getChangeDescription()}`,
      );

      // 取引を更新
      const transactionRepo = entityManager.getRepository(TransactionOrmEntity);
      await transactionRepo.save({
        id: updatedTransaction.id,
        date: updatedTransaction.date,
        amount: updatedTransaction.amount,
        categoryId: updatedTransaction.category.id,
        categoryName: updatedTransaction.category.name,
        categoryType: updatedTransaction.category.type,
        description: updatedTransaction.description,
        institutionId: updatedTransaction.institutionId,
        accountId: updatedTransaction.accountId,
        status: updatedTransaction.status,
        isReconciled: updatedTransaction.isReconciled,
        relatedTransactionId: updatedTransaction.relatedTransactionId,
        createdAt: updatedTransaction.createdAt,
        updatedAt: new Date(),
      });

      return updatedTransaction;
    });
  }
}
