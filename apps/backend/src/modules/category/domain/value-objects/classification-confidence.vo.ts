/**
 * 分類信頼度 Value Object
 * サブカテゴリ自動分類の信頼度を表現する値オブジェクト
 *
 * 信頼度の範囲:
 * - 高信頼度: 0.90 - 1.00 (90%以上)
 * - 中信頼度: 0.70 - 0.89 (70-89%)
 * - 低信頼度: 0.00 - 0.69 (70%未満)
 */
export class ClassificationConfidence {
  private readonly value: number;

  constructor(value: number) {
    this.validate(value);
    this.value = value;
  }

  /**
   * バリデーション
   * 信頼度は0.00から1.00の範囲内である必要がある
   */
  private validate(value: number): void {
    if (value < 0 || value > 1) {
      throw new Error(
        `Classification confidence must be between 0.00 and 1.00, got ${value}`,
      );
    }
  }

  /**
   * 信頼度の値を取得
   * @returns 0.00 から 1.00 の数値
   */
  public getValue(): number {
    return this.value;
  }

  /**
   * 高信頼度かどうか (90%以上)
   * @returns true: 高信頼度
   */
  public isHigh(): boolean {
    return this.value >= 0.9;
  }

  /**
   * 中信頼度かどうか (70-89%)
   * @returns true: 中信頼度
   */
  public isMedium(): boolean {
    return this.value >= 0.7 && this.value < 0.9;
  }

  /**
   * 低信頼度かどうか (70%未満)
   * @returns true: 低信頼度
   */
  public isLow(): boolean {
    return this.value < 0.7;
  }

  /**
   * 自動確定すべきかどうか
   * 高信頼度（90%以上）の場合は自動確定を推奨
   * @returns true: 自動確定推奨
   */
  public shouldAutoConfirm(): boolean {
    return this.isHigh();
  }

  /**
   * レビューを推奨すべきかどうか
   * 低信頼度（70%未満）の場合はユーザーレビューを推奨
   * @returns true: レビュー推奨
   */
  public shouldRecommendReview(): boolean {
    return this.isLow();
  }

  /**
   * 文字列表現
   * @returns "XX%" 形式の文字列
   */
  public toString(): string {
    return `${Math.round(this.value * 100)}%`;
  }

  /**
   * 等価性チェック
   * @param other 比較対象
   * @returns true: 等しい
   */
  public equals(other: ClassificationConfidence): boolean {
    return this.value === other.value;
  }
}
