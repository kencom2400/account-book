import { Injectable } from '@nestjs/common';
import { CategoryEntity } from '../entities/category.entity';
import { CategoryType } from '@account-book/types';

/**
 * Category Domain Service
 * カテゴリに関するドメインロジックを実装
 */
@Injectable()
export class CategoryDomainService {
  /**
   * デフォルトのカテゴリ構造を生成
   * MoneyTree、MoneyForwardを参考にした費目分類
   */
  createDefaultCategories(): CategoryEntity[] {
    const categories: CategoryEntity[] = [];
    const now = new Date();

    // 収入カテゴリ
    categories.push(
      this.createCategory('income-salary', '給与所得', CategoryType.INCOME, null, '💰', '#4CAF50', true, 1, now),
      this.createCategory('income-bonus', '賞与', CategoryType.INCOME, null, '🎁', '#4CAF50', true, 2, now),
      this.createCategory('income-investment', '投資収益', CategoryType.INCOME, null, '📈', '#4CAF50', true, 3, now),
      this.createCategory('income-other', 'その他収入', CategoryType.INCOME, null, '💵', '#4CAF50', true, 4, now),
    );

    // 支出カテゴリ（親カテゴリ）
    const foodParentId = 'expense-food';
    const transportParentId = 'expense-transport';
    const housingParentId = 'expense-housing';
    const utilityParentId = 'expense-utility';
    const medicalParentId = 'expense-medical';
    const educationParentId = 'expense-education';
    const entertainmentParentId = 'expense-entertainment';
    const clothingParentId = 'expense-clothing';
    const beautyParentId = 'expense-beauty';
    const communicationParentId = 'expense-communication';
    const insuranceParentId = 'expense-insurance';
    const otherParentId = 'expense-other';

    categories.push(
      this.createCategory(foodParentId, '食費', CategoryType.EXPENSE, null, '🍽️', '#FF5722', true, 1, now),
      this.createCategory(transportParentId, '交通費', CategoryType.EXPENSE, null, '🚃', '#FF9800', true, 2, now),
      this.createCategory(housingParentId, '住居費', CategoryType.EXPENSE, null, '🏠', '#795548', true, 3, now),
      this.createCategory(utilityParentId, '水道光熱費', CategoryType.EXPENSE, null, '💡', '#FFC107', true, 4, now),
      this.createCategory(medicalParentId, '医療費', CategoryType.EXPENSE, null, '🏥', '#F44336', true, 5, now),
      this.createCategory(educationParentId, '教育費', CategoryType.EXPENSE, null, '📚', '#3F51B5', true, 6, now),
      this.createCategory(entertainmentParentId, '娯楽費', CategoryType.EXPENSE, null, '🎮', '#9C27B0', true, 7, now),
      this.createCategory(clothingParentId, '衣服費', CategoryType.EXPENSE, null, '👔', '#E91E63', true, 8, now),
      this.createCategory(beautyParentId, '美容費', CategoryType.EXPENSE, null, '💄', '#E91E63', true, 9, now),
      this.createCategory(communicationParentId, '通信費', CategoryType.EXPENSE, null, '📱', '#2196F3', true, 10, now),
      this.createCategory(insuranceParentId, '保険料', CategoryType.EXPENSE, null, '🛡️', '#607D8B', true, 11, now),
      this.createCategory(otherParentId, 'その他支出', CategoryType.EXPENSE, null, '📦', '#9E9E9E', true, 12, now),
    );

    // 支出カテゴリ（サブカテゴリ）
    categories.push(
      // 食費
      this.createCategory('expense-food-groceries', '食料品', CategoryType.EXPENSE, foodParentId, '🛒', '#FF5722', true, 1, now),
      this.createCategory('expense-food-dining', '外食', CategoryType.EXPENSE, foodParentId, '🍴', '#FF5722', true, 2, now),
      this.createCategory('expense-food-cafe', 'カフェ', CategoryType.EXPENSE, foodParentId, '☕', '#FF5722', true, 3, now),
      
      // 交通費
      this.createCategory('expense-transport-train', '電車', CategoryType.EXPENSE, transportParentId, '🚆', '#FF9800', true, 1, now),
      this.createCategory('expense-transport-bus', 'バス', CategoryType.EXPENSE, transportParentId, '🚌', '#FF9800', true, 2, now),
      this.createCategory('expense-transport-taxi', 'タクシー', CategoryType.EXPENSE, transportParentId, '🚕', '#FF9800', true, 3, now),
      this.createCategory('expense-transport-gas', 'ガソリン', CategoryType.EXPENSE, transportParentId, '⛽', '#FF9800', true, 4, now),
      
      // 住居費
      this.createCategory('expense-housing-rent', '家賃', CategoryType.EXPENSE, housingParentId, '🏘️', '#795548', true, 1, now),
      this.createCategory('expense-housing-maintenance', '管理費', CategoryType.EXPENSE, housingParentId, '🔧', '#795548', true, 2, now),
      
      // 医療費
      this.createCategory('expense-medical-hospital', '病院', CategoryType.EXPENSE, medicalParentId, '🏥', '#F44336', true, 1, now),
      this.createCategory('expense-medical-pharmacy', '薬局', CategoryType.EXPENSE, medicalParentId, '💊', '#F44336', true, 2, now),
    );

    // 振替カテゴリ
    categories.push(
      this.createCategory('transfer-bank', '銀行間振替', CategoryType.TRANSFER, null, '🏦', '#2196F3', true, 1, now),
      this.createCategory('transfer-credit-card', 'クレジットカード引落', CategoryType.TRANSFER, null, '💳', '#2196F3', true, 2, now),
      this.createCategory('transfer-cash', '現金引出', CategoryType.TRANSFER, null, '💵', '#2196F3', true, 3, now),
    );

    // 返済カテゴリ
    categories.push(
      this.createCategory('repayment-loan', 'ローン返済', CategoryType.REPAYMENT, null, '💰', '#FF9800', true, 1, now),
      this.createCategory('repayment-credit', 'クレジット返済', CategoryType.REPAYMENT, null, '💳', '#FF9800', true, 2, now),
    );

    // 投資カテゴリ
    categories.push(
      this.createCategory('investment-stock', '株式投資', CategoryType.INVESTMENT, null, '📈', '#4CAF50', true, 1, now),
      this.createCategory('investment-fund', '投資信託', CategoryType.INVESTMENT, null, '📊', '#4CAF50', true, 2, now),
      this.createCategory('investment-crypto', '暗号資産', CategoryType.INVESTMENT, null, '₿', '#4CAF50', true, 3, now),
    );

    return categories;
  }

  /**
   * カテゴリを階層構造で取得
   */
  buildCategoryTree(categories: CategoryEntity[]): CategoryNode[] {
    const topLevelCategories = categories.filter((c) => c.isTopLevel());
    const tree: CategoryNode[] = [];

    for (const parent of topLevelCategories) {
      const children = categories.filter((c) => c.parentId === parent.id);
      tree.push({
        category: parent,
        children: children.map((child) => ({
          category: child,
          children: [],
        })),
      });
    }

    return tree.sort((a, b) => a.category.order - b.category.order);
  }

  /**
   * カテゴリが削除可能かどうかを判定
   */
  canDelete(category: CategoryEntity, hasTransactions: boolean): boolean {
    // システム定義カテゴリは削除不可
    if (category.isSystemDefined) {
      return false;
    }

    // 取引が紐づいている場合は削除不可
    if (hasTransactions) {
      return false;
    }

    return true;
  }

  private createCategory(
    id: string,
    name: string,
    type: CategoryType,
    parentId: string | null,
    icon: string | null,
    color: string | null,
    isSystemDefined: boolean,
    order: number,
    createdAt: Date,
  ): CategoryEntity {
    return new CategoryEntity(
      id,
      name,
      type,
      parentId,
      icon,
      color,
      isSystemDefined,
      order,
      createdAt,
      createdAt,
    );
  }
}

/**
 * カテゴリツリーのノード
 */
export interface CategoryNode {
  category: CategoryEntity;
  children: CategoryNode[];
}

