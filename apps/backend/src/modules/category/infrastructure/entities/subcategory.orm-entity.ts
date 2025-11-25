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
 * サブカテゴリ ORM Entity
 * TypeORMでデータベースのsubcategoriesテーブルをマッピング
 */
@Entity('subcategories')
@Index(['categoryType', 'isActive'])
@Index(['parentId'])
export class SubcategoryOrmEntity {
  @PrimaryColumn('varchar', { length: 50 })
  id!: string;

  @Column({
    type: 'enum',
    enum: CategoryType,
    name: 'category_type',
  })
  categoryType!: CategoryType;

  @Column('varchar', { length: 100 })
  name!: string;

  @Column('varchar', { length: 50, nullable: true, name: 'parent_id' })
  parentId!: string | null;

  @Column('int', { name: 'display_order' })
  displayOrder!: number;

  @Column('varchar', { length: 10, nullable: true })
  icon!: string | null;

  @Column('varchar', { length: 20, nullable: true })
  color!: string | null;

  @Column('boolean', { name: 'is_default', default: false })
  isDefault!: boolean;

  @Column('boolean', { name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
