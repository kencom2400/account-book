import { Test, TestingModule } from '@nestjs/testing';
import { ReconcileCreditCardUseCase } from './reconcile-credit-card.use-case';
import type { ReconciliationRepository } from '../../domain/repositories/reconciliation.repository.interface';
import type { AggregationRepository } from '../../../aggregation/domain/repositories/aggregation.repository.interface';
import type { ITransactionRepository } from '../../../transaction/domain/repositories/transaction.repository.interface';
import { ReconciliationService } from '../../domain/services/reconciliation.service';
import { RECONCILIATION_REPOSITORY } from '../../reconciliation.tokens';
import { AGGREGATION_REPOSITORY } from '../../../aggregation/aggregation.tokens';
import { TRANSACTION_REPOSITORY } from '../../../transaction/domain/repositories/transaction.repository.interface';
import { MonthlyCardSummary } from '../../../aggregation/domain/entities/monthly-card-summary.entity';
import { PaymentStatus } from '../../../aggregation/domain/enums/payment-status.enum';
import { CategoryAmount } from '../../../aggregation/domain/value-objects/category-amount.vo';
import { TransactionEntity } from '../../../transaction/domain/entities/transaction.entity';
import { TransactionStatus } from '@account-book/types';
import { CardSummaryNotFoundError } from '../../domain/errors/reconciliation.errors';
describe('ReconcileCreditCardUseCase', () => {
  let useCase: ReconcileCreditCardUseCase;
  let reconciliationRepository: jest.Mocked<ReconciliationRepository>;
  let aggregationRepository: jest.Mocked<AggregationRepository>;
  let transactionRepository: jest.Mocked<ITransactionRepository>;

  const mockCardSummary = new MonthlyCardSummary(
    'summary-001',
    'card-001',
    '楽天カード',
    '2025-01',
    new Date('2025-01-31'),
    new Date('2025-02-27'),
    50000,
    15,
    [new CategoryAmount('食費', 30000, 10)],
    ['tx-001', 'tx-002'],
    50000,
    PaymentStatus.PENDING,
    new Date('2025-01-01'),
    new Date('2025-01-01'),
  );

  const mockBankTransaction = new TransactionEntity(
    'bank-tx-001',
    new Date('2025-02-27'),
    50000,
    { id: 'cat-001', name: '食費', type: 'expense' },
    '楽天カード引落',
    'inst-001',
    'acc-001',
    TransactionStatus.COMPLETED,
    false,
    null,
    new Date(),
    new Date(),
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReconcileCreditCardUseCase,
        ReconciliationService,
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
        {
          provide: AGGREGATION_REPOSITORY,
          useValue: {
            save: jest.fn(),
            findById: jest.fn(),
            findByCardAndMonth: jest.fn(),
            findByCard: jest.fn(),
            findAll: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: TRANSACTION_REPOSITORY,
          useValue: {
            findById: jest.fn(),
            findAll: jest.fn(),
            findByInstitutionId: jest.fn(),
            findByAccountId: jest.fn(),
            findByDateRange: jest.fn(),
            findByMonth: jest.fn(),
            findByYear: jest.fn(),
            findUnreconciledTransfers: jest.fn(),
            save: jest.fn(),
            saveMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            deleteAll: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<ReconcileCreditCardUseCase>(
      ReconcileCreditCardUseCase,
    );
    reconciliationRepository = module.get(RECONCILIATION_REPOSITORY);
    aggregationRepository = module.get(AGGREGATION_REPOSITORY);
    transactionRepository = module.get(TRANSACTION_REPOSITORY);
  });

  describe('execute', () => {
    it('正常に照合を実行できる', async () => {
      aggregationRepository.findByCardAndMonth.mockResolvedValue(
        mockCardSummary,
      );
      transactionRepository.findByDateRange.mockResolvedValue([
        mockBankTransaction,
      ]);
      reconciliationRepository.findByCardAndMonth.mockResolvedValue(null);
      reconciliationRepository.save.mockImplementation(async (r) => r);

      const result = await useCase.execute('card-001', '2025-01');

      expect(result).toBeDefined();
      expect(result.cardId).toBe('card-001');
      expect(result.billingMonth).toBe('2025-01');
      expect(aggregationRepository.findByCardAndMonth).toHaveBeenCalledWith(
        'card-001',
        '2025-01',
      );
      expect(reconciliationRepository.findByCardAndMonth).toHaveBeenCalledWith(
        'card-001',
        '2025-01',
      );
      expect(reconciliationRepository.save).toHaveBeenCalled();
    });

    it('既存の照合結果がある場合、IDを保持して更新', async () => {
      aggregationRepository.findByCardAndMonth.mockResolvedValue(
        mockCardSummary,
      );
      transactionRepository.findByDateRange.mockResolvedValue([
        mockBankTransaction,
      ]);

      const existingReconciliation = {
        id: 'existing-reconciliation-id',
        cardId: 'card-001',
        billingMonth: '2025-01',
        status: 'MATCHED' as const,
        executedAt: new Date('2025-01-30'),
        results: [],
        summary: { total: 1, matched: 1, unmatched: 0, partial: 0 },
        createdAt: new Date('2025-01-30'),
        updatedAt: new Date('2025-01-30'),
      };
      reconciliationRepository.findByCardAndMonth.mockResolvedValue(
        existingReconciliation as any,
      );
      reconciliationRepository.save.mockImplementation(async (r) => r);

      const result = await useCase.execute('card-001', '2025-01');

      expect(result.id).toBe('existing-reconciliation-id');
      expect(result.createdAt).toEqual(existingReconciliation.createdAt);
      expect(reconciliationRepository.save).toHaveBeenCalled();
    });

    it('カード請求データが見つからない場合エラー', async () => {
      aggregationRepository.findByCardAndMonth.mockResolvedValue(null);

      await expect(useCase.execute('card-001', '2025-01')).rejects.toThrow(
        CardSummaryNotFoundError,
      );
    });
  });
});
