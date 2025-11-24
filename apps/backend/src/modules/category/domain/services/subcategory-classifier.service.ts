import { Injectable } from '@nestjs/common';
import { CategoryType } from '@account-book/types';
import { ClassificationConfidence } from '../value-objects/classification-confidence.vo';
import { SubcategoryClassification } from '../value-objects/subcategory-classification.vo';
import { ClassificationReason } from '../enums/classification-reason.enum';
import { ISubcategoryRepository } from '../repositories/subcategory.repository.interface';
import { MerchantMatcherService } from './merchant-matcher.service';
import { KeywordMatcherService } from './keyword-matcher.service';

/**
 * サブカテゴリ分類器 Domain Service
 * 取引データのサブカテゴリ自動分類を統括
 */
@Injectable()
export class SubcategoryClassifierService {
  constructor(
    private readonly subcategoryRepository: ISubcategoryRepository,
    private readonly merchantMatcher: MerchantMatcherService,
    private readonly keywordMatcher: KeywordMatcherService,
  ) {}

  /**
   * 取引をサブカテゴリに分類
   * 以下の順序で分類を試みる：
   * 1. 店舗マスタ照合
   * 2. キーワードマッチング
   * 3. 金額推測（未実装）
   * 4. 定期性判定（未実装）
   * 5. デフォルト（その他）
   *
   * @param description 取引説明
   * @param amount 金額
   * @param mainCategory 主カテゴリ
   * @param transactionDate 取引日時（オプション）
   * @returns 分類結果
   */
  public async classify(
    description: string,
    _amount: number,
    mainCategory: CategoryType,
    _transactionDate?: Date,
  ): Promise<SubcategoryClassification> {
    // 1. 店舗マスタ照合
    const merchant = await this.merchantMatcher.match(description);
    if (merchant) {
      const confidence = new ClassificationConfidence(merchant.getConfidence());
      return new SubcategoryClassification(
        merchant.getDefaultSubcategoryId(),
        confidence,
        ClassificationReason.MERCHANT_MATCH,
        merchant.id,
      );
    }

    // 2. キーワードマッチング
    const subcategories =
      await this.subcategoryRepository.findByCategory(mainCategory);
    const keywordMatch = this.keywordMatcher.match(
      description,
      mainCategory,
      subcategories,
    );
    if (keywordMatch) {
      // キーワードマッチのスコアを信頼度として利用
      // スコアが低い場合は最低限の信頼度（0.7）を保証
      const confidenceValue = Math.max(keywordMatch.score, 0.7);
      const confidence = new ClassificationConfidence(confidenceValue);
      return new SubcategoryClassification(
        keywordMatch.subcategory.id,
        confidence,
        ClassificationReason.KEYWORD_MATCH,
      );
    }

    // 3. 金額推測（未実装）
    // const amountInference = this.inferFromAmount(amount, mainCategory, subcategories);

    // 4. 定期性判定（未実装）
    // if (transactionDate) {
    //   const recurringPattern = this.inferFromRecurring(description, transactionDate);
    // }

    // 5. デフォルト（その他）
    const defaultSubcategory =
      await this.subcategoryRepository.findDefault(mainCategory);

    // デフォルトが見つからない場合はエラー
    if (!defaultSubcategory) {
      throw new Error(
        `Default subcategory not found for category: ${mainCategory}`,
      );
    }

    const defaultConfidence = new ClassificationConfidence(0.5);
    return new SubcategoryClassification(
      defaultSubcategory.id,
      defaultConfidence,
      ClassificationReason.DEFAULT,
    );
  }

  /**
   * 金額から推測（将来実装）
   * 例: 10,000円以上 → 定期券の可能性
   *
   * @param amount 金額
   * @param mainCategory 主カテゴリ
   * @param subcategories サブカテゴリ一覧
   * @returns サブカテゴリ | null
   */
  private inferFromAmount(
    _amount: number,
    _mainCategory: CategoryType,
    _subcategories: unknown[],
  ): null {
    // TODO: 金額レンジによる推測ロジック
    return null;
  }

  /**
   * 定期性から判定（将来実装）
   * 例: 毎月同じ日に同じ金額 → 固定費の可能性
   *
   * @param description 取引説明
   * @param transactionDate 取引日時
   * @returns サブカテゴリ | null
   */
  private inferFromRecurring(
    _description: string,
    _transactionDate: Date,
  ): null {
    // TODO: 定期性判定ロジック
    return null;
  }
}
