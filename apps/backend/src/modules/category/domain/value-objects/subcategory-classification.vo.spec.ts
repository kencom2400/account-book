import { ClassificationConfidence } from './classification-confidence.vo';
import { SubcategoryClassification } from './subcategory-classification.vo';
import { ClassificationReason } from '../enums/classification-reason.enum';

describe('SubcategoryClassification', () => {
  describe('constructor', () => {
    it('店舗IDなしで作成できる', () => {
      const confidence = new ClassificationConfidence(0.8);
      const classification = new SubcategoryClassification(
        'food_cafe',
        confidence,
        ClassificationReason.KEYWORD_MATCH,
      );

      expect(classification.getSubcategoryId()).toBe('food_cafe');
      expect(classification.getConfidence()).toBe(confidence);
      expect(classification.getReason()).toBe(
        ClassificationReason.KEYWORD_MATCH,
      );
      expect(classification.getMerchantId()).toBeUndefined();
    });

    it('店舗IDありで作成できる', () => {
      const confidence = new ClassificationConfidence(0.95);
      const classification = new SubcategoryClassification(
        'food_cafe',
        confidence,
        ClassificationReason.MERCHANT_MATCH,
        'merchant-1',
      );

      expect(classification.getMerchantId()).toBe('merchant-1');
    });

    it('店舗IDがnullで作成できる', () => {
      const confidence = new ClassificationConfidence(0.5);
      const classification = new SubcategoryClassification(
        'other_expense',
        confidence,
        ClassificationReason.DEFAULT,
        null,
      );

      expect(classification.getMerchantId()).toBeNull();
    });
  });

  describe('getSubcategoryId', () => {
    it('サブカテゴリIDを取得できる', () => {
      const confidence = new ClassificationConfidence(0.8);
      const classification = new SubcategoryClassification(
        'food_cafe',
        confidence,
        ClassificationReason.KEYWORD_MATCH,
      );

      expect(classification.getSubcategoryId()).toBe('food_cafe');
    });
  });

  describe('getConfidence', () => {
    it('信頼度を取得できる', () => {
      const confidence = new ClassificationConfidence(0.8);
      const classification = new SubcategoryClassification(
        'food_cafe',
        confidence,
        ClassificationReason.KEYWORD_MATCH,
      );

      expect(classification.getConfidence()).toBe(confidence);
      expect(classification.getConfidence().getValue()).toBe(0.8);
    });
  });

  describe('getReason', () => {
    it('MERCHANT_MATCHの分類理由を取得できる', () => {
      const confidence = new ClassificationConfidence(0.95);
      const classification = new SubcategoryClassification(
        'food_cafe',
        confidence,
        ClassificationReason.MERCHANT_MATCH,
        'merchant-1',
      );

      expect(classification.getReason()).toBe(
        ClassificationReason.MERCHANT_MATCH,
      );
    });

    it('KEYWORD_MATCHの分類理由を取得できる', () => {
      const confidence = new ClassificationConfidence(0.8);
      const classification = new SubcategoryClassification(
        'food_cafe',
        confidence,
        ClassificationReason.KEYWORD_MATCH,
      );

      expect(classification.getReason()).toBe(
        ClassificationReason.KEYWORD_MATCH,
      );
    });

    it('DEFAULTの分類理由を取得できる', () => {
      const confidence = new ClassificationConfidence(0.5);
      const classification = new SubcategoryClassification(
        'other_expense',
        confidence,
        ClassificationReason.DEFAULT,
      );

      expect(classification.getReason()).toBe(ClassificationReason.DEFAULT);
    });
  });

  describe('getMerchantId', () => {
    it('店舗IDを取得できる', () => {
      const confidence = new ClassificationConfidence(0.95);
      const classification = new SubcategoryClassification(
        'food_cafe',
        confidence,
        ClassificationReason.MERCHANT_MATCH,
        'merchant-1',
      );

      expect(classification.getMerchantId()).toBe('merchant-1');
    });

    it('店舗IDがない場合undefinedを返す', () => {
      const confidence = new ClassificationConfidence(0.8);
      const classification = new SubcategoryClassification(
        'food_cafe',
        confidence,
        ClassificationReason.KEYWORD_MATCH,
      );

      expect(classification.getMerchantId()).toBeUndefined();
    });

    it('店舗IDがnullの場合nullを返す', () => {
      const confidence = new ClassificationConfidence(0.5);
      const classification = new SubcategoryClassification(
        'other_expense',
        confidence,
        ClassificationReason.DEFAULT,
        null,
      );

      expect(classification.getMerchantId()).toBeNull();
    });
  });

  describe('isReliable', () => {
    it('高信頼度（90%以上）の場合trueを返す', () => {
      const confidence = new ClassificationConfidence(0.95);
      const classification = new SubcategoryClassification(
        'food_cafe',
        confidence,
        ClassificationReason.MERCHANT_MATCH,
        'merchant-1',
      );

      expect(classification.isReliable()).toBe(true);
    });

    it('中信頼度（70-89%）の場合trueを返す', () => {
      const confidence = new ClassificationConfidence(0.8);
      const classification = new SubcategoryClassification(
        'food_cafe',
        confidence,
        ClassificationReason.KEYWORD_MATCH,
      );

      expect(classification.isReliable()).toBe(true);
    });

    it('低信頼度（70%未満）の場合falseを返す', () => {
      const confidence = new ClassificationConfidence(0.6);
      const classification = new SubcategoryClassification(
        'other_expense',
        confidence,
        ClassificationReason.AMOUNT_INFERENCE,
      );

      expect(classification.isReliable()).toBe(false);
    });

    it('デフォルト分類（50%）の場合falseを返す', () => {
      const confidence = new ClassificationConfidence(0.5);
      const classification = new SubcategoryClassification(
        'other_expense',
        confidence,
        ClassificationReason.DEFAULT,
      );

      expect(classification.isReliable()).toBe(false);
    });

    it('境界値（70%）の場合trueを返す', () => {
      const confidence = new ClassificationConfidence(0.7);
      const classification = new SubcategoryClassification(
        'food_cafe',
        confidence,
        ClassificationReason.KEYWORD_MATCH,
      );

      expect(classification.isReliable()).toBe(true);
    });

    it('境界値（69%）の場合falseを返す', () => {
      const confidence = new ClassificationConfidence(0.69);
      const classification = new SubcategoryClassification(
        'food_cafe',
        confidence,
        ClassificationReason.KEYWORD_MATCH,
      );

      expect(classification.isReliable()).toBe(false);
    });
  });
});
