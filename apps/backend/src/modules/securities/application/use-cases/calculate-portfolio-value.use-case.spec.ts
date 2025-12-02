import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CalculatePortfolioValueUseCase } from './calculate-portfolio-value.use-case';
import type {
  ISecuritiesAccountRepository,
  IHoldingRepository,
} from '../../domain/repositories/securities.repository.interface';
import {
  SECURITIES_ACCOUNT_REPOSITORY,
  HOLDING_REPOSITORY,
} from '../../securities.tokens';
import { SecuritiesAccountEntity } from '../../domain/entities/securities-account.entity';
import { HoldingEntity } from '../../domain/entities/holding.entity';
import { EncryptedCredentials } from '../../../institution/domain/value-objects/encrypted-credentials.vo';

describe('CalculatePortfolioValueUseCase', () => {
  let useCase: CalculatePortfolioValueUseCase;
  let accountRepository: jest.Mocked<ISecuritiesAccountRepository>;
  let holdingRepository: jest.Mocked<IHoldingRepository>;

  beforeEach(async () => {
    const mockAccountRepository = {
      findById: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    const mockHoldingRepository = {
      findByAccountId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalculatePortfolioValueUseCase,
        {
          provide: SECURITIES_ACCOUNT_REPOSITORY,
          useValue: mockAccountRepository,
        },
        {
          provide: HOLDING_REPOSITORY,
          useValue: mockHoldingRepository,
        },
      ],
    }).compile();

    useCase = module.get<CalculatePortfolioValueUseCase>(
      CalculatePortfolioValueUseCase,
    );
    accountRepository = module.get(SECURITIES_ACCOUNT_REPOSITORY);
    holdingRepository = module.get(HOLDING_REPOSITORY);
  });

  describe('execute', () => {
    const mockCredentials = new EncryptedCredentials(
      'encrypted_data',
      'iv',
      'authTag',
    );

    const mockAccount = new SecuritiesAccountEntity(
      'sec_test_123',
      'Test Securities',
      'ACC123',
      'general',
      mockCredentials,
      true,
      new Date('2024-01-01'),
      1000000,
      500000,
      new Date('2024-01-01'),
      new Date('2024-01-01'),
    );

    const mockHoldings = [
      new HoldingEntity(
        'holding_1',
        'sec_test_123',
        '1234',
        'Test Stock A',
        100,
        900,
        1000,
        'stock',
        'TSE',
        new Date('2024-01-01'),
      ),
      new HoldingEntity(
        'holding_2',
        'sec_test_123',
        '5678',
        'Test Stock B',
        50,
        1800,
        2000,
        'stock',
        'TSE',
        new Date('2024-01-01'),
      ),
    ];

    it('証券口座が存在しない場合、NotFoundExceptionをスローする', async () => {
      accountRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({ accountId: 'non_existent' }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        useCase.execute({ accountId: 'non_existent' }),
      ).rejects.toThrow('Securities account not found: non_existent');
    });

    it('保有銘柄が空の場合でもポートフォリオ価値を計算できる', async () => {
      accountRepository.findById.mockResolvedValue(mockAccount);
      holdingRepository.findByAccountId.mockResolvedValue([]);

      const result = await useCase.execute({ accountId: 'sec_test_123' });

      expect(result).toEqual({
        accountId: 'sec_test_123',
        accountName: 'Test Securities',
        portfolio: {
          totalEvaluationAmount: 0,
          totalAcquisitionAmount: 0,
          totalProfitLoss: 0,
          totalProfitLossRate: 0,
          holdingCount: 0,
          holdings: [],
        },
        cashBalance: 500000,
        totalAssets: 500000, // 現金残高のみ
      });
    });

    it('保有銘柄がある場合、正しくポートフォリオ価値を計算する', async () => {
      accountRepository.findById.mockResolvedValue(mockAccount);
      holdingRepository.findByAccountId.mockResolvedValue(mockHoldings);

      const result = await useCase.execute({ accountId: 'sec_test_123' });

      // 期待される評価額: (100株 × 1000円) + (50株 × 2000円) = 200,000円
      const expectedEvaluation = 100 * 1000 + 50 * 2000;
      const expectedTotalAssets = expectedEvaluation + 500000; // + 現金残高

      expect(result).toEqual({
        accountId: 'sec_test_123',
        accountName: 'Test Securities',
        portfolio: expect.objectContaining({
          totalEvaluationAmount: expectedEvaluation,
          holdings: expect.arrayContaining([
            expect.objectContaining({
              securityCode: '1234',
              securityName: 'Test Stock A',
              quantity: 100,
              currentPrice: 1000,
              evaluationAmount: 100000,
            }),
            expect.objectContaining({
              securityCode: '5678',
              securityName: 'Test Stock B',
              quantity: 50,
              currentPrice: 2000,
              evaluationAmount: 100000,
            }),
          ]),
        }),
        cashBalance: 500000,
        totalAssets: expectedTotalAssets,
      });

      expect(holdingRepository.findByAccountId).toHaveBeenCalledWith(
        'sec_test_123',
      );
    });

    it('評価額が変わっている場合、口座情報を更新する', async () => {
      // 現在の評価額が異なる口座
      const accountWithDifferentEvaluation = new SecuritiesAccountEntity(
        'sec_test_123',
        'Test Securities',
        'ACC123',
        'general',
        mockCredentials,
        true,
        new Date('2024-01-01'),
        500000, // 古い評価額
        500000,
        new Date('2024-01-01'),
        new Date('2024-01-01'),
      );

      accountRepository.findById.mockResolvedValue(
        accountWithDifferentEvaluation,
      );
      holdingRepository.findByAccountId.mockResolvedValue(mockHoldings);

      await useCase.execute({ accountId: 'sec_test_123' });

      // 新しい評価額: 200,000円
      const expectedEvaluation = 100 * 1000 + 50 * 2000;

      expect(accountRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'sec_test_123',
          totalEvaluationAmount: expectedEvaluation,
          cashBalance: 500000,
        }),
      );
    });

    it('評価額が変わっていない場合、口座情報を更新しない', async () => {
      // 評価額が一致する口座
      const expectedEvaluation = 100 * 1000 + 50 * 2000;
      const accountWithMatchingEvaluation = new SecuritiesAccountEntity(
        'sec_test_123',
        'Test Securities',
        'ACC123',
        'general',
        mockCredentials,
        true,
        new Date('2024-01-01'),
        expectedEvaluation, // 既に正しい評価額
        500000,
        new Date('2024-01-01'),
        new Date('2024-01-01'),
      );

      accountRepository.findById.mockResolvedValue(
        accountWithMatchingEvaluation,
      );
      holdingRepository.findByAccountId.mockResolvedValue(mockHoldings);

      await useCase.execute({ accountId: 'sec_test_123' });

      expect(accountRepository.update).not.toHaveBeenCalled();
    });
  });
});
