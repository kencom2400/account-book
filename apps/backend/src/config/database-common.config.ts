/**
 * データベース接続設定の共通定義
 * database.config.ts と typeorm-migration.config.ts で共有
 */

export interface DatabaseConnectionOptions {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

/**
 * 環境変数からデータベース接続情報を取得
 */
export function getDatabaseConnectionOptions(): DatabaseConnectionOptions {
  return {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    username: process.env.MYSQL_USER || 'account_book_user',
    password: process.env.MYSQL_PASSWORD || 'password',
    database: process.env.MYSQL_DATABASE || 'account_book_dev',
  };
}
