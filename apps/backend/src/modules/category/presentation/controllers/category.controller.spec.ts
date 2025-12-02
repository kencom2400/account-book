import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { InitializeCategoriesUseCase } from '../../application/use-cases/initialize-categories.use-case';
import { GetCategoriesUseCase } from '../../application/use-cases/get-categories.use-case';
import { GetCategoryByIdUseCase } from '../../application/use-cases/get-category-by-id.use-case';
import { CreateCategoryUseCase } from '../../application/use-cases/create-category.use-case';
import { UpdateCategoryUseCase } from '../../application/use-cases/update-category.use-case';
import { DeleteCategoryUseCase } from '../../application/use-cases/delete-category.use-case';
import { CheckCategoryUsageUseCase } from '../../application/use-cases/check-category-usage.use-case';
import { CategoryEntity } from '../../domain/entities/category.entity';
import { CategoryType } from '@account-book/types';

describe('CategoryController', () => {
  let controller: CategoryController;
  let initializeUseCase: jest.Mocked<InitializeCategoriesUseCase>;
  let getCategoriesUseCase: jest.Mocked<GetCategoriesUseCase>;

  const mockCategory = new CategoryEntity(
    'cat_1',
    'Food',
    CategoryType.EXPENSE,
    null,
    'food',
    null,
    false,
    1,
    new Date(),
    new Date(),
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: InitializeCategoriesUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetCategoriesUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetCategoryByIdUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: CreateCategoryUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: UpdateCategoryUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: DeleteCategoryUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: CheckCategoryUsageUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
    initializeUseCase = module.get(InitializeCategoriesUseCase);
    getCategoriesUseCase = module.get(GetCategoriesUseCase);
  });

  describe('initialize', () => {
    it('should initialize categories', async () => {
      initializeUseCase.execute.mockResolvedValue([mockCategory]);

      const result = await controller.initialize();

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(result.message).toBe('Categories initialized successfully');
    });
  });

  describe('findAll', () => {
    it('should find all categories', async () => {
      getCategoriesUseCase.execute.mockResolvedValue([mockCategory]);

      const result = await controller.findAll({});

      expect(result.success).toBe(true);
      expect('count' in result && result.count).toBe(1);
    });

    it('should return tree structure when asTree is true', async () => {
      const mockTree = {
        category: mockCategory,
        children: [],
      };

      getCategoriesUseCase.execute.mockResolvedValue([mockTree]);

      const result = await controller.findAll({ asTree: 'true' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockTree]);
    });
  });
});
