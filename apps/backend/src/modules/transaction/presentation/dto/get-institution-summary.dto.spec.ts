import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  GetInstitutionSummaryDto,
  IsEndDateAfterStartDateConstraint,
} from './get-institution-summary.dto';

describe('GetInstitutionSummaryDto', () => {
  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToInstance(GetInstitutionSummaryDto, {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.startDate).toBe('2024-01-01');
      expect(dto.endDate).toBe('2024-01-31');
    });

    it('should pass validation with optional fields', async () => {
      const dto = plainToInstance(GetInstitutionSummaryDto, {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        institutionIds: ['inst_1', 'inst_2'],
        includeTransactions: true,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.institutionIds).toEqual(['inst_1', 'inst_2']);
      expect(dto.includeTransactions).toBe(true);
    });

    it('should fail validation when startDate is missing', async () => {
      const dto = plainToInstance(GetInstitutionSummaryDto, {
        endDate: '2024-01-31',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('startDate');
    });

    it('should fail validation when endDate is missing', async () => {
      const dto = plainToInstance(GetInstitutionSummaryDto, {
        startDate: '2024-01-01',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('endDate');
    });

    it('should fail validation when startDate is not a valid date string', async () => {
      const dto = plainToInstance(GetInstitutionSummaryDto, {
        startDate: 'invalid-date',
        endDate: '2024-01-31',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const startDateError = errors.find((e) => e.property === 'startDate');
      expect(startDateError).toBeDefined();
    });

    it('should fail validation when endDate is not a valid date string', async () => {
      const dto = plainToInstance(GetInstitutionSummaryDto, {
        startDate: '2024-01-01',
        endDate: 'invalid-date',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const endDateError = errors.find((e) => e.property === 'endDate');
      expect(endDateError).toBeDefined();
    });

    it('should fail validation when endDate is before startDate', async () => {
      const dto = plainToInstance(GetInstitutionSummaryDto, {
        startDate: '2024-01-31',
        endDate: '2024-01-01',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const endDateError = errors.find((e) => e.property === 'endDate');
      expect(endDateError).toBeDefined();
      expect(endDateError?.constraints).toHaveProperty(
        'isEndDateAfterStartDate',
      );
    });

    it('should pass validation when endDate equals startDate', async () => {
      const dto = plainToInstance(GetInstitutionSummaryDto, {
        startDate: '2024-01-01',
        endDate: '2024-01-01',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail validation when institutionIds is not an array', async () => {
      const dto = plainToInstance(GetInstitutionSummaryDto, {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        institutionIds: 'not-an-array',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const institutionIdsError = errors.find(
        (e) => e.property === 'institutionIds',
      );
      expect(institutionIdsError).toBeDefined();
    });

    it('should fail validation when institutionIds contains non-string values', async () => {
      const dto = plainToInstance(GetInstitutionSummaryDto, {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        institutionIds: ['inst_1', 123, 'inst_2'],
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const institutionIdsError = errors.find(
        (e) => e.property === 'institutionIds',
      );
      expect(institutionIdsError).toBeDefined();
    });

    it('should fail validation when includeTransactions is not a boolean', async () => {
      const dto = plainToInstance(GetInstitutionSummaryDto, {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        includeTransactions: 'not-a-boolean',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const includeTransactionsError = errors.find(
        (e) => e.property === 'includeTransactions',
      );
      expect(includeTransactionsError).toBeDefined();
    });
  });

  describe('IsEndDateAfterStartDateConstraint', () => {
    let constraint: IsEndDateAfterStartDateConstraint;

    beforeEach(() => {
      constraint = new IsEndDateAfterStartDateConstraint();
    });

    it('should return true when endDate is after startDate', () => {
      const dto = plainToInstance(GetInstitutionSummaryDto, {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      const args = {
        object: dto,
        value: dto.endDate,
        property: 'endDate',
        constraints: [],
        targetName: 'GetInstitutionSummaryDto',
      } as any;

      const result = constraint.validate(dto.endDate, args);

      expect(result).toBe(true);
    });

    it('should return true when endDate equals startDate', () => {
      const dto = plainToInstance(GetInstitutionSummaryDto, {
        startDate: '2024-01-01',
        endDate: '2024-01-01',
      });

      const args = {
        object: dto,
        value: dto.endDate,
        property: 'endDate',
        constraints: [],
        targetName: 'GetInstitutionSummaryDto',
      } as any;

      const result = constraint.validate(dto.endDate, args);

      expect(result).toBe(true);
    });

    it('should return false when endDate is before startDate', () => {
      const dto = plainToInstance(GetInstitutionSummaryDto, {
        startDate: '2024-01-31',
        endDate: '2024-01-01',
      });

      const args = {
        object: dto,
        value: dto.endDate,
        property: 'endDate',
        constraints: [],
        targetName: 'GetInstitutionSummaryDto',
      } as any;

      const result = constraint.validate(dto.endDate, args);

      expect(result).toBe(false);
    });

    it('should return true when startDate is missing (handled by @IsNotEmpty)', () => {
      const dto = plainToInstance(GetInstitutionSummaryDto, {
        endDate: '2024-01-31',
      });

      const args = {
        object: dto,
        value: dto.endDate,
        property: 'endDate',
        constraints: [],
        targetName: 'GetInstitutionSummaryDto',
      } as any;

      const result = constraint.validate(dto.endDate, args);

      expect(result).toBe(true);
    });

    it('should return true when endDate is missing (handled by @IsNotEmpty)', () => {
      const dto = plainToInstance(GetInstitutionSummaryDto, {
        startDate: '2024-01-01',
      });

      const args = {
        object: dto,
        value: undefined,
        property: 'endDate',
        constraints: [],
        targetName: 'GetInstitutionSummaryDto',
      } as any;

      const result = constraint.validate(undefined, args);

      expect(result).toBe(true);
    });

    it('should return appropriate error message', () => {
      const args = {
        object: {},
        value: '2024-01-01',
        property: 'endDate',
        constraints: [],
        targetName: 'GetInstitutionSummaryDto',
      } as any;

      const message = constraint.defaultMessage(args);

      expect(message).toBe('endDate must be after or equal to startDate');
    });
  });
});
