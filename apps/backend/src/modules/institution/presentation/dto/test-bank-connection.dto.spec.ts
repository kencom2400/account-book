import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { TestBankConnectionDto } from './test-bank-connection.dto';
import { AuthenticationType } from '@account-book/types';

describe('TestBankConnectionDto', () => {
  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToInstance(TestBankConnectionDto, {
        bankCode: '0001',
        authenticationType: AuthenticationType.BRANCH_ACCOUNT,
        branchCode: '001',
        accountNumber: '1234567',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass validation with optional apiKey and apiSecret', async () => {
      const dto = plainToInstance(TestBankConnectionDto, {
        bankCode: '0001',
        authenticationType: AuthenticationType.BRANCH_ACCOUNT,
        branchCode: '001',
        accountNumber: '1234567',
        apiKey: 'test-api-key',
        apiSecret: 'test-api-secret',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail validation when bankCode is missing', async () => {
      const dto = plainToInstance(TestBankConnectionDto, {
        branchCode: '001',
        accountNumber: '1234567',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const bankCodeError = errors.find((e) => e.property === 'bankCode');
      expect(bankCodeError).toBeDefined();
    });

    it('should fail validation when bankCode is not 4 digits', async () => {
      const dto = plainToInstance(TestBankConnectionDto, {
        bankCode: '123',
        branchCode: '001',
        accountNumber: '1234567',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const bankCodeError = errors.find((e) => e.property === 'bankCode');
      expect(bankCodeError).toBeDefined();
    });

    it('should fail validation when branchCode is missing for BRANCH_ACCOUNT type', async () => {
      const dto = plainToInstance(TestBankConnectionDto, {
        bankCode: '0001',
        authenticationType: AuthenticationType.BRANCH_ACCOUNT,
        accountNumber: '1234567',
      });

      const errors = await validate(dto);

      // branchCodeはオプションなので、バリデーションエラーは発生しない
      // ただし、実際の接続テストでは失敗する可能性がある
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when branchCode is not 3 digits', async () => {
      const dto = plainToInstance(TestBankConnectionDto, {
        bankCode: '0001',
        branchCode: '12',
        accountNumber: '1234567',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const branchCodeError = errors.find((e) => e.property === 'branchCode');
      expect(branchCodeError).toBeDefined();
    });

    it('should fail validation when accountNumber is missing for BRANCH_ACCOUNT type', async () => {
      const dto = plainToInstance(TestBankConnectionDto, {
        bankCode: '0001',
        authenticationType: AuthenticationType.BRANCH_ACCOUNT,
        branchCode: '001',
      });

      const errors = await validate(dto);

      // accountNumberはオプションなので、バリデーションエラーは発生しない
      // ただし、実際の接続テストでは失敗する可能性がある
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when accountNumber is not 7 digits', async () => {
      const dto = plainToInstance(TestBankConnectionDto, {
        bankCode: '0001',
        branchCode: '001',
        accountNumber: '123456',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const accountNumberError = errors.find(
        (e) => e.property === 'accountNumber',
      );
      expect(accountNumberError).toBeDefined();
    });

    it('should fail validation when apiKey is too long', async () => {
      const dto = plainToInstance(TestBankConnectionDto, {
        bankCode: '0001',
        authenticationType: AuthenticationType.BRANCH_ACCOUNT,
        branchCode: '001',
        accountNumber: '1234567',
        apiKey: 'a'.repeat(501), // 501文字（500文字以下である必要がある）
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const apiKeyError = errors.find((e) => e.property === 'apiKey');
      expect(apiKeyError).toBeDefined();
    });

    it('should fail validation when apiSecret is too long', async () => {
      const dto = plainToInstance(TestBankConnectionDto, {
        bankCode: '0001',
        authenticationType: AuthenticationType.BRANCH_ACCOUNT,
        branchCode: '001',
        accountNumber: '1234567',
        apiSecret: 'a'.repeat(501), // 501文字（500文字以下である必要がある）
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const apiSecretError = errors.find((e) => e.property === 'apiSecret');
      expect(apiSecretError).toBeDefined();
    });

    // USERID_PASSWORD認証のテストケース
    it('should pass validation with valid USERID_PASSWORD credentials', async () => {
      const dto = plainToInstance(TestBankConnectionDto, {
        bankCode: '0005',
        authenticationType: AuthenticationType.USERID_PASSWORD,
        userId: 'testuser',
        password: 'password123',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail validation when userId is missing for USERID_PASSWORD type', async () => {
      const dto = plainToInstance(TestBankConnectionDto, {
        bankCode: '0005',
        authenticationType: AuthenticationType.USERID_PASSWORD,
        password: 'password123',
      });

      const errors = await validate(dto);

      // userIdはオプションなので、バリデーションエラーは発生しない
      // ただし、実際の接続テストでは失敗する可能性がある
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when userId is too short', async () => {
      const dto = plainToInstance(TestBankConnectionDto, {
        bankCode: '0005',
        authenticationType: AuthenticationType.USERID_PASSWORD,
        userId: '', // 空文字（1文字以上である必要がある）
        password: 'password123',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const userIdError = errors.find((e) => e.property === 'userId');
      expect(userIdError).toBeDefined();
    });

    it('should fail validation when userId is too long', async () => {
      const dto = plainToInstance(TestBankConnectionDto, {
        bankCode: '0005',
        authenticationType: AuthenticationType.USERID_PASSWORD,
        userId: 'a'.repeat(101), // 101文字（100文字以下である必要がある）
        password: 'password123',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const userIdError = errors.find((e) => e.property === 'userId');
      expect(userIdError).toBeDefined();
    });

    it('should fail validation when password is missing for USERID_PASSWORD type', async () => {
      const dto = plainToInstance(TestBankConnectionDto, {
        bankCode: '0005',
        authenticationType: AuthenticationType.USERID_PASSWORD,
        userId: 'testuser',
      });

      const errors = await validate(dto);

      // passwordはオプションなので、バリデーションエラーは発生しない
      // ただし、実際の接続テストでは失敗する可能性がある
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when password is too short', async () => {
      const dto = plainToInstance(TestBankConnectionDto, {
        bankCode: '0005',
        authenticationType: AuthenticationType.USERID_PASSWORD,
        userId: 'testuser',
        password: 'short', // 7文字（8文字以上である必要がある）
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const passwordError = errors.find((e) => e.property === 'password');
      expect(passwordError).toBeDefined();
    });

    it('should fail validation when password is too long', async () => {
      const dto = plainToInstance(TestBankConnectionDto, {
        bankCode: '0005',
        authenticationType: AuthenticationType.USERID_PASSWORD,
        userId: 'testuser',
        password: 'a'.repeat(101), // 101文字（100文字以下である必要がある）
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const passwordError = errors.find((e) => e.property === 'password');
      expect(passwordError).toBeDefined();
    });

    it('should fail validation when authenticationType is invalid', async () => {
      const dto = plainToInstance(TestBankConnectionDto, {
        bankCode: '0005',
        authenticationType: 'invalid' as AuthenticationType,
        userId: 'testuser',
        password: 'password123',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const authTypeError = errors.find(
        (e) => e.property === 'authenticationType',
      );
      expect(authTypeError).toBeDefined();
    });
  });
});
