import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

// 環境変数を読み込み
config();

const nodeEnv: string = process.env.NODE_ENV || 'development';
const isTest: boolean = nodeEnv === 'test';

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env[isTest ? 'MYSQL_TEST_HOST' : 'MYSQL_HOST'] || 'localhost',
  port: parseInt(
    process.env[isTest ? 'MYSQL_TEST_PORT' : 'MYSQL_PORT'] ||
      (isTest ? '3307' : '3306'),
  ),
  username:
    process.env[isTest ? 'MYSQL_TEST_USER' : 'MYSQL_USER'] ||
    'account_book_user',
  password:
    process.env[isTest ? 'MYSQL_TEST_PASSWORD' : 'MYSQL_PASSWORD'] ||
    'password',
  database:
    process.env[isTest ? 'MYSQL_TEST_DATABASE' : 'MYSQL_DATABASE'] ||
    'account_book_dev',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  charset: 'utf8mb4',
  timezone: '+09:00',
};

export default new DataSource(dataSourceOptions);
