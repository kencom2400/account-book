import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import type { ConnectionStatusResult } from '../../domain/types/connection-status-result.type';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationService],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('定義されていること', () => {
    expect(service).toBeDefined();
  });

  describe('createConnectionErrorNotifications', () => {
    it('接続エラー通知を作成する', () => {
      const errors: ConnectionStatusResult[] = [
        {
          institutionId: 'bank-1',
          institutionName: 'テスト銀行',
          institutionType: 'bank',
          status: 'error',
          checkedAt: new Date().toISOString(),
          responseTime: 1000,
          errorMessage: '接続エラー',
          errorCode: 'CONNECTION_FAILED',
        },
        {
          institutionId: 'card-1',
          institutionName: 'テストカード',
          institutionType: 'credit-card',
          status: 'error',
          checkedAt: new Date().toISOString(),
          responseTime: 2000,
          errorMessage: 'タイムアウト',
          errorCode: 'TIMEOUT',
        },
      ];

      expect(() => {
        service.createConnectionErrorNotifications(errors);
      }).not.toThrow();
    });

    it('空のエラー配列でもエラーを発生させない', () => {
      expect(() => {
        service.createConnectionErrorNotifications([]);
      }).not.toThrow();
    });
  });
});
