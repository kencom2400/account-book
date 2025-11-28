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
    cardNumber: '1234',
    cardHolderName: 'Test User',
    expiryDate: new Date('2025-12-31'),
    encryptedCredentials: JSON.stringify({
      encrypted: 'encrypted',
      iv: 'iv',
      authTag: 'authTag',
      algorithm: 'aes-256-gcm',
      version: 'v1',
    }),
    isConnected: true,
    lastSyncedAt: new Date(),
    paymentDay: 15,
    closingDay: 10,
    creditLimit: '1000000',
    currentBalance: '0',
    issuer: 'test-issuer',
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
      mockRepository.create.mockReturnValue(
        mockOrmEntity as CreditCardOrmEntity,
      );

      const mockCard = {
        id: 'card_1',
        cardNumber: '**** **** **** 1234',
        cardHolder: 'John Doe',
        expiryDate: '2025-12',
        paymentDay: 10,
        closingDay: 27,
        creditLimit: 100000,
        currentBalance: 50000,
        issuer: 'VISA',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        credentials: {
          toJSON: () => ({
            encrypted: 'encrypted',
            iv: 'iv',
            authTag: 'authTag',
            algorithm: 'aes-256-gcm',
            version: 'v1',
          }),
        },
      } as any;

      const result = await repository.save(mockCard);

      expect(result).toBeInstanceOf(CreditCardEntity);
    });
  });
});
