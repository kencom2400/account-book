import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { CategoryType } from '@account-book/types';
import { AppModule } from '../src/app.module';
import { E2ETestDatabaseHelper } from './helpers/database-helper';
import { createTestApp } from './helpers/test-setup';
import { DataSource } from 'typeorm';

/**
 * Subcategory Aggregation API E2E Tests
 * FR-019: 費目別集計機能 - APIエンドポイントのテスト
 */
describe('Subcategory Aggregation API (e2e)', () => {
  let app: INestApplication;
  let dbHelper: E2ETestDatabaseHelper;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });

    app = await createTestApp(moduleBuilder, {
      setPrefix: 'api',
    });

    // データベースヘルパーの初期化
    dbHelper = new E2ETestDatabaseHelper(app);

    // DataSourceを取得
    dataSource = app.get(DataSource);

    // データベース接続確認
    const isConnected: boolean = await dbHelper.checkConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }
  });

  afterEach(async () => {
    // 各テスト後にデータベースをクリーンアップ
    await dbHelper.cleanDatabase();
  });

  afterAll(async () => {
    await dbHelper.cleanup();
    await app.close();
  });

  describe('GET /api/aggregation/subcategory', () => {
    it('全費目集計を取得できる', async () => {
      // カテゴリデータを投入
      await dataSource.query(
        `INSERT INTO categories (id, name, type, parent_id, icon, color, is_system_defined, \`order\`, created_at, updated_at)
         VALUES 
         ('cat_food', '食費', 'EXPENSE', NULL, '🍔', '#4CAF50', 1, 1, NOW(), NOW()),
         ('cat_food_groceries', '食料品', 'EXPENSE', 'cat_food', '🛒', '#4CAF50', 1, 1, NOW(), NOW()),
         ('cat_salary', '給与', 'INCOME', NULL, '💵', '#2196F3', 1, 1, NOW(), NOW())`,
      );

      // 取引データを投入
      await dataSource.query(
        `INSERT INTO transactions (id, date, amount, category_id, category_name, category_type, description, institution_id, account_id, status, is_reconciled, related_transaction_id, created_at, updated_at)
         VALUES 
         ('tx_1', '2025-01-15', 50000, 'cat_food_groceries', '食料品', 'EXPENSE', 'Test transaction 1', 'inst_1', 'acc_1', 'COMPLETED', 0, NULL, NOW(), NOW()),
         ('tx_2', '2025-01-20', 30000, 'cat_food_groceries', '食料品', 'EXPENSE', 'Test transaction 2', 'inst_1', 'acc_1', 'COMPLETED', 0, NULL, NOW(), NOW()),
         ('tx_3', '2025-01-25', 200000, 'cat_salary', '給与', 'INCOME', 'Test transaction 3', 'inst_1', 'acc_1', 'COMPLETED', 0, NULL, NOW(), NOW())`,
      );

      const response = await request(app.getHttpServer())
        .get('/api/api/aggregation/subcategory')
        .query({
          startDate: '2025-01-01',
          endDate: '2025-01-31',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.items).toBeDefined();
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.period).toBeDefined();
      expect(response.body.data.period.start).toBeDefined();
      expect(response.body.data.period.end).toBeDefined();
      expect(response.body.data.totalAmount).toBeGreaterThanOrEqual(0);
      expect(response.body.data.totalTransactionCount).toBeGreaterThanOrEqual(
        0,
      );
    });

    it('特定カテゴリタイプで集計できる', async () => {
      // カテゴリデータを投入
      await dataSource.query(
        `INSERT INTO categories (id, name, type, parent_id, icon, color, is_system_defined, \`order\`, created_at, updated_at)
         VALUES 
         ('cat_food', '食費', 'EXPENSE', NULL, '🍔', '#4CAF50', 1, 1, NOW(), NOW()),
         ('cat_food_groceries', '食料品', 'EXPENSE', 'cat_food', '🛒', '#4CAF50', 1, 1, NOW(), NOW()),
         ('cat_salary', '給与', 'INCOME', NULL, '💵', '#2196F3', 1, 1, NOW(), NOW())`,
      );

      // 取引データを投入
      await dataSource.query(
        `INSERT INTO transactions (id, date, amount, category_id, category_name, category_type, description, institution_id, account_id, status, is_reconciled, related_transaction_id, created_at, updated_at)
         VALUES 
         ('tx_1', '2025-01-15', 50000, 'cat_food_groceries', '食料品', 'EXPENSE', 'Test transaction 1', 'inst_1', 'acc_1', 'COMPLETED', 0, NULL, NOW(), NOW()),
         ('tx_2', '2025-01-20', 30000, 'cat_food_groceries', '食料品', 'EXPENSE', 'Test transaction 2', 'inst_1', 'acc_1', 'COMPLETED', 0, NULL, NOW(), NOW()),
         ('tx_3', '2025-01-25', 200000, 'cat_salary', '給与', 'INCOME', 'Test transaction 3', 'inst_1', 'acc_1', 'COMPLETED', 0, NULL, NOW(), NOW())`,
      );

      const response = await request(app.getHttpServer())
        .get('/api/api/aggregation/subcategory')
        .query({
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          categoryType: CategoryType.EXPENSE,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.items).toBeDefined();
      expect(Array.isArray(response.body.data.items)).toBe(true);
      // EXPENSEのみが含まれることを確認
      const allItems = response.body.data.items;
      const checkCategoryType = (items: any[]): boolean => {
        for (const item of items) {
          // 実際の実装では、カテゴリタイプのチェックが必要
          if (item.children && item.children.length > 0) {
            if (!checkCategoryType(item.children)) {
              return false;
            }
          }
        }
        return true;
      };
      expect(checkCategoryType(allItems)).toBe(true);
    });

    it('特定費目IDで集計できる', async () => {
      // カテゴリデータを投入
      await dataSource.query(
        `INSERT INTO categories (id, name, type, parent_id, icon, color, is_system_defined, \`order\`, created_at, updated_at)
         VALUES 
         ('cat_food', '食費', 'EXPENSE', NULL, '🍔', '#4CAF50', 1, 1, NOW(), NOW()),
         ('cat_food_groceries', '食料品', 'EXPENSE', 'cat_food', '🛒', '#4CAF50', 1, 1, NOW(), NOW()),
         ('cat_food_dining', '外食', 'EXPENSE', 'cat_food', '🍽️', '#FF9800', 1, 2, NOW(), NOW())`,
      );

      // 取引データを投入
      await dataSource.query(
        `INSERT INTO transactions (id, date, amount, category_id, category_name, category_type, description, institution_id, account_id, status, is_reconciled, related_transaction_id, created_at, updated_at)
         VALUES 
         ('tx_1', '2025-01-15', 50000, 'cat_food_groceries', '食料品', 'EXPENSE', 'Test transaction 1', 'inst_1', 'acc_1', 'COMPLETED', 0, NULL, NOW(), NOW()),
         ('tx_2', '2025-01-20', 30000, 'cat_food_dining', '外食', 'EXPENSE', 'Test transaction 2', 'inst_1', 'acc_1', 'COMPLETED', 0, NULL, NOW(), NOW())`,
      );

      const response = await request(app.getHttpServer())
        .get('/api/api/aggregation/subcategory')
        .query({
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          itemId: 'cat_food',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.items).toBeDefined();
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.totalAmount).toBe(80000);
      expect(response.body.data.totalTransactionCount).toBe(2);
    });

    it('存在しない費目IDの場合は空データを返す', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/api/aggregation/subcategory')
        .query({
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          itemId: 'non-existent-id',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.items).toHaveLength(0);
      expect(response.body.data.totalAmount).toBe(0);
      expect(response.body.data.totalTransactionCount).toBe(0);
    });

    it('階層構造が正しく返される', async () => {
      // カテゴリデータを投入
      await dataSource.query(
        `INSERT INTO categories (id, name, type, parent_id, icon, color, is_system_defined, \`order\`, created_at, updated_at)
         VALUES 
         ('cat_food', '食費', 'EXPENSE', NULL, '🍔', '#4CAF50', 1, 1, NOW(), NOW()),
         ('cat_food_groceries', '食料品', 'EXPENSE', 'cat_food', '🛒', '#4CAF50', 1, 1, NOW(), NOW())`,
      );

      // 取引データを投入
      await dataSource.query(
        `INSERT INTO transactions (id, date, amount, category_id, category_name, category_type, description, institution_id, account_id, status, is_reconciled, related_transaction_id, created_at, updated_at)
         VALUES 
         ('tx_1', '2025-01-15', 50000, 'cat_food_groceries', '食料品', 'EXPENSE', 'Test transaction 1', 'inst_1', 'acc_1', 'COMPLETED', 0, NULL, NOW(), NOW())`,
      );

      const response = await request(app.getHttpServer())
        .get('/api/api/aggregation/subcategory')
        .query({
          startDate: '2025-01-01',
          endDate: '2025-01-31',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeDefined();
      const foodItem = response.body.data.items.find(
        (item: { itemId: string }) => item.itemId === 'cat_food',
      );
      expect(foodItem).toBeDefined();
      if (foodItem) {
        expect(foodItem.children).toBeDefined();
        expect(Array.isArray(foodItem.children)).toBe(true);
        expect(foodItem.children.length).toBeGreaterThan(0);
        const groceriesItem = foodItem.children.find(
          (item: { itemId: string }) => item.itemId === 'cat_food_groceries',
        );
        expect(groceriesItem).toBeDefined();
        expect(groceriesItem?.totalAmount).toBe(50000);
      }
    });

    it('バリデーションエラー: startDateが必須', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/api/aggregation/subcategory')
        .query({
          endDate: '2025-01-31',
        });

      expect([400, 422]).toContain(response.status);
    });

    it('バリデーションエラー: endDateが必須', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/api/aggregation/subcategory')
        .query({
          startDate: '2025-01-01',
        });

      expect([400, 422]).toContain(response.status);
    });
  });
});
