import { CategoryEntity } from '../entities/category.entity';
import { CategoryType } from '@account-book/types';

/**
 * Category Repositoryのインターフェース
 * ドメイン層で定義し、インフラ層で実装する
 */
export interface ICategoryRepository {
  /**
   * IDでカテゴリを取得
   */
  findById(id: string): Promise<CategoryEntity | null>;

  /**
   * IDの配列でカテゴリを一括取得（N+1問題対策）
   */
  findByIds(ids: string[]): Promise<CategoryEntity[]>;

  /**
   * すべてのカテゴリを取得
   */
  findAll(): Promise<CategoryEntity[]>;

  /**
   * タイプでカテゴリを取得
   */
  findByType(type: CategoryType): Promise<CategoryEntity[]>;

  /**
   * 親IDでサブカテゴリを取得
   */
  findByParentId(parentId: string): Promise<CategoryEntity[]>;

  /**
   * トップレベルカテゴリを取得
   */
  findTopLevel(): Promise<CategoryEntity[]>;

  /**
   * システム定義カテゴリを取得
   */
  findSystemDefined(): Promise<CategoryEntity[]>;

  /**
   * ユーザー定義カテゴリを取得
   */
  findUserDefined(): Promise<CategoryEntity[]>;

  /**
   * カテゴリを保存
   */
  save(category: CategoryEntity): Promise<CategoryEntity>;

  /**
   * カテゴリを更新
   */
  update(category: CategoryEntity): Promise<CategoryEntity>;

  /**
   * カテゴリを削除
   */
  delete(id: string): Promise<void>;

  /**
   * すべてのカテゴリを削除（テスト用）
   */
  deleteAll(): Promise<void>;
}

export const CATEGORY_REPOSITORY = Symbol('ICategoryRepository');
