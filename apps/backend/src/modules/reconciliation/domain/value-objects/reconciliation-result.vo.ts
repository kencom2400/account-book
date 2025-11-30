import { Discrepancy } from './discrepancy.vo';

/**
 * 照合結果 Value Object
 *
 * 個別の照合結果を保持する値オブジェクト
 * 不変（immutable）として扱う
 */
export class ReconciliationResult {
  constructor(
    public readonly isMatched: boolean, // 一致フラグ
    public readonly confidence: number, // 信頼度スコア（0-100）
    public readonly bankTransactionId: string | null, // 銀行取引ID（一致時）
    public readonly cardSummaryId: string, // カード月別集計ID
    public readonly matchedAt: Date | null, // 一致日時（一致時）
    public readonly discrepancy: Discrepancy | null, // 不一致詳細（不一致時）
  ) {
    if (!cardSummaryId) {
      throw new Error('Card summary ID is required');
    }
    if (confidence < 0 || confidence > 100) {
      throw new Error('Confidence must be between 0 and 100');
    }
    if (!Number.isInteger(confidence)) {
      throw new Error('Confidence must be an integer');
    }
    if (isMatched && !bankTransactionId) {
      throw new Error('Bank transaction ID is required when matched');
    }
    if (isMatched && !matchedAt) {
      throw new Error('Matched at is required when matched');
    }
    if (!isMatched && discrepancy === null) {
      throw new Error('Discrepancy is required when not matched');
    }
  }

  /**
   * 信頼度スコアを算出
   * このメソッドはValue Objectの不変性を保つため、新しいインスタンスを返す
   */
  static calculateConfidence(
    amountMatch: boolean,
    dateMatch: boolean,
    descriptionMatch: boolean,
  ): number {
    if (amountMatch && dateMatch && descriptionMatch) {
      return 100; // 完全一致
    }
    if (amountMatch && dateMatch) {
      return 70; // 部分一致（金額・日付のみ一致）
    }
    return 0; // 不一致
  }

  /**
   * プレーンオブジェクトに変換
   */
  toPlain(): {
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
  } {
    return {
      isMatched: this.isMatched,
      confidence: this.confidence,
      bankTransactionId: this.bankTransactionId,
      cardSummaryId: this.cardSummaryId,
      matchedAt: this.matchedAt,
      discrepancy: this.discrepancy?.toPlain() ?? null,
    };
  }

  /**
   * プレーンオブジェクトから生成
   */
  static fromPlain(plain: {
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
  }): ReconciliationResult {
    return new ReconciliationResult(
      plain.isMatched,
      plain.confidence,
      plain.bankTransactionId,
      plain.cardSummaryId,
      plain.matchedAt,
      plain.discrepancy ? Discrepancy.fromPlain(plain.discrepancy) : null,
    );
  }
}
