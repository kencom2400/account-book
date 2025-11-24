import { ClassificationConfidence } from './classification-confidence.vo';
import { ClassificationReason } from '../enums/classification-reason.enum';

/**
 * サブカテゴリ分類結果 Value Object
 * 自動分類の結果（サブカテゴリID、信頼度、理由）を保持する値オブジェクト
 */
export class SubcategoryClassification {
  constructor(
    private readonly subcategoryId: string,
    private readonly confidence: ClassificationConfidence,
    private readonly reason: ClassificationReason,
    private readonly merchantId?: string | null,
  ) {}

  /**
   * サブカテゴリIDを取得
   */
  public getSubcategoryId(): string {
    return this.subcategoryId;
  }

  /**
   * 信頼度を取得
   */
  public getConfidence(): ClassificationConfidence {
    return this.confidence;
  }

  /**
   * 分類理由を取得
   */
  public getReason(): ClassificationReason {
    return this.reason;
  }

  /**
   * 店舗IDを取得（店舗マスタにヒットした場合のみ）
   */
  public getMerchantId(): string | null | undefined {
    return this.merchantId;
  }

  /**
   * 信頼できる分類かどうか
   * 高信頼度（90%以上）または中信頼度（70%以上）の場合はtrue
   */
  public isReliable(): boolean {
    return this.confidence.isHigh() || this.confidence.isMedium();
  }
}
