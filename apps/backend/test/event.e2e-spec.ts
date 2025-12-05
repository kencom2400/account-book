import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { EventCategory } from '../src/modules/event/domain/enums/event-category.enum';
import { E2ETestDatabaseHelper } from './helpers/database-helper';
import { createTestApp } from './helpers/test-setup';

describe('Event Controller (e2e)', () => {
  let app: INestApplication;
  let dbHelper: E2ETestDatabaseHelper;
  let createdEventId: string;
  let createdTransactionId: string;

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

  describe('POST /api/events', () => {
    it('should create a new event', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/events')
        .send({
          date: '2025-04-01',
          title: '入学式',
          description: '長男の小学校入学式',
          category: EventCategory.EDUCATION,
          tags: ['学校', '入学'],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe('入学式');
      expect(response.body.data.category).toBe(EventCategory.EDUCATION);
      expect(response.body.data.tags).toEqual(['学校', '入学']);

      createdEventId = response.body.data.id;
    });

    it('should create event with null description', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/events')
        .send({
          date: '2025-04-01',
          title: '入学式',
          description: null,
          category: EventCategory.EDUCATION,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBeNull();
    });

    it('should fail with missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/events')
        .send({
          // dateが不足
          title: '入学式',
          category: EventCategory.EDUCATION,
        })
        .expect(400);
    });

    it('should fail with invalid title length', async () => {
      await request(app.getHttpServer())
        .post('/api/events')
        .send({
          date: '2025-04-01',
          title: 'a'.repeat(101), // 101文字（制限超過）
          category: EventCategory.EDUCATION,
        })
        .expect(400);
    });
  });

  describe('GET /api/events/:id', () => {
    beforeEach(async () => {
      // テスト用のイベントを作成
      const createResponse = await request(app.getHttpServer())
        .post('/api/events')
        .send({
          date: '2025-04-01',
          title: '入学式',
          description: '長男の小学校入学式',
          category: EventCategory.EDUCATION,
          tags: ['学校', '入学'],
        });

      createdEventId = createResponse.body.data.id;
    });

    it('should get event by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/events/${createdEventId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(createdEventId);
      expect(response.body.data.title).toBe('入学式');
      expect(response.body.data.relatedTransactions).toEqual([]);
    });

    it('should return 404 for non-existent event', async () => {
      await request(app.getHttpServer())
        .get('/api/events/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('GET /api/events/date-range', () => {
    beforeEach(async () => {
      // テスト用のイベントを作成
      await request(app.getHttpServer()).post('/api/events').send({
        date: '2025-04-01',
        title: '入学式',
        category: EventCategory.EDUCATION,
      });

      await request(app.getHttpServer()).post('/api/events').send({
        date: '2025-04-15',
        title: '旅行',
        category: EventCategory.TRAVEL,
      });
    });

    it('should get events by date range', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/events/date-range')
        .query({
          startDate: '2025-04-01',
          endDate: '2025-04-30',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should return 400 when startDate or endDate is missing', async () => {
      await request(app.getHttpServer())
        .get('/api/events/date-range')
        .query({
          startDate: '2025-04-01',
          // endDateが不足
        })
        .expect(400);
    });
  });

  describe('PUT /api/events/:id', () => {
    beforeEach(async () => {
      // テスト用のイベントを作成
      const createResponse = await request(app.getHttpServer())
        .post('/api/events')
        .send({
          date: '2025-04-01',
          title: '入学式',
          category: EventCategory.EDUCATION,
        });

      createdEventId = createResponse.body.data.id;
    });

    it('should update event', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/events/${createdEventId}`)
        .send({
          title: '更新されたタイトル',
          category: EventCategory.TRAVEL,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('更新されたタイトル');
      expect(response.body.data.category).toBe(EventCategory.TRAVEL);
    });

    it('should return 404 for non-existent event', async () => {
      await request(app.getHttpServer())
        .put('/api/events/00000000-0000-0000-0000-000000000000')
        .send({
          title: '更新されたタイトル',
        })
        .expect(404);
    });
  });

  describe('DELETE /api/events/:id', () => {
    beforeEach(async () => {
      // テスト用のイベントを作成
      const createResponse = await request(app.getHttpServer())
        .post('/api/events')
        .send({
          date: '2025-04-01',
          title: '入学式',
          category: EventCategory.EDUCATION,
        });

      createdEventId = createResponse.body.data.id;
    });

    it('should delete event', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/events/${createdEventId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('イベントを削除しました');

      // 削除されたことを確認
      await request(app.getHttpServer())
        .get(`/api/events/${createdEventId}`)
        .expect(404);
    });

    it('should return 404 for non-existent event', async () => {
      await request(app.getHttpServer())
        .delete('/api/events/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('POST /api/events/:id/transactions', () => {
    beforeEach(async () => {
      // テスト用のイベントを作成
      const createEventResponse = await request(app.getHttpServer())
        .post('/api/events')
        .send({
          date: '2025-04-01',
          title: '入学式',
          category: EventCategory.EDUCATION,
        });

      createdEventId = createEventResponse.body.data.id;

      // テスト用の取引を作成（TransactionControllerを使用）
      const createTransactionResponse = await request(app.getHttpServer())
        .post('/api/transactions')
        .send({
          date: '2025-04-01',
          amount: 50000,
          category: {
            id: 'cat_1',
            name: '教育費',
            type: 'EXPENSE',
          },
          description: '入学式関連費用',
          institutionId: 'inst_1',
          accountId: 'acc_1',
        });

      createdTransactionId = createTransactionResponse.body.data.id;
    });

    it('should link transaction to event', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/events/${createdEventId}/transactions`)
        .send({
          transactionId: createdTransactionId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('取引とイベントを紐付けました');

      // 紐付けが成功したことを確認
      const getEventResponse = await request(app.getHttpServer())
        .get(`/api/events/${createdEventId}`)
        .expect(200);

      expect(
        getEventResponse.body.data.relatedTransactions.length,
      ).toBeGreaterThanOrEqual(1);
    });

    it('should return 404 for non-existent event', async () => {
      await request(app.getHttpServer())
        .post('/api/events/00000000-0000-0000-0000-000000000000/transactions')
        .send({
          transactionId: createdTransactionId,
        })
        .expect(404);
    });
  });

  describe('DELETE /api/events/:id/transactions/:transactionId', () => {
    beforeEach(async () => {
      // テスト用のイベントを作成
      const createEventResponse = await request(app.getHttpServer())
        .post('/api/events')
        .send({
          date: '2025-04-01',
          title: '入学式',
          category: EventCategory.EDUCATION,
        });

      createdEventId = createEventResponse.body.data.id;

      // テスト用の取引を作成
      const createTransactionResponse = await request(app.getHttpServer())
        .post('/api/transactions')
        .send({
          date: '2025-04-01',
          amount: 50000,
          category: {
            id: 'cat_1',
            name: '教育費',
            type: 'EXPENSE',
          },
          description: '入学式関連費用',
          institutionId: 'inst_1',
          accountId: 'acc_1',
        });

      createdTransactionId = createTransactionResponse.body.data.id;

      // 取引とイベントを紐付け
      await request(app.getHttpServer())
        .post(`/api/events/${createdEventId}/transactions`)
        .send({
          transactionId: createdTransactionId,
        });
    });

    it('should unlink transaction from event', async () => {
      const response = await request(app.getHttpServer())
        .delete(
          `/api/events/${createdEventId}/transactions/${createdTransactionId}`,
        )
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe(
        '取引とイベントの紐付けを解除しました',
      );

      // 紐付けが解除されたことを確認
      const getEventResponse = await request(app.getHttpServer())
        .get(`/api/events/${createdEventId}`)
        .expect(200);

      expect(getEventResponse.body.data.relatedTransactions).not.toContain(
        expect.objectContaining({ id: createdTransactionId }),
      );
    });

    it('should return 404 for non-existent event', async () => {
      await request(app.getHttpServer())
        .delete(
          `/api/events/00000000-0000-0000-0000-000000000000/transactions/${createdTransactionId}`,
        )
        .expect(404);
    });
  });
});
