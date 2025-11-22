/**
 * 金融機関APIクライアントのインターフェース
 * 各モジュール（institution, credit-card, securities）のAPIアダプターが実装
 */
export interface IFinancialApiClient {
  /**
   * ヘルスチェック（推奨）
   */
  healthCheck?(institutionId: string): Promise<{
    success: boolean;
    needsReauth?: boolean;
    errorMessage?: string;
    errorCode?: string;
  }>;

  /**
   * 接続テスト（代替方法）
   */
  testConnection?(institutionId: string): Promise<{
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
