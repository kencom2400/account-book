import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { CategoryType } from '@account-book/types';

/**
 * CategoryOrmEntity
 * TypeORM用のカテゴリエンティティ
 * データベースのテーブル構造を定義
 */
@Entity('categories')
@Index(['type'])
@Index(['parentId'])
export class CategoryOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: CategoryType,
  })
  type: CategoryType;

  @Column({ type: 'varchar', length: 36, nullable: true, name: 'parent_id' })
  parentId: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  color: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_system_defined' })
  isSystemDefined: boolean;

  @Column({ type: 'int', default: 0 })
  order: number;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  constructor() {
    this.id = '';
    this.name = '';
    this.type = CategoryType.EXPENSE;
    this.parentId = null;
    this.icon = null;
    this.color = null;
    this.isSystemDefined = false;
    this.order = 0;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
