import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionTypeOrmRepository } from './transaction-typeorm.repository';
import { TransactionOrmEntity } from '../entities/transaction.orm-entity';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { CategoryType, TransactionStatus } from '@account-book/types';

describe('TransactionTypeOrmRepository', () => {
  let repository: TransactionTypeOrmRepository;
  let mockRepository: jest.Mocked<Repository<TransactionOrmEntity>>;

  const mockOrmEntity: Partial<TransactionOrmEntity> = {
    id: 'tx_1',
    date: new Date('2024-01-15'),
    amount: 1000,
    categoryId: 'cat_1',
    categoryName: 'Food',
    categoryType: CategoryType.EXPENSE,
    description: 'Test transaction',
    institutionId: 'inst_1',
    accountId: 'acc_1',
    status: TransactionStatus.COMPLETED,
    relatedTransactionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      create: jest.fn((entity) => entity as TransactionOrmEntity),
    } as unknown as jest.Mocked<Repository<TransactionOrmEntity>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionTypeOrmRepository,
        {
          provide: getRepositoryToken(TransactionOrmEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<TransactionTypeOrmRepository>(
      TransactionTypeOrmRepository,
    );
  });

  describe('findById', () => {
    it('should find transaction by id', async () => {
      mockRepository.findOne.mockResolvedValue(
        mockOrmEntity as TransactionOrmEntity,
      );

      const result = await repository.findById('tx_1');

      expect(result).toBeInstanceOf(TransactionEntity);
      expect(result?.id).toBe('tx_1');
    });

    it('should return null if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all transactions', async () => {
      mockRepository.find.mockResolvedValue([
        mockOrmEntity as TransactionOrmEntity,
      ]);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(TransactionEntity);
    });
  });

  describe('findByInstitutionId', () => {
    it('should find transactions by institution id', async () => {
      mockRepository.find.mockResolvedValue([
        mockOrmEntity as TransactionOrmEntity,
      ]);

      const result = await repository.findByInstitutionId('inst_1');

      expect(result).toHaveLength(1);
    });
  });

  describe('findByAccountId', () => {
    it('should find transactions by account id', async () => {
      mockRepository.find.mockResolvedValue([
        mockOrmEntity as TransactionOrmEntity,
      ]);

      const result = await repository.findByAccountId('acc_1');

      expect(result).toHaveLength(1);
    });
  });

  describe('findByDateRange', () => {
    it('should find transactions by date range', async () => {
      mockRepository.find.mockResolvedValue([
        mockOrmEntity as TransactionOrmEntity,
      ]);

      const result = await repository.findByDateRange(
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );

      expect(result).toHaveLength(1);
    });
  });

  describe('save', () => {
    it('should save transaction', async () => {
      const mockTransaction = new TransactionEntity(
        'tx_1',
        { value: new Date('2024-01-15') } as any,
        { value: 1000 } as any,
        { id: 'cat_1', name: 'Food', type: CategoryType.EXPENSE },
        'Test',
        'inst_1',
        'acc_1',
        TransactionStatus.COMPLETED,
        null,
        new Date(),
        new Date(),
      );

      mockRepository.save.mockResolvedValue(
        mockOrmEntity as TransactionOrmEntity,
      );

      await repository.save(mockTransaction);

      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete transaction', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await repository.delete('tx_1');

      expect(mockRepository.delete).toHaveBeenCalledWith('tx_1');
    });
  });
});
