import { SecurityTransactionEntity } from './security-transaction.entity';

describe('SecurityTransactionEntity', () => {
  const validTransaction = {
    id: 'tx_123',
    securitiesAccountId: 'sec_456',
    securityCode: '7203',
    securityName: 'Toyota Motor',
    transactionDate: new Date('2024-01-15'),
    transactionType: 'buy' as const,
    quantity: 100,
    price: 2500,
    fee: 500,
    status: 'completed' as const,
    createdAt: new Date('2024-01-15'),
  };

  describe('constructor', () => {
    it('should create a valid security transaction', () => {
      const transaction = new SecurityTransactionEntity(
        validTransaction.id,
        validTransaction.securitiesAccountId,
        validTransaction.securityCode,
        validTransaction.securityName,
        validTransaction.transactionDate,
        validTransaction.transactionType,
        validTransaction.quantity,
        validTransaction.price,
        validTransaction.fee,
        validTransaction.status,
        validTransaction.createdAt,
      );

      expect(transaction.id).toBe('tx_123');
      expect(transaction.quantity).toBe(100);
      expect(transaction.price).toBe(2500);
    });

    it('should throw error when ID is missing', () => {
      expect(
        () =>
          new SecurityTransactionEntity(
            '',
            validTransaction.securitiesAccountId,
            validTransaction.securityCode,
            validTransaction.securityName,
            validTransaction.transactionDate,
            validTransaction.transactionType,
            validTransaction.quantity,
            validTransaction.price,
            validTransaction.fee,
            validTransaction.status,
            validTransaction.createdAt,
          ),
      ).toThrow('Transaction ID is required');
    });

    it('should throw error when securities account ID is missing', () => {
      expect(
        () =>
          new SecurityTransactionEntity(
            validTransaction.id,
            '',
            validTransaction.securityCode,
            validTransaction.securityName,
            validTransaction.transactionDate,
            validTransaction.transactionType,
            validTransaction.quantity,
            validTransaction.price,
            validTransaction.fee,
            validTransaction.status,
            validTransaction.createdAt,
          ),
      ).toThrow('Securities account ID is required');
    });

    it('should throw error when quantity is negative', () => {
      expect(
        () =>
          new SecurityTransactionEntity(
            validTransaction.id,
            validTransaction.securitiesAccountId,
            validTransaction.securityCode,
            validTransaction.securityName,
            validTransaction.transactionDate,
            validTransaction.transactionType,
            -10,
            validTransaction.price,
            validTransaction.fee,
            validTransaction.status,
            validTransaction.createdAt,
          ),
      ).toThrow('Quantity must be non-negative');
    });

    it('should throw error when price is negative', () => {
      expect(
        () =>
          new SecurityTransactionEntity(
            validTransaction.id,
            validTransaction.securitiesAccountId,
            validTransaction.securityCode,
            validTransaction.securityName,
            validTransaction.transactionDate,
            validTransaction.transactionType,
            validTransaction.quantity,
            -100,
            validTransaction.fee,
            validTransaction.status,
            validTransaction.createdAt,
          ),
      ).toThrow('Price must be non-negative');
    });

    it('should throw error when fee is negative', () => {
      expect(
        () =>
          new SecurityTransactionEntity(
            validTransaction.id,
            validTransaction.securitiesAccountId,
            validTransaction.securityCode,
            validTransaction.securityName,
            validTransaction.transactionDate,
            validTransaction.transactionType,
            validTransaction.quantity,
            validTransaction.price,
            -50,
            validTransaction.status,
            validTransaction.createdAt,
          ),
      ).toThrow('Fee must be non-negative');
    });

    it('should accept all valid transaction types', () => {
      const types: Array<
        'buy' | 'sell' | 'dividend' | 'distribution' | 'split' | 'other'
      > = ['buy', 'sell', 'dividend', 'distribution', 'split', 'other'];

      types.forEach((type) => {
        const transaction = new SecurityTransactionEntity(
          validTransaction.id,
          validTransaction.securitiesAccountId,
          validTransaction.securityCode,
          validTransaction.securityName,
          validTransaction.transactionDate,
          type,
          validTransaction.quantity,
          validTransaction.price,
          validTransaction.fee,
          validTransaction.status,
          validTransaction.createdAt,
        );

        expect(transaction.transactionType).toBe(type);
      });
    });

    it('should accept all valid statuses', () => {
      const statuses: Array<'pending' | 'completed' | 'cancelled'> = [
        'pending',
        'completed',
        'cancelled',
      ];

      statuses.forEach((status) => {
        const transaction = new SecurityTransactionEntity(
          validTransaction.id,
          validTransaction.securitiesAccountId,
          validTransaction.securityCode,
          validTransaction.securityName,
          validTransaction.transactionDate,
          validTransaction.transactionType,
          validTransaction.quantity,
          validTransaction.price,
          validTransaction.fee,
          status,
          validTransaction.createdAt,
        );

        expect(transaction.status).toBe(status);
      });
    });
  });

  describe('getAmount', () => {
    it('should calculate amount correctly', () => {
      const transaction = new SecurityTransactionEntity(
        validTransaction.id,
        validTransaction.securitiesAccountId,
        validTransaction.securityCode,
        validTransaction.securityName,
        validTransaction.transactionDate,
        validTransaction.transactionType,
        100,
        2500,
        validTransaction.fee,
        validTransaction.status,
        validTransaction.createdAt,
      );

      expect(transaction.getAmount()).toBe(250000); // 100 * 2500
    });
  });

  describe('getTotalAmount', () => {
    it('should calculate total amount for buy transaction', () => {
      const buyTransaction = new SecurityTransactionEntity(
        validTransaction.id,
        validTransaction.securitiesAccountId,
        validTransaction.securityCode,
        validTransaction.securityName,
        validTransaction.transactionDate,
        'buy',
        100,
        2500,
        500,
        validTransaction.status,
        validTransaction.createdAt,
      );

      expect(buyTransaction.getTotalAmount()).toBe(250500); // 250000 + 500
    });

    it('should calculate total amount for sell transaction', () => {
      const sellTransaction = new SecurityTransactionEntity(
        validTransaction.id,
        validTransaction.securitiesAccountId,
        validTransaction.securityCode,
        validTransaction.securityName,
        validTransaction.transactionDate,
        'sell',
        100,
        2500,
        500,
        validTransaction.status,
        validTransaction.createdAt,
      );

      expect(sellTransaction.getTotalAmount()).toBe(249500); // 250000 - 500
    });

    it('should not include fee for dividend transactions', () => {
      const dividendTransaction = new SecurityTransactionEntity(
        validTransaction.id,
        validTransaction.securitiesAccountId,
        validTransaction.securityCode,
        validTransaction.securityName,
        validTransaction.transactionDate,
        'dividend',
        0,
        10000,
        500,
        validTransaction.status,
        validTransaction.createdAt,
      );

      expect(dividendTransaction.getTotalAmount()).toBe(0); // quantity * price
    });
  });

  describe('isBuy', () => {
    it('should return true for buy transaction', () => {
      const transaction = new SecurityTransactionEntity(
        validTransaction.id,
        validTransaction.securitiesAccountId,
        validTransaction.securityCode,
        validTransaction.securityName,
        validTransaction.transactionDate,
        'buy',
        validTransaction.quantity,
        validTransaction.price,
        validTransaction.fee,
        validTransaction.status,
        validTransaction.createdAt,
      );

      expect(transaction.isBuy()).toBe(true);
    });

    it('should return false for non-buy transaction', () => {
      const transaction = new SecurityTransactionEntity(
        validTransaction.id,
        validTransaction.securitiesAccountId,
        validTransaction.securityCode,
        validTransaction.securityName,
        validTransaction.transactionDate,
        'sell',
        validTransaction.quantity,
        validTransaction.price,
        validTransaction.fee,
        validTransaction.status,
        validTransaction.createdAt,
      );

      expect(transaction.isBuy()).toBe(false);
    });
  });

  describe('isSell', () => {
    it('should return true for sell transaction', () => {
      const transaction = new SecurityTransactionEntity(
        validTransaction.id,
        validTransaction.securitiesAccountId,
        validTransaction.securityCode,
        validTransaction.securityName,
        validTransaction.transactionDate,
        'sell',
        validTransaction.quantity,
        validTransaction.price,
        validTransaction.fee,
        validTransaction.status,
        validTransaction.createdAt,
      );

      expect(transaction.isSell()).toBe(true);
    });

    it('should return false for non-sell transaction', () => {
      const transaction = new SecurityTransactionEntity(
        validTransaction.id,
        validTransaction.securitiesAccountId,
        validTransaction.securityCode,
        validTransaction.securityName,
        validTransaction.transactionDate,
        'buy',
        validTransaction.quantity,
        validTransaction.price,
        validTransaction.fee,
        validTransaction.status,
        validTransaction.createdAt,
      );

      expect(transaction.isSell()).toBe(false);
    });
  });

  describe('isIncome', () => {
    it('should return true for dividend transaction', () => {
      const dividendTransaction = new SecurityTransactionEntity(
        validTransaction.id,
        validTransaction.securitiesAccountId,
        validTransaction.securityCode,
        validTransaction.securityName,
        validTransaction.transactionDate,
        'dividend',
        0,
        10000,
        0,
        validTransaction.status,
        validTransaction.createdAt,
      );

      expect(dividendTransaction.isIncome()).toBe(true);
    });

    it('should return true for distribution transaction', () => {
      const distributionTransaction = new SecurityTransactionEntity(
        validTransaction.id,
        validTransaction.securitiesAccountId,
        validTransaction.securityCode,
        validTransaction.securityName,
        validTransaction.transactionDate,
        'distribution',
        0,
        10000,
        0,
        validTransaction.status,
        validTransaction.createdAt,
      );

      expect(distributionTransaction.isIncome()).toBe(true);
    });

    it('should return false for other transaction types', () => {
      const transaction = new SecurityTransactionEntity(
        validTransaction.id,
        validTransaction.securitiesAccountId,
        validTransaction.securityCode,
        validTransaction.securityName,
        validTransaction.transactionDate,
        'buy',
        validTransaction.quantity,
        validTransaction.price,
        validTransaction.fee,
        validTransaction.status,
        validTransaction.createdAt,
      );

      expect(transaction.isIncome()).toBe(false);
    });
  });

  describe('markAsCompleted', () => {
    it('should mark transaction as completed', () => {
      const pendingTransaction = new SecurityTransactionEntity(
        validTransaction.id,
        validTransaction.securitiesAccountId,
        validTransaction.securityCode,
        validTransaction.securityName,
        validTransaction.transactionDate,
        validTransaction.transactionType,
        validTransaction.quantity,
        validTransaction.price,
        validTransaction.fee,
        'pending',
        validTransaction.createdAt,
      );

      const completed = pendingTransaction.markAsCompleted();

      expect(completed.status).toBe('completed');
      expect(pendingTransaction.status).toBe('pending'); // Original unchanged
    });
  });

  describe('markAsCancelled', () => {
    it('should mark transaction as cancelled', () => {
      const pendingTransaction = new SecurityTransactionEntity(
        validTransaction.id,
        validTransaction.securitiesAccountId,
        validTransaction.securityCode,
        validTransaction.securityName,
        validTransaction.transactionDate,
        validTransaction.transactionType,
        validTransaction.quantity,
        validTransaction.price,
        validTransaction.fee,
        'pending',
        validTransaction.createdAt,
      );

      const cancelled = pendingTransaction.markAsCancelled();

      expect(cancelled.status).toBe('cancelled');
      expect(pendingTransaction.status).toBe('pending'); // Original unchanged
    });
  });

  describe('toJSON', () => {
    it('should convert to JSON correctly', () => {
      const transaction = new SecurityTransactionEntity(
        validTransaction.id,
        validTransaction.securitiesAccountId,
        validTransaction.securityCode,
        validTransaction.securityName,
        validTransaction.transactionDate,
        'buy',
        100,
        2500,
        500,
        validTransaction.status,
        validTransaction.createdAt,
      );

      const json = transaction.toJSON();

      expect(json.id).toBe('tx_123');
      expect(json.quantity).toBe(100);
      expect(json.price).toBe(2500);
      expect(json.amount).toBe(250000);
      expect(json.fee).toBe(500);
      expect(json.totalAmount).toBe(250500);
      expect(json.transactionType).toBe('buy');
      expect(json.status).toBe('completed');
    });
  });
});
