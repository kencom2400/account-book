import { CategoryType } from '@account-book/types';
import { Subcategory } from './subcategory.entity';

describe('Subcategory', () => {
  const baseDate = new Date('2025-11-24T10:00:00Z');

  describe('constructor', () => {
    it('すべてのプロパティで作成できる', () => {
      const subcategory = new Subcategory(
        'sub-1',
        CategoryType.EXPENSE,
        '食費',
        null,
        1,
        '🍴',
        '#FF6B6B',
        false,
        true,
        baseDate,
        baseDate,
      );

      expect(subcategory.id).toBe('sub-1');
      expect(subcategory.categoryType).toBe(CategoryType.EXPENSE);
      expect(subcategory.name).toBe('食費');
      expect(subcategory.parentId).toBeNull();
      expect(subcategory.displayOrder).toBe(1);
      expect(subcategory.icon).toBe('🍴');
      expect(subcategory.color).toBe('#FF6B6B');
      expect(subcategory.isDefault).toBe(false);
      expect(subcategory.isActive).toBe(true);
      expect(subcategory.createdAt).toEqual(baseDate);
      expect(subcategory.updatedAt).toEqual(baseDate);
    });

    it('親カテゴリIDを持つサブカテゴリを作成できる', () => {
      const subcategory = new Subcategory(
        'sub-2',
        CategoryType.EXPENSE,
        '食料品',
        'sub-1',
        1,
        '🛒',
        '#FF8787',
        false,
        true,
        baseDate,
        baseDate,
      );

      expect(subcategory.parentId).toBe('sub-1');
      expect(subcategory.hasParent()).toBe(true);
    });

    it('icon, colorがnullのサブカテゴリを作成できる', () => {
      const subcategory = new Subcategory(
        'sub-3',
        CategoryType.EXPENSE,
        'その他',
        null,
        99,
        null,
        null,
        true,
        true,
        baseDate,
        baseDate,
      );

      expect(subcategory.icon).toBeNull();
      expect(subcategory.color).toBeNull();
      expect(subcategory.isDefault).toBe(true);
    });
  });

  describe('isIncome', () => {
    it('収入カテゴリの場合trueを返す', () => {
      const subcategory = new Subcategory(
        'income-1',
        CategoryType.INCOME,
        '給与',
        null,
        1,
        '💰',
        '#4CAF50',
        false,
        true,
        baseDate,
        baseDate,
      );

      expect(subcategory.isIncome()).toBe(true);
      expect(subcategory.isExpense()).toBe(false);
    });
  });

  describe('isExpense', () => {
    it('支出カテゴリの場合trueを返す', () => {
      const subcategory = new Subcategory(
        'expense-1',
        CategoryType.EXPENSE,
        '食費',
        null,
        1,
        '🍴',
        '#FF6B6B',
        false,
        true,
        baseDate,
        baseDate,
      );

      expect(subcategory.isExpense()).toBe(true);
      expect(subcategory.isIncome()).toBe(false);
    });
  });

  describe('isTransfer', () => {
    it('振替カテゴリの場合trueを返す', () => {
      const subcategory = new Subcategory(
        'transfer-1',
        CategoryType.TRANSFER,
        '振替',
        null,
        1,
        '🔄',
        '#2196F3',
        false,
        true,
        baseDate,
        baseDate,
      );

      expect(subcategory.isTransfer()).toBe(true);
      expect(subcategory.isExpense()).toBe(false);
    });
  });

  describe('isRepayment', () => {
    it('返済カテゴリの場合trueを返す', () => {
      const subcategory = new Subcategory(
        'repayment-1',
        CategoryType.REPAYMENT,
        'ローン返済',
        null,
        1,
        '💳',
        '#9C27B0',
        false,
        true,
        baseDate,
        baseDate,
      );

      expect(subcategory.isRepayment()).toBe(true);
      expect(subcategory.isExpense()).toBe(false);
    });
  });

  describe('isInvestment', () => {
    it('投資カテゴリの場合trueを返す', () => {
      const subcategory = new Subcategory(
        'investment-1',
        CategoryType.INVESTMENT,
        '株式投資',
        null,
        1,
        '📈',
        '#FF9800',
        false,
        true,
        baseDate,
        baseDate,
      );

      expect(subcategory.isInvestment()).toBe(true);
      expect(subcategory.isExpense()).toBe(false);
    });
  });

  describe('hasParent', () => {
    it('親カテゴリIDがある場合trueを返す', () => {
      const subcategory = new Subcategory(
        'sub-2',
        CategoryType.EXPENSE,
        '食料品',
        'sub-1',
        1,
        '🛒',
        '#FF8787',
        false,
        true,
        baseDate,
        baseDate,
      );

      expect(subcategory.hasParent()).toBe(true);
    });

    it('親カテゴリIDがない場合falseを返す', () => {
      const subcategory = new Subcategory(
        'sub-1',
        CategoryType.EXPENSE,
        '食費',
        null,
        1,
        '🍴',
        '#FF6B6B',
        false,
        true,
        baseDate,
        baseDate,
      );

      expect(subcategory.hasParent()).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('JSON形式に変換できる', () => {
      const subcategory = new Subcategory(
        'sub-1',
        CategoryType.EXPENSE,
        '食費',
        null,
        1,
        '🍴',
        '#FF6B6B',
        false,
        true,
        baseDate,
        baseDate,
      );

      const json = subcategory.toJSON();

      expect(json).toEqual({
        id: 'sub-1',
        categoryType: CategoryType.EXPENSE,
        name: '食費',
        parentId: null,
        displayOrder: 1,
        icon: '🍴',
        color: '#FF6B6B',
        isDefault: false,
        isActive: true,
        createdAt: '2025-11-24T10:00:00.000Z',
        updatedAt: '2025-11-24T10:00:00.000Z',
      });
    });

    it('親カテゴリIDを含むJSON形式に変換できる', () => {
      const subcategory = new Subcategory(
        'sub-2',
        CategoryType.EXPENSE,
        '食料品',
        'sub-1',
        1,
        '🛒',
        '#FF8787',
        false,
        true,
        baseDate,
        baseDate,
      );

      const json = subcategory.toJSON();

      expect(json.parentId).toBe('sub-1');
    });

    it('nullプロパティを含むJSON形式に変換できる', () => {
      const subcategory = new Subcategory(
        'sub-3',
        CategoryType.EXPENSE,
        'その他',
        null,
        99,
        null,
        null,
        true,
        true,
        baseDate,
        baseDate,
      );

      const json = subcategory.toJSON();

      expect(json.icon).toBeNull();
      expect(json.color).toBeNull();
      expect(json.parentId).toBeNull();
    });
  });
});
