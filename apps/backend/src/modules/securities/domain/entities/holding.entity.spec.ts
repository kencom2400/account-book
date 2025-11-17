import { HoldingEntity } from './holding.entity';

describe('HoldingEntity', () => {
  const validData = {
    id: 'hold_123',
    securitiesAccountId: 'sec_123',
    securityCode: '7203',
    securityName: 'トヨタ自動車',
    quantity: 100,
    averageAcquisitionPrice: 2500,
    currentPrice: 2800,
    securityType: 'stock' as const,
    market: '東証プライム',
    updatedAt: new Date(),
  };

  describe('constructor', () => {
    it('should create a valid holding entity', () => {
      const holding = new HoldingEntity(...Object.values(validData));

      expect(holding.id).toBe(validData.id);
      expect(holding.securityCode).toBe(validData.securityCode);
      expect(holding.securityName).toBe(validData.securityName);
      expect(holding.quantity).toBe(validData.quantity);
    });

    it('should throw error when ID is missing', () => {
      expect(() => {
        new HoldingEntity(
          '',
          validData.securitiesAccountId,
          validData.securityCode,
          validData.securityName,
          validData.quantity,
          validData.averageAcquisitionPrice,
          validData.currentPrice,
          validData.securityType,
          validData.market,
          validData.updatedAt,
        );
      }).toThrow('Holding ID is required');
    });

    it('should throw error when quantity is negative', () => {
      expect(() => {
        new HoldingEntity(
          validData.id,
          validData.securitiesAccountId,
          validData.securityCode,
          validData.securityName,
          -10,
          validData.averageAcquisitionPrice,
          validData.currentPrice,
          validData.securityType,
          validData.market,
          validData.updatedAt,
        );
      }).toThrow('Quantity must be non-negative');
    });
  });

  describe('getEvaluationAmount', () => {
    it('should calculate evaluation amount correctly', () => {
      const holding = new HoldingEntity(...Object.values(validData));
      const amount = holding.getEvaluationAmount();
      expect(amount).toBe(280000); // 100 * 2800
    });
  });

  describe('getProfitLoss', () => {
    it('should calculate profit correctly', () => {
      const holding = new HoldingEntity(...Object.values(validData));
      const profitLoss = holding.getProfitLoss();
      expect(profitLoss).toBe(30000); // (2800 - 2500) * 100
    });

    it('should calculate loss correctly', () => {
      const holding = new HoldingEntity(
        validData.id,
        validData.securitiesAccountId,
        validData.securityCode,
        validData.securityName,
        validData.quantity,
        3000, // Higher acquisition price
        2800,
        validData.securityType,
        validData.market,
        validData.updatedAt,
      );
      const profitLoss = holding.getProfitLoss();
      expect(profitLoss).toBe(-20000); // (2800 - 3000) * 100
    });
  });

  describe('getProfitLossRate', () => {
    it('should calculate profit loss rate correctly', () => {
      const holding = new HoldingEntity(...Object.values(validData));
      const rate = holding.getProfitLossRate();
      expect(rate).toBeCloseTo(12); // (30000 / 250000) * 100
    });
  });

  describe('updateCurrentPrice', () => {
    it('should update current price', () => {
      const holding = new HoldingEntity(...Object.values(validData));
      const updated = holding.updateCurrentPrice(3000);

      expect(updated.currentPrice).toBe(3000);
      expect(updated.id).toBe(holding.id);
    });

    it('should throw error when price is negative', () => {
      const holding = new HoldingEntity(...Object.values(validData));

      expect(() => {
        holding.updateCurrentPrice(-100);
      }).toThrow('Price must be non-negative');
    });
  });

  describe('toJSON', () => {
    it('should convert to JSON correctly', () => {
      const holding = new HoldingEntity(...Object.values(validData));
      const json = holding.toJSON();

      expect(json.id).toBe(validData.id);
      expect(json.securityCode).toBe(validData.securityCode);
      expect(json.evaluationAmount).toBe(280000);
      expect(json.profitLoss).toBe(30000);
      expect(json.profitLossRate).toBeCloseTo(12);
    });
  });
});
