import { Test, TestingModule } from '@nestjs/testing';
import { AggregationController } from './aggregation.controller';
import { CalculateMonthlyBalanceUseCase } from '../../application/use-cases/calculate-monthly-balance.use-case';
import type { MonthlyBalanceResponseDto } from '../../application/use-cases/calculate-monthly-balance.use-case';

describe('AggregationController', () => {
  let controller: AggregationController;
  let calculateMonthlyBalanceUseCase: jest.Mocked<CalculateMonthlyBalanceUseCase>;

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
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AggregationController],
      providers: [
        {
          provide: CalculateMonthlyBalanceUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<AggregationController>(AggregationController);
    calculateMonthlyBalanceUseCase = module.get(CalculateMonthlyBalanceUseCase);
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
});
