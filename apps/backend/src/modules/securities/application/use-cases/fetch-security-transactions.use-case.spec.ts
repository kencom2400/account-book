import { NotFoundException } from '@nestjs/common';
import { FetchSecurityTransactionsUseCase } from './fetch-security-transactions.use-case';
import {
  ISecuritiesAccountRepository,
  ISecurityTransactionRepository,
} from '../../domain/repositories/securities.repository.interface';
import { ISecuritiesAPIClient } from '../../infrastructure/adapters/securities-api.adapter.interface';
import { ICryptoService } from '../../../institution/domain/services/crypto.service.interface';
import {
  createTestSecuritiesAccount,
  createTestSecurityTransaction,
} from '../../../../../test/helpers/securities.factory';
import { DataSource } from 'typeorm';

describe('FetchSecurityTransactionsUseCase', () => {
  let useCase: FetchSecurityTransactionsUseCase;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockAccountRepository: jest.Mocked<ISecuritiesAccountRepository>;
  let mockTransactionRepository: jest.Mocked<ISecurityTransactionRepository>;
  let mockAPIClient: jest.Mocked<ISecuritiesAPIClient>;
  let mockCryptoService: jest.Mocked<ICryptoService>;

  beforeEach(() => {
    mockDataSource = {
      transaction: jest.fn(),
    } as any;

    mockAccountRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByConnectionStatus: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    mockTransactionRepository = {
      create: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      findById: jest.fn(),
      findByAccountId: jest.fn(),
      findByAccountIdAndDateRange: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    mockAPIClient = {
      testConnection: jest.fn(),
      getAccountInfo: jest.fn(),
      getTransactions: jest.fn(),
      getHoldings: jest.fn(),
      mapToTransactionEntity: jest.fn(),
      mapToHoldingEntity: jest.fn(),
    };

    mockCryptoService = {
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    };

    useCase = new FetchSecurityTransactionsUseCase(
      mockDataSource,
      mockAccountRepository,
      mockTransactionRepository,
      mockAPIClient,
      mockCryptoService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const accountId = 'sec_account_test_123';
    const testAccount = createTestSecuritiesAccount({
      id: accountId,
      isConnected: true,
    });

    it('should fetch transactions successfully', async () => {
      // Arrange
      const testTransactions = [
        createTestSecurityTransaction({ securitiesAccountId: accountId }),
        createTestSecurityTransaction({
          securitiesAccountId: accountId,
          id: 'sec_tx_test_456',
        }),
      ];

      mockAccountRepository.findById.mockResolvedValue(testAccount);
      mockTransactionRepository.findByAccountId.mockResolvedValue(
        testTransactions,
      );

      // Act
      const result = await useCase.execute({ accountId });

      // Assert
      expect(result).toEqual(testTransactions);
      expect(mockAccountRepository.findById).toHaveBeenCalledWith(accountId);
      expect(mockTransactionRepository.findByAccountId).toHaveBeenCalledWith(
        accountId,
      );
    });

    it('should throw NotFoundException when securities account does not exist', async () => {
      // Arrange
      mockAccountRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute({ accountId })).rejects.toThrow(
        NotFoundException,
      );
      await expect(useCase.execute({ accountId })).rejects.toThrow(
        `Securities account not found: ${accountId}`,
      );
    });

    it('should fetch transactions with date range', async () => {
      // Arrange
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const testTransactions = [
        createTestSecurityTransaction({ securitiesAccountId: accountId }),
      ];

      mockAccountRepository.findById.mockResolvedValue(testAccount);
      mockTransactionRepository.findByAccountIdAndDateRange.mockResolvedValue(
        testTransactions,
      );

      // Act
      const result = await useCase.execute({ accountId, startDate, endDate });

      // Assert
      expect(result).toEqual(testTransactions);
      expect(
        mockTransactionRepository.findByAccountIdAndDateRange,
      ).toHaveBeenCalledWith(accountId, startDate, endDate);
      expect(mockTransactionRepository.findByAccountId).not.toHaveBeenCalled();
    });

    it('should refresh transactions from API when forceRefresh is true', async () => {
      // Arrange
      const decryptedCredentials = JSON.stringify({
        loginId: 'test_user',
        password: 'test_password',
      });
      const apiTransactions = [
        { id: 'api_tx_1', securityCode: '7203', securityName: 'トヨタ' },
        { id: 'api_tx_2', securityCode: '9984', securityName: 'ソフトバンク' },
      ];
      const mappedTransactions = [
        createTestSecurityTransaction({
          id: 'mapped_tx_1',
          securitiesAccountId: accountId,
        }),
        createTestSecurityTransaction({
          id: 'mapped_tx_2',
          securitiesAccountId: accountId,
        }),
      ];

      mockAccountRepository.findById.mockResolvedValue(testAccount);
      mockCryptoService.decrypt.mockReturnValue(decryptedCredentials);
      mockAPIClient.getTransactions.mockResolvedValue(apiTransactions);
      mockAPIClient.mapToTransactionEntity
        .mockReturnValueOnce(mappedTransactions[0])
        .mockReturnValueOnce(mappedTransactions[1]);

      // transactionメソッドのモック（実際には渡されたコールバックを直接実行）
      mockDataSource.transaction.mockImplementation(
        async (callback: any) => await callback(mockDataSource),
      );
      mockTransactionRepository.saveMany.mockResolvedValue(mappedTransactions);
      mockTransactionRepository.findByAccountId.mockResolvedValue(
        mappedTransactions,
      );

      // Act
      const result = await useCase.execute({
        accountId,
        forceRefresh: true,
      });

      // Assert
      expect(result).toEqual(mappedTransactions);
      expect(mockCryptoService.decrypt).toHaveBeenCalledWith(
        testAccount.credentials,
      );
      expect(mockAPIClient.getTransactions).toHaveBeenCalled();
      expect(mockDataSource.transaction).toHaveBeenCalled();
    });

    it('should not refresh transactions when forceRefresh is false', async () => {
      // Arrange
      const localTransactions = [
        createTestSecurityTransaction({ securitiesAccountId: accountId }),
      ];

      mockAccountRepository.findById.mockResolvedValue(testAccount);
      mockTransactionRepository.findByAccountId.mockResolvedValue(
        localTransactions,
      );

      // Act
      const result = await useCase.execute({
        accountId,
        forceRefresh: false,
      });

      // Assert
      expect(result).toEqual(localTransactions);
      expect(mockCryptoService.decrypt).not.toHaveBeenCalled();
      expect(mockAPIClient.getTransactions).not.toHaveBeenCalled();
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });

    describe('AbortSignal support', () => {
      it('should throw error when abortSignal is already aborted at the start', async () => {
        // Arrange
        const abortController = new AbortController();
        abortController.abort();

        // Act & Assert
        await expect(
          useCase.execute({
            accountId,
            abortSignal: abortController.signal,
          }),
        ).rejects.toThrow('Transaction fetch was cancelled');

        // リポジトリは呼ばれていないことを確認
        expect(mockAccountRepository.findById).not.toHaveBeenCalled();
      });

      it('should throw error when abortSignal is aborted after account lookup', async () => {
        // Arrange
        const abortController = new AbortController();

        mockAccountRepository.findById.mockImplementation(async () => {
          // 口座検索後にキャンセル
          abortController.abort();
          return testAccount;
        });

        // Act & Assert
        await expect(
          useCase.execute({
            accountId,
            abortSignal: abortController.signal,
          }),
        ).rejects.toThrow('Transaction fetch was cancelled');

        // 口座の検索は呼ばれているが、取引取得は呼ばれていない
        expect(mockAccountRepository.findById).toHaveBeenCalledWith(accountId);
        expect(
          mockTransactionRepository.findByAccountId,
        ).not.toHaveBeenCalled();
      });

      it('should complete successfully when abortSignal is not aborted', async () => {
        // Arrange
        const abortController = new AbortController();
        const testTransactions = [
          createTestSecurityTransaction({ securitiesAccountId: accountId }),
        ];

        mockAccountRepository.findById.mockResolvedValue(testAccount);
        mockTransactionRepository.findByAccountId.mockResolvedValue(
          testTransactions,
        );

        // Act
        const result = await useCase.execute({
          accountId,
          abortSignal: abortController.signal,
        });

        // Assert
        expect(result).toEqual(testTransactions);
        expect(mockAccountRepository.findById).toHaveBeenCalled();
        expect(mockTransactionRepository.findByAccountId).toHaveBeenCalled();
      });

      it('should work without abortSignal (backward compatibility)', async () => {
        // Arrange
        const testTransactions = [
          createTestSecurityTransaction({ securitiesAccountId: accountId }),
        ];

        mockAccountRepository.findById.mockResolvedValue(testAccount);
        mockTransactionRepository.findByAccountId.mockResolvedValue(
          testTransactions,
        );

        // Act
        const result = await useCase.execute({ accountId });

        // Assert
        expect(result).toEqual(testTransactions);
        expect(mockAccountRepository.findById).toHaveBeenCalled();
      });
    });

    it('should handle empty transactions array', async () => {
      // Arrange
      mockAccountRepository.findById.mockResolvedValue(testAccount);
      mockTransactionRepository.findByAccountId.mockResolvedValue([]);

      // Act
      const result = await useCase.execute({ accountId });

      // Assert
      expect(result).toEqual([]);
      expect(mockAccountRepository.findById).toHaveBeenCalled();
    });
  });
});
