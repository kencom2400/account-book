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
  // E2Eテスト環境かどうかを判定（JestのE2Eテスト実行時）
  // 注意: CI環境では全マイグレーションが揃っていないため、一時的にsynchronize: trueを使用
  // Issue #270完了後、環境別DB分離により根本解決予定
  const isE2ETest: boolean = false; // 一時的に無効化

  const connectionOptions = getDatabaseConnectionOptions();

  return {
    type: 'mysql',
    ...connectionOptions,
    entities: [__dirname + '/../**/*.orm-entity{.ts,.js}'],
    // synchronize を E2Eテスト環境のみ無効化
    // 理由: E2Eテスト環境では synchronize による外部キー制約の削除順序問題が発生するため
    // （Issue #261: TypeORMマイグレーション外部キー制約のインデックス削除エラー）
    // 開発環境では synchronize: true で開発効率を維持
    synchronize: !isProduction && !isE2ETest,
    // マイグレーション設定
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    // E2Eテスト環境のみマイグレーション自動実行
    // 本番環境では手動でマイグレーション実行（運用リスク軽減のため）
    migrationsRun: isE2ETest,
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
