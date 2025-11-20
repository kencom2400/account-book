import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

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

  return {
    type: 'mysql',
    host: configService.get<string>(
      isTest ? 'MYSQL_TEST_HOST' : 'MYSQL_HOST',
      'localhost',
    ),
    port: configService.get<number>(
      isTest ? 'MYSQL_TEST_PORT' : 'MYSQL_PORT',
      isTest ? 3307 : 3306,
    ),
    username: configService.get<string>(
      isTest ? 'MYSQL_TEST_USER' : 'MYSQL_USER',
      'account_book_user',
    ),
    password: configService.get<string>(
      isTest ? 'MYSQL_TEST_PASSWORD' : 'MYSQL_PASSWORD',
      'password',
    ),
    database: configService.get<string>(
      isTest ? 'MYSQL_TEST_DATABASE' : 'MYSQL_DATABASE',
      'account_book_dev',
    ),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
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
