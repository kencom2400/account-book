import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HoldingOrmEntity } from '../entities/holding.orm-entity';
import { HoldingEntity } from '../../domain/entities/holding.entity';
import { IHoldingRepository } from '../../domain/repositories/securities.repository.interface';

/**
 * HoldingTypeOrmRepository
 * TypeORMを使用した保有銘柄リポジトリの実装
 */
@Injectable()
export class HoldingTypeOrmRepository implements IHoldingRepository {
  constructor(
    @InjectRepository(HoldingOrmEntity)
    private readonly repository: Repository<HoldingOrmEntity>,
  ) {}

  async create(holding: HoldingEntity): Promise<void> {
    const ormEntity: HoldingOrmEntity = this.toOrm(holding);
    await this.repository.save(ormEntity);
  }

  async findById(id: string): Promise<HoldingEntity | null> {
    const ormEntity: HoldingOrmEntity | null = await this.repository.findOne({
      where: { id },
    });

    if (!ormEntity) {
      return null;
    }

    return this.toDomain(ormEntity);
  }

  async findByAccountId(accountId: string): Promise<HoldingEntity[]> {
    const ormEntities: HoldingOrmEntity[] = await this.repository.find({
      where: { securitiesAccountId: accountId },
      order: { securityCode: 'ASC' },
    });

    return ormEntities.map((entity: HoldingOrmEntity) => this.toDomain(entity));
  }

  async findByAccountIdAndSecurityCode(
    accountId: string,
    securityCode: string,
  ): Promise<HoldingEntity | null> {
    const ormEntity: HoldingOrmEntity | null = await this.repository.findOne({
      where: {
        securitiesAccountId: accountId,
        securityCode,
      },
    });

    if (!ormEntity) {
      return null;
    }

    return this.toDomain(ormEntity);
  }

  async update(holding: HoldingEntity): Promise<void> {
    const ormEntity: HoldingOrmEntity = this.toOrm(holding);
    await this.repository.save(ormEntity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * ORM→ドメインエンティティ変換
   */
  private toDomain(ormEntity: HoldingOrmEntity): HoldingEntity {
    return new HoldingEntity(
      ormEntity.id,
      ormEntity.securitiesAccountId,
      ormEntity.securityCode,
      ormEntity.securityName,
      ormEntity.quantity,
      Number(ormEntity.averageAcquisitionPrice),
      Number(ormEntity.currentPrice),
      ormEntity.securityType as 'stock' | 'bond' | 'fund' | 'etf' | 'reit',
      ormEntity.market,
      ormEntity.updatedAt,
    );
  }

  /**
   * ドメインエンティティ→ORM変換
   */
  private toOrm(domain: HoldingEntity): HoldingOrmEntity {
    return this.repository.create({
      id: domain.id,
      securitiesAccountId: domain.securitiesAccountId,
      securityCode: domain.securityCode,
      securityName: domain.securityName,
      quantity: domain.quantity,
      averageAcquisitionPrice: domain.averageAcquisitionPrice,
      currentPrice: domain.currentPrice,
      securityType: domain.securityType,
      market: domain.market,
      updatedAt: domain.updatedAt,
    });
  }
}
