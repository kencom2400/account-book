import { Alert } from './alert.entity';
import { AlertType } from '../enums/alert-type.enum';
import { AlertLevel } from '../enums/alert-level.enum';
import { AlertStatus } from '../enums/alert-status.enum';
import { AlertDetails } from '../value-objects/alert-details.vo';
import { AlertAction } from '../value-objects/alert-action.vo';
import { ActionType } from '../enums/action-type.enum';

describe('Alert Entity', () => {
  const createMockAlertDetails = (): AlertDetails => {
    return new AlertDetails(
      'card-001',
      '三井住友カード',
      '2025-01',
      50000,
      null,
      null,
      null,
      null,
      [],
      null,
    );
  };

  const createMockAlertActions = (): AlertAction[] => {
    return [
      new AlertAction(
        'action-001',
        '詳細を確認',
        ActionType.VIEW_DETAILS,
        false,
      ),
      new AlertAction(
        'action-002',
        '手動で照合',
        ActionType.MANUAL_MATCH,
        true,
      ),
    ];
  };

  const createMockAlert = (
    overrides?: Partial<{
      id: string;
      type: AlertType;
      level: AlertLevel;
      title: string;
      message: string;
      details: AlertDetails;
      status: AlertStatus;
      createdAt: Date;
      resolvedAt: Date | null;
      resolvedBy: string | null;
      resolutionNote: string | null;
      actions: AlertAction[];
    }>,
  ): Alert => {
    const defaults = {
      id: 'alert-001',
      type: AlertType.AMOUNT_MISMATCH,
      level: AlertLevel.WARNING,
      title: 'クレジットカード引落額が一致しません',
      message: '金額不一致が検出されました',
      details: createMockAlertDetails(),
      status: AlertStatus.UNREAD,
      createdAt: new Date('2025-01-30'),
      resolvedAt: null,
      resolvedBy: null,
      resolutionNote: null,
      actions: createMockAlertActions(),
      ...overrides,
    };

    return new Alert(
      defaults.id,
      defaults.type,
      defaults.level,
      defaults.title,
      defaults.message,
      defaults.details,
      defaults.status,
      defaults.createdAt,
      defaults.resolvedAt,
      defaults.resolvedBy,
      defaults.resolutionNote,
      defaults.actions,
    );
  };

  describe('constructor', () => {
    it('正常に作成できる', () => {
      const alert = createMockAlert();

      expect(alert.id).toBe('alert-001');
      expect(alert.type).toBe(AlertType.AMOUNT_MISMATCH);
      expect(alert.level).toBe(AlertLevel.WARNING);
      expect(alert.status).toBe(AlertStatus.UNREAD);
    });

    it('必須フィールドが欠けている場合エラー', () => {
      expect(() => {
        new Alert(
          '',
          AlertType.AMOUNT_MISMATCH,
          AlertLevel.WARNING,
          'タイトル',
          'メッセージ',
          createMockAlertDetails(),
          AlertStatus.UNREAD,
          new Date(),
          null,
          null,
          null,
          createMockAlertActions(),
        );
      }).toThrow('ID is required');

      expect(() => {
        new Alert(
          'alert-001',
          undefined as unknown as AlertType,
          AlertLevel.WARNING,
          'タイトル',
          'メッセージ',
          createMockAlertDetails(),
          AlertStatus.UNREAD,
          new Date(),
          null,
          null,
          null,
          createMockAlertActions(),
        );
      }).toThrow('Type is required');

      expect(() => {
        new Alert(
          'alert-001',
          AlertType.AMOUNT_MISMATCH,
          undefined as unknown as AlertLevel,
          'タイトル',
          'メッセージ',
          createMockAlertDetails(),
          AlertStatus.UNREAD,
          new Date(),
          null,
          null,
          null,
          createMockAlertActions(),
        );
      }).toThrow('Level is required');

      expect(() => {
        new Alert(
          'alert-001',
          AlertType.AMOUNT_MISMATCH,
          AlertLevel.WARNING,
          '',
          'メッセージ',
          createMockAlertDetails(),
          AlertStatus.UNREAD,
          new Date(),
          null,
          null,
          null,
          createMockAlertActions(),
        );
      }).toThrow('Title is required');

      expect(() => {
        new Alert(
          'alert-001',
          AlertType.AMOUNT_MISMATCH,
          AlertLevel.WARNING,
          'タイトル',
          '',
          createMockAlertDetails(),
          AlertStatus.UNREAD,
          new Date(),
          null,
          null,
          null,
          createMockAlertActions(),
        );
      }).toThrow('Message is required');

      expect(() => {
        new Alert(
          'alert-001',
          AlertType.AMOUNT_MISMATCH,
          AlertLevel.WARNING,
          'タイトル',
          'メッセージ',
          undefined as unknown as AlertDetails,
          AlertStatus.UNREAD,
          new Date(),
          null,
          null,
          null,
          createMockAlertActions(),
        );
      }).toThrow('Details is required');

      expect(() => {
        new Alert(
          'alert-001',
          AlertType.AMOUNT_MISMATCH,
          AlertLevel.WARNING,
          'タイトル',
          'メッセージ',
          createMockAlertDetails(),
          AlertStatus.UNREAD,
          undefined as unknown as Date,
          null,
          null,
          null,
          createMockAlertActions(),
        );
      }).toThrow('Created at is required');

      expect(() => {
        new Alert(
          'alert-001',
          AlertType.AMOUNT_MISMATCH,
          AlertLevel.WARNING,
          'タイトル',
          'メッセージ',
          createMockAlertDetails(),
          AlertStatus.UNREAD,
          new Date(),
          null,
          null,
          null,
          undefined as unknown as AlertAction[],
        );
      }).toThrow('Actions must be an array');
    });

    it('解決済みアラートで解決情報が欠けている場合エラー', () => {
      expect(() => {
        new Alert(
          'alert-001',
          AlertType.AMOUNT_MISMATCH,
          AlertLevel.WARNING,
          'タイトル',
          'メッセージ',
          createMockAlertDetails(),
          AlertStatus.RESOLVED,
          new Date(),
          null, // resolvedAtがnull
          'user-001',
          'メモ',
          createMockAlertActions(),
        );
      }).toThrow('Resolved at is required when status is RESOLVED');

      expect(() => {
        new Alert(
          'alert-001',
          AlertType.AMOUNT_MISMATCH,
          AlertLevel.WARNING,
          'タイトル',
          'メッセージ',
          createMockAlertDetails(),
          AlertStatus.RESOLVED,
          new Date(),
          new Date(),
          null, // resolvedByがnull
          'メモ',
          createMockAlertActions(),
        );
      }).toThrow('Resolved by is required when status is RESOLVED');
    });
  });

  describe('markAsRead', () => {
    it('未読アラートを既読にできる', () => {
      const alert = createMockAlert({ status: AlertStatus.UNREAD });

      const updated = alert.markAsRead();

      expect(updated.status).toBe(AlertStatus.READ);
      // 元のオブジェクトは変更されていない（不変性）
      expect(alert.status).toBe(AlertStatus.UNREAD);
    });

    it('既読アラートを既読にできる', () => {
      const alert = createMockAlert({ status: AlertStatus.READ });

      const updated = alert.markAsRead();

      expect(updated.status).toBe(AlertStatus.READ);
      // 元のオブジェクトは変更されていない（不変性）
      expect(alert.status).toBe(AlertStatus.READ);
    });

    it('解決済みアラートを既読にしようとするとエラー', () => {
      const alert = createMockAlert({
        status: AlertStatus.RESOLVED,
        resolvedAt: new Date('2025-01-30'),
        resolvedBy: 'user-001',
      });

      expect(() => {
        alert.markAsRead();
      }).toThrow('Cannot mark resolved alert as read');
    });
  });

  describe('markAsResolved', () => {
    it('未読アラートを解決済みにできる', () => {
      const alert = createMockAlert({ status: AlertStatus.UNREAD });

      const updated = alert.markAsResolved('user-001', '解決メモ');

      expect(updated.status).toBe(AlertStatus.RESOLVED);
      expect(updated.resolvedBy).toBe('user-001');
      expect(updated.resolutionNote).toBe('解決メモ');
      expect(updated.resolvedAt).not.toBeNull();
    });

    it('既読アラートを解決済みにできる', () => {
      const alert = createMockAlert({ status: AlertStatus.READ });

      const updated = alert.markAsResolved('user-001');

      expect(updated.status).toBe(AlertStatus.RESOLVED);
      expect(updated.resolvedBy).toBe('user-001');
      expect(updated.resolutionNote).toBeNull();
    });

    it('既に解決済みのアラートはエラー', () => {
      const alert = createMockAlert({
        status: AlertStatus.RESOLVED,
        resolvedBy: 'user-001',
        resolvedAt: new Date('2025-01-30'),
      });

      expect(() => {
        alert.markAsResolved('user-002', '新しいメモ');
      }).toThrow('Alert is already resolved');
    });
  });

  describe('toPlain', () => {
    it('プレーンオブジェクトに変換できる', () => {
      const alert = createMockAlert();

      const plain = alert.toPlain();

      expect(plain.id).toBe(alert.id);
      expect(plain.type).toBe(alert.type);
      expect(plain.level).toBe(alert.level);
      expect(plain.status).toBe(alert.status);
      expect(plain.details).toBeDefined();
      expect(plain.actions).toHaveLength(2);
    });
  });

  describe('addAction', () => {
    it('アクションを追加できる', () => {
      const alert = createMockAlert();
      const newAction = new AlertAction(
        'action-003',
        '新しいアクション',
        ActionType.VIEW_DETAILS,
        false,
      );

      const updated = alert.addAction(newAction);

      expect(updated.actions).toHaveLength(3);
      expect(updated.actions[2].id).toBe('action-003');
      // 元のオブジェクトは変更されていない（不変性）
      expect(alert.actions).toHaveLength(2);
    });
  });

  describe('fromPlain', () => {
    it('プレーンオブジェクトから復元できる', () => {
      const alert = createMockAlert();
      const plain = alert.toPlain();

      const restored = Alert.fromPlain(plain);

      expect(restored.id).toBe(alert.id);
      expect(restored.type).toBe(alert.type);
      expect(restored.level).toBe(alert.level);
      expect(restored.status).toBe(alert.status);
      expect(restored.details.cardId).toBe(alert.details.cardId);
      expect(restored.actions).toHaveLength(alert.actions.length);
    });

    it('解決済みアラートを復元できる', () => {
      const alert = createMockAlert({
        status: AlertStatus.RESOLVED,
        resolvedAt: new Date('2025-01-30'),
        resolvedBy: 'user-001',
        resolutionNote: '解決メモ',
      });
      const plain = alert.toPlain();

      const restored = Alert.fromPlain(plain);

      expect(restored.status).toBe(AlertStatus.RESOLVED);
      expect(restored.resolvedAt).not.toBeNull();
      expect(restored.resolvedBy).toBe('user-001');
      expect(restored.resolutionNote).toBe('解決メモ');
    });
  });
});
