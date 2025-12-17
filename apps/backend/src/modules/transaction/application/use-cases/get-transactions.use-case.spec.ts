import { Test, TestingModule } from '@nestjs/testing';
import { GetTransactionsUseCase } from './get-transactions.use-case';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { CategoryType, TransactionStatus } from '@account-book/types';

describe('GetTransactionsUseCase', () => {
  let useCase: GetTransactionsUseCase;
  let repository: jest.Mocked<ITransactionRepository>;

  const mockTransaction1 = new TransactionEntity(
    'trans-001',
    new Date('2025-01-15'),
    -1500,
    {
      id: 'cat-001',
      name: '食費',
      type: CategoryType.EXPENSE,
    },
    'スターバックス',
    'inst-001',
    'acc-001',
    TransactionStatus.COMPLETED,
    false,
    null,
    new Date('2025-01-15T10:00:00Z'),
    new Date('2025-01-15T10:00:00Z'),
  );

  const mockTransaction2 = new TransactionEntity(
    'trans-002',
    new Date('2025-01-16'),
    -2000,
    {
      id: 'cat-002',
      name: '交通費',
      type: CategoryType.EXPENSE,
    },
    '電車代',
    'inst-001',
    'acc-001',
    TransactionStatus.COMPLETED,
    false,
    null,
    new Date('2025-01-16T10:00:00Z'),
    new Date('2025-01-16T10:00:00Z'),
  );

  beforeEach(async () => {
    repository = {
      findAll: jest.fn(),
      findByMonth: jest.fn(),
      findByYear: jest.fn(),
      findByDateRange: jest.fn(),
      findByInstitutionId: jest.fn(),
      findByAccountId: jest.fn(),
    } as unknown as jest.Mocked<ITransactionRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTransactionsUseCase,
        {
          provide: TRANSACTION_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    useCase = module.get<GetTransactionsUseCase>(GetTransactionsUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return all transactions when no query is provided', async () => {
      const mockTransactions = [mockTransaction1, mockTransaction2];
      repository.findAll.mockResolvedValue(mockTransactions);

      const result = await useCase.execute({});

      expect(result).toEqual(mockTransactions);
      expect(repository.findAll).toHaveBeenCalled();
      expect(repository.findByMonth).not.toHaveBeenCalled();
      expect(repository.findByYear).not.toHaveBeenCalled();
    });

    it('should filter by month when year and month are provided', async () => {
      const mockTransactions = [mockTransaction1];
      repository.findByMonth.mockResolvedValue(mockTransactions);

      const result = await useCase.execute({ year: 2025, month: 1 });

      expect(result).toEqual(mockTransactions);
      expect(repository.findByMonth).toHaveBeenCalledWith(2025, 1);
      expect(repository.findAll).not.toHaveBeenCalled();
    });

    it('should filter by year when only year is provided', async () => {
      const mockTransactions = [mockTransaction1, mockTransaction2];
      repository.findByYear.mockResolvedValue(mockTransactions);

      const result = await useCase.execute({ year: 2025 });

      expect(result).toEqual(mockTransactions);
      expect(repository.findByYear).toHaveBeenCalledWith(2025);
      expect(repository.findAll).not.toHaveBeenCalled();
    });

    it('should filter by date range when startDate and endDate are provided', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const mockTransactions = [mockTransaction1, mockTransaction2];
      repository.findByDateRange.mockResolvedValue(mockTransactions);

      const result = await useCase.execute({ startDate, endDate });

      expect(result).toEqual(mockTransactions);
      expect(repository.findByDateRange).toHaveBeenCalledWith(
        startDate,
        endDate,
      );
      expect(repository.findAll).not.toHaveBeenCalled();
    });

    it('should filter by institutionId when provided', async () => {
      const mockTransactions = [mockTransaction1];
      repository.findByInstitutionId.mockResolvedValue(mockTransactions);

      const result = await useCase.execute({ institutionId: 'inst-001' });

      expect(result).toEqual(mockTransactions);
      expect(repository.findByInstitutionId).toHaveBeenCalledWith('inst-001');
      expect(repository.findAll).not.toHaveBeenCalled();
    });

    it('should filter by accountId when provided', async () => {
      const mockTransactions = [mockTransaction1];
      repository.findByAccountId.mockResolvedValue(mockTransactions);

      const result = await useCase.execute({ accountId: 'acc-001' });

      expect(result).toEqual(mockTransactions);
      expect(repository.findByAccountId).toHaveBeenCalledWith('acc-001');
      expect(repository.findAll).not.toHaveBeenCalled();
    });

    it('should prioritize month filter over year filter', async () => {
      const mockTransactions = [mockTransaction1];
      repository.findByMonth.mockResolvedValue(mockTransactions);

      const result = await useCase.execute({ year: 2025, month: 1 });

      expect(result).toEqual(mockTransactions);
      expect(repository.findByMonth).toHaveBeenCalledWith(2025, 1);
      expect(repository.findByYear).not.toHaveBeenCalled();
    });

    it('should prioritize month filter over date range filter', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const mockTransactions = [mockTransaction1];
      repository.findByMonth.mockResolvedValue(mockTransactions);

      const result = await useCase.execute({
        year: 2025,
        month: 1,
        startDate,
        endDate,
      });

      expect(result).toEqual(mockTransactions);
      expect(repository.findByMonth).toHaveBeenCalledWith(2025, 1);
      expect(repository.findByDateRange).not.toHaveBeenCalled();
    });

    it('should prioritize year filter over date range filter', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const mockTransactions = [mockTransaction1];
      repository.findByYear.mockResolvedValue(mockTransactions);

      const result = await useCase.execute({
        year: 2025,
        startDate,
        endDate,
      });

      expect(result).toEqual(mockTransactions);
      expect(repository.findByYear).toHaveBeenCalledWith(2025);
      expect(repository.findByDateRange).not.toHaveBeenCalled();
    });
  });
});
