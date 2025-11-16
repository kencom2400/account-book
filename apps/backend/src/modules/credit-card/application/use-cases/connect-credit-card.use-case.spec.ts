import { ConnectCreditCardUseCase } from '../connect-credit-card.use-case';
import {
  ICreditCardRepository,
  ICreditCardTransactionRepository,
} from '../../../domain/repositories/credit-card.repository.interface';
import { ICreditCardAPIClient } from '../../../infrastructure/adapters/credit-card-api.adapter.interface';
import { ICryptoService } from '../../../../institution/domain/services/crypto.service.interface';
import {
  createTestCreditCard,
  createTestEncryptedCredentials,
  createTestCreditCardTransaction,
} from '../../../../../../test/helpers/credit-card.factory';

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
      await expect(useCase.execute(input)).rejects.toThrow(
        'Failed to connect to credit card API',
      );

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

      mockCryptoService.encrypt.mockResolvedValue(encryptedCredentials);
      mockAPIClient.testConnection.mockResolvedValue({ success: true });
      mockAPIClient.getCardInfo.mockResolvedValue(cardInfo);
      mockAPIClient.getTransactions.mockRejectedValue(
        new Error('API error'),
      );
      mockCreditCardRepository.save.mockImplementation((card) =>
        Promise.resolve(card),
      );

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.cardName).toBe('テストカード');
      expect(mockCreditCardRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});

