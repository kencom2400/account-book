import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MonthlyCardSummary } from '../../domain/entities/monthly-card-summary.entity';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import { AggregationRepository } from '../../domain/repositories/aggregation.repository.interface';
import { CategoryAmount } from '../../domain/value-objects/category-amount.vo';
import { MonthlyCardSummaryOrmEntity } from '../entities/monthly-card-summary.orm-entity';

/**
 * AggregationTypeOrmRepository
 * TypeORMを使用した集計データリポジトリの実装
 */
@Injectable()
export class AggregationTypeOrmRepository implements AggregationRepository {
  constructor(
    @InjectRepository(MonthlyCardSummaryOrmEntity)
    private readonly repository: Repository<MonthlyCardSummaryOrmEntity>,
  ) {}

  /**
   * 集計データを保存
   */
  async save(summary: MonthlyCardSummary): Promise<MonthlyCardSummary> {
    const ormEntity = this.toOrm(summary);
    const saved = await this.repository.save(ormEntity);
    return this.toDomain(saved);
  }

  /**
   * IDで集計データを取得
   */
  async findById(id: string): Promise<MonthlyCardSummary | null> {
    const ormEntity = await this.repository.findOne({
      where: { id },
    });

    if (!ormEntity) {
      return null;
    }

    return this.toDomain(ormEntity);
  }

  /**
   * カードIDと請求月で集計データを取得
   */
  async findByCardAndMonth(
    cardId: string,
    billingMonth: string,
  ): Promise<MonthlyCardSummary | null> {
    const ormEntity = await this.repository.findOne({
      where: { cardId, billingMonth },
    });

    if (!ormEntity) {
      return null;
    }

    return this.toDomain(ormEntity);
  }

  /**
   * カードIDと期間で集計データを取得
   */
  async findByCard(
    cardId: string,
    startMonth: string,
    endMonth: string,
  ): Promise<MonthlyCardSummary[]> {
    const ormEntities = await this.repository
      .createQueryBuilder('summary')
      .where('summary.cardId = :cardId', { cardId })
      .andWhere('summary.billingMonth >= :startMonth', { startMonth })
      .andWhere('summary.billingMonth <= :endMonth', { endMonth })
      .orderBy('summary.billingMonth', 'ASC')
      .getMany();

    return ormEntities.map((entity) => this.toDomain(entity));
  }

  /**
   * すべての集計データを取得
   */
  async findAll(): Promise<MonthlyCardSummary[]> {
    const ormEntities = await this.repository.find({
      order: { billingMonth: 'DESC', cardName: 'ASC' },
    });

    return ormEntities.map((entity) => this.toDomain(entity));
  }

  /**
   * 集計データを削除
   */
  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * ORM→ドメインエンティティ変換
   */
  private toDomain(ormEntity: MonthlyCardSummaryOrmEntity): MonthlyCardSummary {
    // CategoryAmountの配列を復元
    const categoryBreakdown = ormEntity.categoryBreakdown.map((item) =>
      CategoryAmount.fromPlain(item),
    );

    return new MonthlyCardSummary(
      ormEntity.id,
      ormEntity.cardId,
      ormEntity.cardName,
      ormEntity.billingMonth,
      ormEntity.closingDate,
      ormEntity.paymentDate,
      ormEntity.totalAmount,
      ormEntity.transactionCount,
      categoryBreakdown,
      ormEntity.transactionIds,
      ormEntity.netPaymentAmount,
      ormEntity.status as PaymentStatus,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  /**
   * ドメインエンティティ→ORM変換
   */
  private toOrm(domain: MonthlyCardSummary): MonthlyCardSummaryOrmEntity {
    // CategoryAmountをプレーンオブジェクトに変換
    const categoryBreakdown = domain.categoryBreakdown.map((item) =>
      item.toPlain(),
    );

    return this.repository.create({
      id: domain.id,
      cardId: domain.cardId,
      cardName: domain.cardName,
      billingMonth: domain.billingMonth,
      closingDate: domain.closingDate,
      paymentDate: domain.paymentDate,
      totalAmount: domain.totalAmount,
      transactionCount: domain.transactionCount,
      transactionIds: domain.transactionIds,
      categoryBreakdown,
      netPaymentAmount: domain.netPaymentAmount,
      status: domain.status,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    });
  }
}
