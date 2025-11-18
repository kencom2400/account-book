import { BadGatewayException } from '@nestjs/common';
import { ConnectCreditCardUseCase } from './connect-credit-card.use-case';
import {
  ICreditCardRepository,
  ICreditCardTransactionRepository,
} from '../../domain/repositories/credit-card.repository.interface';
import { ICreditCardAPIClient } from '../../infrastructure/adapters/credit-card-api.adapter.interface';
import { ICryptoService } from '../../../institution/domain/services/crypto.service.interface';
import {
  createTestEncryptedCredentials,
  createTestCreditCardTransaction,
} from '../../../../../test/helpers/credit-card.factory';

describe('ConnectCreditCardUseCase', () => {
  let useCase: ConnectCreditCardUseCase;
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

    useCase = new ConnectCreditCardUseCase(
      mockCreditCardRepository,
      mockTransactionRepository,
      mockAPIClient,
      mockCryptoService,
    );
  });

  describe('execute', () => {
    it('should connect credit card successfully', async () => {
      // Arrange
      const input = {
        cardName: 'テストカード',
        cardNumber: '1234',
        cardHolderName: '山田太郎',
        expiryDate: new Date('2030-12-31'),
        username: 'test_user',
        password: 'test_password',
        issuer: 'テスト銀行',
        paymentDay: 27,
        closingDay: 15,
      };

      const encryptedCredentials = createTestEncryptedCredentials();
      const cardInfo = {
        cardNumber: '1234',
        creditLimit: 500000,
        currentBalance: 125000,
        availableCredit: 375000,
      };

      mockCryptoService.encrypt.mockResolvedValue(encryptedCredentials);
      mockAPIClient.testConnection.mockResolvedValue({ success: true });
      mockAPIClient.getCardInfo.mockResolvedValue(cardInfo);
      mockAPIClient.getTransactions.mockResolvedValue([]);
      mockCreditCardRepository.save.mockImplementation((card) =>
        Promise.resolve(card),
      );

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.cardName).toBe('テストカード');
      expect(result.cardNumber).toBe('1234');
      expect(result.creditLimit).toBe(500000);
      expect(result.currentBalance).toBe(125000);
      expect(result.issuer).toBe('テスト銀行');

      expect(mockCryptoService.encrypt).toHaveBeenCalledTimes(1);
      expect(mockAPIClient.testConnection).toHaveBeenCalledTimes(1);
      expect(mockAPIClient.getCardInfo).toHaveBeenCalledTimes(1);
      expect(mockCreditCardRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw error when API connection fails', async () => {
      // Arrange
      const input = {
        cardName: 'テストカード',
        cardNumber: '1234',
        cardHolderName: '山田太郎',
        expiryDate: new Date('2030-12-31'),
        username: 'test_user',
        password: 'wrong_password',
        issuer: 'テスト銀行',
        paymentDay: 27,
        closingDay: 15,
      };

      const encryptedCredentials = createTestEncryptedCredentials();
      mockCryptoService.encrypt.mockResolvedValue(encryptedCredentials);
      mockAPIClient.testConnection.mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(BadGatewayException);

      expect(mockCryptoService.encrypt).toHaveBeenCalledTimes(1);
      expect(mockAPIClient.testConnection).toHaveBeenCalledTimes(1);
      expect(mockAPIClient.getCardInfo).not.toHaveBeenCalled();
      expect(mockCreditCardRepository.save).not.toHaveBeenCalled();
    });

    it('should fetch initial transactions after successful connection', async () => {
      // Arrange
      const input = {
        cardName: 'テストカード',
        cardNumber: '1234',
        cardHolderName: '山田太郎',
        expiryDate: new Date('2030-12-31'),
        username: 'test_user',
        password: 'test_password',
        issuer: 'テスト銀行',
        paymentDay: 27,
        closingDay: 15,
      };

      const encryptedCredentials = createTestEncryptedCredentials();
      const cardInfo = {
        cardNumber: '1234',
        creditLimit: 500000,
        currentBalance: 125000,
        availableCredit: 375000,
      };

      const mockAPITransactions = [
        {
          id: 'tx_1',
          date: new Date(),
          postingDate: new Date(),
          amount: 5000,
          merchantName: 'テストストア',
          merchantCategory: 'スーパー',
          description: 'カード利用',
          isInstallment: false,
        },
      ];

      const mockTransaction = createTestCreditCardTransaction();

      mockCryptoService.encrypt.mockResolvedValue(encryptedCredentials);
      mockAPIClient.testConnection.mockResolvedValue({ success: true });
      mockAPIClient.getCardInfo.mockResolvedValue(cardInfo);
      mockAPIClient.getTransactions.mockResolvedValue(mockAPITransactions);
      mockAPIClient.mapToTransactionEntity.mockReturnValue(mockTransaction);
      mockTransactionRepository.saveMany.mockResolvedValue([mockTransaction]);
      mockCreditCardRepository.save.mockImplementation((card) =>
        Promise.resolve(card),
      );

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toBeDefined();
      expect(mockAPIClient.getTransactions).toHaveBeenCalledTimes(1);
      expect(mockAPIClient.mapToTransactionEntity).toHaveBeenCalledTimes(1);
      expect(mockTransactionRepository.saveMany).toHaveBeenCalledTimes(1);
      expect(mockTransactionRepository.saveMany).toHaveBeenCalledWith([
        mockTransaction,
      ]);
    });

    it('should continue even if initial transaction fetch fails', async () => {
      // Arrange
      const input = {
        cardName: 'テストカード',
        cardNumber: '1234',
        cardHolderName: '山田太郎',
        expiryDate: new Date('2030-12-31'),
        username: 'test_user',
        password: 'test_password',
        issuer: 'テスト銀行',
        paymentDay: 27,
        closingDay: 15,
      };

      const encryptedCredentials = createTestEncryptedCredentials();
      const cardInfo = {
        cardNumber: '1234',
        creditLimit: 500000,
        currentBalance: 125000,
        availableCredit: 375000,
      };

      // 意図的なエラーテストのため、ログ出力を抑制
      const warnSpy = jest
        .spyOn(useCase['logger'], 'warn')
        .mockImplementation();

      mockCryptoService.encrypt.mockResolvedValue(encryptedCredentials);
      mockAPIClient.testConnection.mockResolvedValue({ success: true });
      mockAPIClient.getCardInfo.mockResolvedValue(cardInfo);
      mockAPIClient.getTransactions.mockRejectedValue(new Error('API error'));
      mockCreditCardRepository.save.mockImplementation((card) =>
        Promise.resolve(card),
      );

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.cardName).toBe('テストカード');
      expect(mockCreditCardRepository.save).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch initial transactions'),
        expect.anything(),
      );

      warnSpy.mockRestore();
    });
  });

  describe('fetchInitialTransactions - 月末日の限界値テスト', () => {
    const setupMocks = () => {
      const encryptedCredentials = createTestEncryptedCredentials();
      const cardInfo = {
        cardNumber: '1234',
        creditLimit: 500000,
        currentBalance: 125000,
        availableCredit: 375000,
      };

      mockCryptoService.encrypt.mockResolvedValue(encryptedCredentials);
      mockAPIClient.testConnection.mockResolvedValue({ success: true });
      mockAPIClient.getCardInfo.mockResolvedValue(cardInfo);
      mockAPIClient.getTransactions.mockResolvedValue([]);
      mockCreditCardRepository.save.mockImplementation((card) =>
        Promise.resolve(card),
      );
    };

    const createInput = () => ({
      cardName: 'テストカード',
      cardNumber: '1234',
      cardHolderName: '山田太郎',
      expiryDate: new Date('2030-12-31'),
      username: 'test_user',
      password: 'test_password',
      issuer: 'テスト銀行',
      paymentDay: 27,
      closingDay: 15,
    });

    it('should correctly calculate 6 months ago from January 31st', async () => {
      // Arrange
      setupMocks();
      const input = createInput();
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-31T12:00:00Z'));

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockAPIClient.getTransactions).toHaveBeenCalledTimes(1);
      const callArgs = mockAPIClient.getTransactions.mock.calls[0];
      const startDate = callArgs[1];
      const endDate = callArgs[2];

      // 2025-01-31の6ヶ月前は2024-07-31
      expect(startDate.getFullYear()).toBe(2024);
      expect(startDate.getMonth()).toBe(6); // July (0-indexed)
      expect(startDate.getDate()).toBe(31);
      expect(endDate.getFullYear()).toBe(2025);
      expect(endDate.getMonth()).toBe(0); // January (0-indexed)
      expect(endDate.getDate()).toBe(31);

      jest.useRealTimers();
    });

    it('should correctly calculate 6 months ago from March 31st', async () => {
      // Arrange
      setupMocks();
      const input = createInput();
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-03-31T12:00:00Z'));

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockAPIClient.getTransactions).toHaveBeenCalledTimes(1);
      const callArgs = mockAPIClient.getTransactions.mock.calls[0];
      const startDate = callArgs[1];
      const endDate = callArgs[2];

      // 2025-03-31の6ヶ月前は2024-09-30 (Septemberは30日まで)
      expect(startDate.getFullYear()).toBe(2024);
      expect(startDate.getMonth()).toBe(8); // September (0-indexed)
      expect(startDate.getDate()).toBe(30);
      expect(endDate.getFullYear()).toBe(2025);
      expect(endDate.getMonth()).toBe(2); // March (0-indexed)
      expect(endDate.getDate()).toBe(31);

      jest.useRealTimers();
    });

    it('should correctly calculate 6 months ago from October 31st', async () => {
      // Arrange
      setupMocks();
      const input = createInput();
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-10-31T12:00:00Z'));

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockAPIClient.getTransactions).toHaveBeenCalledTimes(1);
      const callArgs = mockAPIClient.getTransactions.mock.calls[0];
      const startDate = callArgs[1];
      const endDate = callArgs[2];

      // 2024-10-31の6ヶ月前は2024-04-30 (Aprilは30日まで)
      expect(startDate.getFullYear()).toBe(2024);
      expect(startDate.getMonth()).toBe(3); // April (0-indexed)
      expect(startDate.getDate()).toBe(30);
      expect(endDate.getFullYear()).toBe(2024);
      expect(endDate.getMonth()).toBe(9); // October (0-indexed)
      expect(endDate.getDate()).toBe(31);

      jest.useRealTimers();
    });

    it('should correctly calculate 6 months ago from August 31st', async () => {
      // Arrange
      setupMocks();
      const input = createInput();
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-08-31T12:00:00Z'));

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockAPIClient.getTransactions).toHaveBeenCalledTimes(1);
      const callArgs = mockAPIClient.getTransactions.mock.calls[0];
      const startDate = callArgs[1];
      const endDate = callArgs[2];

      // 2024-08-31の6ヶ月前は2024-02-29 (2024年は閏年)
      expect(startDate.getFullYear()).toBe(2024);
      expect(startDate.getMonth()).toBe(1); // February (0-indexed)
      expect(startDate.getDate()).toBe(29);
      expect(endDate.getFullYear()).toBe(2024);
      expect(endDate.getMonth()).toBe(7); // August (0-indexed)
      expect(endDate.getDate()).toBe(31);

      jest.useRealTimers();
    });

    it('should correctly calculate 6 months ago from August 31st in non-leap year', async () => {
      // Arrange
      setupMocks();
      const input = createInput();
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-08-31T12:00:00Z'));

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockAPIClient.getTransactions).toHaveBeenCalledTimes(1);
      const callArgs = mockAPIClient.getTransactions.mock.calls[0];
      const startDate = callArgs[1];
      const endDate = callArgs[2];

      // 2025-08-31の6ヶ月前は2025-02-28 (2025年は平年)
      expect(startDate.getFullYear()).toBe(2025);
      expect(startDate.getMonth()).toBe(1); // February (0-indexed)
      expect(startDate.getDate()).toBe(28);
      expect(endDate.getFullYear()).toBe(2025);
      expect(endDate.getMonth()).toBe(7); // August (0-indexed)
      expect(endDate.getDate()).toBe(31);

      jest.useRealTimers();
    });

    it('should correctly calculate 6 months ago from September 30th', async () => {
      // Arrange
      setupMocks();
      const input = createInput();
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-09-30T12:00:00Z'));

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockAPIClient.getTransactions).toHaveBeenCalledTimes(1);
      const callArgs = mockAPIClient.getTransactions.mock.calls[0];
      const startDate = callArgs[1];
      const endDate = callArgs[2];

      // 2024-09-30の6ヶ月前は2024-03-30
      expect(startDate.getFullYear()).toBe(2024);
      expect(startDate.getMonth()).toBe(2); // March (0-indexed)
      expect(startDate.getDate()).toBe(30);
      expect(endDate.getFullYear()).toBe(2024);
      expect(endDate.getMonth()).toBe(8); // September (0-indexed)
      expect(endDate.getDate()).toBe(30);

      jest.useRealTimers();
    });

    it('should correctly calculate 6 months ago from February 28th in non-leap year', async () => {
      // Arrange
      setupMocks();
      const input = createInput();
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-28T12:00:00Z'));

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockAPIClient.getTransactions).toHaveBeenCalledTimes(1);
      const callArgs = mockAPIClient.getTransactions.mock.calls[0];
      const startDate = callArgs[1];
      const endDate = callArgs[2];

      // 2025-02-28の6ヶ月前は2024-08-28
      expect(startDate.getFullYear()).toBe(2024);
      expect(startDate.getMonth()).toBe(7); // August (0-indexed)
      expect(startDate.getDate()).toBe(28);
      expect(endDate.getFullYear()).toBe(2025);
      expect(endDate.getMonth()).toBe(1); // February (0-indexed)
      expect(endDate.getDate()).toBe(28);

      jest.useRealTimers();
    });

    it('should correctly calculate 6 months ago from February 29th in leap year', async () => {
      // Arrange
      setupMocks();
      const input = createInput();
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-02-29T12:00:00Z'));

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockAPIClient.getTransactions).toHaveBeenCalledTimes(1);
      const callArgs = mockAPIClient.getTransactions.mock.calls[0];
      const startDate = callArgs[1];
      const endDate = callArgs[2];

      // 2024-02-29の6ヶ月前は2023-08-29
      expect(startDate.getFullYear()).toBe(2023);
      expect(startDate.getMonth()).toBe(7); // August (0-indexed)
      expect(startDate.getDate()).toBe(29);
      expect(endDate.getFullYear()).toBe(2024);
      expect(endDate.getMonth()).toBe(1); // February (0-indexed)
      expect(endDate.getDate()).toBe(29);

      jest.useRealTimers();
    });
  });
});
