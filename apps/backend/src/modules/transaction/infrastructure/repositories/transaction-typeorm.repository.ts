import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionOrmEntity } from '../entities/transaction.orm-entity';
import { TransactionEntity } from '../../domain/entities/transaction.entity';

/**
 * TransactionTypeOrmRepository
 * TypeORMを使用したトランザクションリポジトリの実装
 */
@Injectable()
export class TransactionTypeOrmRepository {
  constructor(
    @InjectRepository(TransactionOrmEntity)
    private readonly repository: Repository<TransactionOrmEntity>,
  ) {}

  /**
   * すべてのトランザクションを取得
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
   * IDでトランザクションを取得
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
   * 金融機関IDでトランザクションを取得
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
   * 期間でトランザクションを取得
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<TransactionEntity[]> {
    const ormEntities: TransactionOrmEntity[] = await this.repository
      .createQueryBuilder('transaction')
      .where('transaction.date >= :startDate', { startDate })
      .andWhere('transaction.date <= :endDate', { endDate })
      .orderBy('transaction.date', 'DESC')
      .getMany();

    return ormEntities.map((entity: TransactionOrmEntity) =>
      this.toDomain(entity),
    );
  }

  /**
   * カテゴリでトランザクションを取得
   */
  async findByCategoryId(categoryId: string): Promise<TransactionEntity[]> {
    const ormEntities: TransactionOrmEntity[] = await this.repository.find({
      where: { categoryId },
      order: { date: 'DESC' },
    });

    return ormEntities.map((entity: TransactionOrmEntity) =>
      this.toDomain(entity),
    );
  }

  /**
   * トランザクションを保存
   */
  async save(transaction: TransactionEntity): Promise<TransactionEntity> {
    const ormEntity: TransactionOrmEntity = this.toOrm(transaction);
    const saved: TransactionOrmEntity = await this.repository.save(ormEntity);
    return this.toDomain(saved);
  }

  /**
   * トランザクションを削除
   */
  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * ORM→ドメインエンティティ変換
   */
  private toDomain(ormEntity: TransactionOrmEntity): TransactionEntity {
    return new TransactionEntity(
      ormEntity.id,
      ormEntity.date,
      ormEntity.amount,
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
