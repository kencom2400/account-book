import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, EntityManager } from 'typeorm';
import { TransactionOrmEntity } from '../entities/transaction.orm-entity';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { CategoryType } from '@account-book/types';

/**
 * TransactionTypeOrmRepository
 * TypeORMを使用した取引リポジトリの実装
 */
@Injectable()
export class TransactionTypeOrmRepository implements ITransactionRepository {
  constructor(
    @InjectRepository(TransactionOrmEntity)
    private readonly repository: Repository<TransactionOrmEntity>,
  ) {}

  /**
   * IDで取引を取得
   */
  async findById(id: string): Promise<TransactionEntity | null> {
    const ormEntity: TransactionOrmEntity | null =
      await this.repository.findOne({
        where: { id },
      });

    if (!ormEntity) {
      return null;
    }

    return this.toDomain(ormEntity);
  }

  /**
   * すべての取引を取得
   */
  async findAll(): Promise<TransactionEntity[]> {
    const ormEntities: TransactionOrmEntity[] = await this.repository.find({
      order: { date: 'DESC' },
    });

    return ormEntities.map((entity: TransactionOrmEntity) =>
      this.toDomain(entity),
    );
  }

  /**
   * 金融機関IDで取引を取得
   */
  async findByInstitutionId(
    institutionId: string,
  ): Promise<TransactionEntity[]> {
    const ormEntities: TransactionOrmEntity[] = await this.repository.find({
      where: { institutionId },
      order: { date: 'DESC' },
    });

    return ormEntities.map((entity: TransactionOrmEntity) =>
      this.toDomain(entity),
    );
  }

  /**
   * 口座IDで取引を取得
   */
  async findByAccountId(accountId: string): Promise<TransactionEntity[]> {
    const ormEntities: TransactionOrmEntity[] = await this.repository.find({
      where: { accountId },
      order: { date: 'DESC' },
    });

    return ormEntities.map((entity: TransactionOrmEntity) =>
      this.toDomain(entity),
    );
  }

  /**
   * 期間で取引を取得
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<TransactionEntity[]> {
    const ormEntities: TransactionOrmEntity[] = await this.repository.find({
      where: {
        date: Between(startDate, endDate),
      },
      order: { date: 'DESC' },
    });

    return ormEntities.map((entity: TransactionOrmEntity) =>
      this.toDomain(entity),
    );
  }

  /**
   * カテゴリタイプと期間で取引を取得
   */
  async findByCategoryType(
    categoryType: CategoryType,
    startDate: Date,
    endDate: Date,
  ): Promise<TransactionEntity[]> {
    const ormEntities: TransactionOrmEntity[] = await this.repository.find({
      where: {
        categoryType,
        date: Between(startDate, endDate),
      },
      order: { date: 'DESC' },
    });

    return ormEntities.map((entity: TransactionOrmEntity) =>
      this.toDomain(entity),
    );
  }

  /**
   * カテゴリIDの配列と期間で取引を取得
   */
  async findByCategoryIdsAndDateRange(
    categoryIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<TransactionEntity[]> {
    if (categoryIds.length === 0) {
      return [];
    }

    const ormEntities: TransactionOrmEntity[] = await this.repository.find({
      where: {
        categoryId: In(categoryIds),
        date: Between(startDate, endDate),
      },
      order: { date: 'DESC' },
    });

    return ormEntities.map((entity: TransactionOrmEntity) =>
      this.toDomain(entity),
    );
  }

  /**
   * 金融機関IDと期間で取引を取得
   */
  async findByInstitutionIdsAndDateRange(
    institutionIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<TransactionEntity[]> {
    if (institutionIds.length === 0) {
      return [];
    }

    const ormEntities: TransactionOrmEntity[] = await this.repository.find({
      where: {
        institutionId: In(institutionIds),
        date: Between(startDate, endDate),
      },
      order: { date: 'DESC' },
    });

    return ormEntities.map((entity: TransactionOrmEntity) =>
      this.toDomain(entity),
    );
  }

  /**
   * 月で取引を取得
   */
  async findByMonth(year: number, month: number): Promise<TransactionEntity[]> {
    const startDate: Date = new Date(year, month - 1, 1);
    const endDate: Date = new Date(year, month, 0, 23, 59, 59, 999);

    return this.findByDateRange(startDate, endDate);
  }

  /**
   * 年で取引を取得
   */
  async findByYear(year: number): Promise<TransactionEntity[]> {
    const startDate: Date = new Date(year, 0, 1);
    const endDate: Date = new Date(year, 11, 31, 23, 59, 59, 999);

    return this.findByDateRange(startDate, endDate);
  }

  /**
   * 照合が必要な取引を取得（振替で未照合）
   */
  async findUnreconciledTransfers(): Promise<TransactionEntity[]> {
    const ormEntities: TransactionOrmEntity[] = await this.repository.find({
      where: {
        categoryType: CategoryType.TRANSFER,
        isReconciled: false,
      },
      order: { date: 'DESC' },
    });

    return ormEntities.map((entity: TransactionOrmEntity) =>
      this.toDomain(entity),
    );
  }

  /**
   * 取引を保存
   */
  async save(transaction: TransactionEntity): Promise<TransactionEntity> {
    const ormEntity: TransactionOrmEntity = this.toOrm(transaction);
    const saved: TransactionOrmEntity = await this.repository.save(ormEntity);
    return this.toDomain(saved);
  }

  /**
   * 複数の取引を一括保存
   */
  async saveMany(
    transactions: TransactionEntity[],
  ): Promise<TransactionEntity[]> {
    const ormEntities: TransactionOrmEntity[] = transactions.map(
      (transaction: TransactionEntity) => this.toOrm(transaction),
    );
    const saved: TransactionOrmEntity[] =
      await this.repository.save(ormEntities);
    return saved.map((entity: TransactionOrmEntity) => this.toDomain(entity));
  }

  /**
   * 取引を更新
   */
  async update(transaction: TransactionEntity): Promise<TransactionEntity> {
    return this.save(transaction);
  }

  /**
   * 取引を削除
   */
  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * 金融機関IDで取引を一括削除
   */
  async deleteByInstitutionId(
    institutionId: string,
    manager?: unknown,
  ): Promise<void> {
    const repository = manager
      ? (manager as EntityManager).getRepository(TransactionOrmEntity)
      : this.repository;
    await repository.delete({ institutionId });
  }

  /**
   * すべての取引を削除（テスト用）
   */
  async deleteAll(): Promise<void> {
    await this.repository.delete({});
  }

  /**
   * ORM→ドメインエンティティ変換
   */
  private toDomain(ormEntity: TransactionOrmEntity): TransactionEntity {
    return new TransactionEntity(
      ormEntity.id,
      ormEntity.date,
      Number(ormEntity.amount),
      {
        id: ormEntity.categoryId,
        name: ormEntity.categoryName,
        type: ormEntity.categoryType,
      },
      ormEntity.description,
      ormEntity.institutionId,
      ormEntity.accountId,
      ormEntity.status,
      ormEntity.isReconciled,
      ormEntity.relatedTransactionId,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  /**
   * ドメインエンティティ→ORM変換
   */
  private toOrm(domain: TransactionEntity): TransactionOrmEntity {
    return this.repository.create({
      id: domain.id,
      date: domain.date,
      amount: domain.amount,
      categoryId: domain.category.id,
      categoryName: domain.category.name,
      categoryType: domain.category.type,
      description: domain.description,
      institutionId: domain.institutionId,
      accountId: domain.accountId,
      status: domain.status,
      isReconciled: domain.isReconciled,
      relatedTransactionId: domain.relatedTransactionId,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    });
  }
}
