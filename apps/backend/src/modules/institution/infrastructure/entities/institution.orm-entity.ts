import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { InstitutionType } from '@account-book/types';
import { AccountOrmEntity } from './account.orm-entity';

/**
 * InstitutionOrmEntity
 * TypeORM用の金融機関エンティティ
 * データベースのテーブル構造を定義
 */
@Entity('institutions')
@Index(['type'])
@Index(['is_connected'])
export class InstitutionOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({
    type: 'enum',
    enum: InstitutionType,
  })
  type!: InstitutionType;

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

  @OneToMany(() => AccountOrmEntity, (account) => account.institution)
  accounts!: AccountOrmEntity[];

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt!: Date;
}
