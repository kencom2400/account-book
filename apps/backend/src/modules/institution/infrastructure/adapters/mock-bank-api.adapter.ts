import { Injectable } from '@nestjs/common';
import {
  BankCredentials,
  BankAccountInfo,
  BankTransaction,
  BankConnectionTestResult,
  BankAccountType,
  BankTransactionType,
  AuthenticationType,
} from '@account-book/types';
import { IBankApiAdapter } from '../../domain/adapters/bank-api.adapter.interface';
import { BankConnectionError } from '../../domain/errors/bank-connection.error';

/**
 * モック銀行APIアダプター
 * 開発・テスト用の実装
 */
@Injectable()
export class MockBankApiAdapter implements IBankApiAdapter {
  private readonly bankCode: string;

  constructor(bankCode: string = '0000') {
    this.bankCode = bankCode;
  }

  getBankCode(): string {
    return this.bankCode;
  }

  /**
   * ヘルスチェック（IFinancialApiClient実装）
   * FR-004: バックグラウンド接続確認で使用
   * @param _institutionId 金融機関ID
   */
  healthCheck(_institutionId: string): Promise<{
    success: boolean;
    needsReauth?: boolean;
    errorMessage?: string;
    errorCode?: string;
  }> {
    // モック実装: 常に成功を返す
    // 実際の実装では、institutionIdから認証情報を取得してtestConnectionを呼び出す
    return Promise.resolve({
      success: true,
    });
  }

  /**
   * 接続テストを実行（モック）
   */
  async testConnection(
    credentials: BankCredentials,
  ): Promise<BankConnectionTestResult> {
    // バリデーション
    if (!this.validateCredentials(credentials)) {
      return Promise.resolve({
        success: false,
        message: '認証情報が不正です',
        errorCode: 'BE001',
      });
    }

    // テスト用の成功レスポンス
    const accountNumber = this.getDisplayAccountNumber(credentials);
    const accountInfo: BankAccountInfo = {
      bankName: 'テスト銀行',
      branchName: 'テスト支店',
      accountNumber,
      accountHolder: 'テスト　タロウ',
      accountType: BankAccountType.ORDINARY,
      balance: 1000000,
      availableBalance: 1000000,
    };

    return Promise.resolve({
      success: true,
      message: '接続に成功しました',
      accountInfo,
    });
  }

  /**
   * 口座情報を取得（モック）
   */
  async getAccountInfo(credentials: BankCredentials): Promise<BankAccountInfo> {
    if (!this.validateCredentials(credentials)) {
      throw BankConnectionError.invalidCredentials();
    }

    const accountNumber = this.getDisplayAccountNumber(credentials);
    return Promise.resolve({
      bankName: 'テスト銀行',
      branchName: 'テスト支店',
      accountNumber,
      accountHolder: 'テスト　タロウ',
      accountType: BankAccountType.ORDINARY,
      balance: 1000000,
      availableBalance: 1000000,
    });
  }

  /**
   * 取引履歴を取得（モック）
   */
  async getTransactions(
    credentials: BankCredentials,
    _fromDate: string,
    _toDate: string,
  ): Promise<BankTransaction[]> {
    if (!this.validateCredentials(credentials)) {
      throw BankConnectionError.invalidCredentials();
    }

    // モックデータを生成
    const transactions: BankTransaction[] = [
      {
        transactionId: 'mock_001',
        date: '2025-11-15T10:00:00Z',
        type: BankTransactionType.DEPOSIT,
        amount: 250000,
        balance: 1000000,
        description: '給与振込',
        counterParty: '株式会社テスト',
      },
      {
        transactionId: 'mock_002',
        date: '2025-11-14T15:30:00Z',
        type: BankTransactionType.WITHDRAWAL,
        amount: -5000,
        balance: 750000,
        description: 'ATM出金',
      },
      {
        transactionId: 'mock_003',
        date: '2025-11-13T12:00:00Z',
        type: BankTransactionType.TRANSFER_OUT,
        amount: -30000,
        balance: 755000,
        description: '家賃振込',
        counterParty: '株式会社不動産',
      },
    ];

    return Promise.resolve(transactions);
  }

  /**
   * 認証情報のバリデーション
   */
  private validateCredentials(credentials: BankCredentials): boolean {
    // 銀行コードのチェック（4桁数字）
    if (!/^\d{4}$/.test(credentials.bankCode)) {
      return false;
    }

    // 認証タイプのチェック
    if (
      !credentials.authenticationType ||
      (credentials.authenticationType !== AuthenticationType.BRANCH_ACCOUNT &&
        credentials.authenticationType !== AuthenticationType.USERID_PASSWORD)
    ) {
      return false;
    }

    // 認証方式に応じたバリデーション
    if (credentials.authenticationType === AuthenticationType.BRANCH_ACCOUNT) {
      // 支店コードのチェック（3桁数字）
      if (
        typeof credentials.branchCode !== 'string' ||
        !/^\d{3}$/.test(credentials.branchCode)
      ) {
        return false;
      }

      // 口座番号のチェック（7桁数字）
      if (
        typeof credentials.accountNumber !== 'string' ||
        !/^\d{7}$/.test(credentials.accountNumber)
      ) {
        return false;
      }
    } else if (
      credentials.authenticationType === AuthenticationType.USERID_PASSWORD
    ) {
      // ユーザIDのチェック（1-100文字）
      if (
        typeof credentials.userId !== 'string' ||
        credentials.userId.length < 1 ||
        credentials.userId.length > 100
      ) {
        return false;
      }

      // パスワードのチェック（8-100文字）
      if (
        typeof credentials.password !== 'string' ||
        credentials.password.length < 8 ||
        credentials.password.length > 100
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * 表示用の口座番号を取得
   * accountNumberが存在する場合はそのまま返し、
   * 存在しない場合はuserIdの末尾4文字をマスクした形式を返す
   */
  private getDisplayAccountNumber(credentials: BankCredentials): string {
    if (credentials.accountNumber) {
      return credentials.accountNumber;
    }
    if (
      typeof credentials.userId === 'string' &&
      credentials.userId.length > 0
    ) {
      return `***${credentials.userId.slice(-4)}`;
    }
    return '*******';
  }
}
