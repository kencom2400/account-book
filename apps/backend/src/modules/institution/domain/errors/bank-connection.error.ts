/**
 * 銀行接続関連のカスタムエラー
 * FR-001で定義されたエラーコードに対応
 */

export enum BankErrorCode {
  INVALID_CREDENTIALS = 'BE001', // 認証情報が不正
  CONNECTION_TIMEOUT = 'BE002', // API接続タイムアウト
  BANK_API_ERROR = 'BE003', // 銀行API側エラー
  UNSUPPORTED_BANK = 'BE004', // 対応していない銀行
  RATE_LIMIT_EXCEEDED = 'BE005', // APIレート制限超過
  UNKNOWN_ERROR = 'BE999', // 予期しないエラー
}

export class BankConnectionError extends Error {
  constructor(
    public readonly code: BankErrorCode,
    message: string,
    public readonly details?: any,
  ) {
    super(message);
    this.name = 'BankConnectionError';
    Object.setPrototypeOf(this, BankConnectionError.prototype);
  }

  /**
   * エラーコードに基づいてエラーを生成
   */
  static invalidCredentials(details?: any): BankConnectionError {
    return new BankConnectionError(
      BankErrorCode.INVALID_CREDENTIALS,
      '認証情報が不正です。入力内容を確認して再入力してください。',
      details,
    );
  }

  static connectionTimeout(details?: any): BankConnectionError {
    return new BankConnectionError(
      BankErrorCode.CONNECTION_TIMEOUT,
      '接続がタイムアウトしました。しばらく待ってから再試行してください。',
      details,
    );
  }

  static bankApiError(details?: any): BankConnectionError {
    return new BankConnectionError(
      BankErrorCode.BANK_API_ERROR,
      '銀行のシステムエラーが発生しました。銀行のメンテナンス情報を確認してください。',
      details,
    );
  }

  static unsupportedBank(bankCode: string): BankConnectionError {
    return new BankConnectionError(
      BankErrorCode.UNSUPPORTED_BANK,
      `銀行コード ${bankCode} は対応していません。対応銀行一覧を確認してください。`,
      { bankCode },
    );
  }

  static rateLimitExceeded(details?: any): BankConnectionError {
    return new BankConnectionError(
      BankErrorCode.RATE_LIMIT_EXCEEDED,
      'APIのレート制限を超過しました。時間を置いて再試行してください。',
      details,
    );
  }

  static unknownError(details?: any): BankConnectionError {
    return new BankConnectionError(
      BankErrorCode.UNKNOWN_ERROR,
      '予期しないエラーが発生しました。しばらく待ってから再試行してください。',
      details,
    );
  }

  /**
   * JSONに変換
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

