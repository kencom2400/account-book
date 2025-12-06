import { Entity, PrimaryColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { EventOrmEntity } from './event.orm-entity';
import { TransactionOrmEntity } from '../../../transaction/infrastructure/entities/transaction.orm-entity';

/**
 * EventTransactionRelationOrmEntity
 * TypeORM用のイベントと取引の関連エンティティ
 * データベースのテーブル構造を定義
 */
@Entity('event_transaction_relations')
@Index(['eventId'])
@Index(['transactionId'])
export class EventTransactionRelationOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36, name: 'event_id' })
  eventId!: string;

  @PrimaryColumn({ type: 'varchar', length: 36, name: 'transaction_id' })
  transactionId!: string;

  @ManyToOne(() => EventOrmEntity, (event) => event.transactionRelations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event!: EventOrmEntity;

  @ManyToOne(() => TransactionOrmEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'transaction_id' })
  transaction!: TransactionOrmEntity;
}
