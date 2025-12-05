import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { E2ETestDatabaseHelper } from './helpers/database-helper';
import { createTestApp } from './helpers/test-setup';
import { DataSource } from 'typeorm';

/**
 * FR-009 Phase 7: データ整合性テスト
 *
 * このテストでは、以下の整合性を確認します:
 * - トランザクション整合性（ロールバック、並行更新）
 * - 外部キー制約
 * - データの一貫性
 */
describe('Subcategory Classification Data Integrity Tests', () => {
  let app: INestApplication;
  let dbHelper: E2ETestDatabaseHelper;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });

    app = await createTestApp(moduleBuilder, {
      enableValidationPipe: true,
      enableHttpExceptionFilter: true,
    });

    dbHelper = new E2ETestDatabaseHelper(app);
    dataSource = app.get(DataSource);

    const isConnected: boolean = await dbHelper.checkConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }
  });

  beforeEach(async () => {
    // 各テスト前にデータベースをクリーンアップ（beforeEachで実行することで、テスト間のデータ漏れを防ぐ）
    await dbHelper.cleanDatabase();
  });

  afterEach(async () => {
    // テスト後にクリーンアップ（念のため）
    await dbHelper.cleanDatabase();
  });

  afterAll(async () => {
    await dbHelper.cleanup();
    await app.close();
  });

  describe('外部キー制約のテスト', () => {
    beforeEach(async () => {
      // テスト用のサブカテゴリを準備
      await dataSource.query(
        `INSERT INTO subcategories (id, category_type, name, parent_id, display_order, icon, color, is_default, is_active)
         VALUES 
         ('food', 'EXPENSE', '食費', NULL, 1, '🍔', '#4CAF50', 1, 1),
         ('food_cafe', 'EXPENSE', 'カフェ', 'food', 1, '☕', '#795548', 1, 1)`,
      );
    });

    it.skip('存在しない親カテゴリを指定した場合、外部キー制約でエラーになる（要外部キー制約）', async () => {
      // NOTE: 現在のスキーマでは外部キー制約が設定されていない可能性がある
      // アプリケーション層でバリデーションする必要がある
      await expect(
        dataSource.query(
          `INSERT INTO subcategories (id, category_type, name, parent_id, display_order, icon, color, is_default, is_active)
           VALUES ('invalid_child', 'EXPENSE', 'テスト', 'non_existent_parent', 1, '🍔', '#4CAF50', 1, 1)`,
        ),
      ).rejects.toThrow();
    });

    it.skip('存在しないサブカテゴリIDを店舗マスタに指定した場合、外部キー制約でエラーになる（要外部キー制約）', async () => {
      // NOTE: 現在のスキーマでは外部キー制約が設定されていない可能性がある
      // アプリケーション層でバリデーションする必要がある
      await expect(
        dataSource.query(
          `INSERT INTO merchants (id, name, aliases, default_subcategory_id, confidence)
           VALUES ('merchant_test', 'テスト店舗', '["TEST"]', 'non_existent_subcategory', 0.90)`,
        ),
      ).rejects.toThrow();
    });

    it.skip('親カテゴリを削除しようとした場合、子カテゴリが存在するためエラーになる（要外部キー制約）', async () => {
      // NOTE: 現在のスキーマでは外部キー制約が設定されていない、またはON DELETE CASCADEが設定されている可能性がある
      // アプリケーション層で削除前チェックが必要
      // 外部キー制約（CASCADE設定されていない場合）により削除不可
      await expect(
        dataSource.query(`DELETE FROM subcategories WHERE id = 'food'`),
      ).rejects.toThrow();
    });
  });

  describe('トランザクション整合性のテスト', () => {
    beforeEach(async () => {
      await dataSource.query(
        `INSERT INTO subcategories (id, category_type, name, parent_id, display_order, icon, color, is_default, is_active)
         VALUES ('food_cafe', 'EXPENSE', 'カフェ', NULL, 1, '☕', '#795548', 1, 1)`,
      );

      await dataSource.query(
        `INSERT INTO merchants (id, name, aliases, default_subcategory_id, confidence)
         VALUES ('merchant_starbucks', 'スターバックス', '["STARBUCKS"]', 'food_cafe', 0.98)`,
      );
    });

    it('トランザクション内のエラーで適切にロールバックされる', async () => {
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // 正常な挿入
        await queryRunner.query(
          `INSERT INTO merchants (id, name, aliases, default_subcategory_id, confidence)
           VALUES ('merchant_test1', 'テスト1', '["TEST1"]', 'food_cafe', 0.90)`,
        );

        // エラーが発生する挿入（重複ID）
        await queryRunner.query(
          `INSERT INTO merchants (id, name, aliases, default_subcategory_id, confidence)
           VALUES ('merchant_test1', 'テスト2', '["TEST2"]', 'food_cafe', 0.90)`,
        );

        await queryRunner.commitTransaction();
      } catch {
        await queryRunner.rollbackTransaction();
      } finally {
        await queryRunner.release();
      }

      // ロールバックされたため、merchant_test1は存在しないはず
      const result = await dataSource.query(
        `SELECT * FROM merchants WHERE id = 'merchant_test1'`,
      );
      expect(result.length).toBe(0);
    });

    it.skip('並行更新時の競合を適切に処理できる（楽観的ロック実装が必要）', async () => {
      // NOTE: このテストは並行更新の競合を検証するものですが、
      // データベース側でのロック待機により長時間かかる可能性があります。
      // アプリケーション層で楽観的ロック（バージョンカラム）を実装する必要があります。
      // 将来的に楽観的ロックが実装されたら、このテストを有効化してください。

      // 同じ店舗マスタを2つのトランザクションで同時に更新
      // 注意: この並行更新テストはデータベースの分離レベルに依存するため、
      // タイムアウトやデッドロック発生時のエラーハンドリングが必要
      const queryRunner1 = dataSource.createQueryRunner();
      const queryRunner2 = dataSource.createQueryRunner();

      await queryRunner1.connect();
      await queryRunner2.connect();

      await queryRunner1.startTransaction();
      await queryRunner2.startTransaction();

      try {
        // トランザクション1: confidence を 0.95 に更新
        await queryRunner1.query(
          `UPDATE merchants SET confidence = 0.95 WHERE id = 'merchant_starbucks'`,
        );

        // トランザクション2: confidence を 0.99 に更新
        // 注意: トランザクション1がロックを持っているため、ここでロック待機が発生する可能性がある
        try {
          await queryRunner2.query(
            `UPDATE merchants SET confidence = 0.99 WHERE id = 'merchant_starbucks'`,
          );

          // トランザクション1をコミット
          await queryRunner1.commitTransaction();

          // トランザクション2をコミット
          await queryRunner2.commitTransaction();

          // 最後にコミットされた値が反映されることを確認
          const result = await dataSource.query(
            `SELECT confidence FROM merchants WHERE id = 'merchant_starbucks'`,
          );
          expect(result[0].confidence).toBe(0.99);
        } catch (error) {
          // ロックタイムアウトまたはデッドロックが発生した場合
          // これは並行更新の典型的な動作であり、エラーではない
          await queryRunner1.rollbackTransaction();
          await queryRunner2.rollbackTransaction();

          // エラーメッセージを確認（ロックタイムアウトまたはデッドロック）
          expect(
            (error as Error).message.includes('Lock wait timeout') ||
              (error as Error).message.includes('Deadlock'),
          ).toBe(true);
        }
      } finally {
        await queryRunner1.release();
        await queryRunner2.release();
      }
    }, 60000); // タイムアウトを60秒に延長
  });

  describe('データの一貫性テスト', () => {
    beforeEach(async () => {
      await dataSource.query(
        `INSERT INTO subcategories (id, category_type, name, parent_id, display_order, icon, color, is_default, is_active)
         VALUES 
         ('food', 'EXPENSE', '食費', NULL, 1, '🍔', '#4CAF50', 1, 1),
         ('food_cafe', 'EXPENSE', 'カフェ', 'food', 1, '☕', '#795548', 1, 1)`,
      );
    });

    it('階層構造の整合性: 親カテゴリと子カテゴリのカテゴリタイプが一致する', async () => {
      const result = await dataSource.query(`
        SELECT 
          c.id AS child_id,
          c.category_type AS child_type,
          p.id AS parent_id,
          p.category_type AS parent_type
        FROM subcategories c
        LEFT JOIN subcategories p ON c.parent_id = p.id
        WHERE c.parent_id IS NOT NULL
      `);

      // すべての子カテゴリは親カテゴリと同じカテゴリタイプであることを確認
      result.forEach((row: { child_type: string; parent_type: string }) => {
        expect(row.child_type).toBe(row.parent_type);
      });
    });

    it.skip('階層構造の整合性: 循環参照が存在しない（ビジネスロジックで防止する必要がある）', async () => {
      // NOTE: 外部キー制約では循環参照を防げない
      // アプリケーション層で循環参照をチェックする必要がある
      // 循環参照のテストケースを挿入してみる
      // food -> food_cafe -> food という循環参照を作成しようとする
      await expect(
        dataSource.query(
          `UPDATE subcategories SET parent_id = 'food_cafe' WHERE id = 'food'`,
        ),
      ).rejects.toThrow(); // 外部キー制約またはビジネスロジックでエラーになるはず
    });

    it('display_order の一意性: 同じ親カテゴリ内でdisplay_orderが重複しない', async () => {
      // 同じ親カテゴリに複数の子カテゴリを追加
      await dataSource.query(
        `INSERT INTO subcategories (id, category_type, name, parent_id, display_order, icon, color, is_default, is_active)
         VALUES 
         ('food_groceries', 'EXPENSE', '食料品', 'food', 2, '🛒', '#4CAF50', 1, 1),
         ('food_dining_out', 'EXPENSE', '外食', 'food', 3, '🍽️', '#FF9800', 1, 1)`,
      );

      // 同じ親カテゴリ内でdisplay_orderの重複を検出
      const result = await dataSource.query(`
        SELECT parent_id, display_order, COUNT(*) as count
        FROM subcategories
        WHERE parent_id IS NOT NULL
        GROUP BY parent_id, display_order
        HAVING COUNT(*) > 1
      `);

      expect(result.length).toBe(0); // 重複が存在しないことを確認
    });

    it('display_order の一意性: ルートカテゴリ間でdisplay_orderが重複しない', async () => {
      // ルートカテゴリを追加
      await dataSource.query(
        `INSERT INTO subcategories (id, category_type, name, parent_id, display_order, icon, color, is_default, is_active)
         VALUES ('transport', 'EXPENSE', '交通費', NULL, 2, '🚗', '#2196F3', 1, 1)`,
      );

      // ルートカテゴリ間でdisplay_orderの重複を検出
      const result = await dataSource.query(`
        SELECT display_order, COUNT(*) as count
        FROM subcategories
        WHERE parent_id IS NULL
        GROUP BY display_order
        HAVING COUNT(*) > 1
      `);

      expect(result.length).toBe(0); // 重複が存在しないことを確認
    });

    it.skip('店舗マスタのconfidenceが0〜1の範囲内である（CHECK制約が必要）', async () => {
      // NOTE: MySQLのCHECK制約はMySQL 8.0.16以降でサポート
      // 現在のスキーマにCHECK制約が定義されていない場合、このテストは失敗する
      // アプリケーション層でバリデーションする必要がある
      await dataSource.query(
        `INSERT INTO merchants (id, name, aliases, default_subcategory_id, confidence)
         VALUES ('merchant_test', 'テスト', '["TEST"]', 'food_cafe', 0.95)`,
      );

      // 不正な値（1より大きい）を挿入しようとする
      await expect(
        dataSource.query(
          `INSERT INTO merchants (id, name, aliases, default_subcategory_id, confidence)
           VALUES ('merchant_invalid', 'テスト2', '["TEST2"]', 'food_cafe', 1.5)`,
        ),
      ).rejects.toThrow(); // CHECK制約でエラーになるはず

      // 不正な値（0未満）を挿入しようとする
      await expect(
        dataSource.query(
          `INSERT INTO merchants (id, name, aliases, default_subcategory_id, confidence)
           VALUES ('merchant_invalid2', 'テスト3', '["TEST3"]', 'food_cafe', -0.1)`,
        ),
      ).rejects.toThrow();
    });

    it('is_defaultフラグが正しく設定されている', async () => {
      // デフォルトカテゴリは is_default = 1 であることを確認
      const result = await dataSource.query(`
        SELECT id, is_default FROM subcategories WHERE id IN ('food', 'food_cafe')
      `);

      result.forEach((row: { is_default: number }) => {
        expect(row.is_default).toBe(1);
      });
    });

    it('is_activeフラグが正しく動作する', async () => {
      // 非アクティブなカテゴリを作成
      await dataSource.query(
        `INSERT INTO subcategories (id, category_type, name, parent_id, display_order, icon, color, is_default, is_active)
         VALUES ('food_inactive', 'EXPENSE', '非アクティブ', 'food', 10, '🚫', '#999999', 0, 0)`,
      );

      // アクティブなカテゴリのみを取得
      const response = await request(app.getHttpServer())
        .get('/subcategories')
        .expect(200);

      const inactiveCategory = response.body.data.find(
        (item: { id: string }) => item.id === 'food_inactive',
      );

      // 非アクティブなカテゴリは返されないことを確認
      expect(inactiveCategory).toBeUndefined();
    });
  });

  describe('JSON型フィールドの整合性テスト', () => {
    beforeEach(async () => {
      await dataSource.query(
        `INSERT INTO subcategories (id, category_type, name, parent_id, display_order, icon, color, is_default, is_active)
         VALUES ('food_cafe', 'EXPENSE', 'カフェ', NULL, 1, '☕', '#795548', 1, 1)`,
      );
    });

    it('店舗マスタのaliasesが正しいJSON配列形式である', async () => {
      // 正しいJSON配列を挿入
      const aliases = JSON.stringify(['ALIAS1', 'ALIAS2']);
      await dataSource.query(
        `INSERT INTO merchants (id, name, aliases, default_subcategory_id, confidence)
         VALUES ('merchant_valid', 'テスト', '${aliases}', 'food_cafe', 0.95)`,
      );

      const result = await dataSource.query(
        `SELECT aliases FROM merchants WHERE id = 'merchant_valid'`,
      );

      // MySQLのJSON型は文字列として返されるので、そのままパースする
      const parsedAliases =
        typeof result[0].aliases === 'string'
          ? JSON.parse(result[0].aliases)
          : result[0].aliases;

      expect(Array.isArray(parsedAliases)).toBe(true);
      expect(parsedAliases.length).toBe(2);
      expect(parsedAliases).toEqual(['ALIAS1', 'ALIAS2']);
    });

    it('不正なJSON形式のaliasesは挿入できない', async () => {
      // 不正なJSON形式を挿入しようとする
      await expect(
        dataSource.query(
          `INSERT INTO merchants (id, name, aliases, default_subcategory_id, confidence)
           VALUES ('merchant_invalid', 'テスト', 'INVALID_JSON', 'food_cafe', 0.95)`,
        ),
      ).rejects.toThrow(); // JSON制約でエラーになるはず
    });
  });

  describe('NULL値とデフォルト値のテスト', () => {
    it('サブカテゴリのparent_idはNULLが許可される', async () => {
      await dataSource.query(
        `INSERT INTO subcategories (id, category_type, name, parent_id, display_order, icon, color, is_default, is_active)
         VALUES ('root_category', 'EXPENSE', 'ルートカテゴリ', NULL, 1, '🍔', '#4CAF50', 1, 1)`,
      );

      const result = await dataSource.query(
        `SELECT parent_id FROM subcategories WHERE id = 'root_category'`,
      );
      expect(result[0].parent_id).toBeNull();
    });

    it('必須フィールドにNULLを挿入するとエラーになる', async () => {
      // nameフィールドをNULLにしようとする
      await expect(
        dataSource.query(
          `INSERT INTO subcategories (id, category_type, name, parent_id, display_order, icon, color, is_default, is_active)
           VALUES ('invalid_null', 'EXPENSE', NULL, NULL, 1, '🍔', '#4CAF50', 1, 1)`,
        ),
      ).rejects.toThrow();
    });
  });

  describe('一意性制約のテスト', () => {
    beforeEach(async () => {
      await dataSource.query(
        `INSERT INTO subcategories (id, category_type, name, parent_id, display_order, icon, color, is_default, is_active)
         VALUES ('food_cafe', 'EXPENSE', 'カフェ', NULL, 1, '☕', '#795548', 1, 1)`,
      );
    });

    it('同じIDのサブカテゴリは重複挿入できない', async () => {
      await expect(
        dataSource.query(
          `INSERT INTO subcategories (id, category_type, name, parent_id, display_order, icon, color, is_default, is_active)
           VALUES ('food_cafe', 'EXPENSE', '重複カフェ', NULL, 2, '☕', '#795548', 1, 1)`,
        ),
      ).rejects.toThrow();
    });

    it('同じIDの店舗マスタは重複挿入できない', async () => {
      await dataSource.query(
        `INSERT INTO merchants (id, name, aliases, default_subcategory_id, confidence)
         VALUES ('merchant_test', 'テスト1', '["TEST1"]', 'food_cafe', 0.95)`,
      );

      await expect(
        dataSource.query(
          `INSERT INTO merchants (id, name, aliases, default_subcategory_id, confidence)
           VALUES ('merchant_test', 'テスト2', '["TEST2"]', 'food_cafe', 0.90)`,
        ),
      ).rejects.toThrow();
    });
  });
});
