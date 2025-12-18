import { Test, TestingModule } from '@nestjs/testing';
import { TestCreditCardConnectionUseCase } from './test-credit-card-connection.use-case';
import { CREDIT_CARD_API_CLIENT } from '../../credit-card.tokens';
import type { ICreditCardAPIClient } from '../../infrastructure/adapters/credit-card-api.adapter.interface';

describe('TestCreditCardConnectionUseCase', () => {
  let useCase: TestCreditCardConnectionUseCase;
  let mockAPIClient: jest.Mocked<ICreditCardAPIClient>;

  beforeEach(async () => {
    mockAPIClient = {
      testConnection: jest.fn(),
      getCardInfo: jest.fn(),
      getTransactions: jest.fn(),
      getPaymentInfo: jest.fn(),
      mapToTransactionEntity: jest.fn(),
      mapToPaymentVO: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestCreditCardConnectionUseCase,
        {
          provide: CREDIT_CARD_API_CLIENT,
          useValue: mockAPIClient,
        },
      ],
    }).compile();

    module.useLogger(false);

    useCase = module.get<TestCreditCardConnectionUseCase>(
      TestCreditCardConnectionUseCase,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const mockDto = {
      cardNumber: '1234567890123456',
      cardHolderName: 'TARO YAMADA',
      expiryDate: '2025-12-31',
      username: 'test@example.com',
      password: 'password123',
      issuer: 'テストカード',
      apiKey: 'test-api-key',
    };

    it('should return success result when connection test succeeds', async () => {
      // Arrange
      const mockCardInfo = {
        cardNumber: '3456',
        creditLimit: 500000,
        currentBalance: 125000,
        availableCredit: 375000,
      };

      mockAPIClient.testConnection.mockResolvedValue({ success: true });
      mockAPIClient.getCardInfo.mockResolvedValue(mockCardInfo);

      // Act
      const result = await useCase.execute(mockDto);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('接続に成功しました');
      expect(result.cardInfo).toBeDefined();
      expect(result.cardInfo?.cardName).toBe('テストカード');
      expect(result.cardInfo?.cardNumber).toBe('3456');
      expect(result.cardInfo?.cardHolderName).toBe('TARO YAMADA');
      expect(result.cardInfo?.expiryDate).toBe('2025-12-31');
      expect(result.cardInfo?.issuer).toBe('テストカード');
      expect(result.errorCode).toBeUndefined();

      expect(mockAPIClient.testConnection).toHaveBeenCalledWith({
        cardNumber: '1234567890123456',
        cardHolderName: 'TARO YAMADA',
        expiryDate: '2025-12-31',
        username: 'test@example.com',
        password: 'password123',
        apiKey: 'test-api-key',
      });
      expect(mockAPIClient.getCardInfo).toHaveBeenCalledWith({
        cardNumber: '1234567890123456',
        cardHolderName: 'TARO YAMADA',
        expiryDate: '2025-12-31',
        username: 'test@example.com',
        password: 'password123',
        apiKey: 'test-api-key',
      });
    });

    it('should return success result when connection test succeeds without apiKey', async () => {
      // Arrange
      const dtoWithoutApiKey = {
        ...mockDto,
        apiKey: undefined,
      };
      const mockCardInfo = {
        cardNumber: '3456',
        creditLimit: 500000,
        currentBalance: 125000,
        availableCredit: 375000,
      };

      mockAPIClient.testConnection.mockResolvedValue({ success: true });
      mockAPIClient.getCardInfo.mockResolvedValue(mockCardInfo);

      // Act
      const result = await useCase.execute(dtoWithoutApiKey);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('接続に成功しました');
      expect(result.cardInfo).toBeDefined();

      expect(mockAPIClient.testConnection).toHaveBeenCalledWith({
        cardNumber: '1234567890123456',
        cardHolderName: 'TARO YAMADA',
        expiryDate: '2025-12-31',
        username: 'test@example.com',
        password: 'password123',
        apiKey: undefined,
      });
    });

    it('should return failure result when connection test fails', async () => {
      // Arrange
      mockAPIClient.testConnection.mockResolvedValue({
        success: false,
        error: '認証に失敗しました',
      });

      // Act
      const result = await useCase.execute(mockDto);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('認証に失敗しました');
      expect(result.errorCode).toBe('CC001');
      expect(result.cardInfo).toBeUndefined();

      expect(mockAPIClient.testConnection).toHaveBeenCalled();
      expect(mockAPIClient.getCardInfo).not.toHaveBeenCalled();
    });

    it('should return failure result with default message when connection test fails without error message', async () => {
      // Arrange
      mockAPIClient.testConnection.mockResolvedValue({
        success: false,
      });

      // Act
      const result = await useCase.execute(mockDto);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('接続テストに失敗しました');
      expect(result.errorCode).toBe('CC001');
      expect(result.cardInfo).toBeUndefined();
    });

    it('should return failure result when API client throws an error', async () => {
      // Arrange
      const error = new Error('Network error');
      mockAPIClient.testConnection.mockRejectedValue(error);

      // Act
      const result = await useCase.execute(mockDto);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe(
        '接続テストに失敗しました。管理者にお問い合わせください。',
      );
      expect(result.errorCode).toBe('CC002');
      expect(result.cardInfo).toBeUndefined();

      expect(mockAPIClient.testConnection).toHaveBeenCalled();
      expect(mockAPIClient.getCardInfo).not.toHaveBeenCalled();
    });

    it('should return failure result when getCardInfo throws an error after successful connection test', async () => {
      // Arrange
      const error = new Error('Failed to get card info');
      mockAPIClient.testConnection.mockResolvedValue({ success: true });
      mockAPIClient.getCardInfo.mockRejectedValue(error);

      // Act
      const result = await useCase.execute(mockDto);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe(
        '接続テストに失敗しました。管理者にお問い合わせください。',
      );
      expect(result.errorCode).toBe('CC002');
      expect(result.cardInfo).toBeUndefined();

      expect(mockAPIClient.testConnection).toHaveBeenCalled();
      expect(mockAPIClient.getCardInfo).toHaveBeenCalled();
    });
  });
});
