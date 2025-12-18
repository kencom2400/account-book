import { Inject, Injectable } from '@nestjs/common';
import {
  BankCredentials,
  BankConnectionTestResult,
  AuthenticationType,
} from '@account-book/types';
import type { IBankApiAdapter } from '../../domain/adapters/bank-api.adapter.interface';
import { BankConnectionError } from '../../domain/errors/bank-connection.error';
import { BANK_API_ADAPTER } from '../../institution.tokens';

export interface TestBankConnectionDto {
  bankCode: string;
  authenticationType: AuthenticationType;
  branchCode?: string;
  accountNumber?: string;
  apiKey?: string;
  apiSecret?: string;
  userId?: string;
  password?: string;
}

/**
 * 銀行接続テストユースケース
 */
@Injectable()
export class TestBankConnectionUseCase {
  constructor(
    @Inject(BANK_API_ADAPTER)
    private readonly bankApiAdapter: IBankApiAdapter,
  ) {}

  async execute(dto: TestBankConnectionDto): Promise<BankConnectionTestResult> {
    try {
      // DTOをBankCredentialsに変換
      const credentials: BankCredentials = {
        bankCode: dto.bankCode,
        authenticationType: dto.authenticationType,
        branchCode: dto.branchCode,
        accountNumber: dto.accountNumber,
        apiKey: dto.apiKey,
        apiSecret: dto.apiSecret,
        userId: dto.userId,
        password: dto.password,
      };

      // 銀行APIアダプターを使って接続テスト
      const result = await this.bankApiAdapter.testConnection(credentials);

      return result;
    } catch (error) {
      // BankConnectionErrorの場合はそのまま返す
      if (error instanceof BankConnectionError) {
        return {
          success: false,
          message: error.message,
          errorCode: error.code,
        };
      }

      // その他のエラーの場合は汎用エラー
      return {
        success: false,
        message: `接続テストに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errorCode: 'BE999',
      };
    }
  }
}
