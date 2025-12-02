import { Test, TestingModule } from '@nestjs/testing';
import { CreateAlertUseCase } from './create-alert.use-case';
import type { AlertRepository } from '../../domain/repositories/alert.repository.interface';
import type { ReconciliationRepository } from '../../../reconciliation/domain/repositories/reconciliation.repository.interface';
import { AlertService } from '../../domain/services/alert.service';
import { ALERT_REPOSITORY, ALERT_SERVICE } from '../../alert.tokens';
import { RECONCILIATION_REPOSITORY } from '../../../reconciliation/reconciliation.tokens';
import { Alert } from '../../domain/entities/alert.entity';
import { AlertType } from '../../domain/enums/alert-type.enum';
import { AlertLevel } from '../../domain/enums/alert-level.enum';
import { AlertStatus } from '../../domain/enums/alert-status.enum';
import { AlertDetails } from '../../domain/value-objects/alert-details.vo';
import { AlertAction } from '../../domain/value-objects/alert-action.vo';
import { ActionType } from '../../domain/enums/action-type.enum';
import { Reconciliation } from '../../../reconciliation/domain/entities/reconciliation.entity';
import { ReconciliationStatus } from '../../../reconciliation/domain/enums/reconciliation-status.enum';
import { ReconciliationResult } from '../../../reconciliation/domain/value-objects/reconciliation-result.vo';
import { ReconciliationSummary } from '../../../reconciliation/domain/value-objects/reconciliation-summary.vo';
import { Discrepancy } from '../../../reconciliation/domain/value-objects/discrepancy.vo';
import { DuplicateAlertException } from '../../domain/errors/alert.errors';
import type { AggregationRepository } from '../../../aggregation/domain/repositories/aggregation.repository.interface';
import { AGGREGATION_REPOSITORY } from '../../../aggregation/aggregation.tokens';

describe('CreateAlertUseCase', () => {
  let useCase: CreateAlertUseCase;
  let alertRepository: jest.Mocked<AlertRepository>;
  let reconciliationRepository: jest.Mocked<ReconciliationRepository>;

  const createMockReconciliation = (): Reconciliation => {
    const result = new ReconciliationResult(
      false,
      100,
      'bank-tx-001',
      'card-summary-001',
      new Date('2025-02-27'),
      new Discrepancy(-2000, 0, false, '金額不一致'),
    );
    const summary = new ReconciliationSummary(1, 0, 1, 0);

    return new Reconciliation(
      'reconciliation-001',
      'card-001',
      '2025-01',
      ReconciliationStatus.UNMATCHED,
      new Date('2025-01-30'),
      [result],
      summary,
      new Date('2025-01-30'),
      new Date('2025-01-30'),
    );
  };

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

  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        CreateAlertUseCase,
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
        {
          provide: RECONCILIATION_REPOSITORY,
          useValue: {
            findById: jest.fn(),
            save: jest.fn(),
            findByCardAndMonth: jest.fn(),
            findByCard: jest.fn(),
            findAll: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: AGGREGATION_REPOSITORY,
          useValue: {
            save: jest.fn(),
            findById: jest.fn(),
            findByIds: jest.fn(),
            findByCardAndMonth: jest.fn(),
            findByCard: jest.fn(),
            findAll: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: ALERT_SERVICE,
          useFactory: (aggRepo: AggregationRepository) => {
            return new AlertService(aggRepo);
          },
          inject: [AGGREGATION_REPOSITORY],
        },
      ],
    }).compile();

    useCase = module.get<CreateAlertUseCase>(CreateAlertUseCase);
    alertRepository = module.get(ALERT_REPOSITORY);
    reconciliationRepository = module.get(RECONCILIATION_REPOSITORY);
  });

  describe('execute', () => {
    it('正常にアラートを生成できる', async () => {
      const reconciliation = createMockReconciliation();
      const alert = createMockAlert();

      reconciliationRepository.findById.mockResolvedValue(reconciliation);
      alertRepository.findByReconciliationId.mockResolvedValue(null);
      const alertServiceInstance = module.get(ALERT_SERVICE);
      jest
        .spyOn(alertServiceInstance, 'createAlertFromReconciliation')
        .mockResolvedValue(alert);
      alertRepository.save.mockResolvedValue(alert);

      const result = await useCase.execute('reconciliation-001');

      expect(result).toBeDefined();
      expect(result.type).toBe(AlertType.AMOUNT_MISMATCH);
      expect(result.details.reconciliationId).toBe('reconciliation-001');
      expect(alertRepository.save).toHaveBeenCalledTimes(1);
    });

    it('照合結果が見つからない場合エラー', async () => {
      reconciliationRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('reconciliation-001')).rejects.toThrow(
        'Reconciliation not found',
      );
    });

    it('既にアラートが存在する場合エラー', async () => {
      const reconciliation = createMockReconciliation();
      const existingAlert = createMockAlert();

      reconciliationRepository.findById.mockResolvedValue(reconciliation);
      alertRepository.findByReconciliationId.mockResolvedValue(existingAlert);

      await expect(useCase.execute('reconciliation-001')).rejects.toThrow(
        DuplicateAlertException,
      );
    });

    it('アラート保存時にエラーが発生した場合エラー', async () => {
      const reconciliation = createMockReconciliation();

      reconciliationRepository.findById.mockResolvedValue(reconciliation);
      alertRepository.findByReconciliationId.mockResolvedValue(null);
      alertRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute('reconciliation-001')).rejects.toThrow(
        'Database error',
      );
    });
  });
});
