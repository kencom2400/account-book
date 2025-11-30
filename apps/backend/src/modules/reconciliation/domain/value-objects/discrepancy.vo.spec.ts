import { Discrepancy } from './discrepancy.vo';

describe('Discrepancy Value Object', () => {
  describe('constructor', () => {
    it('正常に作成できる', () => {
      const discrepancy = new Discrepancy(1000, 2, false, '金額不一致');

      expect(discrepancy.amountDifference).toBe(1000);
      expect(discrepancy.dateDifference).toBe(2);
      expect(discrepancy.descriptionMatch).toBe(false);
      expect(discrepancy.reason).toBe('金額不一致');
    });

    it('金額差が整数でない場合エラー', () => {
      expect(() => new Discrepancy(1000.5, 2, false, '理由')).toThrow(
        'Amount difference must be an integer (yen unit)',
      );
    });

    it('日数差が整数でない場合エラー', () => {
      expect(() => new Discrepancy(1000, 2.5, false, '理由')).toThrow(
        'Date difference must be an integer (business days)',
      );
    });

    it('理由が空の場合エラー', () => {
      expect(() => new Discrepancy(1000, 2, false, '')).toThrow(
        'Reason is required',
      );
    });
  });

  describe('toPlain', () => {
    it('プレーンオブジェクトに変換できる', () => {
      const discrepancy = new Discrepancy(1000, 2, false, '金額不一致');
      const plain = discrepancy.toPlain();

      expect(plain).toEqual({
        amountDifference: 1000,
        dateDifference: 2,
        descriptionMatch: false,
        reason: '金額不一致',
      });
    });
  });

  describe('fromPlain', () => {
    it('プレーンオブジェクトから生成できる', () => {
      const plain = {
        amountDifference: 1000,
        dateDifference: 2,
        descriptionMatch: false,
        reason: '金額不一致',
      };

      const discrepancy = Discrepancy.fromPlain(plain);

      expect(discrepancy.amountDifference).toBe(1000);
      expect(discrepancy.dateDifference).toBe(2);
      expect(discrepancy.descriptionMatch).toBe(false);
      expect(discrepancy.reason).toBe('金額不一致');
    });
  });
});
