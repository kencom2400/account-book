import { CategoryType } from '@account-book/types';
import { Subcategory } from '../entities/subcategory.entity';

/**
 * サブカテゴリRepository Interface
 * Infrastructure層の実装に依存しない抽象化インターフェース
 */
export interface ISubcategoryRepository {
  /**
   * IDでサブカテゴリを取得
   * @param id サブカテゴリID
   * @returns サブカテゴリ | null
   */
  findById(id: string): Promise<Subcategory | null>;

  /**
   * 全サブカテゴリを取得
   * @returns サブカテゴリ配列
   */
  findAll(): Promise<Subcategory[]>;

  /**
   * カテゴリタイプで絞り込んで取得
   * @param categoryType カテゴリタイプ
   * @returns サブカテゴリ配列
   */
  findByCategory(categoryType: CategoryType): Promise<Subcategory[]>;

  /**
   * 親IDで絞り込んで取得（階層構造）
   * @param parentId 親カテゴリID
   * @returns サブカテゴリ配列
   */
  findByParentId(parentId: string): Promise<Subcategory[]>;

  /**
   * デフォルトサブカテゴリを取得
   * カテゴリタイプごとのデフォルト費目（例: "その他支出"）
   * @param categoryType カテゴリタイプ
   * @returns サブカテゴリ | null
   */
  findDefault(categoryType: CategoryType): Promise<Subcategory | null>;

  /**
   * サブカテゴリを保存
   * @param subcategory サブカテゴリ
   * @returns 保存されたサブカテゴリ
   */
  save(subcategory: Subcategory): Promise<Subcategory>;

  /**
   * サブカテゴリを更新
   * @param subcategory サブカテゴリ
   * @returns 更新されたサブカテゴリ
   */
  update(subcategory: Subcategory): Promise<Subcategory>;

  /**
   * サブカテゴリを削除
   * @param id サブカテゴリID
   */
  delete(id: string): Promise<void>;
}

export const SUB_CATEGORY_REPOSITORY = Symbol('ISubcategoryRepository');
