import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TransactionRepository } from './transaction.repository';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { Money } from '../../domain/value-objects/money.vo';
import { TransactionDate } from '../../domain/value-objects/transaction-date.vo';
import * as fs from 'fs/promises';

jest.mock('fs/promises');

describe('TransactionRepository', () => {
  let repository: TransactionRepository;
  const mockFs = fs as jest.Mocked<typeof fs>;

  const mockTransaction = new TransactionEntity(
    'tx_1',
    new TransactionDate(new Date('2024-01-15')),
    new Money(1000, 'JPY'),
    {
      id: 'cat_1',
      name: 'Food',
      type: 'expense' as const,
    },
    'Test transaction',
    'inst_1',
    'acc_1',
    'completed' as const,
    false,
    null,
    new Date('2024-01-01'),
    new Date('2024-01-01'),
  );

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionRepository,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<TransactionRepository>(TransactionRepository);

    // Mock file system operations
    mockFs.access.mockResolvedValue(undefined);
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.readdir.mockResolvedValue([]);
    mockFs.readFile.mockResolvedValue('[]');
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.unlink.mockResolvedValue(undefined);
  });

  describe('findAll', () => {
    it('should return all transactions', async () => {
      mockFs.readdir.mockResolvedValue(['2024-01.json'] as any);
      const mockData = JSON.stringify([
        {
          id: 'tx_1',
          date: '2024-01-15',
          amount: 1000,
          currency: 'JPY',
          category: {
            id: 'cat_1',
            name: 'Food',
            type: 'expense',
          },
          description: 'Test transaction',
          institutionId: 'inst_1',
          accountId: 'acc_1',
          status: 'completed',
          isReconciled: false,
          relatedTransactionId: null,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(TransactionEntity);
      expect(result[0].description).toBe('Test transaction');
    });

    it('should return empty array when no files exist', async () => {
      mockFs.readdir.mockResolvedValue([] as any);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should find transaction by id', async () => {
      mockFs.readdir.mockResolvedValue(['2024-01.json'] as any);
      const mockData = JSON.stringify([
        {
          id: 'tx_1',
          date: '2024-01-15',
          amount: 1000,
          currency: 'JPY',
          category: {
            id: 'cat_1',
            name: 'Food',
            type: 'expense',
          },
          description: 'Test transaction',
          institutionId: 'inst_1',
          accountId: 'acc_1',
          status: 'completed',
          isReconciled: false,
          relatedTransactionId: null,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const result = await repository.findById('tx_1');

      expect(result).toBeInstanceOf(TransactionEntity);
      expect(result?.id).toBe('tx_1');
    });

    it('should return null when transaction not found', async () => {
      mockFs.readdir.mockResolvedValue([] as any);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByDateRange', () => {
    it('should find transactions by date range', async () => {
      mockFs.readdir.mockResolvedValue(['2024-01.json'] as any);
      const mockData = JSON.stringify([
        {
          id: 'tx_1',
          date: '2024-01-15',
          amount: 1000,
          currency: 'JPY',
          category: {
            id: 'cat_1',
            name: 'Food',
            type: 'expense',
          },
          description: 'Test transaction',
          institutionId: 'inst_1',
          accountId: 'acc_1',
          status: 'completed',
          isReconciled: false,
          relatedTransactionId: null,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const result = await repository.findByDateRange(
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tx_1');
    });
  });

  describe('findByCategory', () => {
    it('should find transactions by category', async () => {
      mockFs.readdir.mockResolvedValue(['2024-01.json'] as any);
      const mockData = JSON.stringify([
        {
          id: 'tx_1',
          date: '2024-01-15',
          amount: 1000,
          currency: 'JPY',
          category: {
            id: 'cat_1',
            name: 'Food',
            type: 'expense',
          },
          description: 'Test transaction',
          institutionId: 'inst_1',
          accountId: 'acc_1',
          status: 'completed',
          isReconciled: false,
          relatedTransactionId: null,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const result = await repository.findByCategory('cat_1');

      expect(result).toHaveLength(1);
      expect(result[0].category.id).toBe('cat_1');
    });
  });

  describe('save', () => {
    it('should save transaction', async () => {
      mockFs.readdir.mockResolvedValue(['2024-01.json'] as any);
      mockFs.readFile.mockResolvedValue('[]');

      const result = await repository.save(mockTransaction);

      expect(result).toBeInstanceOf(TransactionEntity);
      expect(mockFs.writeFile).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete transaction', async () => {
      mockFs.readdir.mockResolvedValue(['2024-01.json'] as any);
      const mockData = JSON.stringify([
        {
          id: 'tx_1',
          date: '2024-01-15',
          amount: 1000,
          currency: 'JPY',
          category: {
            id: 'cat_1',
            name: 'Food',
            type: 'expense',
          },
          description: 'Test transaction',
          institutionId: 'inst_1',
          accountId: 'acc_1',
          status: 'completed',
          isReconciled: false,
          relatedTransactionId: null,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      await repository.delete('tx_1');

      expect(mockFs.writeFile).toHaveBeenCalled();
    });
  });
});
