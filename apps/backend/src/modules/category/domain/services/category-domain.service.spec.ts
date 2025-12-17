import { Test, TestingModule } from '@nestjs/testing';
import { CategoryDomainService } from './category-domain.service';
import { CategoryEntity } from '../entities/category.entity';
import { CategoryType } from '@account-book/types';

describe('CategoryDomainService', () => {
  let service: CategoryDomainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoryDomainService],
    }).compile();

    service = module.get<CategoryDomainService>(CategoryDomainService);
  });

  describe('createDefaultCategories', () => {
    it('デフォルトカテゴリを生成できる', () => {
      const categories = service.createDefaultCategories();

      expect(categories.length).toBeGreaterThan(0);
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.every((c) => c instanceof CategoryEntity)).toBe(true);
    });

    it('収入カテゴリが含まれている', () => {
      const categories = service.createDefaultCategories();
      const incomeCategories = categories.filter((c) => c.isIncome());

      expect(incomeCategories.length).toBeGreaterThan(0);
      expect(
        incomeCategories.every((c) => c.type === CategoryType.INCOME),
      ).toBe(true);
    });

    it('支出カテゴリが含まれている', () => {
      const categories = service.createDefaultCategories();
      const expenseCategories = categories.filter((c) => c.isExpense());

      expect(expenseCategories.length).toBeGreaterThan(0);
      expect(
        expenseCategories.every((c) => c.type === CategoryType.EXPENSE),
      ).toBe(true);
    });

    it('振替カテゴリが含まれている', () => {
      const categories = service.createDefaultCategories();
      const transferCategories = categories.filter((c) => c.isTransfer());

      expect(transferCategories.length).toBeGreaterThan(0);
      expect(
        transferCategories.every((c) => c.type === CategoryType.TRANSFER),
      ).toBe(true);
    });

    it('返済カテゴリが含まれている', () => {
      const categories = service.createDefaultCategories();
      const repaymentCategories = categories.filter(
        (c) => c.type === CategoryType.REPAYMENT,
      );

      expect(repaymentCategories.length).toBeGreaterThan(0);
    });

    it('投資カテゴリが含まれている', () => {
      const categories = service.createDefaultCategories();
      const investmentCategories = categories.filter(
        (c) => c.type === CategoryType.INVESTMENT,
      );

      expect(investmentCategories.length).toBeGreaterThan(0);
    });

    it('すべてのカテゴリがシステム定義である', () => {
      const categories = service.createDefaultCategories();

      expect(categories.every((c) => c.isSystemDefined)).toBe(true);
    });

    it('親カテゴリと子カテゴリの関係が正しい', () => {
      const categories = service.createDefaultCategories();
      const foodParent = categories.find((c) => c.id === 'expense-food');
      const foodChildren = categories.filter(
        (c) => c.parentId === 'expense-food',
      );

      expect(foodParent).toBeDefined();
      expect(foodChildren.length).toBeGreaterThan(0);
      expect(foodChildren.every((c) => c.parentId === foodParent!.id)).toBe(
        true,
      );
    });
  });

  describe('buildCategoryTree', () => {
    it('カテゴリを階層構造に変換できる', () => {
      const parent = new CategoryEntity(
        'parent-1',
        '親カテゴリ',
        CategoryType.EXPENSE,
        null,
        null,
        null,
        true,
        1,
        new Date(),
        new Date(),
      );
      const child1 = new CategoryEntity(
        'child-1',
        '子カテゴリ1',
        CategoryType.EXPENSE,
        'parent-1',
        null,
        null,
        true,
        1,
        new Date(),
        new Date(),
      );
      const child2 = new CategoryEntity(
        'child-2',
        '子カテゴリ2',
        CategoryType.EXPENSE,
        'parent-1',
        null,
        null,
        true,
        2,
        new Date(),
        new Date(),
      );
      const categories = [parent, child1, child2];

      const tree = service.buildCategoryTree(categories);

      expect(tree.length).toBe(1);
      expect(tree[0].category.id).toBe('parent-1');
      expect(tree[0].children.length).toBe(2);
      expect(tree[0].children[0].category.id).toBe('child-1');
      expect(tree[0].children[1].category.id).toBe('child-2');
    });

    it('複数の親カテゴリを処理できる', () => {
      const parent1 = new CategoryEntity(
        'parent-1',
        '親カテゴリ1',
        CategoryType.EXPENSE,
        null,
        null,
        null,
        true,
        1,
        new Date(),
        new Date(),
      );
      const parent2 = new CategoryEntity(
        'parent-2',
        '親カテゴリ2',
        CategoryType.EXPENSE,
        null,
        null,
        null,
        true,
        2,
        new Date(),
        new Date(),
      );
      const categories = [parent1, parent2];

      const tree = service.buildCategoryTree(categories);

      expect(tree.length).toBe(2);
      expect(tree[0].category.id).toBe('parent-1');
      expect(tree[1].category.id).toBe('parent-2');
    });

    it('子カテゴリがない親カテゴリも処理できる', () => {
      const parent = new CategoryEntity(
        'parent-1',
        '親カテゴリ',
        CategoryType.EXPENSE,
        null,
        null,
        null,
        true,
        1,
        new Date(),
        new Date(),
      );
      const categories = [parent];

      const tree = service.buildCategoryTree(categories);

      expect(tree.length).toBe(1);
      expect(tree[0].category.id).toBe('parent-1');
      expect(tree[0].children.length).toBe(0);
    });

    it('順序でソートされる', () => {
      const parent1 = new CategoryEntity(
        'parent-1',
        '親カテゴリ1',
        CategoryType.EXPENSE,
        null,
        null,
        null,
        true,
        2,
        new Date(),
        new Date(),
      );
      const parent2 = new CategoryEntity(
        'parent-2',
        '親カテゴリ2',
        CategoryType.EXPENSE,
        null,
        null,
        null,
        true,
        1,
        new Date(),
        new Date(),
      );
      const categories = [parent1, parent2];

      const tree = service.buildCategoryTree(categories);

      expect(tree[0].category.id).toBe('parent-2');
      expect(tree[1].category.id).toBe('parent-1');
    });

    it('空の配列を処理できる', () => {
      const tree = service.buildCategoryTree([]);

      expect(tree.length).toBe(0);
    });
  });

  describe('canDelete', () => {
    it('システム定義カテゴリは削除不可', () => {
      const category = new CategoryEntity(
        'cat-1',
        'システムカテゴリ',
        CategoryType.EXPENSE,
        null,
        null,
        null,
        true,
        1,
        new Date(),
        new Date(),
      );

      const canDelete = service.canDelete(category, false);

      expect(canDelete).toBe(false);
    });

    it('取引が紐づいているユーザー定義カテゴリは削除不可', () => {
      const category = new CategoryEntity(
        'cat-1',
        'ユーザーカテゴリ',
        CategoryType.EXPENSE,
        null,
        null,
        null,
        false,
        1,
        new Date(),
        new Date(),
      );

      const canDelete = service.canDelete(category, true);

      expect(canDelete).toBe(false);
    });

    it('取引が紐づいていないユーザー定義カテゴリは削除可能', () => {
      const category = new CategoryEntity(
        'cat-1',
        'ユーザーカテゴリ',
        CategoryType.EXPENSE,
        null,
        null,
        null,
        false,
        1,
        new Date(),
        new Date(),
      );

      const canDelete = service.canDelete(category, false);

      expect(canDelete).toBe(true);
    });

    it('システム定義カテゴリは取引が紐づいていなくても削除不可', () => {
      const category = new CategoryEntity(
        'cat-1',
        'システムカテゴリ',
        CategoryType.EXPENSE,
        null,
        null,
        null,
        true,
        1,
        new Date(),
        new Date(),
      );

      const canDelete = service.canDelete(category, false);

      expect(canDelete).toBe(false);
    });
  });
});
