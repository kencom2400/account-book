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
    const ormEntity: TransactionOrmEntity = new TransactionOrmEntity();
    ormEntity.id = domain.id;
    ormEntity.date = domain.date;
    ormEntity.amount = domain.amount;
    ormEntity.categoryId = domain.category.id;
    ormEntity.categoryName = domain.category.name;
    ormEntity.categoryType = domain.category.type;
    ormEntity.description = domain.description;
    ormEntity.institutionId = domain.institutionId;
    ormEntity.accountId = domain.accountId;
    ormEntity.status = domain.status;
    ormEntity.isReconciled = domain.isReconciled;
    ormEntity.relatedTransactionId = domain.relatedTransactionId;
    ormEntity.createdAt = domain.createdAt;
    ormEntity.updatedAt = domain.updatedAt;
    return ormEntity;
  }
}
