import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, EntityManager } from 'typeorm';
import { SecurityTransactionOrmEntity } from '../entities/security-transaction.orm-entity';
import { SecurityTransactionEntity } from '../../domain/entities/security-transaction.entity';
import { ISecurityTransactionRepository } from '../../domain/repositories/securities.repository.interface';

/**
 * SecurityTransactionTypeOrmRepository
 * TypeORMを使用した証券取引リポジトリの実装
 */
@Injectable()
export class SecurityTransactionTypeOrmRepository
  implements ISecurityTransactionRepository
{
  constructor(
    @InjectRepository(SecurityTransactionOrmEntity)
    private readonly repository: Repository<SecurityTransactionOrmEntity>,
  ) {}

  async create(
    transaction: SecurityTransactionEntity,
    manager?: EntityManager,
  ): Promise<void> {
    const repository: Repository<SecurityTransactionOrmEntity> = manager
      ? manager.getRepository(SecurityTransactionOrmEntity)
      : this.repository;
    const ormEntity: SecurityTransactionOrmEntity = this.toOrm(transaction);
    await repository.save(ormEntity);
  }

  async findById(
    id: string,
    manager?: EntityManager,
  ): Promise<SecurityTransactionEntity | null> {
    const repository: Repository<SecurityTransactionOrmEntity> = manager
      ? manager.getRepository(SecurityTransactionOrmEntity)
      : this.repository;
    const ormEntity: SecurityTransactionOrmEntity | null =
      await repository.findOne({
        where: { id },
      });

    if (!ormEntity) {
      return null;
    }

    return this.toDomain(ormEntity);
  }

  async findByAccountId(
    accountId: string,
    manager?: EntityManager,
  ): Promise<SecurityTransactionEntity[]> {
    const repository: Repository<SecurityTransactionOrmEntity> = manager
      ? manager.getRepository(SecurityTransactionOrmEntity)
      : this.repository;
    const ormEntities: SecurityTransactionOrmEntity[] = await repository.find({
      where: { securitiesAccountId: accountId },
      order: { transactionDate: 'DESC' },
    });

    return ormEntities.map((entity: SecurityTransactionOrmEntity) =>
      this.toDomain(entity),
    );
  }

  async findByAccountIdAndDateRange(
    accountId: string,
    startDate: Date,
    endDate: Date,
    manager?: EntityManager,
  ): Promise<SecurityTransactionEntity[]> {
    const repository: Repository<SecurityTransactionOrmEntity> = manager
      ? manager.getRepository(SecurityTransactionOrmEntity)
      : this.repository;
    const ormEntities: SecurityTransactionOrmEntity[] = await repository.find({
      where: {
        securitiesAccountId: accountId,
        transactionDate: Between(startDate, endDate),
      },
      order: { transactionDate: 'DESC' },
    });

    return ormEntities.map((entity: SecurityTransactionOrmEntity) =>
      this.toDomain(entity),
    );
  }

  async update(
    transaction: SecurityTransactionEntity,
    manager?: EntityManager,
  ): Promise<void> {
    const repository: Repository<SecurityTransactionOrmEntity> = manager
      ? manager.getRepository(SecurityTransactionOrmEntity)
      : this.repository;
    const ormEntity: SecurityTransactionOrmEntity = this.toOrm(transaction);
    await repository.save(ormEntity);
  }

  async delete(id: string, manager?: EntityManager): Promise<void> {
    const repository: Repository<SecurityTransactionOrmEntity> = manager
      ? manager.getRepository(SecurityTransactionOrmEntity)
      : this.repository;
    await repository.delete(id);
  }

  /**
   * ORM→ドメインエンティティ変換
   */
  private toDomain(
    ormEntity: SecurityTransactionOrmEntity,
  ): SecurityTransactionEntity {
    return new SecurityTransactionEntity(
      ormEntity.id,
      ormEntity.securitiesAccountId,
      ormEntity.securityCode,
      ormEntity.securityName,
      ormEntity.transactionDate,
      ormEntity.transactionType as
        | 'buy'
        | 'sell'
        | 'dividend'
        | 'distribution'
        | 'split'
        | 'other',
      ormEntity.quantity,
      Number(ormEntity.price),
      Number(ormEntity.fee),
      ormEntity.status as 'pending' | 'completed' | 'cancelled',
      ormEntity.createdAt,
    );
  }

  /**
   * ドメインエンティティ→ORM変換
   */
  private toOrm(
    domain: SecurityTransactionEntity,
  ): SecurityTransactionOrmEntity {
    return this.repository.create({
      id: domain.id,
      securitiesAccountId: domain.securitiesAccountId,
      securityCode: domain.securityCode,
      securityName: domain.securityName,
      transactionDate: domain.transactionDate,
      transactionType: domain.transactionType,
      quantity: domain.quantity,
      price: domain.price,
      fee: domain.fee,
      status: domain.status,
      createdAt: domain.createdAt,
    });
  }
}
