import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  GetTrendAnalysisDto,
  TrendTargetType,
  MovingAveragePeriod,
} from './get-trend-analysis.dto';

describe('GetTrendAnalysisDto', () => {
  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToInstance(GetTrendAnalysisDto, {
        startYear: 2024,
        startMonth: 1,
        endYear: 2024,
        endMonth: 12,
        targetType: TrendTargetType.BALANCE,
        movingAveragePeriod: MovingAveragePeriod.SIX_MONTHS,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with optional parameters omitted', async () => {
      const dto = plainToInstance(GetTrendAnalysisDto, {
        startYear: 2024,
        startMonth: 1,
        endYear: 2024,
        endMonth: 12,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when startYear is missing', async () => {
      const dto = plainToInstance(GetTrendAnalysisDto, {
        startMonth: 1,
        endYear: 2024,
        endMonth: 12,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.property).toBe('startYear');
    });

    it('should fail validation when startYear is less than 1900', async () => {
      const dto = plainToInstance(GetTrendAnalysisDto, {
        startYear: 1899,
        startMonth: 1,
        endYear: 2024,
        endMonth: 12,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const startYearError = errors.find((e) => e.property === 'startYear');
      expect(startYearError).toBeDefined();
    });

    it('should fail validation when startMonth is missing', async () => {
      const dto = plainToInstance(GetTrendAnalysisDto, {
        startYear: 2024,
        endYear: 2024,
        endMonth: 12,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.property).toBe('startMonth');
    });

    it('should fail validation when startMonth is less than 1', async () => {
      const dto = plainToInstance(GetTrendAnalysisDto, {
        startYear: 2024,
        startMonth: 0,
        endYear: 2024,
        endMonth: 12,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const startMonthError = errors.find((e) => e.property === 'startMonth');
      expect(startMonthError).toBeDefined();
    });

    it('should fail validation when startMonth is greater than 12', async () => {
      const dto = plainToInstance(GetTrendAnalysisDto, {
        startYear: 2024,
        startMonth: 13,
        endYear: 2024,
        endMonth: 12,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const startMonthError = errors.find((e) => e.property === 'startMonth');
      expect(startMonthError).toBeDefined();
    });

    it('should fail validation when endYear is missing', async () => {
      const dto = plainToInstance(GetTrendAnalysisDto, {
        startYear: 2024,
        startMonth: 1,
        endMonth: 12,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.property).toBe('endYear');
    });

    it('should fail validation when endYear is less than 1900', async () => {
      const dto = plainToInstance(GetTrendAnalysisDto, {
        startYear: 2024,
        startMonth: 1,
        endYear: 1899,
        endMonth: 12,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const endYearError = errors.find((e) => e.property === 'endYear');
      expect(endYearError).toBeDefined();
    });

    it('should fail validation when endMonth is missing', async () => {
      const dto = plainToInstance(GetTrendAnalysisDto, {
        startYear: 2024,
        startMonth: 1,
        endYear: 2024,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.property).toBe('endMonth');
    });

    it('should fail validation when endMonth is less than 1', async () => {
      const dto = plainToInstance(GetTrendAnalysisDto, {
        startYear: 2024,
        startMonth: 1,
        endYear: 2024,
        endMonth: 0,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const endMonthError = errors.find((e) => e.property === 'endMonth');
      expect(endMonthError).toBeDefined();
    });

    it('should fail validation when endMonth is greater than 12', async () => {
      const dto = plainToInstance(GetTrendAnalysisDto, {
        startYear: 2024,
        startMonth: 1,
        endYear: 2024,
        endMonth: 13,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const endMonthError = errors.find((e) => e.property === 'endMonth');
      expect(endMonthError).toBeDefined();
    });

    it('should accept valid targetType values', async () => {
      for (const targetType of Object.values(TrendTargetType)) {
        const dto = plainToInstance(GetTrendAnalysisDto, {
          startYear: 2024,
          startMonth: 1,
          endYear: 2024,
          endMonth: 12,
          targetType,
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should fail validation when targetType is invalid', async () => {
      const dto = plainToInstance(GetTrendAnalysisDto, {
        startYear: 2024,
        startMonth: 1,
        endYear: 2024,
        endMonth: 12,
        targetType: 'invalid' as TrendTargetType,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const targetTypeError = errors.find((e) => e.property === 'targetType');
      expect(targetTypeError).toBeDefined();
    });

    it('should accept valid movingAveragePeriod values', async () => {
      const validPeriods = [
        MovingAveragePeriod.THREE_MONTHS,
        MovingAveragePeriod.SIX_MONTHS,
        MovingAveragePeriod.TWELVE_MONTHS,
      ];

      for (const period of validPeriods) {
        const dto = plainToInstance(GetTrendAnalysisDto, {
          startYear: 2024,
          startMonth: 1,
          endYear: 2024,
          endMonth: 12,
          movingAveragePeriod: period,
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should fail validation when movingAveragePeriod is invalid', async () => {
      const dto = plainToInstance(GetTrendAnalysisDto, {
        startYear: 2024,
        startMonth: 1,
        endYear: 2024,
        endMonth: 12,
        movingAveragePeriod: 99 as MovingAveragePeriod,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const periodError = errors.find(
        (e) => e.property === 'movingAveragePeriod',
      );
      expect(periodError).toBeDefined();
    });

    it('should transform string numbers to numbers', () => {
      const dto = plainToInstance(GetTrendAnalysisDto, {
        startYear: '2024',
        startMonth: '1',
        endYear: '2024',
        endMonth: '12',
      });

      expect(dto.startYear).toBe(2024);
      expect(dto.startMonth).toBe(1);
      expect(dto.endYear).toBe(2024);
      expect(dto.endMonth).toBe(12);
    });
  });
});
