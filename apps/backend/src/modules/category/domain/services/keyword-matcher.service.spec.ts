import { CategoryType } from '@account-book/types';
import { KeywordMatcherService } from './keyword-matcher.service';
import { Subcategory } from '../entities/subcategory.entity';

describe('KeywordMatcherService', () => {
  let service: KeywordMatcherService;
  let subcategories: Subcategory[];

  beforeEach(() => {
    service = new KeywordMatcherService();

    const baseDate = new Date('2025-11-24T10:00:00Z');
    subcategories = [
      // 食費
      new Subcategory(
        'food_groceries',
        CategoryType.EXPENSE,
        '食料品',
        null,
        1,
        '🛒',
        '#FF6B6B',
        false,
        true,
        baseDate,
        baseDate,
      ),
      new Subcategory(
        'food_dining_out',
        CategoryType.EXPENSE,
        '外食',
        null,
        2,
        '🍽️',
        '#FF8787',
        false,
        true,
        baseDate,
        baseDate,
      ),
      new Subcategory(
        'food_cafe',
        CategoryType.EXPENSE,
        'カフェ・喫茶店',
        null,
        3,
        '☕',
        '#FFA5A5',
        false,
        true,
        baseDate,
        baseDate,
      ),
      // 交通費
      new Subcategory(
        'transport_train_bus',
        CategoryType.EXPENSE,
        '電車・バス',
        null,
        4,
        '🚃',
        '#2196F3',
        false,
        true,
        baseDate,
        baseDate,
      ),
      new Subcategory(
        'transport_taxi',
        CategoryType.EXPENSE,
        'タクシー',
        null,
        5,
        '🚕',
        '#42A5F5',
        false,
        true,
        baseDate,
        baseDate,
      ),
    ];
  });

  describe('match', () => {
    it('カフェのキーワードにマッチする', () => {
      const result = service.match(
        'スターバックスでコーヒーを購入',
        CategoryType.EXPENSE,
        subcategories,
      );

      expect(result).not.toBeNull();
      expect(result?.subcategory.id).toBe('food_cafe');
      expect(result?.score).toBeGreaterThan(0);
    });

    it('電車のキーワードにマッチする', () => {
      const result = service.match(
        'JR東日本 定期券',
        CategoryType.EXPENSE,
        subcategories,
      );

      expect(result).not.toBeNull();
      expect(result?.subcategory.id).toBe('transport_train_bus');
    });

    it('タクシーのキーワードにマッチする', () => {
      const result = service.match(
        'Uber利用',
        CategoryType.EXPENSE,
        subcategories,
      );

      expect(result).not.toBeNull();
      expect(result?.subcategory.id).toBe('transport_taxi');
    });

    it('マッチするキーワードがない場合nullを返す', () => {
      const result = service.match(
        'その他の支出',
        CategoryType.EXPENSE,
        subcategories,
      );

      expect(result).toBeNull();
    });

    it('カテゴリタイプが異なる場合マッチしない', () => {
      const result = service.match(
        'スターバックスでコーヒーを購入',
        CategoryType.INCOME,
        subcategories,
      );

      expect(result).toBeNull();
    });

    it('最もスコアが高いサブカテゴリを返す', () => {
      // "カフェ"と"コーヒー"の両方のキーワードがあるため、food_cafeのスコアが高くなる
      const result = service.match(
        'カフェでコーヒーを購入',
        CategoryType.EXPENSE,
        subcategories,
      );

      expect(result).not.toBeNull();
      expect(result?.subcategory.id).toBe('food_cafe');
    });

    it('カフェとコーヒーのキーワードにマッチする', () => {
      const result = service.match(
        'カフェでコーヒーを購入',
        CategoryType.EXPENSE,
        subcategories,
      );

      expect(result).not.toBeNull();
      expect(result?.subcategory.id).toBe('food_cafe');
    });
  });

  describe('extractKeywords', () => {
    it('スペース区切りでキーワードを抽出する', () => {
      const keywords = service.extractKeywords('スターバックス コーヒー');
      expect(keywords).toEqual(['スターバックス', 'コーヒー']);
    });

    it('複数の空白を正規化して抽出する', () => {
      const keywords = service.extractKeywords('スターバックス    コーヒー');
      expect(keywords).toEqual(['スターバックス', 'コーヒー']);
    });

    it('空文字列を除外する', () => {
      const keywords = service.extractKeywords('  スターバックス  ');
      expect(keywords).toEqual(['スターバックス']);
    });

    it('記号を除去してキーワードを抽出する', () => {
      const keywords = service.extractKeywords('スターバックス!@#コーヒー');
      // 記号が削除され、スペースで区切られる
      expect(keywords.length).toBeGreaterThan(0);
    });

    it('空文字列の場合は空配列を返す', () => {
      const keywords = service.extractKeywords('');
      expect(keywords).toEqual([]);
    });
  });

  describe('calculateMatchScore', () => {
    it('すべてのキーワードがマッチする場合1.0を返す', () => {
      const score = service.calculateMatchScore('カフェ コーヒー 喫茶', [
        'カフェ',
        'コーヒー',
        '喫茶',
      ]);
      expect(score).toBe(1.0);
    });

    it('一部のキーワードがマッチする場合部分スコアを返す', () => {
      const score = service.calculateMatchScore('カフェ', [
        'カフェ',
        'コーヒー',
        '喫茶',
      ]);
      expect(score).toBeCloseTo(1 / 3, 2);
    });

    it('キーワードがマッチしない場合0を返す', () => {
      const score = service.calculateMatchScore('その他', [
        'カフェ',
        'コーヒー',
        '喫茶',
      ]);
      expect(score).toBe(0);
    });

    it('部分一致でもスコアにカウントする', () => {
      const score = service.calculateMatchScore('スターバックスコーヒー', [
        'スターバックス',
        'コーヒー',
      ]);
      expect(score).toBe(1.0);
    });

    it('大文字小文字を区別しない', () => {
      const score = service.calculateMatchScore('カフェ コーヒー', [
        'カフェ',
        'コーヒー',
      ]);
      expect(score).toBe(1.0);
    });
  });
});
