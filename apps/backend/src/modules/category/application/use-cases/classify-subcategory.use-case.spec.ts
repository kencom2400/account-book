import { Test, TestingModule } from '@nestjs/testing';
import { ClassifySubcategoryUseCase } from './classify-subcategory.use-case';
import { SubcategoryClassifierService } from '../../domain/services/subcategory-classifier.service';
import { SUB_CATEGORY_REPOSITORY } from '../../domain/repositories/subcategory.repository.interface';
import { CategoryType } from '@account-book/types';
import { SubcategoryClassification } from '../../domain/value-objects/subcategory-classification.vo';
import { ClassificationConfidence } from '../../domain/value-objects/classification-confidence.vo';
import { ClassificationReason } from '../../domain/enums/classification-reason.enum';

describe('ClassifySubcategoryUseCase', () => {
  let useCase: ClassifySubcategoryUseCase;
  let mockClassifierService: jest.Mocked<SubcategoryClassifierService>;

  beforeEach(async () => {
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
          useValue: {},
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

      mockClassifierService.classify.mockResolvedValue(classification);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result).toEqual({
        subcategoryId: 'food_cafe',
        confidence: 0.98,
        reason: ClassificationReason.MERCHANT_MATCH,
        merchantId: 'merchant_002',
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

      mockClassifierService.classify.mockResolvedValue(classification);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result).toEqual({
        subcategoryId: 'transport_train_bus',
        confidence: 0.8,
        reason: ClassificationReason.KEYWORD_MATCH,
        merchantId: undefined,
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

      mockClassifierService.classify.mockResolvedValue(classification);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result).toEqual({
        subcategoryId: 'other_expense',
        confidence: 0.5,
        reason: ClassificationReason.DEFAULT,
        merchantId: undefined,
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

      mockClassifierService.classify.mockResolvedValue(classification);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.subcategoryId).toBe('test_subcategory');
      expect(result.confidence).toBe(0.9);
      expect(result.reason).toBe(ClassificationReason.MERCHANT_MATCH);
      expect(result.merchantId).toBe('merchant_001');
    });
  });
});
