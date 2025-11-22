import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SyncStatus } from '../../domain/enums/sync-status.enum';

/**
 * 同期履歴 ORM エンティティ
 */
@Entity('sync_histories')
export class SyncHistoryOrmEntity {
  @PrimaryColumn()
  id!: string;

  @Column({
    type: 'enum',
    enum: SyncStatus,
  })
  status!: SyncStatus;

  @Column({ type: 'timestamp' })
  startedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt!: Date | null;

  @Column({ type: 'int' })
  totalInstitutions!: number;

  @Column({ type: 'int', default: 0 })
  successCount!: number;

  @Column({ type: 'int', default: 0 })
  failureCount!: number;

  @Column({ type: 'int', default: 0 })
  newTransactionsCount!: number;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ type: 'json', nullable: true })
  errorDetails!: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
