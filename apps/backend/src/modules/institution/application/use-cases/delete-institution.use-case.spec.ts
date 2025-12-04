import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DeleteInstitutionUseCase } from './delete-institution.use-case';
import type { IInstitutionRepository } from '../../domain/repositories/institution.repository.interface';
import type { ITransactionRepository } from '../../../transaction/domain/repositories/transaction.repository.interface';
import { InstitutionEntity } from '../../domain/entities/institution.entity';
import { EncryptedCredentials } from '../../domain/value-objects/encrypted-credentials.vo';
import { InstitutionType } from '@account-book/types';
import { INSTITUTION_REPOSITORY } from '../../institution.tokens';
import { TRANSACTION_REPOSITORY } from '../../../transaction/domain/repositories/transaction.repository.interface';

describe('DeleteInstitutionUseCase', () => {
  let useCase: DeleteInstitutionUseCase;
  let mockInstitutionRepository: jest.Mocked<IInstitutionRepository>;
  let mockTransactionRepository: jest.Mocked<ITransactionRepository>;
  let mockDataSource: any;

  const mockInstitution = new InstitutionEntity(
    'test-id',
    'テスト銀行',
    InstitutionType.BANK,
    new EncryptedCredentials('encrypted', 'iv', 'authTag'),
    true,
    new Date(),
    [],
    new Date(),
    new Date(),
  );

  beforeEach(async () => {
    mockInstitutionRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      findAll: jest.fn(),
      findByType: jest.fn(),
      findByConnectionStatus: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteAll: jest.fn(),
    } as any;

    mockTransactionRepository = {
      findById: jest.fn(),
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
    } as any;

    // DataSourceのモックを作成
    const mockEntityManager = {} as unknown;
    mockDataSource = {
      transaction: jest.fn().mockImplementation(async (callback) => {
        return await callback(mockEntityManager);
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteInstitutionUseCase,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: INSTITUTION_REPOSITORY,
          useValue: mockInstitutionRepository,
        },
        {
          provide: TRANSACTION_REPOSITORY,
          useValue: mockTransactionRepository,
        },
      ],
    }).compile();

    useCase = module.get<DeleteInstitutionUseCase>(DeleteInstitutionUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should throw NotFoundException when institution does not exist', async () => {
      mockInstitutionRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockInstitutionRepository.findById).toHaveBeenCalledWith(
        'non-existent-id',
      );
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });

    it('should delete institution without deleting transactions', async () => {
      mockInstitutionRepository.findById.mockResolvedValue(mockInstitution);

      await useCase.execute('test-id', { deleteTransactions: false });

      expect(mockInstitutionRepository.findById).toHaveBeenCalledWith(
        'test-id',
      );
      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(
        mockTransactionRepository.deleteByInstitutionId,
      ).not.toHaveBeenCalled();
    });

    it('should delete institution with transactions when deleteTransactions is true', async () => {
      mockInstitutionRepository.findById.mockResolvedValue(mockInstitution);

      await useCase.execute('test-id', { deleteTransactions: true });

      expect(mockInstitutionRepository.findById).toHaveBeenCalledWith(
        'test-id',
      );
      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(
        mockTransactionRepository.deleteByInstitutionId,
      ).toHaveBeenCalled();
    });

    it('should delete institution without transactions when deleteTransactions is undefined', async () => {
      mockInstitutionRepository.findById.mockResolvedValue(mockInstitution);

      await useCase.execute('test-id');

      expect(mockInstitutionRepository.findById).toHaveBeenCalledWith(
        'test-id',
      );
      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(
        mockTransactionRepository.deleteByInstitutionId,
      ).not.toHaveBeenCalled();
    });

    it('should rollback transaction when delete fails', async () => {
      mockInstitutionRepository.findById.mockResolvedValue(mockInstitution);

      const deleteError = new Error('Delete failed');
      mockInstitutionRepository.delete.mockRejectedValue(deleteError);

      await expect(
        useCase.execute('test-id', { deleteTransactions: true }),
      ).rejects.toThrow('Delete failed');

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(
        mockTransactionRepository.deleteByInstitutionId,
      ).toHaveBeenCalled();
      expect(mockInstitutionRepository.delete).toHaveBeenCalled();
    });
  });
});
