import { Portfolio } from './portfolio.vo';
import { HoldingEntity } from '../entities/holding.entity';

describe('Portfolio', () => {
  const createMockHolding = (
    id: string,
    quantity: number,
    avgPrice: number,
    currentPrice: number,
  ): HoldingEntity => {
    return new HoldingEntity(
      id,
      'sec_123',
      '7203',
      'テスト銘柄',
      quantity,
      avgPrice,
      currentPrice,
      'stock',
      '東証',
      new Date(),
    );
  };

  describe('constructor', () => {
    it('should create a valid portfolio', () => {
      const holdings = [
        createMockHolding('hold_1', 100, 2500, 2800),
        createMockHolding('hold_2', 50, 15000, 16000),
      ];
      const portfolio = new Portfolio(holdings);

      expect(portfolio.holdings).toHaveLength(2);
      expect(portfolio.getHoldingCount()).toBe(2);
    });

    it('should handle empty holdings', () => {
      const portfolio = new Portfolio([]);

      expect(portfolio.holdings).toHaveLength(0);
      expect(portfolio.getHoldingCount()).toBe(0);
    });
  });

  describe('getTotalEvaluationAmount', () => {
    it('should calculate total evaluation amount correctly', () => {
      const holdings = [
        createMockHolding('hold_1', 100, 2500, 2800), // 280,000
        createMockHolding('hold_2', 50, 15000, 16000), // 800,000
      ];
      const portfolio = new Portfolio(holdings);

      expect(portfolio.getTotalEvaluationAmount()).toBe(1080000);
    });
  });

  describe('getTotalAcquisitionAmount', () => {
    it('should calculate total acquisition amount correctly', () => {
      const holdings = [
        createMockHolding('hold_1', 100, 2500, 2800), // 250,000
        createMockHolding('hold_2', 50, 15000, 16000), // 750,000
      ];
      const portfolio = new Portfolio(holdings);

      expect(portfolio.getTotalAcquisitionAmount()).toBe(1000000);
    });
  });

  describe('getTotalProfitLoss', () => {
    it('should calculate total profit correctly', () => {
      const holdings = [
        createMockHolding('hold_1', 100, 2500, 2800), // +30,000
        createMockHolding('hold_2', 50, 15000, 16000), // +50,000
      ];
      const portfolio = new Portfolio(holdings);

      expect(portfolio.getTotalProfitLoss()).toBe(80000);
    });

    it('should calculate total loss correctly', () => {
      const holdings = [
        createMockHolding('hold_1', 100, 3000, 2800), // -20,000
        createMockHolding('hold_2', 50, 17000, 16000), // -50,000
      ];
      const portfolio = new Portfolio(holdings);

      expect(portfolio.getTotalProfitLoss()).toBe(-70000);
    });
  });

  describe('getTotalProfitLossRate', () => {
    it('should calculate total profit loss rate correctly', () => {
      const holdings = [
        createMockHolding('hold_1', 100, 2500, 2800),
        createMockHolding('hold_2', 50, 15000, 16000),
      ];
      const portfolio = new Portfolio(holdings);

      const rate = portfolio.getTotalProfitLossRate();
      expect(rate).toBeCloseTo(8); // (80000 / 1000000) * 100
    });

    it('should return 0 when acquisition amount is 0', () => {
      const portfolio = new Portfolio([]);
      const rate = portfolio.getTotalProfitLossRate();
      expect(rate).toBe(0);
    });
  });

  describe('sortByEvaluationAmount', () => {
    it('should sort by evaluation amount in descending order', () => {
      const holdings = [
        createMockHolding('hold_1', 100, 2500, 2800), // 280,000
        createMockHolding('hold_2', 50, 15000, 16000), // 800,000
        createMockHolding('hold_3', 10, 38000, 39500), // 395,000
      ];
      const portfolio = new Portfolio(holdings);

      const sorted = portfolio.sortByEvaluationAmount(true);

      expect(sorted[0].id).toBe('hold_2'); // 800,000
      expect(sorted[1].id).toBe('hold_3'); // 395,000
      expect(sorted[2].id).toBe('hold_1'); // 280,000
    });
  });

  describe('addHolding', () => {
    it('should add a new holding', () => {
      const holdings = [createMockHolding('hold_1', 100, 2500, 2800)];
      const portfolio = new Portfolio(holdings);

      const newHolding = createMockHolding('hold_2', 50, 15000, 16000);
      const updated = portfolio.addHolding(newHolding);

      expect(updated.getHoldingCount()).toBe(2);
      expect(portfolio.getHoldingCount()).toBe(1); // Original unchanged
    });
  });

  describe('toJSON', () => {
    it('should convert to JSON correctly', () => {
      const holdings = [
        createMockHolding('hold_1', 100, 2500, 2800),
        createMockHolding('hold_2', 50, 15000, 16000),
      ];
      const portfolio = new Portfolio(holdings);
      const json = portfolio.toJSON();

      expect(json.holdings).toHaveLength(2);
      expect(json.totalEvaluationAmount).toBe(1080000);
      expect(json.totalAcquisitionAmount).toBe(1000000);
      expect(json.totalProfitLoss).toBe(80000);
      expect(json.holdingCount).toBe(2);
    });
  });
});
