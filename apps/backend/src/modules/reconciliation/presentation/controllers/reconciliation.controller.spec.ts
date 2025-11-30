import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ReconciliationController } from './reconciliation.controller';
import { ReconcileCreditCardUseCase } from '../../application/use-cases/reconcile-credit-card.use-case';
import type { ReconciliationRepository } from '../../domain/repositories/reconciliation.repository.interface';
import { Reconciliation } from '../../domain/entities/reconciliation.entity';
import { ReconciliationStatus } from '../../domain/enums/reconciliation-status.enum';
import { ReconciliationResult } from '../../domain/value-objects/reconciliation-result.vo';
import { ReconciliationSummary } from '../../domain/value-objects/reconciliation-summary.vo';
import { RECONCILIATION_REPOSITORY } from '../../reconciliation.tokens';
import {
  CardSummaryNotFoundError,
  InvalidPaymentDateError,
} from '../../domain/errors/reconciliation.errors';

describe('ReconciliationController', () => {
  let controller: ReconciliationController;
  let reconcileCreditCardUseCase: jest.Mocked<ReconcileCreditCardUseCase>;
  let reconciliationRepository: jest.Mocked<ReconciliationRepository>;

  const createMockReconciliation = (): Reconciliation => {
    const result = new ReconciliationResult(
      true,
      100,
      'bank-tx-001',
      'card-summary-001',
      new Date('2025-01-30'),
      null,
    );
    const summary = new ReconciliationSummary(1, 1, 0, 0);

    return new Reconciliation(
      'reconciliation-001',
      'card-001',
      '2025-01',
      ReconciliationStatus.MATCHED,
      new Date('2025-01-30'),
      [result],
      summary,
      new Date('2025-01-30'),
      new Date('2025-01-30'),
    );
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReconciliationController],
      providers: [
        {
          provide: ReconcileCreditCardUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: RECONCILIATION_REPOSITORY,
          useValue: {
            save: jest.fn(),
            findById: jest.fn(),
            findByCardAndMonth: jest.fn(),
            findByCard: jest.fn(),
            findAll: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ReconciliationController>(ReconciliationController);
    reconcileCreditCardUseCase = module.get(ReconcileCreditCardUseCase);
    reconciliationRepository = module.get(RECONCILIATION_REPOSITORY);
  });

  describe('reconcileCreditCard', () => {
    it('正常に照合を実行できる', async () => {
      const mockReconciliation = createMockReconciliation();
      reconcileCreditCardUseCase.execute.mockResolvedValue(mockReconciliation);

      const result = await controller.reconcileCreditCard({
        cardId: 'card-001',
        billingMonth: '2025-01',
      });

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(mockReconciliation.id);
      expect(reconcileCreditCardUseCase.execute).toHaveBeenCalledWith(
        'card-001',
        '2025-01',
      );
    });

    it('カード請求データが見つからない場合は404エラー', async () => {
      reconcileCreditCardUseCase.execute.mockRejectedValue(
        new NotFoundException(
          new CardSummaryNotFoundError('card-001', '2025-01'),
        ),
      );

      await expect(
        controller.reconcileCreditCard({
          cardId: 'card-001',
          billingMonth: '2025-01',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('引落予定日が未来の場合は422エラー', async () => {
      reconcileCreditCardUseCase.execute.mockRejectedValue(
        new InvalidPaymentDateError(new Date('2025-12-31'), new Date()),
      );

      await expect(
        controller.reconcileCreditCard({
          cardId: 'card-001',
          billingMonth: '2025-01',
        }),
      ).rejects.toThrow();
    });
  });

  describe('listReconciliations', () => {
    it('すべての照合結果を取得できる', async () => {
      const mockReconciliation = createMockReconciliation();
      reconciliationRepository.findAll.mockResolvedValue([mockReconciliation]);

      const result = await controller.listReconciliations();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(mockReconciliation.id);
    });

    it('cardIdでフィルタリングできる', async () => {
      const mockReconciliation = createMockReconciliation();
      reconciliationRepository.findByCard.mockResolvedValue([
        mockReconciliation,
      ]);

      const result = await controller.listReconciliations('card-001');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('cardIdとbillingMonthでフィルタリングできる', async () => {
      const mockReconciliation = createMockReconciliation();
      reconciliationRepository.findByCardAndMonth.mockResolvedValue(
        mockReconciliation,
      );

      const result = await controller.listReconciliations(
        'card-001',
        '2025-01',
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getReconciliation', () => {
    it('IDで照合結果を取得できる', async () => {
      const mockReconciliation = createMockReconciliation();
      reconciliationRepository.findById.mockResolvedValue(mockReconciliation);

      const result = await controller.getReconciliation('reconciliation-001');

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(mockReconciliation.id);
    });

    it('存在しないIDの場合は404エラー', async () => {
      reconciliationRepository.findById.mockResolvedValue(null);

      await expect(
        controller.getReconciliation('non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
