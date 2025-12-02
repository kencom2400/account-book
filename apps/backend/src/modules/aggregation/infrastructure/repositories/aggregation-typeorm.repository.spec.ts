import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MonthlyCardSummary } from '../../domain/entities/monthly-card-summary.entity';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import { CategoryAmount } from '../../domain/value-objects/category-amount.vo';
import { MonthlyCardSummaryOrmEntity } from '../entities/monthly-card-summary.orm-entity';
import { AggregationTypeOrmRepository } from './aggregation-typeorm.repository';

describe('AggregationTypeOrmRepository', () => {
  let repository: AggregationTypeOrmRepository;
  let typeOrmRepository: jest.Mocked<Repository<MonthlyCardSummaryOrmEntity>>;

  const mockOrmEntity: MonthlyCardSummaryOrmEntity = {
    id: 'summary-123',
    cardId: 'card-456',
    cardName: '楽天カード',
    billingMonth: '2025-01',
    closingDate: new Date('2025-01-31'),
    paymentDate: new Date('2025-02-27'),
    totalAmount: 50000,
    transactionCount: 5,
    transactionIds: ['tx-001', 'tx-002', 'tx-003', 'tx-004', 'tx-005'],
    categoryBreakdown: [
      { category: '食費', amount: 30000, count: 3 },
      { category: '交通費', amount: 20000, count: 2 },
    ],
    netPaymentAmount: 50000,
    status: PaymentStatus.PENDING,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockDomainEntity = new MonthlyCardSummary(
    'summary-123',
    'card-456',
    '楽天カード',
    '2025-01',
    new Date('2025-01-31'),
    new Date('2025-02-27'),
    50000,
    5,
    [
      new CategoryAmount('食費', 30000, 3),
      new CategoryAmount('交通費', 20000, 2),
    ],
    ['tx-001', 'tx-002', 'tx-003', 'tx-004', 'tx-005'],
    50000,
    PaymentStatus.PENDING,
    new Date('2025-01-01'),
    new Date('2025-01-01'),
  );

  beforeEach(async () => {
    typeOrmRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<MonthlyCardSummaryOrmEntity>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AggregationTypeOrmRepository,
        {
          provide: getRepositoryToken(MonthlyCardSummaryOrmEntity),
          useValue: typeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<AggregationTypeOrmRepository>(
      AggregationTypeOrmRepository,
    );
  });

  describe('save', () => {
    it('集計データを保存できる', async () => {
      typeOrmRepository.create.mockReturnValue(mockOrmEntity);
      typeOrmRepository.save.mockResolvedValue(mockOrmEntity);

      const result = await repository.save(mockDomainEntity);

      expect(typeOrmRepository.save).toHaveBeenCalled();
      expect(result).toBeInstanceOf(MonthlyCardSummary);
      expect(result.id).toBe('summary-123');
      expect(result.billingMonth).toBe('2025-01');
    });
  });

  describe('findById', () => {
    it('IDで集計データを取得できる', async () => {
      typeOrmRepository.findOne.mockResolvedValue(mockOrmEntity);

      const result = await repository.findById('summary-123');

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'summary-123' },
      });
      expect(result).toBeInstanceOf(MonthlyCardSummary);
      expect(result?.id).toBe('summary-123');
    });

    it('データが存在しない場合、nullを返す', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByCardAndMonth', () => {
    it('カードIDと請求月で集計データを取得できる', async () => {
      typeOrmRepository.findOne.mockResolvedValue(mockOrmEntity);

      const result = await repository.findByCardAndMonth('card-456', '2025-01');

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { cardId: 'card-456', billingMonth: '2025-01' },
      });
      expect(result).toBeInstanceOf(MonthlyCardSummary);
      expect(result?.cardId).toBe('card-456');
      expect(result?.billingMonth).toBe('2025-01');
    });

    it('データが存在しない場合、nullを返す', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByCardAndMonth('card-456', '2025-12');

      expect(result).toBeNull();
    });
  });

  describe('findByCard', () => {
    it('カードIDと期間で集計データを取得できる', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockOrmEntity]),
      };

      typeOrmRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await repository.findByCard(
        'card-456',
        '2025-01',
        '2025-03',
      );

      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
        'summary',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'summary.cardId = :cardId',
        { cardId: 'card-456' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'summary.billingMonth >= :startMonth',
        { startMonth: '2025-01' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'summary.billingMonth <= :endMonth',
        { endMonth: '2025-03' },
      );
      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'summary.billingMonth',
        'ASC',
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(MonthlyCardSummary);
    });
  });

  describe('findAllByCardId', () => {
    it('カードIDで集計データをすべて取得できる', async () => {
      typeOrmRepository.find.mockResolvedValue([mockOrmEntity]);

      const result = await repository.findAllByCardId('card-456');

      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { cardId: 'card-456' },
        order: { billingMonth: 'DESC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(MonthlyCardSummary);
      expect(result[0]?.cardId).toBe('card-456');
    });

    it('該当するデータがない場合、空配列を返す', async () => {
      typeOrmRepository.find.mockResolvedValue([]);

      const result = await repository.findAllByCardId('non-existent-card');

      expect(result).toHaveLength(0);
    });
  });

  describe('findAll', () => {
    it('すべての集計データを取得できる', async () => {
      typeOrmRepository.find.mockResolvedValue([mockOrmEntity]);

      const result = await repository.findAll();

      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        order: { billingMonth: 'DESC', cardName: 'ASC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(MonthlyCardSummary);
    });
  });

  describe('delete', () => {
    it('集計データを削除できる', async () => {
      typeOrmRepository.delete.mockResolvedValue({} as any);

      await repository.delete('summary-123');

      expect(typeOrmRepository.delete).toHaveBeenCalledWith('summary-123');
    });
  });

  describe('toDomain/toOrm変換', () => {
    it('CategoryAmountが正しく変換される', async () => {
      typeOrmRepository.findOne.mockResolvedValue(mockOrmEntity);

      const result = await repository.findById('summary-123');

      expect(result?.categoryBreakdown).toHaveLength(2);
      expect(result?.categoryBreakdown[0]).toBeInstanceOf(CategoryAmount);
      expect(result?.categoryBreakdown[0].category).toBe('食費');
      expect(result?.categoryBreakdown[0].amount).toBe(30000);
      expect(result?.categoryBreakdown[0].count).toBe(3);
    });

    it('PaymentStatusが正しく変換される', async () => {
      typeOrmRepository.findOne.mockResolvedValue(mockOrmEntity);

      const result = await repository.findById('summary-123');

      expect(result?.status).toBe(PaymentStatus.PENDING);
    });
  });
});
