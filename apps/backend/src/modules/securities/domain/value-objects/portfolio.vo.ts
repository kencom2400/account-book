import { HoldingEntity } from '../entities/holding.entity';

export interface PortfolioJSONResponse {
  holdings: ReturnType<HoldingEntity['toJSON']>[];
  totalEvaluationAmount: number;
  totalAcquisitionAmount: number;
  totalProfitLoss: number;
  totalProfitLossRate: number;
  holdingCount: number;
}

/**
 * Portfolio Value Object
 * 保有銘柄の集合体としてのポートフォリオを表す
 */
export class Portfolio {
  constructor(public readonly holdings: readonly HoldingEntity[]) {
    this.validate();
  }

  private validate(): void {
    if (!Array.isArray(this.holdings)) {
      throw new Error('Holdings must be an array');
    }
  }

  /**
   * 保有銘柄数を取得
   */
  getHoldingCount(): number {
    return this.holdings.length;
  }

  /**
   * ポートフォリオ全体の評価額を計算
   */
  getTotalEvaluationAmount(): number {
    return this.holdings.reduce(
      (total, holding) => total + holding.getEvaluationAmount(),
      0,
    );
  }

  /**
   * ポートフォリオ全体の取得金額を計算
   */
  getTotalAcquisitionAmount(): number {
    return this.holdings.reduce(
      (total, holding) =>
        total + holding.quantity * holding.averageAcquisitionPrice,
      0,
    );
  }

  /**
   * ポートフォリオ全体の評価損益を計算
   */
  getTotalProfitLoss(): number {
    return this.getTotalEvaluationAmount() - this.getTotalAcquisitionAmount();
  }

  /**
   * ポートフォリオ全体の評価損益率を計算（パーセンテージ）
   */
  getTotalProfitLossRate(): number {
    const acquisitionAmount = this.getTotalAcquisitionAmount();
    if (acquisitionAmount === 0) return 0;
    return (this.getTotalProfitLoss() / acquisitionAmount) * 100;
  }

  /**
   * 特定の銘柄コードで保有銘柄を取得
   */
  getHoldingBySecurityCode(securityCode: string): HoldingEntity | undefined {
    return this.holdings.find(
      (holding) => holding.securityCode === securityCode,
    );
  }

  /**
   * 銘柄タイプ別に保有銘柄をフィルタリング
   */
  getHoldingsByType(
    securityType: 'stock' | 'bond' | 'fund' | 'etf' | 'reit',
  ): HoldingEntity[] {
    return this.holdings.filter(
      (holding) => holding.securityType === securityType,
    );
  }

  /**
   * 評価額の大きい順にソート
   */
  sortByEvaluationAmount(descending = true): HoldingEntity[] {
    const sorted = [...this.holdings].sort((a, b) => {
      const amountA = a.getEvaluationAmount();
      const amountB = b.getEvaluationAmount();
      return descending ? amountB - amountA : amountA - amountB;
    });
    return sorted;
  }

  /**
   * 損益率の高い順にソート
   */
  sortByProfitLossRate(descending = true): HoldingEntity[] {
    const sorted = [...this.holdings].sort((a, b) => {
      const rateA = a.getProfitLossRate();
      const rateB = b.getProfitLossRate();
      return descending ? rateB - rateA : rateA - rateB;
    });
    return sorted;
  }

  /**
   * 保有銘柄を追加
   */
  addHolding(holding: HoldingEntity): Portfolio {
    return new Portfolio([...this.holdings, holding]);
  }

  /**
   * 保有銘柄を更新
   */
  updateHolding(holdingId: string, updatedHolding: HoldingEntity): Portfolio {
    const newHoldings = this.holdings.map((holding) =>
      holding.id === holdingId ? updatedHolding : holding,
    );
    return new Portfolio(newHoldings);
  }

  /**
   * 保有銘柄を削除（全売却時）
   */
  removeHolding(holdingId: string): Portfolio {
    const newHoldings = this.holdings.filter(
      (holding) => holding.id !== holdingId,
    );
    return new Portfolio(newHoldings);
  }

  /**
   * プレーンオブジェクトに変換
   */
  toJSON(): PortfolioJSONResponse {
    return {
      holdings: this.holdings.map((holding) => holding.toJSON()),
      totalEvaluationAmount: this.getTotalEvaluationAmount(),
      totalAcquisitionAmount: this.getTotalAcquisitionAmount(),
      totalProfitLoss: this.getTotalProfitLoss(),
      totalProfitLossRate: this.getTotalProfitLossRate(),
      holdingCount: this.getHoldingCount(),
    };
  }
}
