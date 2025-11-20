import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { InstitutionType } from '@account-book/types';

/**
 * AccountJSON型定義
 * accounts JSONフィールドの型定義
 */
export interface AccountJSON {
  id: string;
  institutionId: string;
  accountNumber: string;
  accountName: string;
  balance: number;
  currency: string;
}

/**
 * InstitutionOrmEntity
 * TypeORM用の金融機関エンティティ
 * データベースのテーブル構造を定義
 */
@Entity('institutions')
@Index(['type'])
@Index(['isConnected'])
export class InstitutionOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name!: string;

  @Column({
    type: 'enum',
    enum: InstitutionType,
  })
  type!: InstitutionType;

  @Column({ type: 'text', name: 'encrypted_credentials' })
  encryptedCredentials!: string;

  @Column({ type: 'boolean', default: false, name: 'is_connected' })
  isConnected!: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'last_synced_at' })
  lastSyncedAt!: Date | null;

  @Column({ type: 'json', nullable: true })
  accounts!: AccountJSON[];

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt!: Date;
}
