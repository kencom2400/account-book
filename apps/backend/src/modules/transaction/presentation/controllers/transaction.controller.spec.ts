import { Test, TestingModule } from '@nestjs/testing';
import { TransactionController } from './transaction.controller';
import { CreateTransactionUseCase } from '../../application/use-cases/create-transaction.use-case';
import { GetTransactionsUseCase } from '../../application/use-cases/get-transactions.use-case';
import { UpdateTransactionCategoryUseCase } from '../../application/use-cases/update-transaction-category.use-case';
import { CalculateMonthlySummaryUseCase } from '../../application/use-cases/calculate-monthly-summary.use-case';
import { ClassifyTransactionUseCase } from '../../application/use-cases/classify-transaction.use-case';
import { ExportTransactionsUseCase } from '../../application/use-cases/export-transactions.use-case';
import { ExportFormat } from '../../application/services/export.service';
import { CategoryType, TransactionStatus } from '@account-book/types';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { Money } from '../../domain/value-objects/money.vo';
import { TransactionDate } from '../../domain/value-objects/transaction-date.vo';
import type { Response } from 'express';

describe('TransactionController', () => {
  let controller: TransactionController;
  let createUseCase: jest.Mocked<CreateTransactionUseCase>;
  let getUseCase: jest.Mocked<GetTransactionsUseCase>;
  let updateCategoryUseCase: jest.Mocked<UpdateTransactionCategoryUseCase>;
  let calculateSummaryUseCase: jest.Mocked<CalculateMonthlySummaryUseCase>;
  let classifyUseCase: jest.Mocked<ClassifyTransactionUseCase>;
  let exportUseCase: jest.Mocked<ExportTransactionsUseCase>;

  const mockTransaction = new TransactionEntity(
    'tx_1',
    new TransactionDate(new Date('2024-01-15')),
    new Money(1000),
    { id: 'cat_1', name: 'Food', type: CategoryType.EXPENSE },
    'Test transaction',
    'inst_1',
    'acc_1',
    TransactionStatus.COMPLETED,
    null,
    new Date(),
    new Date(),
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        {
          provide: CreateTransactionUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetTransactionsUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: UpdateTransactionCategoryUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: CalculateMonthlySummaryUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: ClassifyTransactionUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: ExportTransactionsUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<TransactionController>(TransactionController);
    createUseCase = module.get(CreateTransactionUseCase);
    getUseCase = module.get(GetTransactionsUseCase);
    updateCategoryUseCase = module.get(UpdateTransactionCategoryUseCase);
    calculateSummaryUseCase = module.get(CalculateMonthlySummaryUseCase);
    classifyUseCase = module.get(ClassifyTransactionUseCase);
    exportUseCase = module.get(ExportTransactionsUseCase);
  });

  describe('classify', () => {
    it('should classify transaction', async () => {
      const mockResult = {
        category: { id: 'cat_1', name: 'Food', type: CategoryType.EXPENSE },
        confidence: 0.9,
        confidenceLevel: 'high' as const,
        reason: 'Test reason',
      };

      classifyUseCase.execute.mockResolvedValue(mockResult);

      const result = await controller.classify({
        amount: 1000,
        description: 'Test',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
    });
  });

  describe('create', () => {
    it('should create transaction', async () => {
      createUseCase.execute.mockResolvedValue(mockTransaction);

      const result = await controller.create({
        date: '2024-01-15',
        amount: 1000,
        category: { id: 'cat_1', name: 'Food', type: CategoryType.EXPENSE },
        description: 'Test',
        institutionId: 'inst_1',
        accountId: 'acc_1',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTransaction.toJSON());
    });
  });

  describe('findAll', () => {
    it('should get transactions', async () => {
      getUseCase.execute.mockResolvedValue([mockTransaction]);

      const result = await controller.findAll({});

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.count).toBe(1);
    });
  });

  describe('updateCategory', () => {
    it('should update transaction category', async () => {
      updateCategoryUseCase.execute.mockResolvedValue(mockTransaction);

      const result = await controller.updateCategory('tx_1', {
        category: {
          id: 'cat_2',
          name: 'Transport',
          type: CategoryType.EXPENSE,
        },
      });

      expect(result.success).toBe(true);
    });
  });

  describe('getMonthlySummary', () => {
    it('should get monthly summary', async () => {
      const mockSummary = {
        year: 2024,
        month: 1,
        totalIncome: 10000,
        totalExpense: 5000,
        balance: 5000,
        categoryBreakdown: [],
        institutionBreakdown: [],
      };

      calculateSummaryUseCase.execute.mockResolvedValue(mockSummary);

      const result = await controller.getMonthlySummary('2024', '1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSummary);
    });
  });

  describe('export', () => {
    it('CSV形式でエクスポートできる', async () => {
      const mockResult = {
        content: 'CSV content',
        filename: 'transactions_2024-01.csv',
        mimeType: 'text/csv; charset=utf-8',
      };

      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      exportUseCase.execute.mockResolvedValue(mockResult);

      await controller.export(
        {
          format: ExportFormat.CSV,
          year: '2024',
          month: '1',
        },
        mockResponse,
      );

      expect(exportUseCase.execute).toHaveBeenCalledWith({
        format: ExportFormat.CSV,
        year: 2024,
        month: 1,
      });
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/csv; charset=utf-8',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="transactions_2024-01.csv"',
      );
      expect(mockResponse.send).toHaveBeenCalledWith('CSV content');
    });

    it('JSON形式でエクスポートできる', async () => {
      const mockResult = {
        content: '{"id":"tx_1"}',
        filename: 'transactions_2024-01.json',
        mimeType: 'application/json; charset=utf-8',
      };

      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      exportUseCase.execute.mockResolvedValue(mockResult);

      await controller.export(
        {
          format: ExportFormat.JSON,
          year: '2024',
          month: '1',
        },
        mockResponse,
      );

      expect(exportUseCase.execute).toHaveBeenCalledWith({
        format: ExportFormat.JSON,
        year: 2024,
        month: 1,
      });
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/json; charset=utf-8',
      );
      expect(mockResponse.send).toHaveBeenCalledWith('{"id":"tx_1"}');
    });

    it('期間指定でエクスポートできる', async () => {
      const mockResult = {
        content: 'CSV content',
        filename: 'transactions_2024-01-01_2024-01-31.csv',
        mimeType: 'text/csv; charset=utf-8',
      };

      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      exportUseCase.execute.mockResolvedValue(mockResult);

      await controller.export(
        {
          format: ExportFormat.CSV,
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        mockResponse,
      );

      expect(exportUseCase.execute).toHaveBeenCalledWith({
        format: ExportFormat.CSV,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });
    });
  });
});
