import { TextNormalizer } from '../utils/text-normalizer.util';
import { ClassificationConfidence } from '../value-objects/classification-confidence.vo';

/**
 * 店舗マスタ Domain Entity
 * 自動分類で使用する店舗情報を表すドメインエンティティ
 */
export class Merchant {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly aliases: string[],
    public readonly defaultSubcategoryId: string,
    public readonly confidence: ClassificationConfidence,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * 取引説明が店舗に一致するかチェック
   * 店舗名または別名のいずれかに一致すればtrue
   *
   * @param description 取引説明
   * @returns true: 一致する
   */
  public matchesDescription(description: string): boolean {
    // 店舗名との一致チェック
    if (TextNormalizer.includes(description, this.name)) {
      return true;
    }

    // 別名との一致チェック
    return this.aliases.some((alias) =>
      TextNormalizer.includes(description, alias),
    );
  }

  /**
   * デフォルトサブカテゴリIDを取得
   */
  public getDefaultSubcategoryId(): string {
    return this.defaultSubcategoryId;
  }

  /**
   * 信頼度を取得
   */
  public getConfidence(): ClassificationConfidence {
    return this.confidence;
  }

  /**
   * JSONレスポンス形式に変換
   */
  public toJSON(): MerchantJSONResponse {
    return {
      id: this.id,
      name: this.name,
      aliases: this.aliases,
      defaultSubcategoryId: this.defaultSubcategoryId,
      confidence: this.confidence.getValue(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

/**
 * 店舗マスタ JSON レスポンス型
 */
export interface MerchantJSONResponse {
  id: string;
  name: string;
  aliases: string[];
  defaultSubcategoryId: string;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}
