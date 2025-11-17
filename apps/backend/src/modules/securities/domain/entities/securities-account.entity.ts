import { EncryptedCredentials } from '../../../institution/domain/value-objects/encrypted-credentials.vo';

export interface SecuritiesAccountJSONResponse {
  id: string;
  securitiesCompanyName: string;
  accountNumber: string;
  accountType: 'general' | 'specific' | 'nisa' | 'tsumitate-nisa' | 'isa';
  credentials: ReturnType<EncryptedCredentials['toJSON']>;
  isConnected: boolean;
  lastSyncedAt: Date | null;
  totalEvaluationAmount: number;
  cashBalance: number;
  totalProfitLoss: number;
  totalProfitLossRate: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SecuritiesAccountエンティティ
 * 証券口座情報を表すドメインエンティティ
 */
export class SecuritiesAccountEntity {
  constructor(
    public readonly id: string,
    public readonly securitiesCompanyName: string,
    public readonly accountNumber: string,
    public readonly accountType:
      | 'general'
      | 'specific'
      | 'nisa'
      | 'tsumitate-nisa'
      | 'isa',
    public readonly credentials: EncryptedCredentials,
    public readonly isConnected: boolean,
    public readonly lastSyncedAt: Date | null,
    public readonly totalEvaluationAmount: number, // 評価額合計
    public readonly cashBalance: number, // 現金残高
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id) {
      throw new Error('Securities account ID is required');
    }

    if (!this.securitiesCompanyName) {
      throw new Error('Securities company name is required');
    }

    if (!this.accountNumber) {
      throw new Error('Account number is required');
    }

    if (!this.accountType) {
      throw new Error('Account type is required');
    }

    const validAccountTypes = [
      'general',
      'specific',
      'nisa',
      'tsumitate-nisa',
      'isa',
    ];
    if (!validAccountTypes.includes(this.accountType)) {
      throw new Error(`Invalid account type: ${this.accountType}`);
    }

    if (!this.credentials) {
      throw new Error('Credentials are required');
    }

    if (this.totalEvaluationAmount < 0) {
      throw new Error('Total evaluation amount must be non-negative');
    }

    if (this.cashBalance < 0) {
      throw new Error('Cash balance must be non-negative');
    }
  }

  /**
   * 総資産額を計算（評価額合計 + 現金残高）
   */
  getTotalAssets(): number {
    return this.totalEvaluationAmount + this.cashBalance;
  }

  /**
   * 接続状態を更新する
   */
  updateConnectionStatus(isConnected: boolean): SecuritiesAccountEntity {
    return new SecuritiesAccountEntity(
      this.id,
      this.securitiesCompanyName,
      this.accountNumber,
      this.accountType,
      this.credentials,
      isConnected,
      this.lastSyncedAt,
      this.totalEvaluationAmount,
      this.cashBalance,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 最終同期日時を更新する
   */
  updateLastSyncedAt(date: Date): SecuritiesAccountEntity {
    return new SecuritiesAccountEntity(
      this.id,
      this.securitiesCompanyName,
      this.accountNumber,
      this.accountType,
      this.credentials,
      this.isConnected,
      date,
      this.totalEvaluationAmount,
      this.cashBalance,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 認証情報を更新する
   */
  updateCredentials(
    credentials: EncryptedCredentials,
  ): SecuritiesAccountEntity {
    return new SecuritiesAccountEntity(
      this.id,
      this.securitiesCompanyName,
      this.accountNumber,
      this.accountType,
      credentials,
      this.isConnected,
      this.lastSyncedAt,
      this.totalEvaluationAmount,
      this.cashBalance,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 評価額と現金残高を更新する
   */
  updateBalances(
    totalEvaluationAmount: number,
    cashBalance: number,
  ): SecuritiesAccountEntity {
    if (totalEvaluationAmount < 0) {
      throw new Error('Total evaluation amount must be non-negative');
    }

    if (cashBalance < 0) {
      throw new Error('Cash balance must be non-negative');
    }

    return new SecuritiesAccountEntity(
      this.id,
      this.securitiesCompanyName,
      this.accountNumber,
      this.accountType,
      this.credentials,
      this.isConnected,
      this.lastSyncedAt,
      totalEvaluationAmount,
      cashBalance,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * プレーンオブジェクトに変換
   * @param portfolioStats ポートフォリオ統計情報（オプショナル）
   */
  toJSON(portfolioStats?: {
    totalProfitLoss: number;
    totalProfitLossRate: number;
  }): SecuritiesAccountJSONResponse {
    return {
      id: this.id,
      securitiesCompanyName: this.securitiesCompanyName,
      accountNumber: this.accountNumber,
      accountType: this.accountType,
      credentials: this.credentials.toJSON(),
      isConnected: this.isConnected,
      lastSyncedAt: this.lastSyncedAt,
      totalEvaluationAmount: this.totalEvaluationAmount,
      cashBalance: this.cashBalance,
      totalProfitLoss: portfolioStats?.totalProfitLoss ?? 0, // Portfolioから計算された値、または0
      totalProfitLossRate: portfolioStats?.totalProfitLossRate ?? 0, // Portfolioから計算された値、または0
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
