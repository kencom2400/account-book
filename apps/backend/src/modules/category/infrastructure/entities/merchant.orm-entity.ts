import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 店舗マスタ ORM Entity
 * TypeORMでデータベースのmerchantsテーブルをマッピング
 */
@Entity('merchants')
@Index(['name'])
export class MerchantOrmEntity {
  @PrimaryColumn('varchar', { length: 50 })
  id!: string;

  @Column('varchar', { length: 200 })
  name!: string;

  @Column('json', { comment: '店舗別名リスト（JSON配列）' })
  aliases!: string[];

  @Column('varchar', { length: 50, name: 'default_subcategory_id' })
  defaultSubcategoryId!: string;

  @Column('decimal', {
    precision: 3,
    scale: 2,
    comment: '分類信頼度（0.00-1.00）',
  })
  confidence!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
