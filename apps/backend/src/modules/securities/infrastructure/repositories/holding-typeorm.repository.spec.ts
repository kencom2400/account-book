import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HoldingTypeOrmRepository } from './holding-typeorm.repository';
import { HoldingOrmEntity } from '../entities/holding.orm-entity';
import { HoldingEntity } from '../../domain/entities/holding.entity';

describe('HoldingTypeOrmRepository', () => {
  let repository: HoldingTypeOrmRepository;
  let mockRepository: jest.Mocked<Repository<HoldingOrmEntity>>;

  const mockDomainEntity = new HoldingEntity(
    'hold_1',
    'sec_1',
    '7203',
    'Toyota',
    100,
    2500,
    2800,
    'stock',
    '東証',
    new Date('2024-01-15'),
  );

  const mockOrmEntity: Partial<HoldingOrmEntity> = {
    id: 'hold_1',
    securitiesAccountId: 'sec_1',
    securityCode: '7203',
    securityName: 'Toyota',
    quantity: 100,
    averageAcquisitionPrice: 2500,
    currentPrice: 2800,
    securityType: 'stock',
    market: '東証',
    updatedAt: new Date('2024-01-15'),
  };

  beforeEach(async () => {
    mockRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
      create: jest.fn((entity) => entity as HoldingOrmEntity),
    } as unknown as jest.Mocked<Repository<HoldingOrmEntity>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HoldingTypeOrmRepository,
        {
          provide: getRepositoryToken(HoldingOrmEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<HoldingTypeOrmRepository>(HoldingTypeOrmRepository);
  });

  describe('create', () => {
    it('should create holding', async () => {
      mockRepository.save.mockResolvedValue(mockOrmEntity as HoldingOrmEntity);

      await repository.create(mockDomainEntity);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'hold_1',
          securityCode: '7203',
        }),
      );
    });
  });

  describe('findById', () => {
    it('should find holding by id', async () => {
      mockRepository.findOne.mockResolvedValue(
        mockOrmEntity as HoldingOrmEntity,
      );

      const result = await repository.findById('hold_1');

      expect(result).toBeInstanceOf(HoldingEntity);
      expect(result?.id).toBe('hold_1');
    });

    it('should return null if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByAccountId', () => {
    it('should find holdings by account id', async () => {
      mockRepository.find.mockResolvedValue([
        mockOrmEntity as HoldingOrmEntity,
      ]);

      const result = await repository.findByAccountId('sec_1');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(HoldingEntity);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { securitiesAccountId: 'sec_1' },
        order: { securityCode: 'ASC' },
      });
    });
  });

  describe('findByAccountIdAndSecurityCode', () => {
    it('should find holding by account id and security code', async () => {
      mockRepository.findOne.mockResolvedValue(
        mockOrmEntity as HoldingOrmEntity,
      );

      const result = await repository.findByAccountIdAndSecurityCode(
        'sec_1',
        '7203',
      );

      expect(result).toBeInstanceOf(HoldingEntity);
      expect(result?.securityCode).toBe('7203');
    });

    it('should return null if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByAccountIdAndSecurityCode(
        'sec_1',
        'nonexistent',
      );

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update holding', async () => {
      mockRepository.save.mockResolvedValue(mockOrmEntity as HoldingOrmEntity);

      await repository.update(mockDomainEntity);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'hold_1',
        }),
      );
    });
  });

  describe('delete', () => {
    it('should delete holding', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await repository.delete('hold_1');

      expect(mockRepository.delete).toHaveBeenCalledWith('hold_1');
    });
  });
});
