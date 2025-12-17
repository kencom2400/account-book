import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { GetInstitutionsQueryDto } from './get-institutions.dto';
import { InstitutionType } from '@account-book/types';

describe('GetInstitutionsQueryDto', () => {
  describe('validation', () => {
    it('should pass validation with type', async () => {
      const dto = plainToInstance(GetInstitutionsQueryDto, {
        type: InstitutionType.BANK,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.type).toBe(InstitutionType.BANK);
    });

    it('should pass validation with isConnected as string "true"', async () => {
      const dto = plainToInstance(GetInstitutionsQueryDto, {
        isConnected: 'true',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.isConnected).toBe(true);
    });

    it('should pass validation with isConnected as string "false"', async () => {
      const dto = plainToInstance(GetInstitutionsQueryDto, {
        isConnected: 'false',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.isConnected).toBe(false);
    });

    it('should pass validation with isConnected as boolean true', async () => {
      const dto = plainToInstance(GetInstitutionsQueryDto, {
        isConnected: true,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.isConnected).toBe(true);
    });

    it('should pass validation with isConnected as boolean false', async () => {
      const dto = plainToInstance(GetInstitutionsQueryDto, {
        isConnected: false,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.isConnected).toBe(false);
    });

    it('should pass validation with empty object', async () => {
      const dto = plainToInstance(GetInstitutionsQueryDto, {});

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass validation with both type and isConnected', async () => {
      const dto = plainToInstance(GetInstitutionsQueryDto, {
        type: InstitutionType.BANK,
        isConnected: 'true',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.type).toBe(InstitutionType.BANK);
      expect(dto.isConnected).toBe(true);
    });

    it('should fail validation when type is invalid', async () => {
      const dto = plainToInstance(GetInstitutionsQueryDto, {
        type: 'invalid' as InstitutionType,
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const typeError = errors.find((e) => e.property === 'type');
      expect(typeError).toBeDefined();
    });
  });
});
