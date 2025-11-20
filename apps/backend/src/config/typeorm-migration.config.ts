import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

// 環境変数を読み込み
config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  username: process.env.MYSQL_USER || 'account_book_user',
  password: process.env.MYSQL_PASSWORD || 'password',
  database: process.env.MYSQL_DATABASE || 'account_book_dev',
  entities: ['src/**/*.orm-entity.ts'],
  migrations: ['src/migrations/*.ts'],
  charset: 'utf8mb4',
  timezone: '+09:00',
};

export default new DataSource(dataSourceOptions);
