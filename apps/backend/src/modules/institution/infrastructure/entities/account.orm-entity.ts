import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { InstitutionOrmEntity } from './institution.orm-entity';

/**
 * AccountOrmEntity
 * TypeORM用の口座エンティティ
 * データベースのテーブル構造を定義
 */
@Entity('accounts')
@Index(['institutionId'])
export class AccountOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 36, name: 'institution_id' })
  institutionId!: string;

  @ManyToOne(
    () => InstitutionOrmEntity,
    (institution) => institution.accounts,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'institution_id' })
  institution!: InstitutionOrmEntity;

  @Column({ type: 'varchar', length: 255, name: 'account_number' })
  accountNumber!: string;

  @Column({ type: 'varchar', length: 255, name: 'account_name' })
  accountName!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance!: number;

  @Column({ type: 'varchar', length: 3, default: 'JPY' })
  currency!: string;
}
