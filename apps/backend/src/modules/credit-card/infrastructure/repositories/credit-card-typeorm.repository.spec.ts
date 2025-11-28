import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditCardTypeOrmRepository } from './credit-card-typeorm.repository';
import { CreditCardOrmEntity } from '../entities/credit-card.orm-entity';
import { CreditCardEntity } from '../../domain/entities/credit-card.entity';

describe('CreditCardTypeOrmRepository', () => {
  let repository: CreditCardTypeOrmRepository;
  let mockRepository: jest.Mocked<Repository<CreditCardOrmEntity>>;

  const mockOrmEntity: Partial<CreditCardOrmEntity> = {
    id: 'card_1',
    cardName: 'Test Card',
    cardCompanyCode: 'test-card',
    credentialsEncrypted: 'encrypted',
    credentialsIv: 'iv',
    credentialsAuthTag: 'authTag',
    credentialsAlgorithm: 'aes-256-gcm',
    credentialsVersion: 'v1',
    lastFourDigits: '1234',
    paymentDay: 15,
    closingDay: 10,
    currentBalance: 0,
    lastSyncedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      create: jest.fn((entity) => entity as CreditCardOrmEntity),
    } as unknown as jest.Mocked<Repository<CreditCardOrmEntity>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditCardTypeOrmRepository,
        {
          provide: getRepositoryToken(CreditCardOrmEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<CreditCardTypeOrmRepository>(
      CreditCardTypeOrmRepository,
    );
  });

  describe('findAll', () => {
    it('should find all credit cards', async () => {
      mockRepository.find.mockResolvedValue([
        mockOrmEntity as CreditCardOrmEntity,
      ]);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(CreditCardEntity);
    });
  });

  describe('findById', () => {
    it('should find credit card by id', async () => {
      mockRepository.findOne.mockResolvedValue(
        mockOrmEntity as CreditCardOrmEntity,
      );

      const result = await repository.findById('card_1');

      expect(result).toBeInstanceOf(CreditCardEntity);
    });
  });

  describe('save', () => {
    it('should save credit card', async () => {
      mockRepository.save.mockResolvedValue(
        mockOrmEntity as CreditCardOrmEntity,
      );

      await expect(repository.save({} as any)).resolves.not.toThrow();
    });
  });
});
