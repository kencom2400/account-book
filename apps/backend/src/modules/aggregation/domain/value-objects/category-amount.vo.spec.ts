import { CategoryAmount } from './category-amount.vo';

describe('CategoryAmount Value Object', () => {
  describe('constructor', () => {
    it('正常に作成できる', () => {
      const vo = new CategoryAmount('食費', 30000, 10);

      expect(vo).toBeInstanceOf(CategoryAmount);
      expect(vo.category).toBe('食費');
      expect(vo.amount).toBe(30000);
      expect(vo.count).toBe(10);
    });

    it('異なるカテゴリで作成できる', () => {
      const food = new CategoryAmount('食費', 30000, 10);
      const transport = new CategoryAmount('交通費', 20000, 5);
      const entertainment = new CategoryAmount('娯楽費', 15000, 3);

      expect(food.category).toBe('食費');
      expect(transport.category).toBe('交通費');
      expect(entertainment.category).toBe('娯楽費');
    });

    it('カテゴリが空の場合エラー', () => {
      expect(() => new CategoryAmount('', 30000, 10)).toThrow(
        'Category is required',
      );
    });

    it('金額が負の場合エラー', () => {
      expect(() => new CategoryAmount('食費', -1000, 10)).toThrow(
        'Amount must be non-negative',
      );
    });

    it('件数が負の場合エラー', () => {
      expect(() => new CategoryAmount('食費', 30000, -1)).toThrow(
        'Count must be non-negative',
      );
    });

    it('金額が整数でない場合エラー', () => {
      expect(() => new CategoryAmount('食費', 30000.5, 10)).toThrow(
        'Amount must be an integer (yen unit)',
      );
    });

    it('件数が整数でない場合エラー', () => {
      expect(() => new CategoryAmount('食費', 30000, 10.5)).toThrow(
        'Count must be an integer',
      );
    });
  });

  describe('toPlain', () => {
    it('プレーンオブジェクトに変換できる', () => {
      const vo = new CategoryAmount('食費', 30000, 10);

      const plain = vo.toPlain();

      expect(plain).toEqual({
        category: '食費',
        amount: 30000,
        count: 10,
      });
    });

    it('異なる値でも正しく変換できる', () => {
      const vo = new CategoryAmount('交通費', 15000, 5);

      const plain = vo.toPlain();

      expect(plain).toEqual({
        category: '交通費',
        amount: 15000,
        count: 5,
      });
    });
  });

  describe('fromPlain', () => {
    it('プレーンオブジェクトから生成できる', () => {
      const plain = {
        category: '食費',
        amount: 30000,
        count: 10,
      };

      const vo = CategoryAmount.fromPlain(plain);

      expect(vo).toBeInstanceOf(CategoryAmount);
      expect(vo.category).toBe('食費');
      expect(vo.amount).toBe(30000);
      expect(vo.count).toBe(10);
    });

    it('バリデーションが動作する', () => {
      const invalidPlain = {
        category: '',
        amount: 30000,
        count: 10,
      };

      expect(() => CategoryAmount.fromPlain(invalidPlain)).toThrow(
        'Category is required',
      );
    });
  });
});
