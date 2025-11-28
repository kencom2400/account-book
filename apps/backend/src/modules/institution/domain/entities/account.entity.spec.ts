import { AccountEntity } from './account.entity';

describe('AccountEntity', () => {
  const validAccount = {
    id: 'acc_123',
    institutionId: 'inst_456',
    accountNumber: '1234567890',
    accountName: '普通預金',
    balance: 100000,
    currency: 'JPY',
  };

  describe('constructor', () => {
    it('should create a valid account entity', () => {
      const account = new AccountEntity(
        validAccount.id,
        validAccount.institutionId,
        validAccount.accountNumber,
        validAccount.accountName,
        validAccount.balance,
        validAccount.currency,
      );

      expect(account.id).toBe('acc_123');
      expect(account.balance).toBe(100000);
      expect(account.currency).toBe('JPY');
    });

    it('should throw error when id is missing', () => {
      expect(
        () =>
          new AccountEntity(
            '',
            validAccount.institutionId,
            validAccount.accountNumber,
            validAccount.accountName,
            validAccount.balance,
            validAccount.currency,
          ),
      ).toThrow('Account ID is required');
    });

    it('should throw error when institutionId is missing', () => {
      expect(
        () =>
          new AccountEntity(
            validAccount.id,
            '',
            validAccount.accountNumber,
            validAccount.accountName,
            validAccount.balance,
            validAccount.currency,
          ),
      ).toThrow('Institution ID is required');
    });

    it('should throw error when accountNumber is missing', () => {
      expect(
        () =>
          new AccountEntity(
            validAccount.id,
            validAccount.institutionId,
            '',
            validAccount.accountName,
            validAccount.balance,
            validAccount.currency,
          ),
      ).toThrow('Account number is required');
    });

    it('should throw error when accountName is missing', () => {
      expect(
        () =>
          new AccountEntity(
            validAccount.id,
            validAccount.institutionId,
            validAccount.accountNumber,
            '',
            validAccount.balance,
            validAccount.currency,
          ),
      ).toThrow('Account name is required');
    });

    it('should throw error when balance is undefined', () => {
      expect(
        () =>
          new AccountEntity(
            validAccount.id,
            validAccount.institutionId,
            validAccount.accountNumber,
            validAccount.accountName,
            undefined as any,
            validAccount.currency,
          ),
      ).toThrow('Account balance is required');
    });

    it('should throw error when balance is null', () => {
      expect(
        () =>
          new AccountEntity(
            validAccount.id,
            validAccount.institutionId,
            validAccount.accountNumber,
            validAccount.accountName,
            null as any,
            validAccount.currency,
          ),
      ).toThrow('Account balance is required');
    });

    it('should throw error when currency is missing', () => {
      expect(
        () =>
          new AccountEntity(
            validAccount.id,
            validAccount.institutionId,
            validAccount.accountNumber,
            validAccount.accountName,
            validAccount.balance,
            '',
          ),
      ).toThrow('Currency is required');
    });

    it('should accept zero balance', () => {
      const account = new AccountEntity(
        validAccount.id,
        validAccount.institutionId,
        validAccount.accountNumber,
        validAccount.accountName,
        0,
        validAccount.currency,
      );

      expect(account.balance).toBe(0);
    });

    it('should accept negative balance', () => {
      const account = new AccountEntity(
        validAccount.id,
        validAccount.institutionId,
        validAccount.accountNumber,
        validAccount.accountName,
        -5000,
        validAccount.currency,
      );

      expect(account.balance).toBe(-5000);
    });
  });

  describe('updateBalance', () => {
    it('should update balance correctly', () => {
      const account = new AccountEntity(
        validAccount.id,
        validAccount.institutionId,
        validAccount.accountNumber,
        validAccount.accountName,
        100000,
        validAccount.currency,
      );

      const updated = account.updateBalance(150000);

      expect(updated.balance).toBe(150000);
      expect(account.balance).toBe(100000); // Original unchanged
    });

    it('should update to zero balance', () => {
      const account = new AccountEntity(
        validAccount.id,
        validAccount.institutionId,
        validAccount.accountNumber,
        validAccount.accountName,
        100000,
        validAccount.currency,
      );

      const updated = account.updateBalance(0);

      expect(updated.balance).toBe(0);
    });

    it('should update to negative balance', () => {
      const account = new AccountEntity(
        validAccount.id,
        validAccount.institutionId,
        validAccount.accountNumber,
        validAccount.accountName,
        100000,
        validAccount.currency,
      );

      const updated = account.updateBalance(-10000);

      expect(updated.balance).toBe(-10000);
    });
  });

  describe('hasPositiveBalance', () => {
    it('should return true for positive balance', () => {
      const account = new AccountEntity(
        validAccount.id,
        validAccount.institutionId,
        validAccount.accountNumber,
        validAccount.accountName,
        100000,
        validAccount.currency,
      );

      expect(account.hasPositiveBalance()).toBe(true);
    });

    it('should return false for zero balance', () => {
      const account = new AccountEntity(
        validAccount.id,
        validAccount.institutionId,
        validAccount.accountNumber,
        validAccount.accountName,
        0,
        validAccount.currency,
      );

      expect(account.hasPositiveBalance()).toBe(false);
    });

    it('should return false for negative balance', () => {
      const account = new AccountEntity(
        validAccount.id,
        validAccount.institutionId,
        validAccount.accountNumber,
        validAccount.accountName,
        -5000,
        validAccount.currency,
      );

      expect(account.hasPositiveBalance()).toBe(false);
    });
  });

  describe('hasNegativeBalance', () => {
    it('should return true for negative balance', () => {
      const account = new AccountEntity(
        validAccount.id,
        validAccount.institutionId,
        validAccount.accountNumber,
        validAccount.accountName,
        -5000,
        validAccount.currency,
      );

      expect(account.hasNegativeBalance()).toBe(true);
    });

    it('should return false for zero balance', () => {
      const account = new AccountEntity(
        validAccount.id,
        validAccount.institutionId,
        validAccount.accountNumber,
        validAccount.accountName,
        0,
        validAccount.currency,
      );

      expect(account.hasNegativeBalance()).toBe(false);
    });

    it('should return false for positive balance', () => {
      const account = new AccountEntity(
        validAccount.id,
        validAccount.institutionId,
        validAccount.accountNumber,
        validAccount.accountName,
        100000,
        validAccount.currency,
      );

      expect(account.hasNegativeBalance()).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should convert to JSON correctly', () => {
      const account = new AccountEntity(
        validAccount.id,
        validAccount.institutionId,
        validAccount.accountNumber,
        validAccount.accountName,
        validAccount.balance,
        validAccount.currency,
      );

      const json = account.toJSON();

      expect(json.id).toBe('acc_123');
      expect(json.institutionId).toBe('inst_456');
      expect(json.accountNumber).toBe('1234567890');
      expect(json.accountName).toBe('普通預金');
      expect(json.balance).toBe(100000);
      expect(json.currency).toBe('JPY');
    });
  });
});
