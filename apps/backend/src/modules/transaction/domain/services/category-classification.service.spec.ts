import { CategoryClassificationService } from './category-classification.service';
import { CategoryType } from '@account-book/types';

describe('CategoryClassificationService', () => {
  let service: CategoryClassificationService;

  beforeEach(() => {
    service = new CategoryClassificationService();
  });

  describe('classifyTransaction', () => {
    it('金融機関タイプが証券の場合、投資カテゴリに分類される', () => {
      const result = service.classifyTransaction(
        { amount: -50000, description: '株式購入' },
        'securities',
      );

      expect(result.category).toBe(CategoryType.INVESTMENT);
      expect(result.confidence).toBe(0.95);
      expect(result.reason).toBe('証券口座の取引');
    });

    it('給与キーワードを含む場合、収入カテゴリに分類される', () => {
      const result = service.classifyTransaction(
        { amount: 300000, description: '給与振込' },
        undefined,
      );

      expect(result.category).toBe(CategoryType.INCOME);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.reason).toContain('給与');
    });

    it('コンビニキーワードを含む場合、支出カテゴリに分類される', () => {
      const result = service.classifyTransaction(
        { amount: -1500, description: 'コンビニで買い物' },
        undefined,
      );

      expect(result.category).toBe(CategoryType.EXPENSE);
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      expect(result.reason).toContain('コンビニ');
    });

    it('振替キーワードを含む場合、振替カテゴリに分類される', () => {
      const result = service.classifyTransaction(
        { amount: -50000, description: '口座振替' },
        undefined,
      );

      expect(result.category).toBe(CategoryType.TRANSFER);
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      expect(result.reason).toContain('振替');
    });

    it('ローンキーワードを含む場合、返済カテゴリに分類される', () => {
      const result = service.classifyTransaction(
        { amount: -100000, description: '住宅ローン返済' },
        undefined,
      );

      expect(result.category).toBe(CategoryType.REPAYMENT);
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      expect(result.reason).toContain('ローン');
    });

    it('プラスの金額はデフォルトで収入に分類される', () => {
      const result = service.classifyTransaction(
        { amount: 10000, description: 'その他' },
        undefined,
      );

      expect(result.category).toBe(CategoryType.INCOME);
      expect(result.confidence).toBe(0.7);
      expect(result.reason).toContain('入金取引');
    });

    it('マイナスの金額はデフォルトで支出に分類される', () => {
      const result = service.classifyTransaction(
        { amount: -5000, description: 'その他' },
        undefined,
      );

      expect(result.category).toBe(CategoryType.EXPENSE);
      expect(result.confidence).toBe(0.7);
      expect(result.reason).toContain('出金取引');
    });

    it('大文字小文字を区別せずキーワードマッチする', () => {
      const result = service.classifyTransaction(
        { amount: 300000, description: 'SALARY' },
        undefined,
      );

      expect(result.category).toBe(CategoryType.INCOME);
      expect(result.reason).toContain('キーワードマッチ');
    });
  });

  describe('isTransferPattern', () => {
    it('金額の絶対値が一致し、符号が逆で、異なる金融機関の場合はtrueを返す', () => {
      const t1 = {
        amount: 50000,
        date: new Date('2025-01-15'),
        institutionId: 'inst-1',
      };
      const t2 = {
        amount: -50000,
        date: new Date('2025-01-15'),
        institutionId: 'inst-2',
      };

      expect(service.isTransferPattern(t1, t2)).toBe(true);
    });

    it('金額が異なる場合はfalseを返す', () => {
      const t1 = {
        amount: 50000,
        date: new Date('2025-01-15'),
        institutionId: 'inst-1',
      };
      const t2 = {
        amount: -60000,
        date: new Date('2025-01-15'),
        institutionId: 'inst-2',
      };

      expect(service.isTransferPattern(t1, t2)).toBe(false);
    });

    it('両方とも同じ符号の場合はfalseを返す', () => {
      const t1 = {
        amount: 50000,
        date: new Date('2025-01-15'),
        institutionId: 'inst-1',
      };
      const t2 = {
        amount: 50000,
        date: new Date('2025-01-15'),
        institutionId: 'inst-2',
      };

      expect(service.isTransferPattern(t1, t2)).toBe(false);
    });

    it('同じ金融機関の場合はfalseを返す', () => {
      const t1 = {
        amount: 50000,
        date: new Date('2025-01-15'),
        institutionId: 'inst-1',
      };
      const t2 = {
        amount: -50000,
        date: new Date('2025-01-15'),
        institutionId: 'inst-1',
      };

      expect(service.isTransferPattern(t1, t2)).toBe(false);
    });

    it('日付の差が3日を超える場合はfalseを返す', () => {
      const t1 = {
        amount: 50000,
        date: new Date('2025-01-15'),
        institutionId: 'inst-1',
      };
      const t2 = {
        amount: -50000,
        date: new Date('2025-01-20'),
        institutionId: 'inst-2',
      };

      expect(service.isTransferPattern(t1, t2)).toBe(false);
    });

    it('日付の差が3日以内の場合はtrueを返す', () => {
      const t1 = {
        amount: 50000,
        date: new Date('2025-01-15'),
        institutionId: 'inst-1',
      };
      const t2 = {
        amount: -50000,
        date: new Date('2025-01-17'),
        institutionId: 'inst-2',
      };

      expect(service.isTransferPattern(t1, t2)).toBe(true);
    });
  });

  describe('evaluateConfidence', () => {
    it('信頼度90%以上の場合はhighを返す', () => {
      expect(service.evaluateConfidence(0.95)).toBe('high');
      expect(service.evaluateConfidence(0.9)).toBe('high');
    });

    it('信頼度70-90%の場合はmediumを返す', () => {
      expect(service.evaluateConfidence(0.85)).toBe('medium');
      expect(service.evaluateConfidence(0.7)).toBe('medium');
    });

    it('信頼度70%未満の場合はlowを返す', () => {
      expect(service.evaluateConfidence(0.65)).toBe('low');
      expect(service.evaluateConfidence(0.5)).toBe('low');
    });
  });
});
