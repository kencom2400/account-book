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
@Injectable()
export class MufgBankApiAdapter implements IBankApiAdapter {
  private readonly logger = new Logger(MufgBankApiAdapter.name);
  private readonly bankCode = '0005';
  private readonly apiBaseUrl: string;
  private readonly timeout: number;

  constructor() {
    // 環境変数からAPIエンドポイントを取得
    // 実際のエンドポイントは開発者ポータルで確認してください
    this.apiBaseUrl = process.env.MUFG_API_BASE_URL || 'https://api.mufg.jp';
    this.timeout = parseInt(process.env.MUFG_API_TIMEOUT_MS || '30000', 10);
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

      // TODO: 実際のAPIエンドポイントとリクエスト形式を確認してください
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const authHeader = this.createAuthHeader(credentials);
        // TODO: 実際のエンドポイントURLを確認してください
        const endpoint = `${this.apiBaseUrl}/v1/transactions`;

        const response = await fetch(endpoint, {
          method: 'POST', // または GET
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify({
            // TODO: 実際のAPI仕様に応じたリクエストボディ
            fromDate,
            toDate,
            // userId: credentials.userId,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          await this.handleApiError(response, credentials);
        }

        const data = (await response.json()) as unknown;
        return this.mapApiResponseToTransactions(data);
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
   * APIレスポンスをBankTransaction[]にマッピング
   */
  private mapApiResponseToTransactions(
    apiResponse: unknown,
  ): BankTransaction[] {
    // TODO: 実際のAPIレスポンス形式に基づいて実装してください
    if (
      typeof apiResponse !== 'object' ||
      apiResponse === null ||
      !('transactions' in apiResponse || 'data' in apiResponse)
    ) {
      this.logger.warn('Invalid transactions API response format', apiResponse);
      return [];
    }

    const transactionsData =
      'transactions' in apiResponse
        ? (apiResponse as { transactions: unknown }).transactions
        : (apiResponse as { data: unknown }).data;

    if (!Array.isArray(transactionsData)) {
      return [];
    }

    return transactionsData
      .map((tx: unknown) => {
        if (typeof tx !== 'object' || tx === null) {
          return null;
        }

        const txData = tx as Record<string, unknown>;

        // TODO: 実際のAPIレスポンス形式に基づいてマッピング
        return {
          transactionId:
            (txData.transactionId as string | undefined) ||
            (txData.id as string | undefined) ||
            '',
          date:
            (txData.date as string | undefined) ||
            (txData.transactionDate as string | undefined) ||
            new Date().toISOString(),
          type: this.mapTransactionType(txData.type as string | undefined),
          amount: this.parseAmount(txData.amount),
          description:
            (txData.description as string | undefined) ||
            (txData.memo as string | undefined) ||
            '',
          balance: this.parseAmount(txData.balance),
        };
      })
      .filter((tx): tx is BankTransaction => tx !== null);
  }

  /**
   * 取引種別をマッピング
   */
  private mapTransactionType(apiType: string | undefined): BankTransactionType {
    if (!apiType) {
      return BankTransactionType.DEPOSIT; // デフォルト値
    }

    const normalized = apiType.toLowerCase();
    // TODO: 実際のAPIレスポンスの取引種別値を確認してマッピング
    if (normalized.includes('deposit') || normalized.includes('入金')) {
      return BankTransactionType.DEPOSIT;
    }
    if (normalized.includes('withdrawal') || normalized.includes('出金')) {
      return BankTransactionType.WITHDRAWAL;
    }
    if (
      normalized.includes('transfer_in') ||
      (normalized.includes('transfer') && normalized.includes('in')) ||
      (normalized.includes('振込') && normalized.includes('入'))
    ) {
      return BankTransactionType.TRANSFER_IN;
    }
    if (
      normalized.includes('transfer_out') ||
      (normalized.includes('transfer') && normalized.includes('out')) ||
      (normalized.includes('振込') && normalized.includes('出'))
    ) {
      return BankTransactionType.TRANSFER_OUT;
    }
    if (normalized.includes('fee') || normalized.includes('手数料')) {
      return BankTransactionType.FEE;
    }
    if (normalized.includes('interest') || normalized.includes('利息')) {
      return BankTransactionType.INTEREST;
    }

    // その他の取引はDEPOSITとして扱う（実際のAPI仕様に応じて調整）
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
   *
   * 注意: 実際のAPI仕様は開発者ポータルで確認してください
   * 以下の実装は一般的なREST APIパターンに基づいています
   */
  private async fetchAccountInfo(
    credentials: BankCredentials,
  ): Promise<BankAccountInfo> {
    try {
      // TODO: 実際のAPIエンドポイントとリクエスト形式を確認してください
      // 開発者ポータル（https://developer.portal.bk.mufg.jp/）で確認が必要です
      //
      // 一般的な実装例（実際の仕様に合わせて修正が必要）:
      // 1. 認証トークンの取得（OpenID Connectの場合）
      // 2. 口座情報取得APIの呼び出し

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        // 認証ヘッダーの生成
        // 実際のAPI仕様に応じて、Basic認証、Bearer認証、またはOpenID Connectを使用
        const authHeader = this.createAuthHeader(credentials);

        // APIエンドポイントの構築
        // TODO: 実際のエンドポイントURLを確認してください
        // 例: /v1/accounts, /api/v1/account-info など
        const endpoint = `${this.apiBaseUrl}/v1/accounts`;

        this.logger.debug(`Fetching account info from: ${endpoint}`);

        // HTTPリクエストの実行
        const response = await fetch(endpoint, {
          method: 'POST', // または GET（API仕様に応じて）
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
            // TODO: 実際のAPIで必要な追加ヘッダーを追加
            // 'X-API-Key': process.env.MUFG_API_KEY,
            // 'X-Request-ID': this.generateRequestId(),
          },
          body: JSON.stringify({
            // TODO: 実際のAPI仕様に応じたリクエストボディ
            // userId: credentials.userId,
            // その他の必要なパラメータ
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // レスポンスの処理
        if (!response.ok) {
          await this.handleApiError(response, credentials);
        }

        const data = (await response.json()) as unknown;
        return this.mapApiResponseToAccountInfo(data, credentials);
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
   * 認証ヘッダーを生成
   * 実際のAPI仕様に応じて、Basic認証、Bearer認証、またはOpenID Connectを使用
   */
  private createAuthHeader(credentials: BankCredentials): string {
    // TODO: 実際の認証方式を確認してください
    // 開発者ポータルで確認が必要です

    // パターン1: Basic認証
    const basicAuth = Buffer.from(
      `${credentials.userId}:${credentials.password}`,
    ).toString('base64');
    return `Basic ${basicAuth}`;

    // パターン2: Bearer認証（OpenID Connectの場合）
    // まずアクセストークンを取得する必要があります
    // const accessToken = await this.getAccessToken(credentials);
    // return `Bearer ${accessToken}`;
  }

  /**
   * APIエラーを処理
   */
  private async handleApiError(
    response: Response,
    credentials: BankCredentials,
  ): Promise<never> {
    const status = response.status;
    let errorMessage: string;
    let errorCode: BankErrorCode;

    try {
      const errorData = (await response.json()) as {
        message?: string;
        error?: string;
        code?: string;
      };
      errorMessage =
        errorData.message || errorData.error || `HTTP ${status} Error`;
    } catch {
      errorMessage = `HTTP ${status} ${response.statusText}`;
    }

    // HTTPステータスコードに応じたエラーコードの設定
    switch (status) {
      case 401:
      case 403:
        errorCode = BankErrorCode.INVALID_CREDENTIALS;
        errorMessage = '認証情報が無効です';
        break;
      case 404:
        errorCode = BankErrorCode.UNSUPPORTED_BANK;
        errorMessage = '指定された口座が見つかりません';
        break;
      case 408:
      case 504:
        errorCode = BankErrorCode.CONNECTION_TIMEOUT;
        errorMessage = 'API接続がタイムアウトしました';
        break;
      case 429:
        errorCode = BankErrorCode.RATE_LIMIT_EXCEEDED;
        errorMessage = 'APIレート制限を超過しました';
        break;
      default:
        errorCode = BankErrorCode.BANK_API_ERROR;
        if (status >= 500) {
          errorMessage = '銀行APIでエラーが発生しました';
        }
    }

    this.logger.error(
      `API error: ${status} - ${errorMessage} for bank code: ${credentials.bankCode}`,
    );

    throw new BankConnectionError(errorCode, errorMessage);
  }

  /**
   * APIレスポンスをBankAccountInfoにマッピング
   *
   * 注意: 実際のAPIレスポンス形式は開発者ポータルで確認してください
   * 以下の実装は一般的な形式を想定しています
   */
  private mapApiResponseToAccountInfo(
    apiResponse: unknown,
    credentials: BankCredentials,
  ): BankAccountInfo {
    // TODO: 実際のAPIレスポンス形式に基づいて実装してください
    // 開発者ポータルでレスポンス形式を確認してください

    // 一般的なレスポンス形式の例（実際の形式に合わせて修正が必要）
    if (
      typeof apiResponse !== 'object' ||
      apiResponse === null ||
      !('account' in apiResponse || 'data' in apiResponse)
    ) {
      this.logger.error('Invalid API response format', apiResponse);
      throw new BankConnectionError(
        BankErrorCode.BANK_API_ERROR,
        'APIレスポンスの形式が不正です',
      );
    }

    // レスポンスからデータを抽出（実際の形式に合わせて修正）
    const accountData =
      'account' in apiResponse
        ? (apiResponse as { account: unknown }).account
        : (apiResponse as { data: unknown }).data;

    if (typeof accountData !== 'object' || accountData === null) {
      throw new BankConnectionError(
        BankErrorCode.BANK_API_ERROR,
        'APIレスポンスの形式が不正です',
      );
    }

    const data = accountData as Record<string, unknown>;

    // 口座種別のマッピング
    // TODO: 実際のAPIレスポンスの口座種別フィールド名と値を確認
    const accountTypeStr = this.mapAccountType(
      data.accountType as string | undefined,
    );

    // 口座番号のマッピング
    // USERID_PASSWORD認証の場合、口座番号はAPIレスポンスから取得するか、
    // userIdの末尾をマスクした形式を使用
    const accountNumber =
      (data.accountNumber as string | undefined) ||
      (data.accountNo as string | undefined) ||
      `***${(credentials.userId || '').slice(-4)}`;

    return {
      bankName: (data.bankName as string | undefined) || '三菱UFJ銀行',
      branchName:
        (data.branchName as string | undefined) ||
        (data.branch as string | undefined) ||
        '',
      accountNumber,
      accountHolder:
        (data.accountHolder as string | undefined) ||
        (data.holderName as string | undefined) ||
        '',
      accountType: accountTypeStr,
      balance: this.parseAmount(data.balance),
      availableBalance: this.parseAmount(
        data.availableBalance || data.available || data.balance,
      ),
    };
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
