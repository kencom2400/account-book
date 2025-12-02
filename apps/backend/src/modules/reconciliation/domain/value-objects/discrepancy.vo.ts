/**
 * 不一致詳細 Value Object
 *
 * 照合結果の不一致情報を保持する値オブジェクト
 * 不変（immutable）として扱う
 */
export class Discrepancy {
  constructor(
    public readonly amountDifference: number, // 金額差（円）
    public readonly dateDifference: number, // 日数差（営業日）
    public readonly descriptionMatch: boolean, // 摘要一致フラグ
    public readonly reason: string, // 不一致理由
  ) {
    if (!Number.isInteger(amountDifference)) {
      throw new Error('Amount difference must be an integer (yen unit)');
    }
    if (!Number.isInteger(dateDifference)) {
      throw new Error('Date difference must be an integer (business days)');
    }
    if (!reason || reason.trim().length === 0) {
      throw new Error('Reason is required');
    }
  }

  /**
   * プレーンオブジェクトに変換
   */
  toPlain(): {
    amountDifference: number;
    dateDifference: number;
    descriptionMatch: boolean;
    reason: string;
  } {
    return {
      amountDifference: this.amountDifference,
      dateDifference: this.dateDifference,
      descriptionMatch: this.descriptionMatch,
      reason: this.reason,
    };
  }

  /**
   * プレーンオブジェクトから生成
   */
  static fromPlain(plain: {
    amountDifference: number;
    dateDifference: number;
    descriptionMatch: boolean;
    reason: string;
  }): Discrepancy {
    return new Discrepancy(
      plain.amountDifference,
      plain.dateDifference,
      plain.descriptionMatch,
      plain.reason,
    );
  }
}
