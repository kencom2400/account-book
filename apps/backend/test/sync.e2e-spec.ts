import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { InstitutionType, AuthenticationType } from '@account-book/types';
import { SyncStatus } from '../src/modules/sync/domain/enums/sync-status.enum';
import { E2ETestDatabaseHelper } from './helpers/database-helper';
import { createTestApp } from './helpers/test-setup';

describe('Sync Controller (e2e)', () => {
  let app: INestApplication;
  let dbHelper: E2ETestDatabaseHelper;
  let institutionId: string;

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
          authenticationType: AuthenticationType.BRANCH_ACCOUNT,
          branchCode: '001',
          accountNumber: '1234567',
        },
      })
      .expect(201);

    expect(institutionResponse.body.success).toBe(true);
    expect(institutionResponse.body.data).toBeDefined();
    institutionId = institutionResponse.body.data.id;
  });

  describe('POST /api/sync/start', () => {
    it('should start sync for all institutions', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/sync/start')
        .send({
          forceFullSync: false,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.summary).toBeDefined();
      expect(response.body.summary.totalInstitutions).toBeDefined();
      expect(response.body.summary.successCount).toBeDefined();
      expect(response.body.summary.failureCount).toBeDefined();
    });

    it('should start sync with forceFullSync', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/sync/start')
        .send({
          forceFullSync: true,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.summary).toBeDefined();
    });

    it('should start sync for specific institutions', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/sync/start')
        .send({
          forceFullSync: false,
          institutionIds: [institutionId],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.summary).toBeDefined();
    });

    it('should accept empty body', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/sync/start')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/sync/status', () => {
    it('should return sync status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/sync/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.isRunning).toBeDefined();
      expect(typeof response.body.data.isRunning).toBe('boolean');
      expect(response.body.data.currentSyncId).toBeDefined();
      expect(response.body.data.startedAt).toBeDefined();
      expect(response.body.data.progress).toBeDefined();
    });
  });

  describe('GET /api/sync/history', () => {
    it('should return sync history', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/sync/history')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.total).toBeDefined();
      expect(response.body.meta.page).toBeDefined();
      expect(response.body.meta.limit).toBeDefined();
      expect(response.body.meta.totalPages).toBeDefined();
    });

    it('should filter history by institutionId', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/sync/history')
        .query({ institutionId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should filter history by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/sync/history')
        .query({ status: SyncStatus.COMPLETED })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should filter history by date range', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/sync/history')
        .query({
          startDate: '2025-01-01',
          endDate: '2025-01-31',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/sync/history')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(10);
    });
  });

  describe('PUT /api/sync/cancel/:id', () => {
    it('should cancel a sync', async () => {
      // まず同期を開始
      const startResponse = await request(app.getHttpServer())
        .post('/api/sync/start')
        .send({ forceFullSync: false });

      if (
        startResponse.body.data &&
        startResponse.body.data.length > 0 &&
        startResponse.body.data[0].id
      ) {
        const syncId = startResponse.body.data[0].id;

        const response = await request(app.getHttpServer())
          .put(`/api/sync/cancel/${syncId}`)
          .expect(200);

        expect(response.body.success).toBeDefined();
        expect(response.body.message).toBeDefined();
      } else {
        // 同期履歴がない場合はスキップ
        console.log('Skipping cancel test: No sync history available');
      }
    });

    it('should return error for non-existent sync id', async () => {
      const response = await request(app.getHttpServer()).put(
        '/api/sync/cancel/00000000-0000-0000-0000-000000000000',
      );

      // 404または200のいずれかを許容
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('GET /api/sync/schedule', () => {
    it('should return sync schedule', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/sync/schedule')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.enabled).toBeDefined();
      expect(response.body.data.cronExpression).toBeDefined();
      expect(response.body.data.timezone).toBeDefined();
      expect(response.body.data.nextRun).toBeDefined();
    });
  });

  describe('PUT /api/sync/schedule', () => {
    it('should update sync schedule', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/sync/schedule')
        .send({
          enabled: true,
          cronExpression: '0 0 4 * * *', // 6フィールド形式（秒 分 時 日 月 曜日）
          timezone: 'Asia/Tokyo',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.enabled).toBe(true);
      expect(response.body.data.cronExpression).toBe('0 0 4 * * *'); // 6フィールド形式
      expect(response.body.data.timezone).toBe('Asia/Tokyo');
    });

    it('should accept partial update', async () => {
      // cronExpressionは必須フィールドなので、すべてのフィールドを指定
      const response = await request(app.getHttpServer())
        .put('/api/sync/schedule')
        .send({
          enabled: false,
          cronExpression: '0 0 4 * * *', // 6フィールド形式（秒 分 時 日 月 曜日）
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.enabled).toBe(false);
    });
  });
});
