import { CategoryType } from '@account-book/types';
import { TransactionCategoryChangeHistoryEntity } from './transaction-category-change-history.entity';

describe('TransactionCategoryChangeHistoryEntity', () => {
  const baseDate = new Date('2025-01-15T10:00:00Z');

  const createHistory = (
    id = 'history-1',
    transactionId = 'tx-1',
    oldCategory = { id: 'cat-1', name: '食費', type: CategoryType.EXPENSE },
    newCategory = { id: 'cat-2', name: '外食費', type: CategoryType.EXPENSE },
    changedAt = baseDate,
    changedBy?: string,
  ): TransactionCategoryChangeHistoryEntity => {
    return new TransactionCategoryChangeHistoryEntity(
      id,
      transactionId,
      oldCategory,
      newCategory,
      changedAt,
      changedBy,
    );
  };

  describe('constructor', () => {
    it('有効なパラメータでインスタンスを作成できる', () => {
      const history = createHistory();

      expect(history.id).toBe('history-1');
      expect(history.transactionId).toBe('tx-1');
      expect(history.oldCategory.id).toBe('cat-1');
      expect(history.newCategory.id).toBe('cat-2');
      expect(history.changedAt).toEqual(baseDate);
      expect(history.changedBy).toBeUndefined();
    });

    it('changedByが指定されている場合も作成できる', () => {
      const history = createHistory(
        'history-1',
        'tx-1',
        { id: 'cat-1', name: '食費', type: CategoryType.EXPENSE },
        { id: 'cat-2', name: '外食費', type: CategoryType.EXPENSE },
        baseDate,
        'user-1',
      );

      expect(history.changedBy).toBe('user-1');
    });
  });

  describe('getChangeDescription', () => {
    it('変更内容を人間が読みやすい形式で取得できる', () => {
      const history = createHistory(
        'history-1',
        'tx-1',
        { id: 'cat-1', name: '食費', type: CategoryType.EXPENSE },
        { id: 'cat-2', name: '外食費', type: CategoryType.EXPENSE },
      );

      const description = history.getChangeDescription();

      expect(description).toBe('「食費」から「外食費」に変更');
    });

    it('異なるカテゴリタイプの変更も正しく表示される', () => {
      const history = createHistory(
        'history-1',
        'tx-1',
        { id: 'cat-1', name: '食費', type: CategoryType.EXPENSE },
        { id: 'cat-2', name: '給与', type: CategoryType.INCOME },
      );

      const description = history.getChangeDescription();

      expect(description).toBe('「食費」から「給与」に変更');
    });
  });

  describe('isCategoryTypeChanged', () => {
    it('カテゴリタイプが変更されていない場合falseを返す', () => {
      const history = createHistory(
        'history-1',
        'tx-1',
        { id: 'cat-1', name: '食費', type: CategoryType.EXPENSE },
        { id: 'cat-2', name: '外食費', type: CategoryType.EXPENSE },
      );

      expect(history.isCategoryTypeChanged()).toBe(false);
    });

    it('カテゴリタイプが変更されている場合trueを返す', () => {
      const history = createHistory(
        'history-1',
        'tx-1',
        { id: 'cat-1', name: '食費', type: CategoryType.EXPENSE },
        { id: 'cat-2', name: '給与', type: CategoryType.INCOME },
      );

      expect(history.isCategoryTypeChanged()).toBe(true);
    });

    it('EXPENSEからTRANSFERへの変更も検出できる', () => {
      const history = createHistory(
        'history-1',
        'tx-1',
        { id: 'cat-1', name: '食費', type: CategoryType.EXPENSE },
        { id: 'cat-2', name: '振替', type: CategoryType.TRANSFER },
      );

      expect(history.isCategoryTypeChanged()).toBe(true);
    });

    it('INCOMEからEXPENSEへの変更も検出できる', () => {
      const history = createHistory(
        'history-1',
        'tx-1',
        { id: 'cat-1', name: '給与', type: CategoryType.INCOME },
        { id: 'cat-2', name: '食費', type: CategoryType.EXPENSE },
      );

      expect(history.isCategoryTypeChanged()).toBe(true);
    });
  });
});
