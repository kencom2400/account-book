import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { EventTransactionRelationOrmEntity } from './event-transaction-relation.orm-entity';

/**
 * EventOrmEntity
 * TypeORM用のイベントエンティティ
 * データベースのテーブル構造を定義
 */
@Entity('events')
@Index(['date'])
@Index(['category'])
export class EventOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ type: 'varchar', length: 100 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    type: 'varchar',
    length: 50,
  })
  category!: string;

  @Column({ type: 'json', nullable: true })
  tags!: string[] | null;

  @OneToMany(
    () => EventTransactionRelationOrmEntity,
    (relation) => relation.event,
    {
      cascade: true,
    },
  )
  transactionRelations!: EventTransactionRelationOrmEntity[];

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt!: Date;
}
