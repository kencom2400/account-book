import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Like } from 'typeorm';
import { MerchantTypeOrmRepository } from './merchant-typeorm.repository';
import { MerchantOrmEntity } from '../entities/merchant.orm-entity';
import { Merchant } from '../../domain/entities/merchant.entity';
import { ClassificationConfidence } from '../../domain/value-objects/classification-confidence.vo';

describe('MerchantTypeOrmRepository', () => {
  let repository: MerchantTypeOrmRepository;
  let ormRepository: Repository<MerchantOrmEntity>;

  const mockMerchantOrmEntity: MerchantOrmEntity = {
    id: 'test-merchant-id',
    name: 'テスト店舗',
    aliases: ['test-alias-1', 'test-alias-2'],
    defaultSubcategoryId: 'test-subcategory-id',
    confidence: 0.95,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const createMockQueryBuilder = () => {
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    } as unknown as SelectQueryBuilder<MerchantOrmEntity>;
    return mockQueryBuilder;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MerchantTypeOrmRepository,
        {
          provide: getRepositoryToken(MerchantOrmEntity),
          useValue: {
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<MerchantTypeOrmRepository>(
      MerchantTypeOrmRepository,
    );
    ormRepository = module.get<Repository<MerchantOrmEntity>>(
      getRepositoryToken(MerchantOrmEntity),
    );
  });

  describe('save', () => {
    it('should save a merchant and return domain entity', async () => {
      const domainEntity = new Merchant(
        mockMerchantOrmEntity.id,
        mockMerchantOrmEntity.name,
        mockMerchantOrmEntity.aliases,
        mockMerchantOrmEntity.defaultSubcategoryId,
        new ClassificationConfidence(mockMerchantOrmEntity.confidence),
        mockMerchantOrmEntity.createdAt,
        mockMerchantOrmEntity.updatedAt,
      );

      jest
        .spyOn(ormRepository, 'save')
        .mockResolvedValue(mockMerchantOrmEntity);

      const result = await repository.save(domainEntity);

      expect(ormRepository.save).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Merchant);
      expect(result.id).toBe(mockMerchantOrmEntity.id);
      expect(result.name).toBe(mockMerchantOrmEntity.name);
    });
  });

  describe('findById', () => {
    it('should find a merchant by id', async () => {
      jest
        .spyOn(ormRepository, 'findOne')
        .mockResolvedValue(mockMerchantOrmEntity);

      const result = await repository.findById('test-merchant-id');

      expect(ormRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-merchant-id' },
      });
      expect(result).toBeInstanceOf(Merchant);
      expect(result?.id).toBe('test-merchant-id');
    });

    it('should return null when merchant not found', async () => {
      jest.spyOn(ormRepository, 'findOne').mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should find a merchant by name', async () => {
      jest
        .spyOn(ormRepository, 'findOne')
        .mockResolvedValue(mockMerchantOrmEntity);

      const result = await repository.findByName('テスト店舗');

      expect(ormRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'テスト店舗' },
      });
      expect(result).toBeInstanceOf(Merchant);
      expect(result?.name).toBe('テスト店舗');
    });

    it('should return null when merchant name not found', async () => {
      jest.spyOn(ormRepository, 'findOne').mockResolvedValue(null);

      const result = await repository.findByName('存在しない店舗');

      expect(result).toBeNull();
    });
  });

  describe('findByAlias', () => {
    it('should find a merchant by alias using JSON_CONTAINS', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      (mockQueryBuilder.getOne as jest.Mock).mockResolvedValue(
        mockMerchantOrmEntity,
      );

      jest
        .spyOn(ormRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder);

      const result = await repository.findByAlias('test-alias-1');

      expect(ormRepository.createQueryBuilder).toHaveBeenCalledWith('merchant');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'JSON_CONTAINS(merchant.aliases, :alias)',
        { alias: JSON.stringify('test-alias-1') },
      );
      expect(result).toBeInstanceOf(Merchant);
    });

    it('should return null when alias not found', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      (mockQueryBuilder.getOne as jest.Mock).mockResolvedValue(null);

      jest
        .spyOn(ormRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder);

      const result = await repository.findByAlias('non-existent-alias');

      expect(result).toBeNull();
    });
  });

  describe('search', () => {
    it('should search merchants by query string', async () => {
      const mockEntities = [mockMerchantOrmEntity];

      jest.spyOn(ormRepository, 'find').mockResolvedValue(mockEntities);

      const result = await repository.search('テスト');

      expect(ormRepository.find).toHaveBeenCalledWith({
        where: { name: Like('%テスト%') },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Merchant);
    });
  });

  describe('searchByDescription', () => {
    it('should find merchant by name match', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      (mockQueryBuilder.getOne as jest.Mock).mockResolvedValue(
        mockMerchantOrmEntity,
      );

      jest
        .spyOn(ormRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder);

      const result = await repository.searchByDescription('テスト店舗');

      expect(ormRepository.createQueryBuilder).toHaveBeenCalledWith('merchant');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'merchant.name LIKE :description',
        { description: '%テスト店舗%' },
      );
      expect(result).toBeInstanceOf(Merchant);
    });

    it('should find merchant by alias match when name not found', async () => {
      const mockQueryBuilder1 = createMockQueryBuilder();
      (mockQueryBuilder1.getOne as jest.Mock).mockResolvedValue(null);

      const mockQueryBuilder2 = createMockQueryBuilder();
      (mockQueryBuilder2.getOne as jest.Mock).mockResolvedValue(
        mockMerchantOrmEntity,
      );

      jest
        .spyOn(ormRepository, 'createQueryBuilder')
        .mockReturnValueOnce(mockQueryBuilder1)
        .mockReturnValueOnce(mockQueryBuilder2);

      const result = await repository.searchByDescription('test-alias-1');

      expect(ormRepository.createQueryBuilder).toHaveBeenCalledTimes(2);
      expect(mockQueryBuilder2.where).toHaveBeenCalledWith(
        'JSON_SEARCH(merchant.aliases, "one", :pattern) IS NOT NULL',
        { pattern: '%test-alias-1%' },
      );
      expect(result).toBeInstanceOf(Merchant);
    });

    it('should return null when neither name nor alias match', async () => {
      const mockQueryBuilder1 = createMockQueryBuilder();
      (mockQueryBuilder1.getOne as jest.Mock).mockResolvedValue(null);

      const mockQueryBuilder2 = createMockQueryBuilder();
      (mockQueryBuilder2.getOne as jest.Mock).mockResolvedValue(null);

      jest
        .spyOn(ormRepository, 'createQueryBuilder')
        .mockReturnValueOnce(mockQueryBuilder1)
        .mockReturnValueOnce(mockQueryBuilder2);

      const result = await repository.searchByDescription('存在しない');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a merchant', async () => {
      const domainEntity = new Merchant(
        mockMerchantOrmEntity.id,
        '更新後の店舗名',
        mockMerchantOrmEntity.aliases,
        mockMerchantOrmEntity.defaultSubcategoryId,
        new ClassificationConfidence(mockMerchantOrmEntity.confidence),
        mockMerchantOrmEntity.createdAt,
        new Date('2024-01-02'),
      );

      const updatedEntity = {
        ...mockMerchantOrmEntity,
        name: '更新後の店舗名',
      };

      jest.spyOn(ormRepository, 'save').mockResolvedValue(updatedEntity);

      const result = await repository.update(domainEntity);

      expect(ormRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('更新後の店舗名');
    });
  });

  describe('delete', () => {
    it('should delete a merchant by id', async () => {
      jest
        .spyOn(ormRepository, 'delete')
        .mockResolvedValue({ affected: 1, raw: {} });

      await repository.delete('test-merchant-id');

      expect(ormRepository.delete).toHaveBeenCalledWith('test-merchant-id');
    });
  });

  describe('Domain-ORM mapping', () => {
    it('should correctly map domain entity to ORM entity', async () => {
      const confidence = new ClassificationConfidence(0.95);
      const domainEntity = new Merchant(
        'new-merchant-id',
        '新規店舗',
        ['alias1', 'alias2'],
        'subcategory-id',
        confidence,
        new Date(),
        new Date(),
      );

      jest.spyOn(ormRepository, 'save').mockImplementation((entity) => {
        expect(entity).toMatchObject({
          id: 'new-merchant-id',
          name: '新規店舗',
          aliases: ['alias1', 'alias2'],
          defaultSubcategoryId: 'subcategory-id',
          confidence: 0.95,
        });
        return Promise.resolve(entity as MerchantOrmEntity);
      });

      await repository.save(domainEntity);

      expect(ormRepository.save).toHaveBeenCalled();
    });

    it('should correctly map ORM entity to domain entity with ClassificationConfidence VO', async () => {
      jest
        .spyOn(ormRepository, 'findOne')
        .mockResolvedValue(mockMerchantOrmEntity);

      const result = await repository.findById('test-merchant-id');

      expect(result).toBeInstanceOf(Merchant);
      expect(result?.id).toBe(mockMerchantOrmEntity.id);
      expect(result?.name).toBe(mockMerchantOrmEntity.name);
      expect(result?.aliases).toEqual(mockMerchantOrmEntity.aliases);
      expect(result?.defaultSubcategoryId).toBe(
        mockMerchantOrmEntity.defaultSubcategoryId,
      );
      expect(result?.getConfidence()).toBeInstanceOf(ClassificationConfidence);
      expect(result?.getConfidence().getValue()).toBe(0.95);
    });
  });
});
