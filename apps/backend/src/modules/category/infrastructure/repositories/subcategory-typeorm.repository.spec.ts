import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryType } from '@account-book/types';
import { SubcategoryTypeOrmRepository } from './subcategory-typeorm.repository';
import { SubcategoryOrmEntity } from '../entities/subcategory.orm-entity';
import { Subcategory } from '../../domain/entities/subcategory.entity';

describe('SubcategoryTypeOrmRepository', () => {
  let repository: SubcategoryTypeOrmRepository;
  let ormRepository: Repository<SubcategoryOrmEntity>;

  const mockSubcategoryOrmEntity: SubcategoryOrmEntity = {
    id: 'test-subcategory-id',
    categoryType: CategoryType.EXPENSE,
    name: 'テスト費目',
    parentId: null,
    displayOrder: 1,
    icon: '🧪',
    color: '#FF0000',
    isDefault: false,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubcategoryTypeOrmRepository,
        {
          provide: getRepositoryToken(SubcategoryOrmEntity),
          useValue: {
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<SubcategoryTypeOrmRepository>(
      SubcategoryTypeOrmRepository,
    );
    ormRepository = module.get<Repository<SubcategoryOrmEntity>>(
      getRepositoryToken(SubcategoryOrmEntity),
    );
  });

  describe('save', () => {
    it('should save a subcategory and return domain entity', async () => {
      const domainEntity = new Subcategory(
        mockSubcategoryOrmEntity.id,
        mockSubcategoryOrmEntity.categoryType,
        mockSubcategoryOrmEntity.name,
        mockSubcategoryOrmEntity.parentId,
        mockSubcategoryOrmEntity.displayOrder,
        mockSubcategoryOrmEntity.icon,
        mockSubcategoryOrmEntity.color,
        mockSubcategoryOrmEntity.isDefault,
        mockSubcategoryOrmEntity.isActive,
        mockSubcategoryOrmEntity.createdAt,
        mockSubcategoryOrmEntity.updatedAt,
      );

      jest
        .spyOn(ormRepository, 'save')
        .mockResolvedValue(mockSubcategoryOrmEntity);

      const result = await repository.save(domainEntity);

      expect(ormRepository.save).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Subcategory);
      expect(result.id).toBe(mockSubcategoryOrmEntity.id);
      expect(result.name).toBe(mockSubcategoryOrmEntity.name);
    });
  });

  describe('findById', () => {
    it('should find a subcategory by id', async () => {
      jest
        .spyOn(ormRepository, 'findOne')
        .mockResolvedValue(mockSubcategoryOrmEntity);

      const result = await repository.findById('test-subcategory-id');

      expect(ormRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-subcategory-id' },
      });
      expect(result).toBeInstanceOf(Subcategory);
      expect(result?.id).toBe('test-subcategory-id');
    });

    it('should return null when subcategory not found', async () => {
      jest.spyOn(ormRepository, 'findOne').mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all subcategories ordered by displayOrder', async () => {
      const mockEntities = [
        mockSubcategoryOrmEntity,
        { ...mockSubcategoryOrmEntity, id: 'test-2', displayOrder: 2 },
      ];

      jest.spyOn(ormRepository, 'find').mockResolvedValue(mockEntities);

      const result = await repository.findAll();

      expect(ormRepository.find).toHaveBeenCalledWith({
        order: { displayOrder: 'ASC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Subcategory);
    });
  });

  describe('findByCategory', () => {
    it('should return subcategories filtered by category type', async () => {
      const mockEntities = [mockSubcategoryOrmEntity];

      jest.spyOn(ormRepository, 'find').mockResolvedValue(mockEntities);

      const result = await repository.findByCategory(CategoryType.EXPENSE);

      expect(ormRepository.find).toHaveBeenCalledWith({
        where: { categoryType: CategoryType.EXPENSE, isActive: true },
        order: { displayOrder: 'ASC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].categoryType).toBe(CategoryType.EXPENSE);
    });
  });

  describe('findDefault', () => {
    it('should return default subcategory for given category type', async () => {
      const defaultEntity = { ...mockSubcategoryOrmEntity, isDefault: true };

      jest.spyOn(ormRepository, 'findOne').mockResolvedValue(defaultEntity);

      const result = await repository.findDefault(CategoryType.EXPENSE);

      expect(ormRepository.findOne).toHaveBeenCalledWith({
        where: {
          categoryType: CategoryType.EXPENSE,
          isDefault: true,
          isActive: true,
        },
      });
      expect(result).toBeInstanceOf(Subcategory);
      expect(result?.isDefault).toBe(true);
    });

    it('should return null when no default subcategory found', async () => {
      jest.spyOn(ormRepository, 'findOne').mockResolvedValue(null);

      const result = await repository.findDefault(CategoryType.EXPENSE);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a subcategory', async () => {
      const domainEntity = new Subcategory(
        mockSubcategoryOrmEntity.id,
        mockSubcategoryOrmEntity.categoryType,
        '更新後の名前',
        mockSubcategoryOrmEntity.parentId,
        mockSubcategoryOrmEntity.displayOrder,
        mockSubcategoryOrmEntity.icon,
        mockSubcategoryOrmEntity.color,
        mockSubcategoryOrmEntity.isDefault,
        mockSubcategoryOrmEntity.isActive,
        mockSubcategoryOrmEntity.createdAt,
        new Date('2024-01-02'),
      );

      const updatedEntity = {
        ...mockSubcategoryOrmEntity,
        name: '更新後の名前',
      };

      jest.spyOn(ormRepository, 'save').mockResolvedValue(updatedEntity);

      const result = await repository.update(domainEntity);

      expect(ormRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('更新後の名前');
    });
  });

  describe('delete', () => {
    it('should delete a subcategory by id', async () => {
      jest
        .spyOn(ormRepository, 'delete')
        .mockResolvedValue({ affected: 1, raw: {} });

      await repository.delete('test-subcategory-id');

      expect(ormRepository.delete).toHaveBeenCalledWith('test-subcategory-id');
    });
  });

  describe('Domain-ORM mapping', () => {
    it('should correctly map domain entity to ORM entity', async () => {
      const now = new Date();
      const domainEntity = new Subcategory(
        'test-id',
        CategoryType.INCOME,
        '給与',
        null,
        1,
        '💰',
        '#4CAF50',
        true,
        true,
        now,
        now,
      );

      jest.spyOn(ormRepository, 'save').mockImplementation((entity) => {
        expect(entity).toMatchObject({
          categoryType: CategoryType.INCOME,
          name: '給与',
          icon: '💰',
          color: '#4CAF50',
          isDefault: true,
          isActive: true,
        });
        return Promise.resolve(entity as SubcategoryOrmEntity);
      });

      await repository.save(domainEntity);

      expect(ormRepository.save).toHaveBeenCalled();
    });

    it('should correctly map ORM entity to domain entity', async () => {
      jest
        .spyOn(ormRepository, 'findOne')
        .mockResolvedValue(mockSubcategoryOrmEntity);

      const result = await repository.findById('test-subcategory-id');

      expect(result).toBeInstanceOf(Subcategory);
      expect(result?.id).toBe(mockSubcategoryOrmEntity.id);
      expect(result?.categoryType).toBe(mockSubcategoryOrmEntity.categoryType);
      expect(result?.name).toBe(mockSubcategoryOrmEntity.name);
      expect(result?.parentId).toBe(mockSubcategoryOrmEntity.parentId);
      expect(result?.displayOrder).toBe(mockSubcategoryOrmEntity.displayOrder);
      expect(result?.icon).toBe(mockSubcategoryOrmEntity.icon);
      expect(result?.color).toBe(mockSubcategoryOrmEntity.color);
      expect(result?.isDefault).toBe(mockSubcategoryOrmEntity.isDefault);
      expect(result?.isActive).toBe(mockSubcategoryOrmEntity.isActive);
    });
  });
});
