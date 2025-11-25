import { Test, TestingModule } from '@nestjs/testing';
import { GetSubcategoriesUseCase } from './get-subcategories.use-case';
import { SUB_CATEGORY_REPOSITORY } from '../../domain/repositories/subcategory.repository.interface';
import type { ISubcategoryRepository } from '../../domain/repositories/subcategory.repository.interface';
import { Subcategory } from '../../domain/entities/subcategory.entity';
import { CategoryType } from '@account-book/types';

describe('GetSubcategoriesUseCase', () => {
  let useCase: GetSubcategoriesUseCase;
  let mockSubcategoryRepository: jest.Mocked<ISubcategoryRepository>;

  const baseDate = new Date('2025-11-24T10:00:00.000Z');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetSubcategoriesUseCase,
        {
          provide: SUB_CATEGORY_REPOSITORY,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByCategory: jest.fn(),
            findByParentId: jest.fn(),
            findDefault: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GetSubcategoriesUseCase>(GetSubcategoriesUseCase);
    mockSubcategoryRepository = module.get(SUB_CATEGORY_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return all subcategories in hierarchical structure', async () => {
      // Arrange
      const subcategories = [
        new Subcategory(
          'food_cafe',
          CategoryType.EXPENSE,
          'カフェ・喫茶店',
          'expense-food',
          1,
          '☕',
          '#FF6B6B',
          false,
          true,
          baseDate,
          baseDate,
        ),
        new Subcategory(
          'food_restaurant',
          CategoryType.EXPENSE,
          'レストラン',
          'expense-food',
          2,
          '🍽️',
          '#FF6B6B',
          false,
          true,
          baseDate,
          baseDate,
        ),
        new Subcategory(
          'expense-food',
          CategoryType.EXPENSE,
          '食費',
          null,
          1,
          '🍽️',
          '#FF5722',
          false,
          true,
          baseDate,
          baseDate,
        ),
      ];

      mockSubcategoryRepository.findAll.mockResolvedValue(subcategories);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.total).toBe(3);
      expect(result.subcategories).toHaveLength(1);
      expect(result.subcategories[0].id).toBe('expense-food');
      expect(result.subcategories[0].children).toHaveLength(2);
      expect(result.subcategories[0].children?.[0].id).toBe('food_cafe');
      expect(result.subcategories[0].children?.[1].id).toBe('food_restaurant');

      expect(mockSubcategoryRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no subcategories exist', async () => {
      // Arrange
      mockSubcategoryRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.total).toBe(0);
      expect(result.subcategories).toEqual([]);
    });

    it('should sort subcategories by displayOrder', async () => {
      // Arrange
      const subcategories = [
        new Subcategory(
          'food_restaurant',
          CategoryType.EXPENSE,
          'レストラン',
          'expense-food',
          2,
          '🍽️',
          '#FF6B6B',
          false,
          true,
          baseDate,
          baseDate,
        ),
        new Subcategory(
          'food_cafe',
          CategoryType.EXPENSE,
          'カフェ・喫茶店',
          'expense-food',
          1,
          '☕',
          '#FF6B6B',
          false,
          true,
          baseDate,
          baseDate,
        ),
        new Subcategory(
          'expense-food',
          CategoryType.EXPENSE,
          '食費',
          null,
          1,
          '🍽️',
          '#FF5722',
          false,
          true,
          baseDate,
          baseDate,
        ),
      ];

      mockSubcategoryRepository.findAll.mockResolvedValue(subcategories);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.subcategories[0].children?.[0].id).toBe('food_cafe');
      expect(result.subcategories[0].children?.[1].id).toBe('food_restaurant');
    });

    it('should convert dates to ISO strings', async () => {
      // Arrange
      const subcategories = [
        new Subcategory(
          'food_cafe',
          CategoryType.EXPENSE,
          'カフェ・喫茶店',
          null,
          1,
          '☕',
          '#FF6B6B',
          false,
          true,
          baseDate,
          baseDate,
        ),
      ];

      mockSubcategoryRepository.findAll.mockResolvedValue(subcategories);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.subcategories[0].createdAt).toBe(baseDate.toISOString());
      expect(result.subcategories[0].updatedAt).toBe(baseDate.toISOString());
    });
  });
});
