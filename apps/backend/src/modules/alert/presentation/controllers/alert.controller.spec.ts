import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AlertController } from './alert.controller';
import { CreateAlertUseCase } from '../../application/use-cases/create-alert.use-case';
import { GetAlertsUseCase } from '../../application/use-cases/get-alerts.use-case';
import { ResolveAlertUseCase } from '../../application/use-cases/resolve-alert.use-case';
import { MarkAlertAsReadUseCase } from '../../application/use-cases/mark-alert-as-read.use-case';
import type { AlertRepository } from '../../domain/repositories/alert.repository.interface';
import { Alert } from '../../domain/entities/alert.entity';
import { AlertType } from '../../domain/enums/alert-type.enum';
import { AlertLevel } from '../../domain/enums/alert-level.enum';
import { AlertStatus } from '../../domain/enums/alert-status.enum';
import { AlertDetails } from '../../domain/value-objects/alert-details.vo';
import { AlertAction } from '../../domain/value-objects/alert-action.vo';
import { ActionType } from '../../domain/enums/action-type.enum';
import { ALERT_REPOSITORY } from '../../alert.tokens';
import {
  AlertNotFoundException,
  DuplicateAlertException,
  AlertAlreadyResolvedException,
  CriticalAlertDeletionException,
} from '../../domain/errors/alert.errors';

describe('AlertController', () => {
  let controller: AlertController;
  let createAlertUseCase: jest.Mocked<CreateAlertUseCase>;
  let getAlertsUseCase: jest.Mocked<GetAlertsUseCase>;
  let resolveAlertUseCase: jest.Mocked<ResolveAlertUseCase>;
  let markAlertAsReadUseCase: jest.Mocked<MarkAlertAsReadUseCase>;
  let alertRepository: jest.Mocked<AlertRepository>;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertController],
      providers: [
        {
          provide: CreateAlertUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetAlertsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: ResolveAlertUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: MarkAlertAsReadUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: ALERT_REPOSITORY,
          useValue: {
            save: jest.fn(),
            findById: jest.fn(),
            findByReconciliationId: jest.fn(),
            findByCardAndMonth: jest.fn(),
            findAll: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AlertController>(AlertController);
    createAlertUseCase = module.get(CreateAlertUseCase);
    getAlertsUseCase = module.get(GetAlertsUseCase);
    resolveAlertUseCase = module.get(ResolveAlertUseCase);
    markAlertAsReadUseCase = module.get(MarkAlertAsReadUseCase);
    alertRepository = module.get(ALERT_REPOSITORY);
  });

  describe('createAlert', () => {
    it('正常にアラートを生成できる', async () => {
      const alert = createMockAlert();
      createAlertUseCase.execute.mockResolvedValue(alert);

      const result = await controller.createAlert({
        reconciliationId: 'reconciliation-001',
      });

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('alert-001');
      expect(createAlertUseCase.execute).toHaveBeenCalledWith(
        'reconciliation-001',
      );
    });

    it('重複アラートエラーを適切に処理できる', async () => {
      createAlertUseCase.execute.mockRejectedValue(
        new DuplicateAlertException('reconciliation-001'),
      );

      await expect(
        controller.createAlert({
          reconciliationId: 'reconciliation-001',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('getAlerts', () => {
    it('正常にアラート一覧を取得できる', async () => {
      const alerts = [createMockAlert()];
      getAlertsUseCase.execute.mockResolvedValue(alerts);
      alertRepository.findAll.mockResolvedValue(alerts);

      const result = await controller.getAlerts();

      expect(result.success).toBe(true);
      expect(result.data.alerts).toHaveLength(1);
      expect(result.data.total).toBe(1);
      expect(result.data.unreadCount).toBe(1);
    });

    it('フィルター付きでアラート一覧を取得できる', async () => {
      const alerts = [createMockAlert()];
      getAlertsUseCase.execute.mockResolvedValue(alerts);
      alertRepository.findAll.mockResolvedValue(alerts);

      const result = await controller.getAlerts(
        'UNREAD',
        'WARNING',
        undefined,
        undefined,
        undefined,
      );

      expect(result.success).toBe(true);
      expect(getAlertsUseCase.execute).toHaveBeenCalledWith({
        status: 'UNREAD',
        level: 'WARNING',
      });
    });
  });

  describe('getAlert', () => {
    it('正常にアラート詳細を取得できる', async () => {
      const alert = createMockAlert();
      alertRepository.findById.mockResolvedValue(alert);

      const result = await controller.getAlert('alert-001');

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('alert-001');
    });

    it('アラートが見つからない場合エラー', async () => {
      alertRepository.findById.mockResolvedValue(null);

      await expect(controller.getAlert('alert-001')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('resolveAlert', () => {
    it('正常にアラートを解決できる', async () => {
      const alert = createMockAlert();
      const resolvedAlert = alert.markAsResolved('user-001', '解決メモ');
      resolveAlertUseCase.execute.mockResolvedValue(resolvedAlert);

      const result = await controller.resolveAlert('alert-001', {
        resolvedBy: 'user-001',
        resolutionNote: '解決メモ',
      });

      expect(result.success).toBe(true);
      expect(result.data.status).toBe(AlertStatus.RESOLVED);
      expect(resolveAlertUseCase.execute).toHaveBeenCalledWith(
        'alert-001',
        'user-001',
        '解決メモ',
      );
    });

    it('アラートが見つからない場合エラー', async () => {
      resolveAlertUseCase.execute.mockRejectedValue(
        new AlertNotFoundException('alert-001'),
      );

      await expect(
        controller.resolveAlert('alert-001', {
          resolvedBy: 'user-001',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('既に解決済みの場合エラー', async () => {
      resolveAlertUseCase.execute.mockRejectedValue(
        new AlertAlreadyResolvedException('alert-001'),
      );

      await expect(
        controller.resolveAlert('alert-001', {
          resolvedBy: 'user-001',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('markAlertAsRead', () => {
    it('正常にアラートを既読にできる', async () => {
      const alert = createMockAlert();
      alert.markAsRead();
      markAlertAsReadUseCase.execute.mockResolvedValue(alert);

      const result = await controller.markAlertAsRead('alert-001');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe(AlertStatus.READ);
      expect(markAlertAsReadUseCase.execute).toHaveBeenCalledWith('alert-001');
    });
  });

  describe('deleteAlert', () => {
    it('正常にアラートを削除できる', async () => {
      const alert = createMockAlert();
      alertRepository.findById.mockResolvedValue(alert);
      alertRepository.delete.mockResolvedValue(undefined);

      await controller.deleteAlert('alert-001');

      expect(alertRepository.findById).toHaveBeenCalledWith('alert-001');
      expect(alertRepository.delete).toHaveBeenCalledWith('alert-001');
    });

    it('CRITICALアラートは削除できない', async () => {
      const alert = createMockAlert();
      alert.level = AlertLevel.CRITICAL;
      alertRepository.findById.mockResolvedValue(alert);
      alertRepository.delete.mockRejectedValue(
        new CriticalAlertDeletionException('alert-001'),
      );

      await expect(controller.deleteAlert('alert-001')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });
});
