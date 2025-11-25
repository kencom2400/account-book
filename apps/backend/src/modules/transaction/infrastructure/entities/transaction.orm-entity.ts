import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CategoryType, TransactionStatus } from '@account-book/types';

/**
 * TransactionOrmEntity
 * TypeORM用の取引エンティティ
 * データベースのテーブル構造を定義
 */
@Entity('transactions')
@Index(['institutionId'])
@Index(['accountId'])
@Index(['date'])
@Index(['status'])
export class TransactionOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'timestamp' })
  date!: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 36, name: 'category_id' })
  categoryId!: string;

  @Column({ type: 'varchar', length: 255, name: 'category_name' })
  categoryName!: string;

  @Column({
    type: 'enum',
    enum: CategoryType,
    name: 'category_type',
  })
  categoryType!: CategoryType;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 36, name: 'institution_id' })
  institutionId!: string;

  @Column({ type: 'varchar', length: 36, name: 'account_id' })
  accountId!: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.COMPLETED,
  })
  status!: TransactionStatus;

  @Column({ type: 'boolean', default: false, name: 'is_reconciled' })
  isReconciled!: boolean;

  @Column({
    type: 'varchar',
    length: 36,
    nullable: true,
    name: 'related_transaction_id',
  })
  relatedTransactionId!: string | null;

  @ManyToOne(() => TransactionOrmEntity, { nullable: true })
  @JoinColumn({ name: 'related_transaction_id' })
  relatedTransaction!: TransactionOrmEntity | null;

  // FR-009: サブカテゴリ関連フィールド
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'subcategory_id',
  })
  subcategoryId!: string | null;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    nullable: true,
    name: 'classification_confidence',
    comment: '分類信頼度（0.00-1.00）',
  })
  classificationConfidence!: number | null;

  @Column({
    type: 'enum',
    enum: [
      'MERCHANT_MATCH',
      'KEYWORD_MATCH',
      'AMOUNT_INFERENCE',
      'RECURRING_PATTERN',
      'DEFAULT',
      'MANUAL',
    ],
    nullable: true,
    name: 'classification_reason',
  })
  classificationReason!:
    | 'MERCHANT_MATCH'
    | 'KEYWORD_MATCH'
    | 'AMOUNT_INFERENCE'
    | 'RECURRING_PATTERN'
    | 'DEFAULT'
    | 'MANUAL'
    | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'merchant_id',
  })
  merchantId!: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'confirmed_at',
  })
  confirmedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt!: Date;
}
