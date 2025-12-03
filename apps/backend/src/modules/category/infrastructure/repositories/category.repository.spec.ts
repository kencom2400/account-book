import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CategoryRepository } from './category.repository';
import { CategoryEntity } from '../../domain/entities/category.entity';
import * as fs from 'fs/promises';

jest.mock('fs/promises');

describe('CategoryRepository', () => {
  let repository: CategoryRepository;
  const mockFs = fs as jest.Mocked<typeof fs>;

  const mockCategory = new CategoryEntity(
    'cat_1',
    'Food',
    'expense',
    null,
    '🍔',
    '#FF0000',
    true,
    1,
    new Date('2024-01-01'),
    new Date('2024-01-01'),
  );

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryRepository,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<CategoryRepository>(CategoryRepository);

    // Mock file system operations
    mockFs.access.mockResolvedValue(undefined);
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue('[]');
    mockFs.writeFile.mockResolvedValue(undefined);
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      const mockData = JSON.stringify([
        {
          id: 'cat_1',
          name: 'Food',
          type: 'expense',
          parentId: null,
          icon: '🍔',
          color: '#FF0000',
          isSystemDefined: true,
          order: 1,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(CategoryEntity);
      expect(result[0].name).toBe('Food');
    });

    it('should return empty array when file does not exist', async () => {
      mockFs.readFile.mockRejectedValue(new Error('ENOENT'));

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should find category by id', async () => {
      const mockData = JSON.stringify([
        {
          id: 'cat_1',
          name: 'Food',
          type: 'expense',
          parentId: null,
          icon: '🍔',
          color: '#FF0000',
          isSystemDefined: true,
          order: 1,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const result = await repository.findById('cat_1');

      expect(result).toBeInstanceOf(CategoryEntity);
      expect(result?.name).toBe('Food');
    });

    it('should return null when category not found', async () => {
      mockFs.readFile.mockResolvedValue('[]');

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByIds', () => {
    it('should find categories by ids', async () => {
      const mockData = JSON.stringify([
        {
          id: 'cat_1',
          name: 'Food',
          type: 'expense',
          parentId: null,
          icon: '🍔',
          color: '#FF0000',
          isSystemDefined: true,
          order: 1,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'cat_2',
          name: 'Salary',
          type: 'income',
          parentId: null,
          icon: '💰',
          color: '#00FF00',
          isSystemDefined: true,
          order: 2,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'cat_3',
          name: 'Transport',
          type: 'expense',
          parentId: null,
          icon: '🚗',
          color: '#0000FF',
          isSystemDefined: true,
          order: 3,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const result = await repository.findByIds(['cat_1', 'cat_3']);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('cat_1');
      expect(result[1].id).toBe('cat_3');
    });

    it('should return empty array when ids is empty', async () => {
      mockFs.readFile.mockResolvedValue('[]');

      const result = await repository.findByIds([]);

      expect(result).toHaveLength(0);
    });

    it('should return empty array when no categories match', async () => {
      const mockData = JSON.stringify([
        {
          id: 'cat_1',
          name: 'Food',
          type: 'expense',
          parentId: null,
          icon: '🍔',
          color: '#FF0000',
          isSystemDefined: true,
          order: 1,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const result = await repository.findByIds(['nonexistent']);

      expect(result).toHaveLength(0);
    });
  });

  describe('findByType', () => {
    it('should find categories by type', async () => {
      const mockData = JSON.stringify([
        {
          id: 'cat_1',
          name: 'Food',
          type: 'expense',
          parentId: null,
          icon: '🍔',
          color: '#FF0000',
          isSystemDefined: true,
          order: 1,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'cat_2',
          name: 'Salary',
          type: 'income',
          parentId: null,
          icon: '💰',
          color: '#00FF00',
          isSystemDefined: true,
          order: 2,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const result = await repository.findByType('expense');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('expense');
    });
  });

  describe('findByParentId', () => {
    it('should find categories by parent id', async () => {
      const mockData = JSON.stringify([
        {
          id: 'cat_2',
          name: 'Restaurant',
          type: 'expense',
          parentId: 'cat_1',
          icon: '🍽️',
          color: '#FF0000',
          isSystemDefined: true,
          order: 2,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const result = await repository.findByParentId('cat_1');

      expect(result).toHaveLength(1);
      expect(result[0].parentId).toBe('cat_1');
    });
  });

  describe('save', () => {
    it('should save category', async () => {
      mockFs.readFile.mockResolvedValue('[]');

      const result = await repository.save(mockCategory);

      expect(result).toBeInstanceOf(CategoryEntity);
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should update existing category', async () => {
      const mockData = JSON.stringify([
        {
          id: 'cat_1',
          name: 'Food',
          type: 'expense',
          parentId: null,
          icon: '🍔',
          color: '#FF0000',
          isSystemDefined: true,
          order: 1,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      const updatedCategory = new CategoryEntity(
        'cat_1',
        'Updated Food',
        'expense',
        null,
        '🍔',
        '#FF0000',
        true,
        1,
        new Date('2024-01-01'),
        new Date('2024-01-02'),
      );

      const result = await repository.save(updatedCategory);

      expect(result.name).toBe('Updated Food');
      expect(mockFs.writeFile).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete category', async () => {
      const mockData = JSON.stringify([
        {
          id: 'cat_1',
          name: 'Food',
          type: 'expense',
          parentId: null,
          icon: '🍔',
          color: '#FF0000',
          isSystemDefined: true,
          order: 1,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      mockFs.readFile.mockResolvedValue(mockData);

      await repository.delete('cat_1');

      expect(mockFs.writeFile).toHaveBeenCalled();
      const writeCall = mockFs.writeFile.mock.calls[0];
      const writtenData = JSON.parse(writeCall[1] as string);
      expect(writtenData).toEqual([]);
    });
  });
});
