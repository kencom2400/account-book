import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { HoldingOrmEntity } from './holding.orm-entity';
import { SecurityTransactionOrmEntity } from './security-transaction.orm-entity';

/**
 * SecuritiesAccountOrmEntity
 * TypeORM用の証券口座エンティティ
 * データベースのテーブル構造を定義
 */
@Entity('securities_accounts')
@Index(['is_connected'])
export class SecuritiesAccountOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 255, name: 'securities_company_name' })
  securitiesCompanyName!: string;

  @Column({ type: 'varchar', length: 255, name: 'account_number' })
  accountNumber!: string;

  @Column({ type: 'varchar', length: 50, name: 'account_type' })
  accountType!: string;

  @Column({ type: 'text', name: 'credentials_encrypted' })
  credentialsEncrypted!: string;

  @Column({ type: 'varchar', length: 255, name: 'credentials_iv' })
  credentialsIv!: string;

  @Column({ type: 'varchar', length: 255, name: 'credentials_auth_tag' })
  credentialsAuthTag!: string;

  @Column({ type: 'varchar', length: 50, name: 'credentials_algorithm' })
  credentialsAlgorithm!: string;

  @Column({ type: 'varchar', length: 10, name: 'credentials_version' })
  credentialsVersion!: string;

  @Column({ type: 'boolean', default: false, name: 'is_connected' })
  isConnected!: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'last_synced_at' })
  lastSyncedAt!: Date | null;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    name: 'total_evaluation_amount',
  })
  totalEvaluationAmount!: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    name: 'cash_balance',
  })
  cashBalance!: number;

  @OneToMany(() => HoldingOrmEntity, (holding) => holding.account)
  holdings!: HoldingOrmEntity[];

  @OneToMany(
    () => SecurityTransactionOrmEntity,
    (transaction) => transaction.account,
  )
  transactions!: SecurityTransactionOrmEntity[];

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt!: Date;
}
