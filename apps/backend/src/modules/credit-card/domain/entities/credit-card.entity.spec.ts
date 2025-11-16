import { CreditCardEntity } from './credit-card.entity';
import {
  createTestCreditCard,
  createTestEncryptedCredentials,
} from '../../../../../test/helpers/credit-card.factory';

describe('CreditCardEntity', () => {
  describe('constructor', () => {
    it('should create a valid credit card entity', () => {
      const card = createTestCreditCard();

      expect(card.id).toBe('cc_test_123');
      expect(card.cardName).toBe('テストカード');
      expect(card.cardNumber).toBe('1234');
      expect(card.cardHolderName).toBe('山田太郎');
      expect(card.paymentDay).toBe(27);
      expect(card.closingDay).toBe(15);
      expect(card.creditLimit).toBe(500000);
      expect(card.currentBalance).toBe(125000);
      expect(card.issuer).toBe('テスト銀行');
      expect(card.isConnected).toBe(true);
    });

    it('should throw error when ID is missing', () => {
      expect(() => {
        new CreditCardEntity(
          '',
          'カード名',
          '1234',
          '山田太郎',
          new Date('2030-12-31'),
          createTestEncryptedCredentials(),
          true,
          new Date(),
          27,
          15,
          500000,
          0,
          'テスト銀行',
          new Date(),
          new Date(),
        );
      }).toThrow('CreditCard ID is required');
    });

    it('should throw error when card name is missing', () => {
      expect(() => {
        new CreditCardEntity(
          'cc_123',
          '',
          '1234',
          '山田太郎',
          new Date('2030-12-31'),
          createTestEncryptedCredentials(),
          true,
          new Date(),
          27,
          15,
          500000,
          0,
          'テスト銀行',
          new Date(),
          new Date(),
        );
      }).toThrow('Card name is required');
    });

    it('should throw error when card number is not 4 digits', () => {
      expect(() => {
        new CreditCardEntity(
          'cc_123',
          'カード名',
          '12345',
          '山田太郎',
          new Date('2030-12-31'),
          createTestEncryptedCredentials(),
          true,
          new Date(),
          27,
          15,
          500000,
          0,
          'テスト銀行',
          new Date(),
          new Date(),
        );
      }).toThrow('Card number must be last 4 digits');
    });

    it('should throw error when payment day is invalid', () => {
      expect(() => {
        new CreditCardEntity(
          'cc_123',
          'カード名',
          '1234',
          '山田太郎',
          new Date('2030-12-31'),
          createTestEncryptedCredentials(),
          true,
          new Date(),
          32, // 無効
          15,
          500000,
          0,
          'テスト銀行',
          new Date(),
          new Date(),
        );
      }).toThrow('Payment day must be between 1 and 31');
    });

    it('should throw error when credit limit is negative', () => {
      expect(() => {
        new CreditCardEntity(
          'cc_123',
          'カード名',
          '1234',
          '山田太郎',
          new Date('2030-12-31'),
          createTestEncryptedCredentials(),
          true,
          new Date(),
          27,
          15,
          -100000, // 負の値
          0,
          'テスト銀行',
          new Date(),
          new Date(),
        );
      }).toThrow('Credit limit must be positive');
    });

    it('should throw error when current balance exceeds credit limit', () => {
      expect(() => {
        new CreditCardEntity(
          'cc_123',
          'カード名',
          '1234',
          '山田太郎',
          new Date('2030-12-31'),
          createTestEncryptedCredentials(),
          true,
          new Date(),
          27,
          15,
          500000,
          600000, // 限度額超過
          'テスト銀行',
          new Date(),
          new Date(),
        );
      }).toThrow('Current balance cannot exceed credit limit');
    });
  });

  describe('isExpired', () => {
    it('should return true when card is expired', () => {
      const card = createTestCreditCard({
        expiryDate: new Date('2020-12-31'),
      });

      expect(card.isExpired()).toBe(true);
    });

    it('should return false when card is not expired', () => {
      const card = createTestCreditCard({
        expiryDate: new Date('2030-12-31'),
      });

      expect(card.isExpired()).toBe(false);
    });
  });

  describe('getAvailableCredit', () => {
    it('should calculate available credit correctly', () => {
      const card = createTestCreditCard({
        creditLimit: 500000,
        currentBalance: 125000,
      });

      expect(card.getAvailableCredit()).toBe(375000);
    });

    it('should return 0 when balance equals limit', () => {
      const card = createTestCreditCard({
        creditLimit: 500000,
        currentBalance: 500000,
      });

      expect(card.getAvailableCredit()).toBe(0);
    });
  });

  describe('getUtilizationRate', () => {
    it('should calculate utilization rate correctly', () => {
      const card = createTestCreditCard({
        creditLimit: 500000,
        currentBalance: 125000,
      });

      expect(card.getUtilizationRate()).toBe(25);
    });

    it('should return 0 when credit limit is 0', () => {
      const card = createTestCreditCard({
        creditLimit: 0,
        currentBalance: 0,
      });

      expect(card.getUtilizationRate()).toBe(0);
    });
  });

  describe('updateConnectionStatus', () => {
    it('should update connection status', async () => {
      const card = createTestCreditCard({ isConnected: true });

      // 少し待機してupdatedAtが確実に変わるようにする
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = card.updateConnectionStatus(false);

      expect(card.isConnected).toBe(true);
      expect(updated.isConnected).toBe(false);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        card.updatedAt.getTime(),
      );
    });
  });

  describe('updateLastSyncedAt', () => {
    it('should update last synced date', () => {
      const card = createTestCreditCard();
      const newDate = new Date('2025-02-01');

      const updated = card.updateLastSyncedAt(newDate);

      expect(updated.lastSyncedAt).toEqual(newDate);
    });
  });

  describe('updateBalance', () => {
    it('should update balance successfully', () => {
      const card = createTestCreditCard({
        creditLimit: 500000,
        currentBalance: 100000,
      });

      const updated = card.updateBalance(200000);

      expect(updated.currentBalance).toBe(200000);
    });

    it('should throw error when new balance is negative', () => {
      const card = createTestCreditCard();

      expect(() => {
        card.updateBalance(-1000);
      }).toThrow('Balance must be positive');
    });

    it('should throw error when new balance exceeds limit', () => {
      const card = createTestCreditCard({
        creditLimit: 500000,
      });

      expect(() => {
        card.updateBalance(600000);
      }).toThrow('Balance cannot exceed credit limit');
    });
  });

  describe('updateCredentials', () => {
    it('should update credentials', () => {
      const card = createTestCreditCard();
      const newCredentials = createTestEncryptedCredentials({
        encrypted: 'new_encrypted_data',
      });

      const updated = card.updateCredentials(newCredentials);

      expect(updated.credentials.encrypted).toBe('new_encrypted_data');
    });
  });

  describe('toJSON', () => {
    it('should convert to JSON correctly', () => {
      const card = createTestCreditCard();

      const json = card.toJSON();

      expect(json.id).toBe(card.id);
      expect(json.cardName).toBe(card.cardName);
      expect(json.availableCredit).toBe(card.getAvailableCredit());
      expect(json.utilizationRate).toBe(card.getUtilizationRate());
      expect(json.isExpired).toBe(card.isExpired());
    });
  });
});
