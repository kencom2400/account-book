import { MockBankApiAdapter } from './mock-bank-api.adapter';
import { BankCredentials, BankAccountType, BankTransactionType } from '@account-book/types';

describe('MockBankApiAdapter', () => {
  let adapter: MockBankApiAdapter;

  beforeEach(() => {
    adapter = new MockBankApiAdapter('0000');
  });

  describe('getBankCode', () => {
    it('should return the bank code', () => {
      expect(adapter.getBankCode()).toBe('0000');
    });

    it('should return custom bank code', () => {
      const customAdapter = new MockBankApiAdapter('0005');
      expect(customAdapter.getBankCode()).toBe('0005');
    });
  });

  describe('testConnection', () => {
    it('should return success for valid credentials', async () => {
      const credentials: BankCredentials = {
        bankCode: '0000',
        branchCode: '001',
        accountNumber: '1234567',
      };

      const result = await adapter.testConnection(credentials);

      expect(result.success).toBe(true);
      expect(result.message).toBe('接続に成功しました');
      expect(result.accountInfo).toBeDefined();
      expect(result.accountInfo?.bankName).toBe('テスト銀行');
      expect(result.accountInfo?.branchName).toBe('テスト支店');
      expect(result.accountInfo?.accountNumber).toBe(credentials.accountNumber);
    });

    it('should return failure for invalid bank code', async () => {
      const credentials: BankCredentials = {
        bankCode: 'invalid',
        branchCode: '001',
        accountNumber: '1234567',
      };

      const result = await adapter.testConnection(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe('認証情報が不正です');
      expect(result.errorCode).toBe('BE001');
    });

    it('should return failure for invalid branch code', async () => {
      const credentials: BankCredentials = {
        bankCode: '0000',
        branchCode: 'ab',
        accountNumber: '1234567',
      };

      const result = await adapter.testConnection(credentials);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('BE001');
    });

    it('should return failure for invalid account number', async () => {
      const credentials: BankCredentials = {
        bankCode: '0000',
        branchCode: '001',
        accountNumber: '123',
      };

      const result = await adapter.testConnection(credentials);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('BE001');
    });

    it('should return account info with correct structure', async () => {
      const credentials: BankCredentials = {
        bankCode: '0000',
        branchCode: '001',
        accountNumber: '1234567',
      };

      const result = await adapter.testConnection(credentials);

      expect(result.accountInfo).toMatchObject({
        bankName: expect.any(String),
        branchName: expect.any(String),
        accountNumber: expect.any(String),
        accountHolder: expect.any(String),
        accountType: expect.any(String),
        balance: expect.any(Number),
        availableBalance: expect.any(Number),
      });
    });
  });

  describe('getAccountInfo', () => {
    it('should return account info for valid credentials', async () => {
      const credentials: BankCredentials = {
        bankCode: '0000',
        branchCode: '001',
        accountNumber: '1234567',
      };

      const accountInfo = await adapter.getAccountInfo(credentials);

      expect(accountInfo.bankName).toBe('テスト銀行');
      expect(accountInfo.branchName).toBe('テスト支店');
      expect(accountInfo.accountNumber).toBe('1234567');
      expect(accountInfo.accountHolder).toBe('テスト　タロウ');
      expect(accountInfo.accountType).toBe(BankAccountType.ORDINARY);
      expect(accountInfo.balance).toBe(1000000);
      expect(accountInfo.availableBalance).toBe(1000000);
    });

    it('should throw error for invalid credentials', async () => {
      const credentials: BankCredentials = {
        bankCode: 'invalid',
        branchCode: '001',
        accountNumber: '1234567',
      };

      await expect(adapter.getAccountInfo(credentials)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('getTransactions', () => {
    it('should return mock transactions', async () => {
      const credentials: BankCredentials = {
        bankCode: '0000',
        branchCode: '001',
        accountNumber: '1234567',
      };

      const transactions = await adapter.getTransactions(
        credentials,
        '2025-11-01',
        '2025-11-30',
      );

      expect(transactions).toBeInstanceOf(Array);
      expect(transactions.length).toBeGreaterThan(0);
    });

    it('should return transactions with correct structure', async () => {
      const credentials: BankCredentials = {
        bankCode: '0000',
        branchCode: '001',
        accountNumber: '1234567',
      };

      const transactions = await adapter.getTransactions(
        credentials,
        '2025-11-01',
        '2025-11-30',
      );

      const transaction = transactions[0];

      expect(transaction).toMatchObject({
        transactionId: expect.any(String),
        date: expect.any(String),
        type: expect.any(String),
        amount: expect.any(Number),
        balance: expect.any(Number),
        description: expect.any(String),
      });
    });

    it('should return transactions with valid types', async () => {
      const credentials: BankCredentials = {
        bankCode: '0000',
        branchCode: '001',
        accountNumber: '1234567',
      };

      const transactions = await adapter.getTransactions(
        credentials,
        '2025-11-01',
        '2025-11-30',
      );

      const validTypes = Object.values(BankTransactionType);
      transactions.forEach((transaction) => {
        expect(validTypes).toContain(transaction.type);
      });
    });

    it('should throw error for invalid credentials', async () => {
      const credentials: BankCredentials = {
        bankCode: 'invalid',
        branchCode: '001',
        accountNumber: '1234567',
      };

      await expect(
        adapter.getTransactions(credentials, '2025-11-01', '2025-11-30'),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should return transactions sorted by date', async () => {
      const credentials: BankCredentials = {
        bankCode: '0000',
        branchCode: '001',
        accountNumber: '1234567',
      };

      const transactions = await adapter.getTransactions(
        credentials,
        '2025-11-01',
        '2025-11-30',
      );

      for (let i = 0; i < transactions.length - 1; i++) {
        const currentDate = new Date(transactions[i].date);
        const nextDate = new Date(transactions[i + 1].date);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
      }
    });
  });

  describe('validation', () => {
    it('should validate bank code format (4 digits)', async () => {
      const validCodes = ['0000', '0005', '9999'];
      const invalidCodes = ['00', '000', '00000', 'abcd', ''];

      for (const code of validCodes) {
        const credentials: BankCredentials = {
          bankCode: code,
          branchCode: '001',
          accountNumber: '1234567',
        };
        const result = await adapter.testConnection(credentials);
        expect(result.success).toBe(true);
      }

      for (const code of invalidCodes) {
        const credentials: BankCredentials = {
          bankCode: code,
          branchCode: '001',
          accountNumber: '1234567',
        };
        const result = await adapter.testConnection(credentials);
        expect(result.success).toBe(false);
      }
    });

    it('should validate branch code format (3 digits)', async () => {
      const validCodes = ['001', '100', '999'];
      const invalidCodes = ['00', '0001', 'abc', ''];

      for (const code of validCodes) {
        const credentials: BankCredentials = {
          bankCode: '0000',
          branchCode: code,
          accountNumber: '1234567',
        };
        const result = await adapter.testConnection(credentials);
        expect(result.success).toBe(true);
      }

      for (const code of invalidCodes) {
        const credentials: BankCredentials = {
          bankCode: '0000',
          branchCode: code,
          accountNumber: '1234567',
        };
        const result = await adapter.testConnection(credentials);
        expect(result.success).toBe(false);
      }
    });

    it('should validate account number format (7 digits)', async () => {
      const validNumbers = ['1234567', '0000000', '9999999'];
      const invalidNumbers = ['123456', '12345678', 'abcdefg', ''];

      for (const number of validNumbers) {
        const credentials: BankCredentials = {
          bankCode: '0000',
          branchCode: '001',
          accountNumber: number,
        };
        const result = await adapter.testConnection(credentials);
        expect(result.success).toBe(true);
      }

      for (const number of invalidNumbers) {
        const credentials: BankCredentials = {
          bankCode: '0000',
          branchCode: '001',
          accountNumber: number,
        };
        const result = await adapter.testConnection(credentials);
        expect(result.success).toBe(false);
      }
    });
  });
});

