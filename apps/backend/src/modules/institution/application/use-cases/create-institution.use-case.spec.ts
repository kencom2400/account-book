import { Test, TestingModule } from '@nestjs/testing';
import { CreateInstitutionUseCase } from './create-institution.use-case';
import type { IInstitutionRepository } from '../../domain/repositories/institution.repository.interface';
import type { ICryptoService } from '../../domain/services/crypto.service.interface';
import { InstitutionEntity } from '../../domain/entities/institution.entity';
import { EncryptedCredentials } from '../../domain/value-objects/encrypted-credentials.vo';
import { InstitutionType } from '@account-book/types';
import {
  INSTITUTION_REPOSITORY,
  CRYPTO_SERVICE,
} from '../../institution.tokens';

describe('CreateInstitutionUseCase', () => {
  let useCase: CreateInstitutionUseCase;
  let mockInstitutionRepository: jest.Mocked<IInstitutionRepository>;
  let mockCryptoService: jest.Mocked<ICryptoService>;

  beforeEach(async () => {
    mockInstitutionRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByType: jest.fn(),
      findByConnectionStatus: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteAll: jest.fn(),
    };

    mockCryptoService = {
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateInstitutionUseCase,
        {
          provide: INSTITUTION_REPOSITORY,
          useValue: mockInstitutionRepository,
        },
        {
          provide: CRYPTO_SERVICE,
          useValue: mockCryptoService,
        },
      ],
    }).compile();

    useCase = module.get<CreateInstitutionUseCase>(CreateInstitutionUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should create institution with encrypted credentials', async () => {
      const dto = {
        name: 'テスト銀行',
        type: InstitutionType.BANK,
        credentials: {
          bankCode: '0000',
          branchCode: '001',
          accountNumber: '1234567',
        },
      };

      const encryptedCredentials = new EncryptedCredentials(
        'encrypted-data',
        'iv-data',
        'auth-tag',
      );

      mockCryptoService.encrypt.mockReturnValue(encryptedCredentials);

      const savedInstitution = new InstitutionEntity(
        'test-id',
        dto.name,
        dto.type,
        encryptedCredentials,
        false,
        null,
        [],
        new Date(),
        new Date(),
      );

      mockInstitutionRepository.save.mockResolvedValue(savedInstitution);

      const result = await useCase.execute(dto);

      expect(mockCryptoService.encrypt).toHaveBeenCalledWith(
        JSON.stringify(dto.credentials),
      );
      expect(mockInstitutionRepository.save).toHaveBeenCalled();
      expect(result).toBe(savedInstitution);
    });

    it('should encrypt credentials as JSON string', async () => {
      const dto = {
        name: 'テスト銀行',
        type: InstitutionType.BANK,
        credentials: {
          bankCode: '0000',
          branchCode: '001',
          accountNumber: '1234567',
          apiKey: 'test-api-key',
        },
      };

      const encryptedCredentials = new EncryptedCredentials(
        'encrypted-data',
        'iv-data',
        'auth-tag',
      );

      mockCryptoService.encrypt.mockReturnValue(encryptedCredentials);

      const savedInstitution = new InstitutionEntity(
        'test-id',
        dto.name,
        dto.type,
        encryptedCredentials,
        false,
        null,
        [],
        new Date(),
        new Date(),
      );

      mockInstitutionRepository.save.mockResolvedValue(savedInstitution);

      await useCase.execute(dto);

      const expectedJson = JSON.stringify(dto.credentials);
      expect(mockCryptoService.encrypt).toHaveBeenCalledWith(expectedJson);
    });

    it('should set initial connection status to false', async () => {
      const dto = {
        name: 'テスト銀行',
        type: InstitutionType.BANK,
        credentials: {
          bankCode: '0000',
          branchCode: '001',
          accountNumber: '1234567',
        },
      };

      const encryptedCredentials = new EncryptedCredentials(
        'encrypted-data',
        'iv-data',
        'auth-tag',
      );

      mockCryptoService.encrypt.mockReturnValue(encryptedCredentials);

      mockInstitutionRepository.save.mockImplementation(async (institution) => {
        expect(institution.isConnected).toBe(false);
        return institution;
      });

      await useCase.execute(dto);

      expect(mockInstitutionRepository.save).toHaveBeenCalled();
    });

    it('should set lastSyncedAt to null initially', async () => {
      const dto = {
        name: 'テスト銀行',
        type: InstitutionType.BANK,
        credentials: {
          bankCode: '0000',
          branchCode: '001',
          accountNumber: '1234567',
        },
      };

      const encryptedCredentials = new EncryptedCredentials(
        'encrypted-data',
        'iv-data',
        'auth-tag',
      );

      mockCryptoService.encrypt.mockReturnValue(encryptedCredentials);

      mockInstitutionRepository.save.mockImplementation(async (institution) => {
        expect(institution.lastSyncedAt).toBeNull();
        return institution;
      });

      await useCase.execute(dto);

      expect(mockInstitutionRepository.save).toHaveBeenCalled();
    });

    it('should initialize with empty accounts array', async () => {
      const dto = {
        name: 'テスト銀行',
        type: InstitutionType.BANK,
        credentials: {
          bankCode: '0000',
          branchCode: '001',
          accountNumber: '1234567',
        },
      };

      const encryptedCredentials = new EncryptedCredentials(
        'encrypted-data',
        'iv-data',
        'auth-tag',
      );

      mockCryptoService.encrypt.mockReturnValue(encryptedCredentials);

      mockInstitutionRepository.save.mockImplementation(async (institution) => {
        expect(institution.accounts).toEqual([]);
        return institution;
      });

      await useCase.execute(dto);

      expect(mockInstitutionRepository.save).toHaveBeenCalled();
    });

    it('should generate UUID for institution ID', async () => {
      const dto = {
        name: 'テスト銀行',
        type: InstitutionType.BANK,
        credentials: {
          bankCode: '0000',
          branchCode: '001',
          accountNumber: '1234567',
        },
      };

      const encryptedCredentials = new EncryptedCredentials(
        'encrypted-data',
        'iv-data',
        'auth-tag',
      );

      mockCryptoService.encrypt.mockReturnValue(encryptedCredentials);

      mockInstitutionRepository.save.mockImplementation(async (institution) => {
        expect(institution.id).toBeDefined();
        expect(institution.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        );
        return institution;
      });

      await useCase.execute(dto);

      expect(mockInstitutionRepository.save).toHaveBeenCalled();
    });

    it('should handle credit card type', async () => {
      const dto = {
        name: 'テストカード',
        type: InstitutionType.CREDIT_CARD,
        credentials: {
          cardNumber: '1234567890123456',
          apiKey: 'test-api-key',
        },
      };

      const encryptedCredentials = new EncryptedCredentials(
        'encrypted-data',
        'iv-data',
        'auth-tag',
      );

      mockCryptoService.encrypt.mockReturnValue(encryptedCredentials);

      const savedInstitution = new InstitutionEntity(
        'test-id',
        dto.name,
        dto.type,
        encryptedCredentials,
        false,
        null,
        [],
        new Date(),
        new Date(),
      );

      mockInstitutionRepository.save.mockResolvedValue(savedInstitution);

      const result = await useCase.execute(dto);

      expect(result.type).toBe(InstitutionType.CREDIT_CARD);
    });

    it('should handle securities type', async () => {
      const dto = {
        name: 'テスト証券',
        type: InstitutionType.SECURITIES,
        credentials: {
          accountId: 'test-account',
          apiKey: 'test-api-key',
        },
      };

      const encryptedCredentials = new EncryptedCredentials(
        'encrypted-data',
        'iv-data',
        'auth-tag',
      );

      mockCryptoService.encrypt.mockReturnValue(encryptedCredentials);

      const savedInstitution = new InstitutionEntity(
        'test-id',
        dto.name,
        dto.type,
        encryptedCredentials,
        false,
        null,
        [],
        new Date(),
        new Date(),
      );

      mockInstitutionRepository.save.mockResolvedValue(savedInstitution);

      const result = await useCase.execute(dto);

      expect(result.type).toBe(InstitutionType.SECURITIES);
    });

    it('should propagate repository errors', async () => {
      const dto = {
        name: 'テスト銀行',
        type: InstitutionType.BANK,
        credentials: {
          bankCode: '0000',
          branchCode: '001',
          accountNumber: '1234567',
        },
      };

      const encryptedCredentials = new EncryptedCredentials(
        'encrypted-data',
        'iv-data',
        'auth-tag',
      );

      mockCryptoService.encrypt.mockReturnValue(encryptedCredentials);
      mockInstitutionRepository.save.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(useCase.execute(dto)).rejects.toThrow('Database error');
    });

    it('should propagate crypto service errors', async () => {
      const dto = {
        name: 'テスト銀行',
        type: InstitutionType.BANK,
        credentials: {
          bankCode: '0000',
          branchCode: '001',
          accountNumber: '1234567',
        },
      };

      mockCryptoService.encrypt.mockImplementation(() => {
        throw new Error('Encryption failed');
      });

      await expect(useCase.execute(dto)).rejects.toThrow('Encryption failed');
    });
  });
});
