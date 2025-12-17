import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { GetSupportedBanksQueryDto } from './get-supported-banks.dto';
import { BankCategory } from '@account-book/types';

describe('GetSupportedBanksQueryDto', () => {
  describe('validation', () => {
    it('should pass validation with category', async () => {
      const dto = plainToInstance(GetSupportedBanksQueryDto, {
        category: BankCategory.MAJOR,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.category).toBe(BankCategory.MAJOR);
    });

    it('should pass validation with searchTerm', async () => {
      const dto = plainToInstance(GetSupportedBanksQueryDto, {
        searchTerm: '三菱',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.searchTerm).toBe('三菱');
    });

    it('should pass validation with both category and searchTerm', async () => {
      const dto = plainToInstance(GetSupportedBanksQueryDto, {
        category: BankCategory.MAJOR,
        searchTerm: '三菱',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.category).toBe(BankCategory.MAJOR);
      expect(dto.searchTerm).toBe('三菱');
    });

    it('should pass validation with empty object', async () => {
      const dto = plainToInstance(GetSupportedBanksQueryDto, {});

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail validation when category is invalid', async () => {
      const dto = plainToInstance(GetSupportedBanksQueryDto, {
        category: 'invalid' as BankCategory,
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const categoryError = errors.find((e) => e.property === 'category');
      expect(categoryError).toBeDefined();
    });

    it('should fail validation when searchTerm is not a string', async () => {
      const dto = plainToInstance(GetSupportedBanksQueryDto, {
        searchTerm: 123,
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const searchTermError = errors.find((e) => e.property === 'searchTerm');
      expect(searchTermError).toBeDefined();
    });
  });
});
