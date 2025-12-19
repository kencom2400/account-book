import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateInstitutionDto } from './create-institution.dto';
import { InstitutionType, AuthenticationType } from '@account-book/types';

describe('CreateInstitutionDto', () => {
  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToInstance(CreateInstitutionDto, {
        name: 'Test Bank',
        type: InstitutionType.BANK,
        credentials: {
          bankCode: '0001',
          authenticationType: AuthenticationType.BRANCH_ACCOUNT,
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
          authenticationType: AuthenticationType.BRANCH_ACCOUNT,
          branchCode: '001',
          accountNumber: '1234567',
        },
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const nameError = errors.find((e) => e.property === 'name');
      expect(nameError).toBeDefined();
    });

    it('should fail validation when type is missing', async () => {
      const dto = plainToInstance(CreateInstitutionDto, {
        name: 'Test Bank',
        credentials: {
          bankCode: '0001',
          authenticationType: AuthenticationType.BRANCH_ACCOUNT,
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
          authenticationType: AuthenticationType.BRANCH_ACCOUNT,
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
          authenticationType: AuthenticationType.BRANCH_ACCOUNT,
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
          authenticationType: AuthenticationType.BRANCH_ACCOUNT,
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
          authenticationType: AuthenticationType.BRANCH_ACCOUNT,
          branchCode: '001',
          accountNumber: '1234567',
        },
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const typeError = errors.find((e) => e.property === 'type');
      expect(typeError).toBeDefined();
    });

    // USERID_PASSWORD認証のテストケース
    it('should pass validation with valid USERID_PASSWORD credentials', async () => {
      const dto = plainToInstance(CreateInstitutionDto, {
        name: 'Test Bank',
        type: InstitutionType.BANK,
        credentials: {
          bankCode: '0005',
          authenticationType: AuthenticationType.USERID_PASSWORD,
          userId: 'testuser',
          password: 'password123',
        },
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail validation for bank type with invalid userId (too short)', async () => {
      const dto = plainToInstance(CreateInstitutionDto, {
        name: 'Test Bank',
        type: InstitutionType.BANK,
        credentials: {
          bankCode: '0005',
          authenticationType: AuthenticationType.USERID_PASSWORD,
          userId: '', // 空文字（1文字以上である必要がある）
          password: 'password123',
        },
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const credentialsError = errors.find((e) => e.property === 'credentials');
      expect(credentialsError).toBeDefined();
    });

    it('should fail validation for bank type with invalid userId (too long)', async () => {
      const dto = plainToInstance(CreateInstitutionDto, {
        name: 'Test Bank',
        type: InstitutionType.BANK,
        credentials: {
          bankCode: '0005',
          authenticationType: AuthenticationType.USERID_PASSWORD,
          userId: 'a'.repeat(101), // 101文字（100文字以下である必要がある）
          password: 'password123',
        },
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const credentialsError = errors.find((e) => e.property === 'credentials');
      expect(credentialsError).toBeDefined();
    });

    it('should fail validation for bank type with invalid password (too short)', async () => {
      const dto = plainToInstance(CreateInstitutionDto, {
        name: 'Test Bank',
        type: InstitutionType.BANK,
        credentials: {
          bankCode: '0005',
          authenticationType: AuthenticationType.USERID_PASSWORD,
          userId: 'testuser',
          password: 'short', // 7文字（8文字以上である必要がある）
        },
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const credentialsError = errors.find((e) => e.property === 'credentials');
      expect(credentialsError).toBeDefined();
    });

    it('should fail validation for bank type with invalid password (too long)', async () => {
      const dto = plainToInstance(CreateInstitutionDto, {
        name: 'Test Bank',
        type: InstitutionType.BANK,
        credentials: {
          bankCode: '0005',
          authenticationType: AuthenticationType.USERID_PASSWORD,
          userId: 'testuser',
          password: 'a'.repeat(101), // 101文字（100文字以下である必要がある）
        },
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const credentialsError = errors.find((e) => e.property === 'credentials');
      expect(credentialsError).toBeDefined();
    });

    it('should fail validation for bank type with missing userId for USERID_PASSWORD', async () => {
      const dto = plainToInstance(CreateInstitutionDto, {
        name: 'Test Bank',
        type: InstitutionType.BANK,
        credentials: {
          bankCode: '0005',
          authenticationType: AuthenticationType.USERID_PASSWORD,
          password: 'password123',
        },
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const credentialsError = errors.find((e) => e.property === 'credentials');
      expect(credentialsError).toBeDefined();
    });

    it('should fail validation for bank type with missing password for USERID_PASSWORD', async () => {
      const dto = plainToInstance(CreateInstitutionDto, {
        name: 'Test Bank',
        type: InstitutionType.BANK,
        credentials: {
          bankCode: '0005',
          authenticationType: AuthenticationType.USERID_PASSWORD,
          userId: 'testuser',
        },
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const credentialsError = errors.find((e) => e.property === 'credentials');
      expect(credentialsError).toBeDefined();
    });
  });

  describe('USERID_PASSWORD authentication', () => {
    it('should pass validation with valid USERID_PASSWORD credentials', async () => {
      const dto = plainToInstance(CreateInstitutionDto, {
        name: 'Test Bank',
        type: InstitutionType.BANK,
        credentials: {
          bankCode: '0005',
          authenticationType: AuthenticationType.USERID_PASSWORD,
          userId: 'testuser',
          password: 'password123',
        },
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should ignore apiKey and apiSecret for USERID_PASSWORD authentication', async () => {
      // USERID_PASSWORD認証の場合、apiKey/apiSecretは無視される（バリデーションエラーにならない）
      const dto = plainToInstance(CreateInstitutionDto, {
        name: 'Test Bank',
        type: InstitutionType.BANK,
        credentials: {
          bankCode: '0005',
          authenticationType: AuthenticationType.USERID_PASSWORD,
          userId: 'testuser',
          password: 'password123',
          apiKey: 'should-be-ignored',
          apiSecret: 'should-be-ignored',
        },
      });

      const errors = await validate(dto);

      // apiKey/apiSecretのバリデーションは実行されないため、エラーは発生しない
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when userId is missing for USERID_PASSWORD type', async () => {
      const dto = plainToInstance(CreateInstitutionDto, {
        name: 'Test Bank',
        type: InstitutionType.BANK,
        credentials: {
          bankCode: '0005',
          authenticationType: AuthenticationType.USERID_PASSWORD,
          password: 'password123',
        },
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const credentialsError = errors.find((e) => e.property === 'credentials');
      expect(credentialsError).toBeDefined();
    });

    it('should fail validation when password is missing for USERID_PASSWORD type', async () => {
      const dto = plainToInstance(CreateInstitutionDto, {
        name: 'Test Bank',
        type: InstitutionType.BANK,
        credentials: {
          bankCode: '0005',
          authenticationType: AuthenticationType.USERID_PASSWORD,
          userId: 'testuser',
        },
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const credentialsError = errors.find((e) => e.property === 'credentials');
      expect(credentialsError).toBeDefined();
    });
  });
});
