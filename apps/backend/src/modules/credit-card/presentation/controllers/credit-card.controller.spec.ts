import { Test, TestingModule } from '@nestjs/testing';
import { CreditCardController } from './credit-card.controller';
import { ConnectCreditCardUseCase } from '../../application/use-cases/connect-credit-card.use-case';
import { GetCreditCardsUseCase } from '../../application/use-cases/get-credit-cards.use-case';
import { FetchPaymentInfoUseCase } from '../../application/use-cases/fetch-payment-info.use-case';
import { RefreshCreditCardDataUseCase } from '../../application/use-cases/refresh-credit-card-data.use-case';
import { CreditCardEntity } from '../../domain/entities/credit-card.entity';
import { EncryptedCredentials } from '../../../institution/domain/value-objects/encrypted-credentials.vo';

describe('CreditCardController', () => {
  let controller: CreditCardController;
  let connectUseCase: jest.Mocked<ConnectCreditCardUseCase>;
  let getCardsUseCase: jest.Mocked<GetCreditCardsUseCase>;

  const mockCredentials = new EncryptedCredentials(
    'encrypted',
    'iv',
    'authTag',
  );

  const mockCard = new CreditCardEntity(
    'card_1',
    'Test Card',
    'test-card',
    mockCredentials,
    '1234',
    15,
    10,
    0,
    new Date(),
    new Date(),
    new Date(),
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreditCardController],
      providers: [
        {
          provide: ConnectCreditCardUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetCreditCardsUseCase,
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
      ],
    }).compile();

    module.useLogger(false);

    controller = module.get<CreditCardController>(CreditCardController);
    connectUseCase = module.get(ConnectCreditCardUseCase);
    getCardsUseCase = module.get(GetCreditCardsUseCase);
  });

  describe('connect', () => {
    it('should connect credit card', async () => {
      connectUseCase.execute.mockResolvedValue(mockCard);

      const result = await controller.connect({
        cardName: 'Test Card',
        cardCompanyCode: 'test-card',
        loginId: 'test',
        password: 'pass',
        lastFourDigits: '1234',
        paymentDay: 15,
        closingDay: 10,
      } as any);

      expect(result.success).toBe(true);
    });
  });

  describe('getAll', () => {
    it('should get all credit cards', async () => {
      getCardsUseCase.execute.mockResolvedValue([mockCard]);

      const result = await controller.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });
});
