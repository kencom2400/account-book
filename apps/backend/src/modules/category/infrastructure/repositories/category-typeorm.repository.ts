import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryOrmEntity } from '../entities/category.orm-entity';
import { CategoryEntity } from '../../domain/entities/category.entity';

/**
 * CategoryTypeOrmRepository
 * TypeORMを使用したカテゴリリポジトリの実装
 */
@Injectable()
export class CategoryTypeOrmRepository {
  constructor(
    @InjectRepository(CategoryOrmEntity)
    private readonly repository: Repository<CategoryOrmEntity>,
  ) {}

  /**
   * すべてのカテゴリを取得
   */
  async findAll(): Promise<CategoryEntity[]> {
    const ormEntities: CategoryOrmEntity[] = await this.repository.find({
      order: { order: 'ASC' },
    });
    return ormEntities.map((entity: CategoryOrmEntity) =>
      this.toDomain(entity),
    );
  }

  /**
   * IDでカテゴリを取得
   */
  async findById(id: string): Promise<CategoryEntity | null> {
    const ormEntity: CategoryOrmEntity | null = await this.repository.findOne({
      where: { id },
    });

    if (!ormEntity) {
      return null;
    }

    return this.toDomain(ormEntity);
  }

  /**
   * タイプでカテゴリを取得
   */
  async findByType(type: string): Promise<CategoryEntity[]> {
    const ormEntities: CategoryOrmEntity[] = await this.repository.find({
      where: { type: type as CategoryOrmEntity['type'] },
      order: { order: 'ASC' },
    });

    return ormEntities.map((entity: CategoryOrmEntity) =>
      this.toDomain(entity),
    );
  }

  /**
   * トップレベルカテゴリを取得
   */
  async findTopLevel(): Promise<CategoryEntity[]> {
    const ormEntities: CategoryOrmEntity[] = await this.repository.find({
      where: { parentId: null },
      order: { order: 'ASC' },
    });

    return ormEntities.map((entity: CategoryOrmEntity) =>
      this.toDomain(entity),
    );
  }

  /**
   * 親IDで子カテゴリを取得
   */
  async findByParentId(parentId: string): Promise<CategoryEntity[]> {
    const ormEntities: CategoryOrmEntity[] = await this.repository.find({
      where: { parentId },
      order: { order: 'ASC' },
    });

    return ormEntities.map((entity: CategoryOrmEntity) =>
      this.toDomain(entity),
    );
  }

  /**
   * カテゴリを保存
   */
  async save(category: CategoryEntity): Promise<CategoryEntity> {
    const ormEntity: CategoryOrmEntity = this.toOrm(category);
    const saved: CategoryOrmEntity = await this.repository.save(ormEntity);
    return this.toDomain(saved);
  }

  /**
   * カテゴリを削除
   */
  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * ORM→ドメインエンティティ変換
   */
  private toDomain(ormEntity: CategoryOrmEntity): CategoryEntity {
    return new CategoryEntity(
      ormEntity.id,
      ormEntity.name,
      ormEntity.type,
      ormEntity.parentId,
      ormEntity.icon,
      ormEntity.color,
      ormEntity.isSystemDefined,
      ormEntity.order,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  /**
   * ドメインエンティティ→ORM変換
   */
  private toOrm(domain: CategoryEntity): CategoryOrmEntity {
    const ormEntity: CategoryOrmEntity = new CategoryOrmEntity();
    ormEntity.id = domain.id;
    ormEntity.name = domain.name;
    ormEntity.type = domain.type;
    ormEntity.parentId = domain.parentId;
    ormEntity.icon = domain.icon;
    ormEntity.color = domain.color;
    ormEntity.isSystemDefined = domain.isSystemDefined;
    ormEntity.order = domain.order;
    ormEntity.createdAt = domain.createdAt;
    ormEntity.updatedAt = domain.updatedAt;
    return ormEntity;
  }
}
