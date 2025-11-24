import { CategoryType } from '@account-book/types';

/**
 * サブカテゴリ Domain Entity
 * 詳細費目を表すドメインエンティティ
 */
export class Subcategory {
  constructor(
    public readonly id: string,
    public readonly categoryType: CategoryType,
    public readonly name: string,
    public readonly parentId: string | null,
    public readonly displayOrder: number,
    public readonly icon: string | null,
    public readonly color: string | null,
    public readonly isDefault: boolean,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * 収入カテゴリかどうか
   */
  public isIncome(): boolean {
    return this.categoryType === CategoryType.INCOME;
  }

  /**
   * 支出カテゴリかどうか
   */
  public isExpense(): boolean {
    return this.categoryType === CategoryType.EXPENSE;
  }

  /**
   * 振替カテゴリかどうか
   */
  public isTransfer(): boolean {
    return this.categoryType === CategoryType.TRANSFER;
  }

  /**
   * 返済カテゴリかどうか
   */
  public isRepayment(): boolean {
    return this.categoryType === CategoryType.REPAYMENT;
  }

  /**
   * 投資カテゴリかどうか
   */
  public isInvestment(): boolean {
    return this.categoryType === CategoryType.INVESTMENT;
  }

  /**
   * 親カテゴリを持つかどうか（階層構造）
   */
  public hasParent(): boolean {
    return this.parentId !== null;
  }

  /**
   * JSONレスポンス形式に変換
   */
  public toJSON(): SubcategoryJSONResponse {
    return {
      id: this.id,
      categoryType: this.categoryType,
      name: this.name,
      parentId: this.parentId,
      displayOrder: this.displayOrder,
      icon: this.icon,
      color: this.color,
      isDefault: this.isDefault,
      isActive: this.isActive,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

/**
 * サブカテゴリ JSON レスポンス型
 */
export interface SubcategoryJSONResponse {
  id: string;
  categoryType: CategoryType;
  name: string;
  parentId: string | null;
  displayOrder: number;
  icon: string | null;
  color: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
