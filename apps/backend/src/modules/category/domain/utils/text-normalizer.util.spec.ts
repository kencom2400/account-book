import { TextNormalizer } from './text-normalizer.util';

describe('TextNormalizer', () => {
  describe('normalize', () => {
    it('小文字に変換する', () => {
      const result = TextNormalizer.normalize('ABC');
      expect(result).toBe('abc');
    });

    it('全角英数字を半角に変換する', () => {
      const result = TextNormalizer.normalize('ＡＢＣ１２３');
      expect(result).toBe('abc123');
    });

    it('記号をスペースに置換する', () => {
      const result = TextNormalizer.normalize('スターバックス@コーヒー!');
      expect(result).toBe('スターバックス コーヒー');
    });

    it('複数の空白を一つにまとめる', () => {
      const result = TextNormalizer.normalize('スターバックス    コーヒー');
      expect(result).toBe('スターバックス コーヒー');
    });

    it('前後の空白をトリムする', () => {
      const result = TextNormalizer.normalize('  スターバックス  ');
      expect(result).toBe('スターバックス');
    });

    it('日本語（ひらがな）を保持する', () => {
      const result = TextNormalizer.normalize('すたーばっくす');
      expect(result).toBe('すたーばっくす');
    });

    it('日本語（カタカナ）を保持する', () => {
      const result = TextNormalizer.normalize('スターバックス');
      expect(result).toBe('スターバックス');
    });

    it('日本語（漢字）を保持する', () => {
      const result = TextNormalizer.normalize('東京電力');
      expect(result).toBe('東京電力');
    });

    it('長音符を保持する', () => {
      const result = TextNormalizer.normalize('コーヒー');
      expect(result).toBe('コーヒー');
    });

    it('複合的な正規化を行う', () => {
      const result = TextNormalizer.normalize(
        '  ＡＢＣスターバックス！！  コーヒー１２３  ',
      );
      expect(result).toBe('abcスターバックス コーヒー123');
    });

    it('空文字列を処理できる', () => {
      const result = TextNormalizer.normalize('');
      expect(result).toBe('');
    });

    it('空白のみの文字列を空文字列にする', () => {
      const result = TextNormalizer.normalize('     ');
      expect(result).toBe('');
    });
  });

  describe('includes', () => {
    it('完全一致する場合trueを返す', () => {
      const result = TextNormalizer.includes(
        'スターバックス',
        'スターバックス',
      );
      expect(result).toBe(true);
    });

    it('部分一致する場合trueを返す', () => {
      const result = TextNormalizer.includes(
        'スターバックスコーヒー',
        'スターバックス',
      );
      expect(result).toBe(true);
    });

    it('大文字小文字を区別せず一致する', () => {
      const result = TextNormalizer.includes('Starbucks', 'STARBUCKS');
      expect(result).toBe(true);
    });

    it('全角半角を区別せず一致する', () => {
      const result = TextNormalizer.includes('ABC', 'ＡＢＣ');
      expect(result).toBe(true);
    });

    it('記号を無視して一致する', () => {
      const result = TextNormalizer.includes(
        'スターバックス@渋谷',
        'スターバックス',
      );
      expect(result).toBe(true);
    });

    it('一致しない場合falseを返す', () => {
      const result = TextNormalizer.includes('スターバックス', 'タリーズ');
      expect(result).toBe(false);
    });

    it('空文字列は常に含まれる', () => {
      const result = TextNormalizer.includes('スターバックス', '');
      expect(result).toBe(true);
    });
  });

  describe('equals', () => {
    it('完全一致する場合trueを返す', () => {
      const result = TextNormalizer.equals('スターバックス', 'スターバックス');
      expect(result).toBe(true);
    });

    it('大文字小文字を区別せず一致する', () => {
      const result = TextNormalizer.equals('Starbucks', 'STARBUCKS');
      expect(result).toBe(true);
    });

    it('全角半角を区別せず一致する', () => {
      const result = TextNormalizer.equals('ABC123', 'ＡＢＣ１２３');
      expect(result).toBe(true);
    });

    it('記号を無視して一致する', () => {
      const result = TextNormalizer.equals(
        'スターバックス!!!',
        'スターバックス',
      );
      expect(result).toBe(true);
    });

    it('空白の数を無視して一致する', () => {
      const result = TextNormalizer.equals(
        'スターバックス  コーヒー',
        'スターバックス コーヒー',
      );
      expect(result).toBe(true);
    });

    it('部分一致の場合falseを返す', () => {
      const result = TextNormalizer.equals(
        'スターバックスコーヒー',
        'スターバックス',
      );
      expect(result).toBe(false);
    });

    it('一致しない場合falseを返す', () => {
      const result = TextNormalizer.equals('スターバックス', 'タリーズ');
      expect(result).toBe(false);
    });

    it('空文字列同士は一致する', () => {
      const result = TextNormalizer.equals('', '');
      expect(result).toBe(true);
    });
  });
});
