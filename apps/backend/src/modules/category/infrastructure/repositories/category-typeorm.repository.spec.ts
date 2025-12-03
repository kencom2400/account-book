import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryTypeOrmRepository } from './category-typeorm.repository';
import { CategoryOrmEntity } from '../entities/category.orm-entity';
import { CategoryEntity } from '../../domain/entities/category.entity';
import { CategoryType } from '@account-book/types';

describe('CategoryTypeOrmRepository', () => {
  let repository: CategoryTypeOrmRepository;
  let mockRepository: jest.Mocked<Repository<CategoryOrmEntity>>;

  const mockOrmEntity: Partial<CategoryOrmEntity> = {
    id: 'cat_1',
    name: 'Food',
    type: CategoryType.EXPENSE,
    icon: 'food',
    parentId: null,
    order: 1,
  };

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      create: jest.fn((entity) => entity as CategoryOrmEntity),
    } as unknown as jest.Mocked<Repository<CategoryOrmEntity>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryTypeOrmRepository,
        {
          provide: getRepositoryToken(CategoryOrmEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<CategoryTypeOrmRepository>(
      CategoryTypeOrmRepository,
    );
  });

  describe('findAll', () => {
    it('should find all categories', async () => {
      mockRepository.find.mockResolvedValue([
        mockOrmEntity as CategoryOrmEntity,
      ]);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(CategoryEntity);
    });
  });

  describe('findById', () => {
    it('should find category by id', async () => {
      mockRepository.findOne.mockResolvedValue(
        mockOrmEntity as CategoryOrmEntity,
      );

      const result = await repository.findById('cat_1');

      expect(result).toBeInstanceOf(CategoryEntity);
      expect(result?.id).toBe('cat_1');
    });

    it('should return null if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByIds', () => {
    it('should find categories by ids', async () => {
      const mockOrmEntity1 = {
        id: 'cat_1',
        name: 'Food',
        type: CategoryType.EXPENSE,
        parentId: null,
        icon: '🍔',
        color: '#FF0000',
        isSystemDefined: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockOrmEntity2 = {
        id: 'cat_2',
        name: 'Transport',
        type: CategoryType.EXPENSE,
        parentId: null,
        icon: '🚗',
        color: '#0000FF',
        isSystemDefined: true,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRepository.find.mockResolvedValue([
        mockOrmEntity1 as CategoryOrmEntity,
        mockOrmEntity2 as CategoryOrmEntity,
      ]);

      const result = await repository.findByIds(['cat_1', 'cat_2']);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('cat_1');
      expect(result[1].id).toBe('cat_2');
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: expect.any(Object),
        order: { order: 'ASC' },
      });
    });

    it('should return empty array when ids is empty', async () => {
      const result = await repository.findByIds([]);

      expect(result).toHaveLength(0);
      expect(mockRepository.find).not.toHaveBeenCalled();
    });
  });

  describe('findByType', () => {
    it('should find categories by type', async () => {
      mockRepository.find.mockResolvedValue([
        mockOrmEntity as CategoryOrmEntity,
      ]);

      const result = await repository.findByType(CategoryType.EXPENSE);

      expect(result).toHaveLength(1);
    });
  });

  describe('findTopLevel', () => {
    it('should find top level categories', async () => {
      mockRepository.find.mockResolvedValue([
        mockOrmEntity as CategoryOrmEntity,
      ]);

      const result = await repository.findTopLevel();

      expect(result).toHaveLength(1);
    });
  });

  describe('findByParentId', () => {
    it('should find categories by parent id', async () => {
      mockRepository.find.mockResolvedValue([
        mockOrmEntity as CategoryOrmEntity,
      ]);

      const result = await repository.findByParentId('parent_1');

      expect(result).toHaveLength(1);
    });
  });

  describe('save', () => {
    it('should save category', async () => {
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

      mockRepository.save.mockResolvedValue(mockOrmEntity as CategoryOrmEntity);

      const result = await repository.save(mockCategory);

      expect(result).toBeInstanceOf(CategoryEntity);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete category', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await repository.delete('cat_1');

      expect(mockRepository.delete).toHaveBeenCalledWith('cat_1');
    });
  });
});
