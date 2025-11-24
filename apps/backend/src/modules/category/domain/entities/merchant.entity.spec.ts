import { ClassificationConfidence } from '../value-objects/classification-confidence.vo';
import { Merchant } from './merchant.entity';

describe('Merchant', () => {
  const baseDate = new Date('2025-11-24T10:00:00Z');
  const highConfidence = new ClassificationConfidence(0.95);

  describe('constructor', () => {
    it('すべてのプロパティで作成できる', () => {
      const merchant = new Merchant(
        'merchant-1',
        'スターバックス',
        ['STARBUCKS', 'Starbucks Coffee'],
        'food_cafe',
        highConfidence,
        baseDate,
        baseDate,
      );

      expect(merchant.id).toBe('merchant-1');
      expect(merchant.name).toBe('スターバックス');
      expect(merchant.aliases).toEqual(['STARBUCKS', 'Starbucks Coffee']);
      expect(merchant.defaultSubcategoryId).toBe('food_cafe');
      expect(merchant.confidence).toBe(highConfidence);
      expect(merchant.createdAt).toEqual(baseDate);
      expect(merchant.updatedAt).toEqual(baseDate);
    });

    it('別名なしで作成できる', () => {
      const merchant = new Merchant(
        'merchant-2',
        'ローカルカフェ',
        [],
        'food_cafe',
        highConfidence,
        baseDate,
        baseDate,
      );

      expect(merchant.aliases).toEqual([]);
    });
  });

  describe('matchesDescription', () => {
    const merchant = new Merchant(
      'merchant-1',
      'スターバックス',
      ['STARBUCKS', 'Starbucks Coffee', 'スタバ'],
      'food_cafe',
      highConfidence,
      baseDate,
      baseDate,
    );

    it('店舗名と完全一致する場合trueを返す', () => {
      expect(merchant.matchesDescription('スターバックス')).toBe(true);
    });

    it('店舗名を含む場合trueを返す', () => {
      expect(merchant.matchesDescription('スターバックス渋谷店')).toBe(true);
    });

    it('別名と一致する場合trueを返す', () => {
      expect(merchant.matchesDescription('STARBUCKS')).toBe(true);
      expect(merchant.matchesDescription('Starbucks Coffee')).toBe(true);
      expect(merchant.matchesDescription('スタバ')).toBe(true);
    });

    it('別名を含む場合trueを返す', () => {
      expect(merchant.matchesDescription('STARBUCKS TOKYO')).toBe(true);
    });

    it('大文字小文字を区別しない', () => {
      expect(merchant.matchesDescription('starbucks')).toBe(true);
      expect(merchant.matchesDescription('STARBUCKS')).toBe(true);
    });

    it('空白を含む場合でも一致する', () => {
      expect(merchant.matchesDescription('スターバックス 渋谷店')).toBe(true);
    });

    it('一致しない場合falseを返す', () => {
      expect(merchant.matchesDescription('タリーズ')).toBe(false);
      expect(merchant.matchesDescription('ドトール')).toBe(false);
    });

    it('空文字列の場合falseを返す', () => {
      expect(merchant.matchesDescription('')).toBe(false);
    });
  });

  describe('getDefaultSubcategoryId', () => {
    it('デフォルトサブカテゴリIDを取得できる', () => {
      const merchant = new Merchant(
        'merchant-1',
        'スターバックス',
        [],
        'food_cafe',
        highConfidence,
        baseDate,
        baseDate,
      );

      expect(merchant.getDefaultSubcategoryId()).toBe('food_cafe');
    });
  });

  describe('getConfidence', () => {
    it('信頼度を取得できる', () => {
      const merchant = new Merchant(
        'merchant-1',
        'スターバックス',
        [],
        'food_cafe',
        highConfidence,
        baseDate,
        baseDate,
      );

      expect(merchant.getConfidence()).toBe(highConfidence);
      expect(merchant.getConfidence().getValue()).toBe(0.95);
    });
  });

  describe('toJSON', () => {
    it('JSON形式に変換できる', () => {
      const merchant = new Merchant(
        'merchant-1',
        'スターバックス',
        ['STARBUCKS', 'スタバ'],
        'food_cafe',
        highConfidence,
        baseDate,
        baseDate,
      );

      const json = merchant.toJSON();

      expect(json).toEqual({
        id: 'merchant-1',
        name: 'スターバックス',
        aliases: ['STARBUCKS', 'スタバ'],
        defaultSubcategoryId: 'food_cafe',
        confidence: 0.95,
        createdAt: '2025-11-24T10:00:00.000Z',
        updatedAt: '2025-11-24T10:00:00.000Z',
      });
    });

    it('別名なしのJSON形式に変換できる', () => {
      const merchant = new Merchant(
        'merchant-2',
        'ローカルカフェ',
        [],
        'food_cafe',
        highConfidence,
        baseDate,
        baseDate,
      );

      const json = merchant.toJSON();

      expect(json.aliases).toEqual([]);
    });

    it('ClassificationConfidenceが数値に変換される', () => {
      const lowConfidence = new ClassificationConfidence(0.5);
      const merchant = new Merchant(
        'merchant-3',
        'テストショップ',
        [],
        'other',
        lowConfidence,
        baseDate,
        baseDate,
      );

      const json = merchant.toJSON();

      expect(json.confidence).toBe(0.5);
      expect(typeof json.confidence).toBe('number');
    });
  });
});
