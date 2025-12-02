import { Test, TestingModule } from '@nestjs/testing';
import { SecuritiesController } from './securities.controller';
import { ConnectSecuritiesAccountUseCase } from '../../application/use-cases/connect-securities-account.use-case';
import { FetchHoldingsUseCase } from '../../application/use-cases/fetch-holdings.use-case';
import { FetchSecurityTransactionsUseCase } from '../../application/use-cases/fetch-security-transactions.use-case';
import { CalculatePortfolioValueUseCase } from '../../application/use-cases/calculate-portfolio-value.use-case';
import { SecuritiesAccountEntity } from '../../domain/entities/securities-account.entity';
import { HoldingEntity } from '../../domain/entities/holding.entity';
import { SecurityTransactionEntity } from '../../domain/entities/security-transaction.entity';
import { EncryptedCredentials } from '../../../institution/domain/value-objects/encrypted-credentials.vo';

describe('SecuritiesController', () => {
  let controller: SecuritiesController;
  let connectUseCase: jest.Mocked<ConnectSecuritiesAccountUseCase>;
  let fetchHoldingsUseCase: jest.Mocked<FetchHoldingsUseCase>;
  let fetchTransactionsUseCase: jest.Mocked<FetchSecurityTransactionsUseCase>;
  let calculatePortfolioUseCase: jest.Mocked<CalculatePortfolioValueUseCase>;

  const mockCredentials = new EncryptedCredentials(
    'encrypted',
    'iv',
    'authTag',
  );

  const mockAccount = new SecuritiesAccountEntity(
    'sec_1',
    'Test Securities',
    '1234567890',
    'general',
    mockCredentials,
    'connected',
    100000,
    new Date(),
    new Date(),
    new Date(),
  );

  const mockHolding = new HoldingEntity(
    'hold_1',
    'sec_1',
    '7203',
    'Toyota',
    100,
    2500,
    2800,
    'stock',
    '東証',
    new Date(),
  );

  const mockTransaction = new SecurityTransactionEntity(
    'tx_1',
    'sec_1',
    '7203',
    'Toyota',
    new Date(),
    'buy',
    100,
    2500,
    500,
    'completed',
    new Date(),
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SecuritiesController],
      providers: [
        {
          provide: ConnectSecuritiesAccountUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: FetchHoldingsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: FetchSecurityTransactionsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: CalculatePortfolioValueUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    module.useLogger(false);

    controller = module.get<SecuritiesController>(SecuritiesController);
    connectUseCase = module.get(ConnectSecuritiesAccountUseCase);
    fetchHoldingsUseCase = module.get(FetchHoldingsUseCase);
    fetchTransactionsUseCase = module.get(FetchSecurityTransactionsUseCase);
    calculatePortfolioUseCase = module.get(CalculatePortfolioValueUseCase);
  });

  describe('connect', () => {
    it('should connect securities account successfully', async () => {
      connectUseCase.execute.mockResolvedValue(mockAccount);

      const dto = {
        securitiesCompanyName: 'Test Securities',
        accountNumber: '1234567890',
        accountType: 'general' as const,
        loginId: 'testuser',
        password: 'testpass',
        tradingPassword: 'tradepass',
      };

      const result = await controller.connect(dto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAccount.toJSON());
      expect(result.message).toBe('Securities account connected successfully');
      expect(connectUseCase.execute).toHaveBeenCalledWith(dto);
    });
  });

  describe('getHoldings', () => {
    it('should get holdings successfully', async () => {
      fetchHoldingsUseCase.execute.mockResolvedValue([mockHolding]);

      const result = await controller.getHoldings('sec_1', {
        forceRefresh: false,
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(fetchHoldingsUseCase.execute).toHaveBeenCalledWith({
        accountId: 'sec_1',
        forceRefresh: false,
      });
    });

    it('should handle forceRefresh parameter', async () => {
      fetchHoldingsUseCase.execute.mockResolvedValue([mockHolding]);

      await controller.getHoldings('sec_1', { forceRefresh: true });

      expect(fetchHoldingsUseCase.execute).toHaveBeenCalledWith({
        accountId: 'sec_1',
        forceRefresh: true,
      });
    });

    it('should default forceRefresh to false', async () => {
      fetchHoldingsUseCase.execute.mockResolvedValue([mockHolding]);

      await controller.getHoldings('sec_1', {});

      expect(fetchHoldingsUseCase.execute).toHaveBeenCalledWith({
        accountId: 'sec_1',
        forceRefresh: false,
      });
    });
  });

  describe('getTransactions', () => {
    it('should get transactions successfully', async () => {
      fetchTransactionsUseCase.execute.mockResolvedValue([mockTransaction]);

      const result = await controller.getTransactions('sec_1', {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getPortfolioValue', () => {
    it('should calculate portfolio value successfully', async () => {
      const mockPortfolio = {
        securitiesAccountId: 'sec_1',
        totalEvaluationAmount: 280000,
        totalAcquisitionAmount: 250000,
        totalProfitLoss: 30000,
        totalProfitLossRate: 12,
        holdingCount: 1,
        portfolio: {
          holdings: [mockHolding.toJSON()],
          totalEvaluationAmount: 280000,
          totalAcquisitionAmount: 250000,
          totalProfitLoss: 30000,
          totalProfitLossRate: 12,
          holdingCount: 1,
        },
      };

      calculatePortfolioUseCase.execute.mockResolvedValue(mockPortfolio);

      const result = await controller.getPortfolioValue('sec_1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPortfolio);
      expect(calculatePortfolioUseCase.execute).toHaveBeenCalledWith({
        accountId: 'sec_1',
      });
    });
  });
});
