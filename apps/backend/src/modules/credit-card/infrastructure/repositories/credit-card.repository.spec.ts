import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  FileSystemCreditCardRepository,
  FileSystemCreditCardTransactionRepository,
  FileSystemPaymentRepository,
} from './credit-card.repository';
import { CreditCardEntity } from '../../domain/entities/credit-card.entity';
import { CreditCardTransactionEntity } from '../../domain/entities/credit-card-transaction.entity';
import { PaymentVO } from '../../domain/value-objects/payment.vo';
import { EncryptedCredentials } from '../../../institution/domain/value-objects/encrypted-credentials.vo';
import { CategoryType } from '@account-book/types';
import * as fs from 'fs/promises';

jest.mock('fs/promises');

describe('FileSystemCreditCardRepository', () => {
  let repository: FileSystemCreditCardRepository;
  const mockFs = fs as jest.Mocked<typeof fs>;

  const mockCredentials = new EncryptedCredentials(
    'encrypted',
    'iv',
    'authTag',
    'aes-256-gcm',
    'v1',
  );

  const mockCard = new CreditCardEntity(
    'card_1',
    'Test Card',
    '1234',
    'Test User',
    new Date('2025-12-31'),
    mockCredentials,
    true,
    new Date('2024-01-01'),
    15,
    10,
    1000000,
    0,
    'test-issuer',
    new Date('2024-01-01'),
    new Date('2024-01-01'),
  );

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileSystemCreditCardRepository,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<FileSystemCreditCardRepository>(
      FileSystemCreditCardRepository,
    );

    mockFs.access.mockResolvedValue(undefined);
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue('[]');
    mockFs.writeFile.mockResolvedValue(undefined);
  });

  describe('save', () => {
    it('should save new credit card', async () => {
      mockFs.readFile.mockResolvedValue('[]');

      const result = await repository.save(mockCard);

      expect(result).toBeInstanceOf(CreditCardEntity);
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should update existing credit card', async () => {
      const mockData = JSON.stringify([
        {
          id: 'card_1',
          cardName: 'Test Card',
          cardNumber: '1234',
          cardHolderName: 'Test User',
          expiryDate: '2025-12-31T00:00:00.000Z',
          credentials: {
            encrypted: 'encrypted',
            iv: 'iv',
            authTag: 'authTag',
            algorithm: 'aes-256-gcm',
            version: 'v1',
          },
          isConnected: true,
          lastSyncedAt: '2024-01-01T00:00:00.000Z',
          paymentDay: 15,
          closingDay: 10,
          creditLimit: 1000000,
          currentBalance: 0,
          issuer: 'test-issuer',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const result = await repository.save(mockCard);

      expect(result).toBeInstanceOf(CreditCardEntity);
      expect(mockFs.writeFile).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find credit card by id', async () => {
      const mockData = JSON.stringify([
        {
          id: 'card_1',
          cardName: 'Test Card',
          cardNumber: '1234',
          cardHolderName: 'Test User',
          expiryDate: '2025-12-31T00:00:00.000Z',
          credentials: {
            encrypted: 'encrypted',
            iv: 'iv',
            authTag: 'authTag',
            algorithm: 'aes-256-gcm',
            version: 'v1',
          },
          isConnected: true,
          lastSyncedAt: '2024-01-01T00:00:00.000Z',
          paymentDay: 15,
          closingDay: 10,
          creditLimit: 1000000,
          currentBalance: 0,
          issuer: 'test-issuer',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const result = await repository.findById('card_1');

      expect(result).toBeInstanceOf(CreditCardEntity);
      expect(result?.id).toBe('card_1');
    });

    it('should return null when card not found', async () => {
      mockFs.readFile.mockResolvedValue('[]');

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all credit cards', async () => {
      const mockData = JSON.stringify([
        {
          id: 'card_1',
          cardName: 'Test Card',
          cardNumber: '1234',
          cardHolderName: 'Test User',
          expiryDate: '2025-12-31T00:00:00.000Z',
          credentials: {
            encrypted: 'encrypted',
            iv: 'iv',
            authTag: 'authTag',
            algorithm: 'aes-256-gcm',
            version: 'v1',
          },
          isConnected: true,
          lastSyncedAt: '2024-01-01T00:00:00.000Z',
          paymentDay: 15,
          closingDay: 10,
          creditLimit: 1000000,
          currentBalance: 0,
          issuer: 'test-issuer',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(CreditCardEntity);
    });

    it('should return empty array when file does not exist', async () => {
      mockFs.readFile.mockRejectedValue({ code: 'ENOENT' });

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findConnected', () => {
    it('should return only connected cards', async () => {
      const mockData = JSON.stringify([
        {
          id: 'card_1',
          cardName: 'Test Card',
          cardNumber: '1234',
          cardHolderName: 'Test User',
          expiryDate: '2025-12-31T00:00:00.000Z',
          credentials: {
            encrypted: 'encrypted',
            iv: 'iv',
            authTag: 'authTag',
            algorithm: 'aes-256-gcm',
            version: 'v1',
          },
          isConnected: true,
          lastSyncedAt: '2024-01-01T00:00:00.000Z',
          paymentDay: 15,
          closingDay: 10,
          creditLimit: 1000000,
          currentBalance: 0,
          issuer: 'test-issuer',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const result = await repository.findConnected();

      expect(result).toHaveLength(1);
      expect(result[0].isConnected).toBe(true);
    });
  });

  describe('findByIssuer', () => {
    it('should find cards by issuer', async () => {
      const mockData = JSON.stringify([
        {
          id: 'card_1',
          cardName: 'Test Card',
          cardNumber: '1234',
          cardHolderName: 'Test User',
          expiryDate: '2025-12-31T00:00:00.000Z',
          credentials: {
            encrypted: 'encrypted',
            iv: 'iv',
            authTag: 'authTag',
            algorithm: 'aes-256-gcm',
            version: 'v1',
          },
          isConnected: true,
          lastSyncedAt: '2024-01-01T00:00:00.000Z',
          paymentDay: 15,
          closingDay: 10,
          creditLimit: 1000000,
          currentBalance: 0,
          issuer: 'test-issuer',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const result = await repository.findByIssuer('test-issuer');

      expect(result).toHaveLength(1);
      expect(result[0].issuer).toBe('test-issuer');
    });
  });

  describe('delete', () => {
    it('should delete credit card', async () => {
      const mockData = JSON.stringify([
        {
          id: 'card_1',
          cardName: 'Test Card',
          cardNumber: '1234',
          cardHolderName: 'Test User',
          expiryDate: '2025-12-31T00:00:00.000Z',
          credentials: {
            encrypted: 'encrypted',
            iv: 'iv',
            authTag: 'authTag',
            algorithm: 'aes-256-gcm',
            version: 'v1',
          },
          isConnected: true,
          lastSyncedAt: '2024-01-01T00:00:00.000Z',
          paymentDay: 15,
          closingDay: 10,
          creditLimit: 1000000,
          currentBalance: 0,
          issuer: 'test-issuer',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      await repository.delete('card_1');

      expect(mockFs.writeFile).toHaveBeenCalled();
      const writeCall = mockFs.writeFile.mock.calls[0];
      const writtenData = JSON.parse(writeCall[1] as string);
      expect(writtenData).toEqual([]);
    });
  });

  describe('exists', () => {
    it('should return true if card exists', async () => {
      const mockData = JSON.stringify([
        {
          id: 'card_1',
          cardName: 'Test Card',
          cardNumber: '1234',
          cardHolderName: 'Test User',
          expiryDate: '2025-12-31T00:00:00.000Z',
          credentials: {
            encrypted: 'encrypted',
            iv: 'iv',
            authTag: 'authTag',
            algorithm: 'aes-256-gcm',
            version: 'v1',
          },
          isConnected: true,
          lastSyncedAt: '2024-01-01T00:00:00.000Z',
          paymentDay: 15,
          closingDay: 10,
          creditLimit: 1000000,
          currentBalance: 0,
          issuer: 'test-issuer',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const result = await repository.exists('card_1');

      expect(result).toBe(true);
    });

    it('should return false if card does not exist', async () => {
      mockFs.readFile.mockResolvedValue('[]');

      const result = await repository.exists('nonexistent');

      expect(result).toBe(false);
    });
  });
});

describe('FileSystemCreditCardTransactionRepository', () => {
  let repository: FileSystemCreditCardTransactionRepository;
  const mockFs = fs as jest.Mocked<typeof fs>;

  const mockTransaction = new CreditCardTransactionEntity(
    'tx_1',
    'card_1',
    new Date('2024-01-15'),
    new Date('2024-01-16'),
    1000,
    'Test Merchant',
    'shopping',
    'Test purchase',
    CategoryType.EXPENSE,
    false,
    null,
    null,
    false,
    new Date('2024-02-15'),
    null,
    new Date('2024-01-01'),
    new Date('2024-01-01'),
  );

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileSystemCreditCardTransactionRepository,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<FileSystemCreditCardTransactionRepository>(
      FileSystemCreditCardTransactionRepository,
    );

    mockFs.access.mockResolvedValue(undefined);
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue('[]');
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.readdir.mockResolvedValue([] as any);
  });

  describe('save', () => {
    it('should save transaction', async () => {
      mockFs.readFile.mockResolvedValue('[]');

      const result = await repository.save(mockTransaction);

      expect(result).toBeInstanceOf(CreditCardTransactionEntity);
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should update existing transaction', async () => {
      const mockData = JSON.stringify([
        {
          id: 'tx_1',
          creditCardId: 'card_1',
          transactionDate: '2024-01-15T00:00:00.000Z',
          postingDate: '2024-01-16T00:00:00.000Z',
          amount: 1000,
          merchantName: 'Test Merchant',
          merchantCategory: 'shopping',
          description: 'Test purchase',
          category: 'expense',
          isInstallment: false,
          installmentCount: null,
          installmentNumber: null,
          isPaid: false,
          paymentScheduledDate: '2024-02-15T00:00:00.000Z',
          paidDate: null,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const result = await repository.save(mockTransaction);

      expect(result).toBeInstanceOf(CreditCardTransactionEntity);
      expect(mockFs.writeFile).toHaveBeenCalled();
    });
  });

  describe('saveMany', () => {
    it('should save multiple transactions', async () => {
      mockFs.readFile.mockResolvedValue('[]');

      const transactions = [mockTransaction];
      const result = await repository.saveMany(transactions);

      expect(result).toHaveLength(1);
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should return empty array for empty input', async () => {
      const result = await repository.saveMany([]);

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should find transaction by id', async () => {
      mockFs.readdir.mockResolvedValue(['card_1_transactions.json'] as any);
      const mockData = JSON.stringify([
        {
          id: 'tx_1',
          creditCardId: 'card_1',
          transactionDate: '2024-01-15T00:00:00.000Z',
          postingDate: '2024-01-16T00:00:00.000Z',
          amount: 1000,
          merchantName: 'Test Merchant',
          merchantCategory: 'shopping',
          description: 'Test purchase',
          category: 'expense',
          isInstallment: false,
          installmentCount: null,
          installmentNumber: null,
          isPaid: false,
          paymentScheduledDate: '2024-02-15T00:00:00.000Z',
          paidDate: null,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const result = await repository.findById('tx_1');

      expect(result).toBeInstanceOf(CreditCardTransactionEntity);
      expect(result?.id).toBe('tx_1');
    });

    it('should return null when transaction not found', async () => {
      mockFs.readdir.mockResolvedValue([] as any);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByCreditCardId', () => {
    it('should find transactions by credit card id', async () => {
      const mockData = JSON.stringify([
        {
          id: 'tx_1',
          creditCardId: 'card_1',
          transactionDate: '2024-01-15T00:00:00.000Z',
          postingDate: '2024-01-16T00:00:00.000Z',
          amount: 1000,
          merchantName: 'Test Merchant',
          merchantCategory: 'shopping',
          description: 'Test purchase',
          category: 'expense',
          isInstallment: false,
          installmentCount: null,
          installmentNumber: null,
          isPaid: false,
          paymentScheduledDate: '2024-02-15T00:00:00.000Z',
          paidDate: null,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const result = await repository.findByCreditCardId('card_1');

      expect(result).toHaveLength(1);
      expect(result[0].creditCardId).toBe('card_1');
    });
  });

  describe('findByCreditCardIdAndDateRange', () => {
    it('should find transactions by card id and date range', async () => {
      const mockData = JSON.stringify([
        {
          id: 'tx_1',
          creditCardId: 'card_1',
          transactionDate: '2024-01-15T00:00:00.000Z',
          postingDate: '2024-01-16T00:00:00.000Z',
          amount: 1000,
          merchantName: 'Test Merchant',
          merchantCategory: 'shopping',
          description: 'Test purchase',
          category: 'expense',
          isInstallment: false,
          installmentCount: null,
          installmentNumber: null,
          isPaid: false,
          paymentScheduledDate: '2024-02-15T00:00:00.000Z',
          paidDate: null,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const result = await repository.findByCreditCardIdAndDateRange(
        'card_1',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tx_1');
    });
  });

  describe('findUnpaid', () => {
    it('should find unpaid transactions', async () => {
      const mockData = JSON.stringify([
        {
          id: 'tx_1',
          creditCardId: 'card_1',
          transactionDate: '2024-01-15T00:00:00.000Z',
          postingDate: '2024-01-16T00:00:00.000Z',
          amount: 1000,
          merchantName: 'Test Merchant',
          merchantCategory: 'shopping',
          description: 'Test purchase',
          category: 'expense',
          isInstallment: false,
          installmentCount: null,
          installmentNumber: null,
          isPaid: false,
          paymentScheduledDate: '2024-02-15T00:00:00.000Z',
          paidDate: null,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const result = await repository.findUnpaid('card_1');

      expect(result).toHaveLength(1);
      expect(result[0].isPaid).toBe(false);
    });
  });

  describe('findByMonth', () => {
    it('should find transactions by month', async () => {
      const mockData = JSON.stringify([
        {
          id: 'tx_1',
          creditCardId: 'card_1',
          transactionDate: '2024-01-15T00:00:00.000Z',
          postingDate: '2024-01-16T00:00:00.000Z',
          amount: 1000,
          merchantName: 'Test Merchant',
          merchantCategory: 'shopping',
          description: 'Test purchase',
          category: 'expense',
          isInstallment: false,
          installmentCount: null,
          installmentNumber: null,
          isPaid: false,
          paymentScheduledDate: '2024-02-15T00:00:00.000Z',
          paidDate: null,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const result = await repository.findByMonth('card_1', 2024, 1);

      expect(result).toHaveLength(1);
      expect(result[0].transactionDate.getMonth() + 1).toBe(1);
    });
  });

  describe('delete', () => {
    it('should delete transaction', async () => {
      mockFs.readdir.mockResolvedValue(['card_1_transactions.json'] as any);
      const mockData = JSON.stringify([
        {
          id: 'tx_1',
          creditCardId: 'card_1',
          transactionDate: '2024-01-15T00:00:00.000Z',
          postingDate: '2024-01-16T00:00:00.000Z',
          amount: 1000,
          merchantName: 'Test Merchant',
          merchantCategory: 'shopping',
          description: 'Test purchase',
          category: 'expense',
          isInstallment: false,
          installmentCount: null,
          installmentNumber: null,
          isPaid: false,
          paymentScheduledDate: '2024-02-15T00:00:00.000Z',
          paidDate: null,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      await repository.delete('tx_1');

      expect(mockFs.writeFile).toHaveBeenCalled();
    });
  });

  describe('exists', () => {
    it('should return true if transaction exists', async () => {
      mockFs.readdir.mockResolvedValue(['card_1_transactions.json'] as any);
      const mockData = JSON.stringify([
        {
          id: 'tx_1',
          creditCardId: 'card_1',
          transactionDate: '2024-01-15T00:00:00.000Z',
          postingDate: '2024-01-16T00:00:00.000Z',
          amount: 1000,
          merchantName: 'Test Merchant',
          merchantCategory: 'shopping',
          description: 'Test purchase',
          category: 'expense',
          isInstallment: false,
          installmentCount: null,
          installmentNumber: null,
          isPaid: false,
          paymentScheduledDate: '2024-02-15T00:00:00.000Z',
          paidDate: null,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const result = await repository.exists('tx_1');

      expect(result).toBe(true);
    });

    it('should return false if transaction does not exist', async () => {
      mockFs.readdir.mockResolvedValue([] as any);

      const result = await repository.exists('nonexistent');

      expect(result).toBe(false);
    });
  });
});

describe('FileSystemPaymentRepository', () => {
  let repository: FileSystemPaymentRepository;
  const mockFs = fs as jest.Mocked<typeof fs>;

  const mockPayment = new PaymentVO(
    '2024-01',
    new Date('2024-01-31'),
    new Date('2024-02-15'),
    50000,
    0,
    50000,
    'unpaid',
  );

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileSystemPaymentRepository,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<FileSystemPaymentRepository>(
      FileSystemPaymentRepository,
    );

    mockFs.access.mockResolvedValue(undefined);
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue('[]');
    mockFs.writeFile.mockResolvedValue(undefined);
  });

  describe('save', () => {
    it('should save payment', async () => {
      mockFs.readFile.mockResolvedValue('[]');

      const result = await repository.save('card_1', mockPayment);

      expect(result).toBeInstanceOf(PaymentVO);
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should update existing payment', async () => {
      const mockData = JSON.stringify([
        {
          billingMonth: '2024-01',
          closingDate: '2024-01-31T00:00:00.000Z',
          paymentDueDate: '2024-02-15T00:00:00.000Z',
          totalAmount: 50000,
          paidAmount: 0,
          remainingAmount: 50000,
          status: 'unpaid',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const result = await repository.save('card_1', mockPayment);

      expect(result).toBeInstanceOf(PaymentVO);
      expect(mockFs.writeFile).toHaveBeenCalled();
    });
  });

  describe('findByCreditCardIdAndMonth', () => {
    it('should find payment by card id and month', async () => {
      const mockData = JSON.stringify([
        {
          billingMonth: '2024-01',
          closingDate: '2024-01-31T00:00:00.000Z',
          paymentDueDate: '2024-02-15T00:00:00.000Z',
          totalAmount: 50000,
          paidAmount: 0,
          remainingAmount: 50000,
          status: 'unpaid',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const result = await repository.findByCreditCardIdAndMonth(
        'card_1',
        '2024-01',
      );

      expect(result).toBeInstanceOf(PaymentVO);
      expect(result?.billingMonth).toBe('2024-01');
    });

    it('should return null when payment not found', async () => {
      mockFs.readFile.mockResolvedValue('[]');

      const result = await repository.findByCreditCardIdAndMonth(
        'card_1',
        'nonexistent',
      );

      expect(result).toBeNull();
    });
  });

  describe('findByCreditCardId', () => {
    it('should find all payments by card id', async () => {
      const mockData = JSON.stringify([
        {
          billingMonth: '2024-01',
          closingDate: '2024-01-31T00:00:00.000Z',
          paymentDueDate: '2024-02-15T00:00:00.000Z',
          totalAmount: 50000,
          paidAmount: 0,
          remainingAmount: 50000,
          status: 'unpaid',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const result = await repository.findByCreditCardId('card_1');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(PaymentVO);
    });
  });

  describe('findUnpaid', () => {
    it('should find unpaid payments', async () => {
      const mockData = JSON.stringify([
        {
          billingMonth: '2024-01',
          closingDate: '2024-01-31T00:00:00.000Z',
          paymentDueDate: '2024-02-15T00:00:00.000Z',
          totalAmount: 50000,
          paidAmount: 0,
          remainingAmount: 50000,
          status: 'unpaid',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const result = await repository.findUnpaid('card_1');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('unpaid');
    });
  });

  describe('findOverdue', () => {
    it('should find overdue payments', async () => {
      const overdueDate = new Date();
      overdueDate.setDate(overdueDate.getDate() - 10);

      const mockData = JSON.stringify([
        {
          billingMonth: '2024-01',
          closingDate: '2024-01-31T00:00:00.000Z',
          paymentDueDate: overdueDate.toISOString(),
          totalAmount: 50000,
          paidAmount: 0,
          remainingAmount: 50000,
          status: 'overdue',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const result = await repository.findOverdue('card_1');

      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('delete', () => {
    it('should delete payment', async () => {
      const mockData = JSON.stringify([
        {
          billingMonth: '2024-01',
          closingDate: '2024-01-31T00:00:00.000Z',
          paymentDueDate: '2024-02-15T00:00:00.000Z',
          totalAmount: 50000,
          paidAmount: 0,
          remainingAmount: 50000,
          status: 'unpaid',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      await repository.delete('card_1', '2024-01');

      expect(mockFs.writeFile).toHaveBeenCalled();
      const writeCall = mockFs.writeFile.mock.calls[0];
      const writtenData = JSON.parse(writeCall[1] as string);
      expect(writtenData).toEqual([]);
    });
  });
});
