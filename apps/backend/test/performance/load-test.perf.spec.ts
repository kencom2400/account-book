import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { performance } from 'perf_hooks';
import { AppModule } from '../../src/app.module';
import { DatabaseHelper } from '../helpers/database-helper';

/**
 * 負荷テスト
 *
 * 目標:
 * - 100件の同時リクエストを5秒以内に処理
 * - 平均レスポンスタイムが1秒以内
 * - すべてのリクエストが成功
 *
 * 参照: docs/test-design.md - Section 10.2
 */
describe('Load Test (Performance)', () => {
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

  describe('Concurrent Request Handling', () => {
    it('should handle 50 concurrent GET requests within 3 seconds', async () => {
      const requestCount = 50;
      const requests = Array.from({ length: requestCount }, () =>
        request(app.getHttpServer()).get('/api/health'),
      );

      const startTime = performance.now();
      const responses = await Promise.all(requests);
      const duration = performance.now() - startTime;

      // すべてのリクエストが成功
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
      });

      // 全体で3秒以内
      expect(duration).toBeLessThan(3000);

      // 平均レスポンスタイム
      const avgTime = duration / requestCount;
      console.log('\nConcurrent Request Test (50 requests):');
      console.log(`  Total duration: ${duration}ms`);
      console.log(`  Average response time: ${avgTime.toFixed(2)}ms`);
      console.log(
        `  Throughput: ${(requestCount / (duration / 1000)).toFixed(2)} req/s`,
      );

      expect(avgTime).toBeLessThan(100);
    });

    it('should handle 100 concurrent GET /api/institutions requests within 5 seconds', async () => {
      // テストデータを事前に作成
      for (let i = 0; i < 10; i++) {
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

      const requestCount = 100;
      const requests = Array.from({ length: requestCount }, () =>
        request(app.getHttpServer()).get('/api/institutions'),
      );

      const startTime = performance.now();
      const responses = await Promise.all(requests);
      const duration = performance.now() - startTime;

      // すべてのリクエストが成功
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // 全体で5秒以内
      expect(duration).toBeLessThan(5000);

      // 平均レスポンスタイム
      const avgTime = duration / requestCount;
      console.log(
        '\nConcurrent Request Test (100 requests to /api/institutions):',
      );
      console.log(`  Total duration: ${duration}ms`);
      console.log(`  Average response time: ${avgTime.toFixed(2)}ms`);
      console.log(
        `  Throughput: ${(requestCount / (duration / 1000)).toFixed(2)} req/s`,
      );

      expect(avgTime).toBeLessThan(1000);
    });

    it('should handle 50 concurrent POST requests within 5 seconds', async () => {
      const requestCount = 50;
      const requests = Array.from({ length: requestCount }, (_, i) =>
        request(app.getHttpServer())
          .post('/api/institutions')
          .send({
            type: 'bank',
            name: `Load Test Bank ${i}`,
            branchName: `Branch ${i}`,
            accountNumber: `${2000000 + i}`,
            accountHolder: 'Test User',
            initialBalance: 1000000,
          }),
      );

      const startTime = performance.now();
      const responses = await Promise.all(requests);
      const duration = performance.now() - startTime;

      // すべてのリクエストが成功
      responses.forEach((response) => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBeDefined();
      });

      // 全体で5秒以内
      expect(duration).toBeLessThan(5000);

      // 平均レスポンスタイム
      const avgTime = duration / requestCount;
      console.log('\nConcurrent POST Request Test (50 requests):');
      console.log(`  Total duration: ${duration}ms`);
      console.log(`  Average response time: ${avgTime.toFixed(2)}ms`);
      console.log(
        `  Throughput: ${(requestCount / (duration / 1000)).toFixed(2)} req/s`,
      );

      expect(avgTime).toBeLessThan(1000);
    });
  });

  describe('Sequential Request Performance', () => {
    it('should handle 100 sequential GET requests within 10 seconds', async () => {
      const requestCount = 100;
      const times: number[] = [];

      const startTime = performance.now();

      for (let i = 0; i < requestCount; i++) {
        const reqStartTime = performance.now();
        const response = await request(app.getHttpServer()).get('/api/health');
        times.push(performance.now() - reqStartTime);

        expect(response.status).toBe(200);
      }

      const duration = performance.now() - startTime;

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);

      console.log('\nSequential Request Test (100 requests):');
      console.log(`  Total duration: ${duration}ms`);
      console.log(`  Average response time: ${avgTime.toFixed(2)}ms`);
      console.log(`  Min response time: ${minTime}ms`);
      console.log(`  Max response time: ${maxTime}ms`);
      console.log(
        `  Throughput: ${(requestCount / (duration / 1000)).toFixed(2)} req/s`,
      );

      expect(duration).toBeLessThan(10000);
      expect(avgTime).toBeLessThan(100);
    });
  });

  describe('Mixed Load Test', () => {
    it('should handle mixed GET and POST requests concurrently', async () => {
      const getRequestCount = 50;
      const postRequestCount = 25;

      const getRequests = Array.from({ length: getRequestCount }, () =>
        request(app.getHttpServer()).get('/api/institutions'),
      );

      const postRequests = Array.from({ length: postRequestCount }, (_, i) =>
        request(app.getHttpServer())
          .post('/api/institutions')
          .send({
            type: 'bank',
            name: `Mixed Load Test Bank ${i}`,
            branchName: `Branch ${i}`,
            accountNumber: `${3000000 + i}`,
            accountHolder: 'Test User',
            initialBalance: 1000000,
          }),
      );

      const allRequests = [...getRequests, ...postRequests];

      const startTime = performance.now();
      const responses = await Promise.all(allRequests);
      const duration = performance.now() - startTime;

      // すべてのリクエストが成功
      const successCount = responses.filter(
        (r) => r.status === 200 || r.status === 201,
      ).length;
      expect(successCount).toBe(getRequestCount + postRequestCount);

      const avgTime = duration / allRequests.length;
      console.log('\nMixed Load Test (50 GET + 25 POST):');
      console.log(`  Total duration: ${duration}ms`);
      console.log(`  Average response time: ${avgTime.toFixed(2)}ms`);
      console.log(`  Total requests: ${allRequests.length}`);
      console.log(
        `  Success rate: ${((successCount / allRequests.length) * 100).toFixed(2)}%`,
      );

      expect(duration).toBeLessThan(5000);
      expect(avgTime).toBeLessThan(1000);
    });
  });

  describe('Stress Test', () => {
    it('should handle peak load of 200 concurrent requests', async () => {
      const requestCount = 200;
      const requests = Array.from({ length: requestCount }, () =>
        request(app.getHttpServer()).get('/api/health'),
      );

      const startTime = performance.now();
      const responses = await Promise.all(requests);
      const duration = performance.now() - startTime;

      // 成功率を計算
      const successCount = responses.filter((r) => r.status === 200).length;
      const successRate = (successCount / requestCount) * 100;

      console.log('\nStress Test (200 concurrent requests):');
      console.log(`  Total duration: ${duration}ms`);
      console.log(`  Success rate: ${successRate.toFixed(2)}%`);
      console.log(`  Failed requests: ${requestCount - successCount}`);
      console.log(
        `  Throughput: ${(requestCount / (duration / 1000)).toFixed(2)} req/s`,
      );

      // 成功率95%以上を目標
      expect(successRate).toBeGreaterThanOrEqual(95);

      // 10秒以内に完了
      expect(duration).toBeLessThan(10000);
    });
  });

  describe('Sustained Load Test', () => {
    it('should maintain performance under sustained load (5 waves of 20 requests)', async () => {
      const waves = 5;
      const requestsPerWave = 20;
      const waveTimes: number[] = [];

      console.log('\nSustained Load Test:');

      for (let wave = 0; wave < waves; wave++) {
        const requests = Array.from({ length: requestsPerWave }, () =>
          request(app.getHttpServer()).get('/api/health'),
        );

        const startTime = performance.now();
        const responses = await Promise.all(requests);
        const duration = performance.now() - startTime;
        waveTimes.push(duration);

        const successCount = responses.filter((r) => r.status === 200).length;
        console.log(
          `  Wave ${wave + 1}: ${duration}ms - Success: ${successCount}/${requestsPerWave}`,
        );

        expect(successCount).toBe(requestsPerWave);
        expect(duration).toBeLessThan(2000);

        // 次のwaveまで少し待機
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const avgWaveTime = waveTimes.reduce((a, b) => a + b, 0) / waves;
      const maxWaveTime = Math.max(...waveTimes);
      const minWaveTime = Math.min(...waveTimes);

      console.log('\nSustained Load Test Summary:');
      console.log(`  Average wave time: ${avgWaveTime.toFixed(2)}ms`);
      console.log(`  Min wave time: ${minWaveTime}ms`);
      console.log(`  Max wave time: ${maxWaveTime}ms`);
      console.log(
        `  Performance degradation: ${(((maxWaveTime - minWaveTime) / minWaveTime) * 100).toFixed(2)}%`,
      );

      // パフォーマンスの劣化が50%以内であること
      expect((maxWaveTime - minWaveTime) / minWaveTime).toBeLessThan(0.5);
    });
  });
});
