import { SecuritiesAccountEntity } from './securities-account.entity';
import { EncryptedCredentials } from '../../../institution/domain/value-objects/encrypted-credentials.vo';

describe('SecuritiesAccountEntity', () => {
  const mockCredentials = new EncryptedCredentials(
    'encrypted',
    'iv',
    'authTag',
    'aes-256-gcm',
    '1.0',
  );
  const validData = {
    id: 'sec_123',
    securitiesCompanyName: 'SBI証券',
    accountNumber: '12345678',
    accountType: 'specific' as const,
    credentials: mockCredentials,
    isConnected: true,
    lastSyncedAt: new Date(),
    totalEvaluationAmount: 1000000,
    cashBalance: 100000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('constructor', () => {
    it('should create a valid securities account entity', () => {
      const account = new SecuritiesAccountEntity(...Object.values(validData));

      expect(account.id).toBe(validData.id);
      expect(account.securitiesCompanyName).toBe(
        validData.securitiesCompanyName,
      );
      expect(account.accountNumber).toBe(validData.accountNumber);
      expect(account.accountType).toBe(validData.accountType);
    });

    it('should throw error when ID is missing', () => {
      expect(() => {
        new SecuritiesAccountEntity(
          '',
          validData.securitiesCompanyName,
          validData.accountNumber,
          validData.accountType,
          validData.credentials,
          validData.isConnected,
          validData.lastSyncedAt,
          validData.totalEvaluationAmount,
          validData.cashBalance,
          validData.createdAt,
          validData.updatedAt,
        );
      }).toThrow('Securities account ID is required');
    });

    it('should throw error when evaluation amount is negative', () => {
      expect(() => {
        new SecuritiesAccountEntity(
          validData.id,
          validData.securitiesCompanyName,
          validData.accountNumber,
          validData.accountType,
          validData.credentials,
          validData.isConnected,
          validData.lastSyncedAt,
          -1000,
          validData.cashBalance,
          validData.createdAt,
          validData.updatedAt,
        );
      }).toThrow('Total evaluation amount must be non-negative');
    });
  });

  describe('getTotalAssets', () => {
    it('should calculate total assets correctly', () => {
      const account = new SecuritiesAccountEntity(...Object.values(validData));
      const totalAssets = account.getTotalAssets();
      expect(totalAssets).toBe(1100000); // 1000000 + 100000
    });
  });

  describe('updateConnectionStatus', () => {
    it('should update connection status', () => {
      const account = new SecuritiesAccountEntity(...Object.values(validData));
      const updated = account.updateConnectionStatus(false);

      expect(updated.isConnected).toBe(false);
      expect(updated.id).toBe(account.id);
    });
  });

  describe('updateBalances', () => {
    it('should update balances correctly', () => {
      const account = new SecuritiesAccountEntity(...Object.values(validData));
      const updated = account.updateBalances(1500000, 200000);

      expect(updated.totalEvaluationAmount).toBe(1500000);
      expect(updated.cashBalance).toBe(200000);
    });

    it('should throw error when new balance is negative', () => {
      const account = new SecuritiesAccountEntity(...Object.values(validData));

      expect(() => {
        account.updateBalances(-1000, 200000);
      }).toThrow('Total evaluation amount must be non-negative');
    });
  });

  describe('toJSON', () => {
    it('should convert to JSON correctly', () => {
      const account = new SecuritiesAccountEntity(...Object.values(validData));
      const json = account.toJSON();

      expect(json.id).toBe(validData.id);
      expect(json.securitiesCompanyName).toBe(validData.securitiesCompanyName);
      expect(json.totalEvaluationAmount).toBe(validData.totalEvaluationAmount);
      expect(json.cashBalance).toBe(validData.cashBalance);
    });
  });
});
