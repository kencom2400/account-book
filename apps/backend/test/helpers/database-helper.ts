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
      // すべてのテーブルをTRUNCATE
      for (const entity of entities) {
        const repository = this.dataSource.getRepository(entity.name);
        await repository.clear();
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
}
