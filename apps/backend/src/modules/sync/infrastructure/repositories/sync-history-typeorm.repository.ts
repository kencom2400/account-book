import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { ISyncHistoryRepository } from '../../domain/repositories/sync-history.repository.interface';
import { SyncHistory } from '../../domain/entities/sync-history.entity';
import { SyncHistoryOrmEntity } from '../entities/sync-history.orm-entity';
import { SyncStatus } from '../../domain/enums/sync-status.enum';

/**
 * 同期履歴 TypeORM リポジトリ
 *
 * @description
 * TypeORMを使用して同期履歴をMySQLに永続化します。
 *
 * @infrastructure
 * @layer Infrastructure
 */
@Injectable()
export class SyncHistoryTypeOrmRepository implements ISyncHistoryRepository {
  constructor(
    @InjectRepository(SyncHistoryOrmEntity)
    private readonly repository: Repository<SyncHistoryOrmEntity>,
  ) {}

  async create(syncHistory: SyncHistory): Promise<SyncHistory> {
    const ormEntity = this.toOrmEntity(syncHistory);
    const saved = await this.repository.save(ormEntity);
    return this.toDomainEntity(saved);
  }

  async update(syncHistory: SyncHistory): Promise<SyncHistory> {
    const ormEntity = this.toOrmEntity(syncHistory);
    const saved = await this.repository.save(ormEntity);
    return this.toDomainEntity(saved);
  }

  async findById(id: string): Promise<SyncHistory | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? this.toDomainEntity(ormEntity) : null;
  }

  async findByInstitutionId(
    institutionId: string,
    limit = 10,
  ): Promise<SyncHistory[]> {
    const ormEntities = await this.repository.find({
      where: { institutionId },
      order: { startedAt: 'DESC' },
      take: limit,
    });
    return ormEntities.map((entity) => this.toDomainEntity(entity));
  }

  async findByStatus(status: SyncStatus): Promise<SyncHistory[]> {
    const ormEntities = await this.repository.find({
      where: { status },
      order: { startedAt: 'DESC' },
    });
    return ormEntities.map((entity) => this.toDomainEntity(entity));
  }

  async findAll(limit = 20, offset = 0): Promise<SyncHistory[]> {
    const ormEntities = await this.repository.find({
      order: { startedAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return ormEntities.map((entity) => this.toDomainEntity(entity));
  }

  async findWithFilters(
    filters: {
      institutionId?: string;
      status?: SyncStatus;
      startDate?: Date;
      endDate?: Date;
    },
    limit = 20,
    offset = 0,
  ): Promise<SyncHistory[]> {
    const where: FindOptionsWhere<SyncHistoryOrmEntity> = {};

    if (filters.institutionId) {
      where.institutionId = filters.institutionId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate && filters.endDate) {
      where.startedAt = Between(filters.startDate, filters.endDate);
    }

    const ormEntities = await this.repository.find({
      where,
      order: { startedAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return ormEntities.map((entity) => this.toDomainEntity(entity));
  }

  async countWithFilters(filters: {
    institutionId?: string;
    status?: SyncStatus;
    startDate?: Date;
    endDate?: Date;
  }): Promise<number> {
    const where: FindOptionsWhere<SyncHistoryOrmEntity> = {};

    if (filters.institutionId) {
      where.institutionId = filters.institutionId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate && filters.endDate) {
      where.startedAt = Between(filters.startDate, filters.endDate);
    }

    return await this.repository.count({ where });
  }

  async findLatest(): Promise<SyncHistory | null> {
    const ormEntity = await this.repository.findOne({
      order: { startedAt: 'DESC' },
    });
    return ormEntity ? this.toDomainEntity(ormEntity) : null;
  }

  async findRunning(): Promise<SyncHistory[]> {
    const ormEntities = await this.repository.find({
      where: { status: SyncStatus.RUNNING },
      order: { startedAt: 'DESC' },
    });
    return ormEntities.map((entity) => this.toDomainEntity(entity));
  }

  async findLastSuccessfulSync(
    institutionId: string,
  ): Promise<SyncHistory | null> {
    const ormEntity = await this.repository.findOne({
      where: {
        institutionId,
        status: SyncStatus.COMPLETED,
      },
      order: { completedAt: 'DESC' },
    });
    return ormEntity ? this.toDomainEntity(ormEntity) : null;
  }

  /**
   * ORM エンティティからドメインエンティティに変換
   */
  private toDomainEntity(ormEntity: SyncHistoryOrmEntity): SyncHistory {
    return new SyncHistory(
      ormEntity.id,
      ormEntity.institutionId,
      ormEntity.institutionName,
      ormEntity.institutionType,
      ormEntity.status,
      ormEntity.startedAt,
      ormEntity.completedAt,
      ormEntity.totalFetched,
      ormEntity.newRecords,
      ormEntity.duplicateRecords,
      ormEntity.errorMessage,
      ormEntity.retryCount,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  /**
   * ドメインエンティティから ORM エンティティに変換
   */
  private toOrmEntity(entity: SyncHistory): SyncHistoryOrmEntity {
    const ormEntity = new SyncHistoryOrmEntity();
    ormEntity.id = entity.id;
    ormEntity.institutionId = entity.institutionId;
    ormEntity.institutionName = entity.institutionName;
    ormEntity.institutionType = entity.institutionType;
    ormEntity.status = entity.status;
    ormEntity.startedAt = entity.startedAt;
    ormEntity.completedAt = entity.completedAt;
    ormEntity.totalFetched = entity.totalFetched;
    ormEntity.newRecords = entity.newRecords;
    ormEntity.duplicateRecords = entity.duplicateRecords;
    ormEntity.errorMessage = entity.errorMessage;
    ormEntity.retryCount = entity.retryCount;
    ormEntity.createdAt = entity.createdAt;
    ormEntity.updatedAt = entity.updatedAt;
    return ormEntity;
  }
}
