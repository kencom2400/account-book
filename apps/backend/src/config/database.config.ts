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
    // synchronize を完全に無効化（マイグレーション管理に移行）
    // 理由: 外部キー制約を含む複雑なスキーマでは、
    // synchronize による自動スキーマ同期で削除順序の問題が発生する
    // （Issue #261: TypeORMマイグレーション外部キー制約のインデックス削除エラー）
    synchronize: false,
    // マイグレーション設定
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    migrationsRun: true, // 起動時にマイグレーションを自動実行
    // 開発環境・テスト環境でクエリログを出力（エラーデバッグ用）
    logging: !isProduction || isTest,
    charset: 'utf8mb4',
    timezone: '+09:00',
    // コネクションプール設定
    extra: {
      connectionLimit: 10,
    },
  };
};
