import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DatabaseHelper } from '../helpers/database-helper';

/**
 * APIレスポンスタイムテスト
 *
 * 目標:
 * - GET APIは500ms以内
 * - POST/PUT/PATCH/DELETE APIは500ms以内
 *
 * 参照: docs/test-design.md - Section 10.1
 */
describe('API Response Time (Performance)', () => {
  let app: INestApplication;
  let databaseHelper: DatabaseHelper;

  beforeAll(async () => {
    databaseHelper = new DatabaseHelper();
    await databaseHelper.setupDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await databaseHelper.clearDatabase();
    await app.close();
  });

  beforeEach(async () => {
    await databaseHelper.clearDatabase();
  });

  describe('Health API Performance', () => {
    it('GET /api/health should respond within 100ms', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      const duration = Date.now() - startTime;

      expect(response.body.status).toBe('ok');
      expect(duration).toBeLessThan(100);
      console.log(`GET /api/health - Response time: ${duration}ms`);
    });
  });

  describe('Institutions API Performance', () => {
    it('GET /api/institutions should respond within 500ms', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get('/api/institutions')
        .expect(200);

      const duration = Date.now() - startTime;

      expect(response.body.success).toBe(true);
      expect(duration).toBeLessThan(500);
      console.log(
        `GET /api/institutions - Response time: ${duration}ms - Items: ${response.body.data.items.length}`,
      );
    });

    it('GET /api/institutions/:id should respond within 500ms', async () => {
      // テスト用機関を作成
      const createResponse = await request(app.getHttpServer())
        .post('/api/institutions')
        .send({
          type: 'bank',
          name: 'Performance Test Bank',
          branchName: 'Main Branch',
          accountNumber: '1234567',
          accountHolder: 'Test User',
          initialBalance: 1000000,
        })
        .expect(201);

      const institutionId = createResponse.body.data.id;

      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get(`/api/institutions/${institutionId}`)
        .expect(200);

      const duration = Date.now() - startTime;

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(institutionId);
      expect(duration).toBeLessThan(500);
      console.log(`GET /api/institutions/:id - Response time: ${duration}ms`);
    });

    it('POST /api/institutions should respond within 500ms', async () => {
      const dto = {
        type: 'bank',
        name: 'Performance Test Bank',
        branchName: 'Main Branch',
        accountNumber: '1234567',
        accountHolder: 'Test User',
        initialBalance: 1000000,
      };

      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .post('/api/institutions')
        .send(dto)
        .expect(201);

      const duration = Date.now() - startTime;

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(duration).toBeLessThan(500);
      console.log(`POST /api/institutions - Response time: ${duration}ms`);
    });

    it('PATCH /api/institutions/:id should respond within 500ms', async () => {
      // テスト用機関を作成
      const createResponse = await request(app.getHttpServer())
        .post('/api/institutions')
        .send({
          type: 'bank',
          name: 'Performance Test Bank',
          branchName: 'Main Branch',
          accountNumber: '1234567',
          accountHolder: 'Test User',
          initialBalance: 1000000,
        })
        .expect(201);

      const institutionId = createResponse.body.data.id;

      const updateDto = {
        name: 'Updated Bank Name',
      };

      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .patch(`/api/institutions/${institutionId}`)
        .send(updateDto)
        .expect(200);

      const duration = Date.now() - startTime;

      expect(response.body.success).toBe(true);
      expect(duration).toBeLessThan(500);
      console.log(`PATCH /api/institutions/:id - Response time: ${duration}ms`);
    });

    it('DELETE /api/institutions/:id should respond within 500ms', async () => {
      // テスト用機関を作成
      const createResponse = await request(app.getHttpServer())
        .post('/api/institutions')
        .send({
          type: 'bank',
          name: 'Performance Test Bank',
          branchName: 'Main Branch',
          accountNumber: '1234567',
          accountHolder: 'Test User',
          initialBalance: 1000000,
        })
        .expect(201);

      const institutionId = createResponse.body.data.id;

      const startTime = Date.now();

      await request(app.getHttpServer())
        .delete(`/api/institutions/${institutionId}`)
        .expect(200);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500);
      console.log(
        `DELETE /api/institutions/:id - Response time: ${duration}ms`,
      );
    });
  });

  describe('Categories API Performance', () => {
    it('GET /api/categories should respond within 500ms', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get('/api/categories')
        .expect(200);

      const duration = Date.now() - startTime;

      expect(response.body.success).toBe(true);
      expect(duration).toBeLessThan(500);
      console.log(
        `GET /api/categories - Response time: ${duration}ms - Items: ${response.body.data.items.length}`,
      );
    });
  });

  describe('Credit Cards API Performance', () => {
    it('GET /api/credit-cards should respond within 500ms', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get('/api/credit-cards')
        .expect(200);

      const duration = Date.now() - startTime;

      expect(response.body.success).toBe(true);
      expect(duration).toBeLessThan(500);
      console.log(
        `GET /api/credit-cards - Response time: ${duration}ms - Items: ${response.body.data.items.length}`,
      );
    });
  });

  describe('Securities API Performance', () => {
    it('GET /api/securities should respond within 500ms', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get('/api/securities')
        .expect(200);

      const duration = Date.now() - startTime;

      expect(response.body.success).toBe(true);
      expect(duration).toBeLessThan(500);
      console.log(
        `GET /api/securities - Response time: ${duration}ms - Items: ${response.body.data.items.length}`,
      );
    });
  });

  describe('Large Dataset Performance', () => {
    it('GET /api/institutions with 100 records should respond within 1000ms', async () => {
      // 100件の機関を作成
      const createPromises = [];
      for (let i = 0; i < 100; i++) {
        createPromises.push(
          request(app.getHttpServer())
            .post('/api/institutions')
            .send({
              type: 'bank',
              name: `Test Bank ${i}`,
              branchName: `Branch ${i}`,
              accountNumber: `${1000000 + i}`,
              accountHolder: 'Test User',
              initialBalance: 1000000 + i * 10000,
            }),
        );
      }
      await Promise.all(createPromises);

      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get('/api/institutions')
        .expect(200);

      const duration = Date.now() - startTime;

      expect(response.body.success).toBe(true);
      expect(response.body.data.items.length).toBeGreaterThanOrEqual(100);
      expect(duration).toBeLessThan(1000);
      console.log(
        `GET /api/institutions (100 records) - Response time: ${duration}ms`,
      );
    });
  });

  describe('Response Time Statistics', () => {
    it('should measure average response time for 10 consecutive requests', async () => {
      const times: number[] = [];

      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        await request(app.getHttpServer()).get('/api/health').expect(200);
        times.push(Date.now() - startTime);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);

      console.log('Response Time Statistics (10 requests):');
      console.log(`  Average: ${avgTime.toFixed(2)}ms`);
      console.log(`  Min: ${minTime}ms`);
      console.log(`  Max: ${maxTime}ms`);

      expect(avgTime).toBeLessThan(100);
      expect(maxTime).toBeLessThan(200);
    });
  });
});
