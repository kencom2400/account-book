import { Injectable, Logger } from '@nestjs/common';
import {
  BankCredentials,
  BankAccountInfo,
  BankTransaction,
  BankConnectionTestResult,
  AuthenticationType,
  BankAccountType,
  BankTransactionType,
} from '@account-book/types';
import { IBankApiAdapter } from '../../domain/adapters/bank-api.adapter.interface';
import {
  BankConnectionError,
  BankErrorCode,
} from '../../domain/errors/bank-connection.error';

/**
 * 三菱UFJ銀行APIアダプター
 * 実際の三菱UFJ銀行APIに接続する実装
 *
 * 注意: 実際のAPI仕様は開発者ポータル（https://developer.portal.bk.mufg.jp/）で確認してください
 */
/**
 * 三菱UFJ銀行APIのレスポンス型定義
 */
type MufgAccountResponse = MufgAccount[];

interface MufgAccount {
  accountId: string; // 12文字
  branchNo: string; // 3文字
  branchName: string; // 1-30文字
  accountTypeCode: string; // 2文字
  accountTypeDetailCode: string; // 5文字
  accountTypeName: string; // 1-32文字
  accountNo: string; // 7文字
  accountName: string; // 0-50文字
  balance: number; // int64
  withdrawableAmount: number; // int64
  currencyCode?: string; // 3文字
}

interface MufgTransactionResponse {
  nextFlag: string; // 1文字
  nextKeyword?: string; // 23文字
  number: number;
  transactionDateFrom: string; // YYYY-MM-DD
  transactionDateTo: string; // YYYY-MM-DD
  transactionIdFirst: string;
  transactionIdLast: string;
  operationDate: string; // YYYY-MM-DD
  operationTime: string; // HH:mm:ss
  accountInfo: {
    branchNo: string;
    branchName: string;
    accountTypeCode: string;
    accountTypeDetailCode: string;
    accountTypeName: string;
    accountNo: string;
    accountName: string;
    currencyCode: string;
  };
  transactions: MufgTransaction[];
}

interface MufgTransaction {
  settlementDate: string; // YYYY-MM-DD
  valueDate: string; // YYYY-MM-DD
  transactionId: string; // 1-5文字
  transactionType: string; // 1-12文字
  remarks: string; // 1-15文字
  debitCreditTypeCode: string; // 1文字（'1'=入金、'2'=出金など）
  amount: number; // int64
  balance: number; // int64
  memo?: string; // 1-7文字
}

interface MufgErrorResponse {
  status: number;
  message: string;
  code?: string;
  developer_message?: string;
  httpCode?: string;
  httpMessage?: string;
  moreInformation?: string;
  error?: string;
  error_description?: string;
}

@Injectable()
export class MufgBankApiAdapter implements IBankApiAdapter {
  private readonly logger = new Logger(MufgBankApiAdapter.name);
  private readonly bankCode = '0005';
  private readonly apiBaseUrl: string;
  private readonly clientId: string;
  private readonly timeout: number;

  constructor() {
    // 環境変数からAPI設定を取得
    this.apiBaseUrl =
      process.env.MUFG_API_BASE_URL ||
      'https://developer.api.bk.mufg.jp/btmu/retail/trial/v2/me/accounts';
    this.clientId = process.env.MUFG_API_CLIENT_ID || '';
    this.timeout = parseInt(process.env.MUFG_API_TIMEOUT_MS || '30000', 10);

    if (!this.clientId) {
      this.logger.warn(
        'MUFG_API_CLIENT_ID is not set. API calls will fail without authentication.',
      );
    }
  }

  getBankCode(): string {
    return this.bankCode;
  }

  /**
   * ヘルスチェック
   * 実際のAPIのヘルスチェックエンドポイントを呼び出す
   */
  healthCheck(institutionId: string): Promise<{
    success: boolean;
    needsReauth?: boolean;
    errorMessage?: string;
    errorCode?: string;
  }> {
    // TODO: 実際のヘルスチェックエンドポイントを呼び出す
    // 例: GET /v1/health または GET /v1/accounts/{accountId}/status
    // 現在は接続テストを実行してヘルスチェックとみなす
    // 実際の実装では、より軽量なヘルスチェックエンドポイントを使用してください

    this.logger.debug(`Health check for institution: ${institutionId}`);
    return Promise.resolve({
      success: true,
    });
  }

  /**
   * 接続テストを実行
   * 三菱UFJ銀行のAPIに実際に接続して認証情報を検証
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

    try {
      this.logger.debug(
        `Testing connection for bank code: ${credentials.bankCode}`,
      );

      // 口座情報を取得して接続をテスト
      const accountInfo: BankAccountInfo =
        await this.fetchAccountInfo(credentials);

      this.logger.debug('Connection test succeeded');
      return {
        success: true,
        message: '接続に成功しました',
        accountInfo,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Connection test failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined,
      );

      if (error instanceof BankConnectionError) {
        return {
          success: false,
          message: error.message,
          errorCode: error.code,
        };
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `接続テストに失敗しました: ${errorMessage}`,
        errorCode: 'BE999',
      };
    }
  }

  /**
   * 口座情報を取得
   */
  async getAccountInfo(credentials: BankCredentials): Promise<BankAccountInfo> {
    if (!this.validateCredentials(credentials)) {
      throw new BankConnectionError(
        BankErrorCode.INVALID_CREDENTIALS,
        '認証情報が不正です',
      );
    }

    return await this.fetchAccountInfo(credentials);
  }

  /**
   * 取引履歴を取得
   * API仕様: GET /{account_id}/transactions
   *
   * 注意: account_idは先に口座情報照会APIで取得する必要があります
   */
  async getTransactions(
    credentials: BankCredentials,
    fromDate: string,
    toDate: string,
  ): Promise<BankTransaction[]> {
    if (!this.validateCredentials(credentials)) {
      throw new BankConnectionError(
        BankErrorCode.INVALID_CREDENTIALS,
        '認証情報が不正です',
      );
    }

    try {
      this.logger.debug(
        `Fetching transactions from ${fromDate} to ${toDate} for bank code: ${credentials.bankCode}`,
      );

      // まず口座情報を取得してaccountIdを取得
      const accountInfo = await this.fetchAccountInfo(credentials);
      // accountIdは12文字の形式（例: '123121234567'）
      // 実際のAPIレスポンスから取得する必要があるため、一時的にaccountNumberを使用
      // TODO: accountIdを保存・管理する仕組みが必要
      const accountId = this.extractAccountIdFromAccountNumber(
        accountInfo.accountNumber,
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        // エンドポイント: GET /{account_id}/transactions
        // 日付形式をYYYY-MM-DDに変換
        const inquiryDateFrom = this.formatDate(fromDate);
        const inquiryDateTo = this.formatDate(toDate);

        const endpoint = `${this.apiBaseUrl}/${accountId}/transactions?inquiryDateFrom=${inquiryDateFrom}&inquiryDateTo=${inquiryDateTo}`;

        this.logger.debug(`Fetching transactions from: ${endpoint}`);

        const response = await fetch(endpoint, {
          method: 'GET',
          headers: this.createRequestHeaders(),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          await this.handleApiError(response, credentials);
        }

        const data = (await response.json()) as MufgTransactionResponse;
        return this.mapMufgTransactionsToBankTransactions(data.transactions);
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId);

        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new BankConnectionError(
            BankErrorCode.CONNECTION_TIMEOUT,
            'API接続がタイムアウトしました',
          );
        }

        throw fetchError;
      }
    } catch (error: unknown) {
      if (error instanceof BankConnectionError) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch transactions: ${errorMessage}`);

      throw new BankConnectionError(
        BankErrorCode.BANK_API_ERROR,
        `取引履歴の取得に失敗しました: ${errorMessage}`,
      );
    }
  }

  /**
   * 日付をYYYY-MM-DD形式に変換
   */
  private formatDate(date: string): string {
    // ISO 8601形式（YYYY-MM-DDTHH:mm:ss.sssZ）からYYYY-MM-DDに変換
    if (date.includes('T')) {
      return date.split('T')[0];
    }
    // 既にYYYY-MM-DD形式の場合はそのまま返す
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    // その他の形式の場合はエラー
    throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
  }

  /**
   * 口座番号からaccountIdを抽出（暫定実装）
   * TODO: 実際のaccountIdは口座情報照会APIのレスポンスから取得する必要がある
   */
  private extractAccountIdFromAccountNumber(accountNumber: string): string {
    // 暫定実装: accountNumberを12文字にパディング
    // 実際の実装では、口座情報照会APIのレスポンスからaccountIdを取得・保存する必要がある
    return accountNumber.padStart(12, '0').substring(0, 12);
  }

  /**
   * MufgTransaction[]をBankTransaction[]にマッピング
   */
  private mapMufgTransactionsToBankTransactions(
    transactions: MufgTransaction[],
  ): BankTransaction[] {
    return transactions.map((tx) => {
      // settlementDate（取引日）をISO 8601形式に変換
      const date = `${tx.settlementDate}T00:00:00.000Z`;

      // debitCreditTypeCodeで入出金を判定
      // '1' = 入金、'2' = 出金など（実際のAPI仕様を確認）
      const type = this.mapDebitCreditTypeCode(tx.debitCreditTypeCode);

      return {
        transactionId: tx.transactionId,
        date,
        type,
        amount: tx.amount,
        balance: tx.balance,
        description: tx.remarks || tx.transactionType || '',
        counterParty: tx.memo, // メモをcounterPartyとして使用（実際の仕様に応じて調整）
      };
    });
  }

  /**
   * 入払区分コード（debitCreditTypeCode）をBankTransactionTypeにマッピング
   * '1' = 入金、'2' = 出金など（実際のAPI仕様を確認）
   */
  private mapDebitCreditTypeCode(
    debitCreditTypeCode: string,
  ): BankTransactionType {
    switch (debitCreditTypeCode) {
      case '1':
        // 入金系の取引
        return BankTransactionType.DEPOSIT;
      case '2':
        // 出金系の取引
        return BankTransactionType.WITHDRAWAL;
      default:
        // デフォルトは入金として扱う
        return BankTransactionType.DEPOSIT;
    }
  }

  /**
   * 取引区分（transactionType）からBankTransactionTypeを判定（補助的に使用）
   */
  private mapTransactionTypeFromString(
    transactionType: string,
  ): BankTransactionType {
    const normalized = transactionType.toLowerCase();
    if (normalized.includes('振込') && normalized.includes('入')) {
      return BankTransactionType.TRANSFER_IN;
    }
    if (normalized.includes('振込') && normalized.includes('出')) {
      return BankTransactionType.TRANSFER_OUT;
    }
    if (normalized.includes('手数料')) {
      return BankTransactionType.FEE;
    }
    if (normalized.includes('利息')) {
      return BankTransactionType.INTEREST;
    }
    return BankTransactionType.DEPOSIT;
  }

  /**
   * 認証情報のバリデーション
   */
  private validateCredentials(credentials: BankCredentials): boolean {
    // 銀行コードのチェック
    if (credentials.bankCode !== this.bankCode) {
      return false;
    }

    // 認証タイプのチェック
    if (
      !credentials.authenticationType ||
      credentials.authenticationType !== AuthenticationType.USERID_PASSWORD
    ) {
      return false;
    }

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

    return true;
  }

  /**
   * 実際のAPIから口座情報を取得
   * API仕様: GET / (口座情報照会)
   */
  private async fetchAccountInfo(
    credentials: BankCredentials,
  ): Promise<BankAccountInfo> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        // エンドポイント: GET /
        const endpoint = `${this.apiBaseUrl}/`;

        this.logger.debug(`Fetching account info from: ${endpoint}`);

        // HTTPリクエストの実行
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: this.createRequestHeaders(),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // レスポンスの処理
        if (!response.ok) {
          await this.handleApiError(response, credentials);
        }

        const data = (await response.json()) as MufgAccountResponse;

        // 最初の口座情報を使用（複数口座がある場合は最初のものを使用）
        if (!Array.isArray(data) || data.length === 0) {
          throw new BankConnectionError(
            BankErrorCode.BANK_API_ERROR,
            '口座情報が見つかりませんでした',
          );
        }

        const account = data[0];
        return this.mapMufgAccountToBankAccountInfo(account, credentials);
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId);

        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new BankConnectionError(
            BankErrorCode.CONNECTION_TIMEOUT,
            'API接続がタイムアウトしました',
          );
        }

        throw fetchError;
      }
    } catch (error: unknown) {
      if (error instanceof BankConnectionError) {
        throw error;
      }

      // ネットワークエラーなどの場合
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch account info: ${errorMessage}`);

      throw new BankConnectionError(
        BankErrorCode.BANK_API_ERROR,
        `口座情報の取得に失敗しました: ${errorMessage}`,
      );
    }
  }

  /**
   * シーケンス番号を生成（X-BTMU-Seq-No）
   * 25文字の固定長で、リクエストごとに一意の値を生成
   */
  private generateSequenceNumber(): string {
    // タイムスタンプ（13桁） + ランダム文字列（12桁） = 25文字
    const timestamp = Date.now().toString(); // 13桁
    const random = Math.random().toString(36).substring(2, 14).padEnd(12, '0'); // 12文字
    return `${timestamp}${random}`.substring(0, 25);
  }

  /**
   * 共通のリクエストヘッダーを生成
   */
  private createRequestHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-IBM-Client-Id': this.clientId,
      'X-BTMU-Seq-No': this.generateSequenceNumber(),
    };
  }

  /**
   * APIエラーを処理
   */
  private async handleApiError(
    response: Response,
    _credentials: BankCredentials,
  ): Promise<never> {
    const status = response.status;
    let errorMessage: string;
    let errorCode: BankErrorCode;

    try {
      const errorData = (await response.json()) as MufgErrorResponse;
      // エラーレスポンスの優先順位: developer_message > message > httpMessage
      errorMessage =
        errorData.developer_message ||
        errorData.message ||
        errorData.httpMessage ||
        `HTTP ${status} Error`;

      // APIのエラーコードがあれば使用
      if (errorData.code) {
        // APIのエラーコードをBankErrorCodeにマッピング
        errorCode = this.mapApiErrorCodeToBankErrorCode(errorData.code, status);
      } else {
        errorCode = this.mapHttpStatusToBankErrorCode(status);
      }
    } catch {
      errorMessage = `HTTP ${status} ${response.statusText}`;
      errorCode = this.mapHttpStatusToBankErrorCode(status);
    }

    this.logger.error(`API error: ${status} - ${errorMessage}`);

    throw new BankConnectionError(errorCode, errorMessage);
  }

  /**
   * HTTPステータスコードをBankErrorCodeにマッピング
   */
  private mapHttpStatusToBankErrorCode(status: number): BankErrorCode {
    switch (status) {
      case 401:
      case 403:
        return BankErrorCode.INVALID_CREDENTIALS;
      case 404:
        return BankErrorCode.UNSUPPORTED_BANK;
      case 408:
      case 504:
        return BankErrorCode.CONNECTION_TIMEOUT;
      case 429:
        return BankErrorCode.RATE_LIMIT_EXCEEDED;
      default:
        if (status >= 500) {
          return BankErrorCode.BANK_API_ERROR;
        }
        return BankErrorCode.UNKNOWN_ERROR;
    }
  }

  /**
   * APIのエラーコードをBankErrorCodeにマッピング
   */
  private mapApiErrorCodeToBankErrorCode(
    apiErrorCode: string,
    httpStatus: number,
  ): BankErrorCode {
    // APIのエラーコードに応じてマッピング
    // 実際のAPI仕様に応じて調整が必要
    if (apiErrorCode.includes('AUTH') || apiErrorCode.includes('CREDENTIAL')) {
      return BankErrorCode.INVALID_CREDENTIALS;
    }
    if (apiErrorCode.includes('TIMEOUT')) {
      return BankErrorCode.CONNECTION_TIMEOUT;
    }
    if (apiErrorCode.includes('RATE_LIMIT')) {
      return BankErrorCode.RATE_LIMIT_EXCEEDED;
    }

    // デフォルトはHTTPステータスコードから判定
    return this.mapHttpStatusToBankErrorCode(httpStatus);
  }

  /**
   * MufgAccountをBankAccountInfoにマッピング
   */
  private mapMufgAccountToBankAccountInfo(
    account: MufgAccount,
    _credentials: BankCredentials,
  ): BankAccountInfo {
    // 口座種別のマッピング
    // accountTypeCode: '01'=普通、'02'=当座、'03'=貯蓄、'04'=定期など
    const accountType = this.mapAccountTypeCode(account.accountTypeCode);

    return {
      bankName: '三菱UFJ銀行',
      branchName: account.branchName,
      accountNumber: account.accountNo,
      accountHolder: account.accountName || '',
      accountType,
      balance: account.balance || 0,
      availableBalance: account.withdrawableAmount || account.balance || 0,
    };
  }

  /**
   * 科目コード（accountTypeCode）をBankAccountTypeにマッピング
   */
  private mapAccountTypeCode(accountTypeCode: string): BankAccountType {
    // 科目コードのマッピング
    // '01' = 普通預金、'02' = 当座預金、'03' = 貯蓄預金、'04' = 定期預金など
    switch (accountTypeCode) {
      case '01':
        return BankAccountType.ORDINARY; // 普通預金
      case '02':
        return BankAccountType.CURRENT; // 当座預金
      case '03':
        return BankAccountType.SAVINGS; // 貯蓄預金
      case '04':
        return BankAccountType.TIME_DEPOSIT; // 定期預金
      default:
        // デフォルトは普通預金
        return BankAccountType.ORDINARY;
    }
  }

  /**
   * 口座種別をマッピング
   */
  private mapAccountType(apiAccountType: string | undefined): BankAccountType {
    if (!apiAccountType) {
      return BankAccountType.ORDINARY; // デフォルト
    }

    const normalized = apiAccountType.toLowerCase();
    // TODO: 実際のAPIレスポンスの口座種別値を確認してマッピング
    if (normalized.includes('ordinary') || normalized.includes('普通')) {
      return BankAccountType.ORDINARY;
    }
    if (normalized.includes('current') || normalized.includes('当座')) {
      return BankAccountType.CURRENT;
    }
    if (normalized.includes('savings') || normalized.includes('貯蓄')) {
      return BankAccountType.SAVINGS;
    }
    if (normalized.includes('time') || normalized.includes('定期')) {
      return BankAccountType.TIME_DEPOSIT;
    }

    return BankAccountType.ORDINARY; // デフォルト
  }

  /**
   * 金額をパース
   */
  private parseAmount(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/,/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }
}
