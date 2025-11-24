import { CategoryType } from '@account-book/types';
import { SubcategoryClassifierService } from './subcategory-classifier.service';
import { MerchantMatcherService } from './merchant-matcher.service';
import { KeywordMatcherService } from './keyword-matcher.service';
import type { ISubcategoryRepository } from '../repositories/subcategory.repository.interface';
import { Subcategory } from '../entities/subcategory.entity';
import { Merchant } from '../entities/merchant.entity';
import { ClassificationConfidence } from '../value-objects/classification-confidence.vo';
import { ClassificationReason } from '../enums/classification-reason.enum';

describe('SubcategoryClassifierService', () => {
  let service: SubcategoryClassifierService;
  let mockSubcategoryRepo: jest.Mocked<ISubcategoryRepository>;
  let mockMerchantMatcher: jest.Mocked<MerchantMatcherService>;
  let mockKeywordMatcher: jest.Mocked<KeywordMatcherService>;

  const baseDate = new Date('2025-11-24T10:00:00Z');
  let testSubcategories: Subcategory[];

  beforeEach(() => {
    // テスト用サブカテゴリ
    testSubcategories = [
      new Subcategory(
        'food_cafe',
        CategoryType.EXPENSE,
        'カフェ・喫茶店',
        null,
        1,
        '☕',
        '#FF6B6B',
        false,
        true,
        baseDate,
        baseDate,
      ),
      new Subcategory(
        'other_expense',
        CategoryType.EXPENSE,
        'その他支出',
        null,
        99,
        '📦',
        '#CCCCCC',
        true,
        true,
        baseDate,
        baseDate,
      ),
    ];

    // モック作成
    mockSubcategoryRepo = {
      findByCategory: jest.fn(),
      findDefault: jest.fn(),
    } as any; // Jest型定義の制約によりany使用

    mockMerchantMatcher = {
      match: jest.fn(),
    } as any;

    mockKeywordMatcher = {
      match: jest.fn(),
    } as any;

    service = new SubcategoryClassifierService(
      mockSubcategoryRepo,
      mockMerchantMatcher,
      mockKeywordMatcher,
    );
  });

  describe('classify - 店舗マスタ照合', () => {
    it('店舗マスタにヒットした場合、高信頼度で分類する', async () => {
      const merchant = new Merchant(
        'merchant-1',
        'スターバックス',
        [],
        'food_cafe',
        new ClassificationConfidence(0.95),
        baseDate,
        baseDate,
      );

      mockMerchantMatcher.match.mockResolvedValue(merchant);

      const result = await service.classify(
        'スターバックスコーヒー',
        500,
        CategoryType.EXPENSE,
      );

      expect(result.getSubcategoryId()).toBe('food_cafe');
      expect(result.getConfidence().getValue()).toBe(0.95);
      expect(result.getReason()).toBe(ClassificationReason.MERCHANT_MATCH);
      expect(result.getMerchantId()).toBe('merchant-1');
      expect(mockMerchantMatcher.match).toHaveBeenCalledWith(
        'スターバックスコーヒー',
      );
      expect(mockSubcategoryRepo.findByCategory).not.toHaveBeenCalled();
    });
  });

  describe('classify - キーワードマッチング', () => {
    it('キーワードにマッチした場合、中信頼度で分類する', async () => {
      mockMerchantMatcher.match.mockResolvedValue(null);
      mockSubcategoryRepo.findByCategory.mockResolvedValue(testSubcategories);
      mockKeywordMatcher.match.mockReturnValue({
        subcategory: testSubcategories[0],
        score: 0.8,
      });

      const result = await service.classify(
        'カフェでコーヒー',
        500,
        CategoryType.EXPENSE,
      );

      expect(result.getSubcategoryId()).toBe('food_cafe');
      expect(result.getConfidence().getValue()).toBe(0.8);
      expect(result.getReason()).toBe(ClassificationReason.KEYWORD_MATCH);
      expect(result.getMerchantId()).toBeUndefined();
      expect(mockKeywordMatcher.match).toHaveBeenCalledWith(
        'カフェでコーヒー',
        CategoryType.EXPENSE,
        testSubcategories,
      );
    });

    it('キーワードマッチのスコアが低い場合、最低信頼度（0.7）を保証する', async () => {
      mockMerchantMatcher.match.mockResolvedValue(null);
      mockSubcategoryRepo.findByCategory.mockResolvedValue(testSubcategories);
      mockKeywordMatcher.match.mockReturnValue({
        subcategory: testSubcategories[0],
        score: 0.6, // 低いスコア
      });

      const result = await service.classify(
        '曖昧なキーワード',
        500,
        CategoryType.EXPENSE,
      );

      expect(result.getConfidence().getValue()).toBe(0.7); // 最低保証
    });
  });

  describe('classify - デフォルト分類', () => {
    it('店舗・キーワードどちらもマッチしない場合、デフォルト分類する', async () => {
      mockMerchantMatcher.match.mockResolvedValue(null);
      mockSubcategoryRepo.findByCategory.mockResolvedValue(testSubcategories);
      mockKeywordMatcher.match.mockReturnValue(null);
      mockSubcategoryRepo.findDefault.mockResolvedValue(testSubcategories[1]);

      const result = await service.classify(
        '不明な取引',
        1000,
        CategoryType.EXPENSE,
      );

      expect(result.getSubcategoryId()).toBe('other_expense');
      expect(result.getConfidence().getValue()).toBe(0.5);
      expect(result.getReason()).toBe(ClassificationReason.DEFAULT);
      expect(mockSubcategoryRepo.findDefault).toHaveBeenCalledWith(
        CategoryType.EXPENSE,
      );
    });

    it('デフォルトサブカテゴリが見つからない場合、エラーを投げる', async () => {
      mockMerchantMatcher.match.mockResolvedValue(null);
      mockSubcategoryRepo.findByCategory.mockResolvedValue(testSubcategories);
      mockKeywordMatcher.match.mockReturnValue(null);
      mockSubcategoryRepo.findDefault.mockResolvedValue(null);

      await expect(
        service.classify('不明な取引', 1000, CategoryType.EXPENSE),
      ).rejects.toThrow('Default subcategory not found for category: EXPENSE');
    });
  });

  describe('classify - 定数値の確認', () => {
    it('MINIMUM_KEYWORD_MATCH_CONFIDENCEが0.7である', async () => {
      mockMerchantMatcher.match.mockResolvedValue(null);
      mockSubcategoryRepo.findByCategory.mockResolvedValue(testSubcategories);
      mockKeywordMatcher.match.mockReturnValue({
        subcategory: testSubcategories[0],
        score: 0.5,
      });

      const result = await service.classify(
        'テスト',
        500,
        CategoryType.EXPENSE,
      );

      expect(result.getConfidence().getValue()).toBe(0.7);
    });

    it('DEFAULT_CLASSIFICATION_CONFIDENCEが0.5である', async () => {
      mockMerchantMatcher.match.mockResolvedValue(null);
      mockSubcategoryRepo.findByCategory.mockResolvedValue(testSubcategories);
      mockKeywordMatcher.match.mockReturnValue(null);
      mockSubcategoryRepo.findDefault.mockResolvedValue(testSubcategories[1]);

      const result = await service.classify(
        'テスト',
        1000,
        CategoryType.EXPENSE,
      );

      expect(result.getConfidence().getValue()).toBe(0.5);
    });
  });
});
