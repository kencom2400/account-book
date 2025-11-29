import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { CreateCategoryUseCase } from './create-category.use-case';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository.interface';
import { CategoryEntity } from '../../domain/entities/category.entity';
import { CategoryType } from '@account-book/types';

describe('CreateCategoryUseCase', () => {
  let useCase: CreateCategoryUseCase;
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
        CreateCategoryUseCase,
        {
          provide: CATEGORY_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateCategoryUseCase>(CreateCategoryUseCase);
    repository = module.get(CATEGORY_REPOSITORY);
  });

  describe('execute', () => {
    it('新しい費目を正常に作成できる', async () => {
      // Arrange
      const request = {
        name: '食費',
        type: CategoryType.EXPENSE,
        parentId: null,
        icon: '🍚',
        color: '#FF9800',
      };

      repository.findByType.mockResolvedValue([]);
      const savedCategory = new CategoryEntity(
        'test-id',
        request.name,
        request.type,
        request.parentId,
        request.icon,
        request.color,
        false,
        0,
        new Date(),
        new Date(),
      );
      repository.save.mockResolvedValue(savedCategory);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.category).toBeDefined();
      expect(result.category.name).toBe(request.name);
      expect(result.category.type).toBe(request.type);
      expect(result.category.isSystemDefined).toBe(false);
      expect(repository.save).toHaveBeenCalledTimes(1);
    });

    it('同名の費目が存在する場合はConflictExceptionをスローする', async () => {
      // Arrange
      const request = {
        name: '食費',
        type: CategoryType.EXPENSE,
        parentId: null,
      };

      const existingCategory = new CategoryEntity(
        'existing-id',
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

      repository.findByType.mockResolvedValue([existingCategory]);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        new ConflictException('同名の費目が既に存在します: 食費'),
      );
    });

    it('NFKC正規化により、大文字小文字の違いを無視して重複を検出する', async () => {
      // Arrange
      const request = {
        name: 'SHOKUHI', // 大文字
        type: CategoryType.EXPENSE,
        parentId: null,
      };

      const existingCategory = new CategoryEntity(
        'existing-id',
        'shokuhi', // 小文字
        CategoryType.EXPENSE,
        null,
        null,
        null,
        false,
        0,
        new Date(),
        new Date(),
      );

      repository.findByType.mockResolvedValue([existingCategory]);
      repository.findById.mockResolvedValue(null); // 親IDチェックをスキップ

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(ConflictException);
    });

    it('親費目が存在しない場合はConflictExceptionをスローする', async () => {
      // Arrange
      const request = {
        name: 'サブカテゴリ',
        type: CategoryType.EXPENSE,
        parentId: 'non-existent-parent',
      };

      repository.findByType.mockResolvedValue([]);
      repository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        new ConflictException('親費目が見つかりません: non-existent-parent'),
      );
    });

    it('親費目とタイプが異なる場合はConflictExceptionをスローする', async () => {
      // Arrange
      const request = {
        name: 'サブカテゴリ',
        type: CategoryType.EXPENSE,
        parentId: 'parent-id',
      };

      const parentCategory = new CategoryEntity(
        'parent-id',
        '親カテゴリ',
        CategoryType.INCOME, // 異なるタイプ
        null,
        null,
        null,
        false,
        0,
        new Date(),
        new Date(),
      );

      repository.findByType.mockResolvedValue([]);
      repository.findById.mockResolvedValue(parentCategory);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        new ConflictException('親費目とタイプが一致しません'),
      );
    });

    it('表示順序が正しく計算される', async () => {
      // Arrange
      const request = {
        name: '新しい費目',
        type: CategoryType.EXPENSE,
        parentId: null,
      };

      const existingCategory1 = new CategoryEntity(
        'id1',
        '既存1',
        CategoryType.EXPENSE,
        null,
        null,
        null,
        false,
        0,
        new Date(),
        new Date(),
      );

      const existingCategory2 = new CategoryEntity(
        'id2',
        '既存2',
        CategoryType.EXPENSE,
        null,
        null,
        null,
        false,
        5,
        new Date(),
        new Date(),
      );

      repository.findByType.mockResolvedValue([
        existingCategory1,
        existingCategory2,
      ]);

      const savedCategory = new CategoryEntity(
        'new-id',
        request.name,
        request.type,
        null,
        null,
        null,
        false,
        6, // maxOrder(5) + 1
        new Date(),
        new Date(),
      );
      repository.save.mockResolvedValue(savedCategory);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.category.order).toBe(6);
    });
  });
});
