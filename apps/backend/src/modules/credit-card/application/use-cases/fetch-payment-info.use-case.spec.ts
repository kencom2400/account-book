import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PaymentStatus } from '@account-book/types';
import { FetchPaymentInfoUseCase } from './fetch-payment-info.use-case';
import {
  CREDIT_CARD_REPOSITORY,
  PAYMENT_REPOSITORY,
  CREDIT_CARD_TRANSACTION_REPOSITORY,
  CREDIT_CARD_API_CLIENT,
} from '../../credit-card.tokens';
import { CRYPTO_SERVICE } from '../../../institution/institution.tokens';
import { CreditCardEntity } from '../../domain/entities/credit-card.entity';
import { PaymentVO } from '../../domain/value-objects/payment.vo';
import { EncryptedCredentials } from '../../../institution/domain/value-objects/encrypted-credentials.vo';

describe('FetchPaymentInfoUseCase', () => {
  let useCase: FetchPaymentInfoUseCase;
  let creditCardRepository: any;
  let paymentRepository: any;
  let transactionRepository: any;
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
    10, // paymentDay
    15, // closingDay
    100000, // creditLimit
    50000, // currentBalance
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
        FetchPaymentInfoUseCase,
        {
          provide: CREDIT_CARD_REPOSITORY,
          useValue: {
            findById: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: PAYMENT_REPOSITORY,
          useValue: {
            findByCreditCardIdAndMonth: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: CREDIT_CARD_TRANSACTION_REPOSITORY,
          useValue: {
            findByMonth: jest.fn(),
          },
        },
        {
          provide: CREDIT_CARD_API_CLIENT,
          useValue: {
            getPaymentInfo: jest.fn(),
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

    useCase = module.get<FetchPaymentInfoUseCase>(FetchPaymentInfoUseCase);
    creditCardRepository = module.get(CREDIT_CARD_REPOSITORY);
    paymentRepository = module.get(PAYMENT_REPOSITORY);
    transactionRepository = module.get(CREDIT_CARD_TRANSACTION_REPOSITORY);
    creditCardAPIClient = module.get(CREDIT_CARD_API_CLIENT);
    cryptoService = module.get(CRYPTO_SERVICE);
  });

  describe('execute', () => {
    it('should throw NotFoundException when credit card does not exist', async () => {
      creditCardRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({ creditCardId: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return existing payment info from repository', async () => {
      creditCardRepository.findById.mockResolvedValue(mockCreditCard);
      paymentRepository.findByCreditCardIdAndMonth.mockResolvedValue(
        mockPayment,
      );

      const result = await useCase.execute({ creditCardId: 'card_1' });

      expect(result).toBe(mockPayment);
      expect(paymentRepository.findByCreditCardIdAndMonth).toHaveBeenCalled();
    });

    it('should calculate and save payment info when not found', async () => {
      creditCardRepository.findById.mockResolvedValue(mockCreditCard);
      paymentRepository.findByCreditCardIdAndMonth.mockResolvedValue(null);
      transactionRepository.findByMonth.mockResolvedValue([]);
      paymentRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute({
        creditCardId: 'card_1',
        billingMonth: '2024-01',
      });

      expect(result).toBeInstanceOf(PaymentVO);
      expect(paymentRepository.save).toHaveBeenCalled();
    });

    it('should use current month when billingMonth is not provided', async () => {
      creditCardRepository.findById.mockResolvedValue(mockCreditCard);
      paymentRepository.findByCreditCardIdAndMonth.mockResolvedValue(
        mockPayment,
      );

      await useCase.execute({ creditCardId: 'card_1' });

      const currentDate = new Date();
      const expectedMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

      expect(paymentRepository.findByCreditCardIdAndMonth).toHaveBeenCalledWith(
        'card_1',
        expectedMonth,
      );
    });

    it('should refresh from API when forceRefresh is true', async () => {
      const disconnectedCard = new CreditCardEntity(
        'card_1',
        'Test Card',
        '1234',
        'Test Holder',
        new Date('2025-12-31'),
        mockCredentials,
        false,
        null,
        10,
        15,
        100000,
        50000,
        'Test Issuer',
        new Date(),
        new Date(),
      );

      creditCardRepository.findById.mockResolvedValue(disconnectedCard);
      cryptoService.decrypt.mockReturnValue(
        JSON.stringify({ username: 'user', password: 'pass' }),
      );
      creditCardAPIClient.getPaymentInfo.mockResolvedValue({});
      creditCardAPIClient.mapToPaymentVO.mockReturnValue(mockPayment);
      paymentRepository.save.mockResolvedValue(undefined);
      creditCardRepository.save.mockResolvedValue(disconnectedCard);
      paymentRepository.findByCreditCardIdAndMonth.mockResolvedValue(
        mockPayment,
      );

      const result = await useCase.execute({
        creditCardId: 'card_1',
        forceRefresh: true,
      });

      expect(cryptoService.decrypt).toHaveBeenCalled();
      expect(creditCardAPIClient.getPaymentInfo).toHaveBeenCalled();
      expect(result).toBe(mockPayment);
    });

    it('should continue with local data when API refresh fails', async () => {
      creditCardRepository.findById.mockResolvedValue(mockCreditCard);
      cryptoService.decrypt.mockImplementation(() => {
        throw new Error('Decryption failed');
      });
      paymentRepository.findByCreditCardIdAndMonth.mockResolvedValue(
        mockPayment,
      );

      const result = await useCase.execute({
        creditCardId: 'card_1',
        forceRefresh: true,
      });

      expect(result).toBe(mockPayment);
    });
  });
});
