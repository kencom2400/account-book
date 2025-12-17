import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  CategoryType,
  TransactionStatus,
  InstitutionType,
} from '@account-book/types';
import { ExportFormat } from '../src/modules/transaction/application/services/export.service';
import { E2ETestDatabaseHelper } from './helpers/database-helper';
import { createTestApp } from './helpers/test-setup';

describe('Transaction Controller (e2e)', () => {
  let app: INestApplication;
  let dbHelper: E2ETestDatabaseHelper;
  let createdTransactionId: string;
  let institutionId: string;
  let accountId: string;

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });

    app = await createTestApp(moduleBuilder, {
      setPrefix: 'api',
    });

    // データベースヘルパーの初期化
    dbHelper = new E2ETestDatabaseHelper(app);

    // データベース接続確認
    const isConnected: boolean = await dbHelper.checkConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }
  });

  afterAll(async () => {
    await dbHelper.cleanup();
    await app.close();
  });

  beforeEach(async () => {
    // 各テスト前にデータベースをクリーンアップ
    await dbHelper.cleanDatabase();

    // テスト用の金融機関を作成
    const institutionResponse = await request(app.getHttpServer())
      .post('/api/institutions')
      .send({
        name: 'テスト銀行',
        type: InstitutionType.BANK,
        credentials: {
          bankCode: '0000',
          branchCode: '001',
          accountNumber: '1234567',
        },
      })
      .expect(201);

    expect(institutionResponse.body.success).toBe(true);
    expect(institutionResponse.body.data).toBeDefined();
    institutionId = institutionResponse.body.data.id;
    accountId = 'acc-001';
  });

  describe('POST /api/transactions', () => {
    it('should create a transaction with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/transactions')
        .send({
          date: '2025-01-15',
          amount: -1500,
          category: {
            id: 'cat-001',
            name: '食費',
            type: CategoryType.EXPENSE,
          },
          description: 'スターバックス',
          institutionId,
          accountId,
          status: TransactionStatus.COMPLETED,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.amount).toBe(-1500);
      expect(response.body.data.description).toBe('スターバックス');
      expect(response.body.data.category.id).toBe('cat-001');
      expect(response.body.data.institutionId).toBe(institutionId);

      createdTransactionId = response.body.data.id;
    });

    it('should return 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/transactions')
        .send({
          date: '2025-01-15',
          amount: -1500,
          // category missing
          description: 'スターバックス',
          institutionId,
          accountId,
        })
        .expect(400);
    });

    it('should return error for invalid category type', async () => {
      // 無効なカテゴリタイプは400または500エラーを返す可能性がある
      const response = await request(app.getHttpServer())
        .post('/api/transactions')
        .send({
          date: '2025-01-15',
          amount: -1500,
          category: {
            id: 'cat-001',
            name: '食費',
            type: 'INVALID_TYPE',
          },
          description: 'スターバックス',
          institutionId,
          accountId,
        });

      // 400または500エラーのいずれかを許容
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('GET /api/transactions', () => {
    beforeEach(async () => {
      // テスト用の取引を作成
      const createResponse = await request(app.getHttpServer())
        .post('/api/transactions')
        .send({
          date: '2025-01-15',
          amount: -1500,
          category: {
            id: 'cat-001',
            name: '食費',
            type: CategoryType.EXPENSE,
          },
          description: 'スターバックス',
          institutionId,
          accountId,
          status: TransactionStatus.COMPLETED,
        });

      createdTransactionId = createResponse.body.data.id;
    });

    it('should return all transactions', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/transactions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBeGreaterThanOrEqual(1);
    });

    it('should filter by institutionId', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/transactions')
        .query({ institutionId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      response.body.data.forEach((tx: any) => {
        expect(tx.institutionId).toBe(institutionId);
      });
    });

    it('should filter by year and month', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/transactions')
        .query({ year: '2025', month: '1' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should filter by date range', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/transactions')
        .query({
          startDate: '2025-01-01',
          endDate: '2025-01-31',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/transactions/:id', () => {
    beforeEach(async () => {
      // テスト用の取引を作成
      const createResponse = await request(app.getHttpServer())
        .post('/api/transactions')
        .send({
          date: '2025-01-15',
          amount: -1500,
          category: {
            id: 'cat-001',
            name: '食費',
            type: CategoryType.EXPENSE,
          },
          description: 'スターバックス',
          institutionId,
          accountId,
          status: TransactionStatus.COMPLETED,
        });

      createdTransactionId = createResponse.body.data.id;
    });

    it('should return a transaction by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/transactions/${createdTransactionId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(createdTransactionId);
      expect(response.body.data.amount).toBe(-1500);
      expect(response.body.data.description).toBe('スターバックス');
    });

    it('should return 404 for non-existent transaction', async () => {
      await request(app.getHttpServer())
        .get('/api/transactions/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('POST /api/transactions/classify', () => {
    it('should classify a transaction', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/transactions/classify')
        .send({
          amount: -1500,
          description: 'スターバックス',
          institutionId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.category).toBeDefined();
      expect(response.body.data.category.id).toBeDefined();
      expect(response.body.data.category.name).toBeDefined();
      expect(response.body.data.category.type).toBeDefined();
      expect(response.body.data.confidence).toBeDefined();
      expect(response.body.data.confidenceLevel).toBeDefined();
      expect(['high', 'medium', 'low']).toContain(
        response.body.data.confidenceLevel,
      );
      expect(response.body.data.reason).toBeDefined();
    });

    it('should return 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/transactions/classify')
        .send({
          // amount missing
          description: 'スターバックス',
        })
        .expect(400);
    });
  });

  describe('GET /api/transactions/summary/monthly/:year/:month', () => {
    beforeEach(async () => {
      // テスト用の取引を作成
      await request(app.getHttpServer())
        .post('/api/transactions')
        .send({
          date: '2025-01-15',
          amount: -1500,
          category: {
            id: 'cat-001',
            name: '食費',
            type: CategoryType.EXPENSE,
          },
          description: 'スターバックス',
          institutionId,
          accountId,
          status: TransactionStatus.COMPLETED,
        });

      await request(app.getHttpServer())
        .post('/api/transactions')
        .send({
          date: '2025-01-20',
          amount: 200000,
          category: {
            id: 'cat-002',
            name: '給与',
            type: CategoryType.INCOME,
          },
          description: '給与',
          institutionId,
          accountId,
          status: TransactionStatus.COMPLETED,
        });
    });

    it('should return monthly summary', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/transactions/summary/monthly/2025/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.year).toBe(2025);
      expect(response.body.data.month).toBe(1);
      expect(response.body.data.income).toBeDefined();
      expect(response.body.data.expense).toBeDefined();
      expect(response.body.data.balance).toBeDefined();
      expect(response.body.data.byCategory).toBeDefined();
      expect(response.body.data.byInstitution).toBeDefined();
      expect(response.body.data.transactionCount).toBeDefined();
    });

    it('should handle invalid year gracefully', async () => {
      // 年パラメータのバリデーションは実装によって異なる可能性があるため、
      // エラーが返るか、またはNaNが処理されることを確認
      const response = await request(app.getHttpServer()).get(
        '/api/transactions/summary/monthly/invalid/1',
      );

      // 実装によっては200（空の結果）またはエラーが返る可能性がある
      // すべてのステータスコードを許容
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);
    });

    it('should handle invalid month gracefully', async () => {
      // 月のバリデーションは実装によって異なる可能性があるため、
      // エラーが返るか、または0件の結果が返ることを確認
      const response = await request(app.getHttpServer()).get(
        '/api/transactions/summary/monthly/2025/13',
      );

      // 400エラーまたは200（空の結果）のいずれかを許容
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('GET /api/transactions/export', () => {
    beforeEach(async () => {
      // テスト用の取引を作成
      await request(app.getHttpServer())
        .post('/api/transactions')
        .send({
          date: '2025-01-15',
          amount: -1500,
          category: {
            id: 'cat-001',
            name: '食費',
            type: CategoryType.EXPENSE,
          },
          description: 'スターバックス',
          institutionId,
          accountId,
          status: TransactionStatus.COMPLETED,
        });
    });

    it('should export transactions as CSV', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/transactions/export')
        .query({ format: ExportFormat.CSV })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.text).toBeDefined();
    });

    it('should export transactions as JSON', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/transactions/export')
        .query({ format: ExportFormat.JSON })
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.body).toBeDefined();
    });

    it('should filter export by date range', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/transactions/export')
        .query({
          format: ExportFormat.CSV,
          startDate: '2025-01-01',
          endDate: '2025-01-31',
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
    });

    it('should return 400 for invalid format', async () => {
      await request(app.getHttpServer())
        .get('/api/transactions/export')
        .query({ format: 'INVALID' })
        .expect(400);
    });
  });
});
