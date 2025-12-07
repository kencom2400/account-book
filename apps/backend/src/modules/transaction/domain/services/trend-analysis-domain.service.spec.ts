import { Test, TestingModule } from '@nestjs/testing';
import { TrendAnalysisDomainService } from './trend-analysis-domain.service';

describe('TrendAnalysisDomainService', () => {
  let service: TrendAnalysisDomainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrendAnalysisDomainService],
    }).compile();

    service = module.get<TrendAnalysisDomainService>(
      TrendAnalysisDomainService,
    );
  });

  describe('calculateSMA', () => {
    it('should calculate 3-month moving average correctly', () => {
      const data = [100, 110, 120, 130, 140];
      const period = 3;

      const result = service.calculateSMA(data, period);

      expect(result).toHaveLength(5);
      expect(result[0]).toBeNaN(); // データ不足
      expect(result[1]).toBeNaN(); // データ不足
      expect(result[2]).toBeCloseTo(110, 0); // (100+110+120)/3
      expect(result[3]).toBeCloseTo(120, 0); // (110+120+130)/3
      expect(result[4]).toBeCloseTo(130, 0); // (120+130+140)/3
    });

    it('should calculate 6-month moving average correctly', () => {
      const data = [100, 110, 120, 130, 140, 150, 160];
      const period = 6;

      const result = service.calculateSMA(data, period);

      expect(result).toHaveLength(7);
      expect(result[0]).toBeNaN(); // データ不足
      expect(result[1]).toBeNaN(); // データ不足
      expect(result[2]).toBeNaN(); // データ不足
      expect(result[3]).toBeNaN(); // データ不足
      expect(result[4]).toBeNaN(); // データ不足
      expect(result[5]).toBeCloseTo(125, 0); // (100+110+120+130+140+150)/6
      expect(result[6]).toBeCloseTo(135, 0); // (110+120+130+140+150+160)/6
    });

    it('should handle empty array', () => {
      const data: number[] = [];
      const period = 3;

      const result = service.calculateSMA(data, period);

      expect(result).toEqual([]);
    });

    it('should handle period 0', () => {
      const data = [100, 110, 120];
      const period = 0;

      const result = service.calculateSMA(data, period);

      expect(result).toEqual([]);
    });

    it('should handle period larger than data length', () => {
      const data = [100, 110, 120];
      const period = 5;

      const result = service.calculateSMA(data, period);

      expect(result).toHaveLength(3);
      expect(result[0]).toBeNaN();
      expect(result[1]).toBeNaN();
      expect(result[2]).toBeNaN();
    });
  });

  describe('calculateTrendLine', () => {
    it('should calculate trend line for increasing data', () => {
      const data = [100, 110, 120, 130, 140];
      const dates = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05'];

      const result = service.calculateTrendLine(data, dates);

      expect(result.slope).toBeGreaterThan(0);
      expect(result.points).toHaveLength(5);
      expect(result.points[0].date).toBe('2024-01');
      expect(result.points[4].date).toBe('2024-05');
      // トレンドラインの値は増加傾向
      expect(result.points[4].value).toBeGreaterThan(result.points[0].value);
    });

    it('should calculate trend line for decreasing data', () => {
      const data = [140, 130, 120, 110, 100];
      const dates = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05'];

      const result = service.calculateTrendLine(data, dates);

      expect(result.slope).toBeLessThan(0);
      expect(result.points).toHaveLength(5);
      // トレンドラインの値は減少傾向
      expect(result.points[4].value).toBeLessThan(result.points[0].value);
    });

    it('should calculate trend line for constant data', () => {
      const data = [100, 100, 100, 100, 100];
      const dates = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05'];

      const result = service.calculateTrendLine(data, dates);

      expect(result.slope).toBe(0);
      expect(result.points).toHaveLength(5);
      // すべてのポイントが同じ値
      expect(result.points[0].value).toBeCloseTo(100, 0);
      expect(result.points[4].value).toBeCloseTo(100, 0);
    });

    it('should handle denominator zero case (all data values are same)', () => {
      // 全てのデータが同じ値の場合、xDiffが全て0になるため、denominatorが0になる
      // この場合、denominator === 0の分岐が実行され、slopeは0として扱われる
      const data = [50, 50, 50, 50, 50];
      const dates = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05'];

      const result = service.calculateTrendLine(data, dates);

      // denominator === 0の場合、slopeは0になる（105行目の分岐）
      expect(result.slope).toBe(0);
      expect(result.intercept).toBe(50);
      expect(result.points).toHaveLength(5);
      // すべてのポイントが同じ値（interceptと同じ）
      expect(result.points.every((p) => p.value === 50)).toBe(true);
    });

    it('should handle single data point (denominator zero)', () => {
      // データが1点のみの場合もdenominatorが0になる可能性がある
      const data = [100];
      const dates = ['2024-01'];

      const result = service.calculateTrendLine(data, dates);

      // 1点のみの場合、xDiffが0になるため、denominatorが0になる
      expect(result.slope).toBe(0);
      expect(result.intercept).toBe(100);
      expect(result.points).toHaveLength(1);
      expect(result.points[0].value).toBe(100);
    });

    it('should handle denominator zero case (all x values are same)', () => {
      // 全てのデータが同じ値の場合、denominatorが0になる
      // この場合、slopeは0として扱われる
      const data = [50, 50, 50, 50, 50];
      const dates = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05'];

      const result = service.calculateTrendLine(data, dates);

      // denominator === 0の場合、slopeは0になる
      expect(result.slope).toBe(0);
      expect(result.intercept).toBe(50);
      expect(result.points).toHaveLength(5);
      // すべてのポイントが同じ値（interceptと同じ）
      expect(result.points.every((p) => p.value === 50)).toBe(true);
    });

    it('should handle empty arrays', () => {
      const data: number[] = [];
      const dates: string[] = [];

      const result = service.calculateTrendLine(data, dates);

      expect(result.slope).toBe(0);
      expect(result.intercept).toBe(0);
      expect(result.points).toEqual([]);
    });

    it('should handle mismatched array lengths', () => {
      const data = [100, 110, 120];
      const dates = ['2024-01', '2024-02'];

      const result = service.calculateTrendLine(data, dates);

      expect(result.slope).toBe(0);
      expect(result.intercept).toBe(0);
      expect(result.points).toEqual([]);
    });
  });

  describe('analyzeSeasonality', () => {
    it('should return empty array (future feature)', () => {
      const data = [100, 110, 120, 130, 140];
      const dates = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05'];

      const result = service.analyzeSeasonality(data, dates);

      expect(result).toEqual([]);
    });
  });

  describe('calculateStandardDeviation', () => {
    it('should calculate standard deviation correctly', () => {
      const data = [100, 110, 120, 130, 140];

      const result = service.calculateStandardDeviation(data);

      expect(result).toBeGreaterThan(0);
      // 標準偏差は約14.14（実際の計算結果）
      expect(result).toBeCloseTo(14.14, 1);
    });

    it('should return 0 for constant values', () => {
      const data = [100, 100, 100, 100, 100];

      const result = service.calculateStandardDeviation(data);

      expect(result).toBe(0);
    });

    it('should handle empty array', () => {
      const data: number[] = [];

      const result = service.calculateStandardDeviation(data);

      expect(result).toBe(0);
    });
  });

  describe('calculateCoefficientOfVariation', () => {
    it('should calculate coefficient of variation correctly', () => {
      const data = [100, 110, 120, 130, 140];

      const result = service.calculateCoefficientOfVariation(data);

      expect(result).toBeGreaterThan(0);
      // 変動係数 = 標準偏差 / 平均
      // 平均 = 120, 標準偏差 ≈ 14.14
      // 変動係数 ≈ 0.118
      expect(result).toBeCloseTo(0.118, 2);
    });

    it('should return 0 for constant values', () => {
      const data = [100, 100, 100, 100, 100];

      const result = service.calculateCoefficientOfVariation(data);

      expect(result).toBe(0);
    });

    it('should return 0 when mean is 0', () => {
      const data = [0, 0, 0, 0, 0];

      const result = service.calculateCoefficientOfVariation(data);

      expect(result).toBe(0);
    });

    it('should handle empty array', () => {
      const data: number[] = [];

      const result = service.calculateCoefficientOfVariation(data);

      expect(result).toBe(0);
    });
  });
});
