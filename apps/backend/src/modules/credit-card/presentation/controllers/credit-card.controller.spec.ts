import { Test, TestingModule } from '@nestjs/testing';
import { CreditCardController } from './credit-card.controller';
import { ConnectCreditCardUseCase } from '../../application/use-cases/connect-credit-card.use-case';
import { FetchCreditCardTransactionsUseCase } from '../../application/use-cases/fetch-credit-card-transactions.use-case';
import { FetchPaymentInfoUseCase } from '../../application/use-cases/fetch-payment-info.use-case';
import { RefreshCreditCardDataUseCase } from '../../application/use-cases/refresh-credit-card-data.use-case';
import { GetSupportedCardCompaniesUseCase } from '../../application/use-cases/get-supported-card-companies.use-case';
import { TestCreditCardConnectionUseCase } from '../../application/use-cases/test-credit-card-connection.use-case';
import { CreditCardEntity } from '../../domain/entities/credit-card.entity';
import { EncryptedCredentials } from '../../../institution/domain/value-objects/encrypted-credentials.vo';
import { CREDIT_CARD_REPOSITORY } from '../../credit-card.tokens';

describe('CreditCardController', () => {
  let controller: CreditCardController;
  let connectUseCase: jest.Mocked<ConnectCreditCardUseCase>;
  let fetchPaymentInfoUseCase: jest.Mocked<FetchPaymentInfoUseCase>;
  let refreshUseCase: jest.Mocked<RefreshCreditCardDataUseCase>;
  let getSupportedCardCompaniesUseCase: jest.Mocked<GetSupportedCardCompaniesUseCase>;
  let testCreditCardConnectionUseCase: jest.Mocked<TestCreditCardConnectionUseCase>;
  let creditCardRepository: any;

  const mockCredentials = new EncryptedCredentials(
    'encrypted',
    'iv',
    'authTag',
  );

  const mockCard = new CreditCardEntity(
    'card_1',
    'Test Card',
    '1234',
    'Test User',
    new Date('2025-12-31'),
    mockCredentials,
    true,
    new Date(),
    15,
    10,
    1000000,
    0,
    'test-issuer',
    new Date(),
    new Date(),
  );

  beforeEach(async () => {
    creditCardRepository = {
      findAll: jest.fn().mockResolvedValue([mockCard]),
      findById: jest.fn().mockResolvedValue(mockCard),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreditCardController],
      providers: [
        {
          provide: ConnectCreditCardUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: FetchCreditCardTransactionsUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: FetchPaymentInfoUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: RefreshCreditCardDataUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetSupportedCardCompaniesUseCase,
          useValue: { execute: jest.fn(), findByCode: jest.fn() },
        },
        {
          provide: TestCreditCardConnectionUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: CREDIT_CARD_REPOSITORY,
          useValue: creditCardRepository,
        },
      ],
    }).compile();

    module.useLogger(false);

    controller = module.get<CreditCardController>(CreditCardController);
    connectUseCase = module.get(ConnectCreditCardUseCase);
    fetchPaymentInfoUseCase = module.get(FetchPaymentInfoUseCase);
    refreshUseCase = module.get(RefreshCreditCardDataUseCase);
    getSupportedCardCompaniesUseCase = module.get(
      GetSupportedCardCompaniesUseCase,
    );
    testCreditCardConnectionUseCase = module.get(
      TestCreditCardConnectionUseCase,
    );
  });

  describe('connect', () => {
    it('should connect credit card', async () => {
      connectUseCase.execute.mockResolvedValue(mockCard);

      const result = await controller.connect({
        cardName: 'Test Card',
        cardNumber: '1234567890123456',
        cardHolderName: 'Test User',
        expiryDate: '2025-12',
        username: 'test',
        password: 'pass',
        issuer: 'test-card',
        paymentDay: 15,
        closingDay: 10,
      } as any);

      expect(result.success).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should get all credit cards', async () => {
      const result = await controller.findAll();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getPaymentInfo', () => {
    it('should get payment info for a credit card', async () => {
      const mockPayment = {
        totalAmount: 50000,
        dueDate: new Date('2024-02-15'),
        closingDate: new Date('2024-01-31'),
        toJSON: () => ({
          totalAmount: 50000,
          dueDate: '2024-02-15',
          closingDate: '2024-01-31',
        }),
      };

      fetchPaymentInfoUseCase.execute.mockResolvedValue(mockPayment as any);

      const result = await controller.getPaymentInfo('card_1', {});

      expect(result.success).toBe(true);
      expect(result.data.totalAmount).toBe(50000);
    });
  });

  describe('refresh', () => {
    it('should refresh credit card data', async () => {
      const mockTransaction = {
        toJSON: () => ({
          id: 'tx_1',
          amount: 1000,
          description: 'Test',
        }),
      };

      const mockPayment = {
        toJSON: () => ({
          totalAmount: 50000,
        }),
      };

      refreshUseCase.execute.mockResolvedValue({
        creditCard: mockCard,
        transactions: [mockTransaction],
        payment: mockPayment,
      } as any);

      const result = await controller.refresh('card_1');

      expect(result.success).toBe(true);
    });
  });

  describe('getSupportedCardCompanies', () => {
    it('should return all supported card companies when no query is provided', () => {
      const mockCompanies = [
        {
          id: 'card_1',
          code: 'SMBC',
          name: '三井住友カード',
          category: 'major',
          isSupported: true,
        },
        {
          id: 'card_2',
          code: 'JCB',
          name: 'JCB',
          category: 'major',
          isSupported: true,
        },
      ];

      getSupportedCardCompaniesUseCase.execute.mockReturnValue(mockCompanies);

      const result = controller.getSupportedCardCompanies({});

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCompanies);
      expect(result.count).toBe(2);
      expect(getSupportedCardCompaniesUseCase.execute).toHaveBeenCalledWith({});
    });

    it('should filter card companies by category', () => {
      const mockCompanies = [
        {
          id: 'card_1',
          code: 'SMBC',
          name: '三井住友カード',
          category: 'major',
          isSupported: true,
        },
      ];

      getSupportedCardCompaniesUseCase.execute.mockReturnValue(mockCompanies);

      const result = controller.getSupportedCardCompanies({
        category: 'major',
      } as any);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCompanies);
      expect(result.count).toBe(1);
      expect(getSupportedCardCompaniesUseCase.execute).toHaveBeenCalledWith({
        category: 'major',
      });
    });

    it('should filter card companies by search term', () => {
      const mockCompanies = [
        {
          id: 'card_1',
          code: 'SMBC',
          name: '三井住友カード',
          category: 'major',
          isSupported: true,
        },
      ];

      getSupportedCardCompaniesUseCase.execute.mockReturnValue(mockCompanies);

      const result = controller.getSupportedCardCompanies({
        searchTerm: '三井住友',
      } as any);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCompanies);
      expect(result.count).toBe(1);
      expect(getSupportedCardCompaniesUseCase.execute).toHaveBeenCalledWith({
        searchTerm: '三井住友',
      });
    });

    it('should combine category and search term filters', () => {
      const mockCompanies: any[] = [];

      getSupportedCardCompaniesUseCase.execute.mockReturnValue(mockCompanies);

      const result = controller.getSupportedCardCompanies({
        category: 'major',
        searchTerm: 'JCB',
      } as any);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCompanies);
      expect(result.count).toBe(0);
      expect(getSupportedCardCompaniesUseCase.execute).toHaveBeenCalledWith({
        category: 'major',
        searchTerm: 'JCB',
      });
    });
  });

  describe('testCreditCardConnection', () => {
    it('should return success result when connection test succeeds', async () => {
      const mockDto = {
        cardName: 'Test Card',
        cardNumber: '1234567890123456',
        cardHolderName: 'TARO YAMADA',
        expiryDate: '2025-12-31',
        username: 'test@example.com',
        password: 'password123',
        issuer: 'テストカード',
        paymentDay: 15,
        closingDay: 10,
        apiKey: 'test-api-key',
      };

      const mockResult = {
        success: true,
        message: '接続に成功しました',
        cardInfo: {
          cardName: 'テストカード',
          cardNumber: '3456',
          cardHolderName: 'TARO YAMADA',
          expiryDate: '2025-12-31',
          issuer: 'テストカード',
        },
      };

      testCreditCardConnectionUseCase.execute.mockResolvedValue(
        mockResult as any,
      );

      const result = await controller.testCreditCardConnection(mockDto as any);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(testCreditCardConnectionUseCase.execute).toHaveBeenCalledWith(
        mockDto,
      );
    });

    it('should return failure result when connection test fails', async () => {
      const mockDto = {
        cardName: 'Test Card',
        cardNumber: '1234567890123456',
        cardHolderName: 'TARO YAMADA',
        expiryDate: '2025-12-31',
        username: 'test@example.com',
        password: 'password123',
        issuer: 'テストカード',
        paymentDay: 15,
        closingDay: 10,
      };

      const mockResult = {
        success: false,
        message: '認証に失敗しました',
        errorCode: 'CC001',
      };

      testCreditCardConnectionUseCase.execute.mockResolvedValue(
        mockResult as any,
      );

      const result = await controller.testCreditCardConnection(mockDto as any);

      expect(result.success).toBe(true); // Controller層では常にsuccess: trueを返す
      expect(result.data).toEqual(mockResult);
      expect(testCreditCardConnectionUseCase.execute).toHaveBeenCalledWith(
        mockDto,
      );
    });

    it('should handle error when use case throws an exception', async () => {
      const mockDto = {
        cardName: 'Test Card',
        cardNumber: '1234567890123456',
        cardHolderName: 'TARO YAMADA',
        expiryDate: '2025-12-31',
        username: 'test@example.com',
        password: 'password123',
        issuer: 'テストカード',
        paymentDay: 15,
        closingDay: 10,
      };

      const error = new Error('Unexpected error');
      testCreditCardConnectionUseCase.execute.mockRejectedValue(error);

      await expect(
        controller.testCreditCardConnection(mockDto as any),
      ).rejects.toThrow('Unexpected error');
    });
  });
});
