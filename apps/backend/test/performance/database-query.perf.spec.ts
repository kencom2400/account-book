import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { performance } from 'perf_hooks';
import { AppModule } from '../../src/app.module';
import { DatabaseHelper } from '../helpers/database-helper';

/**
 * データベースクエリパフォーマンステスト
 *
 * 目標:
 * - 1000件のレコード取得を1秒以内
 * - 集計クエリを2秒以内
 * - 複雑な結合クエリを3秒以内
 *
 * 参照: docs/test-design.md - Section 10.3
 */
describe('Database Query Performance', () => {
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

  describe('Large Dataset Query Performance', () => {
    it('should fetch 100 institutions within 1 second', async () => {
      // 100件のデータを準備
      console.log('Creating 100 institutions...');
      const createStartTime = performance.now();

      const createPromises = [];
      for (let i = 0; i < 100; i++) {
        createPromises.push(
          request(app.getHttpServer())
            .post('/api/institutions')
            .send({
              type:
                i % 3 === 0
                  ? 'bank'
                  : i % 3 === 1
                    ? 'credit_card'
                    : 'securities',
              name: `Test Institution ${i}`,
              branchName: `Branch ${i}`,
              accountNumber: `${1000000 + i}`,
              accountHolder: 'Test User',
              initialBalance: 1000000 + i * 10000,
            }),
        );
      }
      await Promise.all(createPromises);

      const createDuration = performance.now() - createStartTime;
      console.log(`Data creation completed: ${createDuration}ms`);

      // クエリパフォーマンスを測定
      const queryStartTime = performance.now();

      const response = await request(app.getHttpServer())
        .get('/api/institutions')
        .expect(200);

      const queryDuration = performance.now() - queryStartTime;

      expect(response.body.success).toBe(true);
      expect(response.body.data.items.length).toBeGreaterThanOrEqual(100);
      expect(queryDuration).toBeLessThan(1000);

      console.log('\nQuery Performance (100 records):');
      console.log(`  Query duration: ${queryDuration}ms`);
      console.log(`  Records fetched: ${response.body.data.items.length}`);
      console.log(
        `  Avg per record: ${(queryDuration / response.body.data.items.length).toFixed(2)}ms`,
      );
    });

    it('should fetch 500 institutions within 2 seconds', async () => {
      // 500件のデータを準備
      console.log('Creating 500 institutions...');
      const createStartTime = performance.now();

      // バッチで作成（50件ずつ）
      for (let batch = 0; batch < 10; batch++) {
        const batchPromises = [];
        for (let i = 0; i < 50; i++) {
          const index = batch * 50 + i;
          batchPromises.push(
            request(app.getHttpServer())
              .post('/api/institutions')
              .send({
                type:
                  index % 3 === 0
                    ? 'bank'
                    : index % 3 === 1
                      ? 'credit_card'
                      : 'securities',
                name: `Test Institution ${index}`,
                branchName: `Branch ${index}`,
                accountNumber: `${1000000 + index}`,
                accountHolder: 'Test User',
                initialBalance: 1000000 + index * 10000,
              }),
          );
        }
        await Promise.all(batchPromises);
        console.log(`  Batch ${batch + 1}/10 created`);
      }

      const createDuration = performance.now() - createStartTime;
      console.log(`Data creation completed: ${createDuration}ms`);

      // クエリパフォーマンスを測定
      const queryStartTime = performance.now();

      const response = await request(app.getHttpServer())
        .get('/api/institutions')
        .expect(200);

      const queryDuration = performance.now() - queryStartTime;

      expect(response.body.success).toBe(true);
      expect(response.body.data.items.length).toBeGreaterThanOrEqual(500);
      expect(queryDuration).toBeLessThan(2000);

      console.log('\nQuery Performance (500 records):');
      console.log(`  Query duration: ${queryDuration}ms`);
      console.log(`  Records fetched: ${response.body.data.items.length}`);
      console.log(
        `  Avg per record: ${(queryDuration / response.body.data.items.length).toFixed(2)}ms`,
      );
    });
  });

  describe('Filtered Query Performance', () => {
    beforeEach(async () => {
      // テストデータを準備
      const createPromises = [];
      for (let i = 0; i < 100; i++) {
        createPromises.push(
          request(app.getHttpServer())
            .post('/api/institutions')
            .send({
              type:
                i % 3 === 0
                  ? 'bank'
                  : i % 3 === 1
                    ? 'credit_card'
                    : 'securities',
              name: `Test Institution ${i}`,
              branchName: `Branch ${i}`,
              accountNumber: `${1000000 + i}`,
              accountHolder: 'Test User',
              initialBalance: 1000000 + i * 10000,
            }),
        );
      }
      await Promise.all(createPromises);
    });

    it('should filter by type within 500ms', async () => {
      const startTime = performance.now();

      const response = await request(app.getHttpServer())
        .get('/api/institutions')
        .query({ type: 'bank' })
        .expect(200);

      const duration = performance.now() - startTime;

      expect(response.body.success).toBe(true);
      expect(duration).toBeLessThan(500);

      console.log('\nFiltered Query Performance (by type):');
      console.log(`  Query duration: ${duration}ms`);
      console.log(`  Records fetched: ${response.body.data.items.length}`);
    });

    it('should search by name within 500ms', async () => {
      const startTime = performance.now();

      const response = await request(app.getHttpServer())
        .get('/api/institutions')
        .query({ search: 'Institution 1' })
        .expect(200);

      const duration = performance.now() - startTime;

      expect(response.body.success).toBe(true);
      expect(duration).toBeLessThan(500);

      console.log('\nSearch Query Performance (by name):');
      console.log(`  Query duration: ${duration}ms`);
      console.log(`  Records fetched: ${response.body.data.items.length}`);
    });
  });

  // Note: Pagination Performance テストは、InstitutionControllerにページネーション機能が
  // 実装された後に有効化する予定です。現在のAPIは全件取得のみ対応しています。
  describe.skip('Pagination Performance (Future Implementation)', () => {
    beforeEach(async () => {
      // 200件のテストデータを準備
      console.log('Creating 200 institutions for pagination test...');
      const createPromises = [];
      for (let i = 0; i < 200; i++) {
        createPromises.push(
          request(app.getHttpServer())
            .post('/api/institutions')
            .send({
              type:
                i % 3 === 0
                  ? 'bank'
                  : i % 3 === 1
                    ? 'credit_card'
                    : 'securities',
              name: `Test Institution ${i}`,
              branchName: `Branch ${i}`,
              accountNumber: `${1000000 + i}`,
              accountHolder: 'Test User',
              initialBalance: 1000000 + i * 10000,
            }),
        );
      }
      await Promise.all(createPromises);
    });

    it('should fetch first page (20 records) within 500ms', async () => {
      const startTime = performance.now();

      const response = await request(app.getHttpServer())
        .get('/api/institutions')
        .query({ page: 1, limit: 20 })
        .expect(200);

      const duration = performance.now() - startTime;

      expect(response.body.success).toBe(true);
      expect(response.body.data.items.length).toBeLessThanOrEqual(20);
      expect(duration).toBeLessThan(500);

      console.log('\nPagination Performance (Page 1):');
      console.log(`  Query duration: ${duration}ms`);
      console.log(`  Records fetched: ${response.body.data.items.length}`);
    });

    it('should fetch last page within 500ms', async () => {
      // まず総件数を取得
      const countResponse = await request(app.getHttpServer())
        .get('/api/institutions')
        .expect(200);

      const totalCount = countResponse.body.data.items.length;
      const lastPage = Math.ceil(totalCount / 20);

      const startTime = performance.now();

      const response = await request(app.getHttpServer())
        .get('/api/institutions')
        .query({ page: lastPage, limit: 20 })
        .expect(200);

      const duration = performance.now() - startTime;

      expect(response.body.success).toBe(true);
      expect(duration).toBeLessThan(500);

      console.log(`\nPagination Performance (Page ${lastPage}, Last Page):`);
      console.log(`  Query duration: ${duration}ms`);
      console.log(`  Records fetched: ${response.body.data.items.length}`);
    });

    it('should navigate through pages efficiently', async () => {
      const pagesToTest = [1, 5, 10];
      const times: number[] = [];

      for (const page of pagesToTest) {
        const startTime = performance.now();
        const response = await request(app.getHttpServer())
          .get('/api/institutions')
          .query({ page, limit: 20 })
          .expect(200);
        const duration = performance.now() - startTime;
        times.push(duration);

        expect(response.body.success).toBe(true);
        expect(duration).toBeLessThan(500);

        console.log(`  Page ${page}: ${duration}ms`);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`\nAverage pagination time: ${avgTime.toFixed(2)}ms`);
    });
  });

  describe('Concurrent Query Performance', () => {
    beforeEach(async () => {
      // テストデータを準備
      const createPromises = [];
      for (let i = 0; i < 50; i++) {
        createPromises.push(
          request(app.getHttpServer())
            .post('/api/institutions')
            .send({
              type:
                i % 3 === 0
                  ? 'bank'
                  : i % 3 === 1
                    ? 'credit_card'
                    : 'securities',
              name: `Test Institution ${i}`,
              branchName: `Branch ${i}`,
              accountNumber: `${1000000 + i}`,
              accountHolder: 'Test User',
              initialBalance: 1000000 + i * 10000,
            }),
        );
      }
      await Promise.all(createPromises);
    });

    it('should handle 50 concurrent read queries efficiently', async () => {
      const requestCount = 50;
      const requests = Array.from({ length: requestCount }, () =>
        request(app.getHttpServer()).get('/api/institutions'),
      );

      const startTime = performance.now();
      const responses = await Promise.all(requests);
      const duration = performance.now() - startTime;

      // すべてのクエリが成功
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      expect(duration).toBeLessThan(3000);

      const avgTime = duration / requestCount;
      console.log('\nConcurrent Query Performance (50 queries):');
      console.log(`  Total duration: ${duration}ms`);
      console.log(`  Average query time: ${avgTime.toFixed(2)}ms`);
      console.log(
        `  Queries per second: ${(requestCount / (duration / 1000)).toFixed(2)}`,
      );
    });
  });

  describe('Query Optimization Verification', () => {
    it('should use efficient queries (no N+1 problem)', async () => {
      // 10件のデータを作成
      const createPromises = [];
      for (let i = 0; i < 10; i++) {
        createPromises.push(
          request(app.getHttpServer())
            .post('/api/institutions')
            .send({
              type: 'bank',
              name: `Test Bank ${i}`,
              branchName: `Branch ${i}`,
              accountNumber: `${1000000 + i}`,
              accountHolder: 'Test User',
              initialBalance: 1000000,
            }),
        );
      }
      await Promise.all(createPromises);

      // 最初のクエリ（10件）
      const startTime1 = performance.now();
      await request(app.getHttpServer()).get('/api/institutions').expect(200);
      const duration1 = performance.now() - startTime1;

      // さらに10件追加
      for (let i = 10; i < 20; i++) {
        await request(app.getHttpServer())
          .post('/api/institutions')
          .send({
            type: 'bank',
            name: `Test Bank ${i}`,
            branchName: `Branch ${i}`,
            accountNumber: `${1000000 + i}`,
            accountHolder: 'Test User',
            initialBalance: 1000000,
          });
      }

      // 2回目のクエリ（20件）
      const startTime2 = performance.now();
      await request(app.getHttpServer()).get('/api/institutions').expect(200);
      const duration2 = performance.now() - startTime2;

      console.log('\nQuery Scaling Analysis:');
      console.log(`  10 records: ${duration1}ms`);
      console.log(`  20 records: ${duration2}ms`);
      console.log(
        `  Time increase ratio: ${(duration2 / duration1).toFixed(2)}x`,
      );

      // データ量が2倍になっても、クエリ時間の増加は2.5倍以内であること（線形スケーリング＋余裕）
      expect(duration2 / duration1).toBeLessThan(2.5);
    });
  });

  describe('Database Connection Pool Performance', () => {
    it('should efficiently manage connection pool under load', async () => {
      const waves = 3;
      const requestsPerWave = 30;
      const waveTimes: number[] = [];

      console.log('\nConnection Pool Performance Test:');

      for (let wave = 0; wave < waves; wave++) {
        const requests = Array.from({ length: requestsPerWave }, () =>
          request(app.getHttpServer()).get('/api/health'),
        );

        const startTime = performance.now();
        await Promise.all(requests);
        const duration = performance.now() - startTime;
        waveTimes.push(duration);

        console.log(`  Wave ${wave + 1}: ${duration}ms`);

        // 次のwaveまで少し待機
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const avgWaveTime = waveTimes.reduce((a, b) => a + b, 0) / waves;
      const maxVariation = Math.max(...waveTimes) - Math.min(...waveTimes);

      console.log('\nConnection Pool Summary:');
      console.log(`  Average wave time: ${avgWaveTime.toFixed(2)}ms`);
      console.log(`  Max variation: ${maxVariation}ms`);

      // コネクションプールが正常に機能していれば、wave間の時間差は小さいはず
      expect(maxVariation).toBeLessThan(1000);
    });
  });
});
