export interface HoldingJSONResponse {
  id: string;
  securitiesAccountId: string;
  securityCode: string;
  securityName: string;
  quantity: number;
  averageAcquisitionPrice: number;
  currentPrice: number;
  evaluationAmount: number;
  profitLoss: number;
  profitLossRate: number;
  securityType: 'stock' | 'bond' | 'fund' | 'etf' | 'reit';
  market: string;
  updatedAt: Date;
}

/**
 * Holdingエンティティ
 * 保有銘柄情報を表すドメインエンティティ
 */
export class HoldingEntity {
  constructor(
    public readonly id: string,
    public readonly securitiesAccountId: string,
    public readonly securityCode: string, // 銘柄コード
    public readonly securityName: string, // 銘柄名
    public readonly quantity: number, // 保有数量
    public readonly averageAcquisitionPrice: number, // 平均取得単価
    public readonly currentPrice: number, // 現在値
    public readonly securityType: 'stock' | 'bond' | 'fund' | 'etf' | 'reit', // 銘柄種別
    public readonly market: string, // 市場（東証、NASDAQ等）
    public readonly updatedAt: Date,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id) {
      throw new Error('Holding ID is required');
    }

    if (!this.securitiesAccountId) {
      throw new Error('Securities account ID is required');
    }

    if (!this.securityCode) {
      throw new Error('Security code is required');
    }

    if (!this.securityName) {
      throw new Error('Security name is required');
    }

    if (this.quantity < 0) {
      throw new Error('Quantity must be non-negative');
    }

    if (this.averageAcquisitionPrice < 0) {
      throw new Error('Average acquisition price must be non-negative');
    }

    if (this.currentPrice < 0) {
      throw new Error('Current price must be non-negative');
    }

    const validSecurityTypes = ['stock', 'bond', 'fund', 'etf', 'reit'];
    if (!validSecurityTypes.includes(this.securityType)) {
      throw new Error(`Invalid security type: ${this.securityType}`);
    }

    if (!this.market) {
      throw new Error('Market is required');
    }
  }

  /**
   * 評価額を計算
   */
  getEvaluationAmount(): number {
    return this.quantity * this.currentPrice;
  }

  /**
   * 評価損益を計算
   */
  getProfitLoss(): number {
    return (
      this.getEvaluationAmount() - this.quantity * this.averageAcquisitionPrice
    );
  }

  /**
   * 評価損益率を計算（パーセンテージ）
   */
  getProfitLossRate(): number {
    const acquisitionAmount = this.quantity * this.averageAcquisitionPrice;
    if (acquisitionAmount === 0) return 0;
    return (this.getProfitLoss() / acquisitionAmount) * 100;
  }

  /**
   * 現在価格を更新する
   */
  updateCurrentPrice(newPrice: number): HoldingEntity {
    if (newPrice < 0) {
      throw new Error('Price must be non-negative');
    }

    return new HoldingEntity(
      this.id,
      this.securitiesAccountId,
      this.securityCode,
      this.securityName,
      this.quantity,
      this.averageAcquisitionPrice,
      newPrice,
      this.securityType,
      this.market,
      new Date(),
    );
  }

  /**
   * 保有数量と平均取得単価を更新する（追加購入・一部売却時）
   */
  updateQuantityAndPrice(
    newQuantity: number,
    newAveragePrice: number,
  ): HoldingEntity {
    if (newQuantity < 0) {
      throw new Error('Quantity must be non-negative');
    }

    if (newAveragePrice < 0) {
      throw new Error('Average price must be non-negative');
    }

    return new HoldingEntity(
      this.id,
      this.securitiesAccountId,
      this.securityCode,
      this.securityName,
      newQuantity,
      newAveragePrice,
      this.currentPrice,
      this.securityType,
      this.market,
      new Date(),
    );
  }

  /**
   * プレーンオブジェクトに変換
   */
  toJSON(): HoldingJSONResponse {
    return {
      id: this.id,
      securitiesAccountId: this.securitiesAccountId,
      securityCode: this.securityCode,
      securityName: this.securityName,
      quantity: this.quantity,
      averageAcquisitionPrice: this.averageAcquisitionPrice,
      currentPrice: this.currentPrice,
      evaluationAmount: this.getEvaluationAmount(),
      profitLoss: this.getProfitLoss(),
      profitLossRate: this.getProfitLossRate(),
      securityType: this.securityType,
      market: this.market,
      updatedAt: this.updatedAt,
    };
  }
}
