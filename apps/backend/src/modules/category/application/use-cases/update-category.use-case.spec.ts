import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { UpdateCategoryUseCase } from './update-category.use-case';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository.interface';
import { CategoryEntity } from '../../domain/entities/category.entity';
import { CategoryType } from '@account-book/types';

describe('UpdateCategoryUseCase', () => {
  let useCase: UpdateCategoryUseCase;
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
        UpdateCategoryUseCase,
        {
          provide: CATEGORY_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateCategoryUseCase>(UpdateCategoryUseCase);
    repository = module.get(CATEGORY_REPOSITORY);
  });

  describe('execute', () => {
    it('費目を正常に更新できる', async () => {
      // Arrange
      const existingCategory = new CategoryEntity(
        'test-id',
        '食費',
        CategoryType.EXPENSE,
        null,
        '🍚',
        '#FF9800',
        false,
        0,
        new Date('2024-01-01'),
        new Date('2024-01-01'),
      );

      const request = {
        name: '食費（更新）',
        icon: '🍜',
        color: '#FF5722',
      };

      repository.findById.mockResolvedValue(existingCategory);
      repository.findAll.mockResolvedValue([existingCategory]);
      const updatedCategory = new CategoryEntity(
        existingCategory.id,
        request.name,
        existingCategory.type,
        existingCategory.parentId,
        request.icon,
        request.color,
        existingCategory.isSystemDefined,
        existingCategory.order,
        existingCategory.createdAt,
        new Date(),
      );
      repository.update.mockResolvedValue(updatedCategory);

      // Act
      const result = await useCase.execute('test-id', request);

      // Assert
      expect(result.category.name).toBe(request.name);
      expect(result.category.icon).toBe(request.icon);
      expect(result.category.color).toBe(request.color);
      expect(repository.update).toHaveBeenCalledTimes(1);
    });

    it('存在しない費目を更新しようとするとNotFoundExceptionをスローする', async () => {
      // Arrange
      const request = {
        name: '更新',
      };

      repository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute('non-existent-id', request)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('システム定義費目を更新しようとするとBadRequestExceptionをスローする', async () => {
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

      const request = {
        name: '更新',
      };

      repository.findById.mockResolvedValue(systemCategory);

      // Act & Assert
      await expect(useCase.execute('test-id', request)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute('test-id', request)).rejects.toThrow(
        'システム定義費目は編集できません',
      );
    });

    it('同名の費目が存在する場合はConflictExceptionをスローする', async () => {
      // Arrange
      const existingCategory = new CategoryEntity(
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

      const anotherCategory = new CategoryEntity(
        'another-id',
        '交通費', // 既に存在する名前
        CategoryType.EXPENSE,
        null,
        null,
        null,
        false,
        1,
        new Date(),
        new Date(),
      );

      const request = {
        name: '交通費', // 他の費目と同じ名前に変更
      };

      repository.findById.mockResolvedValue(existingCategory);
      repository.findAll.mockResolvedValue([existingCategory, anotherCategory]);

      // Act & Assert
      await expect(useCase.execute('test-id', request)).rejects.toThrow(
        ConflictException,
      );
    });

    it('自分自身の名前に更新する場合は成功する', async () => {
      // Arrange
      const existingCategory = new CategoryEntity(
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

      const request = {
        name: '食費', // 同じ名前
        icon: '🍜',
      };

      repository.findById.mockResolvedValue(existingCategory);
      repository.findAll.mockResolvedValue([existingCategory]);
      repository.update.mockResolvedValue(existingCategory);

      // Act
      const result = await useCase.execute('test-id', request);

      // Assert
      expect(result.category.name).toBe(request.name);
      expect(repository.update).toHaveBeenCalledTimes(1);
    });

    it('アイコンとカラーを個別に更新できる', async () => {
      // Arrange
      const existingCategory = new CategoryEntity(
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

      const request = {
        name: '食費',
        icon: '🍜', // アイコンのみ更新
        color: undefined, // カラーは更新しない
      };

      repository.findById.mockResolvedValue(existingCategory);
      repository.findAll.mockResolvedValue([existingCategory]);
      const updatedCategory = new CategoryEntity(
        existingCategory.id,
        existingCategory.name,
        existingCategory.type,
        existingCategory.parentId,
        request.icon,
        existingCategory.color, // 元のカラーを保持
        existingCategory.isSystemDefined,
        existingCategory.order,
        existingCategory.createdAt,
        new Date(),
      );
      repository.update.mockResolvedValue(updatedCategory);

      // Act
      const result = await useCase.execute('test-id', request);

      // Assert
      expect(result.category.icon).toBe(request.icon);
      expect(result.category.color).toBe(existingCategory.color);
    });
  });
});
