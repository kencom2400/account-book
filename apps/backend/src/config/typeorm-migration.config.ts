import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { getDatabaseConnectionOptions } from './database-common.config';

// 環境変数を読み込み
config();

const connectionOptions = getDatabaseConnectionOptions();

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  ...connectionOptions,
  entities: ['src/**/*.orm-entity.ts'],
  migrations: ['src/migrations/*.ts'],
  charset: 'utf8mb4',
  timezone: '+09:00',
};

export default new DataSource(dataSourceOptions);
