import { Test, TestingModule } from '@nestjs/testing';
import { InstitutionAggregationDomainService } from './institution-aggregation-domain.service';
import { TransactionEntity } from '../entities/transaction.entity';
import { InstitutionEntity } from '../../../institution/domain/entities/institution.entity';
import { AccountEntity } from '../../../institution/domain/entities/account.entity';
import {
  CategoryType,
  InstitutionType,
  TransactionStatus,
} from '@account-book/types';
import { EncryptedCredentials } from '../../../institution/domain/value-objects/encrypted-credentials.vo';

describe('InstitutionAggregationDomainService', () => {
  let service: InstitutionAggregationDomainService;

  const createTransaction = (
    id: string,
    amount: number,
    categoryType: CategoryType,
    categoryId: string,
    institutionId = 'inst_1',
    accountId = 'acc_1',
    date?: Date,
  ): TransactionEntity => {
    return new TransactionEntity(
      id,
      date || new Date('2024-01-15'),
      amount,
      { id: categoryId, name: `Category ${categoryId}`, type: categoryType },
      'Test description',
      institutionId,
      accountId,
      TransactionStatus.COMPLETED,
      false,
      null,
      new Date(),
      new Date(),
    );
  };

  const createInstitution = (
    id: string,
    name: string,
    type: InstitutionType,
    accounts: AccountEntity[] = [],
  ): InstitutionEntity => {
    const credentials = new EncryptedCredentials(
      'encrypted',
      'iv',
      'authTag',
      'algorithm',
      'version',
    );
    return new InstitutionEntity(
      id,
      name,
      type,
      credentials,
      true,
      new Date(),
      accounts,
      new Date(),
      new Date(),
    );
  };

  const createAccount = (
    id: string,
    institutionId: string,
    accountName: string,
    balance = 0,
  ): AccountEntity => {
    return new AccountEntity(
      id,
      institutionId,
      `account-${id}`,
      accountName,
      balance,
      'JPY',
    );
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InstitutionAggregationDomainService],
    }).compile();

    service = module.get<InstitutionAggregationDomainService>(
      InstitutionAggregationDomainService,
    );
  });

  describe('aggregateByInstitution', () => {
    it('should aggregate transactions by institution', () => {
      const institutions = [
        createInstitution('inst_1', 'Bank A', InstitutionType.BANK),
        createInstitution('inst_2', 'Bank B', InstitutionType.BANK),
      ];

      const transactions = [
        createTransaction(
          'tx_1',
          100000,
          CategoryType.INCOME,
          'cat_1',
          'inst_1',
        ),
        createTransaction(
          'tx_2',
          50000,
          CategoryType.EXPENSE,
          'cat_2',
          'inst_1',
        ),
        createTransaction(
          'tx_3',
          30000,
          CategoryType.EXPENSE,
          'cat_3',
          'inst_2',
        ),
      ];

      const result = service.aggregateByInstitution(transactions, institutions);

      expect(result.size).toBe(2);
      expect(result.get('inst_1')).toEqual({
        totalIncome: 100000,
        totalExpense: 50000,
        periodBalance: 50000,
        transactionCount: 2,
        transactions: [transactions[0], transactions[1]],
      });
      expect(result.get('inst_2')).toEqual({
        totalIncome: 0,
        totalExpense: 30000,
        periodBalance: -30000,
        transactionCount: 1,
        transactions: [transactions[2]],
      });
    });

    it('should ignore transactions from institutions not in the list', () => {
      const institutions = [
        createInstitution('inst_1', 'Bank A', InstitutionType.BANK),
      ];

      const transactions = [
        createTransaction(
          'tx_1',
          100000,
          CategoryType.INCOME,
          'cat_1',
          'inst_1',
        ),
        createTransaction(
          'tx_2',
          50000,
          CategoryType.EXPENSE,
          'cat_2',
          'inst_999',
        ), // 存在しない金融機関
      ];

      const result = service.aggregateByInstitution(transactions, institutions);

      expect(result.size).toBe(1);
      expect(result.get('inst_1')).toEqual({
        totalIncome: 100000,
        totalExpense: 0,
        periodBalance: 100000,
        transactionCount: 1,
        transactions: [transactions[0]],
      });
    });

    it('should return empty aggregation for institutions with no transactions', () => {
      const institutions = [
        createInstitution('inst_1', 'Bank A', InstitutionType.BANK),
        createInstitution('inst_2', 'Bank B', InstitutionType.BANK),
      ];

      const transactions: TransactionEntity[] = [];

      const result = service.aggregateByInstitution(transactions, institutions);

      expect(result.size).toBe(2);
      expect(result.get('inst_1')).toEqual({
        totalIncome: 0,
        totalExpense: 0,
        periodBalance: 0,
        transactionCount: 0,
        transactions: [],
      });
      expect(result.get('inst_2')).toEqual({
        totalIncome: 0,
        totalExpense: 0,
        periodBalance: 0,
        transactionCount: 0,
        transactions: [],
      });
    });

    it('should handle multiple income and expense transactions', () => {
      const institutions = [
        createInstitution('inst_1', 'Bank A', InstitutionType.BANK),
      ];

      const transactions = [
        createTransaction(
          'tx_1',
          100000,
          CategoryType.INCOME,
          'cat_1',
          'inst_1',
        ),
        createTransaction(
          'tx_2',
          50000,
          CategoryType.INCOME,
          'cat_2',
          'inst_1',
        ),
        createTransaction(
          'tx_3',
          30000,
          CategoryType.EXPENSE,
          'cat_3',
          'inst_1',
        ),
        createTransaction(
          'tx_4',
          20000,
          CategoryType.EXPENSE,
          'cat_4',
          'inst_1',
        ),
      ];

      const result = service.aggregateByInstitution(transactions, institutions);

      expect(result.get('inst_1')).toEqual({
        totalIncome: 150000,
        totalExpense: 50000,
        periodBalance: 100000,
        transactionCount: 4,
        transactions,
      });
    });

    it('should ignore TRANSFER, REPAYMENT, INVESTMENT transactions', () => {
      const institutions = [
        createInstitution('inst_1', 'Bank A', InstitutionType.BANK),
      ];

      const transactions = [
        createTransaction(
          'tx_1',
          100000,
          CategoryType.INCOME,
          'cat_1',
          'inst_1',
        ),
        createTransaction(
          'tx_2',
          50000,
          CategoryType.TRANSFER,
          'cat_2',
          'inst_1',
        ),
        createTransaction(
          'tx_3',
          30000,
          CategoryType.REPAYMENT,
          'cat_3',
          'inst_1',
        ),
        createTransaction(
          'tx_4',
          20000,
          CategoryType.INVESTMENT,
          'cat_4',
          'inst_1',
        ),
      ];

      const result = service.aggregateByInstitution(transactions, institutions);

      expect(result.get('inst_1')).toEqual({
        totalIncome: 100000,
        totalExpense: 0,
        periodBalance: 100000,
        transactionCount: 4,
        transactions,
      });
    });
  });

  describe('aggregateByAccount', () => {
    it('should aggregate transactions by account', () => {
      const accounts = [
        createAccount('acc_1', 'inst_1', 'Account 1'),
        createAccount('acc_2', 'inst_1', 'Account 2'),
      ];

      const transactions = [
        createTransaction(
          'tx_1',
          100000,
          CategoryType.INCOME,
          'cat_1',
          'inst_1',
          'acc_1',
        ),
        createTransaction(
          'tx_2',
          50000,
          CategoryType.EXPENSE,
          'cat_2',
          'inst_1',
          'acc_1',
        ),
        createTransaction(
          'tx_3',
          30000,
          CategoryType.EXPENSE,
          'cat_3',
          'inst_1',
          'acc_2',
        ),
      ];

      const result = service.aggregateByAccount(transactions, accounts);

      expect(result.size).toBe(2);
      expect(result.get('acc_1')).toEqual({
        income: 100000,
        expense: 50000,
        periodBalance: 50000,
        transactionCount: 2,
        transactions: [transactions[0], transactions[1]],
      });
      expect(result.get('acc_2')).toEqual({
        income: 0,
        expense: 30000,
        periodBalance: -30000,
        transactionCount: 1,
        transactions: [transactions[2]],
      });
    });

    it('should ignore transactions from accounts not in the list', () => {
      const accounts = [createAccount('acc_1', 'inst_1', 'Account 1')];

      const transactions = [
        createTransaction(
          'tx_1',
          100000,
          CategoryType.INCOME,
          'cat_1',
          'inst_1',
          'acc_1',
        ),
        createTransaction(
          'tx_2',
          50000,
          CategoryType.EXPENSE,
          'cat_2',
          'inst_1',
          'acc_999',
        ), // 存在しない口座
      ];

      const result = service.aggregateByAccount(transactions, accounts);

      expect(result.size).toBe(1);
      expect(result.get('acc_1')).toEqual({
        income: 100000,
        expense: 0,
        periodBalance: 100000,
        transactionCount: 1,
        transactions: [transactions[0]],
      });
    });

    it('should return empty aggregation for accounts with no transactions', () => {
      const accounts = [
        createAccount('acc_1', 'inst_1', 'Account 1'),
        createAccount('acc_2', 'inst_1', 'Account 2'),
      ];

      const transactions: TransactionEntity[] = [];

      const result = service.aggregateByAccount(transactions, accounts);

      expect(result.size).toBe(2);
      expect(result.get('acc_1')).toEqual({
        income: 0,
        expense: 0,
        periodBalance: 0,
        transactionCount: 0,
        transactions: [],
      });
      expect(result.get('acc_2')).toEqual({
        income: 0,
        expense: 0,
        periodBalance: 0,
        transactionCount: 0,
        transactions: [],
      });
    });
  });

  describe('calculateInstitutionBalance', () => {
    it('should calculate balance correctly', () => {
      const balance = service.calculateInstitutionBalance(100000, 50000);
      expect(balance).toBe(50000);
    });

    it('should handle negative balance', () => {
      const balance = service.calculateInstitutionBalance(50000, 100000);
      expect(balance).toBe(-50000);
    });

    it('should handle zero income and expense', () => {
      const balance = service.calculateInstitutionBalance(0, 0);
      expect(balance).toBe(0);
    });
  });

  describe('filterByInstitutionIds', () => {
    it('should return all transactions when institutionIds is not provided', () => {
      const transactions = [
        createTransaction(
          'tx_1',
          100000,
          CategoryType.INCOME,
          'cat_1',
          'inst_1',
        ),
        createTransaction(
          'tx_2',
          50000,
          CategoryType.EXPENSE,
          'cat_2',
          'inst_2',
        ),
      ];

      const result = service.filterByInstitutionIds(transactions);

      expect(result).toEqual(transactions);
    });

    it('should return all transactions when institutionIds is empty array', () => {
      const transactions = [
        createTransaction(
          'tx_1',
          100000,
          CategoryType.INCOME,
          'cat_1',
          'inst_1',
        ),
        createTransaction(
          'tx_2',
          50000,
          CategoryType.EXPENSE,
          'cat_2',
          'inst_2',
        ),
      ];

      const result = service.filterByInstitutionIds(transactions, []);

      expect(result).toEqual(transactions);
    });

    it('should filter transactions by institutionIds', () => {
      const transactions = [
        createTransaction(
          'tx_1',
          100000,
          CategoryType.INCOME,
          'cat_1',
          'inst_1',
        ),
        createTransaction(
          'tx_2',
          50000,
          CategoryType.EXPENSE,
          'cat_2',
          'inst_2',
        ),
        createTransaction(
          'tx_3',
          30000,
          CategoryType.EXPENSE,
          'cat_3',
          'inst_3',
        ),
      ];

      const result = service.filterByInstitutionIds(transactions, [
        'inst_1',
        'inst_2',
      ]);

      expect(result).toHaveLength(2);
      expect(result).toContain(transactions[0]);
      expect(result).toContain(transactions[1]);
      expect(result).not.toContain(transactions[2]);
    });

    it('should return empty array when no transactions match', () => {
      const transactions = [
        createTransaction(
          'tx_1',
          100000,
          CategoryType.INCOME,
          'cat_1',
          'inst_1',
        ),
        createTransaction(
          'tx_2',
          50000,
          CategoryType.EXPENSE,
          'cat_2',
          'inst_2',
        ),
      ];

      const result = service.filterByInstitutionIds(transactions, ['inst_999']);

      expect(result).toHaveLength(0);
    });
  });
});
