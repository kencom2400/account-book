import { Test, TestingModule } from '@nestjs/testing';
import {
  CategoryType,
  InstitutionType,
  TransactionStatus,
} from '@account-book/types';
import { CalculateInstitutionSummaryUseCase } from './calculate-institution-summary.use-case';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { INSTITUTION_REPOSITORY } from '../../../institution/institution.tokens';
import type { IInstitutionRepository } from '../../../institution/domain/repositories/institution.repository.interface';
import { InstitutionAggregationDomainService } from '../../domain/services/institution-aggregation-domain.service';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { InstitutionEntity } from '../../../institution/domain/entities/institution.entity';
import { AccountEntity } from '../../../institution/domain/entities/account.entity';
import { EncryptedCredentials } from '../../../institution/domain/value-objects/encrypted-credentials.vo';

describe('CalculateInstitutionSummaryUseCase', () => {
  let useCase: CalculateInstitutionSummaryUseCase;
  let transactionRepository: jest.Mocked<ITransactionRepository>;
  let institutionRepository: jest.Mocked<IInstitutionRepository>;

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
    const mockTransactionRepo = {
      findByDateRange: jest.fn(),
      findByInstitutionIdsAndDateRange: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };

    const mockInstitutionRepo = {
      findAll: jest.fn(),
      findByIds: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalculateInstitutionSummaryUseCase,
        InstitutionAggregationDomainService,
        {
          provide: TRANSACTION_REPOSITORY,
          useValue: mockTransactionRepo,
        },
        {
          provide: INSTITUTION_REPOSITORY,
          useValue: mockInstitutionRepo,
        },
      ],
    }).compile();

    useCase = module.get<CalculateInstitutionSummaryUseCase>(
      CalculateInstitutionSummaryUseCase,
    );
    transactionRepository = module.get(TRANSACTION_REPOSITORY);
    institutionRepository = module.get(INSTITUTION_REPOSITORY);
  });

  describe('execute', () => {
    it('should calculate institution summary for all institutions', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const accounts1 = [
        createAccount('acc_1', 'inst_1', 'Account 1', 1000000),
      ];
      const accounts2 = [createAccount('acc_2', 'inst_2', 'Account 2', 500000)];
      const institutions = [
        createInstitution('inst_1', 'Bank A', InstitutionType.BANK, accounts1),
        createInstitution('inst_2', 'Bank B', InstitutionType.BANK, accounts2),
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
          'inst_2',
          'acc_2',
        ),
      ];

      institutionRepository.findAll.mockResolvedValue(institutions);
      transactionRepository.findByDateRange.mockResolvedValue(transactions);

      const result = await useCase.execute(startDate, endDate);

      expect(result.institutions).toHaveLength(2);
      expect(result.institutions[0].institutionId).toBe('inst_1');
      expect(result.institutions[0].totalIncome).toBe(100000);
      expect(result.institutions[0].totalExpense).toBe(50000);
      expect(result.institutions[0].periodBalance).toBe(50000);
      expect(result.institutions[0].currentBalance).toBe(1000000);
      expect(result.institutions[0].transactionCount).toBe(2);
      expect(result.institutions[0].transactions).toHaveLength(0); // includeTransactions=false

      expect(result.institutions[1].institutionId).toBe('inst_2');
      expect(result.institutions[1].totalIncome).toBe(0);
      expect(result.institutions[1].totalExpense).toBe(30000);
      expect(result.institutions[1].periodBalance).toBe(-30000);
      expect(result.institutions[1].currentBalance).toBe(500000);
      expect(result.institutions[1].transactionCount).toBe(1);
    });

    it('should calculate institution summary for specific institution IDs', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const institutionIds = ['inst_1'];

      const accounts1 = [
        createAccount('acc_1', 'inst_1', 'Account 1', 1000000),
      ];
      const institutions = [
        createInstitution('inst_1', 'Bank A', InstitutionType.BANK, accounts1),
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
      ];

      institutionRepository.findByIds.mockResolvedValue(institutions);
      transactionRepository.findByInstitutionIdsAndDateRange.mockResolvedValue(
        transactions,
      );

      const result = await useCase.execute(startDate, endDate, institutionIds);

      expect(result.institutions).toHaveLength(1);
      expect(result.institutions[0].institutionId).toBe('inst_1');
      expect(result.institutions[0].totalIncome).toBe(100000);
      expect(result.institutions[0].totalExpense).toBe(50000);
      expect(institutionRepository.findByIds).toHaveBeenCalledWith(
        institutionIds,
      );
      expect(
        transactionRepository.findByInstitutionIdsAndDateRange,
      ).toHaveBeenCalledWith(institutionIds, startDate, endDate);
    });

    it('should include transactions when includeTransactions is true', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const accounts1 = [
        createAccount('acc_1', 'inst_1', 'Account 1', 1000000),
      ];
      const institutions = [
        createInstitution('inst_1', 'Bank A', InstitutionType.BANK, accounts1),
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
      ];

      institutionRepository.findAll.mockResolvedValue(institutions);
      transactionRepository.findByDateRange.mockResolvedValue(transactions);

      const result = await useCase.execute(startDate, endDate, undefined, true);

      expect(result.institutions[0].transactions).toHaveLength(2);
      expect(result.institutions[0].transactions[0].id).toBe('tx_1');
      expect(result.institutions[0].transactions[0].amount).toBe(100000);
      expect(result.institutions[0].transactions[0].categoryType).toBe(
        CategoryType.INCOME,
      );
    });

    it('should return zero-filled data for institutions with no transactions', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const accounts1 = [
        createAccount('acc_1', 'inst_1', 'Account 1', 1000000),
      ];
      const institutions = [
        createInstitution('inst_1', 'Bank A', InstitutionType.BANK, accounts1),
      ];

      institutionRepository.findAll.mockResolvedValue(institutions);
      transactionRepository.findByDateRange.mockResolvedValue([]);

      const result = await useCase.execute(startDate, endDate);

      expect(result.institutions).toHaveLength(1);
      expect(result.institutions[0].totalIncome).toBe(0);
      expect(result.institutions[0].totalExpense).toBe(0);
      expect(result.institutions[0].periodBalance).toBe(0);
      expect(result.institutions[0].currentBalance).toBe(1000000);
      expect(result.institutions[0].transactionCount).toBe(0);
      expect(result.institutions[0].accounts[0].income).toBe(0);
      expect(result.institutions[0].accounts[0].expense).toBe(0);
      expect(result.institutions[0].accounts[0].periodBalance).toBe(0);
    });

    it('should aggregate by account correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const accounts1 = [
        createAccount('acc_1', 'inst_1', 'Account 1', 1000000),
        createAccount('acc_2', 'inst_1', 'Account 2', 500000),
      ];
      const institutions = [
        createInstitution('inst_1', 'Bank A', InstitutionType.BANK, accounts1),
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
          'acc_2',
        ),
      ];

      institutionRepository.findAll.mockResolvedValue(institutions);
      transactionRepository.findByDateRange.mockResolvedValue(transactions);

      const result = await useCase.execute(startDate, endDate);

      expect(result.institutions[0].accounts).toHaveLength(2);
      expect(result.institutions[0].accounts[0].accountId).toBe('acc_1');
      expect(result.institutions[0].accounts[0].income).toBe(100000);
      expect(result.institutions[0].accounts[0].expense).toBe(0);
      expect(result.institutions[0].accounts[1].accountId).toBe('acc_2');
      expect(result.institutions[0].accounts[1].income).toBe(0);
      expect(result.institutions[0].accounts[1].expense).toBe(50000);
    });

    it('should sort institutions by periodBalance (descending)', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const accounts1 = [
        createAccount('acc_1', 'inst_1', 'Account 1', 1000000),
      ];
      const accounts2 = [createAccount('acc_2', 'inst_2', 'Account 2', 500000)];
      const institutions = [
        createInstitution('inst_1', 'Bank A', InstitutionType.BANK, accounts1),
        createInstitution('inst_2', 'Bank B', InstitutionType.BANK, accounts2),
      ];

      const transactions = [
        createTransaction(
          'tx_1',
          10000,
          CategoryType.INCOME,
          'cat_1',
          'inst_1',
          'acc_1',
        ), // periodBalance: 10000
        createTransaction(
          'tx_2',
          50000,
          CategoryType.INCOME,
          'cat_2',
          'inst_2',
          'acc_2',
        ), // periodBalance: 50000
      ];

      institutionRepository.findAll.mockResolvedValue(institutions);
      transactionRepository.findByDateRange.mockResolvedValue(transactions);

      const result = await useCase.execute(startDate, endDate);

      expect(result.institutions).toHaveLength(2);
      // 絶対値でソートされるため、50000 > 10000 の順
      expect(result.institutions[0].institutionId).toBe('inst_2');
      expect(result.institutions[1].institutionId).toBe('inst_1');
    });

    it('should handle multiple accounts in one institution', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const accounts1 = [
        createAccount('acc_1', 'inst_1', 'Account 1', 1000000),
        createAccount('acc_2', 'inst_1', 'Account 2', 500000),
      ];
      const institutions = [
        createInstitution('inst_1', 'Bank A', InstitutionType.BANK, accounts1),
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
          CategoryType.INCOME,
          'cat_3',
          'inst_1',
          'acc_2',
        ),
      ];

      institutionRepository.findAll.mockResolvedValue(institutions);
      transactionRepository.findByDateRange.mockResolvedValue(transactions);

      const result = await useCase.execute(startDate, endDate);

      expect(result.institutions[0].totalIncome).toBe(130000);
      expect(result.institutions[0].totalExpense).toBe(50000);
      expect(result.institutions[0].periodBalance).toBe(80000);
      expect(result.institutions[0].currentBalance).toBe(1500000); // 1000000 + 500000
      expect(result.institutions[0].accounts).toHaveLength(2);
    });

    it('should handle empty institution list', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      institutionRepository.findAll.mockResolvedValue([]);
      transactionRepository.findByDateRange.mockResolvedValue([]);

      const result = await useCase.execute(startDate, endDate);

      expect(result.institutions).toHaveLength(0);
    });
  });
});
