import { Test, TestingModule } from '@nestjs/testing';
import { CategoryType } from '@account-book/types';
import { GetCategoriesUseCase } from './get-categories.use-case';
import { CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository.interface';
import type { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { CategoryDomainService } from '../../domain/services/category-domain.service';
import { CategoryEntity } from '../../domain/entities/category.entity';

describe('GetCategoriesUseCase', () => {
  let useCase: GetCategoriesUseCase;
  let repository: jest.Mocked<ICategoryRepository>;
  let domainService: jest.Mocked<CategoryDomainService>;

  const mockCategories = [
    new CategoryEntity(
      'cat_1',
      '食費',
      CategoryType.EXPENSE,
      null,
      null,
      null,
      false,
      1,
      new Date(),
      new Date(),
    ),
    new CategoryEntity(
      'cat_2',
      '交通費',
      CategoryType.EXPENSE,
      null,
      null,
      null,
      false,
      2,
      new Date(),
      new Date(),
    ),
    new CategoryEntity(
      'cat_3',
      '給与',
      CategoryType.INCOME,
      null,
      null,
      null,
      false,
      1,
      new Date(),
      new Date(),
    ),
  ];

  beforeEach(async () => {
    const mockRepo = {
      findAll: jest.fn(),
      findByType: jest.fn(),
      findByParentId: jest.fn(),
      findTopLevel: jest.fn(),
      save: jest.fn(),
    };

    const mockService = {
      buildCategoryTree: jest.fn(),
      createDefaultCategories: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCategoriesUseCase,
        {
          provide: CATEGORY_REPOSITORY,
          useValue: mockRepo,
        },
        {
          provide: CategoryDomainService,
          useValue: mockService,
        },
      ],
    }).compile();

    useCase = module.get<GetCategoriesUseCase>(GetCategoriesUseCase);
    repository = module.get(CATEGORY_REPOSITORY);
    domainService = module.get(CategoryDomainService);
  });

  describe('execute', () => {
    it('should get all categories when no query provided', async () => {
      repository.findAll.mockResolvedValue(mockCategories);

      const result = await useCase.execute();

      expect(repository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(3);
    });

    it('should get categories by type', async () => {
      const expenseCategories = mockCategories.filter(
        (c) => c.type === CategoryType.EXPENSE,
      );
      repository.findByType.mockResolvedValue(expenseCategories);

      const result = await useCase.execute({ type: CategoryType.EXPENSE });

      expect(repository.findByType).toHaveBeenCalledWith(CategoryType.EXPENSE);
      expect(result).toHaveLength(2);
    });

    it('should get categories by parent ID', async () => {
      const childCategories = [
        new CategoryEntity(
          'cat_child_1',
          '食費（外食）',
          CategoryType.EXPENSE,
          'cat_1',
          null,
          null,
          false,
          1,
          new Date(),
          new Date(),
        ),
      ];
      repository.findByParentId.mockResolvedValue(childCategories);

      const result = await useCase.execute({ parentId: 'cat_1' });

      expect(repository.findByParentId).toHaveBeenCalledWith('cat_1');
      expect(result).toHaveLength(1);
    });

    it('should get top level categories', async () => {
      repository.findTopLevel.mockResolvedValue(mockCategories);

      const result = await useCase.execute({ isTopLevel: true });

      expect(repository.findTopLevel).toHaveBeenCalled();
      expect(result).toHaveLength(3);
    });

    it('should return categories as tree structure', async () => {
      const treeStructure = [
        {
          category: mockCategories[0],
          children: [],
          level: 0,
        },
        {
          category: mockCategories[1],
          children: [],
          level: 0,
        },
      ];
      repository.findAll.mockResolvedValue(mockCategories);
      domainService.buildCategoryTree.mockReturnValue(treeStructure as any);

      const result = await useCase.execute({ asTree: true });

      expect(repository.findAll).toHaveBeenCalled();
      expect(domainService.buildCategoryTree).toHaveBeenCalledWith(
        mockCategories,
      );
      expect(result).toEqual(treeStructure);
    });

    it('should handle empty results', async () => {
      repository.findAll.mockResolvedValue([]);

      const result = await useCase.execute();

      expect(result).toHaveLength(0);
    });

    it('should prioritize type query over other options', async () => {
      repository.findByType.mockResolvedValue([mockCategories[0]]);

      await useCase.execute({
        type: CategoryType.EXPENSE,
        parentId: 'cat_1',
        isTopLevel: true,
      });

      expect(repository.findByType).toHaveBeenCalled();
      expect(repository.findByParentId).not.toHaveBeenCalled();
      expect(repository.findTopLevel).not.toHaveBeenCalled();
    });

    it('should prioritize parentId query over isTopLevel', async () => {
      repository.findByParentId.mockResolvedValue([]);

      await useCase.execute({
        parentId: 'cat_1',
        isTopLevel: true,
      });

      expect(repository.findByParentId).toHaveBeenCalled();
      expect(repository.findTopLevel).not.toHaveBeenCalled();
    });
  });
});
