import { Test, TestingModule } from '@nestjs/testing';
import { AggregationController } from './aggregation.controller';
import { CalculateMonthlyBalanceUseCase } from '../../application/use-cases/calculate-monthly-balance.use-case';
import { CalculateCategoryAggregationUseCase } from '../../application/use-cases/calculate-category-aggregation.use-case';
import { CalculateSubcategoryAggregationUseCase } from '../../application/use-cases/calculate-subcategory-aggregation.use-case';
import { CalculateInstitutionSummaryUseCase } from '../../application/use-cases/calculate-institution-summary.use-case';
import type { MonthlyBalanceResponseDto } from '../../application/use-cases/calculate-monthly-balance.use-case';
import type { CategoryAggregationResponseDto } from '../../application/use-cases/calculate-category-aggregation.use-case';
import { InstitutionType } from '@account-book/types';

describe('AggregationController', () => {
  let controller: AggregationController;
  let module: TestingModule;
  let calculateMonthlyBalanceUseCase: jest.Mocked<CalculateMonthlyBalanceUseCase>;
  let calculateCategoryAggregationUseCase: jest.Mocked<CalculateCategoryAggregationUseCase>;
  let calculateInstitutionSummaryUseCase: jest.Mocked<CalculateInstitutionSummaryUseCase>;

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
      ],
    }).compile();

    controller = module.get<AggregationController>(AggregationController);
    calculateMonthlyBalanceUseCase = module.get(CalculateMonthlyBalanceUseCase);
    calculateCategoryAggregationUseCase = module.get(
      CalculateCategoryAggregationUseCase,
    );
    calculateInstitutionSummaryUseCase = module.get(
      CalculateInstitutionSummaryUseCase,
    );
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
});
