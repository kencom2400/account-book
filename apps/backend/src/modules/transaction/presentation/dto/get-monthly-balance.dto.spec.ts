import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { GetMonthlyBalanceDto } from './get-monthly-balance.dto';

describe('GetMonthlyBalanceDto', () => {
  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToInstance(GetMonthlyBalanceDto, {
        year: 2024,
        month: 1,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.year).toBe(2024);
      expect(dto.month).toBe(1);
    });

    it('should fail validation when year is missing', async () => {
      const dto = plainToInstance(GetMonthlyBalanceDto, {
        month: 1,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('year');
    });

    it('should fail validation when month is missing', async () => {
      const dto = plainToInstance(GetMonthlyBalanceDto, {
        year: 2024,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('month');
    });

    it('should fail validation when year is less than 1900', async () => {
      const dto = plainToInstance(GetMonthlyBalanceDto, {
        year: 1899,
        month: 1,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('year');
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should fail validation when month is less than 1', async () => {
      const dto = plainToInstance(GetMonthlyBalanceDto, {
        year: 2024,
        month: 0,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('month');
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should fail validation when month is greater than 12', async () => {
      const dto = plainToInstance(GetMonthlyBalanceDto, {
        year: 2024,
        month: 13,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('month');
      expect(errors[0].constraints).toHaveProperty('max');
    });

    it('should fail validation when year is not an integer', async () => {
      const dto = plainToInstance(GetMonthlyBalanceDto, {
        year: 2024.5,
        month: 1,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('year');
      expect(errors[0].constraints).toHaveProperty('isInt');
    });

    it('should fail validation when month is not an integer', async () => {
      const dto = plainToInstance(GetMonthlyBalanceDto, {
        year: 2024,
        month: 1.5,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('month');
      expect(errors[0].constraints).toHaveProperty('isInt');
    });

    it('should transform string to number', () => {
      const dto = plainToInstance(GetMonthlyBalanceDto, {
        year: '2024',
        month: '1',
      });

      expect(dto.year).toBe(2024);
      expect(dto.month).toBe(1);
    });
  });
});
