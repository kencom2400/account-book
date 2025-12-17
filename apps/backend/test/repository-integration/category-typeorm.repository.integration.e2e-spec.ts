import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { E2ETestDatabaseHelper } from '../helpers/database-helper';
import { createTestApp } from '../helpers/test-setup';
import {
  CATEGORY_REPOSITORY,
  ICategoryRepository,
} from '../../src/modules/category/domain/repositories/category.repository.interface';
import { CategoryEntity } from '../../src/modules/category/domain/entities/category.entity';
import { CategoryType } from '@account-book/types';

/**
 * CategoryTypeOrmRepository 統合テスト
 *
 * 実際のデータベースを使用してRepositoryの動作を確認します。
 */
describe('CategoryTypeOrmRepository Integration', () => {
  let app: INestApplication;
  let dbHelper: E2ETestDatabaseHelper;
  let repository: ICategoryRepository;

  // テストデータ定数
  const CAT_ID_1 = 'cat_1';
  const CAT_ID_2 = 'cat_2';
  const CAT_NAME_1 = 'Food';
  const CAT_NAME_2 = 'Transport';
  const CAT_NAME_SALARY = 'Salary';
  const CAT_NAME_SUB_FOOD = 'Sub Food';
  const CAT_NAME_UPDATED = 'Updated Food';
  const CAT_ICON_1 = '🍴';
  const CAT_ICON_2 = '🚗';
  const CAT_ICON_SALARY = '💰';
  const CAT_ICON_SUB = '🍔';
  const CAT_COLOR_1 = '#FF6B6B';
  const CAT_COLOR_2 = '#4ECDC4';
  const CAT_COLOR_SALARY = '#4CAF50';
  const CAT_ORDER_1 = 1;
  const CAT_ORDER_2 = 2;

  // 固定日付
  const FIXED_DATE = new Date('2024-01-01T00:00:00Z');

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });

    app = await createTestApp(moduleBuilder, {
      enableValidationPipe: false,
      enableHttpExceptionFilter: false,
    });

    dbHelper = new E2ETestDatabaseHelper(app);

    const isConnected: boolean = await dbHelper.checkConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    repository = app.get<ICategoryRepository>(CATEGORY_REPOSITORY);
  });

  afterAll(async () => {
    await dbHelper.cleanup();
    await app.close();
  });

  beforeEach(async () => {
    await dbHelper.cleanDatabase();
  });

  describe('save', () => {
    it('should save a category to the database', async () => {
      const category = new CategoryEntity(
        CAT_ID_1,
        CAT_NAME_1,
        CategoryType.EXPENSE,
        null,
        CAT_ICON_1,
        CAT_COLOR_1,
        false,
        CAT_ORDER_1,
        FIXED_DATE,
        FIXED_DATE,
      );

      const saved = await repository.save(category);

      expect(saved).toBeInstanceOf(CategoryEntity);
      expect(saved.id).toBe(CAT_ID_1);
      expect(saved.name).toBe(CAT_NAME_1);
      expect(saved.type).toBe(CategoryType.EXPENSE);
    });

    it('should update an existing category', async () => {
      const category = new CategoryEntity(
        CAT_ID_1,
        CAT_NAME_1,
        CategoryType.EXPENSE,
        null,
        CAT_ICON_1,
        CAT_COLOR_1,
        false,
        CAT_ORDER_1,
        FIXED_DATE,
        FIXED_DATE,
      );

      await repository.save(category);

      const updated = new CategoryEntity(
        CAT_ID_1,
        CAT_NAME_UPDATED,
        CategoryType.EXPENSE,
        null,
        CAT_ICON_1,
        CAT_COLOR_1,
        false,
        CAT_ORDER_1,
        FIXED_DATE,
        FIXED_DATE,
      );

      const saved = await repository.save(updated);

      expect(saved.name).toBe(CAT_NAME_UPDATED);
    });
  });

  describe('findById', () => {
    it('should find a category by id', async () => {
      const category = new CategoryEntity(
        CAT_ID_1,
        CAT_NAME_1,
        CategoryType.EXPENSE,
        null,
        CAT_ICON_1,
        CAT_COLOR_1,
        false,
        CAT_ORDER_1,
        FIXED_DATE,
        FIXED_DATE,
      );

      await repository.save(category);

      const found = await repository.findById(CAT_ID_1);

      expect(found).toBeInstanceOf(CategoryEntity);
      expect(found?.id).toBe(CAT_ID_1);
      expect(found?.name).toBe(CAT_NAME_1);
    });

    it('should return null if category not found', async () => {
      const found = await repository.findById('nonexistent');

      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all categories', async () => {
      const category1 = new CategoryEntity(
        CAT_ID_1,
        CAT_NAME_1,
        CategoryType.EXPENSE,
        null,
        CAT_ICON_1,
        CAT_COLOR_1,
        false,
        CAT_ORDER_1,
        FIXED_DATE,
        FIXED_DATE,
      );

      const category2 = new CategoryEntity(
        CAT_ID_2,
        CAT_NAME_2,
        CategoryType.EXPENSE,
        null,
        CAT_ICON_2,
        CAT_COLOR_2,
        false,
        CAT_ORDER_2,
        FIXED_DATE,
        FIXED_DATE,
      );

      await repository.save(category1);
      await repository.save(category2);

      const all = await repository.findAll();

      expect(all).toHaveLength(2);
      expect(all[0].id).toBe(CAT_ID_1); // order ASC
      expect(all[1].id).toBe(CAT_ID_2);
    });

    it('should return empty array if no categories', async () => {
      const all = await repository.findAll();

      expect(all).toHaveLength(0);
    });
  });

  describe('findByType', () => {
    it('should find categories by type', async () => {
      const category1 = new CategoryEntity(
        CAT_ID_1,
        CAT_NAME_1,
        CategoryType.EXPENSE,
        null,
        CAT_ICON_1,
        CAT_COLOR_1,
        false,
        CAT_ORDER_1,
        FIXED_DATE,
        FIXED_DATE,
      );

      const category2 = new CategoryEntity(
        CAT_ID_2,
        CAT_NAME_SALARY,
        CategoryType.INCOME,
        null,
        CAT_ICON_SALARY,
        CAT_COLOR_SALARY,
        false,
        CAT_ORDER_1,
        FIXED_DATE,
        FIXED_DATE,
      );

      await repository.save(category1);
      await repository.save(category2);

      const found = await repository.findByType(CategoryType.EXPENSE);

      expect(found).toHaveLength(1);
      expect(found[0].id).toBe(CAT_ID_1);
      expect(found[0].type).toBe(CategoryType.EXPENSE);
    });
  });

  describe('findTopLevel', () => {
    it('should find top level categories', async () => {
      const category1 = new CategoryEntity(
        CAT_ID_1,
        CAT_NAME_1,
        CategoryType.EXPENSE,
        null,
        CAT_ICON_1,
        CAT_COLOR_1,
        false,
        CAT_ORDER_1,
        FIXED_DATE,
        FIXED_DATE,
      );

      const category2 = new CategoryEntity(
        CAT_ID_2,
        CAT_NAME_SUB_FOOD,
        CategoryType.EXPENSE,
        CAT_ID_1,
        CAT_ICON_SUB,
        CAT_COLOR_1,
        false,
        CAT_ORDER_1,
        FIXED_DATE,
        FIXED_DATE,
      );

      await repository.save(category1);
      await repository.save(category2);

      const found = await repository.findTopLevel();

      expect(found).toHaveLength(1);
      expect(found[0].id).toBe(CAT_ID_1);
      expect(found[0].parentId).toBeNull();
    });
  });

  describe('findByParentId', () => {
    it('should find categories by parent id', async () => {
      const category1 = new CategoryEntity(
        CAT_ID_1,
        CAT_NAME_1,
        CategoryType.EXPENSE,
        null,
        CAT_ICON_1,
        CAT_COLOR_1,
        false,
        CAT_ORDER_1,
        FIXED_DATE,
        FIXED_DATE,
      );

      const category2 = new CategoryEntity(
        CAT_ID_2,
        CAT_NAME_SUB_FOOD,
        CategoryType.EXPENSE,
        CAT_ID_1,
        CAT_ICON_SUB,
        CAT_COLOR_1,
        false,
        CAT_ORDER_1,
        FIXED_DATE,
        FIXED_DATE,
      );

      await repository.save(category1);
      await repository.save(category2);

      const found = await repository.findByParentId(CAT_ID_1);

      expect(found).toHaveLength(1);
      expect(found[0].id).toBe(CAT_ID_2);
      expect(found[0].parentId).toBe(CAT_ID_1);
    });
  });

  describe('findByIds', () => {
    it('should find categories by multiple ids', async () => {
      const category1 = new CategoryEntity(
        CAT_ID_1,
        CAT_NAME_1,
        CategoryType.EXPENSE,
        null,
        CAT_ICON_1,
        CAT_COLOR_1,
        false,
        CAT_ORDER_1,
        FIXED_DATE,
        FIXED_DATE,
      );

      const category2 = new CategoryEntity(
        CAT_ID_2,
        CAT_NAME_2,
        CategoryType.EXPENSE,
        null,
        CAT_ICON_2,
        CAT_COLOR_2,
        false,
        CAT_ORDER_2,
        FIXED_DATE,
        FIXED_DATE,
      );

      await repository.save(category1);
      await repository.save(category2);

      const found = await repository.findByIds([CAT_ID_1, CAT_ID_2]);

      expect(found).toHaveLength(2);
      expect(found.map((c) => c.id)).toContain(CAT_ID_1);
      expect(found.map((c) => c.id)).toContain(CAT_ID_2);
    });

    it('should return empty array if no ids provided', async () => {
      const found = await repository.findByIds([]);

      expect(found).toHaveLength(0);
    });
  });

  describe('delete', () => {
    it('should delete a category', async () => {
      const category = new CategoryEntity(
        CAT_ID_1,
        CAT_NAME_1,
        CategoryType.EXPENSE,
        null,
        CAT_ICON_1,
        CAT_COLOR_1,
        false,
        CAT_ORDER_1,
        FIXED_DATE,
        FIXED_DATE,
      );

      await repository.save(category);

      await repository.delete(CAT_ID_1);

      const found = await repository.findById(CAT_ID_1);
      expect(found).toBeNull();
    });
  });
});
