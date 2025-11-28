import { Test, TestingModule } from '@nestjs/testing';
import { promises as fs } from 'fs';
import {
  FileSystemSecuritiesAccountRepository,
  FileSystemHoldingRepository,
  FileSystemSecurityTransactionRepository,
} from './securities.repository';
import { SecuritiesAccountEntity } from '../../domain/entities/securities-account.entity';
import { HoldingEntity } from '../../domain/entities/holding.entity';
import { SecurityTransactionEntity } from '../../domain/entities/security-transaction.entity';
import { EncryptedCredentials } from '../../../institution/domain/value-objects/encrypted-credentials.vo';

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}));

describe('FileSystemSecuritiesAccountRepository', () => {
  let repository: FileSystemSecuritiesAccountRepository;

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
    true,
    new Date('2024-01-15'),
    100000,
    50000,
    new Date('2024-01-01'),
    new Date('2024-01-15'),
  );

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [FileSystemSecuritiesAccountRepository],
    }).compile();

    module.useLogger(false);

    repository = module.get<FileSystemSecuritiesAccountRepository>(
      FileSystemSecuritiesAccountRepository,
    );
  });

  describe('create', () => {
    it('should create account', async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('Not found'));
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      await repository.create(mockAccount);

      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find account by id', async () => {
      const mockData = {
        id: 'sec_1',
        securitiesCompanyName: 'Test Securities',
        accountNumber: '1234567890',
        accountType: 'general',
        credentials: {
          encrypted: 'encrypted',
          iv: 'iv',
          authTag: 'authTag',
          algorithm: 'aes-256-gcm',
          version: 'v1',
        },
        isConnected: true,
        lastSyncedAt: '2024-01-15T00:00:00.000Z',
        totalEvaluationAmount: 100000,
        cashBalance: 50000,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify([mockData]));

      const result = await repository.findById('sec_1');

      expect(result).toBeInstanceOf(SecuritiesAccountEntity);
      expect(result?.id).toBe('sec_1');
    });

    it('should return null if not found', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify([]));

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null if file does not exist', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('Not found'));

      const result = await repository.findById('sec_1');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all accounts', async () => {
      const mockData = {
        id: 'sec_1',
        securitiesCompanyName: 'Test Securities',
        accountNumber: '1234567890',
        accountType: 'general',
        credentials: {
          encrypted: 'encrypted',
          iv: 'iv',
          authTag: 'authTag',
          algorithm: 'aes-256-gcm',
          version: 'v1',
        },
        isConnected: true,
        lastSyncedAt: null,
        totalEvaluationAmount: 100000,
        cashBalance: 50000,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify([mockData]));

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(SecuritiesAccountEntity);
    });
  });

  describe('update', () => {
    it('should update account', async () => {
      const mockData = {
        id: 'sec_1',
        securitiesCompanyName: 'Test Securities',
        accountNumber: '1234567890',
        accountType: 'general',
        credentials: {
          encrypted: 'encrypted',
          iv: 'iv',
          authTag: 'authTag',
          algorithm: 'aes-256-gcm',
          version: 'v1',
        },
        isConnected: true,
        lastSyncedAt: '2024-01-15T00:00:00.000Z',
        totalEvaluationAmount: 100000,
        cashBalance: 50000,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify([mockData]));
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      await repository.update(mockAccount);

      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should throw error if account not found', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify([]));

      await expect(repository.update(mockAccount)).rejects.toThrow(
        'Account not found',
      );
    });
  });

  describe('delete', () => {
    it('should delete account', async () => {
      const mockData = {
        id: 'sec_1',
        securitiesCompanyName: 'Test Securities',
        accountNumber: '1234567890',
        accountType: 'general',
        credentials: {
          encrypted: 'encrypted',
          iv: 'iv',
          authTag: 'authTag',
          algorithm: 'aes-256-gcm',
          version: 'v1',
        },
        isConnected: true,
        lastSyncedAt: '2024-01-15T00:00:00.000Z',
        totalEvaluationAmount: 100000,
        cashBalance: 50000,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify([mockData]));
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      await repository.delete('sec_1');

      expect(fs.writeFile).toHaveBeenCalled();
    });
  });
});

describe('FileSystemHoldingRepository', () => {
  let repository: FileSystemHoldingRepository;

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
    new Date('2024-01-15'),
  );

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [FileSystemHoldingRepository],
    }).compile();

    module.useLogger(false);

    repository = module.get<FileSystemHoldingRepository>(
      FileSystemHoldingRepository,
    );
  });

  describe('create', () => {
    it('should create holding', async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('Not found'));
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      await repository.create(mockHolding);

      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find holding by id', async () => {
      const mockData = {
        id: 'hold_1',
        securitiesAccountId: 'sec_1',
        securityCode: '7203',
        securityName: 'Toyota',
        quantity: 100,
        averageAcquisitionPrice: 2500,
        currentPrice: 2800,
        securityType: 'stock',
        market: '東証',
        updatedAt: '2024-01-15T00:00:00.000Z',
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify([mockData]));

      const result = await repository.findById('hold_1');

      expect(result).toBeInstanceOf(HoldingEntity);
    });
  });

  describe('findByAccountId', () => {
    it('should find holdings by account id', async () => {
      const mockData = {
        id: 'hold_1',
        securitiesAccountId: 'sec_1',
        securityCode: '7203',
        securityName: 'Toyota',
        quantity: 100,
        averageAcquisitionPrice: 2500,
        currentPrice: 2800,
        securityType: 'stock',
        market: '東証',
        updatedAt: '2024-01-15T00:00:00.000Z',
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify([mockData]));

      const result = await repository.findByAccountId('sec_1');

      expect(result).toHaveLength(1);
    });
  });
});

describe('FileSystemSecurityTransactionRepository', () => {
  let repository: FileSystemSecurityTransactionRepository;

  const mockTransaction = new SecurityTransactionEntity(
    'tx_1',
    'sec_1',
    '7203',
    'Toyota',
    new Date('2024-01-15'),
    'buy',
    100,
    2500,
    500,
    'completed',
    new Date('2024-01-15'),
  );

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [FileSystemSecurityTransactionRepository],
    }).compile();

    module.useLogger(false);

    repository = module.get<FileSystemSecurityTransactionRepository>(
      FileSystemSecurityTransactionRepository,
    );
  });

  describe('create', () => {
    it('should create transaction', async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('Not found'));
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      await repository.create(mockTransaction);

      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe('findByAccountId', () => {
    it('should find transactions by account id', async () => {
      const mockData = {
        id: 'tx_1',
        securitiesAccountId: 'sec_1',
        securityCode: '7203',
        securityName: 'Toyota',
        transactionDate: '2024-01-15T00:00:00.000Z',
        transactionType: 'buy',
        quantity: 100,
        price: 2500,
        fee: 500,
        status: 'completed',
        createdAt: '2024-01-15T00:00:00.000Z',
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify([mockData]));

      const result = await repository.findByAccountId('sec_1');

      expect(result).toHaveLength(1);
    });
  });

  describe('findByAccountIdAndDateRange', () => {
    it('should find transactions by account id and date range', async () => {
      const mockData = {
        id: 'tx_1',
        securitiesAccountId: 'sec_1',
        securityCode: '7203',
        securityName: 'Toyota',
        transactionDate: '2024-01-15T00:00:00.000Z',
        transactionType: 'buy',
        quantity: 100,
        price: 2500,
        fee: 500,
        status: 'completed',
        createdAt: '2024-01-15T00:00:00.000Z',
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify([mockData]));

      const result = await repository.findByAccountIdAndDateRange(
        'sec_1',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );

      expect(result).toHaveLength(1);
    });

    it('should filter transactions by date range', async () => {
      const mockData = {
        id: 'tx_1',
        securitiesAccountId: 'sec_1',
        securityCode: '7203',
        securityName: 'Toyota',
        transactionDate: '2024-02-15T00:00:00.000Z',
        transactionType: 'buy',
        quantity: 100,
        price: 2500,
        fee: 500,
        status: 'completed',
        createdAt: '2024-02-15T00:00:00.000Z',
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify([mockData]));

      const result = await repository.findByAccountIdAndDateRange(
        'sec_1',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );

      expect(result).toHaveLength(0);
    });
  });
});
