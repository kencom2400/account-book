import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import type { ITransactionRepository } from '../../../transaction/domain/repositories/transaction.repository.interface';
import { TRANSACTION_REPOSITORY } from '../../../transaction/domain/repositories/transaction.repository.interface';
import type { ISubcategoryRepository } from '../../domain/repositories/subcategory.repository.interface';
import { SUB_CATEGORY_REPOSITORY } from '../../domain/repositories/subcategory.repository.interface';
import { TransactionCategoryChangeHistoryEntity } from '../../../transaction/domain/entities/transaction-category-change-history.entity';
import { TransactionCategoryChangeHistoryOrmEntity } from '../../../transaction/infrastructure/entities/transaction-category-change-history.orm-entity';
import { TransactionOrmEntity } from '../../../transaction/infrastructure/entities/transaction.orm-entity';
import { SubcategoryOrmEntity } from '../../infrastructure/entities/subcategory.orm-entity';
import { ClassificationReason } from '../../domain/enums/classification-reason.enum';

export interface UpdateTransactionSubcategoryDto {
  transactionId: string;
  subcategoryId: string;
}

export interface UpdateTransactionSubcategoryResult {
  transactionId: string;
  subcategoryId: string;
  confidence: number;
  reason: ClassificationReason;
  confirmedAt: Date;
}

/**
 * 取引サブカテゴリ更新ユースケース
 * FR-009: 詳細費目分類機能
 *
 * 取引のサブカテゴリを更新（手動分類）
 */
@Injectable()
export class UpdateTransactionSubcategoryUseCase {
  private readonly logger = new Logger(
    UpdateTransactionSubcategoryUseCase.name,
  );

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    @Inject(SUB_CATEGORY_REPOSITORY)
    private readonly subcategoryRepository: ISubcategoryRepository,
  ) {}

  /**
   * 取引のサブカテゴリを更新（手動分類）
   *
   * @param dto 更新DTO
   * @returns 更新結果
   */
  async execute(
    dto: UpdateTransactionSubcategoryDto,
  ): Promise<UpdateTransactionSubcategoryResult> {
    // トランザクション外でエンティティの存在確認を並列実行
    const [transaction, subcategory] = await Promise.all([
      this.transactionRepository.findById(dto.transactionId),
      this.subcategoryRepository.findById(dto.subcategoryId),
    ]);

    // 存在確認
    if (!transaction) {
      throw new NotFoundException(
        `Transaction not found with ID: ${dto.transactionId}`,
      );
    }
    if (!subcategory) {
      throw new NotFoundException(
        `Subcategory not found with ID: ${dto.subcategoryId}`,
      );
    }

    // カテゴリタイプの検証
    if (transaction.category.type !== subcategory.categoryType) {
      throw new BadRequestException(
        `Subcategory with type ${subcategory.categoryType} cannot be assigned to a transaction with type ${transaction.category.type}.`,
      );
    }

    // データベーストランザクションを使用して、
    // 変更履歴の作成と取引の更新をアトミックに実行
    return await this.dataSource.transaction(async (entityManager) => {
      // トランザクション内で取引を再取得（競合状態の防止）
      const transactionRepo = entityManager.getRepository(TransactionOrmEntity);
      const transactionOrm = await transactionRepo.findOne({
        where: { id: dto.transactionId },
      });

      if (!transactionOrm) {
        throw new NotFoundException(
          `Transaction not found with ID: ${dto.transactionId} within transaction`,
        );
      }

      // 古いサブカテゴリIDを取得（履歴記録用）
      const oldSubcategoryId = transactionOrm.subcategoryId || null;

      // 変更履歴を記録（サブカテゴリ変更の場合）
      if (oldSubcategoryId !== dto.subcategoryId) {
        // 古いサブカテゴリを取得（履歴記録用）
        // トランザクション内でentityManagerを使用して取得（トランザクションの一貫性を保証）
        const subcategoryRepo =
          entityManager.getRepository(SubcategoryOrmEntity);
        const oldSubcategoryOrm = oldSubcategoryId
          ? await subcategoryRepo.findOne({ where: { id: oldSubcategoryId } })
          : null;
        const oldSubcategory = oldSubcategoryOrm
          ? {
              id: oldSubcategoryOrm.id,
              name: oldSubcategoryOrm.name,
              categoryType: oldSubcategoryOrm.categoryType,
            }
          : null;

        const history = new TransactionCategoryChangeHistoryEntity(
          uuidv4(),
          transaction.id,
          {
            id: oldSubcategoryId || transaction.category.id,
            name: oldSubcategory?.name || transaction.category.name,
            type: transaction.category.type,
          },
          {
            id: dto.subcategoryId,
            name: subcategory.name,
            type: subcategory.categoryType,
          },
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
          `サブカテゴリ変更履歴を記録: ${history.getChangeDescription()}`,
        );
      }

      // 取引を更新
      // 手動分類時は必ずconfidence = 1.0, reason = MANUAL
      const confirmedAt = new Date();
      await transactionRepo.save({
        ...transactionOrm,
        subcategoryId: dto.subcategoryId,
        classificationConfidence: 1.0,
        classificationReason: ClassificationReason.MANUAL,
        confirmedAt: confirmedAt,
        updatedAt: new Date(),
      });

      return {
        transactionId: transaction.id,
        subcategoryId: dto.subcategoryId,
        confidence: 1.0,
        reason: ClassificationReason.MANUAL,
        confirmedAt: confirmedAt,
      };
    });
  }
}
