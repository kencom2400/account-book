import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { SecurityTransactionTypeOrmRepository } from './security-transaction-typeorm.repository';
import { SecurityTransactionOrmEntity } from '../entities/security-transaction.orm-entity';
import { SecurityTransactionEntity } from '../../domain/entities/security-transaction.entity';

describe('SecurityTransactionTypeOrmRepository', () => {
  let repository: SecurityTransactionTypeOrmRepository;
  let mockRepository: jest.Mocked<Repository<SecurityTransactionOrmEntity>>;

  const mockDomainEntity = new SecurityTransactionEntity(
    'tx_1',
    'sec_1',
    '7203',
    'Toyota',
    new Date('2024-01-15'),
    'buy',
    100,
    2500,
    500,
    'completed',
    new Date('2024-01-15'),
  );

  const mockOrmEntity: Partial<SecurityTransactionOrmEntity> = {
    id: 'tx_1',
    securitiesAccountId: 'sec_1',
    securityCode: '7203',
    securityName: 'Toyota',
    transactionDate: new Date('2024-01-15'),
    transactionType: 'buy',
    quantity: 100,
    price: 2500,
    fee: 500,
    status: 'completed',
    createdAt: new Date('2024-01-15'),
  };

  beforeEach(async () => {
    mockRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
      create: jest.fn((entity) => entity as SecurityTransactionOrmEntity),
    } as unknown as jest.Mocked<Repository<SecurityTransactionOrmEntity>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityTransactionTypeOrmRepository,
        {
          provide: getRepositoryToken(SecurityTransactionOrmEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<SecurityTransactionTypeOrmRepository>(
      SecurityTransactionTypeOrmRepository,
    );
  });

  describe('create', () => {
    it('should create security transaction', async () => {
      mockRepository.save.mockResolvedValue(
        mockOrmEntity as SecurityTransactionOrmEntity,
      );

      await repository.create(mockDomainEntity);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'tx_1',
          securityCode: '7203',
        }),
      );
    });

    it('should create with EntityManager', async () => {
      const mockManager = {
        getRepository: jest.fn().mockReturnValue({
          save: jest.fn().mockResolvedValue(mockOrmEntity),
        }),
      } as unknown as EntityManager;

      await repository.create(mockDomainEntity, mockManager);

      expect(mockManager.getRepository).toHaveBeenCalledWith(
        SecurityTransactionOrmEntity,
      );
    });
  });

  describe('findById', () => {
    it('should find transaction by id', async () => {
      mockRepository.findOne.mockResolvedValue(
        mockOrmEntity as SecurityTransactionOrmEntity,
      );

      const result = await repository.findById('tx_1');

      expect(result).toBeInstanceOf(SecurityTransactionEntity);
      expect(result?.id).toBe('tx_1');
    });

    it('should return null if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByAccountId', () => {
    it('should find transactions by account id', async () => {
      mockRepository.find.mockResolvedValue([
        mockOrmEntity as SecurityTransactionOrmEntity,
      ]);

      const result = await repository.findByAccountId('sec_1');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(SecurityTransactionEntity);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { securitiesAccountId: 'sec_1' },
        order: { transactionDate: 'DESC' },
      });
    });
  });

  describe('findByAccountIdAndDateRange', () => {
    it('should find transactions by account id and date range', async () => {
      mockRepository.find.mockResolvedValue([
        mockOrmEntity as SecurityTransactionOrmEntity,
      ]);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const result = await repository.findByAccountIdAndDateRange(
        'sec_1',
        startDate,
        endDate,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(SecurityTransactionEntity);
    });
  });

  describe('update', () => {
    it('should update transaction', async () => {
      mockRepository.save.mockResolvedValue(
        mockOrmEntity as SecurityTransactionOrmEntity,
      );

      await repository.update(mockDomainEntity);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'tx_1',
        }),
      );
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
