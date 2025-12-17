import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { E2ETestDatabaseHelper } from '../helpers/database-helper';
import { createTestApp } from '../helpers/test-setup';
import { CATEGORY_REPOSITORY } from '../../src/modules/category/domain/repositories/category.repository.interface';
import { ICategoryRepository } from '../../src/modules/category/domain/repositories/category.repository.interface';
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
        'cat_1',
        'Food',
        CategoryType.EXPENSE,
        null,
        '🍴',
        '#FF6B6B',
        false,
        1,
        new Date(),
        new Date(),
      );

      const saved = await repository.save(category);

      expect(saved).toBeInstanceOf(CategoryEntity);
      expect(saved.id).toBe('cat_1');
      expect(saved.name).toBe('Food');
      expect(saved.type).toBe(CategoryType.EXPENSE);
    });

    it('should update an existing category', async () => {
      const category = new CategoryEntity(
        'cat_1',
        'Food',
        CategoryType.EXPENSE,
        null,
        '🍴',
        '#FF6B6B',
        false,
        1,
        new Date(),
        new Date(),
      );

      await repository.save(category);

      const updated = new CategoryEntity(
        'cat_1',
        'Updated Food',
        CategoryType.EXPENSE,
        null,
        '🍴',
        '#FF6B6B',
        false,
        1,
        new Date(),
        new Date(),
      );

      const saved = await repository.save(updated);

      expect(saved.name).toBe('Updated Food');
    });
  });

  describe('findById', () => {
    it('should find a category by id', async () => {
      const category = new CategoryEntity(
        'cat_1',
        'Food',
        CategoryType.EXPENSE,
        null,
        '🍴',
        '#FF6B6B',
        false,
        1,
        new Date(),
        new Date(),
      );

      await repository.save(category);

      const found = await repository.findById('cat_1');

      expect(found).toBeInstanceOf(CategoryEntity);
      expect(found?.id).toBe('cat_1');
      expect(found?.name).toBe('Food');
    });

    it('should return null if category not found', async () => {
      const found = await repository.findById('nonexistent');

      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all categories', async () => {
      const category1 = new CategoryEntity(
        'cat_1',
        'Food',
        CategoryType.EXPENSE,
        null,
        '🍴',
        '#FF6B6B',
        false,
        1,
        new Date(),
        new Date(),
      );

      const category2 = new CategoryEntity(
        'cat_2',
        'Transport',
        CategoryType.EXPENSE,
        null,
        '🚗',
        '#4ECDC4',
        false,
        2,
        new Date(),
        new Date(),
      );

      await repository.save(category1);
      await repository.save(category2);

      const all = await repository.findAll();

      expect(all).toHaveLength(2);
      expect(all[0].id).toBe('cat_1'); // order ASC
      expect(all[1].id).toBe('cat_2');
    });

    it('should return empty array if no categories', async () => {
      const all = await repository.findAll();

      expect(all).toHaveLength(0);
    });
  });

  describe('findByType', () => {
    it('should find categories by type', async () => {
      const category1 = new CategoryEntity(
        'cat_1',
        'Food',
        CategoryType.EXPENSE,
        null,
        '🍴',
        '#FF6B6B',
        false,
        1,
        new Date(),
        new Date(),
      );

      const category2 = new CategoryEntity(
        'cat_2',
        'Salary',
        CategoryType.INCOME,
        null,
        '💰',
        '#4CAF50',
        false,
        1,
        new Date(),
        new Date(),
      );

      await repository.save(category1);
      await repository.save(category2);

      const found = await repository.findByType(CategoryType.EXPENSE);

      expect(found).toHaveLength(1);
      expect(found[0].id).toBe('cat_1');
      expect(found[0].type).toBe(CategoryType.EXPENSE);
    });
  });

  describe('findTopLevel', () => {
    it('should find top level categories', async () => {
      const category1 = new CategoryEntity(
        'cat_1',
        'Food',
        CategoryType.EXPENSE,
        null,
        '🍴',
        '#FF6B6B',
        false,
        1,
        new Date(),
        new Date(),
      );

      const category2 = new CategoryEntity(
        'cat_2',
        'Sub Food',
        CategoryType.EXPENSE,
        'cat_1',
        '🍔',
        '#FF6B6B',
        false,
        1,
        new Date(),
        new Date(),
      );

      await repository.save(category1);
      await repository.save(category2);

      const found = await repository.findTopLevel();

      expect(found).toHaveLength(1);
      expect(found[0].id).toBe('cat_1');
      expect(found[0].parentId).toBeNull();
    });
  });

  describe('findByParentId', () => {
    it('should find categories by parent id', async () => {
      const category1 = new CategoryEntity(
        'cat_1',
        'Food',
        CategoryType.EXPENSE,
        null,
        '🍴',
        '#FF6B6B',
        false,
        1,
        new Date(),
        new Date(),
      );

      const category2 = new CategoryEntity(
        'cat_2',
        'Sub Food',
        CategoryType.EXPENSE,
        'cat_1',
        '🍔',
        '#FF6B6B',
        false,
        1,
        new Date(),
        new Date(),
      );

      await repository.save(category1);
      await repository.save(category2);

      const found = await repository.findByParentId('cat_1');

      expect(found).toHaveLength(1);
      expect(found[0].id).toBe('cat_2');
      expect(found[0].parentId).toBe('cat_1');
    });
  });

  describe('findByIds', () => {
    it('should find categories by multiple ids', async () => {
      const category1 = new CategoryEntity(
        'cat_1',
        'Food',
        CategoryType.EXPENSE,
        null,
        '🍴',
        '#FF6B6B',
        false,
        1,
        new Date(),
        new Date(),
      );

      const category2 = new CategoryEntity(
        'cat_2',
        'Transport',
        CategoryType.EXPENSE,
        null,
        '🚗',
        '#4ECDC4',
        false,
        2,
        new Date(),
        new Date(),
      );

      await repository.save(category1);
      await repository.save(category2);

      const found = await repository.findByIds(['cat_1', 'cat_2']);

      expect(found).toHaveLength(2);
      expect(found.map((c) => c.id)).toContain('cat_1');
      expect(found.map((c) => c.id)).toContain('cat_2');
    });

    it('should return empty array if no ids provided', async () => {
      const found = await repository.findByIds([]);

      expect(found).toHaveLength(0);
    });
  });

  describe('delete', () => {
    it('should delete a category', async () => {
      const category = new CategoryEntity(
        'cat_1',
        'Food',
        CategoryType.EXPENSE,
        null,
        '🍴',
        '#FF6B6B',
        false,
        1,
        new Date(),
        new Date(),
      );

      await repository.save(category);

      await repository.delete('cat_1');

      const found = await repository.findById('cat_1');
      expect(found).toBeNull();
    });
  });
});
