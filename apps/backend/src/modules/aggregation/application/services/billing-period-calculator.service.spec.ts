import { Test, TestingModule } from '@nestjs/testing';
import { BillingPeriodCalculator } from './billing-period-calculator.service';

describe('BillingPeriodCalculator', () => {
  let service: BillingPeriodCalculator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BillingPeriodCalculator],
    }).compile();

    service = module.get<BillingPeriodCalculator>(BillingPeriodCalculator);
  });

  describe('determineBillingMonth', () => {
    describe('月末締め（31日）', () => {
      it('取引日が月末以内の場合、当月請求', () => {
        const transactionDate = new Date('2025-01-15');
        const result = service.determineBillingMonth(transactionDate, 31);
        expect(result).toBe('2025-01');
      });

      it('取引日が月末の場合、当月請求', () => {
        const transactionDate = new Date('2025-01-31');
        const result = service.determineBillingMonth(transactionDate, 31);
        expect(result).toBe('2025-01');
      });

      it('2月（平年）の場合、28日以内は当月請求', () => {
        const transactionDate = new Date('2025-02-28');
        const result = service.determineBillingMonth(transactionDate, 31);
        expect(result).toBe('2025-02');
      });

      it('2月（閏年）の場合、29日以内は当月請求', () => {
        const transactionDate = new Date('2024-02-29');
        const result = service.determineBillingMonth(transactionDate, 31);
        expect(result).toBe('2024-02');
      });
    });

    describe('月末締め（0日）', () => {
      it('0日指定でも月末締めとして扱う', () => {
        const transactionDate = new Date('2025-01-31');
        const result = service.determineBillingMonth(transactionDate, 0);
        expect(result).toBe('2025-01');
      });
    });

    describe('15日締め', () => {
      it('取引日が15日以内の場合、当月請求', () => {
        const transactionDate = new Date('2025-01-10');
        const result = service.determineBillingMonth(transactionDate, 15);
        expect(result).toBe('2025-01');
      });

      it('取引日が15日の場合、当月請求', () => {
        const transactionDate = new Date('2025-01-15');
        const result = service.determineBillingMonth(transactionDate, 15);
        expect(result).toBe('2025-01');
      });

      it('取引日が16日の場合、翌月請求', () => {
        const transactionDate = new Date('2025-01-16');
        const result = service.determineBillingMonth(transactionDate, 15);
        expect(result).toBe('2025-02');
      });
    });

    describe('10日締め', () => {
      it('取引日が10日以内の場合、当月請求', () => {
        const transactionDate = new Date('2025-01-05');
        const result = service.determineBillingMonth(transactionDate, 10);
        expect(result).toBe('2025-01');
      });

      it('取引日が11日の場合、翌月請求', () => {
        const transactionDate = new Date('2025-01-11');
        const result = service.determineBillingMonth(transactionDate, 10);
        expect(result).toBe('2025-02');
      });
    });

    describe('エッジケース: 締め日30日', () => {
      it('1月（31日ある月）の場合、30日以内は当月請求', () => {
        const transactionDate = new Date('2025-01-30');
        const result = service.determineBillingMonth(transactionDate, 30);
        expect(result).toBe('2025-01');
      });

      it('1月31日の場合、翌月請求', () => {
        const transactionDate = new Date('2025-01-31');
        const result = service.determineBillingMonth(transactionDate, 30);
        expect(result).toBe('2025-02');
      });

      it('2月（28日しかない月）の場合、28日以内は当月請求', () => {
        const transactionDate = new Date('2025-02-28');
        const result = service.determineBillingMonth(transactionDate, 30);
        expect(result).toBe('2025-02');
      });
    });

    describe('エッジケース: 締め日29日', () => {
      it('2月（平年28日）の場合、28日以内は当月請求', () => {
        const transactionDate = new Date('2025-02-28');
        const result = service.determineBillingMonth(transactionDate, 29);
        expect(result).toBe('2025-02');
      });

      it('2月（閏年29日）の場合、29日は当月請求', () => {
        const transactionDate = new Date('2024-02-29');
        const result = service.determineBillingMonth(transactionDate, 29);
        expect(result).toBe('2024-02');
      });
    });

    describe('12月から1月の遷移', () => {
      it('12月の取引で締め日を超えた場合、翌年1月請求', () => {
        const transactionDate = new Date('2025-12-16');
        const result = service.determineBillingMonth(transactionDate, 15);
        expect(result).toBe('2026-01');
      });

      it('12月31日の取引で月末締めの場合、当月請求', () => {
        const transactionDate = new Date('2025-12-31');
        const result = service.determineBillingMonth(transactionDate, 31);
        expect(result).toBe('2025-12');
      });
    });
  });

  describe('calculateClosingDate', () => {
    it('月末締め（31日）の場合、1月の最終日は31日', () => {
      const result = service.calculateClosingDate('2025-01', 31);
      expect(result).toEqual(new Date(2025, 0, 31));
    });

    it('月末締め（31日）の場合、2月（平年）の最終日は28日', () => {
      const result = service.calculateClosingDate('2025-02', 31);
      expect(result).toEqual(new Date(2025, 1, 28));
    });

    it('月末締め（31日）の場合、2月（閏年）の最終日は29日', () => {
      const result = service.calculateClosingDate('2024-02', 31);
      expect(result).toEqual(new Date(2024, 1, 29));
    });

    it('15日締めの場合、15日を返す', () => {
      const result = service.calculateClosingDate('2025-01', 15);
      expect(result).toEqual(new Date(2025, 0, 15));
    });

    it('締め日30日で2月の場合、28日（月の最終日）を返す', () => {
      const result = service.calculateClosingDate('2025-02', 30);
      expect(result).toEqual(new Date(2025, 1, 28));
    });
  });

  describe('calculatePaymentDate', () => {
    it('1月31日締め、翌月27日払いの場合、2月27日を返す', () => {
      const closingDate = new Date(2025, 0, 31);
      const result = service.calculatePaymentDate(closingDate, 27);
      expect(result).toEqual(new Date(2025, 1, 27));
    });

    it('12月31日締め、翌月10日払いの場合、翌年1月10日を返す', () => {
      const closingDate = new Date(2025, 11, 31);
      const result = service.calculatePaymentDate(closingDate, 10);
      expect(result).toEqual(new Date(2026, 0, 10));
    });

    it('1月31日締め、翌月31日払い、2月の場合、2月28日（最終日）を返す', () => {
      const closingDate = new Date(2025, 0, 31);
      const result = service.calculatePaymentDate(closingDate, 31);
      expect(result).toEqual(new Date(2025, 1, 28));
    });
  });
});
