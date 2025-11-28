import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { SecuritiesAccountOrmEntity } from '../entities/securities-account.orm-entity';
import { SecuritiesAccountEntity } from '../../domain/entities/securities-account.entity';
import { EncryptedCredentials } from '../../../institution/domain/value-objects/encrypted-credentials.vo';
import { ISecuritiesAccountRepository } from '../../domain/repositories/securities.repository.interface';

/**
 * SecuritiesAccountTypeOrmRepository
 * TypeORMを使用した証券口座リポジトリの実装
 */
@Injectable()
export class SecuritiesAccountTypeOrmRepository implements ISecuritiesAccountRepository {
  constructor(
    @InjectRepository(SecuritiesAccountOrmEntity)
    private readonly repository: Repository<SecuritiesAccountOrmEntity>,
  ) {}

  async create(
    account: SecuritiesAccountEntity,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = this.getRepo(manager);
    const ormEntity: SecuritiesAccountOrmEntity = this.toOrm(account);
    await repository.save(ormEntity);
  }

  async findById(
    id: string,
    manager?: EntityManager,
  ): Promise<SecuritiesAccountEntity | null> {
    const repository = this.getRepo(manager);
    const ormEntity: SecuritiesAccountOrmEntity | null =
      await repository.findOne({
        where: { id },
      });

    if (!ormEntity) {
      return null;
    }

    return this.toDomain(ormEntity);
  }

  async findAll(manager?: EntityManager): Promise<SecuritiesAccountEntity[]> {
    const repository = this.getRepo(manager);
    const ormEntities: SecuritiesAccountOrmEntity[] = await repository.find({
      order: { createdAt: 'ASC' },
    });

    return ormEntities.map((entity: SecuritiesAccountOrmEntity) =>
      this.toDomain(entity),
    );
  }

  async update(
    account: SecuritiesAccountEntity,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = this.getRepo(manager);
    const ormEntity: SecuritiesAccountOrmEntity = this.toOrm(account);
    await repository.save(ormEntity);
  }

  async delete(id: string, manager?: EntityManager): Promise<void> {
    const repository = this.getRepo(manager);
    await repository.delete(id);
  }

  /**
   * EntityManagerまたはデフォルトRepositoryを取得
   */
  private getRepo(
    manager?: EntityManager,
  ): Repository<SecuritiesAccountOrmEntity> {
    return manager
      ? manager.getRepository(SecuritiesAccountOrmEntity)
      : this.repository;
  }

  /**
   * ORM→ドメインエンティティ変換
   */
  private toDomain(
    ormEntity: SecuritiesAccountOrmEntity,
  ): SecuritiesAccountEntity {
    const credentials: EncryptedCredentials = new EncryptedCredentials(
      ormEntity.credentialsEncrypted,
      ormEntity.credentialsIv,
      ormEntity.credentialsAuthTag,
      ormEntity.credentialsAlgorithm,
      ormEntity.credentialsVersion,
    );

    return new SecuritiesAccountEntity(
      ormEntity.id,
      ormEntity.securitiesCompanyName,
      ormEntity.accountNumber,
      ormEntity.accountType as
        | 'general'
        | 'specific'
        | 'nisa'
        | 'tsumitate-nisa'
        | 'isa',
      credentials,
      ormEntity.isConnected,
      ormEntity.lastSyncedAt,
      Number(ormEntity.totalEvaluationAmount),
      Number(ormEntity.cashBalance),
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  /**
   * ドメインエンティティ→ORM変換
   */
  private toOrm(domain: SecuritiesAccountEntity): SecuritiesAccountOrmEntity {
    const credentialsJson: {
      encrypted: string;
      iv: string;
      authTag: string;
      algorithm: string;
      version: string;
    } = domain.credentials.toJSON();

    return this.repository.create({
      id: domain.id,
      securitiesCompanyName: domain.securitiesCompanyName,
      accountNumber: domain.accountNumber,
      accountType: domain.accountType,
      credentialsEncrypted: credentialsJson.encrypted,
      credentialsIv: credentialsJson.iv,
      credentialsAuthTag: credentialsJson.authTag,
      credentialsAlgorithm: credentialsJson.algorithm,
      credentialsVersion: credentialsJson.version,
      isConnected: domain.isConnected,
      lastSyncedAt: domain.lastSyncedAt,
      totalEvaluationAmount: domain.totalEvaluationAmount,
      cashBalance: domain.cashBalance,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    });
  }
}
