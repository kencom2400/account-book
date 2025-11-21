import { Test, TestingModule } from '@nestjs/testing';
import { ConnectionFailedHandler } from './connection-failed.handler';
import { NotificationService } from '../services/notification.service';
import { ConnectionFailedEvent } from '../../domain/events/connection-failed.event';
import type { ConnectionStatusResult } from '../../domain/types/connection-status-result.type';

describe('ConnectionFailedHandler', () => {
  let handler: ConnectionFailedHandler;
  let notificationService: NotificationService;

  const mockNotificationService = {
    createConnectionErrorNotifications: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConnectionFailedHandler,
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    handler = module.get<ConnectionFailedHandler>(ConnectionFailedHandler);
    notificationService = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnectionFailed', () => {
    it('接続失敗イベントを受信したら通知サービスを呼び出す', async () => {
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
      ];

      const event = new ConnectionFailedEvent(errors, new Date());

      handler.handleConnectionFailed(event);

      expect(
        notificationService.createConnectionErrorNotifications,
      ).toHaveBeenCalledWith(errors);
      expect(
        notificationService.createConnectionErrorNotifications,
      ).toHaveBeenCalledTimes(1);
    });

    it('通知サービスでエラーが発生しても処理を継続する', () => {
      const errors: ConnectionStatusResult[] = [
        {
          institutionId: 'bank-1',
          institutionName: 'テスト銀行',
          institutionType: 'bank',
          status: 'error',
          checkedAt: new Date().toISOString(),
          responseTime: 1000,
          errorMessage: '接続エラー',
        },
      ];

      const event = new ConnectionFailedEvent(errors, new Date());

      mockNotificationService.createConnectionErrorNotifications.mockImplementation(
        () => {
          throw new Error('通知作成エラー');
        },
      );

      expect(() => {
        handler.handleConnectionFailed(event);
      }).not.toThrow();
    });
  });
});
