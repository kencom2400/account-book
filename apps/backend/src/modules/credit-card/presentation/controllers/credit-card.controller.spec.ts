import { Test, TestingModule } from '@nestjs/testing';
import { CreditCardController } from './credit-card.controller';
import { ConnectCreditCardUseCase } from '../../application/use-cases/connect-credit-card.use-case';
import { FetchCreditCardTransactionsUseCase } from '../../application/use-cases/fetch-credit-card-transactions.use-case';
import { FetchPaymentInfoUseCase } from '../../application/use-cases/fetch-payment-info.use-case';
import { RefreshCreditCardDataUseCase } from '../../application/use-cases/refresh-credit-card-data.use-case';
import { CreditCardEntity } from '../../domain/entities/credit-card.entity';
import { EncryptedCredentials } from '../../../institution/domain/value-objects/encrypted-credentials.vo';
import { CREDIT_CARD_REPOSITORY } from '../../credit-card.tokens';

describe('CreditCardController', () => {
  let controller: CreditCardController;
  let connectUseCase: jest.Mocked<ConnectCreditCardUseCase>;
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
          provide: CREDIT_CARD_REPOSITORY,
          useValue: creditCardRepository,
        },
      ],
    }).compile();

    module.useLogger(false);

    controller = module.get<CreditCardController>(CreditCardController);
    connectUseCase = module.get(ConnectCreditCardUseCase);
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
});
