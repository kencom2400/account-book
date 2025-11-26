import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { CategoryType } from '@account-book/types';
import { AppModule } from '../../src/app.module';
import { E2ETestDatabaseHelper } from '../helpers/database-helper';
import { createTestApp } from '../helpers/test-setup';
import { DataSource } from 'typeorm';

/**
 * FR-009 Phase 7: サブカテゴリ分類パフォーマンステスト
 *
 * パフォーマンス目標:
 * - 1件の分類: 50ms以内
 * - 100件の一括分類: 3秒以内
 * - 店舗マスタ検索: 10ms以内
 */
describe('Subcategory Classification Performance Tests', () => {
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

    // パフォーマンステスト用のデータを準備
    await setupPerformanceTestData();
  });

  afterAll(async () => {
    await dbHelper.cleanup();
    await app.close();
  });

  /**
   * パフォーマンステスト用のデータをセットアップ
   * - サブカテゴリ: 50件
   * - 店舗マスタ: 100件
   */
  async function setupPerformanceTestData(): Promise<void> {
    // サブカテゴリデータ
    const subcategories: string[] = [];
    const categories = [
      { id: 'food', name: '食費', icon: '🍔' },
      { id: 'transport', name: '交通費', icon: '🚗' },
      { id: 'utilities', name: '光熱費', icon: '💡' },
      { id: 'entertainment', name: '娯楽費', icon: '🎮' },
      { id: 'shopping', name: '買い物', icon: '🛍️' },
    ];

    for (const category of categories) {
      subcategories.push(
        `('${category.id}', 'EXPENSE', '${category.name}', NULL, 1, '${category.icon}', '#4CAF50', 1, 1)`,
      );

      // 各カテゴリに10個の子カテゴリを追加
      for (let i = 1; i <= 10; i++) {
        subcategories.push(
          `('${category.id}_sub${i}', 'EXPENSE', '${category.name}${i}', '${category.id}', ${i}, '${category.icon}', '#4CAF50', 1, 1)`,
        );
      }
    }

    await dataSource.query(
      `INSERT INTO subcategories (id, category_type, name, parent_id, display_order, icon, color, is_default, is_active)
       VALUES ${subcategories.join(', ')}`,
    );

    // 店舗マスタデータ（100件）
    const merchants: string[] = [];
    const merchantNames = [
      { name: 'スターバックス', alias: 'STARBUCKS', subcat: 'food_sub1' },
      { name: 'セブンイレブン', alias: '7-ELEVEN', subcat: 'food_sub2' },
      { name: 'ファミリーマート', alias: 'FAMILYMART', subcat: 'food_sub2' },
      { name: 'ローソン', alias: 'LAWSON', subcat: 'food_sub2' },
      { name: 'マクドナルド', alias: 'MCDONALDS', subcat: 'food_sub3' },
      { name: 'ドトールコーヒー', alias: 'DOUTOR', subcat: 'food_sub1' },
      { name: 'タリーズコーヒー', alias: 'TULLYS', subcat: 'food_sub1' },
      { name: 'すき家', alias: 'SUKIYA', subcat: 'food_sub4' },
      { name: '吉野家', alias: 'YOSHINOYA', subcat: 'food_sub4' },
      { name: '松屋', alias: 'MATSUYA', subcat: 'food_sub4' },
    ];

    for (let i = 0; i < 100; i++) {
      const merchant = merchantNames[i % merchantNames.length];
      merchants.push(
        `('merchant_${i}', '${merchant.name}${i}', '["${merchant.alias}${i}"]', '${merchant.subcat}', 0.95)`,
      );
    }

    await dataSource.query(
      `INSERT INTO merchants (id, name, aliases, default_subcategory_id, confidence)
       VALUES ${merchants.join(', ')}`,
    );
  }

  describe('単一分類のパフォーマンス', () => {
    it('1件の分類が50ms以内に完了する（店舗マスタヒット）', async () => {
      const start = Date.now();

      await request(app.getHttpServer())
        .post('/subcategories/classify')
        .send({
          transactionId: 'tx_perf_001',
          description: 'スターバックス0',
          amount: -500,
          mainCategory: CategoryType.EXPENSE,
          transactionDate: '2025-11-24T10:00:00.000Z',
        })
        .expect(200);

      const duration = Date.now() - start;

      console.log(`[PERF] 単一分類（店舗ヒット）: ${duration}ms`);
      expect(duration).toBeLessThan(50);
    });

    it('1件の分類が50ms以内に完了する（店舗マスタ未ヒット・金額ベース）', async () => {
      const start = Date.now();

      await request(app.getHttpServer())
        .post('/subcategories/classify')
        .send({
          transactionId: 'tx_perf_002',
          description: '未知の店舗',
          amount: -5000,
          mainCategory: CategoryType.EXPENSE,
          transactionDate: '2025-11-24T10:00:00.000Z',
        })
        .expect(200);

      const duration = Date.now() - start;

      console.log(`[PERF] 単一分類（金額ベース）: ${duration}ms`);
      expect(duration).toBeLessThan(50);
    });
  });

  describe('一括分類のパフォーマンス', () => {
    it('10件の一括分類が300ms以内に完了する', async () => {
      const transactions = Array.from({ length: 10 }, (_, i) => ({
        transactionId: `tx_batch_10_${i}`,
        description: `スターバックス${i % 10}`,
        amount: -500,
        mainCategory: CategoryType.EXPENSE,
        transactionDate: '2025-11-24T10:00:00.000Z',
      }));

      const start = Date.now();

      const response = await request(app.getHttpServer())
        .post('/subcategories/batch-classify')
        .send({ transactions })
        .expect(200);

      const duration = Date.now() - start;

      console.log(`[PERF] 10件一括分類: ${duration}ms`);
      expect(duration).toBeLessThan(300);
      expect(response.body.data.length).toBe(10);
    });

    it('50件の一括分類が1.5秒以内に完了する', async () => {
      const transactions = Array.from({ length: 50 }, (_, i) => ({
        transactionId: `tx_batch_50_${i}`,
        description: `店舗${i % 100}`,
        amount: -1000,
        mainCategory: CategoryType.EXPENSE,
        transactionDate: '2025-11-24T10:00:00.000Z',
      }));

      const start = Date.now();

      const response = await request(app.getHttpServer())
        .post('/subcategories/batch-classify')
        .send({ transactions })
        .expect(200);

      const duration = Date.now() - start;

      console.log(`[PERF] 50件一括分類: ${duration}ms`);
      expect(duration).toBeLessThan(1500);
      expect(response.body.data.length).toBe(50);
    });

    it('100件の一括分類が3秒以内に完了する', async () => {
      const transactions = Array.from({ length: 100 }, (_, i) => ({
        transactionId: `tx_batch_100_${i}`,
        description: `店舗${i % 100}`,
        amount: -800 - (i % 500),
        mainCategory: CategoryType.EXPENSE,
        transactionDate: '2025-11-24T10:00:00.000Z',
      }));

      const start = Date.now();

      const response = await request(app.getHttpServer())
        .post('/subcategories/batch-classify')
        .send({ transactions })
        .expect(200);

      const duration = Date.now() - start;

      console.log(`[PERF] 100件一括分類: ${duration}ms`);
      expect(duration).toBeLessThan(3000);
      expect(response.body.data.length).toBe(100);
    });
  });

  describe('サブカテゴリ一覧取得のパフォーマンス', () => {
    it('全サブカテゴリ一覧取得が100ms以内に完了する', async () => {
      const start = Date.now();

      const response = await request(app.getHttpServer())
        .get('/subcategories')
        .expect(200);

      const duration = Date.now() - start;

      console.log(`[PERF] 全サブカテゴリ一覧取得: ${duration}ms`);
      expect(duration).toBeLessThan(100);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('カテゴリ別サブカテゴリ一覧取得が50ms以内に完了する', async () => {
      const start = Date.now();

      const response = await request(app.getHttpServer())
        .get('/subcategories/category/EXPENSE')
        .expect(200);

      const duration = Date.now() - start;

      console.log(`[PERF] カテゴリ別サブカテゴリ一覧取得: ${duration}ms`);
      expect(duration).toBeLessThan(50);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('サブカテゴリ詳細取得が20ms以内に完了する', async () => {
      const start = Date.now();

      await request(app.getHttpServer())
        .get('/subcategories/food_sub1')
        .expect(200);

      const duration = Date.now() - start;

      console.log(`[PERF] サブカテゴリ詳細取得: ${duration}ms`);
      expect(duration).toBeLessThan(20);
    });
  });

  describe('階層構造処理のパフォーマンス', () => {
    it('階層構造を含む全サブカテゴリ取得が200ms以内に完了する', async () => {
      const start = Date.now();

      const response = await request(app.getHttpServer())
        .get('/subcategories')
        .expect(200);

      const duration = Date.now() - start;

      console.log(`[PERF] 階層構造取得: ${duration}ms`);
      expect(duration).toBeLessThan(200);

      // 階層構造が正しく構築されていることを確認
      const parentCategories = response.body.data.filter(
        (item: { parentId: string | null }) => item.parentId === null,
      );
      expect(parentCategories.length).toBeGreaterThan(0);

      const hasChildren = parentCategories.some(
        (item: { children?: unknown[] }) =>
          item.children && item.children.length > 0,
      );
      expect(hasChildren).toBe(true);
    });
  });

  describe('並行リクエストのパフォーマンス', () => {
    it('10並行リクエストが500ms以内に完了する', async () => {
      const start = Date.now();

      const promises = Array.from({ length: 10 }, (_, i) =>
        request(app.getHttpServer())
          .post('/subcategories/classify')
          .send({
            transactionId: `tx_parallel_${i}`,
            description: `スターバックス${i}`,
            amount: -500,
            mainCategory: CategoryType.EXPENSE,
            transactionDate: '2025-11-24T10:00:00.000Z',
          }),
      );

      const responses = await Promise.all(promises);

      const duration = Date.now() - start;

      console.log(`[PERF] 10並行リクエスト: ${duration}ms`);
      expect(duration).toBeLessThan(500);
      expect(responses.every((r) => r.status === 200)).toBe(true);
    });

    it('50並行リクエストが2秒以内に完了する', async () => {
      const start = Date.now();

      const promises = Array.from({ length: 50 }, (_, i) =>
        request(app.getHttpServer())
          .post('/subcategories/classify')
          .send({
            transactionId: `tx_parallel_50_${i}`,
            description: `店舗${i % 100}`,
            amount: -800,
            mainCategory: CategoryType.EXPENSE,
            transactionDate: '2025-11-24T10:00:00.000Z',
          }),
      );

      const responses = await Promise.all(promises);

      const duration = Date.now() - start;

      console.log(`[PERF] 50並行リクエスト: ${duration}ms`);
      expect(duration).toBeLessThan(2000);
      expect(responses.every((r) => r.status === 200)).toBe(true);
    });
  });

  describe('店舗マスタ検索のパフォーマンス', () => {
    it('店舗マスタ検索が50ms以内に完了する（想定: 将来実装）', async () => {
      // TODO: 店舗マスタ検索APIが実装されたら、ここでテスト
      // GET /merchants?query=スターバックス

      // 現在は分類APIを通じた間接的なテスト
      const start = Date.now();

      await request(app.getHttpServer())
        .post('/subcategories/classify')
        .send({
          transactionId: 'tx_merchant_search',
          description: 'スターバックス0',
          amount: -500,
          mainCategory: CategoryType.EXPENSE,
          transactionDate: '2025-11-24T10:00:00.000Z',
        })
        .expect(200);

      const duration = Date.now() - start;

      console.log(`[PERF] 店舗マスタ検索（分類経由）: ${duration}ms`);
      expect(duration).toBeLessThan(50);
    });
  });

  describe('メモリ使用量のチェック', () => {
    it('大量データ処理後もメモリリークしない', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // 1000件の分類を10回実行
      for (let batch = 0; batch < 10; batch++) {
        const transactions = Array.from({ length: 100 }, (_, i) => ({
          transactionId: `tx_mem_${batch}_${i}`,
          description: `店舗${i % 100}`,
          amount: -1000,
          mainCategory: CategoryType.EXPENSE,
          transactionDate: '2025-11-24T10:00:00.000Z',
        }));

        await request(app.getHttpServer())
          .post('/subcategories/batch-classify')
          .send({ transactions })
          .expect(200);
      }

      // ガベージコレクション実行
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;

      console.log(`[MEMORY] メモリ増加量: ${memoryIncrease.toFixed(2)} MB`);

      // メモリ増加が50MB以内であることを確認
      expect(memoryIncrease).toBeLessThan(50);
    });
  });
});
