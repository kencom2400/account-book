import { Test, TestingModule } from '@nestjs/testing';
import { AggregationController } from './aggregation.controller';
import { CalculateMonthlyBalanceUseCase } from '../../application/use-cases/calculate-monthly-balance.use-case';
import { CalculateYearlyBalanceUseCase } from '../../application/use-cases/calculate-yearly-balance.use-case';
import { CalculateCategoryAggregationUseCase } from '../../application/use-cases/calculate-category-aggregation.use-case';
import { CalculateSubcategoryAggregationUseCase } from '../../application/use-cases/calculate-subcategory-aggregation.use-case';
import { CalculateInstitutionSummaryUseCase } from '../../application/use-cases/calculate-institution-summary.use-case';
import { CalculateAssetBalanceUseCase } from '../../application/use-cases/calculate-asset-balance.use-case';
import type { MonthlyBalanceResponseDto } from '../../application/use-cases/calculate-monthly-balance.use-case';
import type { YearlyBalanceResponseDto } from '../../application/use-cases/calculate-yearly-balance.use-case';
import type { CategoryAggregationResponseDto } from '../../application/use-cases/calculate-category-aggregation.use-case';
import type { SubcategoryAggregationResponseDto } from '../dto/get-subcategory-aggregation.dto';
import type { AssetBalanceResponseDto } from '../../application/use-cases/calculate-asset-balance.use-case';
import { InstitutionType } from '@account-book/types';

describe('AggregationController', () => {
  let controller: AggregationController;
  let module: TestingModule;
  let calculateMonthlyBalanceUseCase: jest.Mocked<CalculateMonthlyBalanceUseCase>;
  let calculateYearlyBalanceUseCase: jest.Mocked<CalculateYearlyBalanceUseCase>;
  let calculateCategoryAggregationUseCase: jest.Mocked<CalculateCategoryAggregationUseCase>;
  let calculateSubcategoryAggregationUseCase: jest.Mocked<CalculateSubcategoryAggregationUseCase>;
  let calculateInstitutionSummaryUseCase: jest.Mocked<CalculateInstitutionSummaryUseCase>;
  let calculateAssetBalanceUseCase: jest.Mocked<CalculateAssetBalanceUseCase>;

  const mockMonthlyBalanceResponse: MonthlyBalanceResponseDto = {
    month: '2024-01',
    income: {
      total: 100000,
      count: 1,
      byCategory: [],
      byInstitution: [],
      transactions: [],
    },
    expense: {
      total: 80000,
      count: 2,
      byCategory: [],
      byInstitution: [],
      transactions: [],
    },
    balance: 20000,
    savingsRate: 20,
    comparison: {
      previousMonth: null,
      sameMonthLastYear: null,
    },
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [AggregationController],
      providers: [
        {
          provide: CalculateMonthlyBalanceUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: CalculateYearlyBalanceUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: CalculateCategoryAggregationUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: CalculateSubcategoryAggregationUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: CalculateInstitutionSummaryUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: CalculateAssetBalanceUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<AggregationController>(AggregationController);
    calculateMonthlyBalanceUseCase = module.get(CalculateMonthlyBalanceUseCase);
    calculateYearlyBalanceUseCase = module.get(CalculateYearlyBalanceUseCase);
    calculateCategoryAggregationUseCase = module.get(
      CalculateCategoryAggregationUseCase,
    );
    calculateSubcategoryAggregationUseCase = module.get(
      CalculateSubcategoryAggregationUseCase,
    );
    calculateInstitutionSummaryUseCase = module.get(
      CalculateInstitutionSummaryUseCase,
    );
    calculateAssetBalanceUseCase = module.get(CalculateAssetBalanceUseCase);
  });

  describe('getMonthlyBalance', () => {
    it('should return monthly balance data', async () => {
      calculateMonthlyBalanceUseCase.execute.mockResolvedValue(
        mockMonthlyBalanceResponse,
      );

      const result = await controller.getMonthlyBalance({
        year: 2024,
        month: 1,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMonthlyBalanceResponse);
      expect(calculateMonthlyBalanceUseCase.execute).toHaveBeenCalledWith(
        2024,
        1,
      );
    });

    it('should call use case with correct parameters', async () => {
      calculateMonthlyBalanceUseCase.execute.mockResolvedValue(
        mockMonthlyBalanceResponse,
      );

      await controller.getMonthlyBalance({
        year: 2025,
        month: 12,
      });

      expect(calculateMonthlyBalanceUseCase.execute).toHaveBeenCalledWith(
        2025,
        12,
      );
    });
  });

  describe('getCategoryAggregation', () => {
    it('should return category aggregation data', async () => {
      const mockResponse: CategoryAggregationResponseDto[] = [
        {
          categoryType: 'EXPENSE' as const,
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          totalAmount: 80000,
          transactionCount: 2,
          subcategories: [],
          percentage: 80,
          trend: {
            monthly: [{ month: '2025-01', amount: 80000, count: 2 }],
          },
        },
      ];

      calculateCategoryAggregationUseCase.execute.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.getCategoryAggregation({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        categoryType: 'EXPENSE',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(calculateCategoryAggregationUseCase.execute).toHaveBeenCalledWith(
        new Date('2025-01-01'),
        new Date('2025-01-31'),
        'EXPENSE',
      );
    });

    it('should call use case with correct parameters when categoryType is not provided', async () => {
      const mockResponse: CategoryAggregationResponseDto[] = [];
      calculateCategoryAggregationUseCase.execute.mockResolvedValue(
        mockResponse,
      );

      await controller.getCategoryAggregation({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      expect(calculateCategoryAggregationUseCase.execute).toHaveBeenCalledWith(
        new Date('2025-01-01'),
        new Date('2025-01-31'),
        undefined,
      );
    });
  });

  describe('getInstitutionSummary', () => {
    it('should return institution summary data', async () => {
      const mockResponse = {
        institutions: [
          {
            institutionId: 'inst_1',
            institutionName: 'Bank A',
            institutionType: InstitutionType.BANK,
            period: {
              start: '2024-01-01T00:00:00.000Z',
              end: '2024-01-31T23:59:59.999Z',
            },
            accounts: [],
            totalIncome: 100000,
            totalExpense: 50000,
            periodBalance: 50000,
            currentBalance: 1000000,
            transactionCount: 2,
            transactions: [],
          },
        ],
      };

      calculateInstitutionSummaryUseCase.execute.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.getInstitutionSummary({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(calculateInstitutionSummaryUseCase.execute).toHaveBeenCalledWith(
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        undefined,
        false,
      );
    });

    it('should call use case with correct parameters including institutionIds', async () => {
      const mockResponse = {
        institutions: [],
      };

      calculateInstitutionSummaryUseCase.execute.mockResolvedValue(
        mockResponse,
      );

      await controller.getInstitutionSummary({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        institutionIds: ['inst_1', 'inst_2'],
      });

      expect(calculateInstitutionSummaryUseCase.execute).toHaveBeenCalledWith(
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        ['inst_1', 'inst_2'],
        false,
      );
    });

    it('should call use case with includeTransactions parameter', async () => {
      const mockResponse = {
        institutions: [],
      };

      calculateInstitutionSummaryUseCase.execute.mockResolvedValue(
        mockResponse,
      );

      await controller.getInstitutionSummary({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        includeTransactions: true,
      });

      expect(calculateInstitutionSummaryUseCase.execute).toHaveBeenCalledWith(
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        undefined,
        true,
      );
    });

    it('should default includeTransactions to false when not provided', async () => {
      const mockResponse = {
        institutions: [],
      };

      calculateInstitutionSummaryUseCase.execute.mockResolvedValue(
        mockResponse,
      );

      await controller.getInstitutionSummary({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(calculateInstitutionSummaryUseCase.execute).toHaveBeenCalledWith(
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        undefined,
        false,
      );
    });
  });

  describe('getSubcategoryAggregation', () => {
    it('should return subcategory aggregation data', async () => {
      const mockResponse: SubcategoryAggregationResponseDto = {
        items: [
          {
            itemName: 'Food',
            itemCode: 'cat-food',
            itemId: 'cat-food',
            parent: null,
            totalAmount: 50000,
            transactionCount: 2,
            averageAmount: 25000,
            budget: null,
            budgetUsage: null,
            children: [],
            monthlyTrend: [{ month: '2025-01', amount: 50000, count: 2 }],
            topTransactions: [],
          },
        ],
        period: {
          start: '2025-01-01T00:00:00.000Z',
          end: '2025-01-31T23:59:59.999Z',
        },
        totalAmount: 50000,
        totalTransactionCount: 2,
      };

      calculateSubcategoryAggregationUseCase.execute.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.getSubcategoryAggregation({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(
        calculateSubcategoryAggregationUseCase.execute,
      ).toHaveBeenCalledWith(
        new Date('2025-01-01'),
        new Date('2025-01-31'),
        undefined,
        undefined,
      );
    });

    it('should call use case with categoryType parameter', async () => {
      const mockResponse: SubcategoryAggregationResponseDto = {
        items: [],
        period: {
          start: '2025-01-01T00:00:00.000Z',
          end: '2025-01-31T23:59:59.999Z',
        },
        totalAmount: 0,
        totalTransactionCount: 0,
      };

      calculateSubcategoryAggregationUseCase.execute.mockResolvedValue(
        mockResponse,
      );

      await controller.getSubcategoryAggregation({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        categoryType: 'EXPENSE',
      });

      expect(
        calculateSubcategoryAggregationUseCase.execute,
      ).toHaveBeenCalledWith(
        new Date('2025-01-01'),
        new Date('2025-01-31'),
        'EXPENSE',
        undefined,
      );
    });

    it('should call use case with itemId parameter', async () => {
      const mockResponse: SubcategoryAggregationResponseDto = {
        items: [],
        period: {
          start: '2025-01-01T00:00:00.000Z',
          end: '2025-01-31T23:59:59.999Z',
        },
        totalAmount: 0,
        totalTransactionCount: 0,
      };

      calculateSubcategoryAggregationUseCase.execute.mockResolvedValue(
        mockResponse,
      );

      await controller.getSubcategoryAggregation({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        itemId: 'cat-food',
      });

      expect(
        calculateSubcategoryAggregationUseCase.execute,
      ).toHaveBeenCalledWith(
        new Date('2025-01-01'),
        new Date('2025-01-31'),
        undefined,
        'cat-food',
      );
    });
  });

  describe('getYearlyBalance', () => {
    const mockYearlyBalanceResponse: YearlyBalanceResponseDto = {
      year: 2024,
      months: [
        {
          month: '2024-01',
          income: {
            total: 300000,
            count: 1,
            byCategory: [],
            byInstitution: [],
            transactions: [],
          },
          expense: {
            total: 200000,
            count: 1,
            byCategory: [],
            byInstitution: [],
            transactions: [],
          },
          balance: 100000,
          savingsRate: 33.33,
        },
        {
          month: '2024-02',
          income: {
            total: 300000,
            count: 1,
            byCategory: [],
            byInstitution: [],
            transactions: [],
          },
          expense: {
            total: 180000,
            count: 1,
            byCategory: [],
            byInstitution: [],
            transactions: [],
          },
          balance: 120000,
          savingsRate: 40.0,
        },
      ],
      annual: {
        totalIncome: 600000,
        totalExpense: 380000,
        totalBalance: 220000,
        averageIncome: 50000,
        averageExpense: 31666.67,
        savingsRate: 36.67,
      },
      trend: {
        incomeProgression: {
          direction: 'stable',
          changeRate: 0,
          standardDeviation: 0,
        },
        expenseProgression: {
          direction: 'decreasing',
          changeRate: -1.5,
          standardDeviation: 15000,
        },
        balanceProgression: {
          direction: 'increasing',
          changeRate: 2.0,
          standardDeviation: 10000,
        },
      },
      highlights: {
        maxIncomeMonth: '2024-01',
        maxExpenseMonth: '2024-01',
        bestBalanceMonth: '2024-02',
        worstBalanceMonth: '2024-01',
      },
    };

    it('should return yearly balance data', async () => {
      calculateYearlyBalanceUseCase.execute.mockResolvedValue(
        mockYearlyBalanceResponse,
      );

      const result = await controller.getYearlyBalance({
        year: 2024,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockYearlyBalanceResponse);
      expect(calculateYearlyBalanceUseCase.execute).toHaveBeenCalledWith(2024);
    });

    it('should call use case with correct parameters', async () => {
      calculateYearlyBalanceUseCase.execute.mockResolvedValue(
        mockYearlyBalanceResponse,
      );

      await controller.getYearlyBalance({
        year: 2024,
      });

      expect(calculateYearlyBalanceUseCase.execute).toHaveBeenCalledWith(2024);
    });
  });

  describe('getAssetBalance', () => {
    const mockAssetBalanceResponse: AssetBalanceResponseDto = {
      totalAssets: 5234567,
      totalLiabilities: 123456,
      netWorth: 5111111,
      institutions: [
        {
          institutionId: 'inst-001',
          institutionName: '三菱UFJ銀行',
          institutionType: InstitutionType.BANK,
          icon: '🏦',
          accounts: [
            {
              accountId: 'acc-001',
              accountName: '普通預金',
              accountType: 'SAVINGS',
              balance: 1234567,
              currency: 'JPY',
            },
          ],
          total: 1234567,
          percentage: 23.6,
        },
      ],
      asOfDate: '2025-01-27T00:00:00.000Z',
      previousMonth: {
        diff: 0,
        rate: 0,
      },
      previousYear: {
        diff: 0,
        rate: 0,
      },
    };

    it('should return asset balance data', async () => {
      calculateAssetBalanceUseCase.execute.mockResolvedValue(
        mockAssetBalanceResponse,
      );

      const result = await controller.getAssetBalance({});

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAssetBalanceResponse);
      expect(calculateAssetBalanceUseCase.execute).toHaveBeenCalledWith(
        undefined,
      );
    });

    it('should call use case with asOfDate parameter', async () => {
      calculateAssetBalanceUseCase.execute.mockResolvedValue(
        mockAssetBalanceResponse,
      );

      await controller.getAssetBalance({
        asOfDate: '2025-01-15',
      });

      expect(calculateAssetBalanceUseCase.execute).toHaveBeenCalledWith(
        new Date('2025-01-15'),
      );
    });
  });
});
