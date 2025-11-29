import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetCategoryByIdUseCase } from './get-category-by-id.use-case';
import { CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository.interface';
import { CategoryEntity } from '../../domain/entities/category.entity';
import { CategoryType } from '@account-book/types';

describe('GetCategoryByIdUseCase', () => {
  let useCase: GetCategoryByIdUseCase;
  let repository: any;

  beforeEach(async () => {
    const mockRepository = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCategoryByIdUseCase,
        {
          provide: CATEGORY_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetCategoryByIdUseCase>(GetCategoryByIdUseCase);
    repository = module.get(CATEGORY_REPOSITORY);
  });

  describe('execute', () => {
    it('指定したIDの費目を取得できる', async () => {
      // Arrange
      const category = new CategoryEntity(
        'test-id',
        '食費',
        CategoryType.EXPENSE,
        null,
        '🍚',
        '#FF9800',
        false,
        0,
        new Date(),
        new Date(),
      );

      repository.findById.mockResolvedValue(category);

      // Act
      const result = await useCase.execute('test-id');

      // Assert
      expect(result.category).toEqual(category);
      expect(repository.findById).toHaveBeenCalledWith('test-id');
      expect(repository.findById).toHaveBeenCalledTimes(1);
    });

    it('存在しないIDを指定するとNotFoundExceptionをスローする', async () => {
      // Arrange
      repository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute('non-existent-id')).rejects.toThrow(
        new NotFoundException('費目が見つかりません: non-existent-id'),
      );

      expect(repository.findById).toHaveBeenCalledWith('non-existent-id');
      expect(repository.findById).toHaveBeenCalledTimes(1);
    });
  });
});
