import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateInstitutionDto } from './update-institution.dto';
import { InstitutionType } from '@account-book/types';

describe('UpdateInstitutionDto', () => {
  describe('validation', () => {
    it('should pass validation with all fields', async () => {
      const dto = plainToInstance(UpdateInstitutionDto, {
        name: 'Updated Bank',
        type: InstitutionType.BANK,
        credentials: {
          bankCode: '0001',
          branchCode: '001',
          accountNumber: '1234567',
        },
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass validation with only name', async () => {
      const dto = plainToInstance(UpdateInstitutionDto, {
        name: 'Updated Bank',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass validation with only type', async () => {
      const dto = plainToInstance(UpdateInstitutionDto, {
        type: InstitutionType.BANK,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass validation with only credentials', async () => {
      const dto = plainToInstance(UpdateInstitutionDto, {
        credentials: {
          bankCode: '0001',
          branchCode: '001',
          accountNumber: '1234567',
        },
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass validation with empty object', async () => {
      const dto = plainToInstance(UpdateInstitutionDto, {});

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail validation when name is not a string', async () => {
      const dto = plainToInstance(UpdateInstitutionDto, {
        name: 123,
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const nameError = errors.find((e) => e.property === 'name');
      expect(nameError).toBeDefined();
    });

    it('should fail validation when type is invalid', async () => {
      const dto = plainToInstance(UpdateInstitutionDto, {
        type: 'invalid' as InstitutionType,
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const typeError = errors.find((e) => e.property === 'type');
      expect(typeError).toBeDefined();
    });

    it('should fail validation when credentials is not an object', async () => {
      const dto = plainToInstance(UpdateInstitutionDto, {
        credentials: 'invalid',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const credentialsError = errors.find((e) => e.property === 'credentials');
      expect(credentialsError).toBeDefined();
    });
  });
});
