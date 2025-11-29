import { Test, TestingModule } from '@nestjs/testing';
import { ClassifySubcategoryUseCase } from './classify-subcategory.use-case';
import { SubcategoryClassifierService } from '../../domain/services/subcategory-classifier.service';
import { SUB_CATEGORY_REPOSITORY } from '../../domain/repositories/subcategory.repository.interface';
import { MERCHANT_REPOSITORY } from '../../domain/repositories/merchant.repository.interface';
import { CategoryType } from '@account-book/types';
import { SubcategoryClassification } from '../../domain/value-objects/subcategory-classification.vo';
import { ClassificationConfidence } from '../../domain/value-objects/classification-confidence.vo';
import { ClassificationReason } from '../../domain/enums/classification-reason.enum';
import { Subcategory } from '../../domain/entities/subcategory.entity';
import { Merchant } from '../../domain/entities/merchant.entity';

describe('ClassifySubcategoryUseCase', () => {
  let useCase: ClassifySubcategoryUseCase;
  let mockClassifierService: jest.Mocked<SubcategoryClassifierService>;
  let mockSubcategoryRepository: any;
  let mockMerchantRepository: any;

  beforeEach(async () => {
    mockSubcategoryRepository = {
      findById: jest.fn(),
    };

    mockMerchantRepository = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassifySubcategoryUseCase,
        {
          provide: SubcategoryClassifierService,
          useValue: {
            classify: jest.fn(),
          },
        },
        {
          provide: SUB_CATEGORY_REPOSITORY,
          useValue: mockSubcategoryRepository,
        },
        {
          provide: MERCHANT_REPOSITORY,
          useValue: mockMerchantRepository,
        },
      ],
    }).compile();

    useCase = module.get<ClassifySubcategoryUseCase>(
      ClassifySubcategoryUseCase,
    );
    mockClassifierService = module.get(SubcategoryClassifierService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should classify transaction and return result with merchant match', async () => {
      // Arrange
      const dto = {
        description: 'スターバックス 表参道店',
        amount: -450,
        mainCategory: CategoryType.EXPENSE,
        transactionDate: new Date('2025-11-24T10:30:00.000Z'),
      };

      const classification = new SubcategoryClassification(
        'food_cafe',
        new ClassificationConfidence(0.98),
        ClassificationReason.MERCHANT_MATCH,
        'merchant_002',
      );

      const subcategory = new Subcategory(
        'food_cafe',
        CategoryType.EXPENSE,
        'カフェ',
        'food',
        3,
        '☕',
        '#795548',
        true,
        true,
      );

      const merchant = new Merchant(
        'merchant_002',
        'スターバックス',
        ['STARBUCKS', 'スタバ'],
        'food_cafe',
        0.98,
      );

      mockClassifierService.classify.mockResolvedValue(classification);
      mockSubcategoryRepository.findById.mockResolvedValue(subcategory);
      mockMerchantRepository.findById.mockResolvedValue(merchant);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result).toEqual({
        subcategoryId: 'food_cafe',
        subcategoryName: 'カフェ',
        categoryType: CategoryType.EXPENSE,
        parentId: 'food',
        displayOrder: 3,
        icon: '☕',
        color: '#795548',
        isDefault: true,
        isActive: true,
        confidence: 0.98,
        reason: ClassificationReason.MERCHANT_MATCH,
        merchantId: 'merchant_002',
        merchantName: 'スターバックス',
      });

      expect(mockClassifierService.classify).toHaveBeenCalledWith(
        dto.description,
        dto.amount,
        dto.mainCategory,
        dto.transactionDate,
      );
    });

    it('should classify transaction and return result with keyword match', async () => {
      // Arrange
      const dto = {
        description: '新宿駅 定期券購入',
        amount: -10000,
        mainCategory: CategoryType.EXPENSE,
      };

      const classification = new SubcategoryClassification(
        'transport_train_bus',
        new ClassificationConfidence(0.8),
        ClassificationReason.KEYWORD_MATCH,
      );

      const subcategory = new Subcategory(
        'transport_train_bus',
        CategoryType.EXPENSE,
        '電車・バス',
        'transport',
        1,
        '🚃',
        '#9C27B0',
        true,
        true,
      );

      mockClassifierService.classify.mockResolvedValue(classification);
      mockSubcategoryRepository.findById.mockResolvedValue(subcategory);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result).toEqual({
        subcategoryId: 'transport_train_bus',
        subcategoryName: '電車・バス',
        categoryType: CategoryType.EXPENSE,
        parentId: 'transport',
        displayOrder: 1,
        icon: '🚃',
        color: '#9C27B0',
        isDefault: true,
        isActive: true,
        confidence: 0.8,
        reason: ClassificationReason.KEYWORD_MATCH,
        merchantId: null,
        merchantName: null,
      });

      expect(mockClassifierService.classify).toHaveBeenCalledWith(
        dto.description,
        dto.amount,
        dto.mainCategory,
        undefined,
      );
    });

    it('should classify transaction and return result with default', async () => {
      // Arrange
      const dto = {
        description: '不明な取引',
        amount: -1000,
        mainCategory: CategoryType.EXPENSE,
      };

      const classification = new SubcategoryClassification(
        'other_expense',
        new ClassificationConfidence(0.5),
        ClassificationReason.DEFAULT,
      );

      const subcategory = new Subcategory(
        'other_expense',
        CategoryType.EXPENSE,
        'その他支出',
        null,
        999,
        '📦',
        '#9E9E9E',
        true,
        true,
      );

      mockClassifierService.classify.mockResolvedValue(classification);
      mockSubcategoryRepository.findById.mockResolvedValue(subcategory);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result).toEqual({
        subcategoryId: 'other_expense',
        subcategoryName: 'その他支出',
        categoryType: CategoryType.EXPENSE,
        parentId: null,
        displayOrder: 999,
        icon: '📦',
        color: '#9E9E9E',
        isDefault: true,
        isActive: true,
        confidence: 0.5,
        reason: ClassificationReason.DEFAULT,
        merchantId: null,
        merchantName: null,
      });
    });

    it('should map DTO correctly', async () => {
      // Arrange
      const dto = {
        description: 'テスト取引',
        amount: -500,
        mainCategory: CategoryType.EXPENSE,
        transactionDate: new Date('2025-11-24T10:00:00.000Z'),
      };

      const classification = new SubcategoryClassification(
        'test_subcategory',
        new ClassificationConfidence(0.9),
        ClassificationReason.MERCHANT_MATCH,
        'merchant_001',
      );

      const subcategory = new Subcategory(
        'test_subcategory',
        CategoryType.EXPENSE,
        'テストカテゴリ',
        'test_parent',
        10,
        '🧪',
        '#00BCD4',
        false,
        true,
      );

      const merchant = new Merchant(
        'merchant_001',
        'テスト店舗',
        ['TEST_STORE'],
        'test_subcategory',
        0.9,
      );

      mockClassifierService.classify.mockResolvedValue(classification);
      mockSubcategoryRepository.findById.mockResolvedValue(subcategory);
      mockMerchantRepository.findById.mockResolvedValue(merchant);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.subcategoryId).toBe('test_subcategory');
      expect(result.subcategoryName).toBe('テストカテゴリ');
      expect(result.confidence).toBe(0.9);
      expect(result.reason).toBe(ClassificationReason.MERCHANT_MATCH);
      expect(result.merchantId).toBe('merchant_001');
      expect(result.merchantName).toBe('テスト店舗');
    });
  });
});
