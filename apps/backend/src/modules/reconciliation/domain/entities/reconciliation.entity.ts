import { ReconciliationStatus } from '../enums/reconciliation-status.enum';
import { ReconciliationResult } from '../value-objects/reconciliation-result.vo';
import { ReconciliationSummary } from '../value-objects/reconciliation-summary.vo';

/**
 * 照合エンティティ
 *
 * 照合結果を保持し、照合ステータスを管理する
 */
export class Reconciliation {
  private _status: ReconciliationStatus;

  constructor(
    public readonly id: string,
    public readonly cardId: string,
    public readonly billingMonth: string, // YYYY-MM
    status: ReconciliationStatus,
    public readonly executedAt: Date,
    public readonly results: ReconciliationResult[],
    public readonly summary: ReconciliationSummary,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    this._status = status;
    this.validate();
  }

  /**
   * バリデーション
   */
  private validate(): void {
    if (!this.id) {
      throw new Error('ID is required');
    }
    if (!this.cardId) {
      throw new Error('Card ID is required');
    }
    if (!this.billingMonth) {
      throw new Error('Billing month is required');
    }
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(this.billingMonth)) {
      throw new Error('Billing month must be in YYYY-MM format');
    }
    if (!this.executedAt) {
      throw new Error('Executed at is required');
    }
    if (!Array.isArray(this.results)) {
      throw new Error('Results must be an array');
    }
    if (!this.summary) {
      throw new Error('Summary is required');
    }
    if (!this.createdAt) {
      throw new Error('Created at is required');
    }
    if (!this.updatedAt) {
      throw new Error('Updated at is required');
    }
  }

  /**
   * ステータスを取得
   */
  get status(): ReconciliationStatus {
    return this._status;
  }

  /**
   * ステータスを「MATCHED」に更新
   */
  markAsMatched(): void {
    this._status = ReconciliationStatus.MATCHED;
  }

  /**
   * ステータスを「UNMATCHED」に更新
   */
  markAsUnmatched(): void {
    this._status = ReconciliationStatus.UNMATCHED;
  }

  /**
   * ステータスを「PARTIAL」に更新
   */
  markAsPartial(): void {
    this._status = ReconciliationStatus.PARTIAL;
  }

  /**
   * プレーンオブジェクトに変換
   */
  toPlain(): {
    id: string;
    cardId: string;
    billingMonth: string;
    status: ReconciliationStatus;
    executedAt: Date;
    results: Array<{
      isMatched: boolean;
      confidence: number;
      bankTransactionId: string | null;
      cardSummaryId: string;
      matchedAt: Date | null;
      discrepancy: {
        amountDifference: number;
        dateDifference: number;
        descriptionMatch: boolean;
        reason: string;
      } | null;
    }>;
    summary: {
      total: number;
      matched: number;
      unmatched: number;
      partial: number;
    };
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      cardId: this.cardId,
      billingMonth: this.billingMonth,
      status: this._status,
      executedAt: this.executedAt,
      results: this.results.map((r) => r.toPlain()),
      summary: this.summary.toPlain(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * プレーンオブジェクトから生成
   */
  static fromPlain(plain: {
    id: string;
    cardId: string;
    billingMonth: string;
    status: ReconciliationStatus;
    executedAt: Date;
    results: Array<{
      isMatched: boolean;
      confidence: number;
      bankTransactionId: string | null;
      cardSummaryId: string;
      matchedAt: Date | null;
      discrepancy: {
        amountDifference: number;
        dateDifference: number;
        descriptionMatch: boolean;
        reason: string;
      } | null;
    }>;
    summary: {
      total: number;
      matched: number;
      unmatched: number;
      partial: number;
    };
    createdAt: Date;
    updatedAt: Date;
  }): Reconciliation {
    return new Reconciliation(
      plain.id,
      plain.cardId,
      plain.billingMonth,
      plain.status,
      plain.executedAt,
      plain.results.map((r) => ReconciliationResult.fromPlain(r)),
      ReconciliationSummary.fromPlain(plain.summary),
      plain.createdAt,
      plain.updatedAt,
    );
  }
}
