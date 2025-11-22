/**
 * 金融機関APIクライアントのインターフェース
 * 各モジュール（institution, credit-card, securities）のAPIアダプターが実装
 *
 * 注意: 既存のtestConnectionメソッドとは別に、healthCheckメソッドを実装してください
 */
export interface IFinancialApiClient {
  /**
   * ヘルスチェック
   * 金融機関IDを指定して接続状態を確認する
   * 既存のtestConnectionとは引数・戻り値が異なるため、別メソッドとして実装
   */
  healthCheck(institutionId: string): Promise<{
    success: boolean;
    needsReauth?: boolean;
    errorMessage?: string;
    errorCode?: string;
  }>;
}

/**
 * 金融機関情報
 */
export interface IInstitutionInfo {
  id: string;
  name: string;
  type: 'bank' | 'credit-card' | 'securities';
  apiClient: IFinancialApiClient;
}
