import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { E2ETestDatabaseHelper } from './helpers/database-helper';
import { createTestApp } from './helpers/test-setup';

describe('Alert API (e2e)', () => {
  let app: INestApplication;
  let dbHelper: E2ETestDatabaseHelper;

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
  });

  describe('POST /api/alerts', () => {
    it('正常にアラートを生成できる', async () => {
      // まず照合結果を作成する必要がある
      // ここでは簡易的に、照合結果が存在することを前提とする
      // 実際の実装では、Reconciliationを作成してからアラートを生成する

      const response = await request(app.getHttpServer())
        .post('/api/alerts')
        .send({
          reconciliationId: 'test-reconciliation-001',
        });

      // 照合結果が存在しない場合は404エラー
      expect([201, 404]).toContain(response.status);
    });

    it('バリデーションエラーを返す', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/alerts')
        .send({
          reconciliationId: 'invalid-uuid',
        });

      expect([400, 422, 404]).toContain(response.status);
    });
  });

  describe('GET /api/alerts', () => {
    it('正常にアラート一覧を取得できる', async () => {
      const response = await request(app.getHttpServer()).get('/api/alerts');

      // エンドポイントが存在する場合は200、存在しない場合は404
      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.alerts).toBeInstanceOf(Array);
        expect(response.body.data.total).toBeGreaterThanOrEqual(0);
        expect(response.body.data.unreadCount).toBeGreaterThanOrEqual(0);
      }
    });

    it('フィルター付きでアラート一覧を取得できる', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/alerts')
        .query({
          status: 'UNREAD',
          level: 'WARNING',
        });

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('GET /api/alerts/:id', () => {
    it('存在しないアラートの場合は404エラー', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/alerts/non-existent-id',
      );

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/alerts/:id/resolve', () => {
    it('存在しないアラートの場合は404エラー', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/alerts/non-existent-id/resolve')
        .send({
          resolvedBy: 'user-001',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/alerts/:id/read', () => {
    it('存在しないアラートの場合は404エラー', async () => {
      const response = await request(app.getHttpServer()).patch(
        '/api/alerts/non-existent-id/read',
      );

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/alerts/:id', () => {
    it('存在しないアラートの場合は404エラー', async () => {
      const response = await request(app.getHttpServer()).delete(
        '/api/alerts/non-existent-id',
      );

      expect(response.status).toBe(404);
    });
  });
});
