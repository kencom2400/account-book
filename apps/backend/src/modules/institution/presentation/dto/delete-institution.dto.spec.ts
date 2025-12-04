import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { DeleteInstitutionDto } from './delete-institution.dto';

describe('DeleteInstitutionDto', () => {
  describe('@Transform decorator', () => {
    it('should transform "true" string to boolean true', () => {
      const dto = plainToInstance(DeleteInstitutionDto, {
        deleteTransactions: 'true',
      });

      expect(dto.deleteTransactions).toBe(true);
    });

    it('should transform "false" string to boolean false', () => {
      const dto = plainToInstance(DeleteInstitutionDto, {
        deleteTransactions: 'false',
      });

      expect(dto.deleteTransactions).toBe(false);
    });

    it('should keep other string values as-is', () => {
      const dto = plainToInstance(DeleteInstitutionDto, {
        deleteTransactions: 'invalid',
      });

      expect(dto.deleteTransactions).toBe('invalid');
    });

    it('should keep boolean true as-is', () => {
      const dto = plainToInstance(DeleteInstitutionDto, {
        deleteTransactions: true,
      });

      expect(dto.deleteTransactions).toBe(true);
    });

    it('should keep boolean false as-is', () => {
      const dto = plainToInstance(DeleteInstitutionDto, {
        deleteTransactions: false,
      });

      expect(dto.deleteTransactions).toBe(false);
    });

    it('should keep undefined as-is when field is not provided', () => {
      const dto = plainToInstance(DeleteInstitutionDto, {});

      expect(dto.deleteTransactions).toBeUndefined();
    });
  });

  describe('validation', () => {
    it('should pass validation with boolean true', async () => {
      const dto = plainToInstance(DeleteInstitutionDto, {
        deleteTransactions: true,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.deleteTransactions).toBe(true);
    });

    it('should pass validation with boolean false', async () => {
      const dto = plainToInstance(DeleteInstitutionDto, {
        deleteTransactions: false,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.deleteTransactions).toBe(false);
    });

    it('should pass validation with transformed "true" string', async () => {
      const dto = plainToInstance(DeleteInstitutionDto, {
        deleteTransactions: 'true',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.deleteTransactions).toBe(true);
    });

    it('should pass validation with transformed "false" string', async () => {
      const dto = plainToInstance(DeleteInstitutionDto, {
        deleteTransactions: 'false',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.deleteTransactions).toBe(false);
    });

    it('should pass validation when deleteTransactions is not provided', async () => {
      const dto = plainToInstance(DeleteInstitutionDto, {});

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.deleteTransactions).toBeUndefined();
    });

    it('should fail validation with invalid string value', async () => {
      const dto = plainToInstance(DeleteInstitutionDto, {
        deleteTransactions: 'invalid',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('deleteTransactions');
      expect(errors[0].constraints).toHaveProperty('isBoolean');
    });

    it('should fail validation with number value', async () => {
      const dto = plainToInstance(DeleteInstitutionDto, {
        deleteTransactions: 1,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('deleteTransactions');
      expect(errors[0].constraints).toHaveProperty('isBoolean');
    });

    it('should pass validation with null value (optional field)', async () => {
      const dto = plainToInstance(DeleteInstitutionDto, {
        deleteTransactions: null,
      });

      const errors = await validate(dto);

      // @IsOptional()により、null値は許可される
      expect(errors).toHaveLength(0);
      expect(dto.deleteTransactions).toBeNull();
    });
  });
});
