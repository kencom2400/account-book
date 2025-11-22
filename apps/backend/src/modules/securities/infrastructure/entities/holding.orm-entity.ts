import {
  Entity,
  Column,
  PrimaryColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SecuritiesAccountOrmEntity } from './securities-account.orm-entity';

/**
 * HoldingOrmEntity
 * TypeORM用の保有銘柄エンティティ
 * データベースのテーブル構造を定義
 */
@Entity('holdings')
@Index(['securitiesAccountId'])
@Index(['securityCode'])
export class HoldingOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 36, name: 'securities_account_id' })
  securitiesAccountId!: string;

  @ManyToOne(() => SecuritiesAccountOrmEntity, (account) => account.holdings)
  @JoinColumn({ name: 'securities_account_id' })
  account!: SecuritiesAccountOrmEntity;

  @Column({ type: 'varchar', length: 20, name: 'security_code' })
  securityCode!: string;

  @Column({ type: 'varchar', length: 255, name: 'security_name' })
  securityName!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'average_acquisition_price',
  })
  averageAcquisitionPrice!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'current_price' })
  currentPrice!: number;

  @Column({ type: 'varchar', length: 50, name: 'security_type' })
  securityType!: string;

  @Column({ type: 'varchar', length: 50 })
  market!: string;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt!: Date;
}
