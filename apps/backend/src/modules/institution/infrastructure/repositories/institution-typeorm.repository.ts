import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstitutionOrmEntity } from '../entities/institution.orm-entity';
import { AccountOrmEntity } from '../entities/account.orm-entity';
import { InstitutionEntity } from '../../domain/entities/institution.entity';
import { AccountEntity } from '../../domain/entities/account.entity';
import { EncryptedCredentials } from '../../domain/value-objects/encrypted-credentials.vo';
import { IInstitutionRepository } from '../../domain/repositories/institution.repository.interface';
import { InstitutionType } from '@account-book/types';

/**
 * InstitutionTypeOrmRepository
 * TypeORMを使用した金融機関リポジトリの実装
 */
@Injectable()
export class InstitutionTypeOrmRepository implements IInstitutionRepository {
  constructor(
    @InjectRepository(InstitutionOrmEntity)
    private readonly institutionRepository: Repository<InstitutionOrmEntity>,
    @InjectRepository(AccountOrmEntity)
    private readonly accountRepository: Repository<AccountOrmEntity>,
  ) {}

  /**
   * IDで金融機関を取得
   */
  async findById(id: string): Promise<InstitutionEntity | null> {
    const ormEntity: InstitutionOrmEntity | null =
      await this.institutionRepository.findOne({
        where: { id },
        relations: ['accounts'],
      });

    if (!ormEntity) {
      return null;
    }

    return this.toDomain(ormEntity);
  }

  /**
   * すべての金融機関を取得
   */
  async findAll(): Promise<InstitutionEntity[]> {
    const ormEntities: InstitutionOrmEntity[] =
      await this.institutionRepository.find({
        relations: ['accounts'],
        order: { createdAt: 'ASC' },
      });

    return ormEntities.map((entity: InstitutionOrmEntity) =>
      this.toDomain(entity),
    );
  }

  /**
   * タイプで金融機関を取得
   */
  async findByType(type: InstitutionType): Promise<InstitutionEntity[]> {
    const ormEntities: InstitutionOrmEntity[] =
      await this.institutionRepository.find({
        where: { type },
        relations: ['accounts'],
        order: { createdAt: 'ASC' },
      });

    return ormEntities.map((entity: InstitutionOrmEntity) =>
      this.toDomain(entity),
    );
  }

  /**
   * 接続状態で金融機関を取得
   */
  async findByConnectionStatus(
    isConnected: boolean,
  ): Promise<InstitutionEntity[]> {
    const ormEntities: InstitutionOrmEntity[] =
      await this.institutionRepository.find({
        where: { isConnected },
        relations: ['accounts'],
        order: { createdAt: 'ASC' },
      });

    return ormEntities.map((entity: InstitutionOrmEntity) =>
      this.toDomain(entity),
    );
  }

  /**
   * 金融機関を保存（新規作成・更新の両方に対応）
   */
  async save(institution: InstitutionEntity): Promise<InstitutionEntity> {
    const ormEntity: InstitutionOrmEntity = this.toOrm(institution);

    // accountsをORM Entityに変換してセット
    ormEntity.accounts = institution.accounts.map((account: AccountEntity) =>
      this.accountToOrm(account),
    );

    // cascade: trueにより、口座も自動的に保存・更新される
    const saved: InstitutionOrmEntity =
      await this.institutionRepository.save(ormEntity);

    return this.toDomain(saved);
  }

  /**
   * 金融機関を更新
   */
  async update(institution: InstitutionEntity): Promise<InstitutionEntity> {
    const ormEntity: InstitutionOrmEntity = this.toOrm(institution);

    // accountsをORM Entityに変換してセット
    ormEntity.accounts = institution.accounts.map((account: AccountEntity) =>
      this.accountToOrm(account),
    );

    // cascade: trueにより、口座も自動的に保存・更新される
    const saved: InstitutionOrmEntity =
      await this.institutionRepository.save(ormEntity);

    return this.toDomain(saved);
  }

  /**
   * 金融機関を削除
   */
  async delete(id: string): Promise<void> {
    // 関連する口座も削除される（CASCADE設定による）
    await this.institutionRepository.delete(id);
  }

  /**
   * すべての金融機関を削除（テスト用）
   */
  async deleteAll(): Promise<void> {
    await this.accountRepository.delete({});
    await this.institutionRepository.delete({});
  }

  /**
   * ORM→ドメインエンティティ変換
   */
  private toDomain(ormEntity: InstitutionOrmEntity): InstitutionEntity {
    const credentials: EncryptedCredentials = new EncryptedCredentials(
      ormEntity.credentialsEncrypted,
      ormEntity.credentialsIv,
      ormEntity.credentialsAuthTag,
      ormEntity.credentialsAlgorithm,
      ormEntity.credentialsVersion,
    );

    const accounts: AccountEntity[] = (ormEntity.accounts || []).map(
      (accountOrm: AccountOrmEntity) =>
        new AccountEntity(
          accountOrm.id,
          accountOrm.institutionId,
          accountOrm.accountNumber,
          accountOrm.accountName,
          Number(accountOrm.balance),
          accountOrm.currency,
        ),
    );

    return new InstitutionEntity(
      ormEntity.id,
      ormEntity.name,
      ormEntity.type,
      credentials,
      ormEntity.isConnected,
      ormEntity.lastSyncedAt,
      accounts,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  /**
   * ドメインエンティティ→ORM変換
   */
  private toOrm(domain: InstitutionEntity): InstitutionOrmEntity {
    const credentialsJson: {
      encrypted: string;
      iv: string;
      authTag: string;
      algorithm: string;
      version: string;
    } = domain.credentials.toJSON();

    return this.institutionRepository.create({
      id: domain.id,
      name: domain.name,
      type: domain.type,
      credentialsEncrypted: credentialsJson.encrypted,
      credentialsIv: credentialsJson.iv,
      credentialsAuthTag: credentialsJson.authTag,
      credentialsAlgorithm: credentialsJson.algorithm,
      credentialsVersion: credentialsJson.version,
      isConnected: domain.isConnected,
      lastSyncedAt: domain.lastSyncedAt,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    });
  }

  /**
   * ドメインAccount→ORM変換
   */
  private accountToOrm(domain: AccountEntity): AccountOrmEntity {
    return this.accountRepository.create({
      id: domain.id,
      institutionId: domain.institutionId,
      accountNumber: domain.accountNumber,
      accountName: domain.accountName,
      balance: domain.balance,
      currency: domain.currency,
    });
  }
}
