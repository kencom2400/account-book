import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import type { IMerchantRepository } from '../../domain/repositories/merchant.repository.interface';
import { Merchant } from '../../domain/entities/merchant.entity';
import { ClassificationConfidence } from '../../domain/value-objects/classification-confidence.vo';
import { MerchantOrmEntity } from '../entities/merchant.orm-entity';

/**
 * 店舗マスタリポジトリ TypeORM実装
 * IMerchantRepositoryの実装クラス
 */
@Injectable()
export class MerchantTypeOrmRepository implements IMerchantRepository {
  constructor(
    @InjectRepository(MerchantOrmEntity)
    private readonly repository: Repository<MerchantOrmEntity>,
  ) {}

  /**
   * ORM Entity → Domain Entity変換
   */
  private toDomain(ormEntity: MerchantOrmEntity): Merchant {
    return new Merchant(
      ormEntity.id,
      ormEntity.name,
      ormEntity.aliases,
      ormEntity.defaultSubcategoryId,
      new ClassificationConfidence(ormEntity.confidence),
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  /**
   * Domain Entity → ORM Entity変換
   */
  private toOrm(domainEntity: Merchant): MerchantOrmEntity {
    const ormEntity = new MerchantOrmEntity();
    ormEntity.id = domainEntity.id;
    ormEntity.name = domainEntity.name;
    ormEntity.aliases = domainEntity.aliases;
    ormEntity.defaultSubcategoryId = domainEntity.defaultSubcategoryId;
    ormEntity.confidence = domainEntity.getConfidence().getValue();
    ormEntity.createdAt = domainEntity.createdAt;
    ormEntity.updatedAt = domainEntity.updatedAt;
    return ormEntity;
  }

  async save(merchant: Merchant): Promise<Merchant> {
    const ormEntity = this.toOrm(merchant);
    const saved = await this.repository.save(ormEntity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Merchant | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? this.toDomain(ormEntity) : null;
  }

  async findByName(name: string): Promise<Merchant | null> {
    const ormEntity = await this.repository.findOne({ where: { name } });
    return ormEntity ? this.toDomain(ormEntity) : null;
  }

  async findByAlias(alias: string): Promise<Merchant | null> {
    // JSON型カラムの検索（MySQL JSON_CONTAINS使用）
    const ormEntity = await this.repository
      .createQueryBuilder('merchant')
      .where('JSON_CONTAINS(merchant.aliases, :alias)', {
        alias: JSON.stringify(alias),
      })
      .getOne();

    return ormEntity ? this.toDomain(ormEntity) : null;
  }

  async search(query: string): Promise<Merchant[]> {
    const ormEntities = await this.repository.find({
      where: { name: Like(`%${query}%`) },
    });
    return ormEntities.map((entity) => this.toDomain(entity));
  }

  async searchByDescription(description: string): Promise<Merchant | null> {
    // 店舗名での部分一致検索
    const byName = await this.repository
      .createQueryBuilder('merchant')
      .where('merchant.name LIKE :description', {
        description: `%${description}%`,
      })
      .getOne();

    if (byName) {
      return this.toDomain(byName);
    }

    // 別名での検索（JSON配列内の文字列を検索）
    const byAlias = await this.repository
      .createQueryBuilder('merchant')
      .where('JSON_SEARCH(merchant.aliases, "one", :pattern) IS NOT NULL', {
        pattern: `%${description}%`,
      })
      .getOne();

    return byAlias ? this.toDomain(byAlias) : null;
  }

  async update(merchant: Merchant): Promise<Merchant> {
    const ormEntity = this.toOrm(merchant);
    const updated = await this.repository.save(ormEntity);
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
