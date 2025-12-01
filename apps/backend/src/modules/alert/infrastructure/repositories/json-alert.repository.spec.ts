import { Test, TestingModule } from '@nestjs/testing';
import { promises as fs } from 'fs';
import * as path from 'path';
import { JsonAlertRepository } from './json-alert.repository';
import { Alert } from '../../domain/entities/alert.entity';
import { AlertType } from '../../domain/enums/alert-type.enum';
import { AlertLevel } from '../../domain/enums/alert-level.enum';
import { AlertStatus } from '../../domain/enums/alert-status.enum';
import { AlertDetails } from '../../domain/value-objects/alert-details.vo';
import { AlertAction } from '../../domain/value-objects/alert-action.vo';
import { ActionType } from '../../domain/enums/action-type.enum';
import { CriticalAlertDeletionException } from '../../domain/errors/alert.errors';

const DATA_DIR = path.join(process.cwd(), 'data', 'alerts');
const FILE_NAME = 'alerts.json';
const FILE_PATH = path.join(DATA_DIR, FILE_NAME);

describe('JsonAlertRepository', () => {
  let repository: JsonAlertRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JsonAlertRepository],
    }).compile();

    repository = module.get<JsonAlertRepository>(JsonAlertRepository);

    // テスト前にファイルを削除
    try {
      await fs.unlink(FILE_PATH);
    } catch {
      // ファイルが存在しない場合は無視
    }
  });

  afterEach(async () => {
    // テスト後にファイルを削除
    try {
      await fs.unlink(FILE_PATH);
    } catch {
      // ファイルが存在しない場合は無視
    }
  });

  const createMockAlert = (): Alert => {
    const details = new AlertDetails(
      'card-001',
      '三井住友カード',
      '2025-01',
      50000,
      null,
      -2000,
      null,
      null,
      ['bank-tx-001'],
      'reconciliation-001',
    );
    const actions = [
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

    return new Alert(
      'alert-001',
      AlertType.AMOUNT_MISMATCH,
      AlertLevel.WARNING,
      'クレジットカード引落額が一致しません',
      '金額不一致が検出されました',
      details,
      AlertStatus.UNREAD,
      new Date('2025-01-30'),
      null,
      null,
      null,
      actions,
    );
  };

  describe('save', () => {
    it('新規データを保存できる', async () => {
      const alert = createMockAlert();

      const saved = await repository.save(alert);

      expect(saved.id).toBe(alert.id);
      expect(saved.type).toBe(alert.type);
      expect(saved.level).toBe(alert.level);
    });

    it('既存データを更新できる', async () => {
      const alert = createMockAlert();
      await repository.save(alert);

      alert.markAsRead();
      const saved = await repository.save(alert);

      expect(saved.status).toBe(AlertStatus.READ);
    });
  });

  describe('findById', () => {
    it('IDでアラートを取得できる', async () => {
      const alert = createMockAlert();
      await repository.save(alert);

      const found = await repository.findById('alert-001');

      expect(found).toBeDefined();
      expect(found?.id).toBe('alert-001');
    });

    it('存在しないIDの場合はnullを返す', async () => {
      const found = await repository.findById('non-existent');

      expect(found).toBeNull();
    });
  });

  describe('findByReconciliationId', () => {
    it('照合IDでアラートを取得できる', async () => {
      const alert = createMockAlert();
      await repository.save(alert);

      const found =
        await repository.findByReconciliationId('reconciliation-001');

      expect(found).toBeDefined();
      expect(found?.details.reconciliationId).toBe('reconciliation-001');
    });

    it('存在しない照合IDの場合はnullを返す', async () => {
      const found = await repository.findByReconciliationId('non-existent');

      expect(found).toBeNull();
    });
  });

  describe('findByCardAndMonth', () => {
    it('カードIDと請求月でアラートを取得できる', async () => {
      const alert = createMockAlert();
      await repository.save(alert);

      const found = await repository.findByCardAndMonth('card-001', '2025-01');

      expect(found).toHaveLength(1);
      expect(found[0].details.cardId).toBe('card-001');
      expect(found[0].details.billingMonth).toBe('2025-01');
    });

    it('存在しないカードIDの場合は空配列を返す', async () => {
      const found = await repository.findByCardAndMonth(
        'non-existent',
        '2025-01',
      );

      expect(found).toHaveLength(0);
    });
  });

  describe('findAll', () => {
    it('すべてのアラートを取得できる', async () => {
      const alert1 = createMockAlert();
      const alert2 = createMockAlert();
      alert2.id = 'alert-002';
      await repository.save(alert1);
      await repository.save(alert2);

      const found = await repository.findAll({});

      expect(found).toHaveLength(2);
    });

    it('ステータスでフィルタリングできる', async () => {
      const alert1 = createMockAlert();
      const alert2 = createMockAlert();
      alert2.id = 'alert-002';
      await repository.save(alert1);
      alert2.markAsRead();
      await repository.save(alert2);

      const found = await repository.findAll({ status: AlertStatus.UNREAD });

      expect(found).toHaveLength(1);
      expect(found[0].status).toBe(AlertStatus.UNREAD);
    });

    it('レベルでフィルタリングできる', async () => {
      const alert = createMockAlert();
      await repository.save(alert);

      const found = await repository.findAll({
        level: AlertLevel.WARNING,
      });

      expect(found).toHaveLength(1);
      expect(found[0].level).toBe(AlertLevel.WARNING);
    });
  });

  describe('delete', () => {
    it('アラートを削除できる', async () => {
      const alert = createMockAlert();
      await repository.save(alert);

      await repository.delete('alert-001');

      const found = await repository.findById('alert-001');
      expect(found).toBeNull();
    });

    it('CRITICALアラートは削除できない', async () => {
      const alert = createMockAlert();
      alert.level = AlertLevel.CRITICAL;
      await repository.save(alert);

      await expect(repository.delete('alert-001')).rejects.toThrow(
        CriticalAlertDeletionException,
      );
    });

    it('存在しないアラートの削除はエラーにならない', async () => {
      await expect(repository.delete('non-existent')).resolves.not.toThrow();
    });
  });

  describe('findUnresolved', () => {
    it('未解決のアラートを取得できる', async () => {
      const alert1 = createMockAlert({ status: AlertStatus.UNREAD });
      const alert2 = createMockAlert({
        id: 'alert-002',
        status: AlertStatus.READ,
      });
      const alert3 = createMockAlert({
        id: 'alert-003',
        status: AlertStatus.RESOLVED,
        resolvedAt: new Date('2025-01-30'),
        resolvedBy: 'user-001',
      });
      await repository.save(alert1);
      await repository.save(alert2);
      await repository.save(alert3);

      // キャッシュをクリア
      (repository as unknown as { cache: Alert[] | null }).cache = null;

      const found = await repository.findUnresolved();

      expect(found).toHaveLength(2);
      expect(found.every((a) => a.status !== AlertStatus.RESOLVED)).toBe(true);
    });
  });

  describe('findUnread', () => {
    it('未読のアラートを取得できる', async () => {
      const alert1 = createMockAlert({ status: AlertStatus.UNREAD });
      const alert2 = createMockAlert({
        id: 'alert-002',
        status: AlertStatus.READ,
      });
      await repository.save(alert1);
      await repository.save(alert2);

      const found = await repository.findUnread();

      expect(found).toHaveLength(1);
      expect(found[0].status).toBe(AlertStatus.UNREAD);
    });
  });

  describe('findAll - ページネーション', () => {
    it('ページネーションが機能する', async () => {
      const alerts = Array.from({ length: 5 }, (_, i) => {
        const alert = createMockAlert();
        alert.id = `alert-${String(i + 1).padStart(3, '0')}`;
        return alert;
      });

      for (const alert of alerts) {
        await repository.save(alert);
      }

      const page1 = await repository.findAll({ page: 1, limit: 2 });
      const page2 = await repository.findAll({ page: 2, limit: 2 });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page1[0].id).not.toBe(page2[0].id);
    });
  });

  describe('findAll - 複合フィルター', () => {
    it('複数のフィルターを組み合わせられる', async () => {
      const alert1 = createMockAlert({
        status: AlertStatus.UNREAD,
        level: AlertLevel.WARNING,
      });
      const alert2 = createMockAlert({
        id: 'alert-002',
        status: AlertStatus.UNREAD,
        level: AlertLevel.ERROR,
      });
      await repository.save(alert1);
      await repository.save(alert2);

      const found = await repository.findAll({
        status: AlertStatus.UNREAD,
        level: AlertLevel.WARNING,
      });

      expect(found).toHaveLength(1);
      expect(found[0].level).toBe(AlertLevel.WARNING);
    });
  });
});
