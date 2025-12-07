import { Test, TestingModule } from '@nestjs/testing';
import { GetEventFinancialSummaryUseCase } from './get-event-financial-summary.use-case';
import { EVENT_REPOSITORY } from '../../domain/repositories/event.repository.interface';
import type { IEventRepository } from '../../domain/repositories/event.repository.interface';
import { TRANSACTION_REPOSITORY } from '../../../transaction/domain/repositories/transaction.repository.interface';
import type { ITransactionRepository } from '../../../transaction/domain/repositories/transaction.repository.interface';
import { EventEntity } from '../../domain/entities/event.entity';
import { EventCategory } from '../../domain/enums/event-category.enum';
import { TransactionEntity } from '../../../transaction/domain/entities/transaction.entity';
import { CategoryType, TransactionStatus } from '@account-book/types';
import { EventNotFoundException } from '../../domain/errors/event.errors';

describe('GetEventFinancialSummaryUseCase', () => {
  let useCase: GetEventFinancialSummaryUseCase;
  let eventRepository: jest.Mocked<IEventRepository>;
  let transactionRepository: jest.Mocked<ITransactionRepository>;

  const createEvent = (): EventEntity => {
    return EventEntity.create(
      new Date('2025-08-10'),
      '沖縄旅行',
      '家族旅行',
      EventCategory.TRAVEL,
      ['旅行', '沖縄'],
    );
  };

  const createTransaction = (
    id: string,
    amount: number,
    categoryType: CategoryType,
    date: Date = new Date('2025-08-10'),
  ): TransactionEntity => {
    return new TransactionEntity(
      id,
      date,
      amount,
      {
        id: `cat_${id}`,
        name: categoryType === CategoryType.INCOME ? '給与' : '交通費',
        type: categoryType,
      },
      '取引説明',
      'inst_1',
      'acc_1',
      TransactionStatus.COMPLETED,
      false,
      null,
      new Date(),
      new Date(),
    );
  };

  beforeEach(async () => {
    const mockEventRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByDateRange: jest.fn(),
      delete: jest.fn(),
      findByTransactionId: jest.fn(),
      getTransactionIdsByEventId: jest.fn(),
      linkTransaction: jest.fn(),
      unlinkTransaction: jest.fn(),
    };

    const mockTransactionRepo = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      findAll: jest.fn(),
      findByInstitutionId: jest.fn(),
      findByAccountId: jest.fn(),
      findByDateRange: jest.fn(),
      findByCategoryType: jest.fn(),
      findByCategoryIdsAndDateRange: jest.fn(),
      findByInstitutionIdsAndDateRange: jest.fn(),
      findByMonth: jest.fn(),
      findByYear: jest.fn(),
      findUnreconciledTransfers: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteByInstitutionId: jest.fn(),
      deleteAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetEventFinancialSummaryUseCase,
        {
          provide: EVENT_REPOSITORY,
          useValue: mockEventRepo,
        },
        {
          provide: TRANSACTION_REPOSITORY,
          useValue: mockTransactionRepo,
        },
      ],
    }).compile();

    useCase = module.get<GetEventFinancialSummaryUseCase>(
      GetEventFinancialSummaryUseCase,
    );
    eventRepository = module.get(EVENT_REPOSITORY);
    transactionRepository = module.get(TRANSACTION_REPOSITORY);
  });

  describe('execute', () => {
    it('should calculate financial summary correctly', async () => {
      // Arrange
      const event = createEvent();
      const incomeTransaction = createTransaction(
        'txn_1',
        100000,
        CategoryType.INCOME,
      );
      const expenseTransaction1 = createTransaction(
        'txn_2',
        -50000,
        CategoryType.EXPENSE,
      );
      const expenseTransaction2 = createTransaction(
        'txn_3',
        -30000,
        CategoryType.EXPENSE,
      );

      eventRepository.findById.mockResolvedValue(event);
      eventRepository.getTransactionIdsByEventId.mockResolvedValue([
        'txn_1',
        'txn_2',
        'txn_3',
      ]);
      transactionRepository.findByIds.mockResolvedValue([
        incomeTransaction,
        expenseTransaction1,
        expenseTransaction2,
      ]);

      // Act
      const result = await useCase.execute(event.id);

      // Assert
      expect(result.event.id).toBe(event.id);
      expect(result.totalIncome).toBe(100000);
      expect(result.totalExpense).toBe(80000); // 50000 + 30000
      expect(result.netAmount).toBe(20000); // 100000 - 80000
      expect(result.transactionCount).toBe(3);
      expect(result.relatedTransactions).toHaveLength(3);
      expect(eventRepository.findById).toHaveBeenCalledWith(event.id);
      expect(eventRepository.getTransactionIdsByEventId).toHaveBeenCalledWith(
        event.id,
      );
      expect(transactionRepository.findByIds).toHaveBeenCalledWith([
        'txn_1',
        'txn_2',
        'txn_3',
      ]);
    });

    it('should handle only income transactions', async () => {
      // Arrange
      const event = createEvent();
      const incomeTransaction1 = createTransaction(
        'txn_1',
        100000,
        CategoryType.INCOME,
      );
      const incomeTransaction2 = createTransaction(
        'txn_2',
        50000,
        CategoryType.INCOME,
      );

      eventRepository.findById.mockResolvedValue(event);
      eventRepository.getTransactionIdsByEventId.mockResolvedValue([
        'txn_1',
        'txn_2',
      ]);
      transactionRepository.findByIds.mockResolvedValue([
        incomeTransaction1,
        incomeTransaction2,
      ]);

      // Act
      const result = await useCase.execute(event.id);

      // Assert
      expect(result.totalIncome).toBe(150000);
      expect(result.totalExpense).toBe(0);
      expect(result.netAmount).toBe(150000);
      expect(result.transactionCount).toBe(2);
    });

    it('should handle only expense transactions', async () => {
      // Arrange
      const event = createEvent();
      const expenseTransaction1 = createTransaction(
        'txn_1',
        -50000,
        CategoryType.EXPENSE,
      );
      const expenseTransaction2 = createTransaction(
        'txn_2',
        -30000,
        CategoryType.EXPENSE,
      );

      eventRepository.findById.mockResolvedValue(event);
      eventRepository.getTransactionIdsByEventId.mockResolvedValue([
        'txn_1',
        'txn_2',
      ]);
      transactionRepository.findByIds.mockResolvedValue([
        expenseTransaction1,
        expenseTransaction2,
      ]);

      // Act
      const result = await useCase.execute(event.id);

      // Assert
      expect(result.totalIncome).toBe(0);
      expect(result.totalExpense).toBe(80000);
      expect(result.netAmount).toBe(-80000);
      expect(result.transactionCount).toBe(2);
    });

    it('should exclude TRANSFER, REPAYMENT, INVESTMENT from calculation', async () => {
      // Arrange
      const event = createEvent();
      const expenseTransaction = createTransaction(
        'txn_1',
        -50000,
        CategoryType.EXPENSE,
      );
      const transferTransaction = createTransaction(
        'txn_2',
        -10000,
        CategoryType.TRANSFER,
      );
      const repaymentTransaction = createTransaction(
        'txn_3',
        -20000,
        CategoryType.REPAYMENT,
      );
      const investmentTransaction = createTransaction(
        'txn_4',
        -30000,
        CategoryType.INVESTMENT,
      );

      eventRepository.findById.mockResolvedValue(event);
      eventRepository.getTransactionIdsByEventId.mockResolvedValue([
        'txn_1',
        'txn_2',
        'txn_3',
        'txn_4',
      ]);
      transactionRepository.findByIds.mockResolvedValue([
        expenseTransaction,
        transferTransaction,
        repaymentTransaction,
        investmentTransaction,
      ]);

      // Act
      const result = await useCase.execute(event.id);

      // Assert
      expect(result.totalIncome).toBe(0);
      expect(result.totalExpense).toBe(50000); // EXPENSEのみ
      expect(result.netAmount).toBe(-50000);
      expect(result.transactionCount).toBe(4); // 件数はすべて含む
    });

    it('should return zero values when no transactions', async () => {
      // Arrange
      const event = createEvent();
      eventRepository.findById.mockResolvedValue(event);
      eventRepository.getTransactionIdsByEventId.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(event.id);

      // Assert
      expect(result.totalIncome).toBe(0);
      expect(result.totalExpense).toBe(0);
      expect(result.netAmount).toBe(0);
      expect(result.transactionCount).toBe(0);
      expect(result.relatedTransactions).toHaveLength(0);
    });

    it('should throw error when event not found', async () => {
      // Arrange
      eventRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute('nonexistent')).rejects.toThrow(
        EventNotFoundException,
      );
    });

    it('should handle missing transactions gracefully', async () => {
      // Arrange
      const event = createEvent();
      eventRepository.findById.mockResolvedValue(event);
      eventRepository.getTransactionIdsByEventId.mockResolvedValue(['txn_1']);
      transactionRepository.findByIds.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(event.id);

      // Assert
      expect(result.totalIncome).toBe(0);
      expect(result.totalExpense).toBe(0);
      expect(result.netAmount).toBe(0);
      expect(result.transactionCount).toBe(0);
      expect(result.relatedTransactions).toHaveLength(0);
    });
  });
});
