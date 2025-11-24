import { ClassificationConfidence } from './classification-confidence.vo';

describe('ClassificationConfidence', () => {
  describe('constructor', () => {
    it('有効な信頼度（0.0）で作成できる', () => {
      const confidence = new ClassificationConfidence(0.0);
      expect(confidence.getValue()).toBe(0.0);
    });

    it('有効な信頼度（0.5）で作成できる', () => {
      const confidence = new ClassificationConfidence(0.5);
      expect(confidence.getValue()).toBe(0.5);
    });

    it('有効な信頼度（1.0）で作成できる', () => {
      const confidence = new ClassificationConfidence(1.0);
      expect(confidence.getValue()).toBe(1.0);
    });

    it('0未満の信頼度でエラーが発生する', () => {
      expect(() => new ClassificationConfidence(-0.1)).toThrow(
        'Classification confidence must be between 0.00 and 1.00, got -0.1',
      );
    });

    it('1を超える信頼度でエラーが発生する', () => {
      expect(() => new ClassificationConfidence(1.1)).toThrow(
        'Classification confidence must be between 0.00 and 1.00, got 1.1',
      );
    });
  });

  describe('getValue', () => {
    it('設定した信頼度を取得できる', () => {
      const confidence = new ClassificationConfidence(0.75);
      expect(confidence.getValue()).toBe(0.75);
    });
  });

  describe('isHigh', () => {
    it('信頼度90%以上の場合trueを返す', () => {
      const confidence = new ClassificationConfidence(0.9);
      expect(confidence.isHigh()).toBe(true);
    });

    it('信頼度90%未満の場合falseを返す', () => {
      const confidence = new ClassificationConfidence(0.89);
      expect(confidence.isHigh()).toBe(false);
    });

    it('信頼度100%の場合trueを返す', () => {
      const confidence = new ClassificationConfidence(1.0);
      expect(confidence.isHigh()).toBe(true);
    });
  });

  describe('isMedium', () => {
    it('信頼度70%の場合trueを返す', () => {
      const confidence = new ClassificationConfidence(0.7);
      expect(confidence.isMedium()).toBe(true);
    });

    it('信頼度80%の場合trueを返す', () => {
      const confidence = new ClassificationConfidence(0.8);
      expect(confidence.isMedium()).toBe(true);
    });

    it('信頼度89%の場合trueを返す', () => {
      const confidence = new ClassificationConfidence(0.89);
      expect(confidence.isMedium()).toBe(true);
    });

    it('信頼度90%の場合falseを返す', () => {
      const confidence = new ClassificationConfidence(0.9);
      expect(confidence.isMedium()).toBe(false);
    });

    it('信頼度69%の場合falseを返す', () => {
      const confidence = new ClassificationConfidence(0.69);
      expect(confidence.isMedium()).toBe(false);
    });
  });

  describe('isLow', () => {
    it('信頼度69%の場合trueを返す', () => {
      const confidence = new ClassificationConfidence(0.69);
      expect(confidence.isLow()).toBe(true);
    });

    it('信頼度0%の場合trueを返す', () => {
      const confidence = new ClassificationConfidence(0.0);
      expect(confidence.isLow()).toBe(true);
    });

    it('信頼度70%の場合falseを返す', () => {
      const confidence = new ClassificationConfidence(0.7);
      expect(confidence.isLow()).toBe(false);
    });
  });

  describe('shouldAutoConfirm', () => {
    it('高信頼度の場合trueを返す', () => {
      const confidence = new ClassificationConfidence(0.95);
      expect(confidence.shouldAutoConfirm()).toBe(true);
    });

    it('中信頼度の場合falseを返す', () => {
      const confidence = new ClassificationConfidence(0.8);
      expect(confidence.shouldAutoConfirm()).toBe(false);
    });
  });

  describe('shouldRecommendReview', () => {
    it('低信頼度の場合trueを返す', () => {
      const confidence = new ClassificationConfidence(0.5);
      expect(confidence.shouldRecommendReview()).toBe(true);
    });

    it('中信頼度の場合falseを返す', () => {
      const confidence = new ClassificationConfidence(0.8);
      expect(confidence.shouldRecommendReview()).toBe(false);
    });
  });

  describe('toString', () => {
    it('パーセント形式で文字列を返す', () => {
      const confidence = new ClassificationConfidence(0.75);
      expect(confidence.toString()).toBe('75%');
    });

    it('0%を正しく表示する', () => {
      const confidence = new ClassificationConfidence(0.0);
      expect(confidence.toString()).toBe('0%');
    });

    it('100%を正しく表示する', () => {
      const confidence = new ClassificationConfidence(1.0);
      expect(confidence.toString()).toBe('100%');
    });

    it('端数を丸める', () => {
      const confidence = new ClassificationConfidence(0.876);
      expect(confidence.toString()).toBe('88%');
    });
  });

  describe('equals', () => {
    it('同じ信頼度の場合trueを返す', () => {
      const confidence1 = new ClassificationConfidence(0.75);
      const confidence2 = new ClassificationConfidence(0.75);
      expect(confidence1.equals(confidence2)).toBe(true);
    });

    it('異なる信頼度の場合falseを返す', () => {
      const confidence1 = new ClassificationConfidence(0.75);
      const confidence2 = new ClassificationConfidence(0.8);
      expect(confidence1.equals(confidence2)).toBe(false);
    });
  });

  describe('静的メソッド', () => {
    it('getHighThreshold()で高信頼度の閾値を取得できる', () => {
      expect(ClassificationConfidence.getHighThreshold()).toBe(0.9);
    });

    it('getMediumThreshold()で中信頼度の閾値を取得できる', () => {
      expect(ClassificationConfidence.getMediumThreshold()).toBe(0.7);
    });
  });
});
