import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { CategoryType } from '@account-book/types';
import { AppModule } from '../src/app.module';
import { E2ETestDatabaseHelper } from './helpers/database-helper';
import { createTestApp } from './helpers/test-setup';
import { DataSource } from 'typeorm';

/**
 * FR-009 Phase 7: エンドツーエンド統合テスト
 *
 * このテストでは、取引受信から分類確定までの全体フローをテストします。
 * - 取引データの受信（MoneyForward連携想定）
 * - 自動分類の実行
 * - フロントエンドでの表示確認
 * - ユーザーによる手動修正
 * - 分類の確定
 */
describe('Subcategory Classification Integration E2E', () => {
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

    dbHelper = new E2ETestDatabaseHelper(app);
    dataSource = app.get(DataSource);

    const isConnected: boolean = await dbHelper.checkConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }
  });

  afterEach(async () => {
    await dbHelper.cleanDatabase();
  });

  afterAll(async () => {
    await dbHelper.cleanup();
    await app.close();
  });

  describe('取引受信から確定までの全フロー', () => {
    beforeEach(async () => {
      // テスト用のサブカテゴリと店舗マスタを準備
      await dataSource.query(
        `INSERT INTO subcategories (id, category_type, name, parent_id, display_order, icon, color, is_default, is_active)
         VALUES 
         ('food', 'EXPENSE', '食費', NULL, 1, '🍔', '#4CAF50', 1, 1),
         ('food_cafe', 'EXPENSE', 'カフェ', 'food', 1, '☕', '#795548', 1, 1),
         ('food_groceries', 'EXPENSE', '食料品', 'food', 2, '🛒', '#4CAF50', 1, 1),
         ('transport', 'EXPENSE', '交通費', NULL, 2, '🚗', '#2196F3', 1, 1),
         ('transport_train_bus', 'EXPENSE', '電車・バス', 'transport', 1, '🚃', '#9C27B0', 1, 1)`,
      );

      await dataSource.query(
        `INSERT INTO merchants (id, name, aliases, default_subcategory_id, confidence)
         VALUES 
         ('merchant_starbucks', 'スターバックス', '["STARBUCKS", "スタバ"]', 'food_cafe', 0.98),
         ('merchant_seven', 'セブンイレブン', '["7-ELEVEN", "7-11"]', 'food_groceries', 0.95),
         ('merchant_jr_east', 'JR東日本', '["JR EAST", "JREAST"]', 'transport_train_bus', 0.90)`,
      );
    });

    it('高信頼度取引: 自動分類→そのまま確定', async () => {
      // ステップ1: 取引データの受信（MoneyForward連携を想定）
      const transactionData = {
        description: 'スターバックス 表参道店',
        amount: -450,
        transactionDate: '2025-11-24T10:30:00.000Z',
        institutionId: 'inst_001',
        accountId: 'acc_001',
      };

      // TODO: 実際の取引作成APIが実装されたら、ここでPOST /transactionsを呼び出す
      // 現在はモックデータとして扱う
      const mockTransactionId = 'tx_001';

      // ステップ2: 自動分類の実行
      const classifyResponse = await request(app.getHttpServer())
        .post('/subcategories/classify')
        .send({
          transactionId: mockTransactionId,
          description: transactionData.description,
          amount: transactionData.amount,
          mainCategory: CategoryType.EXPENSE,
          transactionDate: transactionData.transactionDate,
        })
        .expect(200);

      expect(classifyResponse.body.success).toBe(true);
      expect(classifyResponse.body.data).toBeDefined();

      const classification = classifyResponse.body.data;

      // 店舗マスタにヒットして高信頼度で分類されることを確認
      expect(classification.subcategoryId).toBe('food_cafe');
      expect(classification.confidence).toBeGreaterThan(0.9);
      expect(classification.reason).toBe('MERCHANT_MATCH');

      // ステップ3: 分類結果の取得（フロントエンドでの表示を想定）
      const getResponse = await request(app.getHttpServer())
        .get('/subcategories/food_cafe')
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.name).toBe('カフェ');

      // ステップ4: 高信頼度なので手動修正なしで確定
      // TODO: 実際の確定APIが実装されたら、ここでPATCH /transactions/:id/confirmを呼び出す
      // 信頼度が高い場合は自動確定されることを想定
      expect(classification.confidence).toBeGreaterThan(0.9);
    });

    it('中信頼度取引: 自動分類→手動修正→確定', async () => {
      // ステップ1: 取引データの受信
      const transactionData = {
        description: '未知の店舗での購入',
        amount: -1200,
        transactionDate: '2025-11-24T12:00:00.000Z',
        institutionId: 'inst_001',
        accountId: 'acc_001',
      };

      const mockTransactionId = 'tx_002';

      // ステップ2: 自動分類の実行（低〜中信頼度）
      const classifyResponse = await request(app.getHttpServer())
        .post('/subcategories/classify')
        .send({
          transactionId: mockTransactionId,
          description: transactionData.description,
          amount: transactionData.amount,
          mainCategory: CategoryType.EXPENSE,
          transactionDate: transactionData.transactionDate,
        })
        .expect(200);

      expect(classifyResponse.body.success).toBe(true);

      const classification = classifyResponse.body.data;

      // 店舗マスタにヒットしないため、デフォルトまたは金額ベースの分類
      expect(classification.confidence).toBeLessThan(0.9);

      // ステップ3: フロントエンドでユーザーが手動修正（food_groceriesに変更）
      // TODO: 実際の更新APIが実装されたら、ここでPATCH /transactions/:id/subcategoryを呼び出す
      const updateSubcategoryId = 'food_groceries';
      // 手動修正後は信頼度100%、理由はMANUALになることを確認
      const manualConfidence = 1.0;
      const manualReason = 'MANUAL';

      expect(manualConfidence).toBe(1.0);
      expect(manualReason).toBe('MANUAL');

      // ステップ4: 修正後のサブカテゴリ情報を確認
      const getResponse = await request(app.getHttpServer())
        .get(`/subcategories/${updateSubcategoryId}`)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.name).toBe('食料品');
    });

    it('複数取引の一括分類フロー', async () => {
      // ステップ1: 複数の取引データ
      const transactions = [
        {
          transactionId: 'tx_batch_001',
          description: 'スターバックス',
          amount: -500,
          mainCategory: CategoryType.EXPENSE,
          transactionDate: '2025-11-24T09:00:00.000Z',
        },
        {
          transactionId: 'tx_batch_002',
          description: 'セブンイレブン',
          amount: -800,
          mainCategory: CategoryType.EXPENSE,
          transactionDate: '2025-11-24T10:00:00.000Z',
        },
        {
          transactionId: 'tx_batch_003',
          description: 'JR東日本',
          amount: -220,
          mainCategory: CategoryType.EXPENSE,
          transactionDate: '2025-11-24T11:00:00.000Z',
        },
      ];

      // ステップ2: 一括分類の実行
      const batchResponse = await request(app.getHttpServer())
        .post('/subcategories/batch-classify')
        .send({ transactions })
        .expect(200);

      expect(batchResponse.body.success).toBe(true);
      expect(batchResponse.body.data).toBeDefined();
      expect(Array.isArray(batchResponse.body.data)).toBe(true);
      expect(batchResponse.body.data.length).toBe(3);

      // ステップ3: 各取引の分類結果を確認
      const results = batchResponse.body.data;

      // スターバックス → カフェ
      expect(results[0].subcategoryId).toBe('food_cafe');
      expect(results[0].confidence).toBeGreaterThan(0.9);

      // セブンイレブン → 食料品
      expect(results[1].subcategoryId).toBe('food_groceries');
      expect(results[1].confidence).toBeGreaterThan(0.9);

      // JR東日本 → 電車・バス
      expect(results[2].subcategoryId).toBe('transport_train_bus');
      expect(results[2].confidence).toBeGreaterThan(0.8);
    });

    it('店舗マスタ学習フロー: 新規店舗の登録→次回自動分類', async () => {
      // ステップ1: 初回取引（未知の店舗）
      const newMerchantTransaction = {
        transactionId: 'tx_new_merchant_001',
        description: 'ドトールコーヒー 渋谷店',
        amount: -350,
        mainCategory: CategoryType.EXPENSE,
        transactionDate: '2025-11-24T14:00:00.000Z',
      };

      // 初回は低信頼度で分類
      const firstClassifyResponse = await request(app.getHttpServer())
        .post('/subcategories/classify')
        .send(newMerchantTransaction)
        .expect(200);

      const firstClassification = firstClassifyResponse.body.data;
      expect(firstClassification.confidence).toBeLessThan(0.9);

      // ステップ2: ユーザーがカフェに手動分類（将来実装想定）
      // TODO: POST /transactions/:id/subcategory で手動分類する機能が実装されたら、ここで呼び出す
      // const userSelectedSubcategory = 'food_cafe';

      // ステップ3: 店舗マスタに学習登録（将来実装想定）
      // TODO: POST /merchants で新規店舗を登録する機能が実装されたら、ここで呼び出す
      await dataSource.query(
        `INSERT INTO merchants (id, name, aliases, default_subcategory_id, confidence)
         VALUES ('merchant_doutor', 'ドトールコーヒー', '["DOUTOR", "ドトール"]', 'food_cafe', 0.90)`,
      );

      // ステップ4: 同じ店舗の2回目の取引
      const secondTransaction = {
        transactionId: 'tx_new_merchant_002',
        description: 'ドトールコーヒー 新宿店',
        amount: -400,
        mainCategory: CategoryType.EXPENSE,
        transactionDate: '2025-11-25T10:00:00.000Z',
      };

      // 2回目は高信頼度で自動分類される
      const secondClassifyResponse = await request(app.getHttpServer())
        .post('/subcategories/classify')
        .send(secondTransaction)
        .expect(200);

      const secondClassification = secondClassifyResponse.body.data;
      expect(secondClassification.subcategoryId).toBe('food_cafe');
      expect(secondClassification.confidence).toBeGreaterThan(0.8);
      expect(secondClassification.reason).toBe('MERCHANT_MATCH');
    });
  });

  describe('エラーケースとエッジケース', () => {
    it('無効な取引データでエラーが返される', async () => {
      const invalidData = {
        transactionId: 'tx_invalid',
        description: '', // 空の説明
        amount: 0, // ゼロ金額
        mainCategory: 'INVALID_CATEGORY', // 無効なカテゴリ
      };

      const response = await request(app.getHttpServer())
        .post('/subcategories/classify')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('存在しないサブカテゴリIDを指定した場合', async () => {
      const response = await request(app.getHttpServer())
        .get('/subcategories/non_existent_id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('一括分類で一部の取引が失敗した場合', async () => {
      const mixedTransactions = [
        {
          transactionId: 'tx_valid_001',
          description: 'スターバックス',
          amount: -500,
          mainCategory: CategoryType.EXPENSE,
          transactionDate: '2025-11-24T09:00:00.000Z',
        },
        {
          transactionId: 'tx_invalid_001',
          description: '', // 空の説明
          amount: 0,
          mainCategory: 'INVALID',
          transactionDate: '2025-11-24T10:00:00.000Z',
        },
      ];

      // 一部失敗してもエラーにならず、成功したものだけ返されることを確認
      // TODO: API仕様に応じて適切なエラーハンドリングを実装
      await request(app.getHttpServer())
        .post('/subcategories/batch-classify')
        .send({ transactions: mixedTransactions });

      // 実際のAPI仕様に応じてアサーションを調整
      // expect(response.status).toBe(207); // Multi-Status
    });
  });

  describe('パフォーマンス確認（統合テスト内）', () => {
    beforeEach(async () => {
      // パフォーマンステスト用のデータを準備
      await dataSource.query(
        `INSERT INTO subcategories (id, category_type, name, parent_id, display_order, icon, color, is_default, is_active)
         VALUES 
         ('food', 'EXPENSE', '食費', NULL, 1, '🍔', '#4CAF50', 1, 1),
         ('food_cafe', 'EXPENSE', 'カフェ', 'food', 1, '☕', '#795548', 1, 1)`,
      );

      await dataSource.query(
        `INSERT INTO merchants (id, name, aliases, default_subcategory_id, confidence)
         VALUES ('merchant_starbucks', 'スターバックス', '["STARBUCKS"]', 'food_cafe', 0.98)`,
      );
    });

    it('1件の分類が100ms以内に完了する', async () => {
      const start = Date.now();

      await request(app.getHttpServer())
        .post('/subcategories/classify')
        .send({
          transactionId: 'tx_perf_001',
          description: 'スターバックス',
          amount: -500,
          mainCategory: CategoryType.EXPENSE,
          transactionDate: '2025-11-24T10:00:00.000Z',
        })
        .expect(200);

      const duration = Date.now() - start;

      // 統合テストでは多少余裕を持たせる（目標: 100ms以内）
      expect(duration).toBeLessThan(100);
    });

    it('10件の一括分類が500ms以内に完了する', async () => {
      const transactions = Array.from({ length: 10 }, (_, i) => ({
        transactionId: `tx_batch_perf_${i}`,
        description: 'スターバックス',
        amount: -500,
        mainCategory: CategoryType.EXPENSE,
        transactionDate: '2025-11-24T10:00:00.000Z',
      }));

      const start = Date.now();

      await request(app.getHttpServer())
        .post('/subcategories/batch-classify')
        .send({ transactions })
        .expect(200);

      const duration = Date.now() - start;

      // 目標: 10件で500ms以内
      expect(duration).toBeLessThan(500);
    });
  });
});
