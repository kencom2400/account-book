import { NotFoundException } from '@nestjs/common';
import { FetchCreditCardTransactionsUseCase } from './fetch-credit-card-transactions.use-case';
import {
  ICreditCardRepository,
  ICreditCardTransactionRepository,
} from '../../domain/repositories/credit-card.repository.interface';
import { ICreditCardAPIClient } from '../../infrastructure/adapters/credit-card-api.adapter.interface';
import { ICryptoService } from '../../../institution/domain/services/crypto.service.interface';
import {
  createTestCreditCard,
  createTestCreditCardTransaction,
} from '../../../../../test/helpers/credit-card.factory';

describe('FetchCreditCardTransactionsUseCase', () => {
  let useCase: FetchCreditCardTransactionsUseCase;
  let mockCreditCardRepository: jest.Mocked<ICreditCardRepository>;
  let mockTransactionRepository: jest.Mocked<ICreditCardTransactionRepository>;
  let mockAPIClient: jest.Mocked<ICreditCardAPIClient>;
  let mockCryptoService: jest.Mocked<ICryptoService>;

  beforeEach(() => {
    mockCreditCardRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findConnected: jest.fn(),
      findByIssuer: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    mockTransactionRepository = {
      save: jest.fn(),
      saveMany: jest.fn(),
      findById: jest.fn(),
      findByCreditCardId: jest.fn(),
      findByCreditCardIdAndDateRange: jest.fn(),
      findUnpaid: jest.fn(),
      findByMonth: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    mockAPIClient = {
      testConnection: jest.fn(),
      getCardInfo: jest.fn(),
      getTransactions: jest.fn(),
      getPaymentInfo: jest.fn(),
      mapToTransactionEntity: jest.fn(),
      mapToPaymentVO: jest.fn(),
    };

    mockCryptoService = {
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    };

    useCase = new FetchCreditCardTransactionsUseCase(
      mockCreditCardRepository,
      mockTransactionRepository,
      mockAPIClient,
      mockCryptoService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const creditCardId = 'cc_test_123';
    const testCreditCard = createTestCreditCard({
      id: creditCardId,
      isConnected: true,
    });

    it('should fetch transactions successfully', async () => {
      // Arrange
      const testTransactions = [
        createTestCreditCardTransaction({ creditCardId }),
        createTestCreditCardTransaction({ creditCardId, id: 'tx_test_456' }),
      ];

      mockCreditCardRepository.findById.mockResolvedValue(testCreditCard);
      mockTransactionRepository.findByCreditCardIdAndDateRange.mockResolvedValue(
        testTransactions,
      );

      // Act
      const result = await useCase.execute({ creditCardId });

      // Assert
      expect(result).toEqual(testTransactions);
      expect(mockCreditCardRepository.findById).toHaveBeenCalledWith(
        creditCardId,
      );
      expect(
        mockTransactionRepository.findByCreditCardIdAndDateRange,
      ).toHaveBeenCalled();
    });

    it('should throw NotFoundException when credit card does not exist', async () => {
      // Arrange
      mockCreditCardRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute({ creditCardId })).rejects.toThrow(
        NotFoundException,
      );
      await expect(useCase.execute({ creditCardId })).rejects.toThrow(
        `Credit card not found with ID: ${creditCardId}`,
      );
    });

    it('should refresh transactions from API when forceRefresh is true', async () => {
      // Arrange
      const decryptedCredentials = JSON.stringify({
        username: 'test_user',
        password: 'test_password',
      });
      const apiTransactions = [
        { id: 'api_tx_1', amount: 1000 },
        { id: 'api_tx_2', amount: 2000 },
      ];
      const mappedTransactions = [
        createTestCreditCardTransaction({ id: 'mapped_tx_1', creditCardId }),
        createTestCreditCardTransaction({ id: 'mapped_tx_2', creditCardId }),
      ];

      mockCreditCardRepository.findById.mockResolvedValue(testCreditCard);
      mockCryptoService.decrypt.mockReturnValue(decryptedCredentials);
      mockAPIClient.getTransactions.mockResolvedValue(apiTransactions);
      mockAPIClient.mapToTransactionEntity
        .mockReturnValueOnce(mappedTransactions[0])
        .mockReturnValueOnce(mappedTransactions[1]);
      mockTransactionRepository.saveMany.mockResolvedValue(mappedTransactions);
      mockCreditCardRepository.save.mockResolvedValue(testCreditCard);
      mockTransactionRepository.findByCreditCardIdAndDateRange.mockResolvedValue(
        mappedTransactions,
      );

      // Act
      const result = await useCase.execute({
        creditCardId,
        forceRefresh: true,
      });

      // Assert
      expect(result).toEqual(mappedTransactions);
      expect(mockCryptoService.decrypt).toHaveBeenCalledWith(
        testCreditCard.credentials,
      );
      expect(mockAPIClient.getTransactions).toHaveBeenCalled();
      expect(mockTransactionRepository.saveMany).toHaveBeenCalledWith(
        mappedTransactions,
      );
      expect(mockCreditCardRepository.save).toHaveBeenCalled();
    });

    it('should refresh transactions from API when credit card is connected', async () => {
      // Arrange
      const decryptedCredentials = JSON.stringify({
        username: 'test_user',
        password: 'test_password',
      });
      const apiTransactions = [{ id: 'api_tx_1', amount: 1000 }];
      const mappedTransaction = createTestCreditCardTransaction({
        id: 'mapped_tx_1',
        creditCardId,
      });

      mockCreditCardRepository.findById.mockResolvedValue(testCreditCard);
      mockCryptoService.decrypt.mockReturnValue(decryptedCredentials);
      mockAPIClient.getTransactions.mockResolvedValue(apiTransactions);
      mockAPIClient.mapToTransactionEntity.mockReturnValue(mappedTransaction);
      mockTransactionRepository.saveMany.mockResolvedValue([mappedTransaction]);
      mockCreditCardRepository.save.mockResolvedValue(testCreditCard);
      mockTransactionRepository.findByCreditCardIdAndDateRange.mockResolvedValue(
        [mappedTransaction],
      );

      // Act
      const result = await useCase.execute({
        creditCardId,
        forceRefresh: false, // isConnectedがtrueなので自動的にリフレッシュされる
      });

      // Assert
      expect(result).toEqual([mappedTransaction]);
      expect(mockAPIClient.getTransactions).toHaveBeenCalled();
    });

    it('should not refresh transactions when forceRefresh is false and card is not connected', async () => {
      // Arrange
      const disconnectedCard = createTestCreditCard({
        id: creditCardId,
        isConnected: false,
      });
      const localTransactions = [
        createTestCreditCardTransaction({ creditCardId }),
      ];

      mockCreditCardRepository.findById.mockResolvedValue(disconnectedCard);
      mockTransactionRepository.findByCreditCardIdAndDateRange.mockResolvedValue(
        localTransactions,
      );

      // Act
      const result = await useCase.execute({
        creditCardId,
        forceRefresh: false,
      });

      // Assert
      expect(result).toEqual(localTransactions);
      expect(mockAPIClient.getTransactions).not.toHaveBeenCalled();
      expect(mockCreditCardRepository.save).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully and return local data', async () => {
      // Arrange
      const decryptedCredentials = JSON.stringify({
        username: 'test_user',
        password: 'test_password',
      });
      const localTransactions = [
        createTestCreditCardTransaction({ creditCardId }),
      ];

      mockCreditCardRepository.findById.mockResolvedValue(testCreditCard);
      mockCryptoService.decrypt.mockReturnValue(decryptedCredentials);
      mockAPIClient.getTransactions.mockRejectedValue(
        new Error('API connection failed'),
      );
      mockTransactionRepository.findByCreditCardIdAndDateRange.mockResolvedValue(
        localTransactions,
      );

      // Act
      const result = await useCase.execute({
        creditCardId,
        forceRefresh: true,
      });

      // Assert
      expect(result).toEqual(localTransactions);
      expect(mockTransactionRepository.saveMany).not.toHaveBeenCalled();
      expect(mockCreditCardRepository.save).not.toHaveBeenCalled();
    });

    it('should use provided date range', async () => {
      // Arrange
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const testTransactions = [
        createTestCreditCardTransaction({ creditCardId }),
      ];

      mockCreditCardRepository.findById.mockResolvedValue(
        createTestCreditCard({ id: creditCardId, isConnected: false }),
      );
      mockTransactionRepository.findByCreditCardIdAndDateRange.mockResolvedValue(
        testTransactions,
      );

      // Act
      await useCase.execute({ creditCardId, startDate, endDate });

      // Assert
      expect(
        mockTransactionRepository.findByCreditCardIdAndDateRange,
      ).toHaveBeenCalledWith(creditCardId, startDate, endDate);
    });

    describe('AbortSignal support', () => {
      it('should throw error when abortSignal is already aborted at the start', async () => {
        // Arrange
        const abortController = new AbortController();
        abortController.abort();

        // Act & Assert
        await expect(
          useCase.execute({
            creditCardId,
            abortSignal: abortController.signal,
          }),
        ).rejects.toThrow('Transaction fetch was cancelled');

        // リポジトリは呼ばれていないことを確認
        expect(mockCreditCardRepository.findById).not.toHaveBeenCalled();
      });

      it('should throw error when abortSignal is aborted after credit card lookup', async () => {
        // Arrange
        const abortController = new AbortController();

        mockCreditCardRepository.findById.mockImplementation(async () => {
          // クレジットカード検索後にキャンセル
          abortController.abort();
          return testCreditCard;
        });

        // Act & Assert
        await expect(
          useCase.execute({
            creditCardId,
            abortSignal: abortController.signal,
          }),
        ).rejects.toThrow('Transaction fetch was cancelled');

        // クレジットカードの検索は呼ばれているが、取引取得は呼ばれていない
        expect(mockCreditCardRepository.findById).toHaveBeenCalledWith(
          creditCardId,
        );
        expect(
          mockTransactionRepository.findByCreditCardIdAndDateRange,
        ).not.toHaveBeenCalled();
      });

      it('should complete successfully when abortSignal is not aborted', async () => {
        // Arrange
        const abortController = new AbortController();
        const testTransactions = [
          createTestCreditCardTransaction({ creditCardId }),
        ];

        mockCreditCardRepository.findById.mockResolvedValue(
          createTestCreditCard({ id: creditCardId, isConnected: false }),
        );
        mockTransactionRepository.findByCreditCardIdAndDateRange.mockResolvedValue(
          testTransactions,
        );

        // Act
        const result = await useCase.execute({
          creditCardId,
          abortSignal: abortController.signal,
        });

        // Assert
        expect(result).toEqual(testTransactions);
        expect(mockCreditCardRepository.findById).toHaveBeenCalled();
        expect(
          mockTransactionRepository.findByCreditCardIdAndDateRange,
        ).toHaveBeenCalled();
      });

      it('should work without abortSignal (backward compatibility)', async () => {
        // Arrange
        const testTransactions = [
          createTestCreditCardTransaction({ creditCardId }),
        ];

        mockCreditCardRepository.findById.mockResolvedValue(
          createTestCreditCard({ id: creditCardId, isConnected: false }),
        );
        mockTransactionRepository.findByCreditCardIdAndDateRange.mockResolvedValue(
          testTransactions,
        );

        // Act
        const result = await useCase.execute({ creditCardId });

        // Assert
        expect(result).toEqual(testTransactions);
        expect(mockCreditCardRepository.findById).toHaveBeenCalled();
      });
    });
  });
});
