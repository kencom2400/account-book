import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { NotificationCleanupService } from './notification-cleanup.service';
import type { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import {
  NotificationEntity,
  NotificationStatus,
} from '../../domain/entities/notification.entity';
import { NOTIFICATION_REPOSITORY } from '../../health.tokens';

describe('NotificationCleanupService', () => {
  let service: NotificationCleanupService;
  let mockRepository: jest.Mocked<INotificationRepository>;
  let mockLogger: Partial<Logger>;

  beforeEach(async () => {
    // 意図的なエラーテストのLogger出力を抑制
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    // Loggerのモック作成
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    // モックリポジトリの作成
    mockRepository = {
      findAll: jest.fn(),
      deleteMany: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationCleanupService,
        {
          provide: NOTIFICATION_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    })
      .setLogger(mockLogger as Logger)
      .compile();

    service = module.get<NotificationCleanupService>(
      NotificationCleanupService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('executeNotificationCleanup', () => {
    it('should delete notifications that are older than their retention period', async () => {
      // Arrange
      const now: Date = new Date();

      const notifications: NotificationEntity[] = [
        // 削除対象: CONFIRMED, updatedAtから30日経過
        new NotificationEntity(
          'notif-001',
          'inst-001',
          'テスト銀行',
          '接続失敗',
          NotificationStatus.CONFIRMED,
          new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000), // 100日前作成
          new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30日前更新
        ),
        // 削除対象: DISMISSED, updatedAtから7日経過
        new NotificationEntity(
          'notif-002',
          'inst-002',
          'テストカード',
          '接続失敗',
          NotificationStatus.DISMISSED,
          new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000), // 100日前作成
          new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7日前更新
        ),
        // 削除対象外: PENDING
        new NotificationEntity(
          'notif-003',
          'inst-003',
          'テスト証券',
          '接続失敗',
          NotificationStatus.PENDING,
          new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000), // 100日前作成
          now, // 今更新
        ),
        // 削除対象外: CONFIRMED, まだ29日
        new NotificationEntity(
          'notif-004',
          'inst-004',
          'テスト銀行2',
          '接続失敗',
          NotificationStatus.CONFIRMED,
          new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000), // 100日前作成
          new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000), // 29日前更新
        ),
      ];

      mockRepository.findAll.mockResolvedValue(notifications);
      mockRepository.deleteMany.mockResolvedValue();

      // Act
      await service.executeNotificationCleanup();

      // Assert
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
      expect(mockRepository.deleteMany).toHaveBeenCalledTimes(1);
      expect(mockRepository.deleteMany).toHaveBeenCalledWith([
        'notif-001',
        'notif-002',
      ]);
    });

    it('should not call deleteMany when there are no notifications to delete', async () => {
      // Arrange
      const now: Date = new Date();
      const notifications: NotificationEntity[] = [
        new NotificationEntity(
          'notif-001',
          'inst-001',
          'テスト銀行',
          '接続失敗',
          NotificationStatus.PENDING,
          now,
          now,
        ),
      ];

      mockRepository.findAll.mockResolvedValue(notifications);

      // Act
      await service.executeNotificationCleanup();

      // Assert
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
      expect(mockRepository.deleteMany).not.toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      mockRepository.findAll.mockRejectedValue(new Error('Repository error'));

      // Act & Assert
      await expect(service.executeNotificationCleanup()).resolves.not.toThrow();
      expect(mockRepository.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('manualCleanup', () => {
    it('should return deleted count and total count', async () => {
      // Arrange
      const now: Date = new Date();
      const notifications: NotificationEntity[] = [
        new NotificationEntity(
          'notif-001',
          'inst-001',
          'テスト銀行',
          '接続失敗',
          NotificationStatus.CONFIRMED,
          new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000), // 100日前作成
          new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30日前更新
        ),
        new NotificationEntity(
          'notif-002',
          'inst-002',
          'テストカード',
          '接続失敗',
          NotificationStatus.PENDING,
          now, // 今作成
          now, // 今更新
        ),
      ];

      mockRepository.findAll.mockResolvedValue(notifications);
      mockRepository.deleteMany.mockResolvedValue();

      // Act
      const result: { deletedCount: number; totalCount: number } =
        await service.manualCleanup();

      // Assert
      expect(result.deletedCount).toBe(1);
      expect(result.totalCount).toBe(2);
      expect(mockRepository.deleteMany).toHaveBeenCalledWith(['notif-001']);
    });

    it('should return zero deleted count when there are no notifications to delete', async () => {
      // Arrange
      const now: Date = new Date();
      const notifications: NotificationEntity[] = [
        new NotificationEntity(
          'notif-001',
          'inst-001',
          'テスト銀行',
          '接続失敗',
          NotificationStatus.PENDING,
          now,
          now,
        ),
      ];

      mockRepository.findAll.mockResolvedValue(notifications);

      // Act
      const result: { deletedCount: number; totalCount: number } =
        await service.manualCleanup();

      // Assert
      expect(result.deletedCount).toBe(0);
      expect(result.totalCount).toBe(1);
      expect(mockRepository.deleteMany).not.toHaveBeenCalled();
    });
  });
});
