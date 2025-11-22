import { NotificationEntity, NotificationStatus } from './notification.entity';

describe('NotificationEntity', () => {
  describe('create', () => {
    it('should create a new notification with PENDING status', () => {
      // Arrange
      const id: string = 'notif-001';
      const institutionId: string = 'inst-001';
      const institutionName: string = 'テスト銀行';
      const message: string = '接続に失敗しました';

      // Act
      const notification: NotificationEntity = NotificationEntity.create(
        id,
        institutionId,
        institutionName,
        message,
      );

      // Assert
      expect(notification.id).toBe(id);
      expect(notification.institutionId).toBe(institutionId);
      expect(notification.institutionName).toBe(institutionName);
      expect(notification.message).toBe(message);
      expect(notification.status).toBe(NotificationStatus.PENDING);
      expect(notification.createdAt).toBeInstanceOf(Date);
      expect(notification.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('updateStatus', () => {
    it('should update notification status and updatedAt', () => {
      jest.useFakeTimers();

      // Arrange
      const notification: NotificationEntity = NotificationEntity.create(
        'notif-001',
        'inst-001',
        'テスト銀行',
        '接続に失敗しました',
      );
      const originalUpdatedAt: Date = notification.updatedAt;

      // Act
      jest.advanceTimersByTime(10); // 10ms進める
      const updatedNotification: NotificationEntity = notification.updateStatus(
        NotificationStatus.CONFIRMED,
      );

      // Assert
      expect(updatedNotification.status).toBe(NotificationStatus.CONFIRMED);
      expect(updatedNotification.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
      expect(updatedNotification.createdAt).toEqual(notification.createdAt);

      jest.useRealTimers();
    });
  });

  describe('canBeDeleted', () => {
    it('should return false for PENDING status', () => {
      // Arrange
      const notification: NotificationEntity = NotificationEntity.create(
        'notif-001',
        'inst-001',
        'テスト銀行',
        '接続に失敗しました',
      );
      const referenceDate: Date = new Date();

      // Act
      const result: boolean = notification.canBeDeleted(referenceDate);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for DISPLAYED status', () => {
      // Arrange
      const notification: NotificationEntity = NotificationEntity.create(
        'notif-001',
        'inst-001',
        'テスト銀行',
        '接続に失敗しました',
      ).updateStatus(NotificationStatus.DISPLAYED);
      const referenceDate: Date = new Date();

      // Act
      const result: boolean = notification.canBeDeleted(referenceDate);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for LATER status', () => {
      // Arrange
      const notification: NotificationEntity = NotificationEntity.create(
        'notif-001',
        'inst-001',
        'テスト銀行',
        '接続に失敗しました',
      ).updateStatus(NotificationStatus.LATER);
      const referenceDate: Date = new Date();

      // Act
      const result: boolean = notification.canBeDeleted(referenceDate);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for CONFIRMED status before 30 days', () => {
      // Arrange
      const now: Date = new Date();
      const notification: NotificationEntity = new NotificationEntity(
        'notif-001',
        'inst-001',
        'テスト銀行',
        '接続に失敗しました',
        NotificationStatus.CONFIRMED,
        new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000), // 100日前作成
        new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000), // 29日前更新
      );

      // Act
      const result: boolean = notification.canBeDeleted(now);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for CONFIRMED status after 30 days', () => {
      // Arrange
      const now: Date = new Date();
      const notification: NotificationEntity = new NotificationEntity(
        'notif-001',
        'inst-001',
        'テスト銀行',
        '接続に失敗しました',
        NotificationStatus.CONFIRMED,
        new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000), // 100日前作成
        new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30日前更新
      );

      // Act
      const result: boolean = notification.canBeDeleted(now);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for ARCHIVED status before 30 days', () => {
      // Arrange
      const now: Date = new Date();
      const notification: NotificationEntity = new NotificationEntity(
        'notif-001',
        'inst-001',
        'テスト銀行',
        '接続に失敗しました',
        NotificationStatus.ARCHIVED,
        new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000), // 100日前作成
        new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000), // 29日前更新
      );

      // Act
      const result: boolean = notification.canBeDeleted(now);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for ARCHIVED status after 30 days', () => {
      // Arrange
      const now: Date = new Date();
      const notification: NotificationEntity = new NotificationEntity(
        'notif-001',
        'inst-001',
        'テスト銀行',
        '接続に失敗しました',
        NotificationStatus.ARCHIVED,
        new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000), // 100日前作成
        new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30日前更新
      );

      // Act
      const result: boolean = notification.canBeDeleted(now);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for DISMISSED status before 7 days', () => {
      // Arrange
      const now: Date = new Date();
      const notification: NotificationEntity = new NotificationEntity(
        'notif-001',
        'inst-001',
        'テスト銀行',
        '接続に失敗しました',
        NotificationStatus.DISMISSED,
        new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000), // 100日前作成
        new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), // 6日前更新
      );

      // Act
      const result: boolean = notification.canBeDeleted(now);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for DISMISSED status after 7 days', () => {
      // Arrange
      const now: Date = new Date();
      const notification: NotificationEntity = new NotificationEntity(
        'notif-001',
        'inst-001',
        'テスト銀行',
        '接続に失敗しました',
        NotificationStatus.DISMISSED,
        new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000), // 100日前作成
        new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7日前更新
      );

      // Act
      const result: boolean = notification.canBeDeleted(now);

      // Assert
      expect(result).toBe(true);
    });
  });
});
