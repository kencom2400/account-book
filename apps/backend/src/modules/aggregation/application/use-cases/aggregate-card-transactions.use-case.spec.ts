import { Test, TestingModule } from '@nestjs/testing';
import { CreditCardEntity } from '../../../credit-card/domain/entities/credit-card.entity';
import { CreditCardTransactionEntity } from '../../../credit-card/domain/entities/credit-card-transaction.entity';
import {
  ICreditCardRepository,
  ICreditCardTransactionRepository,
} from '../../../credit-card/domain/repositories/credit-card.repository.interface';
import { EncryptedCredentials } from '../../../institution/domain/value-objects/encrypted-credentials.vo';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import { AggregationRepository } from '../../domain/repositories/aggregation.repository.interface';
import { BillingPeriodCalculator } from '../services/billing-period-calculator.service';
import { AggregateCardTransactionsUseCase } from './aggregate-card-transactions.use-case';

describe('AggregateCardTransactionsUseCase', () => {
  let useCase: AggregateCardTransactionsUseCase;
  let creditCardRepository: jest.Mocked<ICreditCardRepository>;
  let transactionRepository: jest.Mocked<ICreditCardTransactionRepository>;
  let aggregationRepository: jest.Mocked<AggregationRepository>;

  const mockCreditCard = new CreditCardEntity(
    'card-123',
    '楽天カード',
    '1234',
    '田中太郎',
    new Date('2025-12-31'),
    new EncryptedCredentials(
      'encrypted-data',
      'iv-value',
      'auth-tag-value',
      'aes-256-gcm',
      '1.0',
    ),
    true,
    new Date('2025-01-15'),
    27, // paymentDay
    31, // closingDay (月末締め)
    1000000,
    50000,
    '楽天カード株式会社',
    new Date('2025-01-01'),
    new Date('2025-01-01'),
  );

  const mockTransactions = [
    new CreditCardTransactionEntity(
      'tx-001',
      'card-123',
      new Date('2025-01-15'),
      new Date('2025-01-15'),
      30000,
      'スーパーマーケット',
      '食費',
      '食費',
      '食費',
      false,
      null,
      null,
      false,
      null,
      null,
      new Date(),
      new Date(),
    ),
    new CreditCardTransactionEntity(
      'tx-002',
      'card-123',
      new Date('2025-01-20'),
      new Date('2025-01-20'),
      20000,
      '交通機関',
      '交通費',
      '交通費',
      '交通費',
      false,
      null,
      null,
      false,
      null,
      null,
      new Date(),
      new Date(),
    ),
    new CreditCardTransactionEntity(
      'tx-003',
      'card-123',
      new Date('2025-02-10'),
      new Date('2025-02-10'),
      15000,
      'レストラン',
      '食費',
      '食費',
      '食費',
      false,
      null,
      null,
      false,
      null,
      null,
      new Date(),
      new Date(),
    ),
  ];

  beforeEach(async () => {
    creditCardRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findConnected: jest.fn(),
      findByIssuer: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    transactionRepository = {
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

    aggregationRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCardAndMonth: jest.fn(),
      findByCard: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AggregateCardTransactionsUseCase,
        BillingPeriodCalculator,
        {
          provide: 'ICreditCardRepository',
          useValue: creditCardRepository,
        },
        {
          provide: 'ICreditCardTransactionRepository',
          useValue: transactionRepository,
        },
        {
          provide: 'AggregationRepository',
          useValue: aggregationRepository,
        },
      ],
    }).compile();

    useCase = module.get<AggregateCardTransactionsUseCase>(
      AggregateCardTransactionsUseCase,
    );
  });

  describe('execute', () => {
    it('カード利用明細を月別に集計できる', async () => {
      creditCardRepository.findById.mockResolvedValue(mockCreditCard);
      transactionRepository.findByCreditCardIdAndDateRange.mockResolvedValue(
        mockTransactions,
      );
      aggregationRepository.save.mockImplementation(async (summary) => summary);

      const result = await useCase.execute('card-123', '2025-01', '2025-02');

      expect(result).toHaveLength(2); // 2025-01と2025-02の2ヶ月分
      expect(result[0].billingMonth).toBe('2025-01');
      expect(result[0].totalAmount).toBe(50000); // tx-001 + tx-002
      expect(result[0].transactionCount).toBe(2);
      expect(result[0].categoryBreakdown).toHaveLength(2); // 食費と交通費
      expect(result[1].billingMonth).toBe('2025-02');
      expect(result[1].totalAmount).toBe(15000); // tx-003
      expect(result[1].transactionCount).toBe(1);
    });

    it('カテゴリ別内訳が正しく計算される', async () => {
      creditCardRepository.findById.mockResolvedValue(mockCreditCard);
      transactionRepository.findByCreditCardIdAndDateRange.mockResolvedValue(
        mockTransactions,
      );
      aggregationRepository.save.mockImplementation(async (summary) => summary);

      const result = await useCase.execute('card-123', '2025-01', '2025-02');

      // 2025-01のカテゴリ別内訳
      const jan = result.find((s) => s.billingMonth === '2025-01')!;
      expect(jan.categoryBreakdown).toHaveLength(2);

      const foodCategory = jan.categoryBreakdown.find(
        (c) => c.category === '食費',
      )!;
      expect(foodCategory.amount).toBe(30000);
      expect(foodCategory.count).toBe(1);

      const transportCategory = jan.categoryBreakdown.find(
        (c) => c.category === '交通費',
      )!;
      expect(transportCategory.amount).toBe(20000);
      expect(transportCategory.count).toBe(1);
    });

    it('締め日・支払日が正しく計算される', async () => {
      creditCardRepository.findById.mockResolvedValue(mockCreditCard);
      transactionRepository.findByCreditCardIdAndDateRange.mockResolvedValue(
        mockTransactions,
      );
      aggregationRepository.save.mockImplementation(async (summary) => summary);

      const result = await useCase.execute('card-123', '2025-01', '2025-01');

      expect(result[0].closingDate).toEqual(new Date(2025, 0, 31)); // 1月31日
      expect(result[0].paymentDate).toEqual(new Date(2025, 1, 27)); // 2月27日
    });

    it('最終支払額がtotalAmountと同額（割引未実装）', async () => {
      creditCardRepository.findById.mockResolvedValue(mockCreditCard);
      transactionRepository.findByCreditCardIdAndDateRange.mockResolvedValue(
        mockTransactions,
      );
      aggregationRepository.save.mockImplementation(async (summary) => summary);

      const result = await useCase.execute('card-123', '2025-01', '2025-01');

      expect(result[0].netPaymentAmount).toBe(result[0].totalAmount);
    });

    it('支払いステータスがPENDINGで初期化される', async () => {
      creditCardRepository.findById.mockResolvedValue(mockCreditCard);
      transactionRepository.findByCreditCardIdAndDateRange.mockResolvedValue(
        mockTransactions,
      );
      aggregationRepository.save.mockImplementation(async (summary) => summary);

      const result = await useCase.execute('card-123', '2025-01', '2025-01');

      expect(result[0].status).toBe(PaymentStatus.PENDING);
    });

    it('集計結果が保存される', async () => {
      creditCardRepository.findById.mockResolvedValue(mockCreditCard);
      transactionRepository.findByCreditCardIdAndDateRange.mockResolvedValue(
        mockTransactions,
      );
      aggregationRepository.save.mockImplementation(async (summary) => summary);

      await useCase.execute('card-123', '2025-01', '2025-02');

      expect(aggregationRepository.save).toHaveBeenCalledTimes(2);
    });

    it('カードが見つからない場合、エラーをスローする', async () => {
      creditCardRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute('invalid-id', '2025-01', '2025-02'),
      ).rejects.toThrow('Credit card not found: invalid-id');
    });

    it('取引が存在しない場合、エラーをスローする', async () => {
      creditCardRepository.findById.mockResolvedValue(mockCreditCard);
      transactionRepository.findByCreditCardIdAndDateRange.mockResolvedValue(
        [],
      );

      await expect(
        useCase.execute('card-123', '2025-01', '2025-02'),
      ).rejects.toThrow('No transactions found for the specified period');
    });

    it('結果が請求月順にソートされる', async () => {
      creditCardRepository.findById.mockResolvedValue(mockCreditCard);
      transactionRepository.findByCreditCardIdAndDateRange.mockResolvedValue(
        mockTransactions,
      );
      aggregationRepository.save.mockImplementation(async (summary) => summary);

      const result = await useCase.execute('card-123', '2025-01', '2025-02');

      expect(result[0].billingMonth).toBe('2025-01');
      expect(result[1].billingMonth).toBe('2025-02');
    });
  });
});
