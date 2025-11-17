import { CategoryType } from '@account-book/types';

/**
 * Categoryエンティティ
 * カテゴリ（費目）情報を表すドメインエンティティ
 */
export class CategoryEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: CategoryType,
    public readonly parentId: string | null,
    public readonly icon: string | null,
    public readonly color: string | null,
    public readonly isSystemDefined: boolean,
    public readonly order: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id) {
      throw new Error('Category ID is required');
    }

    if (!this.name) {
      throw new Error('Category name is required');
    }

    if (!this.type) {
      throw new Error('Category type is required');
    }

    if (this.order === undefined || this.order === null) {
      throw new Error('Category order is required');
    }
  }

  /**
   * トップレベルカテゴリかどうか
   */
  isTopLevel(): boolean {
    return this.parentId === null;
  }

  /**
   * サブカテゴリかどうか
   */
  isSubCategory(): boolean {
    return this.parentId !== null;
  }

  /**
   * システム定義カテゴリかどうか（編集不可）
   */
  isSystemCategory(): boolean {
    return this.isSystemDefined;
  }

  /**
   * ユーザー定義カテゴリかどうか（編集可能）
   */
  isUserCategory(): boolean {
    return !this.isSystemDefined;
  }

  /**
   * 収入カテゴリかどうか
   */
  isIncome(): boolean {
    return this.type === CategoryType.INCOME;
  }

  /**
   * 支出カテゴリかどうか
   */
  isExpense(): boolean {
    return this.type === CategoryType.EXPENSE;
  }

  /**
   * 振替カテゴリかどうか
   */
  isTransfer(): boolean {
    return this.type === CategoryType.TRANSFER;
  }

  /**
   * カテゴリ名を更新する
   */
  updateName(name: string): CategoryEntity {
    if (this.isSystemDefined) {
      throw new Error('System-defined categories cannot be modified');
    }

    return new CategoryEntity(
      this.id,
      name,
      this.type,
      this.parentId,
      this.icon,
      this.color,
      this.isSystemDefined,
      this.order,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * アイコンを更新する
   */
  updateIcon(icon: string): CategoryEntity {
    return new CategoryEntity(
      this.id,
      this.name,
      this.type,
      this.parentId,
      icon,
      this.color,
      this.isSystemDefined,
      this.order,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 色を更新する
   */
  updateColor(color: string): CategoryEntity {
    return new CategoryEntity(
      this.id,
      this.name,
      this.type,
      this.parentId,
      this.icon,
      color,
      this.isSystemDefined,
      this.order,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 順序を更新する
   */
  updateOrder(order: number): CategoryEntity {
    return new CategoryEntity(
      this.id,
      this.name,
      this.type,
      this.parentId,
      this.icon,
      this.color,
      this.isSystemDefined,
      order,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * プレーンオブジェクトに変換
   */
  toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      parentId: this.parentId,
      icon: this.icon,
      color: this.color,
      isSystemDefined: this.isSystemDefined,
      order: this.order,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
