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
  let getCategoryByIdUseCase: jest.Mocked<GetCategoryByIdUseCase>;
  let createCategoryUseCase: jest.Mocked<CreateCategoryUseCase>;
  let updateCategoryUseCase: jest.Mocked<UpdateCategoryUseCase>;
  let deleteCategoryUseCase: jest.Mocked<DeleteCategoryUseCase>;
  let checkCategoryUsageUseCase: jest.Mocked<CheckCategoryUsageUseCase>;

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
    getCategoryByIdUseCase = module.get(GetCategoryByIdUseCase);
    createCategoryUseCase = module.get(CreateCategoryUseCase);
    updateCategoryUseCase = module.get(UpdateCategoryUseCase);
    deleteCategoryUseCase = module.get(DeleteCategoryUseCase);
    checkCategoryUsageUseCase = module.get(CheckCategoryUsageUseCase);
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

    it('should filter by type', async () => {
      getCategoriesUseCase.execute.mockResolvedValue([mockCategory]);

      const result = await controller.findAll({ type: CategoryType.EXPENSE });

      expect(result.success).toBe(true);
      expect(getCategoriesUseCase.execute).toHaveBeenCalledWith({
        type: CategoryType.EXPENSE,
        parentId: undefined,
        isTopLevel: false,
        asTree: false,
      });
    });

    it('should filter by parentId', async () => {
      getCategoriesUseCase.execute.mockResolvedValue([mockCategory]);

      const result = await controller.findAll({ parentId: 'parent_1' });

      expect(result.success).toBe(true);
      expect(getCategoriesUseCase.execute).toHaveBeenCalledWith({
        type: undefined,
        parentId: 'parent_1',
        isTopLevel: false,
        asTree: false,
      });
    });

    it('should filter by isTopLevel when true', async () => {
      getCategoriesUseCase.execute.mockResolvedValue([mockCategory]);

      const result = await controller.findAll({ isTopLevel: 'true' });

      expect(result.success).toBe(true);
      expect(getCategoriesUseCase.execute).toHaveBeenCalledWith({
        type: undefined,
        parentId: undefined,
        isTopLevel: true,
        asTree: false,
      });
    });

    it('should filter by isTopLevel when false', async () => {
      getCategoriesUseCase.execute.mockResolvedValue([mockCategory]);

      const result = await controller.findAll({ isTopLevel: 'false' });

      expect(result.success).toBe(true);
      expect(getCategoriesUseCase.execute).toHaveBeenCalledWith({
        type: undefined,
        parentId: undefined,
        isTopLevel: false,
        asTree: false,
      });
    });
  });

  describe('findOne', () => {
    it('should find category by id', async () => {
      getCategoryByIdUseCase.execute.mockResolvedValue({
        category: mockCategory,
      });

      const result = await controller.findOne('cat_1');

      expect(result).toEqual(mockCategory.toJSON());
      expect(getCategoryByIdUseCase.execute).toHaveBeenCalledWith('cat_1');
    });
  });

  describe('create', () => {
    it('should create a category', async () => {
      createCategoryUseCase.execute.mockResolvedValue({
        category: mockCategory,
      });

      const dto = {
        name: 'Food',
        type: CategoryType.EXPENSE,
        parentId: null,
        icon: 'food',
        color: null,
      };

      const result = await controller.create(dto);

      expect(result).toEqual(mockCategory.toJSON());
      expect(createCategoryUseCase.execute).toHaveBeenCalledWith({
        name: 'Food',
        type: CategoryType.EXPENSE,
        parentId: null,
        icon: 'food',
        color: null,
      });
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const updatedCategory = new CategoryEntity(
        'cat_1',
        'Updated Food',
        CategoryType.EXPENSE,
        null,
        'updated-food',
        '#FF0000',
        false,
        1,
        new Date(),
        new Date(),
      );

      updateCategoryUseCase.execute.mockResolvedValue({
        category: updatedCategory,
      });

      const dto = {
        name: 'Updated Food',
        icon: 'updated-food',
        color: '#FF0000',
      };

      const result = await controller.update('cat_1', dto);

      expect(result).toEqual(updatedCategory.toJSON());
      expect(updateCategoryUseCase.execute).toHaveBeenCalledWith('cat_1', {
        name: 'Updated Food',
        icon: 'updated-food',
        color: '#FF0000',
      });
    });
  });

  describe('delete', () => {
    it('should delete a category', async () => {
      deleteCategoryUseCase.execute.mockResolvedValue({
        success: true,
        message: 'Category deleted successfully',
      });

      const result = await controller.delete('cat_1');

      expect(result.success).toBe(true);
      expect(deleteCategoryUseCase.execute).toHaveBeenCalledWith(
        'cat_1',
        undefined,
      );
    });

    it('should delete a category with replacement', async () => {
      deleteCategoryUseCase.execute.mockResolvedValue({
        success: true,
        message: 'Category deleted successfully',
      });

      const result = await controller.delete('cat_1', 'cat_2');

      expect(result.success).toBe(true);
      expect(deleteCategoryUseCase.execute).toHaveBeenCalledWith(
        'cat_1',
        'cat_2',
      );
    });
  });

  describe('checkUsage', () => {
    it('should check category usage', async () => {
      checkCategoryUsageUseCase.execute.mockResolvedValue({
        isUsed: true,
        transactionCount: 10,
        message: 'Category is used in 10 transactions',
      });

      const result = await controller.checkUsage('cat_1');

      expect(result.isUsed).toBe(true);
      expect(result.transactionCount).toBe(10);
      expect(checkCategoryUsageUseCase.execute).toHaveBeenCalledWith('cat_1');
    });
  });
});
