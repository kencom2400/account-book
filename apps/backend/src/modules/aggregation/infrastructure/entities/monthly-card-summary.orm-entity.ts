import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * MonthlyCardSummaryOrmEntity
 * TypeORM用のクレジットカード月別集計エンティティ
 * データベースのテーブル構造を定義
 */
@Entity('monthly_card_summaries')
@Index(['cardId', 'billingMonth'], { unique: true })
@Index(['cardId'])
@Index(['billingMonth'])
@Index(['paymentDate'])
@Index(['status'])
export class MonthlyCardSummaryOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 36, name: 'card_id' })
  cardId!: string;

  @Column({ type: 'varchar', length: 255, name: 'card_name' })
  cardName!: string;

  @Column({ type: 'varchar', length: 7, name: 'billing_month' })
  billingMonth!: string; // YYYY-MM

  @Column({ type: 'date', name: 'closing_date' })
  closingDate!: Date;

  @Column({ type: 'date', name: 'payment_date' })
  paymentDate!: Date;

  @Column({ type: 'int', name: 'total_amount' })
  totalAmount!: number;

  @Column({ type: 'int', name: 'transaction_count' })
  transactionCount!: number;

  @Column({ type: 'json', name: 'transaction_ids' })
  transactionIds!: string[];

  @Column({ type: 'json', name: 'category_breakdown' })
  categoryBreakdown!: Array<{
    category: string;
    amount: number;
    count: number;
  }>;

  @Column({ type: 'int', name: 'net_payment_amount' })
  netPaymentAmount!: number;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'PENDING',
  })
  status!: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt!: Date;
}
