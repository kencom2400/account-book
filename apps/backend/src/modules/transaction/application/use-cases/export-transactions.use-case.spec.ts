import { Test, TestingModule } from '@nestjs/testing';
import { ExportTransactionsUseCase } from './export-transactions.use-case';
import { GetTransactionsUseCase } from './get-transactions.use-case';
import { ExportService, ExportFormat } from '../services/export.service';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { CategoryType, TransactionStatus } from '@account-book/types';

describe('ExportTransactionsUseCase', () => {
  let useCase: ExportTransactionsUseCase;
  let getTransactionsUseCase: jest.Mocked<GetTransactionsUseCase>;
  let exportService: jest.Mocked<ExportService>;

  const createTransaction = (
    id: string,
    date: Date,
    amount: number,
  ): TransactionEntity => {
    return new TransactionEntity(
      id,
      date,
      amount,
      { id: 'cat_1', name: '食費', type: CategoryType.EXPENSE },
      'テスト取引',
      'inst_1',
      'acc_1',
      TransactionStatus.COMPLETED,
      false,
      null,
      new Date('2024-01-15T10:00:00Z'),
      new Date('2024-01-15T10:00:00Z'),
    );
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportTransactionsUseCase,
        {
          provide: GetTransactionsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: ExportService,
          useValue: {
            convertToCSV: jest.fn(),
            convertToJSON: jest.fn(),
            formatDate: jest.fn((date: Date) => {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            }),
          },
        },
      ],
    }).compile();

    useCase = module.get<ExportTransactionsUseCase>(ExportTransactionsUseCase);
    getTransactionsUseCase = module.get(GetTransactionsUseCase);
    exportService = module.get(ExportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('CSV形式でエクスポートできる', async () => {
      const transactions = [
        createTransaction('tx_1', new Date('2024-01-15'), 1000),
      ];

      getTransactionsUseCase.execute.mockResolvedValue(transactions);
      exportService.convertToCSV.mockReturnValue('CSV content');

      const result = await useCase.execute({
        format: ExportFormat.CSV,
      });

      expect(result.content).toBe('CSV content');
      expect(result.filename).toContain('.csv');
      expect(result.mimeType).toBe('text/csv; charset=utf-8');
      expect(getTransactionsUseCase.execute).toHaveBeenCalledWith({});
      expect(exportService.convertToCSV).toHaveBeenCalledWith(transactions);
    });

    it('JSON形式でエクスポートできる', async () => {
      const transactions = [
        createTransaction('tx_1', new Date('2024-01-15'), 1000),
      ];

      getTransactionsUseCase.execute.mockResolvedValue(transactions);
      exportService.convertToJSON.mockReturnValue('{"id":"tx_1"}');

      const result = await useCase.execute({
        format: ExportFormat.JSON,
      });

      expect(result.content).toBe('{"id":"tx_1"}');
      expect(result.filename).toContain('.json');
      expect(result.mimeType).toBe('application/json; charset=utf-8');
      expect(getTransactionsUseCase.execute).toHaveBeenCalledWith({});
      expect(exportService.convertToJSON).toHaveBeenCalledWith(transactions);
    });

    it('年・月指定がある場合、ファイル名に年月を含める', async () => {
      const transactions = [
        createTransaction('tx_1', new Date('2024-01-15'), 1000),
      ];

      getTransactionsUseCase.execute.mockResolvedValue(transactions);
      exportService.convertToCSV.mockReturnValue('CSV content');

      const result = await useCase.execute({
        format: ExportFormat.CSV,
        year: 2024,
        month: 1,
      });

      expect(result.filename).toBe('transactions_2024-01.csv');
      expect(getTransactionsUseCase.execute).toHaveBeenCalledWith({
        year: 2024,
        month: 1,
      });
    });

    it('年のみ指定がある場合、ファイル名に年を含める', async () => {
      const transactions = [
        createTransaction('tx_1', new Date('2024-01-15'), 1000),
      ];

      getTransactionsUseCase.execute.mockResolvedValue(transactions);
      exportService.convertToCSV.mockReturnValue('CSV content');

      const result = await useCase.execute({
        format: ExportFormat.CSV,
        year: 2024,
      });

      expect(result.filename).toBe('transactions_2024.csv');
      expect(getTransactionsUseCase.execute).toHaveBeenCalledWith({
        year: 2024,
      });
    });

    it('期間指定がある場合、ファイル名に期間を含める', async () => {
      const transactions = [
        createTransaction('tx_1', new Date('2024-01-15'), 1000),
      ];

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      getTransactionsUseCase.execute.mockResolvedValue(transactions);
      exportService.convertToCSV.mockReturnValue('CSV content');

      const result = await useCase.execute({
        format: ExportFormat.CSV,
        startDate,
        endDate,
      });

      expect(result.filename).toBe('transactions_2024-01-01_2024-01-31.csv');
      expect(getTransactionsUseCase.execute).toHaveBeenCalledWith({
        startDate,
        endDate,
      });
    });

    it('指定がない場合、現在日付を含むファイル名を生成', async () => {
      const transactions = [
        createTransaction('tx_1', new Date('2024-01-15'), 1000),
      ];

      getTransactionsUseCase.execute.mockResolvedValue(transactions);
      exportService.convertToCSV.mockReturnValue('CSV content');

      const result = await useCase.execute({
        format: ExportFormat.CSV,
      });

      // 現在日付を含むファイル名（形式: transactions_YYYY-MM-DD.csv）
      expect(result.filename).toMatch(/^transactions_\d{4}-\d{2}-\d{2}\.csv$/);
    });

    it('金融機関IDでフィルタリングできる', async () => {
      const transactions = [
        createTransaction('tx_1', new Date('2024-01-15'), 1000),
      ];

      getTransactionsUseCase.execute.mockResolvedValue(transactions);
      exportService.convertToCSV.mockReturnValue('CSV content');

      await useCase.execute({
        format: ExportFormat.CSV,
        institutionId: 'inst_1',
      });

      expect(getTransactionsUseCase.execute).toHaveBeenCalledWith({
        institutionId: 'inst_1',
      });
    });

    it('口座IDでフィルタリングできる', async () => {
      const transactions = [
        createTransaction('tx_1', new Date('2024-01-15'), 1000),
      ];

      getTransactionsUseCase.execute.mockResolvedValue(transactions);
      exportService.convertToCSV.mockReturnValue('CSV content');

      await useCase.execute({
        format: ExportFormat.CSV,
        accountId: 'acc_1',
      });

      expect(getTransactionsUseCase.execute).toHaveBeenCalledWith({
        accountId: 'acc_1',
      });
    });

    it('空の取引データでもエクスポートできる', async () => {
      getTransactionsUseCase.execute.mockResolvedValue([]);
      exportService.convertToCSV.mockReturnValue('');

      const result = await useCase.execute({
        format: ExportFormat.CSV,
      });

      expect(result.content).toBe('');
      expect(result.filename).toContain('.csv');
      expect(exportService.convertToCSV).toHaveBeenCalledWith([]);
    });
  });
});
