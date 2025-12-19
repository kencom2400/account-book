import { Injectable } from '@nestjs/common';
import {
  BankCredentials,
  BankConnectionTestResult,
  AuthenticationType,
} from '@account-book/types';
import type { IBankApiAdapter } from '../../domain/adapters/bank-api.adapter.interface';
import { BankConnectionError } from '../../domain/errors/bank-connection.error';
import { BankApiAdapterFactory } from '../../infrastructure/adapters/bank-api-adapter.factory';

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
  constructor(private readonly adapterFactory: BankApiAdapterFactory) {}

  async execute(dto: TestBankConnectionDto): Promise<BankConnectionTestResult> {
    try {
      // 銀行コードに応じて適切なアダプターを取得
      const bankApiAdapter: IBankApiAdapter = this.adapterFactory.create(
        dto.bankCode,
      );

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
      const result = await bankApiAdapter.testConnection(credentials);

      return result;
    } catch (error: unknown) {
      // BankConnectionErrorの場合はそのまま返す
      if (error instanceof BankConnectionError) {
        return {
          success: false,
          message: error.message,
          errorCode: error.code,
        };
      }

      // その他のエラーの場合は汎用エラー
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `接続テストに失敗しました: ${errorMessage}`,
        errorCode: 'BE999',
      };
    }
  }
}
