import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditCardOrmEntity } from '../entities/credit-card.orm-entity';
import { CreditCardEntity } from '../../domain/entities/credit-card.entity';
import { EncryptedCredentials } from '../../../institution/domain/value-objects/encrypted-credentials.vo';

/**
 * CreditCardTypeOrmRepository
 * TypeORMを使用したクレジットカードリポジトリの実装
 */
@Injectable()
export class CreditCardTypeOrmRepository {
  constructor(
    @InjectRepository(CreditCardOrmEntity)
    private readonly repository: Repository<CreditCardOrmEntity>,
  ) {}

  /**
   * すべてのクレジットカードを取得
   */
  async findAll(): Promise<CreditCardEntity[]> {
    const ormEntities: CreditCardOrmEntity[] = await this.repository.find({
      order: { cardName: 'ASC' },
    });
    return ormEntities.map((entity: CreditCardOrmEntity) =>
      this.toDomain(entity),
    );
  }

  /**
   * IDでクレジットカードを取得
   */
  async findById(id: string): Promise<CreditCardEntity | null> {
    const ormEntity: CreditCardOrmEntity | null = await this.repository.findOne(
      {
        where: { id },
      },
    );

    if (!ormEntity) {
      return null;
    }

    return this.toDomain(ormEntity);
  }

  /**
   * 発行会社でクレジットカードを取得
   */
  async findByIssuer(issuer: string): Promise<CreditCardEntity[]> {
    const ormEntities: CreditCardOrmEntity[] = await this.repository.find({
      where: { issuer },
      order: { cardName: 'ASC' },
    });

    return ormEntities.map((entity: CreditCardOrmEntity) =>
      this.toDomain(entity),
    );
  }

  /**
   * クレジットカードを保存
   */
  async save(creditCard: CreditCardEntity): Promise<CreditCardEntity> {
    const ormEntity: CreditCardOrmEntity = this.toOrm(creditCard);
    const saved: CreditCardOrmEntity = await this.repository.save(ormEntity);
    return this.toDomain(saved);
  }

  /**
   * クレジットカードを削除
   */
  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * ORM→ドメインエンティティ変換
   */
  private toDomain(ormEntity: CreditCardOrmEntity): CreditCardEntity {
    let credentialsData: Record<string, string>;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      credentialsData = JSON.parse(ormEntity.encryptedCredentials);

      // データ構造の検証
      if (
        !credentialsData.encrypted ||
        !credentialsData.iv ||
        !credentialsData.authTag ||
        !credentialsData.algorithm ||
        !credentialsData.version
      ) {
        throw new Error(
          'Invalid credentials data structure: missing required fields',
        );
      }
    } catch (error) {
      throw new Error(
        `Failed to parse encryptedCredentials for credit card ${ormEntity.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const credentials: EncryptedCredentials = new EncryptedCredentials(
      credentialsData.encrypted,
      credentialsData.iv,
      credentialsData.authTag,
      credentialsData.algorithm,
      credentialsData.version,
    );

    return new CreditCardEntity(
      ormEntity.id,
      ormEntity.cardName,
      ormEntity.cardNumber,
      ormEntity.cardHolderName,
      ormEntity.expiryDate,
      credentials,
      ormEntity.isConnected,
      ormEntity.lastSyncedAt,
      ormEntity.paymentDay,
      ormEntity.closingDay,
      parseFloat(ormEntity.creditLimit),
      parseFloat(ormEntity.currentBalance),
      ormEntity.issuer,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  /**
   * ドメインエンティティ→ORM変換
   */
  private toOrm(domain: CreditCardEntity): CreditCardOrmEntity {
    return this.repository.create({
      id: domain.id,
      cardName: domain.cardName,
      cardNumber: domain.cardNumber,
      cardHolderName: domain.cardHolderName,
      expiryDate: domain.expiryDate,
      encryptedCredentials: JSON.stringify(domain.credentials.toJSON()),
      isConnected: domain.isConnected,
      lastSyncedAt: domain.lastSyncedAt,
      paymentDay: domain.paymentDay,
      closingDay: domain.closingDay,
      creditLimit: domain.creditLimit.toString(),
      currentBalance: domain.currentBalance.toString(),
      issuer: domain.issuer,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    });
  }
}
