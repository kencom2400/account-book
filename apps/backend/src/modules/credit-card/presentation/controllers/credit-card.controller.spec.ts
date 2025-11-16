import { CreditCardController } from './credit-card.controller';
import { ConnectCreditCardUseCase } from '../../application/use-cases/connect-credit-card.use-case';
import { FetchCreditCardTransactionsUseCase } from '../../application/use-cases/fetch-credit-card-transactions.use-case';
import { FetchPaymentInfoUseCase } from '../../application/use-cases/fetch-payment-info.use-case';
import { ICreditCardRepository } from '../../domain/repositories/credit-card.repository.interface';
import {
  createTestCreditCard,
  createTestCreditCardTransaction,
  createTestPayment,
} from '../../../../../test/helpers/credit-card.factory';

describe('CreditCardController', () => {
  let controller: CreditCardController;
  let mockConnectUseCase: jest.Mocked<ConnectCreditCardUseCase>;
  let mockFetchTransactionsUseCase: jest.Mocked<FetchCreditCardTransactionsUseCase>;
  let mockFetchPaymentInfoUseCase: jest.Mocked<FetchPaymentInfoUseCase>;
  let mockRepository: jest.Mocked<ICreditCardRepository>;

  beforeEach(async () => {
    mockConnectUseCase = {
      execute: jest.fn(),
    } as any;

    mockFetchTransactionsUseCase = {
      execute: jest.fn(),
    } as any;

    mockFetchPaymentInfoUseCase = {
      execute: jest.fn(),
    } as any;

    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findConnected: jest.fn(),
      findByIssuer: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    } as any;

    // コントローラーを直接インスタンス化
    controller = new CreditCardController(
      mockConnectUseCase,
      mockFetchTransactionsUseCase,
      mockFetchPaymentInfoUseCase,
      mockRepository,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('connect', () => {
    it('should connect credit card successfully', async () => {
      const dto = {
        cardName: 'テストカード',
        cardNumber: '1234',
        cardHolderName: '山田太郎',
        expiryDate: '2030-12-31',
        username: 'test_user',
        password: 'test_password',
        issuer: 'テスト銀行',
        paymentDay: 27,
        closingDay: 15,
      };

      const mockCard = createTestCreditCard();
      mockConnectUseCase.execute.mockResolvedValue(mockCard);

      const result = await controller.connect(dto);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockConnectUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          cardName: 'テストカード',
          cardNumber: '1234',
          username: 'test_user',
          password: 'test_password',
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all credit cards', async () => {
      const mockCards = [
        createTestCreditCard({ id: 'cc_1' }),
        createTestCreditCard({ id: 'cc_2' }),
      ];

      mockRepository.findAll.mockResolvedValue(mockCards);

      const result = await controller.findAll();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return credit card by id', async () => {
      const mockCard = createTestCreditCard();
      mockRepository.findById.mockResolvedValue(mockCard);

      const result = await controller.findOne('cc_test_123');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe('cc_test_123');
      expect(mockRepository.findById).toHaveBeenCalledWith('cc_test_123');
    });

    it('should return error when credit card not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await controller.findOne('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Credit card not found');
    });
  });

  describe('getTransactions', () => {
    it('should return transactions for credit card', async () => {
      const mockTransactions = [
        createTestCreditCardTransaction({ id: 'tx_1' }),
        createTestCreditCardTransaction({ id: 'tx_2' }),
      ];

      mockFetchTransactionsUseCase.execute.mockResolvedValue(mockTransactions);

      const query = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        forceRefresh: 'false',
      };

      const result = await controller.getTransactions('cc_test_123', query);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.count).toBe(2);
      expect(mockFetchTransactionsUseCase.execute).toHaveBeenCalledWith({
        creditCardId: 'cc_test_123',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        forceRefresh: false,
      });
    });

    it('should handle force refresh', async () => {
      mockFetchTransactionsUseCase.execute.mockResolvedValue([]);

      const query = {
        forceRefresh: 'true',
      };

      await controller.getTransactions('cc_test_123', query);

      expect(mockFetchTransactionsUseCase.execute).toHaveBeenCalledWith({
        creditCardId: 'cc_test_123',
        startDate: undefined,
        endDate: undefined,
        forceRefresh: true,
      });
    });
  });

  describe('getPaymentInfo', () => {
    it('should return payment info for credit card', async () => {
      const mockPayment = createTestPayment();
      mockFetchPaymentInfoUseCase.execute.mockResolvedValue(mockPayment);

      const query = {
        billingMonth: '2025-01',
        forceRefresh: 'false',
      };

      const result = await controller.getPaymentInfo('cc_test_123', query);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockFetchPaymentInfoUseCase.execute).toHaveBeenCalledWith({
        creditCardId: 'cc_test_123',
        billingMonth: '2025-01',
        forceRefresh: false,
      });
    });
  });

  describe('delete', () => {
    it('should delete credit card', async () => {
      mockRepository.delete.mockResolvedValue();

      await controller.delete('cc_test_123');

      expect(mockRepository.delete).toHaveBeenCalledWith('cc_test_123');
    });
  });

  describe('refresh', () => {
    it('should refresh credit card data', async () => {
      const mockCard = createTestCreditCard();
      const mockTransactions = [createTestCreditCardTransaction()];
      const mockPayment = createTestPayment();

      mockFetchTransactionsUseCase.execute.mockResolvedValue(mockTransactions);
      mockFetchPaymentInfoUseCase.execute.mockResolvedValue(mockPayment);
      mockRepository.findById.mockResolvedValue(mockCard);

      const result = await controller.refresh('cc_test_123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Credit card data refreshed successfully');
      expect(result.data.creditCard).toBeDefined();
      expect(result.data.transactions).toHaveLength(1);
      expect(result.data.payment).toBeDefined();

      expect(mockFetchTransactionsUseCase.execute).toHaveBeenCalledWith({
        creditCardId: 'cc_test_123',
        forceRefresh: true,
      });
      expect(mockFetchPaymentInfoUseCase.execute).toHaveBeenCalledWith({
        creditCardId: 'cc_test_123',
        forceRefresh: true,
      });
    });
  });
});
