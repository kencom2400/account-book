import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstitutionOrmEntity } from '../entities/institution.orm-entity';
import { InstitutionEntity } from '../../domain/entities/institution.entity';
import { EncryptedCredentials } from '../../domain/value-objects/encrypted-credentials.vo';
import { AccountEntity } from '../../domain/entities/account.entity';

/**
 * InstitutionTypeOrmRepository
 * TypeORMを使用した金融機関リポジトリの実装
 */
@Injectable()
export class InstitutionTypeOrmRepository {
  constructor(
    @InjectRepository(InstitutionOrmEntity)
    private readonly repository: Repository<InstitutionOrmEntity>,
  ) {}

  /**
   * すべての金融機関を取得
   */
  async findAll(): Promise<InstitutionEntity[]> {
    const ormEntities: InstitutionOrmEntity[] = await this.repository.find({
      order: { name: 'ASC' },
    });
    return ormEntities.map((entity: InstitutionOrmEntity) =>
      this.toDomain(entity),
    );
  }

  /**
   * IDで金融機関を取得
   */
  async findById(id: string): Promise<InstitutionEntity | null> {
    const ormEntity: InstitutionOrmEntity | null =
      await this.repository.findOne({
        where: { id },
      });

    if (!ormEntity) {
      return null;
    }

    return this.toDomain(ormEntity);
  }

  /**
   * タイプで金融機関を取得
   */
  async findByType(type: string): Promise<InstitutionEntity[]> {
    const ormEntities: InstitutionOrmEntity[] = await this.repository.find({
      where: { type: type as InstitutionOrmEntity['type'] },
      order: { name: 'ASC' },
    });

    return ormEntities.map((entity: InstitutionOrmEntity) =>
      this.toDomain(entity),
    );
  }

  /**
   * 接続ステータスで金融機関を取得
   */
  async findByConnectionStatus(
    isConnected: boolean,
  ): Promise<InstitutionEntity[]> {
    const ormEntities: InstitutionOrmEntity[] = await this.repository.find({
      where: { isConnected },
      order: { name: 'ASC' },
    });

    return ormEntities.map((entity: InstitutionOrmEntity) =>
      this.toDomain(entity),
    );
  }

  /**
   * 金融機関を保存
   */
  async save(institution: InstitutionEntity): Promise<InstitutionEntity> {
    const ormEntity: InstitutionOrmEntity = this.toOrm(institution);
    const saved: InstitutionOrmEntity = await this.repository.save(ormEntity);
    return this.toDomain(saved);
  }

  /**
   * 金融機関を削除
   */
  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * ORM→ドメインエンティティ変換
   */
  private toDomain(ormEntity: InstitutionOrmEntity): InstitutionEntity {
    let parsed: unknown;
    try {
      parsed = JSON.parse(ormEntity.encryptedCredentials);
    } catch (error) {
      throw new Error(
        `Failed to parse encryptedCredentials for institution ${ormEntity.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // データ構造の検証
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('encrypted' in parsed) ||
      !('iv' in parsed) ||
      !('authTag' in parsed) ||
      !('algorithm' in parsed) ||
      !('version' in parsed)
    ) {
      throw new Error(
        'Invalid credentials data structure: missing required fields',
      );
    }

    const credentialsData = parsed as {
      encrypted: string;
      iv: string;
      authTag: string;
      algorithm: string;
      version: string;
    };

    const credentials: EncryptedCredentials = new EncryptedCredentials(
      credentialsData.encrypted,
      credentialsData.iv,
      credentialsData.authTag,
      credentialsData.algorithm,
      credentialsData.version,
    );

    // TypeORMが自動的にJSONをパースするため、直接使用可能
    const accounts: AccountEntity[] = (ormEntity.accounts || []).map(
      (account: {
        id: string;
        institutionId: string;
        accountNumber: string;
        accountName: string;
        balance: number;
        currency: string;
      }) =>
        new AccountEntity(
          account.id,
          account.institutionId,
          account.accountNumber,
          account.accountName,
          account.balance,
          account.currency,
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
    return this.repository.create({
      id: domain.id,
      name: domain.name,
      type: domain.type,
      encryptedCredentials: JSON.stringify(domain.credentials.toJSON()),
      isConnected: domain.isConnected,
      lastSyncedAt: domain.lastSyncedAt,
      // TypeORMが自動的にJSONにシリアライズするため、直接配列を渡す
      accounts: domain.accounts.map((account: AccountEntity) =>
        account.toJSON(),
      ),
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    });
  }
}
