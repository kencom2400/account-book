import { Test, TestingModule } from '@nestjs/testing';
import { MockSecuritiesAPIAdapter } from './mock-securities-api.adapter';
import { HoldingEntity } from '../../domain/entities/holding.entity';
import { SecurityTransactionEntity } from '../../domain/entities/security-transaction.entity';

describe('MockSecuritiesAPIAdapter', () => {
  let adapter: MockSecuritiesAPIAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MockSecuritiesAPIAdapter],
    }).compile();

    adapter = module.get<MockSecuritiesAPIAdapter>(MockSecuritiesAPIAdapter);
  });

  describe('healthCheck', () => {
    it('should return success', async () => {
      const result = await adapter.healthCheck('sec_1');

      expect(result.success).toBe(true);
    });
  });

  describe('testConnection', () => {
    it('should return success with valid credentials', async () => {
      const result = await adapter.testConnection({
        loginId: 'testuser',
        password: 'testpass',
        accountNumber: '1234567890',
        tradingPassword: 'tradepass',
      });

      expect(result.success).toBe(true);
    });

    it('should return error with invalid credentials', async () => {
      const result = await adapter.testConnection({
        loginId: '',
        password: '',
        accountNumber: '1234567890',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });
  });

  describe('getAccountInfo', () => {
    it('should return account info', async () => {
      const result = await adapter.getAccountInfo({
        loginId: 'testuser',
        password: 'testpass',
        accountNumber: '1234567890',
      });

      expect(result.accountNumber).toBe('1234567890');
      expect(result.accountType).toBe('specific');
      expect(result.totalEvaluationAmount).toBe(2850000);
      expect(result.cashBalance).toBe(150000);
    });
  });

  describe('getHoldings', () => {
    it('should return holdings data', async () => {
      const result = await adapter.getHoldings({
        loginId: 'testuser',
        password: 'testpass',
        accountNumber: '1234567890',
      });

      expect(result).toHaveLength(4);
      expect(result[0].securityCode).toBe('7203');
      expect(result[0].securityName).toBe('トヨタ自動車');
    });
  });

  describe('getTransactions', () => {
    it('should return transactions data', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const result = await adapter.getTransactions(
        {
          loginId: 'testuser',
          password: 'testpass',
          accountNumber: '1234567890',
        },
        startDate,
        endDate,
      );

      expect(result).toHaveLength(3);
      expect(result[0].securityCode).toBe('7203');
      expect(result[0].transactionType).toBe('buy');
    });
  });

  describe('getCurrentPrice', () => {
    it('should return current price for known security', async () => {
      const result = await adapter.getCurrentPrice('7203');

      expect(result).toBe(2800);
    });

    it('should return default price for unknown security', async () => {
      const result = await adapter.getCurrentPrice('9999');

      expect(result).toBe(1000);
    });
  });

  describe('mapToHoldingEntity', () => {
    it('should map holding data to entity', () => {
      const data = {
        securityCode: '7203',
        securityName: 'トヨタ自動車',
        quantity: 100,
        averageAcquisitionPrice: 2500,
        currentPrice: 2800,
        securityType: 'stock' as const,
        market: '東証',
      };

      const result = adapter.mapToHoldingEntity('sec_1', data);

      expect(result).toBeInstanceOf(HoldingEntity);
      expect(result.securitiesAccountId).toBe('sec_1');
      expect(result.securityCode).toBe('7203');
    });
  });

  describe('mapToTransactionEntity', () => {
    it('should map transaction data to entity (Date)', () => {
      const data = {
        id: 'tx_1',
        securityCode: '7203',
        securityName: 'トヨタ自動車',
        transactionDate: new Date('2024-01-15'),
        transactionType: 'buy' as const,
        quantity: 100,
        price: 2500,
        fee: 500,
        status: 'completed' as const,
      };

      const result = adapter.mapToTransactionEntity('sec_1', data);

      expect(result).toBeInstanceOf(SecurityTransactionEntity);
      expect(result.securitiesAccountId).toBe('sec_1');
      expect(result.securityCode).toBe('7203');
    });

    it('should map transaction data to entity (string date)', () => {
      const data = {
        id: 'tx_1',
        securityCode: '7203',
        securityName: 'トヨタ自動車',
        transactionDate: '2024-01-15' as unknown as Date,
        transactionType: 'buy' as const,
        quantity: 100,
        price: 2500,
        fee: 500,
        status: 'completed' as const,
      };

      const result = adapter.mapToTransactionEntity('sec_1', data);

      expect(result).toBeInstanceOf(SecurityTransactionEntity);
    });
  });
});
