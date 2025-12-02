import { Test, TestingModule } from '@nestjs/testing';
import { MarkAlertAsReadUseCase } from './mark-alert-as-read.use-case';
import type { AlertRepository } from '../../domain/repositories/alert.repository.interface';
import { ALERT_REPOSITORY } from '../../alert.tokens';
import { Alert } from '../../domain/entities/alert.entity';
import { AlertType } from '../../domain/enums/alert-type.enum';
import { AlertLevel } from '../../domain/enums/alert-level.enum';
import { AlertStatus } from '../../domain/enums/alert-status.enum';
import { AlertDetails } from '../../domain/value-objects/alert-details.vo';
import { AlertAction } from '../../domain/value-objects/alert-action.vo';
import { ActionType } from '../../domain/enums/action-type.enum';
import { AlertNotFoundException } from '../../domain/errors/alert.errors';

describe('MarkAlertAsReadUseCase', () => {
  let useCase: MarkAlertAsReadUseCase;
  let alertRepository: jest.Mocked<AlertRepository>;

  const createMockAlert = (status: AlertStatus = AlertStatus.UNREAD): Alert => {
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
      status,
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
        MarkAlertAsReadUseCase,
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

    useCase = module.get<MarkAlertAsReadUseCase>(MarkAlertAsReadUseCase);
    alertRepository = module.get(ALERT_REPOSITORY);
  });

  describe('execute', () => {
    it('正常にアラートを既読にできる', async () => {
      const alert = createMockAlert(AlertStatus.UNREAD);
      const readAlert = createMockAlert(AlertStatus.READ);

      alertRepository.findById.mockResolvedValue(alert);
      alertRepository.save.mockResolvedValue(readAlert);

      const result = await useCase.execute('alert-001');

      expect(result.status).toBe(AlertStatus.READ);
      expect(alertRepository.save).toHaveBeenCalledTimes(1);
    });

    it('アラートが見つからない場合エラー', async () => {
      alertRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('alert-001')).rejects.toThrow(
        AlertNotFoundException,
      );
    });
  });
});
