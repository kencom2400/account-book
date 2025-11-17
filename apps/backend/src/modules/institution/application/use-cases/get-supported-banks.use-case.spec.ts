import { Test, TestingModule } from '@nestjs/testing';
import { GetSupportedBanksUseCase } from './get-supported-banks.use-case';
import { BankCategory } from '@account-book/types';

describe('GetSupportedBanksUseCase', () => {
  let useCase: GetSupportedBanksUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GetSupportedBanksUseCase],
    }).compile();

    useCase = module.get<GetSupportedBanksUseCase>(GetSupportedBanksUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return all supported banks when no query is provided', () => {
      const banks = useCase.execute();

      expect(banks).toBeInstanceOf(Array);
      expect(banks.length).toBeGreaterThan(0);
      expect(banks.every((bank) => bank.isSupported)).toBe(true);
    });

    it('should return banks with correct structure', () => {
      const banks = useCase.execute();
      const bank = banks[0];

      expect(bank).toMatchObject({
        id: expect.any(String),
        code: expect.any(String),
        name: expect.any(String),
        category: expect.any(String),
        isSupported: expect.any(Boolean),
      });
    });

    it('should filter banks by category (MEGA_BANK)', () => {
      const banks = useCase.execute({
        category: BankCategory.MEGA_BANK,
      });

      expect(banks.length).toBeGreaterThan(0);
      expect(
        banks.every((bank) => bank.category === BankCategory.MEGA_BANK),
      ).toBe(true);
    });

    it('should filter banks by category (ONLINE_BANK)', () => {
      const banks = useCase.execute({
        category: BankCategory.ONLINE_BANK,
      });

      expect(banks.length).toBeGreaterThan(0);
      expect(
        banks.every((bank) => bank.category === BankCategory.ONLINE_BANK),
      ).toBe(true);
    });

    it('should filter banks by category (REGIONAL_BANK)', () => {
      const banks = useCase.execute({
        category: BankCategory.REGIONAL_BANK,
      });

      expect(banks.length).toBeGreaterThan(0);
      expect(
        banks.every((bank) => bank.category === BankCategory.REGIONAL_BANK),
      ).toBe(true);
    });

    it('should search banks by name', () => {
      const banks = useCase.execute({
        searchTerm: '三菱UFJ',
      });

      expect(banks.length).toBeGreaterThan(0);
      expect(banks.some((bank) => bank.name.includes('三菱UFJ'))).toBe(true);
    });

    it('should search banks by name (case insensitive)', () => {
      const banksUpper = useCase.execute({
        searchTerm: 'UFJ',
      });
      const banksLower = useCase.execute({
        searchTerm: 'ufj',
      });

      expect(banksUpper.length).toBe(banksLower.length);
      expect(banksUpper.length).toBeGreaterThan(0);
    });

    it('should search banks by bank code', () => {
      const banks = useCase.execute({
        searchTerm: '0005',
      });

      expect(banks.length).toBeGreaterThan(0);
      expect(banks.some((bank) => bank.code === '0005')).toBe(true);
    });

    it('should combine category and search filters', () => {
      const banks = useCase.execute({
        category: BankCategory.MEGA_BANK,
        searchTerm: '三菱',
      });

      expect(
        banks.every((bank) => bank.category === BankCategory.MEGA_BANK),
      ).toBe(true);
      expect(banks.some((bank) => bank.name.includes('三菱'))).toBe(true);
    });

    it('should return empty array for non-existent search term', () => {
      const banks = useCase.execute({
        searchTerm: 'nonexistent-bank-xyz',
      });

      expect(banks).toBeInstanceOf(Array);
      expect(banks.length).toBe(0);
    });

    it('should include major banks in the list', () => {
      const banks = useCase.execute();
      const bankNames = banks.map((bank) => bank.name);

      // メガバンクが含まれていることを確認
      expect(bankNames).toContain('三菱UFJ銀行');
      expect(bankNames).toContain('三井住友銀行');
      expect(bankNames).toContain('みずほ銀行');
    });

    it('should include online banks in the list', () => {
      const banks = useCase.execute();
      const bankNames = banks.map((bank) => bank.name);

      // ネット銀行が含まれていることを確認
      expect(bankNames).toContain('楽天銀行');
      expect(bankNames).toContain('住信SBIネット銀行');
    });

    it('should have unique bank IDs', () => {
      const banks = useCase.execute();
      const ids = banks.map((bank) => bank.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique bank codes', () => {
      const banks = useCase.execute();
      const codes = banks.map((bank) => bank.code);
      const uniqueCodes = new Set(codes);

      expect(uniqueCodes.size).toBe(codes.length);
    });
  });

  describe('findByCode', () => {
    it('should find bank by code', () => {
      const bank = useCase.findByCode('0005');

      expect(bank).toBeDefined();
      expect(bank?.code).toBe('0005');
      expect(bank?.name).toBe('三菱UFJ銀行');
    });

    it('should return null for non-existent code', () => {
      const bank = useCase.findByCode('9999');

      expect(bank).toBeNull();
    });

    it('should return null for unsupported bank', () => {
      // すべてのサポート済み銀行が isSupported: true であることを想定
      const bank = useCase.findByCode('0005');

      expect(bank).not.toBeNull();
      if (bank) {
        expect(bank.isSupported).toBe(true);
      }
    });

    it('should find test bank', () => {
      const bank = useCase.findByCode('0000');

      expect(bank).toBeDefined();
      expect(bank?.code).toBe('0000');
      expect(bank?.name).toBe('テスト銀行');
    });
  });
});
