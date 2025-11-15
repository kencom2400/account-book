import { Injectable } from '@nestjs/common';
import {
  BankCredentials,
  BankAccountInfo,
  BankTransaction,
  BankConnectionTestResult,
  BankAccountType,
  BankTransactionType,
} from '@account-book/types';
import { IBankApiAdapter } from '../../domain/adapters/bank-api.adapter.interface';

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
   * 接続テストを実行（モック）
   */
  async testConnection(
    credentials: BankCredentials,
  ): Promise<BankConnectionTestResult> {
    // バリデーション
    if (!this.validateCredentials(credentials)) {
      return {
        success: false,
        message: '認証情報が不正です',
        errorCode: 'BE001',
      };
    }

    // テスト用の成功レスポンス
    const accountInfo: BankAccountInfo = {
      bankName: 'テスト銀行',
      branchName: 'テスト支店',
      accountNumber: credentials.accountNumber,
      accountHolder: 'テスト　タロウ',
      accountType: BankAccountType.ORDINARY,
      balance: 1000000,
      availableBalance: 1000000,
    };

    return {
      success: true,
      message: '接続に成功しました',
      accountInfo,
    };
  }

  /**
   * 口座情報を取得（モック）
   */
  async getAccountInfo(credentials: BankCredentials): Promise<BankAccountInfo> {
    if (!this.validateCredentials(credentials)) {
      throw new Error('Invalid credentials');
    }

    return {
      bankName: 'テスト銀行',
      branchName: 'テスト支店',
      accountNumber: credentials.accountNumber,
      accountHolder: 'テスト　タロウ',
      accountType: BankAccountType.ORDINARY,
      balance: 1000000,
      availableBalance: 1000000,
    };
  }

  /**
   * 取引履歴を取得（モック）
   */
  async getTransactions(
    credentials: BankCredentials,
    fromDate: string,
    toDate: string,
  ): Promise<BankTransaction[]> {
    if (!this.validateCredentials(credentials)) {
      throw new Error('Invalid credentials');
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

    return transactions;
  }

  /**
   * 認証情報のバリデーション
   */
  private validateCredentials(credentials: BankCredentials): boolean {
    // 銀行コードのチェック（4桁数字）
    if (!/^\d{4}$/.test(credentials.bankCode)) {
      return false;
    }

    // 支店コードのチェック（3桁数字）
    if (!/^\d{3}$/.test(credentials.branchCode)) {
      return false;
    }

    // 口座番号のチェック（7桁数字）
    if (!/^\d{7}$/.test(credentials.accountNumber)) {
      return false;
    }

    return true;
  }
}

