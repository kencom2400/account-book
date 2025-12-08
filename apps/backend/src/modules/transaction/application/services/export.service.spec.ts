import { ExportService } from './export.service';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { CategoryType, TransactionStatus } from '@account-book/types';

describe('ExportService', () => {
  let service: ExportService;

  const createTransaction = (
    id: string,
    date: Date,
    amount: number,
    description: string,
  ): TransactionEntity => {
    return new TransactionEntity(
      id,
      date,
      amount,
      { id: 'cat_1', name: '食費', type: CategoryType.EXPENSE },
      description,
      'inst_1',
      'acc_1',
      TransactionStatus.COMPLETED,
      false,
      null,
      new Date('2024-01-15T10:00:00Z'),
      new Date('2024-01-15T10:00:00Z'),
    );
  };

  beforeEach(() => {
    service = new ExportService();
  });

  describe('convertToCSV', () => {
    it('空の配列の場合は空文字を返す', () => {
      const result = service.convertToCSV([]);
      expect(result).toBe('');
    });

    it('1件の取引データをCSV形式に変換できる', () => {
      const transaction = createTransaction(
        'tx_1',
        new Date('2024-01-15'),
        1000,
        'テスト取引',
      );

      const result = service.convertToCSV([transaction]);

      expect(result).toContain('ID,日付,金額');
      expect(result).toContain('tx_1');
      expect(result).toContain('2024-01-15');
      expect(result).toContain('1000');
      expect(result).toContain('テスト取引');
    });

    it('複数の取引データをCSV形式に変換できる', () => {
      const transactions = [
        createTransaction('tx_1', new Date('2024-01-15'), 1000, '取引1'),
        createTransaction('tx_2', new Date('2024-01-16'), 2000, '取引2'),
      ];

      const result = service.convertToCSV(transactions);

      expect(result).toContain('tx_1');
      expect(result).toContain('tx_2');
      expect(result).toContain('1000');
      expect(result).toContain('2000');
    });

    it('CSVフィールドにカンマが含まれる場合はダブルクォートで囲む', () => {
      const transaction = createTransaction(
        'tx_1',
        new Date('2024-01-15'),
        1000,
        'テスト,取引',
      );

      const result = service.convertToCSV([transaction]);

      expect(result).toContain('"テスト,取引"');
    });

    it('CSVフィールドに改行が含まれる場合はダブルクォートで囲む', () => {
      const transaction = createTransaction(
        'tx_1',
        new Date('2024-01-15'),
        1000,
        'テスト\n取引',
      );

      const result = service.convertToCSV([transaction]);

      expect(result).toContain('"テスト\n取引"');
    });

    it('CSVフィールドにダブルクォートが含まれる場合はエスケープする', () => {
      const transaction = createTransaction(
        'tx_1',
        new Date('2024-01-15'),
        1000,
        'テスト"取引',
      );

      const result = service.convertToCSV([transaction]);

      expect(result).toContain('"テスト""取引"');
    });

    it('BOM付きUTF-8でエンコードされている（Excel対応）', () => {
      const transaction = createTransaction(
        'tx_1',
        new Date('2024-01-15'),
        1000,
        'テスト',
      );

      const result = service.convertToCSV([transaction]);

      // BOM (U+FEFF) が先頭に含まれている
      expect(result.charCodeAt(0)).toBe(0xfeff);
    });

    it('すべてのカラムが正しく出力される', () => {
      const transaction = createTransaction(
        'tx_1',
        new Date('2024-01-15'),
        1000,
        'テスト取引',
      );

      const result = service.convertToCSV([transaction]);
      const lines = result.split('\n');
      const header = lines[0];
      const data = lines[1];

      expect(header).toContain('ID');
      expect(header).toContain('日付');
      expect(header).toContain('金額');
      expect(header).toContain('カテゴリID');
      expect(header).toContain('カテゴリ名');
      expect(header).toContain('カテゴリタイプ');
      expect(header).toContain('摘要');
      expect(header).toContain('金融機関ID');
      expect(header).toContain('口座ID');
      expect(header).toContain('ステータス');
      expect(header).toContain('照合済み');
      expect(header).toContain('関連取引ID');
      expect(header).toContain('作成日時');
      expect(header).toContain('更新日時');

      expect(data).toContain('tx_1');
      expect(data).toContain('2024-01-15');
      expect(data).toContain('1000');
    });
  });

  describe('convertToJSON', () => {
    it('空の配列の場合は空配列のJSONを返す', () => {
      const result = service.convertToJSON([]);
      const parsed = JSON.parse(result);
      expect(parsed).toEqual([]);
    });

    it('1件の取引データをJSON形式に変換できる', () => {
      const transaction = createTransaction(
        'tx_1',
        new Date('2024-01-15'),
        1000,
        'テスト取引',
      );

      const result = service.convertToJSON([transaction]);
      const parsed = JSON.parse(result);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('tx_1');
      expect(parsed[0].amount).toBe(1000);
      expect(parsed[0].description).toBe('テスト取引');
    });

    it('複数の取引データをJSON形式に変換できる', () => {
      const transactions = [
        createTransaction('tx_1', new Date('2024-01-15'), 1000, '取引1'),
        createTransaction('tx_2', new Date('2024-01-16'), 2000, '取引2'),
      ];

      const result = service.convertToJSON(transactions);
      const parsed = JSON.parse(result);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe('tx_1');
      expect(parsed[1].id).toBe('tx_2');
    });

    it('整形されたJSONを返す（インデント付き）', () => {
      const transaction = createTransaction(
        'tx_1',
        new Date('2024-01-15'),
        1000,
        'テスト',
      );

      const result = service.convertToJSON([transaction]);

      // 改行が含まれている（整形されている）
      expect(result).toContain('\n');
      // インデントが含まれている
      expect(result).toContain('  ');
    });

    it('すべてのフィールドが正しく出力される', () => {
      const transaction = createTransaction(
        'tx_1',
        new Date('2024-01-15'),
        1000,
        'テスト取引',
      );

      const result = service.convertToJSON([transaction]);
      const parsed = JSON.parse(result);

      expect(parsed[0]).toHaveProperty('id');
      expect(parsed[0]).toHaveProperty('date');
      expect(parsed[0]).toHaveProperty('amount');
      expect(parsed[0]).toHaveProperty('category');
      expect(parsed[0]).toHaveProperty('description');
      expect(parsed[0]).toHaveProperty('institutionId');
      expect(parsed[0]).toHaveProperty('accountId');
      expect(parsed[0]).toHaveProperty('status');
      expect(parsed[0]).toHaveProperty('isReconciled');
      expect(parsed[0]).toHaveProperty('relatedTransactionId');
      expect(parsed[0]).toHaveProperty('createdAt');
      expect(parsed[0]).toHaveProperty('updatedAt');
    });
  });
});
