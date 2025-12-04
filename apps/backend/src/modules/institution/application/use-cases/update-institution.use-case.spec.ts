import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpdateInstitutionUseCase } from './update-institution.use-case';
import type { IInstitutionRepository } from '../../domain/repositories/institution.repository.interface';
import type { ICryptoService } from '../../domain/services/crypto.service.interface';
import { InstitutionEntity } from '../../domain/entities/institution.entity';
import { EncryptedCredentials } from '../../domain/value-objects/encrypted-credentials.vo';
import { InstitutionType } from '@account-book/types';
import {
  INSTITUTION_REPOSITORY,
  CRYPTO_SERVICE,
} from '../../institution.tokens';

describe('UpdateInstitutionUseCase', () => {
  let useCase: UpdateInstitutionUseCase;
  let mockInstitutionRepository: jest.Mocked<IInstitutionRepository>;
  let mockCryptoService: jest.Mocked<ICryptoService>;

  const existingInstitutionId = 'existing-id';
  const existingInstitution = new InstitutionEntity(
    existingInstitutionId,
    '既存の銀行',
    InstitutionType.BANK,
    new EncryptedCredentials(
      'existing-encrypted',
      'existing-iv',
      'existing-tag',
    ),
    true,
    new Date('2024-01-01'),
    [],
    new Date('2023-01-01'),
    new Date('2023-01-01'),
  );

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
        UpdateInstitutionUseCase,
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

    useCase = module.get<UpdateInstitutionUseCase>(UpdateInstitutionUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should throw NotFoundException when institution does not exist', async () => {
      const nonExistentId = 'non-existent-id';
      mockInstitutionRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(nonExistentId, { name: '新しい名前' }),
      ).rejects.toThrow(NotFoundException);
      expect(mockInstitutionRepository.findById).toHaveBeenCalledWith(
        nonExistentId,
      );
      expect(mockInstitutionRepository.update).not.toHaveBeenCalled();
    });

    it('should update institution name only', async () => {
      const newName = '更新された銀行名';
      mockInstitutionRepository.findById.mockResolvedValue(existingInstitution);

      const updatedInstitution = new InstitutionEntity(
        existingInstitutionId,
        newName,
        existingInstitution.type,
        existingInstitution.credentials,
        existingInstitution.isConnected,
        existingInstitution.lastSyncedAt,
        existingInstitution.accounts,
        existingInstitution.createdAt,
        new Date(),
      );

      mockInstitutionRepository.update.mockResolvedValue(updatedInstitution);

      const result = await useCase.execute(existingInstitutionId, {
        name: newName,
      });

      expect(mockInstitutionRepository.findById).toHaveBeenCalledWith(
        existingInstitutionId,
      );
      expect(mockInstitutionRepository.update).toHaveBeenCalled();
      expect(result.name).toBe(newName);
      expect(result.type).toBe(existingInstitution.type);
      expect(result.credentials).toBe(existingInstitution.credentials);
      expect(mockCryptoService.encrypt).not.toHaveBeenCalled();
    });

    it('should update institution type only', async () => {
      const newType = InstitutionType.CREDIT_CARD;
      mockInstitutionRepository.findById.mockResolvedValue(existingInstitution);

      const updatedInstitution = new InstitutionEntity(
        existingInstitutionId,
        existingInstitution.name,
        newType,
        existingInstitution.credentials,
        existingInstitution.isConnected,
        existingInstitution.lastSyncedAt,
        existingInstitution.accounts,
        existingInstitution.createdAt,
        new Date(),
      );

      mockInstitutionRepository.update.mockResolvedValue(updatedInstitution);

      const result = await useCase.execute(existingInstitutionId, {
        type: newType,
      });

      expect(result.type).toBe(newType);
      expect(result.name).toBe(existingInstitution.name);
      expect(result.credentials).toBe(existingInstitution.credentials);
      expect(mockCryptoService.encrypt).not.toHaveBeenCalled();
    });

    it('should update credentials only', async () => {
      const newCredentials = {
        bankCode: '9999',
        branchCode: '999',
        accountNumber: '9999999',
      };
      const encryptedCredentials = new EncryptedCredentials(
        'new-encrypted',
        'new-iv',
        'new-tag',
      );

      mockInstitutionRepository.findById.mockResolvedValue(existingInstitution);
      mockCryptoService.encrypt.mockReturnValue(encryptedCredentials);

      const updatedInstitution = new InstitutionEntity(
        existingInstitutionId,
        existingInstitution.name,
        existingInstitution.type,
        encryptedCredentials,
        existingInstitution.isConnected,
        existingInstitution.lastSyncedAt,
        existingInstitution.accounts,
        existingInstitution.createdAt,
        new Date(),
      );

      mockInstitutionRepository.update.mockResolvedValue(updatedInstitution);

      const result = await useCase.execute(existingInstitutionId, {
        credentials: newCredentials,
      });

      expect(mockCryptoService.encrypt).toHaveBeenCalledWith(
        JSON.stringify(newCredentials),
      );
      expect(result.credentials).toBe(encryptedCredentials);
      expect(result.name).toBe(existingInstitution.name);
      expect(result.type).toBe(existingInstitution.type);
    });

    it('should update all fields simultaneously', async () => {
      const newName = '完全更新された銀行';
      const newType = InstitutionType.SECURITIES;
      const newCredentials = {
        accountId: 'new-account-id',
        apiKey: 'new-api-key',
      };
      const encryptedCredentials = new EncryptedCredentials(
        'all-new-encrypted',
        'all-new-iv',
        'all-new-tag',
      );

      mockInstitutionRepository.findById.mockResolvedValue(existingInstitution);
      mockCryptoService.encrypt.mockReturnValue(encryptedCredentials);

      const updatedInstitution = new InstitutionEntity(
        existingInstitutionId,
        newName,
        newType,
        encryptedCredentials,
        existingInstitution.isConnected,
        existingInstitution.lastSyncedAt,
        existingInstitution.accounts,
        existingInstitution.createdAt,
        new Date(),
      );

      mockInstitutionRepository.update.mockResolvedValue(updatedInstitution);

      const result = await useCase.execute(existingInstitutionId, {
        name: newName,
        type: newType,
        credentials: newCredentials,
      });

      expect(result.name).toBe(newName);
      expect(result.type).toBe(newType);
      expect(result.credentials).toBe(encryptedCredentials);
      expect(mockCryptoService.encrypt).toHaveBeenCalledWith(
        JSON.stringify(newCredentials),
      );
    });

    it('should preserve existing values when fields are not provided', async () => {
      mockInstitutionRepository.findById.mockResolvedValue(existingInstitution);

      const updatedInstitution = new InstitutionEntity(
        existingInstitutionId,
        existingInstitution.name,
        existingInstitution.type,
        existingInstitution.credentials,
        existingInstitution.isConnected,
        existingInstitution.lastSyncedAt,
        existingInstitution.accounts,
        existingInstitution.createdAt,
        new Date(),
      );

      mockInstitutionRepository.update.mockResolvedValue(updatedInstitution);

      const result = await useCase.execute(existingInstitutionId, {});

      expect(result.name).toBe(existingInstitution.name);
      expect(result.type).toBe(existingInstitution.type);
      expect(result.credentials).toBe(existingInstitution.credentials);
      expect(mockCryptoService.encrypt).not.toHaveBeenCalled();
    });

    it('should not update credentials when credentials is undefined', async () => {
      mockInstitutionRepository.findById.mockResolvedValue(existingInstitution);

      const updatedInstitution = new InstitutionEntity(
        existingInstitutionId,
        existingInstitution.name,
        existingInstitution.type,
        existingInstitution.credentials,
        existingInstitution.isConnected,
        existingInstitution.lastSyncedAt,
        existingInstitution.accounts,
        existingInstitution.createdAt,
        new Date(),
      );

      mockInstitutionRepository.update.mockResolvedValue(updatedInstitution);

      const result = await useCase.execute(existingInstitutionId, {
        name: '名前のみ更新',
      });

      expect(result.credentials).toBe(existingInstitution.credentials);
      expect(mockCryptoService.encrypt).not.toHaveBeenCalled();
    });

    it('should update credentials when credentials is empty object', async () => {
      const emptyCredentials = {};
      const encryptedCredentials = new EncryptedCredentials(
        'empty-encrypted',
        'empty-iv',
        'empty-tag',
      );

      mockInstitutionRepository.findById.mockResolvedValue(existingInstitution);
      mockCryptoService.encrypt.mockReturnValue(encryptedCredentials);

      const updatedInstitution = new InstitutionEntity(
        existingInstitutionId,
        existingInstitution.name,
        existingInstitution.type,
        encryptedCredentials,
        existingInstitution.isConnected,
        existingInstitution.lastSyncedAt,
        existingInstitution.accounts,
        existingInstitution.createdAt,
        new Date(),
      );

      mockInstitutionRepository.update.mockResolvedValue(updatedInstitution);

      const result = await useCase.execute(existingInstitutionId, {
        credentials: emptyCredentials,
      });

      expect(mockCryptoService.encrypt).toHaveBeenCalledWith('{}');
      expect(result.credentials).toBe(encryptedCredentials);
    });

    it('should update updatedAt timestamp', async () => {
      const beforeUpdate = new Date();
      mockInstitutionRepository.findById.mockResolvedValue(existingInstitution);

      const afterUpdate = new Date();
      const updatedInstitution = new InstitutionEntity(
        existingInstitutionId,
        existingInstitution.name,
        existingInstitution.type,
        existingInstitution.credentials,
        existingInstitution.isConnected,
        existingInstitution.lastSyncedAt,
        existingInstitution.accounts,
        existingInstitution.createdAt,
        afterUpdate,
      );

      mockInstitutionRepository.update.mockImplementation(
        async (institution) => {
          expect(institution.updatedAt.getTime()).toBeGreaterThanOrEqual(
            beforeUpdate.getTime(),
          );
          return updatedInstitution;
        },
      );

      await useCase.execute(existingInstitutionId, { name: '更新' });

      expect(mockInstitutionRepository.update).toHaveBeenCalled();
    });

    it('should preserve existing connection status and lastSyncedAt', async () => {
      mockInstitutionRepository.findById.mockResolvedValue(existingInstitution);

      const updatedInstitution = new InstitutionEntity(
        existingInstitutionId,
        '新しい名前',
        existingInstitution.type,
        existingInstitution.credentials,
        existingInstitution.isConnected,
        existingInstitution.lastSyncedAt,
        existingInstitution.accounts,
        existingInstitution.createdAt,
        new Date(),
      );

      mockInstitutionRepository.update.mockResolvedValue(updatedInstitution);

      const result = await useCase.execute(existingInstitutionId, {
        name: '新しい名前',
      });

      expect(result.isConnected).toBe(existingInstitution.isConnected);
      expect(result.lastSyncedAt).toBe(existingInstitution.lastSyncedAt);
    });

    it('should preserve existing accounts', async () => {
      const institutionWithAccounts = new InstitutionEntity(
        existingInstitutionId,
        existingInstitution.name,
        existingInstitution.type,
        existingInstitution.credentials,
        existingInstitution.isConnected,
        existingInstitution.lastSyncedAt,
        [{ id: 'account-1', name: '口座1' }],
        existingInstitution.createdAt,
        existingInstitution.updatedAt,
      );

      mockInstitutionRepository.findById.mockResolvedValue(
        institutionWithAccounts,
      );

      const updatedInstitution = new InstitutionEntity(
        existingInstitutionId,
        '新しい名前',
        existingInstitution.type,
        existingInstitution.credentials,
        existingInstitution.isConnected,
        existingInstitution.lastSyncedAt,
        institutionWithAccounts.accounts,
        existingInstitution.createdAt,
        new Date(),
      );

      mockInstitutionRepository.update.mockResolvedValue(updatedInstitution);

      const result = await useCase.execute(existingInstitutionId, {
        name: '新しい名前',
      });

      expect(result.accounts).toEqual(institutionWithAccounts.accounts);
    });

    it('should preserve existing createdAt', async () => {
      const originalCreatedAt = new Date('2020-01-01');
      const institutionWithOriginalDate = new InstitutionEntity(
        existingInstitutionId,
        existingInstitution.name,
        existingInstitution.type,
        existingInstitution.credentials,
        existingInstitution.isConnected,
        existingInstitution.lastSyncedAt,
        existingInstitution.accounts,
        originalCreatedAt,
        existingInstitution.updatedAt,
      );

      mockInstitutionRepository.findById.mockResolvedValue(
        institutionWithOriginalDate,
      );

      const updatedInstitution = new InstitutionEntity(
        existingInstitutionId,
        '新しい名前',
        existingInstitution.type,
        existingInstitution.credentials,
        existingInstitution.isConnected,
        existingInstitution.lastSyncedAt,
        existingInstitution.accounts,
        originalCreatedAt,
        new Date(),
      );

      mockInstitutionRepository.update.mockResolvedValue(updatedInstitution);

      const result = await useCase.execute(existingInstitutionId, {
        name: '新しい名前',
      });

      expect(result.createdAt).toEqual(originalCreatedAt);
    });

    it('should propagate repository errors', async () => {
      mockInstitutionRepository.findById.mockResolvedValue(existingInstitution);
      mockInstitutionRepository.update.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        useCase.execute(existingInstitutionId, { name: '更新' }),
      ).rejects.toThrow('Database error');
    });

    it('should propagate crypto service errors', async () => {
      const newCredentials = { apiKey: 'test-key' };
      mockInstitutionRepository.findById.mockResolvedValue(existingInstitution);
      mockCryptoService.encrypt.mockImplementation(() => {
        throw new Error('Encryption failed');
      });

      await expect(
        useCase.execute(existingInstitutionId, { credentials: newCredentials }),
      ).rejects.toThrow('Encryption failed');
    });

    it('should handle credit card type update', async () => {
      const creditCardInstitution = new InstitutionEntity(
        existingInstitutionId,
        'テストカード',
        InstitutionType.CREDIT_CARD,
        existingInstitution.credentials,
        existingInstitution.isConnected,
        existingInstitution.lastSyncedAt,
        existingInstitution.accounts,
        existingInstitution.createdAt,
        existingInstitution.updatedAt,
      );

      mockInstitutionRepository.findById.mockResolvedValue(
        creditCardInstitution,
      );

      const updatedInstitution = new InstitutionEntity(
        existingInstitutionId,
        '更新されたカード',
        InstitutionType.CREDIT_CARD,
        existingInstitution.credentials,
        existingInstitution.isConnected,
        existingInstitution.lastSyncedAt,
        existingInstitution.accounts,
        existingInstitution.createdAt,
        new Date(),
      );

      mockInstitutionRepository.update.mockResolvedValue(updatedInstitution);

      const result = await useCase.execute(existingInstitutionId, {
        name: '更新されたカード',
      });

      expect(result.type).toBe(InstitutionType.CREDIT_CARD);
    });

    it('should handle securities type update', async () => {
      const securitiesInstitution = new InstitutionEntity(
        existingInstitutionId,
        'テスト証券',
        InstitutionType.SECURITIES,
        existingInstitution.credentials,
        existingInstitution.isConnected,
        existingInstitution.lastSyncedAt,
        existingInstitution.accounts,
        existingInstitution.createdAt,
        existingInstitution.updatedAt,
      );

      mockInstitutionRepository.findById.mockResolvedValue(
        securitiesInstitution,
      );

      const updatedInstitution = new InstitutionEntity(
        existingInstitutionId,
        '更新された証券',
        InstitutionType.SECURITIES,
        existingInstitution.credentials,
        existingInstitution.isConnected,
        existingInstitution.lastSyncedAt,
        existingInstitution.accounts,
        existingInstitution.createdAt,
        new Date(),
      );

      mockInstitutionRepository.update.mockResolvedValue(updatedInstitution);

      const result = await useCase.execute(existingInstitutionId, {
        name: '更新された証券',
      });

      expect(result.type).toBe(InstitutionType.SECURITIES);
    });
  });
});
