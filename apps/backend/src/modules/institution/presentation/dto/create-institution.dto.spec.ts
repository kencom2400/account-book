import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateInstitutionDto } from './create-institution.dto';
import { InstitutionType } from '@account-book/types';

describe('CreateInstitutionDto', () => {
  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToInstance(CreateInstitutionDto, {
        name: 'Test Bank',
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

    it('should fail validation when name is missing', async () => {
      const dto = plainToInstance(CreateInstitutionDto, {
        type: InstitutionType.BANK,
        credentials: {
          bankCode: '0001',
          branchCode: '001',
          accountNumber: '1234567',
        },
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
    });

    it('should fail validation when type is missing', async () => {
      const dto = plainToInstance(CreateInstitutionDto, {
        name: 'Test Bank',
        credentials: {
          bankCode: '0001',
          branchCode: '001',
          accountNumber: '1234567',
        },
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('type');
    });

    it('should fail validation when credentials is missing', async () => {
      const dto = plainToInstance(CreateInstitutionDto, {
        name: 'Test Bank',
        type: InstitutionType.BANK,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('credentials');
    });

    it('should fail validation when credentials is not an object', async () => {
      const dto = plainToInstance(CreateInstitutionDto, {
        name: 'Test Bank',
        type: InstitutionType.BANK,
        credentials: 'invalid',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const credentialsError = errors.find((e) => e.property === 'credentials');
      expect(credentialsError).toBeDefined();
    });

    it('should fail validation for bank type with invalid bankCode', async () => {
      const dto = plainToInstance(CreateInstitutionDto, {
        name: 'Test Bank',
        type: InstitutionType.BANK,
        credentials: {
          bankCode: '123', // 4桁でない
          branchCode: '001',
          accountNumber: '1234567',
        },
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const credentialsError = errors.find((e) => e.property === 'credentials');
      expect(credentialsError).toBeDefined();
    });

    it('should fail validation for bank type with invalid branchCode', async () => {
      const dto = plainToInstance(CreateInstitutionDto, {
        name: 'Test Bank',
        type: InstitutionType.BANK,
        credentials: {
          bankCode: '0001',
          branchCode: '12', // 3桁でない
          accountNumber: '1234567',
        },
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const credentialsError = errors.find((e) => e.property === 'credentials');
      expect(credentialsError).toBeDefined();
    });

    it('should fail validation for bank type with invalid accountNumber', async () => {
      const dto = plainToInstance(CreateInstitutionDto, {
        name: 'Test Bank',
        type: InstitutionType.BANK,
        credentials: {
          bankCode: '0001',
          branchCode: '001',
          accountNumber: '123456', // 7桁でない
        },
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const credentialsError = errors.find((e) => e.property === 'credentials');
      expect(credentialsError).toBeDefined();
    });

    it('should pass validation for non-bank type without bank credentials', async () => {
      const dto = plainToInstance(CreateInstitutionDto, {
        name: 'Test Credit Card',
        type: InstitutionType.CREDIT_CARD,
        credentials: {
          cardNumber: '1234',
        },
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail validation when type is invalid', async () => {
      const dto = plainToInstance(CreateInstitutionDto, {
        name: 'Test Bank',
        type: 'invalid' as InstitutionType,
        credentials: {
          bankCode: '0001',
          branchCode: '001',
          accountNumber: '1234567',
        },
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const typeError = errors.find((e) => e.property === 'type');
      expect(typeError).toBeDefined();
    });
  });
});
