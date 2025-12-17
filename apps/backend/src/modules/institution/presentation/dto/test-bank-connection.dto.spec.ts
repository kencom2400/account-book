import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { TestBankConnectionDto } from './test-bank-connection.dto';

describe('TestBankConnectionDto', () => {
  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToInstance(TestBankConnectionDto, {
        bankCode: '0001',
        branchCode: '001',
        accountNumber: '1234567',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass validation with optional apiKey and apiSecret', async () => {
      const dto = plainToInstance(TestBankConnectionDto, {
        bankCode: '0001',
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

    it('should fail validation when branchCode is missing', async () => {
      const dto = plainToInstance(TestBankConnectionDto, {
        bankCode: '0001',
        accountNumber: '1234567',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const branchCodeError = errors.find((e) => e.property === 'branchCode');
      expect(branchCodeError).toBeDefined();
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

    it('should fail validation when accountNumber is missing', async () => {
      const dto = plainToInstance(TestBankConnectionDto, {
        bankCode: '0001',
        branchCode: '001',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const accountNumberError = errors.find(
        (e) => e.property === 'accountNumber',
      );
      expect(accountNumberError).toBeDefined();
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
        branchCode: '001',
        accountNumber: '1234567',
        apiKey: 'a'.repeat(256), // 256文字（255文字以下である必要がある）
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const apiKeyError = errors.find((e) => e.property === 'apiKey');
      expect(apiKeyError).toBeDefined();
    });

    it('should fail validation when apiSecret is too long', async () => {
      const dto = plainToInstance(TestBankConnectionDto, {
        bankCode: '0001',
        branchCode: '001',
        accountNumber: '1234567',
        apiSecret: 'a'.repeat(256), // 256文字（255文字以下である必要がある）
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const apiSecretError = errors.find((e) => e.property === 'apiSecret');
      expect(apiSecretError).toBeDefined();
    });
  });
});
