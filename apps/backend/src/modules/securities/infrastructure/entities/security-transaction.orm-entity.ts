import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SecuritiesAccountOrmEntity } from './securities-account.orm-entity';

/**
 * SecurityTransactionOrmEntity
 * TypeORM用の証券取引エンティティ
 * データベースのテーブル構造を定義
 */
@Entity('security_transactions')
@Index(['securitiesAccountId'])
@Index(['transactionDate'])
@Index(['status'])
export class SecurityTransactionOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 60 })
  id!: string;

  @Column({ type: 'varchar', length: 60, name: 'securities_account_id' })
  securitiesAccountId!: string;

  @ManyToOne(
    () => SecuritiesAccountOrmEntity,
    (account) => account.transactions,
  )
  @JoinColumn({ name: 'securities_account_id' })
  account!: SecuritiesAccountOrmEntity;

  @Column({ type: 'varchar', length: 20, name: 'security_code' })
  securityCode!: string;

  @Column({ type: 'varchar', length: 255, name: 'security_name' })
  securityName!: string;

  @Column({ type: 'timestamp', name: 'transaction_date' })
  transactionDate!: Date;

  @Column({ type: 'varchar', length: 50, name: 'transaction_type' })
  transactionType!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  price!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  fee!: number;

  @Column({ type: 'varchar', length: 20 })
  status!: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;
}
