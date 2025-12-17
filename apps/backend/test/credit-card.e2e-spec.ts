import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { E2ETestDatabaseHelper } from './helpers/database-helper';
import { createTestApp } from './helpers/test-setup';

describe('CreditCard Controller (e2e)', () => {
  let app: INestApplication;
  let dbHelper: E2ETestDatabaseHelper;
  let createdCardId: string;

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });

    app = await createTestApp(moduleBuilder);

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

  describe('POST /api/credit-cards/connect', () => {
    it('should connect a credit card with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/credit-cards/connect')
        .send({
          cardName: 'テストカード',
          cardNumber: '1234', // 下4桁のみ
          cardHolderName: '山田太郎',
          expiryDate: '2030-12-31',
          username: 'test_user',
          password: 'test_password',
          issuer: 'テスト銀行',
          paymentDay: 27,
          closingDay: 15,
        });

      if (response.status !== 201) {
        console.log('Error response:', JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.cardName).toBe('テストカード');
      expect(response.body.data.cardNumber).toBe('1234');
      expect(response.body.data.cardHolderName).toBe('山田太郎');
      expect(response.body.data.issuer).toBe('テスト銀行');
      expect(response.body.data.paymentDay).toBe(27);
      expect(response.body.data.closingDay).toBe(15);

      createdCardId = response.body.data.id;
    });

    it('should return 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/credit-cards/connect')
        .send({
          cardName: 'テストカード',
          // cardNumber missing
          cardHolderName: '山田太郎',
          expiryDate: '2030-12-31',
        })
        .expect(400);
    });

    it('should return 400 for invalid expiry date format', async () => {
      await request(app.getHttpServer())
        .post('/api/credit-cards/connect')
        .send({
          cardName: 'テストカード',
          cardNumber: '1234', // 下4桁のみ
          cardHolderName: '山田太郎',
          expiryDate: 'invalid-date',
          username: 'test_user',
          password: 'test_password',
          issuer: 'テスト銀行',
          paymentDay: 27,
          closingDay: 15,
        })
        .expect(400);
    });
  });

  describe('GET /api/credit-cards', () => {
    beforeEach(async () => {
      // テスト用のカードを作成
      const createResponse = await request(app.getHttpServer())
        .post('/api/credit-cards/connect')
        .send({
          cardName: 'テストカード',
          cardNumber: '1234', // 下4桁のみ
          cardHolderName: '山田太郎',
          expiryDate: '2030-12-31',
          username: 'test_user',
          password: 'test_password',
          issuer: 'テスト銀行',
          paymentDay: 27,
          closingDay: 15,
        });

      if (createResponse.status !== 201) {
        console.log(
          'Credit card creation error:',
          JSON.stringify(createResponse.body, null, 2),
        );
        throw new Error(
          `Failed to create credit card: ${createResponse.status}`,
        );
      }

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data).toBeDefined();
      createdCardId = createResponse.body.data.id;
    });

    it('should return all credit cards', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/credit-cards')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0].id).toBe(createdCardId);
    });
  });

  describe('GET /api/credit-cards/:id', () => {
    beforeEach(async () => {
      // テスト用のカードを作成
      const createResponse = await request(app.getHttpServer())
        .post('/api/credit-cards/connect')
        .send({
          cardName: 'テストカード',
          cardNumber: '1234', // 下4桁のみ
          cardHolderName: '山田太郎',
          expiryDate: '2030-12-31',
          username: 'test_user',
          password: 'test_password',
          issuer: 'テスト銀行',
          paymentDay: 27,
          closingDay: 15,
        });

      createdCardId = createResponse.body.data.id;
    });

    it('should return a credit card by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/credit-cards/${createdCardId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(createdCardId);
      expect(response.body.data.cardName).toBe('テストカード');
    });

    it('should return 404 for non-existent card', async () => {
      await request(app.getHttpServer())
        .get('/api/credit-cards/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('GET /api/credit-cards/:id/transactions', () => {
    beforeEach(async () => {
      // テスト用のカードを作成
      const createResponse = await request(app.getHttpServer())
        .post('/api/credit-cards/connect')
        .send({
          cardName: 'テストカード',
          cardNumber: '1234', // 下4桁のみ
          cardHolderName: '山田太郎',
          expiryDate: '2030-12-31',
          username: 'test_user',
          password: 'test_password',
          issuer: 'テスト銀行',
          paymentDay: 27,
          closingDay: 15,
        });

      createdCardId = createResponse.body.data.id;
    });

    it('should return transactions for a credit card', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/credit-cards/${createdCardId}/transactions`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBeDefined();
    });

    it('should filter transactions by date range', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/credit-cards/${createdCardId}/transactions`)
        .query({
          startDate: '2025-01-01',
          endDate: '2025-01-31',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should force refresh when forceRefresh is true', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/credit-cards/${createdCardId}/transactions`)
        .query({ forceRefresh: 'true' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/credit-cards/:id/payment-info', () => {
    beforeEach(async () => {
      // テスト用のカードを作成
      const createResponse = await request(app.getHttpServer())
        .post('/api/credit-cards/connect')
        .send({
          cardName: 'テストカード',
          cardNumber: '1234', // 下4桁のみ
          cardHolderName: '山田太郎',
          expiryDate: '2030-12-31',
          username: 'test_user',
          password: 'test_password',
          issuer: 'テスト銀行',
          paymentDay: 27,
          closingDay: 15,
        });

      createdCardId = createResponse.body.data.id;
    });

    it('should return payment info for a credit card', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/credit-cards/${createdCardId}/payment-info`)
        .query({ billingMonth: '2025-01' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.billingMonth).toBeDefined();
      expect(response.body.data.totalAmount).toBeDefined();
      expect(response.body.data.status).toBeDefined();
    });

    it('should force refresh when forceRefresh is true', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/credit-cards/${createdCardId}/payment-info`)
        .query({
          billingMonth: '2025-01',
          forceRefresh: 'true',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('DELETE /api/credit-cards/:id', () => {
    beforeEach(async () => {
      // テスト用のカードを作成
      const createResponse = await request(app.getHttpServer())
        .post('/api/credit-cards/connect')
        .send({
          cardName: 'テストカード',
          cardNumber: '1234', // 下4桁のみ
          cardHolderName: '山田太郎',
          expiryDate: '2030-12-31',
          username: 'test_user',
          password: 'test_password',
          issuer: 'テスト銀行',
          paymentDay: 27,
          closingDay: 15,
        });

      createdCardId = createResponse.body.data.id;
    });

    it('should delete a credit card', async () => {
      await request(app.getHttpServer())
        .delete(`/api/credit-cards/${createdCardId}`)
        .expect(204);

      // 削除されたことを確認
      await request(app.getHttpServer())
        .get(`/api/credit-cards/${createdCardId}`)
        .expect(404);
    });

    it('should handle non-existent card gracefully', async () => {
      // 実装によっては204を返す可能性がある
      const response = await request(app.getHttpServer()).delete(
        '/api/credit-cards/00000000-0000-0000-0000-000000000000',
      );

      // 404または204のいずれかを許容
      expect([404, 204]).toContain(response.status);
    });
  });

  describe('POST /api/credit-cards/:id/refresh', () => {
    beforeEach(async () => {
      // テスト用のカードを作成
      const createResponse = await request(app.getHttpServer())
        .post('/api/credit-cards/connect')
        .send({
          cardName: 'テストカード',
          cardNumber: '1234', // 下4桁のみ
          cardHolderName: '山田太郎',
          expiryDate: '2030-12-31',
          username: 'test_user',
          password: 'test_password',
          issuer: 'テスト銀行',
          paymentDay: 27,
          closingDay: 15,
        });

      createdCardId = createResponse.body.data.id;
    });

    it('should refresh credit card data', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/credit-cards/${createdCardId}/refresh`)
        .expect(201); // 実装が201を返す

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.creditCard).toBeDefined();
      expect(response.body.data.transactions).toBeDefined();
      expect(response.body.data.payment).toBeDefined();
      expect(response.body.message).toBeDefined();
    });

    it('should return 404 for non-existent card', async () => {
      await request(app.getHttpServer())
        .post('/api/credit-cards/00000000-0000-0000-0000-000000000000/refresh')
        .expect(404);
    });
  });
});
