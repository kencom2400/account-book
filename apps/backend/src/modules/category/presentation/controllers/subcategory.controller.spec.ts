import { Test, TestingModule } from '@nestjs/testing';
import { SubcategoryController } from './subcategory.controller';
import { GetSubcategoriesUseCase } from '../../application/use-cases/get-subcategories.use-case';
import { GetSubcategoriesByCategoryUseCase } from '../../application/use-cases/get-subcategories-by-category.use-case';
import { ClassifySubcategoryUseCase } from '../../application/use-cases/classify-subcategory.use-case';
import { UpdateTransactionSubcategoryUseCase } from '../../application/use-cases/update-transaction-subcategory.use-case';
import {
  SUB_CATEGORY_REPOSITORY,
  ISubcategoryRepository,
} from '../../domain/repositories/subcategory.repository.interface';
import { MERCHANT_REPOSITORY } from '../../domain/repositories/merchant.repository.interface';
import { Subcategory } from '../../domain/entities/subcategory.entity';
import { Merchant } from '../../domain/entities/merchant.entity';
import { SubcategoryClassification } from '../../domain/value-objects/subcategory-classification.vo';
import { ClassificationConfidence } from '../../domain/value-objects/classification-confidence.vo';

describe('SubcategoryController', () => {
  let controller: SubcategoryController;
  let getSubcategoriesUseCase: jest.Mocked<GetSubcategoriesUseCase>;
  let getSubcategoriesByCategoryUseCase: jest.Mocked<GetSubcategoriesByCategoryUseCase>;
  let classifyUseCase: jest.Mocked<ClassifySubcategoryUseCase>;
  let updateSubcategoryUseCase: jest.Mocked<UpdateTransactionSubcategoryUseCase>;
  let subcategoryRepository: jest.Mocked<ISubcategoryRepository>;

  const mockSubcategory = new Subcategory(
    'sub_1',
    'expense',
    'Food & Dining',
    null,
    1,
    '🍔',
    '#FF0000',
    true,
    true,
    new Date(),
    new Date(),
  );

  const mockMerchant = new Merchant(
    'merchant_1',
    'Test Restaurant',
    'sub_1',
    ['test', 'restaurant'],
    true,
    new Date(),
    new Date(),
  );

  beforeEach(async () => {
    const mockGetSubcategoriesUseCase = {
      execute: jest.fn(),
    };

    const mockGetSubcategoriesByCategoryUseCase = {
      execute: jest.fn(),
    };

    const mockClassifyUseCase = {
      execute: jest.fn(),
    };

    const mockUpdateSubcategoryUseCase = {
      execute: jest.fn(),
    };

    const mockSubcategoryRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCategoryType: jest.fn(),
      save: jest.fn(),
    };

    const mockMerchantRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findBySubcategoryId: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubcategoryController],
      providers: [
        {
          provide: GetSubcategoriesUseCase,
          useValue: mockGetSubcategoriesUseCase,
        },
        {
          provide: GetSubcategoriesByCategoryUseCase,
          useValue: mockGetSubcategoriesByCategoryUseCase,
        },
        {
          provide: ClassifySubcategoryUseCase,
          useValue: mockClassifyUseCase,
        },
        {
          provide: UpdateTransactionSubcategoryUseCase,
          useValue: mockUpdateSubcategoryUseCase,
        },
        {
          provide: SUB_CATEGORY_REPOSITORY,
          useValue: mockSubcategoryRepo,
        },
        {
          provide: MERCHANT_REPOSITORY,
          useValue: mockMerchantRepo,
        },
      ],
    }).compile();

    module.useLogger(false);

    controller = module.get<SubcategoryController>(SubcategoryController);
    getSubcategoriesUseCase = module.get(GetSubcategoriesUseCase);
    getSubcategoriesByCategoryUseCase = module.get(
      GetSubcategoriesByCategoryUseCase,
    );
    classifyUseCase = module.get(ClassifySubcategoryUseCase);
    updateSubcategoryUseCase = module.get(UpdateTransactionSubcategoryUseCase);
    subcategoryRepository = module.get(SUB_CATEGORY_REPOSITORY);
  });

  describe('getAll', () => {
    it('should get all subcategories', async () => {
      getSubcategoriesUseCase.execute.mockResolvedValue({
        subcategories: [
          {
            id: 'sub_1',
            categoryType: 'expense',
            name: 'Food & Dining',
            parentId: null,
            displayOrder: 1,
            icon: '🍔',
            color: '#FF0000',
            isDefault: true,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            children: [],
          },
        ],
      });

      const result = await controller.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getByCategory', () => {
    it('should get subcategories by category type', async () => {
      getSubcategoriesByCategoryUseCase.execute.mockResolvedValue({
        subcategories: [
          {
            id: 'sub_1',
            categoryType: 'expense',
            name: 'Food & Dining',
            parentId: null,
            displayOrder: 1,
            icon: '🍔',
            color: '#FF0000',
            isDefault: true,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            children: [],
          },
        ],
      });

      const result = await controller.getByCategory('expense');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('classify', () => {
    it('should classify transaction', async () => {
      const confidence = new ClassificationConfidence(
        0.95,
        'High',
        'Very confident',
      );
      const classification = new SubcategoryClassification(
        'sub_1',
        'Food & Dining',
        'keyword_match',
        confidence,
      );

      classifyUseCase.execute.mockResolvedValue({
        classification,
        matchedMerchant: mockMerchant,
      });

      const result = await controller.classify({
        transactionId: 'tx_1',
        description: 'Test Restaurant',
        amount: 1000,
        merchantName: 'Test Restaurant',
      });

      expect(result.success).toBe(true);
      expect(result.data.subcategoryId).toBe('sub_1');
    });
  });

  describe('updateTransactionSubcategory', () => {
    it('should update transaction subcategory', async () => {
      updateSubcategoryUseCase.execute.mockResolvedValue({
        transaction: {
          id: 'tx_1',
          subcategoryId: 'sub_1',
          updatedAt: new Date(),
        } as any,
        previousSubcategoryId: null,
      });

      const result = await controller.updateTransactionSubcategory('tx_1', {
        subcategoryId: 'sub_1',
      });

      expect(result.success).toBe(true);
      expect(result.data.transaction.subcategoryId).toBe('sub_1');
    });
  });

  describe('getById', () => {
    it('should get subcategory by id', async () => {
      subcategoryRepository.findById.mockResolvedValue(mockSubcategory);

      const result = await controller.getById('sub_1');

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('sub_1');
    });

    it('should throw NotFoundException when subcategory not found', async () => {
      subcategoryRepository.findById.mockResolvedValue(null);

      await expect(controller.getById('nonexistent')).rejects.toThrow();
    });
  });
});
