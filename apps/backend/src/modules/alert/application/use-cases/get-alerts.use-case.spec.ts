import { Test, TestingModule } from '@nestjs/testing';
import { GetAlertsUseCase } from './get-alerts.use-case';
import type { AlertRepository } from '../../domain/repositories/alert.repository.interface';
import { ALERT_REPOSITORY } from '../../alert.tokens';
import { Alert } from '../../domain/entities/alert.entity';
import { AlertType } from '../../domain/enums/alert-type.enum';
import { AlertLevel } from '../../domain/enums/alert-level.enum';
import { AlertStatus } from '../../domain/enums/alert-status.enum';
import { AlertDetails } from '../../domain/value-objects/alert-details.vo';
import { AlertAction } from '../../domain/value-objects/alert-action.vo';
import { ActionType } from '../../domain/enums/action-type.enum';

describe('GetAlertsUseCase', () => {
  let useCase: GetAlertsUseCase;
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
      providers: [
        GetAlertsUseCase,
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

    useCase = module.get<GetAlertsUseCase>(GetAlertsUseCase);
    alertRepository = module.get(ALERT_REPOSITORY);
  });

  describe('execute', () => {
    it('正常にアラート一覧を取得できる', async () => {
      const alerts = [createMockAlert()];
      alertRepository.findAll.mockResolvedValue(alerts);

      const result = await useCase.execute({});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('alert-001');
      expect(alertRepository.findAll).toHaveBeenCalledWith({});
    });

    it('フィルター付きでアラート一覧を取得できる', async () => {
      const alerts = [createMockAlert()];
      alertRepository.findAll.mockResolvedValue({ data: alerts, total: 1 });

      const result = await useCase.execute({
        status: 'UNREAD',
        level: 'WARNING',
      });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(alertRepository.findAll).toHaveBeenCalledWith({
        status: 'UNREAD',
        level: 'WARNING',
      });
    });

    it('空の結果を返すことができる', async () => {
      alertRepository.findAll.mockResolvedValue({ data: [], total: 0 });

      const result = await useCase.execute({});

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
