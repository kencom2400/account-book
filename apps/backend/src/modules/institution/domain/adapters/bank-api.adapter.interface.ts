import {
  BankCredentials,
  BankAccountInfo,
  BankTransaction,
  BankConnectionTestResult,
} from '@account-book/types';

/**
 * 銀行APIアダプターのインターフェース
 * 各銀行ごとの具体的な実装を抽象化する
 */
export interface IBankApiAdapter {
  /**
   * 銀行コードを取得
   */
  getBankCode(): string;

  /**
   * 接続テストを実行
   * @param credentials 銀行認証情報
   * @returns 接続テスト結果
   */
  testConnection(
    credentials: BankCredentials,
  ): Promise<BankConnectionTestResult>;

  /**
   * 口座情報を取得
   * @param credentials 銀行認証情報
   * @returns 口座情報
   */
  getAccountInfo(credentials: BankCredentials): Promise<BankAccountInfo>;

  /**
   * 取引履歴を取得
   * @param credentials 銀行認証情報
   * @param fromDate 取得開始日（ISO 8601形式）
   * @param toDate 取得終了日（ISO 8601形式）
   * @returns 取引履歴の配列
   */
  getTransactions(
    credentials: BankCredentials,
    fromDate: string,
    toDate: string,
  ): Promise<BankTransaction[]>;
}

export const BANK_API_ADAPTER = Symbol('IBankApiAdapter');

