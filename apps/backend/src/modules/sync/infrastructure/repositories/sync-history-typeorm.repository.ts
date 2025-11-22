import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ISyncHistoryRepository } from '../../domain/repositories/sync-history.repository.interface';
import { SyncHistoryEntity } from '../../domain/entities/sync-history.entity';
import { SyncHistoryOrmEntity } from '../entities/sync-history.orm-entity';

/**
 * 同期履歴 TypeORM リポジトリ
 */
@Injectable()
export class SyncHistoryTypeOrmRepository implements ISyncHistoryRepository {
  constructor(
    @InjectRepository(SyncHistoryOrmEntity)
    private readonly repository: Repository<SyncHistoryOrmEntity>,
  ) {}

  async create(syncHistory: SyncHistoryEntity): Promise<SyncHistoryEntity> {
    const ormEntity = this.toOrmEntity(syncHistory);
    const saved = await this.repository.save(ormEntity);
    return this.toDomainEntity(saved);
  }

  async update(syncHistory: SyncHistoryEntity): Promise<SyncHistoryEntity> {
    const ormEntity = this.toOrmEntity(syncHistory);
    const saved = await this.repository.save(ormEntity);
    return this.toDomainEntity(saved);
  }

  async findById(id: string): Promise<SyncHistoryEntity | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? this.toDomainEntity(ormEntity) : null;
  }

  async findAll(limit?: number): Promise<SyncHistoryEntity[]> {
    const ormEntities = await this.repository.find({
      order: { startedAt: 'DESC' },
      take: limit,
    });
    return ormEntities.map((entity) => this.toDomainEntity(entity));
  }

  async findLatest(): Promise<SyncHistoryEntity | null> {
    const ormEntity = await this.repository.findOne({
      order: { startedAt: 'DESC' },
    });
    return ormEntity ? this.toDomainEntity(ormEntity) : null;
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<SyncHistoryEntity[]> {
    const ormEntities = await this.repository.find({
      where: {
        startedAt: Between(startDate, endDate),
      },
      order: { startedAt: 'DESC' },
    });
    return ormEntities.map((entity) => this.toDomainEntity(entity));
  }

  /**
   * ORM エンティティからドメインエンティティに変換
   */
  private toDomainEntity(ormEntity: SyncHistoryOrmEntity): SyncHistoryEntity {
    return new SyncHistoryEntity(
      ormEntity.id,
      ormEntity.status,
      ormEntity.startedAt,
      ormEntity.completedAt,
      ormEntity.totalInstitutions,
      ormEntity.successCount,
      ormEntity.failureCount,
      ormEntity.newTransactionsCount,
      ormEntity.errorMessage,
      ormEntity.errorDetails,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  /**
   * ドメインエンティティから ORM エンティティに変換
   */
  private toOrmEntity(entity: SyncHistoryEntity): SyncHistoryOrmEntity {
    const ormEntity = new SyncHistoryOrmEntity();
    ormEntity.id = entity.id;
    ormEntity.status = entity.status;
    ormEntity.startedAt = entity.startedAt;
    ormEntity.completedAt = entity.completedAt;
    ormEntity.totalInstitutions = entity.totalInstitutions;
    ormEntity.successCount = entity.successCount;
    ormEntity.failureCount = entity.failureCount;
    ormEntity.newTransactionsCount = entity.newTransactionsCount;
    ormEntity.errorMessage = entity.errorMessage;
    ormEntity.errorDetails = entity.errorDetails;
    ormEntity.createdAt = entity.createdAt;
    ormEntity.updatedAt = entity.updatedAt;
    return ormEntity;
  }
}
