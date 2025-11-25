import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryType } from '@account-book/types';
import type { ISubcategoryRepository } from '../../domain/repositories/subcategory.repository.interface';
import { Subcategory } from '../../domain/entities/subcategory.entity';
import { SubcategoryOrmEntity } from '../entities/subcategory.orm-entity';

/**
 * サブカテゴリリポジトリ TypeORM実装
 * ISubcategoryRepositoryの実装クラス
 */
@Injectable()
export class SubcategoryTypeOrmRepository implements ISubcategoryRepository {
  constructor(
    @InjectRepository(SubcategoryOrmEntity)
    private readonly repository: Repository<SubcategoryOrmEntity>,
  ) {}

  /**
   * ORM Entity → Domain Entity変換
   */
  private toDomain(ormEntity: SubcategoryOrmEntity): Subcategory {
    return new Subcategory(
      ormEntity.id,
      ormEntity.categoryType,
      ormEntity.name,
      ormEntity.parentId,
      ormEntity.displayOrder,
      ormEntity.icon,
      ormEntity.color,
      ormEntity.isDefault,
      ormEntity.isActive,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  /**
   * Domain Entity → ORM Entity変換
   */
  private toOrm(domainEntity: Subcategory): SubcategoryOrmEntity {
    const ormEntity = new SubcategoryOrmEntity();
    ormEntity.id = domainEntity.id;
    ormEntity.categoryType = domainEntity.categoryType;
    ormEntity.name = domainEntity.name;
    ormEntity.parentId = domainEntity.parentId;
    ormEntity.displayOrder = domainEntity.displayOrder;
    ormEntity.icon = domainEntity.icon;
    ormEntity.color = domainEntity.color;
    ormEntity.isDefault = domainEntity.isDefault;
    ormEntity.isActive = domainEntity.isActive;
    ormEntity.createdAt = domainEntity.createdAt;
    ormEntity.updatedAt = domainEntity.updatedAt;
    return ormEntity;
  }

  async save(subcategory: Subcategory): Promise<Subcategory> {
    const ormEntity = this.toOrm(subcategory);
    const saved = await this.repository.save(ormEntity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Subcategory | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? this.toDomain(ormEntity) : null;
  }

  async findAll(): Promise<Subcategory[]> {
    const ormEntities = await this.repository.find({
      order: { displayOrder: 'ASC' },
    });
    return ormEntities.map((entity) => this.toDomain(entity));
  }

  async findByCategory(categoryType: CategoryType): Promise<Subcategory[]> {
    const ormEntities = await this.repository.find({
      where: { categoryType, isActive: true },
      order: { displayOrder: 'ASC' },
    });
    return ormEntities.map((entity) => this.toDomain(entity));
  }

  async findByParentId(parentId: string): Promise<Subcategory[]> {
    const ormEntities = await this.repository.find({
      where: { parentId, isActive: true },
      order: { displayOrder: 'ASC' },
    });
    return ormEntities.map((entity) => this.toDomain(entity));
  }

  async findDefault(categoryType: CategoryType): Promise<Subcategory | null> {
    const ormEntity = await this.repository.findOne({
      where: { categoryType, isDefault: true, isActive: true },
    });
    return ormEntity ? this.toDomain(ormEntity) : null;
  }

  async update(subcategory: Subcategory): Promise<Subcategory> {
    const ormEntity = this.toOrm(subcategory);
    const updated = await this.repository.save(ormEntity);
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
