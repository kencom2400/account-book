import { Test, TestingModule } from '@nestjs/testing';
import { TestBankConnectionUseCase } from './test-bank-connection.use-case';
import { IBankApiAdapter, BANK_API_ADAPTER } from '../../domain/adapters/bank-api.adapter.interface';
import { BankConnectionTestResult, BankAccountType } from '@account-book/types';
import { BankConnectionError, BankErrorCode } from '../../domain/errors/bank-connection.error';

describe('TestBankConnectionUseCase', () => {
  let useCase: TestBankConnectionUseCase;
  let mockBankApiAdapter: jest.Mocked<IBankApiAdapter>;

  beforeEach(async () => {
    mockBankApiAdapter = {
      getBankCode: jest.fn(),
      testConnection: jest.fn(),
      getAccountInfo: jest.fn(),
      getTransactions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestBankConnectionUseCase,
        {
          provide: BANK_API_ADAPTER,
          useValue: mockBankApiAdapter,
        },
      ],
    }).compile();

    useCase = module.get<TestBankConnectionUseCase>(TestBankConnectionUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return success result for valid credentials', async () => {
      const dto = {
        bankCode: '0000',
        branchCode: '001',
        accountNumber: '1234567',
      };

      const mockResult: BankConnectionTestResult = {
        success: true,
        message: '接続に成功しました',
        accountInfo: {
          bankName: 'テスト銀行',
          branchName: 'テスト支店',
          accountNumber: '1234567',
          accountHolder: 'テスト　タロウ',
          accountType: BankAccountType.ORDINARY,
          balance: 1000000,
          availableBalance: 1000000,
        },
      };

      mockBankApiAdapter.testConnection.mockResolvedValue(mockResult);

      const result = await useCase.execute(dto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('接続に成功しました');
      expect(result.accountInfo).toBeDefined();
      expect(mockBankApiAdapter.testConnection).toHaveBeenCalledWith({
        bankCode: '0000',
        branchCode: '001',
        accountNumber: '1234567',
        apiKey: undefined,
        apiSecret: undefined,
      });
    });

    it('should return failure result for invalid credentials', async () => {
      const dto = {
        bankCode: 'invalid',
        branchCode: '001',
        accountNumber: '1234567',
      };

      const mockResult: BankConnectionTestResult = {
        success: false,
        message: '認証情報が不正です',
        errorCode: 'BE001',
      };

      mockBankApiAdapter.testConnection.mockResolvedValue(mockResult);

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('BE001');
    });

    it('should include optional API credentials', async () => {
      const dto = {
        bankCode: '0000',
        branchCode: '001',
        accountNumber: '1234567',
        apiKey: 'test-api-key',
        apiSecret: 'test-api-secret',
      };

      const mockResult: BankConnectionTestResult = {
        success: true,
        message: '接続に成功しました',
      };

      mockBankApiAdapter.testConnection.mockResolvedValue(mockResult);

      await useCase.execute(dto);

      expect(mockBankApiAdapter.testConnection).toHaveBeenCalledWith({
        bankCode: '0000',
        branchCode: '001',
        accountNumber: '1234567',
        apiKey: 'test-api-key',
        apiSecret: 'test-api-secret',
      });
    });

    it('should handle BankConnectionError', async () => {
      const dto = {
        bankCode: '0000',
        branchCode: '001',
        accountNumber: '1234567',
      };

      const error = BankConnectionError.invalidCredentials();
      mockBankApiAdapter.testConnection.mockRejectedValue(error);

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(BankErrorCode.INVALID_CREDENTIALS);
      expect(result.message).toContain('認証情報が不正');
    });

    it('should handle timeout errors', async () => {
      const dto = {
        bankCode: '0000',
        branchCode: '001',
        accountNumber: '1234567',
      };

      const error = BankConnectionError.connectionTimeout();
      mockBankApiAdapter.testConnection.mockRejectedValue(error);

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(BankErrorCode.CONNECTION_TIMEOUT);
    });

    it('should handle bank API errors', async () => {
      const dto = {
        bankCode: '0000',
        branchCode: '001',
        accountNumber: '1234567',
      };

      const error = BankConnectionError.bankApiError();
      mockBankApiAdapter.testConnection.mockRejectedValue(error);

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(BankErrorCode.BANK_API_ERROR);
    });

    it('should handle generic errors', async () => {
      const dto = {
        bankCode: '0000',
        branchCode: '001',
        accountNumber: '1234567',
      };

      const error = new Error('Unknown error');
      mockBankApiAdapter.testConnection.mockRejectedValue(error);

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('BE002');
      expect(result.message).toContain('接続テストに失敗しました');
    });

    it('should handle rate limit errors', async () => {
      const dto = {
        bankCode: '0000',
        branchCode: '001',
        accountNumber: '1234567',
      };

      const error = BankConnectionError.rateLimitExceeded();
      mockBankApiAdapter.testConnection.mockRejectedValue(error);

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(BankErrorCode.RATE_LIMIT_EXCEEDED);
    });

    it('should handle unsupported bank errors', async () => {
      const dto = {
        bankCode: '9999',
        branchCode: '001',
        accountNumber: '1234567',
      };

      const error = BankConnectionError.unsupportedBank('9999');
      mockBankApiAdapter.testConnection.mockRejectedValue(error);

      const result = await useCase.execute(dto);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(BankErrorCode.UNSUPPORTED_BANK);
    });
  });
});

