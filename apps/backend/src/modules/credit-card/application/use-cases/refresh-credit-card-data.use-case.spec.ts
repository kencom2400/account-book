import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PaymentStatus } from '@account-book/types';
import { RefreshCreditCardDataUseCase } from './refresh-credit-card-data.use-case';
import {
  CREDIT_CARD_REPOSITORY,
  CREDIT_CARD_TRANSACTION_REPOSITORY,
  PAYMENT_REPOSITORY,
  CREDIT_CARD_API_CLIENT,
} from '../../credit-card.tokens';
import { CRYPTO_SERVICE } from '../../../institution/institution.tokens';
import { CreditCardEntity } from '../../domain/entities/credit-card.entity';
import { PaymentVO } from '../../domain/value-objects/payment.vo';
import { EncryptedCredentials } from '../../../institution/domain/value-objects/encrypted-credentials.vo';

describe('RefreshCreditCardDataUseCase', () => {
  let useCase: RefreshCreditCardDataUseCase;
  let creditCardRepository: any;
  let creditCardAPIClient: any;
  let cryptoService: any;

  const mockCredentials = new EncryptedCredentials(
    'encrypted',
    'iv',
    'authTag',
  );

  const mockCreditCard = new CreditCardEntity(
    'card_1',
    'Test Card',
    '1234',
    'Test Holder',
    new Date('2025-12-31'),
    mockCredentials,
    true,
    new Date(),
    10,
    15,
    100000,
    50000,
    'Test Issuer',
    new Date(),
    new Date(),
  );

  const mockPayment = new PaymentVO(
    '2024-01',
    new Date('2024-01-15'),
    new Date('2024-02-10'),
    50000,
    0,
    50000,
    PaymentStatus.UNPAID,
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshCreditCardDataUseCase,
        {
          provide: CREDIT_CARD_REPOSITORY,
          useValue: {
            findById: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: CREDIT_CARD_TRANSACTION_REPOSITORY,
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: PAYMENT_REPOSITORY,
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: CREDIT_CARD_API_CLIENT,
          useValue: {
            getTransactions: jest.fn(),
            getPaymentInfo: jest.fn(),
            mapToTransactionEntity: jest.fn(),
            mapToPaymentVO: jest.fn(),
          },
        },
        {
          provide: CRYPTO_SERVICE,
          useValue: {
            decrypt: jest.fn(),
          },
        },
      ],
    }).compile();

    module.useLogger(false);

    useCase = module.get<RefreshCreditCardDataUseCase>(
      RefreshCreditCardDataUseCase,
    );
    creditCardRepository = module.get(CREDIT_CARD_REPOSITORY);
    creditCardAPIClient = module.get(CREDIT_CARD_API_CLIENT);
    cryptoService = module.get(CRYPTO_SERVICE);
  });

  describe('execute', () => {
    it('should throw NotFoundException when credit card does not exist', async () => {
      creditCardRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should refresh credit card data successfully', async () => {
      creditCardRepository.findById.mockResolvedValue(mockCreditCard);
      cryptoService.decrypt.mockReturnValue(
        JSON.stringify({ username: 'user', password: 'pass' }),
      );
      creditCardAPIClient.getTransactions.mockResolvedValue([]);
      creditCardAPIClient.getPaymentInfo.mockResolvedValue({});
      creditCardAPIClient.mapToPaymentVO.mockReturnValue(mockPayment);
      creditCardRepository.save.mockResolvedValue(mockCreditCard);

      const result = await useCase.execute('card_1');

      expect(result.creditCard).toBeDefined();
      expect(result.transactions).toBeDefined();
      expect(result.payment).toBe(mockPayment);
      expect(creditCardRepository.save).toHaveBeenCalled();
    });

    it('should decrypt credentials correctly', async () => {
      creditCardRepository.findById.mockResolvedValue(mockCreditCard);
      cryptoService.decrypt.mockReturnValue(
        JSON.stringify({
          username: 'testuser',
          password: 'testpass',
          cardNumber: '1234',
        }),
      );
      creditCardAPIClient.getTransactions.mockResolvedValue([]);
      creditCardAPIClient.getPaymentInfo.mockResolvedValue({});
      creditCardAPIClient.mapToPaymentVO.mockReturnValue(mockPayment);
      creditCardRepository.save.mockResolvedValue(mockCreditCard);

      await useCase.execute('card_1');

      expect(cryptoService.decrypt).toHaveBeenCalledWith(mockCredentials);
      expect(creditCardAPIClient.getTransactions).toHaveBeenCalledWith(
        {
          username: 'testuser',
          password: 'testpass',
          cardNumber: '1234',
        },
        expect.any(Date),
        expect.any(Date),
      );
    });

    it('should update lastSyncedAt after refresh', async () => {
      const initialLastSyncedAt = mockCreditCard.lastSyncedAt;

      creditCardRepository.findById.mockResolvedValue(mockCreditCard);
      cryptoService.decrypt.mockReturnValue(
        JSON.stringify({ username: 'user', password: 'pass' }),
      );
      creditCardAPIClient.getTransactions.mockResolvedValue([]);
      creditCardAPIClient.getPaymentInfo.mockResolvedValue({});
      creditCardAPIClient.mapToPaymentVO.mockReturnValue(mockPayment);

      let savedCard: CreditCardEntity | undefined;
      creditCardRepository.save.mockImplementation((card: CreditCardEntity) => {
        savedCard = card;
        return Promise.resolve(card);
      });

      const result = await useCase.execute('card_1');

      expect(savedCard).toBeDefined();
      expect(savedCard!.lastSyncedAt).not.toBe(initialLastSyncedAt);
      expect(result.creditCard.lastSyncedAt).toBeInstanceOf(Date);
    });

    it('should fetch transactions and payment info in parallel', async () => {
      creditCardRepository.findById.mockResolvedValue(mockCreditCard);
      cryptoService.decrypt.mockReturnValue(
        JSON.stringify({ username: 'user', password: 'pass' }),
      );

      const transactionsPromise = new Promise((resolve) =>
        setTimeout(() => resolve([]), 50),
      );
      const paymentPromise = new Promise((resolve) =>
        setTimeout(() => resolve({}), 50),
      );

      creditCardAPIClient.getTransactions.mockReturnValue(transactionsPromise);
      creditCardAPIClient.getPaymentInfo.mockReturnValue(paymentPromise);
      creditCardAPIClient.mapToPaymentVO.mockReturnValue(mockPayment);
      creditCardRepository.save.mockResolvedValue(mockCreditCard);

      const startTime = Date.now();
      await useCase.execute('card_1');
      const duration = Date.now() - startTime;

      // Parallel execution should take ~50ms, not ~100ms
      expect(duration).toBeLessThan(80);
    });
  });
});
