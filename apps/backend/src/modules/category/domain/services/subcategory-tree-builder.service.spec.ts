import { Test, TestingModule } from '@nestjs/testing';
import { SubcategoryTreeBuilderService } from './subcategory-tree-builder.service';
import { Subcategory } from '../entities/subcategory.entity';
import { CategoryType } from '@account-book/types';

describe('SubcategoryTreeBuilderService', () => {
  let service: SubcategoryTreeBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubcategoryTreeBuilderService],
    }).compile();

    service = module.get<SubcategoryTreeBuilderService>(
      SubcategoryTreeBuilderService,
    );
  });

  const baseDate = new Date('2025-01-15T10:00:00Z');

  const createSubcategory = (
    id: string,
    name: string,
    parentId: string | null = null,
    displayOrder = 1,
  ): Subcategory => {
    return new Subcategory(
      id,
      CategoryType.EXPENSE,
      name,
      parentId,
      displayOrder,
      null,
      null,
      false,
      true,
      baseDate,
      baseDate,
    );
  };

  describe('buildTree', () => {
    it('単一のトップレベルサブカテゴリを階層構造に変換できる', () => {
      const subcategory = createSubcategory('sub-1', '食費');

      const tree = service.buildTree([subcategory]);

      expect(tree.length).toBe(1);
      expect(tree[0].id).toBe('sub-1');
      expect(tree[0].name).toBe('食費');
      expect(tree[0].parentId).toBeNull();
      expect(tree[0].children).toBeUndefined();
    });

    it('親子関係のあるサブカテゴリを階層構造に変換できる', () => {
      const parent = createSubcategory('parent-1', '親カテゴリ', null, 1);
      const child1 = createSubcategory('child-1', '子カテゴリ1', 'parent-1', 1);
      const child2 = createSubcategory('child-2', '子カテゴリ2', 'parent-1', 2);

      const tree = service.buildTree([parent, child1, child2]);

      expect(tree.length).toBe(1);
      expect(tree[0].id).toBe('parent-1');
      expect(tree[0].children).toBeDefined();
      expect(tree[0].children!.length).toBe(2);
      expect(tree[0].children![0].id).toBe('child-1');
      expect(tree[0].children![1].id).toBe('child-2');
    });

    it('複数のトップレベルサブカテゴリを処理できる', () => {
      const sub1 = createSubcategory('sub-1', '食費', null, 1);
      const sub2 = createSubcategory('sub-2', '交通費', null, 2);
      const sub3 = createSubcategory('sub-3', '住居費', null, 3);

      const tree = service.buildTree([sub1, sub2, sub3]);

      expect(tree.length).toBe(3);
      expect(tree[0].id).toBe('sub-1');
      expect(tree[1].id).toBe('sub-2');
      expect(tree[2].id).toBe('sub-3');
    });

    it('displayOrderでソートされる', () => {
      const sub1 = createSubcategory('sub-1', '食費', null, 3);
      const sub2 = createSubcategory('sub-2', '交通費', null, 1);
      const sub3 = createSubcategory('sub-3', '住居費', null, 2);

      const tree = service.buildTree([sub1, sub2, sub3]);

      expect(tree[0].id).toBe('sub-2');
      expect(tree[1].id).toBe('sub-3');
      expect(tree[2].id).toBe('sub-1');
    });

    it('子要素もdisplayOrderでソートされる', () => {
      const parent = createSubcategory('parent-1', '親カテゴリ', null, 1);
      const child1 = createSubcategory('child-1', '子カテゴリ1', 'parent-1', 3);
      const child2 = createSubcategory('child-2', '子カテゴリ2', 'parent-1', 1);
      const child3 = createSubcategory('child-3', '子カテゴリ3', 'parent-1', 2);

      const tree = service.buildTree([parent, child1, child2, child3]);

      expect(tree[0].children!.length).toBe(3);
      expect(tree[0].children![0].id).toBe('child-2');
      expect(tree[0].children![1].id).toBe('child-3');
      expect(tree[0].children![2].id).toBe('child-1');
    });

    it('子要素がない場合はchildrenプロパティを追加しない', () => {
      const parent = createSubcategory('parent-1', '親カテゴリ', null, 1);

      const tree = service.buildTree([parent]);

      expect(tree[0].children).toBeUndefined();
    });

    it('空の配列を処理できる', () => {
      const tree = service.buildTree([]);

      expect(tree.length).toBe(0);
    });

    it('3階層の構造を処理できる', () => {
      const level1 = createSubcategory('level-1', 'レベル1', null, 1);
      const level2 = createSubcategory('level-2', 'レベル2', 'level-1', 1);
      const level3 = createSubcategory('level-3', 'レベル3', 'level-2', 1);

      const tree = service.buildTree([level1, level2, level3]);

      expect(tree.length).toBe(1);
      expect(tree[0].id).toBe('level-1');
      expect(tree[0].children).toBeDefined();
      expect(tree[0].children!.length).toBe(1);
      expect(tree[0].children![0].id).toBe('level-2');
      expect(tree[0].children![0].children).toBeDefined();
      expect(tree[0].children![0].children!.length).toBe(1);
      expect(tree[0].children![0].children![0].id).toBe('level-3');
    });

    it('すべてのプロパティが正しく変換される', () => {
      const subcategory = createSubcategory('sub-1', '食費', null, 1);

      const tree = service.buildTree([subcategory]);

      expect(tree[0].id).toBe('sub-1');
      expect(tree[0].categoryType).toBe(CategoryType.EXPENSE);
      expect(tree[0].name).toBe('食費');
      expect(tree[0].parentId).toBeNull();
      expect(tree[0].displayOrder).toBe(1);
      expect(tree[0].icon).toBeNull();
      expect(tree[0].color).toBeNull();
      expect(tree[0].isDefault).toBe(false);
      expect(tree[0].isActive).toBe(true);
      expect(tree[0].createdAt).toBe(baseDate.toISOString());
      expect(tree[0].updatedAt).toBe(baseDate.toISOString());
    });
  });
});
