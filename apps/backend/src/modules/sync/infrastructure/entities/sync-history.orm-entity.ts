import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { SyncStatus } from '../../domain/enums/sync-status.enum';

/**
 * 同期履歴 ORM エンティティ
 *
 * @description
 * 各金融機関の取引履歴同期の実行記録をデータベースに永続化します。
 *
 * @infrastructure
 */
@Entity('sync_histories')
@Index(['institutionId', 'startedAt'])
@Index(['status', 'startedAt'])
export class SyncHistoryOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('varchar', { length: 255 })
  @Index()
  institutionId!: string;

  @Column('varchar', { length: 255 })
  institutionName!: string;

  @Column('varchar', { length: 50 })
  institutionType!: string;

  @Column({
    type: 'enum',
    enum: SyncStatus,
    default: SyncStatus.PENDING,
  })
  @Index()
  status!: SyncStatus;

  @Column({ type: 'timestamp' })
  @Index()
  startedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt!: Date | null;

  @Column({ type: 'int', default: 0 })
  totalFetched!: number;

  @Column({ type: 'int', default: 0 })
  newRecords!: number;

  @Column({ type: 'int', default: 0 })
  duplicateRecords!: number;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ type: 'int', default: 0 })
  retryCount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
