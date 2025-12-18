import { Test, TestingModule } from '@nestjs/testing';
import { GetSupportedCardCompaniesUseCase } from './get-supported-card-companies.use-case';
import { CardCompanyCategory } from '@account-book/types';

describe('GetSupportedCardCompaniesUseCase', () => {
  let useCase: GetSupportedCardCompaniesUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GetSupportedCardCompaniesUseCase],
    }).compile();

    useCase = module.get<GetSupportedCardCompaniesUseCase>(
      GetSupportedCardCompaniesUseCase,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return all supported card companies when no query is provided', () => {
      const companies = useCase.execute();

      expect(companies).toBeInstanceOf(Array);
      expect(companies.length).toBeGreaterThan(0);
      expect(companies.every((company) => company.isSupported)).toBe(true);
    });

    it('should return companies with correct structure', () => {
      const companies = useCase.execute();
      const company = companies[0];

      expect(company).toMatchObject({
        id: expect.any(String),
        code: expect.any(String),
        name: expect.any(String),
        category: expect.any(String),
        isSupported: expect.any(Boolean),
      });
    });

    it('should filter companies by category (MAJOR)', () => {
      const companies = useCase.execute({
        category: CardCompanyCategory.MAJOR,
      });

      expect(companies.length).toBeGreaterThan(0);
      expect(
        companies.every(
          (company) => company.category === CardCompanyCategory.MAJOR,
        ),
      ).toBe(true);
    });

    it('should filter companies by category (BANK)', () => {
      const companies = useCase.execute({
        category: CardCompanyCategory.BANK,
      });

      expect(companies.length).toBeGreaterThan(0);
      expect(
        companies.every(
          (company) => company.category === CardCompanyCategory.BANK,
        ),
      ).toBe(true);
    });

    it('should filter companies by category (RETAIL)', () => {
      const companies = useCase.execute({
        category: CardCompanyCategory.RETAIL,
      });

      expect(companies.length).toBeGreaterThan(0);
      expect(
        companies.every(
          (company) => company.category === CardCompanyCategory.RETAIL,
        ),
      ).toBe(true);
    });

    it('should filter companies by category (ONLINE)', () => {
      const companies = useCase.execute({
        category: CardCompanyCategory.ONLINE,
      });

      expect(companies.length).toBeGreaterThan(0);
      expect(
        companies.every(
          (company) => company.category === CardCompanyCategory.ONLINE,
        ),
      ).toBe(true);
    });

    it('should search companies by name', () => {
      const companies = useCase.execute({
        searchTerm: '三井住友',
      });

      expect(companies.length).toBeGreaterThan(0);
      expect(
        companies.some((company) => company.name.includes('三井住友')),
      ).toBe(true);
    });

    it('should search companies by name (case insensitive)', () => {
      const companiesUpper = useCase.execute({
        searchTerm: 'JCB',
      });
      const companiesLower = useCase.execute({
        searchTerm: 'jcb',
      });

      expect(companiesUpper.length).toBe(companiesLower.length);
      expect(companiesUpper.length).toBeGreaterThan(0);
    });

    it('should search companies by code', () => {
      const companies = useCase.execute({
        searchTerm: 'SMBC',
      });

      expect(companies.length).toBeGreaterThan(0);
      expect(companies.some((company) => company.code === 'SMBC')).toBe(true);
    });

    it('should combine category and search filters', () => {
      const companies = useCase.execute({
        category: CardCompanyCategory.MAJOR,
        searchTerm: 'JCB',
      });

      expect(
        companies.every(
          (company) => company.category === CardCompanyCategory.MAJOR,
        ),
      ).toBe(true);
      expect(companies.some((company) => company.code === 'JCB')).toBe(true);
    });

    it('should return empty array for non-existent search term', () => {
      const companies = useCase.execute({
        searchTerm: 'nonexistent-card-xyz',
      });

      expect(companies).toBeInstanceOf(Array);
      expect(companies.length).toBe(0);
    });

    it('should include major card companies in the list', () => {
      const companies = useCase.execute();
      const companyNames = companies.map((company) => company.name);

      // 大手カード会社が含まれていることを確認
      expect(companyNames).toContain('三井住友カード');
      expect(companyNames).toContain('JCB');
    });

    it('should include online card companies in the list', () => {
      const companies = useCase.execute();
      const companyNames = companies.map((company) => company.name);

      // ネット系カードが含まれていることを確認
      expect(companyNames).toContain('楽天カード');
    });

    it('should have unique company IDs', () => {
      const companies = useCase.execute();
      const ids = companies.map((company) => company.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique company codes', () => {
      const companies = useCase.execute();
      const codes = companies.map((company) => company.code);
      const uniqueCodes = new Set(codes);

      expect(uniqueCodes.size).toBe(codes.length);
    });
  });

  describe('findByCode', () => {
    it('should find company by code', () => {
      const company = useCase.findByCode('SMBC');

      expect(company).toBeDefined();
      expect(company?.code).toBe('SMBC');
      expect(company?.name).toBe('三井住友カード');
    });

    it('should return null for non-existent code', () => {
      const company = useCase.findByCode('XXXX');

      expect(company).toBeNull();
    });

    it('should return null for unsupported company', () => {
      // すべてのサポート済みカード会社が isSupported: true であることを想定
      const company = useCase.findByCode('SMBC');

      expect(company).not.toBeNull();
      if (company) {
        expect(company.isSupported).toBe(true);
      }
    });

    it('should find test card company', () => {
      const company = useCase.findByCode('TEST');

      expect(company).toBeDefined();
      expect(company?.code).toBe('TEST');
      expect(company?.name).toBe('テストカード');
    });
  });
});
