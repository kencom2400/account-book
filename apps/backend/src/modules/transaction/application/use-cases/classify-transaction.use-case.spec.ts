import { Test, TestingModule } from '@nestjs/testing';
import { ClassifyTransactionUseCase } from './classify-transaction.use-case';
import { CategoryClassificationService } from '../../domain/services/category-classification.service';
import { CATEGORY_REPOSITORY } from '../../../category/domain/repositories/category.repository.interface';
import { CategoryType } from '@account-book/types';
import { CategoryEntity } from '../../../category/domain/entities/category.entity';

describe('ClassifyTransactionUseCase', () => {
  let useCase: ClassifyTransactionUseCase;

  const mockCategoryRepository = {
    findByType: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findAll: jest.fn(),
    findByParentId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassifyTransactionUseCase,
        CategoryClassificationService,
        {
          provide: CATEGORY_REPOSITORY,
          useValue: mockCategoryRepository,
        },
      ],
    }).compile();

    useCase = module.get<ClassifyTransactionUseCase>(
      ClassifyTransactionUseCase,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('取引データを正しく分類し、カテゴリ情報を返す', async () => {
      // 収入カテゴリを作成
      const incomeCategory = new CategoryEntity(
        'income-salary',
        '給与所得',
        CategoryType.INCOME,
        null,
        '💰',
        '#4CAF50',
        true,
        1,
        new Date('2023-01-01T00:00:00Z'),
        new Date('2023-01-01T00:00:00Z'),
      );

      // モックの設定
      mockCategoryRepository.findByType.mockResolvedValue([incomeCategory]);

      // 実行
      const result = await useCase.execute({
        amount: 300000,
        description: '給与振込',
        institutionId: 'inst-1',
      });

      // 検証
      expect(result.category.type).toBe(CategoryType.INCOME);
      expect(result.category.id).toBe('income-salary');
      expect(result.category.name).toBe('給与所得');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.reason).toBeDefined();
    });

    it('支出として分類される取引を正しく処理する', async () => {
      // 支出カテゴリを作成
      const expenseCategory = new CategoryEntity(
        'expense-food',
        '食費',
        CategoryType.EXPENSE,
        null,
        '🍽️',
        '#FF5722',
        true,
        1,
        new Date('2023-01-01T00:00:00Z'),
        new Date('2023-01-01T00:00:00Z'),
      );

      // モックの設定
      mockCategoryRepository.findByType.mockResolvedValue([expenseCategory]);

      // 実行
      const result = await useCase.execute({
        amount: -1500,
        description: 'コンビニ',
        institutionId: 'inst-1',
      });

      // 検証
      expect(result.category.type).toBe(CategoryType.EXPENSE);
      expect(result.category.id).toBe('expense-food');
      expect(result.category.name).toBe('食費');
      expect(result.confidence).toBeGreaterThan(0.7); // キーワードマッチのため0.7以上
    });

    it('証券口座の取引は投資カテゴリに分類される', async () => {
      // 投資カテゴリを作成
      const investmentCategory = new CategoryEntity(
        'investment-stocks',
        '株式',
        CategoryType.INVESTMENT,
        null,
        '📈',
        '#2196F3',
        true,
        1,
        new Date('2023-01-01T00:00:00Z'),
        new Date('2023-01-01T00:00:00Z'),
      );

      // モックの設定
      mockCategoryRepository.findByType.mockResolvedValue([investmentCategory]);

      // 実行
      const result = await useCase.execute({
        amount: -50000,
        description: '株式購入',
        institutionId: 'inst-1',
        institutionType: 'securities',
      });

      // 検証
      expect(result.category.type).toBe(CategoryType.INVESTMENT);
      expect(result.category.id).toBe('investment-stocks');
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.reason).toContain('証券');
    });

    it('トップレベルカテゴリが複数ある場合、orderの小さい方を返す', async () => {
      // 複数の収入カテゴリを作成
      const incomeCategory1 = new CategoryEntity(
        'income-other',
        'その他収入',
        CategoryType.INCOME,
        null,
        '💵',
        '#4CAF50',
        true,
        4,
        new Date('2023-01-01T00:00:00Z'),
        new Date('2023-01-01T00:00:00Z'),
      );

      const incomeCategory2 = new CategoryEntity(
        'income-salary',
        '給与所得',
        CategoryType.INCOME,
        null,
        '💰',
        '#4CAF50',
        true,
        1,
        new Date('2023-01-01T00:00:00Z'),
        new Date('2023-01-01T00:00:00Z'),
      );

      // モックの設定
      mockCategoryRepository.findByType.mockResolvedValue([
        incomeCategory1,
        incomeCategory2,
      ]);

      // 実行
      const result = await useCase.execute({
        amount: 10000,
        description: '入金',
        institutionId: 'inst-1',
      });

      // 検証（orderが1の方が選ばれる）
      expect(result.category.id).toBe('income-salary');
      expect(result.category.name).toBe('給与所得');
    });

    it('カテゴリが見つからない場合、デフォルトカテゴリを返す', async () => {
      // モックの設定（空配列を返す）
      mockCategoryRepository.findByType.mockResolvedValue([]);

      // 実行
      const result = await useCase.execute({
        amount: 10000,
        description: '入金',
        institutionId: 'inst-1',
      });

      // 検証（デフォルトカテゴリが使用される）
      expect(result.category.type).toBe(CategoryType.INCOME);
      expect(result.category.name).toBe('収入');
    });
  });
});
