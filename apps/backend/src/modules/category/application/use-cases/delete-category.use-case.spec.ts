import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DeleteCategoryUseCase } from './delete-category.use-case';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository.interface';
import { CategoryEntity } from '../../domain/entities/category.entity';
import { CategoryType } from '@account-book/types';

describe('DeleteCategoryUseCase', () => {
  let useCase: DeleteCategoryUseCase;
  let repository: jest.Mocked<ICategoryRepository>;

  beforeEach(async () => {
    const mockRepository: jest.Mocked<ICategoryRepository> = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByType: jest.fn(),
      findByParentId: jest.fn(),
      findTopLevel: jest.fn(),
      findSystemDefined: jest.fn(),
      findUserDefined: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteCategoryUseCase,
        {
          provide: CATEGORY_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<DeleteCategoryUseCase>(DeleteCategoryUseCase);
    repository = module.get(CATEGORY_REPOSITORY);
  });

  describe('execute', () => {
    it('費目を正常に削除できる', async () => {
      // Arrange
      const category = new CategoryEntity(
        'test-id',
        '食費',
        CategoryType.EXPENSE,
        null,
        null,
        null,
        false,
        0,
        new Date(),
        new Date(),
      );

      repository.findById.mockResolvedValue(category);
      repository.delete.mockResolvedValue();

      // Act
      const result = await useCase.execute('test-id');

      // Assert
      expect(result.success).toBe(true);
      expect(result.replacedCount).toBe(0);
      expect(result.message).toBe('費目を削除しました');
      expect(repository.delete).toHaveBeenCalledWith('test-id');
    });

    it('存在しない費目を削除しようとするとNotFoundExceptionをスローする', async () => {
      // Arrange
      repository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(useCase.execute('non-existent-id')).rejects.toThrow(
        '費目が見つかりません',
      );
    });

    it('システム定義費目を削除しようとするとBadRequestExceptionをスローする', async () => {
      // Arrange
      const systemCategory = new CategoryEntity(
        'test-id',
        'システム費目',
        CategoryType.EXPENSE,
        null,
        null,
        null,
        true, // システム定義
        0,
        new Date(),
        new Date(),
      );

      repository.findById.mockResolvedValue(systemCategory);

      // Act & Assert
      await expect(useCase.execute('test-id')).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute('test-id')).rejects.toThrow(
        'システム定義費目は削除できません',
      );
    });

    it('代替費目が存在しない場合はNotFoundExceptionをスローする', async () => {
      // Arrange
      const category = new CategoryEntity(
        'test-id',
        '食費',
        CategoryType.EXPENSE,
        null,
        null,
        null,
        false,
        0,
        new Date(),
        new Date(),
      );

      repository.findById
        .mockResolvedValueOnce(category)
        .mockResolvedValueOnce(null); // 代替費目が見つからない

      // Act & Assert
      await expect(
        useCase.execute('test-id', 'non-existent-replacement'),
      ).rejects.toThrow(NotFoundException);
    });

    it('代替費目のタイプが異なる場合はBadRequestExceptionをスローする', async () => {
      // Arrange
      const category = new CategoryEntity(
        'test-id',
        '食費',
        CategoryType.EXPENSE,
        null,
        null,
        null,
        false,
        0,
        new Date(),
        new Date(),
      );

      const replacementCategory = new CategoryEntity(
        'replacement-id',
        '給与',
        CategoryType.INCOME, // 異なるタイプ
        null,
        null,
        null,
        false,
        0,
        new Date(),
        new Date(),
      );

      repository.findById
        .mockResolvedValueOnce(category)
        .mockResolvedValueOnce(replacementCategory);

      // Act & Assert
      await expect(
        useCase.execute('test-id', 'replacement-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('代替費目を指定して削除できる', async () => {
      // Arrange
      const category = new CategoryEntity(
        'test-id',
        '食費',
        CategoryType.EXPENSE,
        null,
        null,
        null,
        false,
        0,
        new Date(),
        new Date(),
      );

      const replacementCategory = new CategoryEntity(
        'replacement-id',
        '交通費',
        CategoryType.EXPENSE, // 同じタイプ
        null,
        null,
        null,
        false,
        1,
        new Date(),
        new Date(),
      );

      repository.findById
        .mockResolvedValueOnce(category)
        .mockResolvedValueOnce(replacementCategory);
      repository.delete.mockResolvedValue();

      // Act
      const result = await useCase.execute('test-id', 'replacement-id');

      // Assert
      expect(result.success).toBe(true);
      expect(repository.delete).toHaveBeenCalledWith('test-id');
    });
  });
});
