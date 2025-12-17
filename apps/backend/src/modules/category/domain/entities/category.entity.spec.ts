import { CategoryType } from '@account-book/types';
import { CategoryEntity } from './category.entity';

describe('CategoryEntity', () => {
  const baseDate = new Date('2025-01-15T10:00:00Z');

  const createValidCategory = (
    id = 'cat_1',
    name = '食費',
    type = CategoryType.EXPENSE,
    parentId: string | null = null,
    isSystemDefined = true,
    order = 1,
  ): CategoryEntity => {
    return new CategoryEntity(
      id,
      name,
      type,
      parentId,
      '🍴',
      '#FF6B6B',
      isSystemDefined,
      order,
      baseDate,
      baseDate,
    );
  };

  describe('constructor', () => {
    it('有効なパラメータでインスタンスを作成できる', () => {
      const category = createValidCategory();

      expect(category.id).toBe('cat_1');
      expect(category.name).toBe('食費');
      expect(category.type).toBe(CategoryType.EXPENSE);
      expect(category.parentId).toBeNull();
      expect(category.icon).toBe('🍴');
      expect(category.color).toBe('#FF6B6B');
      expect(category.isSystemDefined).toBe(true);
      expect(category.order).toBe(1);
      expect(category.createdAt).toEqual(baseDate);
      expect(category.updatedAt).toEqual(baseDate);
    });

    it('IDが空の場合エラーを投げる', () => {
      expect(
        () =>
          new CategoryEntity(
            '',
            '食費',
            CategoryType.EXPENSE,
            null,
            null,
            null,
            true,
            1,
            baseDate,
            baseDate,
          ),
      ).toThrow('Category ID is required');
    });

    it('名前が空の場合エラーを投げる', () => {
      expect(
        () =>
          new CategoryEntity(
            'cat_1',
            '',
            CategoryType.EXPENSE,
            null,
            null,
            null,
            true,
            1,
            baseDate,
            baseDate,
          ),
      ).toThrow('Category name is required');
    });

    it('タイプが未定義の場合エラーを投げる', () => {
      expect(
        () =>
          new CategoryEntity(
            'cat_1',
            '食費',
            undefined as any,
            null,
            null,
            null,
            true,
            1,
            baseDate,
            baseDate,
          ),
      ).toThrow('Category type is required');
    });

    it('順序が未定義の場合エラーを投げる', () => {
      expect(
        () =>
          new CategoryEntity(
            'cat_1',
            '食費',
            CategoryType.EXPENSE,
            null,
            null,
            null,
            true,
            undefined as any,
            baseDate,
            baseDate,
          ),
      ).toThrow('Category order is required');
    });

    it('順序がnullの場合エラーを投げる', () => {
      expect(
        () =>
          new CategoryEntity(
            'cat_1',
            '食費',
            CategoryType.EXPENSE,
            null,
            null,
            null,
            true,
            null as any,
            baseDate,
            baseDate,
          ),
      ).toThrow('Category order is required');
    });
  });

  describe('isTopLevel', () => {
    it('親カテゴリがない場合trueを返す', () => {
      const category = createValidCategory(
        'cat_1',
        '食費',
        CategoryType.EXPENSE,
        null,
      );

      expect(category.isTopLevel()).toBe(true);
    });

    it('親カテゴリがある場合falseを返す', () => {
      const category = createValidCategory(
        'cat_2',
        '食料品',
        CategoryType.EXPENSE,
        'cat_1',
      );

      expect(category.isTopLevel()).toBe(false);
    });
  });

  describe('isSubCategory', () => {
    it('親カテゴリがない場合falseを返す', () => {
      const category = createValidCategory(
        'cat_1',
        '食費',
        CategoryType.EXPENSE,
        null,
      );

      expect(category.isSubCategory()).toBe(false);
    });

    it('親カテゴリがある場合trueを返す', () => {
      const category = createValidCategory(
        'cat_2',
        '食料品',
        CategoryType.EXPENSE,
        'cat_1',
      );

      expect(category.isSubCategory()).toBe(true);
    });
  });

  describe('isSystemCategory', () => {
    it('システム定義カテゴリの場合trueを返す', () => {
      const category = createValidCategory(
        'cat_1',
        '食費',
        CategoryType.EXPENSE,
        null,
        true,
      );

      expect(category.isSystemCategory()).toBe(true);
    });

    it('ユーザー定義カテゴリの場合falseを返す', () => {
      const category = createValidCategory(
        'cat_1',
        '食費',
        CategoryType.EXPENSE,
        null,
        false,
      );

      expect(category.isSystemCategory()).toBe(false);
    });
  });

  describe('isUserCategory', () => {
    it('システム定義カテゴリの場合falseを返す', () => {
      const category = createValidCategory(
        'cat_1',
        '食費',
        CategoryType.EXPENSE,
        null,
        true,
      );

      expect(category.isUserCategory()).toBe(false);
    });

    it('ユーザー定義カテゴリの場合trueを返す', () => {
      const category = createValidCategory(
        'cat_1',
        '食費',
        CategoryType.EXPENSE,
        null,
        false,
      );

      expect(category.isUserCategory()).toBe(true);
    });
  });

  describe('isIncome', () => {
    it('収入カテゴリの場合trueを返す', () => {
      const category = createValidCategory(
        'cat_1',
        '給与',
        CategoryType.INCOME,
      );

      expect(category.isIncome()).toBe(true);
    });

    it('収入カテゴリ以外の場合falseを返す', () => {
      const category = createValidCategory(
        'cat_1',
        '食費',
        CategoryType.EXPENSE,
      );

      expect(category.isIncome()).toBe(false);
    });
  });

  describe('isExpense', () => {
    it('支出カテゴリの場合trueを返す', () => {
      const category = createValidCategory(
        'cat_1',
        '食費',
        CategoryType.EXPENSE,
      );

      expect(category.isExpense()).toBe(true);
    });

    it('支出カテゴリ以外の場合falseを返す', () => {
      const category = createValidCategory(
        'cat_1',
        '給与',
        CategoryType.INCOME,
      );

      expect(category.isExpense()).toBe(false);
    });
  });

  describe('isTransfer', () => {
    it('振替カテゴリの場合trueを返す', () => {
      const category = createValidCategory(
        'cat_1',
        '振替',
        CategoryType.TRANSFER,
      );

      expect(category.isTransfer()).toBe(true);
    });

    it('振替カテゴリ以外の場合falseを返す', () => {
      const category = createValidCategory(
        'cat_1',
        '食費',
        CategoryType.EXPENSE,
      );

      expect(category.isTransfer()).toBe(false);
    });
  });

  describe('updateName', () => {
    it('ユーザー定義カテゴリの名前を更新できる', () => {
      const category = createValidCategory(
        'cat_1',
        '食費',
        CategoryType.EXPENSE,
        null,
        false,
      );

      const updated = category.updateName('外食費');

      expect(updated.name).toBe('外食費');
      expect(updated.id).toBe(category.id);
      expect(updated.type).toBe(category.type);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        category.updatedAt.getTime(),
      );
    });

    it('システム定義カテゴリの名前を更新しようとするとエラーを投げる', () => {
      const category = createValidCategory(
        'cat_1',
        '食費',
        CategoryType.EXPENSE,
        null,
        true,
      );

      expect(() => category.updateName('外食費')).toThrow(
        'System-defined categories cannot be modified',
      );
    });

    it('元のインスタンスは変更されない（不変性）', () => {
      const category = createValidCategory(
        'cat_1',
        '食費',
        CategoryType.EXPENSE,
        null,
        false,
      );
      const originalName = category.name;

      category.updateName('外食費');

      expect(category.name).toBe(originalName);
    });
  });

  describe('updateIcon', () => {
    it('アイコンを更新できる', () => {
      const category = createValidCategory();

      const updated = category.updateIcon('🍔');

      expect(updated.icon).toBe('🍔');
      expect(updated.id).toBe(category.id);
      expect(updated.name).toBe(category.name);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        category.updatedAt.getTime(),
      );
    });

    it('元のインスタンスは変更されない（不変性）', () => {
      const category = createValidCategory();
      const originalIcon = category.icon;

      category.updateIcon('🍔');

      expect(category.icon).toBe(originalIcon);
    });
  });

  describe('updateColor', () => {
    it('色を更新できる', () => {
      const category = createValidCategory();

      const updated = category.updateColor('#FF0000');

      expect(updated.color).toBe('#FF0000');
      expect(updated.id).toBe(category.id);
      expect(updated.name).toBe(category.name);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        category.updatedAt.getTime(),
      );
    });

    it('元のインスタンスは変更されない（不変性）', () => {
      const category = createValidCategory();
      const originalColor = category.color;

      category.updateColor('#FF0000');

      expect(category.color).toBe(originalColor);
    });
  });

  describe('updateOrder', () => {
    it('順序を更新できる', () => {
      const category = createValidCategory();

      const updated = category.updateOrder(5);

      expect(updated.order).toBe(5);
      expect(updated.id).toBe(category.id);
      expect(updated.name).toBe(category.name);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        category.updatedAt.getTime(),
      );
    });

    it('元のインスタンスは変更されない（不変性）', () => {
      const category = createValidCategory();
      const originalOrder = category.order;

      category.updateOrder(5);

      expect(category.order).toBe(originalOrder);
    });
  });

  describe('toJSON', () => {
    it('JSON形式に変換できる', () => {
      const category = createValidCategory();

      const json = category.toJSON();

      expect(json.id).toBe('cat_1');
      expect(json.name).toBe('食費');
      expect(json.type).toBe(CategoryType.EXPENSE);
      expect(json.parentId).toBeNull();
      expect(json.icon).toBe('🍴');
      expect(json.color).toBe('#FF6B6B');
      expect(json.isSystemDefined).toBe(true);
      expect(json.order).toBe(1);
      expect(json.createdAt).toEqual(baseDate);
      expect(json.updatedAt).toEqual(baseDate);
    });

    it('親カテゴリがある場合も正しく変換できる', () => {
      const category = createValidCategory(
        'cat_2',
        '食料品',
        CategoryType.EXPENSE,
        'cat_1',
      );

      const json = category.toJSON();

      expect(json.id).toBe('cat_2');
      expect(json.parentId).toBe('cat_1');
    });
  });
});
