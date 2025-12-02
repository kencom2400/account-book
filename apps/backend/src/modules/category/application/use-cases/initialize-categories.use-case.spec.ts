import { Test, TestingModule } from '@nestjs/testing';
import { CategoryType } from '@account-book/types';
import { InitializeCategoriesUseCase } from './initialize-categories.use-case';
import { CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository.interface';
import type { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { CategoryDomainService } from '../../domain/services/category-domain.service';
import { CategoryEntity } from '../../domain/entities/category.entity';

describe('InitializeCategoriesUseCase', () => {
  let useCase: InitializeCategoriesUseCase;
  let repository: jest.Mocked<ICategoryRepository>;
  let domainService: jest.Mocked<CategoryDomainService>;

  const existingCategories = [
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
  ];

  const defaultCategories = [
    new CategoryEntity(
      'cat_new_1',
      '食費',
      CategoryType.EXPENSE,
      null,
      null,
      null,
      true,
      1,
      new Date(),
      new Date(),
    ),
    new CategoryEntity(
      'cat_new_2',
      '交通費',
      CategoryType.EXPENSE,
      null,
      null,
      null,
      true,
      2,
      new Date(),
      new Date(),
    ),
    new CategoryEntity(
      'cat_new_3',
      '給与',
      CategoryType.INCOME,
      null,
      null,
      null,
      true,
      1,
      new Date(),
      new Date(),
    ),
  ];

  beforeEach(async () => {
    const mockRepo = {
      findAll: jest.fn(),
      save: jest.fn(),
    };

    const mockService = {
      createDefaultCategories: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InitializeCategoriesUseCase,
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

    useCase = module.get<InitializeCategoriesUseCase>(
      InitializeCategoriesUseCase,
    );
    repository = module.get(CATEGORY_REPOSITORY);
    domainService = module.get(CategoryDomainService);
  });

  describe('execute', () => {
    it('should return existing categories when they already exist', async () => {
      repository.findAll.mockResolvedValue(existingCategories);

      const result = await useCase.execute();

      expect(repository.findAll).toHaveBeenCalled();
      expect(domainService.createDefaultCategories).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
      expect(result).toEqual(existingCategories);
    });

    it('should create and save default categories when none exist', async () => {
      repository.findAll.mockResolvedValue([]);
      domainService.createDefaultCategories.mockReturnValue(defaultCategories);
      repository.save.mockImplementation((category) =>
        Promise.resolve(category),
      );

      const result = await useCase.execute();

      expect(repository.findAll).toHaveBeenCalled();
      expect(domainService.createDefaultCategories).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(3);
    });

    it('should save categories one by one', async () => {
      repository.findAll.mockResolvedValue([]);
      domainService.createDefaultCategories.mockReturnValue(defaultCategories);

      const savedCategories: CategoryEntity[] = [];
      repository.save.mockImplementation((category) => {
        savedCategories.push(category);
        return Promise.resolve(category);
      });

      await useCase.execute();

      expect(savedCategories).toHaveLength(3);
      expect(savedCategories[0].name).toBe('食費');
      expect(savedCategories[1].name).toBe('交通費');
      expect(savedCategories[2].name).toBe('給与');
    });

    it('should handle empty default categories', async () => {
      repository.findAll.mockResolvedValue([]);
      domainService.createDefaultCategories.mockReturnValue([]);

      const result = await useCase.execute();

      expect(repository.findAll).toHaveBeenCalled();
      expect(domainService.createDefaultCategories).toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
      expect(result).toHaveLength(0);
    });

    it('should return saved categories with correct order', async () => {
      repository.findAll.mockResolvedValue([]);
      domainService.createDefaultCategories.mockReturnValue(defaultCategories);
      repository.save.mockImplementation((category) =>
        Promise.resolve(category),
      );

      const result = await useCase.execute();

      expect(result[0].name).toBe('食費');
      expect(result[1].name).toBe('交通費');
      expect(result[2].name).toBe('給与');
    });
  });
});
