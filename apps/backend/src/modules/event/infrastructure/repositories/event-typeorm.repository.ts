import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventOrmEntity } from '../entities/event.orm-entity';
import { EventTransactionRelationOrmEntity } from '../entities/event-transaction-relation.orm-entity';
import { EventEntity } from '../../domain/entities/event.entity';
import { IEventRepository } from '../../domain/repositories/event.repository.interface';
import { EventCategory } from '../../domain/enums/event-category.enum';

/**
 * EventTypeOrmRepository
 * TypeORMを使用したイベントリポジトリの実装
 */
@Injectable()
export class EventTypeOrmRepository implements IEventRepository {
  constructor(
    @InjectRepository(EventOrmEntity)
    private readonly eventRepository: Repository<EventOrmEntity>,
    @InjectRepository(EventTransactionRelationOrmEntity)
    private readonly relationRepository: Repository<EventTransactionRelationOrmEntity>,
  ) {}

  /**
   * イベントを保存
   */
  async save(event: EventEntity): Promise<EventEntity> {
    const ormEntity: EventOrmEntity = this.toOrm(event);
    const saved: EventOrmEntity = await this.eventRepository.save(ormEntity);
    return this.toDomain(saved);
  }

  /**
   * IDでイベントを取得
   */
  async findById(id: string): Promise<EventEntity | null> {
    const ormEntity: EventOrmEntity | null = await this.eventRepository.findOne(
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
   * 日付範囲でイベントを取得
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<EventEntity[]> {
    const ormEntities: EventOrmEntity[] = await this.eventRepository.find({
      where: {
        date: Between(startDate, endDate),
      },
      order: { date: 'ASC', createdAt: 'ASC' },
    });

    return ormEntities.map((entity: EventOrmEntity) => this.toDomain(entity));
  }

  /**
   * イベントを削除
   */
  async delete(id: string): Promise<void> {
    await this.eventRepository.delete(id);
  }

  /**
   * 取引IDでイベントを取得
   */
  async findByTransactionId(transactionId: string): Promise<EventEntity[]> {
    const relations: EventTransactionRelationOrmEntity[] =
      await this.relationRepository.find({
        where: { transactionId },
        relations: ['event'],
      });

    return relations.map((relation) => this.toDomain(relation.event));
  }

  /**
   * イベントIDで関連する取引ID一覧を取得
   */
  async getTransactionIdsByEventId(eventId: string): Promise<string[]> {
    const relations: EventTransactionRelationOrmEntity[] =
      await this.relationRepository.find({
        where: { eventId },
      });

    return relations.map((relation) => relation.transactionId);
  }

  /**
   * イベントと取引を紐付け
   */
  async linkTransaction(eventId: string, transactionId: string): Promise<void> {
    // 既に紐付けられているかチェック
    const existing: EventTransactionRelationOrmEntity | null =
      await this.relationRepository.findOne({
        where: { eventId, transactionId },
      });

    if (existing) {
      return; // 既に紐付けられている場合は何もしない
    }

    const relation: EventTransactionRelationOrmEntity =
      this.relationRepository.create({
        eventId,
        transactionId,
      });

    await this.relationRepository.save(relation);
  }

  /**
   * イベントと取引の紐付けを解除
   */
  async unlinkTransaction(
    eventId: string,
    transactionId: string,
  ): Promise<void> {
    await this.relationRepository.delete({
      eventId,
      transactionId,
    });
  }

  /**
   * ORM→ドメインエンティティ変換
   */
  private toDomain(ormEntity: EventOrmEntity): EventEntity {
    return new EventEntity(
      ormEntity.id,
      ormEntity.date,
      ormEntity.title,
      ormEntity.description,
      ormEntity.category as EventCategory,
      ormEntity.tags ?? [],
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  /**
   * ドメインエンティティ→ORM変換
   */
  private toOrm(domain: EventEntity): EventOrmEntity {
    return this.eventRepository.create({
      id: domain.id,
      date: domain.date,
      title: domain.title,
      description: domain.description,
      category: domain.category,
      tags: domain.tags.length > 0 ? domain.tags : null,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    });
  }
}
