import { HoldingEntity } from '../../domain/entities/holding.entity';
import { SecurityTransactionEntity } from '../../domain/entities/security-transaction.entity';

/**
 * APIレスポンス: 接続テスト
 */
export interface SecuritiesConnectionResult {
  success: boolean;
  error?: string;
}

/**
 * APIレスポンス: 口座情報
 */
export interface SecuritiesAccountInfo {
  accountNumber: string;
  accountType: string;
  totalEvaluationAmount: number;
  cashBalance: number;
}

/**
 * APIレスポンス: 保有銘柄（生データ）
 */
export interface SecuritiesHoldingData {
  securityCode: string;
  securityName: string;
  quantity: number;
  averageAcquisitionPrice: number;
  currentPrice: number;
  securityType: 'stock' | 'bond' | 'fund' | 'etf' | 'reit';
  market: string;
}

/**
 * APIレスポンス: 取引履歴（生データ）
 */
export interface SecuritiesTransactionData {
  id: string;
  securityCode: string;
  securityName: string;
  transactionDate: string | Date;
  transactionType:
    | 'buy'
    | 'sell'
    | 'dividend'
    | 'distribution'
    | 'split'
    | 'other';
  quantity: number;
  price: number;
  fee: number;
  status: 'pending' | 'completed' | 'cancelled';
}

/**
 * API認証情報
 */
export interface SecuritiesAPICredentials {
  loginId: string;
  password: string;
  tradingPassword?: string;
  accountNumber: string;
}

/**
 * 証券会社APIクライアントインターフェース
 */
export interface ISecuritiesAPIClient {
  /**
   * 接続テスト
   */
  testConnection(
    credentials: SecuritiesAPICredentials,
  ): Promise<SecuritiesConnectionResult>;

  /**
   * 口座情報を取得
   */
  getAccountInfo(
    credentials: SecuritiesAPICredentials,
  ): Promise<SecuritiesAccountInfo>;

  /**
   * 保有銘柄を取得
   */
  getHoldings(
    credentials: SecuritiesAPICredentials,
  ): Promise<SecuritiesHoldingData[]>;

  /**
   * 取引履歴を取得
   */
  getTransactions(
    credentials: SecuritiesAPICredentials,
    startDate: Date,
    endDate: Date,
  ): Promise<SecuritiesTransactionData[]>;

  /**
   * 時価（現在値）を取得
   */
  getCurrentPrice(securityCode: string): Promise<number>;

  /**
   * 保有銘柄データをエンティティに変換
   */
  mapToHoldingEntity(
    accountId: string,
    data: SecuritiesHoldingData,
  ): HoldingEntity;

  /**
   * 取引データをエンティティに変換
   */
  mapToTransactionEntity(
    accountId: string,
    data: SecuritiesTransactionData,
  ): SecurityTransactionEntity;
}
