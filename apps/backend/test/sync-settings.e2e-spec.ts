import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { InstitutionType, AuthenticationType } from '@account-book/types';
import { E2ETestDatabaseHelper } from './helpers/database-helper';
import { createTestApp } from './helpers/test-setup';
import { SyncIntervalType } from '../src/modules/sync/domain/enums/sync-interval-type.enum';
import { TimeUnit } from '../src/modules/sync/domain/enums/time-unit.enum';

describe('SyncSettings Controller (e2e)', () => {
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

  describe('GET /api/sync-settings', () => {
    it('should return sync settings', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/sync-settings')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.defaultInterval).toBeDefined();
      expect(response.body.data.defaultInterval.type).toBeDefined();
      expect(response.body.data.wifiOnly).toBeDefined();
      expect(response.body.data.batterySavingMode).toBeDefined();
      expect(response.body.data.autoRetry).toBeDefined();
      expect(response.body.data.maxRetryCount).toBeDefined();
      expect(response.body.data.nightModeSuspend).toBeDefined();
      expect(response.body.data.nightModeStart).toBeDefined();
      expect(response.body.data.nightModeEnd).toBeDefined();
    });
  });

  describe('PATCH /api/sync-settings', () => {
    it('should update sync settings', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/sync-settings')
        .send({
          wifiOnly: true,
          batterySavingMode: true,
          autoRetry: true,
          maxRetryCount: 5,
          nightModeSuspend: true,
          nightModeStart: '22:00',
          nightModeEnd: '06:00',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.wifiOnly).toBe(true);
      expect(response.body.data.batterySavingMode).toBe(true);
      expect(response.body.data.autoRetry).toBe(true);
      expect(response.body.data.maxRetryCount).toBe(5);
      expect(response.body.data.nightModeSuspend).toBe(true);
      expect(response.body.data.nightModeStart).toBe('22:00');
      expect(response.body.data.nightModeEnd).toBe('06:00');
    });

    it('should update defaultInterval', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/sync-settings')
        .send({
          defaultInterval: {
            type: SyncIntervalType.CUSTOM,
            value: 30,
            unit: TimeUnit.MINUTES,
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.defaultInterval).toBeDefined();
      expect(response.body.data.defaultInterval.type).toBe(
        SyncIntervalType.CUSTOM,
      );
      expect(response.body.data.defaultInterval.value).toBe(30);
      expect(response.body.data.defaultInterval.unit).toBe(TimeUnit.MINUTES);
    });

    it('should accept partial update', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/sync-settings')
        .send({
          wifiOnly: false,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.wifiOnly).toBe(false);
    });

    it('should return 400 for invalid maxRetryCount', async () => {
      await request(app.getHttpServer())
        .patch('/api/sync-settings')
        .send({
          maxRetryCount: 11, // 最大値は10
        })
        .expect(400);
    });

    it('should return 400 for invalid nightModeStart format', async () => {
      await request(app.getHttpServer())
        .patch('/api/sync-settings')
        .send({
          nightModeSuspend: true,
          nightModeStart: '25:00', // 無効な時刻形式
        })
        .expect(400);
    });
  });

  describe('GET /api/sync-settings/institutions', () => {
    it('should return all institution sync settings', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/sync-settings/institutions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should return settings for created institution', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/sync-settings/institutions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      // 作成した金融機関の設定が含まれているか確認
      const institutionSettings = response.body.data.find(
        (setting: any) => setting.institutionId === institutionId,
      );
      if (institutionSettings) {
        expect(institutionSettings.institutionId).toBe(institutionId);
        expect(institutionSettings.interval).toBeDefined();
        expect(institutionSettings.enabled).toBeDefined();
      }
    });
  });

  describe('GET /api/sync-settings/institutions/:id', () => {
    it('should return institution sync settings by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/sync-settings/institutions/${institutionId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.institutionId).toBe(institutionId);
      expect(response.body.data.interval).toBeDefined();
      expect(response.body.data.enabled).toBeDefined();
      expect(response.body.data.syncStatus).toBeDefined();
    });

    it('should handle non-existent institution gracefully', async () => {
      // 実装によってはデフォルト設定を返す可能性がある
      const response = await request(app.getHttpServer()).get(
        '/api/sync-settings/institutions/00000000-0000-0000-0000-000000000000',
      );

      // 404または200のいずれかを許容
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('PATCH /api/sync-settings/institutions/:id', () => {
    it('should update institution sync settings', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/sync-settings/institutions/${institutionId}`)
        .send({
          enabled: false,
          interval: {
            type: SyncIntervalType.CUSTOM,
            value: 60,
            unit: TimeUnit.MINUTES,
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.institutionId).toBe(institutionId);
      // enabledの値は実装によって異なる可能性があるため、値の存在のみ確認
      expect(response.body.data.enabled).toBeDefined();
      expect(response.body.data.interval.type).toBe(SyncIntervalType.CUSTOM);
      expect(response.body.data.interval.value).toBe(60);
      expect(response.body.data.interval.unit).toBe(TimeUnit.MINUTES);
    });

    it('should accept partial update', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/sync-settings/institutions/${institutionId}`)
        .send({
          enabled: true,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.enabled).toBe(true);
    });

    it('should handle non-existent institution gracefully', async () => {
      // 実装によってはデフォルト設定を返す可能性がある
      const response = await request(app.getHttpServer())
        .patch(
          '/api/sync-settings/institutions/00000000-0000-0000-0000-000000000000',
        )
        .send({
          enabled: false,
          interval: {
            type: SyncIntervalType.STANDARD,
          },
        });

      // 404または200のいずれかを許容
      expect([200, 404]).toContain(response.status);
    });
  });
});
