import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';

/**
 * E2Eテスト用のデータベースヘルパー
 */
export class E2ETestDatabaseHelper {
  private dataSource: DataSource;

  constructor(app: INestApplication) {
    this.dataSource = app.get(DataSource);
  }

  /**
   * すべてのテーブルをクリーンアップ
   * 直接SQLでDELETE FROMを使用して、TypeORMリポジトリ経由で挿入されなかったデータも削除
   * TRUNCATE TABLEは外部キー制約がある場合に失敗する可能性があるため、DELETE FROMを使用
   */
  async cleanDatabase(): Promise<void> {
    const entities = this.dataSource.entityMetadatas;
    const driverType = this.dataSource.driver.options.type;
    const isMysql = driverType === 'mysql' || driverType === 'mariadb';

    // 外部キー制約を一時的に無効化（MySQL固有）
    if (isMysql) {
      await this.dataSource.query('SET FOREIGN_KEY_CHECKS = 0;');
    }

    try {
      // すべてのテーブルをDELETE FROMでクリーンアップ（直接SQLを使用）
      // 外部キー制約がある場合でも確実に削除できる
      for (const entity of entities) {
        const tableName = entity.tableName;
        // DELETE FROMを使用して、直接SQLで挿入されたデータも削除
        await this.dataSource.query(`DELETE FROM \`${tableName}\``);
      }
    } finally {
      // 外部キー制約を再度有効化（MySQL固有）
      // エラーが発生しても必ず実行される
      if (isMysql) {
        await this.dataSource.query('SET FOREIGN_KEY_CHECKS = 1;');
      }
    }
  }

  /**
   * データベース接続の確認
   */
  async checkConnection(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * トランザクションの開始
   */
  async beginTransaction(): Promise<void> {
    await this.dataSource.query('START TRANSACTION;');
  }

  /**
   * トランザクションのコミット
   */
  async commitTransaction(): Promise<void> {
    await this.dataSource.query('COMMIT;');
  }

  /**
   * トランザクションのロールバック
   */
  async rollbackTransaction(): Promise<void> {
    await this.dataSource.query('ROLLBACK;');
  }

  /**
   * データベース接続のクリーンアップ
   * テスト終了時にすべての接続をクローズする
   */
  async cleanup(): Promise<void> {
    if (this.dataSource && this.dataSource.isInitialized) {
      await this.dataSource.destroy();
    }
  }
}
