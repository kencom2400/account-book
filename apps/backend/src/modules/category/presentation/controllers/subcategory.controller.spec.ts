import { Test, TestingModule } from '@nestjs/testing';
import { SubcategoryController } from './subcategory.controller';
import { GetSubcategoriesUseCase } from '../../application/use-cases/get-subcategories.use-case';
import { GetSubcategoriesByCategoryUseCase } from '../../application/use-cases/get-subcategories-by-category.use-case';
import { ClassifySubcategoryUseCase } from '../../application/use-cases/classify-subcategory.use-case';
import { UpdateTransactionSubcategoryUseCase } from '../../application/use-cases/update-transaction-subcategory.use-case';
import { SUB_CATEGORY_REPOSITORY } from '../../domain/repositories/subcategory.repository.interface';
import { MERCHANT_REPOSITORY } from '../../domain/repositories/merchant.repository.interface';

describe('SubcategoryController', () => {
  let controller: SubcategoryController;
  let getSubcategoriesUseCase: jest.Mocked<GetSubcategoriesUseCase>;

  beforeEach(async () => {
    const mockGetSubcategoriesUseCase = {
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
          useValue: { execute: jest.fn() },
        },
        {
          provide: ClassifySubcategoryUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: UpdateTransactionSubcategoryUseCase,
          useValue: { execute: jest.fn() },
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
});
