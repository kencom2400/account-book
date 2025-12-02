import { ReconciliationResult } from './reconciliation-result.vo';

/**
 * 照合サマリー Value Object
 *
 * 照合結果のサマリー情報を保持する値オブジェクト
 * 不変（immutable）として扱う
 */
export class ReconciliationSummary {
  constructor(
    public readonly total: number, // 照合件数合計
    public readonly matched: number, // 一致件数
    public readonly unmatched: number, // 不一致件数
    public readonly partial: number, // 部分一致件数
  ) {
    if (total < 0) {
      throw new Error('Total must be non-negative');
    }
    if (matched < 0) {
      throw new Error('Matched must be non-negative');
    }
    if (unmatched < 0) {
      throw new Error('Unmatched must be non-negative');
    }
    if (partial < 0) {
      throw new Error('Partial must be non-negative');
    }
    if (!Number.isInteger(total)) {
      throw new Error('Total must be an integer');
    }
    if (!Number.isInteger(matched)) {
      throw new Error('Matched must be an integer');
    }
    if (!Number.isInteger(unmatched)) {
      throw new Error('Unmatched must be an integer');
    }
    if (!Number.isInteger(partial)) {
      throw new Error('Partial must be an integer');
    }
    if (matched + unmatched + partial !== total) {
      throw new Error(
        'Sum of matched, unmatched, and partial must equal total',
      );
    }
  }

  /**
   * 照合結果からサマリーを計算
   * Value Objectの不変性を保つため、新しいインスタンスを返す
   */
  static calculateSummary(
    results: ReconciliationResult[],
  ): ReconciliationSummary {
    const total = results.length;
    let matched = 0;
    let unmatched = 0;
    let partial = 0;

    for (const result of results) {
      if (result.isMatched && result.confidence === 100) {
        matched++;
      } else if (result.confidence === 0) {
        unmatched++;
      } else if (result.confidence === 70) {
        partial++;
      }
    }

    return new ReconciliationSummary(total, matched, unmatched, partial);
  }

  /**
   * プレーンオブジェクトに変換
   */
  toPlain(): {
    total: number;
    matched: number;
    unmatched: number;
    partial: number;
  } {
    return {
      total: this.total,
      matched: this.matched,
      unmatched: this.unmatched,
      partial: this.partial,
    };
  }

  /**
   * プレーンオブジェクトから生成
   */
  static fromPlain(plain: {
    total: number;
    matched: number;
    unmatched: number;
    partial: number;
  }): ReconciliationSummary {
    return new ReconciliationSummary(
      plain.total,
      plain.matched,
      plain.unmatched,
      plain.partial,
    );
  }
}
