import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { getDatabaseConnectionOptions } from './database-common.config';

/**
 * TypeORM データベース接続設定
 * 環境変数から設定値を取得してTypeORMの設定を返す
 *
 * @param configService - NestJS ConfigService
 * @returns TypeORM モジュールオプション
 */
export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const nodeEnv: string = configService.get<string>('NODE_ENV', 'development');
  const isProduction: boolean = nodeEnv === 'production';
  const isTest: boolean = nodeEnv === 'test';

  const connectionOptions = getDatabaseConnectionOptions();

  return {
    type: 'mysql',
    ...connectionOptions,
    entities: [__dirname + '/../**/*.orm-entity{.ts,.js}'],
    // 本番環境では synchronize を無効化（マイグレーションを使用）
    synchronize: !isProduction && !isTest,
    // 開発環境でのみクエリログを出力
    logging: !isProduction && !isTest,
    charset: 'utf8mb4',
    timezone: '+09:00',
    // コネクションプール設定
    extra: {
      connectionLimit: 10,
    },
  };
};
