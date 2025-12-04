import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ITransactionCategoryChangeHistoryRepository } from '../../domain/repositories/transaction-category-change-history.repository.interface';
import { TransactionCategoryChangeHistoryEntity } from '../../domain/entities/transaction-category-change-history.entity';
import { TransactionCategoryChangeHistoryOrmEntity } from '../entities/transaction-category-change-history.orm-entity';

/**
 * 取引カテゴリ変更履歴リポジトリ実装
 * FR-010: 費目の手動修正機能
 */
@Injectable()
export class TransactionCategoryChangeHistoryRepository implements ITransactionCategoryChangeHistoryRepository {
  private readonly logger = new Logger(
    TransactionCategoryChangeHistoryRepository.name,
  );

  constructor(
    @InjectRepository(TransactionCategoryChangeHistoryOrmEntity)
    private readonly repository: Repository<TransactionCategoryChangeHistoryOrmEntity>,
  ) {}

  async create(
    history: TransactionCategoryChangeHistoryEntity,
  ): Promise<TransactionCategoryChangeHistoryEntity> {
    this.logger.debug(`変更履歴を保存: transaction=${history.transactionId}`);

    const ormEntity = this.repository.create({
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

    const saved = await this.repository.save(ormEntity);
    return this.toDomain(saved);
  }

  async findByTransactionId(
    transactionId: string,
  ): Promise<TransactionCategoryChangeHistoryEntity[]> {
    this.logger.debug(`変更履歴を取得: transaction=${transactionId}`);

    const ormEntities = await this.repository.find({
      where: { transactionId },
      order: { changedAt: 'DESC' },
    });

    return ormEntities.map((e) => this.toDomain(e));
  }

  async deleteAll(): Promise<void> {
    this.logger.debug('すべての変更履歴を削除');
    await this.repository.delete({});
  }

  private toDomain(
    ormEntity: TransactionCategoryChangeHistoryOrmEntity,
  ): TransactionCategoryChangeHistoryEntity {
    return new TransactionCategoryChangeHistoryEntity(
      ormEntity.id,
      ormEntity.transactionId,
      {
        id: ormEntity.oldCategoryId,
        name: ormEntity.oldCategoryName,
        type: ormEntity.oldCategoryType,
      },
      {
        id: ormEntity.newCategoryId,
        name: ormEntity.newCategoryName,
        type: ormEntity.newCategoryType,
      },
      ormEntity.changedAt,
      ormEntity.changedBy,
    );
  }
}
