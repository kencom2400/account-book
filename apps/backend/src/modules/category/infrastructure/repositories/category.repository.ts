import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CategoryEntity } from '../../domain/entities/category.entity';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { CategoryType } from '@account-book/types';

/**
 * JSONファイルに保存するカテゴリデータの型定義
 */
interface CategoryJSON {
  id: string;
  name: string;
  type: CategoryType;
  parentId: string | null;
  icon: string | null;
  color: string | null;
  isSystemDefined: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Category Repository Implementation
 * JSONファイルでの永続化を実装
 */
@Injectable()
export class CategoryRepository implements ICategoryRepository {
  private readonly dataDir: string;
  private readonly fileName = 'categories.json';

  constructor(private configService: ConfigService) {
    this.dataDir = path.join(process.cwd(), 'data', 'categories');
    void this.ensureDataDirectory();
  }

  /**
   * データディレクトリの存在を確認・作成
   */
  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }

  /**
   * データファイルのパスを取得
   */
  private getFilePath(): string {
    return path.join(this.dataDir, this.fileName);
  }

  /**
   * データファイルを読み込み
   */
  private async loadData(): Promise<CategoryEntity[]> {
    await this.ensureDataDirectory();
    const filePath = this.getFilePath();

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content) as unknown;
      return Array.isArray(data)
        ? data.map((item) => this.toEntity(item as CategoryJSON))
        : [];
    } catch {
      // ファイルが存在しない場合は空配列を返す
      return [];
    }
  }

  /**
   * データファイルに保存
   */
  private async saveData(categories: CategoryEntity[]): Promise<void> {
    await this.ensureDataDirectory();
    const filePath = this.getFilePath();
    const data = categories.map((c) => this.toJSON(c));
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * IDでカテゴリを取得
   */
  async findById(id: string): Promise<CategoryEntity | null> {
    const categories = await this.loadData();
    return categories.find((c) => c.id === id) || null;
  }

  /**
   * IDの配列でカテゴリを一括取得（N+1問題対策）
   */
  async findByIds(ids: string[]): Promise<CategoryEntity[]> {
    if (ids.length === 0) {
      return [];
    }
    const categories = await this.loadData();
    const idSet = new Set(ids);
    return categories.filter((c) => idSet.has(c.id));
  }

  /**
   * すべてのカテゴリを取得
   */
  async findAll(): Promise<CategoryEntity[]> {
    return await this.loadData();
  }

  /**
   * タイプでカテゴリを取得
   */
  async findByType(type: CategoryType): Promise<CategoryEntity[]> {
    const categories = await this.loadData();
    return categories.filter((c) => c.type === type);
  }

  /**
   * 親IDでサブカテゴリを取得
   */
  async findByParentId(parentId: string): Promise<CategoryEntity[]> {
    const categories = await this.loadData();
    return categories.filter((c) => c.parentId === parentId);
  }

  /**
   * トップレベルカテゴリを取得
   */
  async findTopLevel(): Promise<CategoryEntity[]> {
    const categories = await this.loadData();
    return categories.filter((c) => c.isTopLevel());
  }

  /**
   * システム定義カテゴリを取得
   */
  async findSystemDefined(): Promise<CategoryEntity[]> {
    const categories = await this.loadData();
    return categories.filter((c) => c.isSystemDefined);
  }

  /**
   * ユーザー定義カテゴリを取得
   */
  async findUserDefined(): Promise<CategoryEntity[]> {
    const categories = await this.loadData();
    return categories.filter((c) => !c.isSystemDefined);
  }

  /**
   * カテゴリを保存
   */
  async save(category: CategoryEntity): Promise<CategoryEntity> {
    const categories = await this.loadData();
    categories.push(category);
    await this.saveData(categories);
    return category;
  }

  /**
   * カテゴリを更新
   */
  async update(category: CategoryEntity): Promise<CategoryEntity> {
    const categories = await this.loadData();
    const updatedCategories = categories.map((c) =>
      c.id === category.id ? category : c,
    );
    await this.saveData(updatedCategories);
    return category;
  }

  /**
   * カテゴリを削除
   */
  async delete(id: string): Promise<void> {
    const categories = await this.loadData();
    const filteredCategories = categories.filter((c) => c.id !== id);
    await this.saveData(filteredCategories);
  }

  /**
   * すべてのカテゴリを削除（テスト用）
   */
  async deleteAll(): Promise<void> {
    await this.saveData([]);
  }

  /**
   * エンティティをJSONオブジェクトに変換
   */
  private toJSON(entity: CategoryEntity): CategoryJSON {
    return {
      id: entity.id,
      name: entity.name,
      type: entity.type,
      parentId: entity.parentId,
      icon: entity.icon,
      color: entity.color,
      isSystemDefined: entity.isSystemDefined,
      order: entity.order,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  /**
   * JSONオブジェクトをエンティティに変換
   */
  private toEntity(data: CategoryJSON): CategoryEntity {
    return new CategoryEntity(
      data.id,
      data.name,
      data.type,
      data.parentId || null,
      data.icon || null,
      data.color || null,
      data.isSystemDefined || false,
      data.order || 0,
      new Date(data.createdAt),
      new Date(data.updatedAt),
    );
  }
}
