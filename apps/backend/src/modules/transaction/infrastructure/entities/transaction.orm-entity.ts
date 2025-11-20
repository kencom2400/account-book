import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { CategoryType, TransactionStatus } from '@account-book/types';

/**
 * TransactionOrmEntity
 * TypeORM用のトランザクションエンティティ
 * データベースのテーブル構造を定義
 */
@Entity('transactions')
@Index(['date', 'institutionId'])
@Index(['categoryId'])
@Index(['status'])
export class TransactionOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 36, name: 'category_id' })
  categoryId: string;

  @Column({ type: 'varchar', length: 255, name: 'category_name' })
  categoryName: string;

  @Column({
    type: 'enum',
    enum: CategoryType,
    name: 'category_type',
  })
  categoryType: CategoryType;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 36, name: 'institution_id' })
  institutionId: string;

  @Column({ type: 'varchar', length: 36, name: 'account_id' })
  accountId: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.COMPLETED,
  })
  status: TransactionStatus;

  @Column({ type: 'boolean', default: false, name: 'is_reconciled' })
  isReconciled: boolean;

  @Column({
    type: 'varchar',
    length: 36,
    nullable: true,
    name: 'related_transaction_id',
  })
  relatedTransactionId: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  constructor() {
    this.id = '';
    this.date = new Date();
    this.amount = 0;
    this.categoryId = '';
    this.categoryName = '';
    this.categoryType = CategoryType.EXPENSE;
    this.description = '';
    this.institutionId = '';
    this.accountId = '';
    this.status = TransactionStatus.COMPLETED;
    this.isReconciled = false;
    this.relatedTransactionId = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
