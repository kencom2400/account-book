import { Entity, Column, PrimaryColumn, Index } from 'typeorm';
import { CategoryType } from '@account-book/types';

/**
 * 取引カテゴリ変更履歴ORMエンティティ
 * FR-010: 費目の手動修正機能
 */
@Entity('transaction_category_change_history')
@Index(['transactionId', 'changedAt'])
export class TransactionCategoryChangeHistoryOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  transactionId!: string;

  @Column({ type: 'varchar', length: 255 })
  oldCategoryId!: string;

  @Column({ type: 'varchar', length: 100 })
  oldCategoryName!: string;

  @Column({ type: 'enum', enum: CategoryType })
  oldCategoryType!: CategoryType;

  @Column({ type: 'varchar', length: 255 })
  newCategoryId!: string;

  @Column({ type: 'varchar', length: 100 })
  newCategoryName!: string;

  @Column({ type: 'enum', enum: CategoryType })
  newCategoryType!: CategoryType;

  @Column()
  changedAt!: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  changedBy?: string;
}
