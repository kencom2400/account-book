import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { CategoryType } from '@account-book/types';
import { AppModule } from '../src/app.module';
import { E2ETestDatabaseHelper } from './helpers/database-helper';
import { createTestApp } from './helpers/test-setup';
import { DataSource } from 'typeorm';

/**
 * Subcategory API E2E Tests
 * FR-009: 詳細費目分類機能 - Presentation層のテスト
 */
describe('Subcategory API (e2e)', () => {
  let app: INestApplication;
  let dbHelper: E2ETestDatabaseHelper;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });

    app = await createTestApp(moduleBuilder, {
      enableValidationPipe: true,
      enableHttpExceptionFilter: true,
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

  describe('GET /subcategories', () => {
    it('全サブカテゴリ一覧を取得できる', async () => {
      // Seed実行（サブカテゴリデータ投入）
      await dataSource.query(
        `INSERT INTO subcategories (id, category_type, name, parent_id, display_order, icon, color, is_default, is_active)
         VALUES 
         ('food', 'EXPENSE', '食費', NULL, 1, '🍔', '#4CAF50', 1, 1),
         ('food_groceries', 'EXPENSE', '食料品', 'food', 1, '🛒', '#4CAF50', 1, 1),
         ('food_dining_out', 'EXPENSE', '外食', 'food', 2, '🍽️', '#FF9800', 1, 1)`,
      );

      const response = await request(app.getHttpServer())
        .get('/subcategories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.total).toBeGreaterThanOrEqual(3);

      // 階層構造の確認
      const foodCategory = response.body.data.find(
        (item: { id: string }) => item.id === 'food',
      );
      expect(foodCategory).toBeDefined();
      expect(foodCategory.children).toBeDefined();
      expect(Array.isArray(foodCategory.children)).toBe(true);
      expect(foodCategory.children.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /subcategories/category/:categoryType', () => {
    it('EXPENSE カテゴリのサブカテゴリ一覧を取得できる', async () => {
      // Seed実行
      await dataSource.query(
        `INSERT INTO subcategories (id, category_type, name, parent_id, display_order, icon, color, is_default, is_active)
         VALUES 
         ('food', 'EXPENSE', '食費', NULL, 1, '🍔', '#4CAF50', 1, 1),
         ('food_groceries', 'EXPENSE', '食料品', 'food', 1, '🛒', '#4CAF50', 1, 1),
         ('salary', 'INCOME', '給与', NULL, 1, '💵', '#2196F3', 1, 1)`,
      );

      const response = await request(app.getHttpServer())
        .get('/subcategories/category/EXPENSE')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      // すべてEXPENSEカテゴリであることを確認
      response.body.data.forEach((item: { categoryType: string }) => {
        expect(item.categoryType).toBe(CategoryType.EXPENSE);
      });
    });

    it('無効なカテゴリタイプでエラーが返される', async () => {
      const response = await request(app.getHttpServer())
        .get('/subcategories/category/INVALID_TYPE')
        .expect(400);

      // エラーレスポンスが返されることを確認
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /subcategories/classify', () => {
    beforeEach(async () => {
      // テスト用のサブカテゴリと店舗マスタを挿入
      await dataSource.query(
        `INSERT INTO subcategories (id, category_type, name, parent_id, display_order, icon, color, is_default, is_active)
         VALUES 
         ('food_cafe', 'EXPENSE', 'カフェ', 'food', 3, '☕', '#795548', 1, 1),
         ('food_groceries', 'EXPENSE', '食料品', 'food', 1, '🛒', '#4CAF50', 1, 1),
         ('transport_train_bus', 'EXPENSE', '電車・バス', 'transport', 1, '🚃', '#9C27B0', 1, 1)`,
      );

      await dataSource.query(
        `INSERT INTO merchants (id, name, aliases, default_subcategory_id, confidence)
         VALUES 
         ('merchant_starbucks', 'スターバックス', '["STARBUCKS", "スタバ"]', 'food_cafe', 0.98),
         ('merchant_seven', 'セブンイレブン', '["7-ELEVEN", "7-11"]', 'food_groceries', 0.95)`,
      );
    });

    it('高信頼度で分類できる（店舗マスタにヒット）', async () => {
      const response = await request(app.getHttpServer())
        .post('/subcategories/classify')
        .send({
          transactionId: 'tx_001',
          description: 'スターバックス 表参道店',
          amount: -450,
          mainCategory: CategoryType.EXPENSE,
          transactionDate: '2025-11-24T10:30:00.000Z',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.subcategory.id).toBe('food_cafe');
      expect(response.body.data.confidence).toBeGreaterThan(0.5);
      expect(response.body.data.reason).toBeDefined();
      // 店舗マッチまたはキーワードマッチのいずれか
      expect(['MERCHANT_MATCH', 'KEYWORD_MATCH']).toContain(
        response.body.data.reason,
      );
    });

    it('中信頼度で分類できる（キーワードマッチ）', async () => {
      const response = await request(app.getHttpServer())
        .post('/subcategories/classify')
        .send({
          transactionId: 'tx_002',
          description: 'ローソン 新宿店',
          amount: -320,
          mainCategory: CategoryType.EXPENSE,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.subcategory).toBeDefined();
      expect(response.body.data.confidence).toBeGreaterThan(0);
    });

    it('低信頼度で分類できる（デフォルト）', async () => {
      const response = await request(app.getHttpServer())
        .post('/subcategories/classify')
        .send({
          transactionId: 'tx_003',
          description: '不明な取引',
          amount: -100,
          mainCategory: CategoryType.EXPENSE,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.subcategory).toBeDefined();
      // デフォルト分類の場合は信頼度が低い
      expect(response.body.data.confidence).toBeLessThanOrEqual(0.5);
    });

    it('バリデーションエラー: description が空', async () => {
      const response = await request(app.getHttpServer())
        .post('/subcategories/classify')
        .send({
          transactionId: 'tx_004',
          description: '',
          amount: -100,
          mainCategory: CategoryType.EXPENSE,
        })
        .expect(400);

      // NestJSのデフォルトバリデーションエラーレスポンス
      expect(response.body.error || response.body.statusCode).toBeDefined();
    });

    it('バリデーションエラー: mainCategory が無効', async () => {
      const response = await request(app.getHttpServer())
        .post('/subcategories/classify')
        .send({
          transactionId: 'tx_005',
          description: 'テスト',
          amount: -100,
          mainCategory: 'INVALID_CATEGORY',
        })
        .expect(400);

      // NestJSのデフォルトバリデーションエラーレスポンス
      expect(response.body.error || response.body.statusCode).toBeDefined();
    });
  });

  describe('PATCH /subcategories/transactions/:id/subcategory', () => {
    let transactionId: string;

    beforeEach(async () => {
      // テスト用のサブカテゴリを挿入
      await dataSource.query(
        `INSERT INTO subcategories (id, category_type, name, parent_id, display_order, icon, color, is_default, is_active)
         VALUES 
         ('food_cafe', 'EXPENSE', 'カフェ', 'food', 3, '☕', '#795548', 1, 1),
         ('food_groceries', 'EXPENSE', '食料品', 'food', 1, '🛒', '#4CAF50', 1, 1)`,
      );

      // テスト用の取引を作成
      await dataSource.query(
        `INSERT INTO categories (id, name, type, is_system_defined, \`order\`)
         VALUES ('cat-001', '食費', 'EXPENSE', 1, 1)`,
      );

      await dataSource.query(
        `INSERT INTO transactions (id, date, amount, description, category_id, category_name, category_type, institution_id, account_id, status)
         VALUES (UUID(), '2025-01-15', -450, 'スターバックス', 'cat-001', '食費', 'EXPENSE', 'inst-001', 'acc-001', 'COMPLETED')`,
      );

      // 作成した取引IDを取得
      const [transaction] = await dataSource.query(
        `SELECT id FROM transactions WHERE description = 'スターバックス' LIMIT 1`,
      );
      transactionId = transaction.id;
    });

    it('取引のサブカテゴリを更新できる', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/subcategories/transactions/${transactionId}/subcategory`)
        .send({
          subcategoryId: 'food_cafe',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.transaction).toBeDefined();
      expect(response.body.transaction.id).toBe(transactionId);
      expect(response.body.transaction.subcategoryId).toBe('food_cafe');
      expect(response.body.transaction.subcategoryName).toBe('カフェ');
      expect(response.body.transaction.classificationConfidence).toBe(1.0);
      expect(response.body.transaction.classificationReason).toBe('MANUAL');
      expect(response.body.transaction.confirmedAt).toBeDefined();

      // データベースで確認
      const [updatedTransaction] = await dataSource.query(
        `SELECT subcategory_id as subcategoryId, classification_confidence as classificationConfidence, classification_reason as classificationReason FROM transactions WHERE id = ?`,
        [transactionId],
      );

      expect(updatedTransaction.subcategoryId).toBe('food_cafe');
      expect(parseFloat(updatedTransaction.classificationConfidence)).toBe(1.0);
      expect(updatedTransaction.classificationReason).toBe('MANUAL');
    });

    it('存在しない取引IDでエラーが返される', async () => {
      await request(app.getHttpServer())
        .patch('/subcategories/transactions/non-existent-id/subcategory')
        .send({
          subcategoryId: 'food_cafe',
        })
        .expect(404);
    });

    it('存在しないサブカテゴリIDでエラーが返される', async () => {
      await request(app.getHttpServer())
        .patch(`/subcategories/transactions/${transactionId}/subcategory`)
        .send({
          subcategoryId: 'invalid_subcategory',
        })
        .expect(404);
    });

    it('バリデーションエラー: subcategoryId が空', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/subcategories/transactions/${transactionId}/subcategory`)
        .send({
          subcategoryId: '',
        })
        .expect(400);

      // NestJSのデフォルトバリデーションエラーレスポンス
      expect(response.body.error || response.body.statusCode).toBeDefined();
    });
  });
});
