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
 * 環境とデータベース設定の整合性を検証
 */
function validateEnvironmentConsistency(
  nodeEnv: string,
  dbName: string,
  dbPort: number,
): void {
  // 環境別の期待値
  const expectedConfig: Record<
    string,
    { dbPattern: RegExp; port: number; allowedPorts: number[] }
  > = {
    development: {
      dbPattern: /^account_book_dev$/,
      port: 3306,
      allowedPorts: [3306],
    },
    test: {
      dbPattern: /^account_book_(test|e2e)$/,
      port: 3316,
      allowedPorts: [3316, 3326, 3306], // CI環境も考慮
    },
  };

  const expected = expectedConfig[nodeEnv] || expectedConfig.development;

  // DB名チェック（厳格）
  if (!expected.dbPattern.test(dbName)) {
    console.error('');
    console.error('═════════════════════════════════════════════════');
    console.error('❌ 環境不整合エラー');
    console.error('═════════════════════════════════════════════════');
    console.error(`   NODE_ENV: ${nodeEnv}`);
    console.error(`   期待されるDB名パターン: ${expected.dbPattern}`);
    console.error(`   実際のDB名: ${dbName}`);
    console.error('');
    console.error('【原因】');
    console.error(
      '  環境変数の設定ミス、または意図しないDB環境への接続の可能性があります。',
    );
    console.error('');
    console.error('【対処方法】');
    console.error('  1. 環境変数を確認: echo $MYSQL_DATABASE');
    console.error(
      `  2. 正しい値に設定: export MYSQL_DATABASE=account_book_dev`,
    );
    console.error(
      '  3. Docker環境の場合: docker-compose down && docker-compose up',
    );
    console.error('═════════════════════════════════════════════════');
    console.error('');
    throw new Error(
      `環境とDB名が一致しません: NODE_ENV=${nodeEnv}, MYSQL_DATABASE=${dbName}`,
    );
  }

  // ポートチェック（警告レベル）
  if (!expected.allowedPorts.includes(dbPort)) {
    console.warn('');
    console.warn('═════════════════════════════════════════════════');
    console.warn('⚠️  ポート番号の不整合（警告）');
    console.warn('═════════════════════════════════════════════════');
    console.warn(`   NODE_ENV: ${nodeEnv}`);
    console.warn(`   推奨ポート: ${expected.port}`);
    console.warn(`   実際のポート: ${dbPort}`);
    console.warn('');
    console.warn('【注意】');
    console.warn(
      '  このまま起動しますが、意図しない環境に接続している可能性があります。',
    );
    console.warn(
      '  他のテスト環境のDockerコンテナが起動していないか確認してください。',
    );
    console.warn('');
    console.warn('【確認コマンド】');
    console.warn('  docker ps | grep account-book-mysql');
    console.warn('═════════════════════════════════════════════════');
    console.warn('');
  }

  // 起動環境を明示的に表示
  console.log('');
  console.log('═════════════════════════════════════════════════');
  console.log('🔍 データベース接続環境');
  console.log('═════════════════════════════════════════════════');
  console.log(`   環境: ${nodeEnv}`);
  console.log(`   データベース: ${dbName}`);
  console.log(`   ホスト: ${process.env.MYSQL_HOST || 'localhost'}`);
  console.log(`   ポート: ${dbPort}`);
  console.log('═════════════════════════════════════════════════');
  console.log('');
}

/**
 * 環境変数からデータベース接続情報を取得
 * 起動時に環境の整合性を検証
 */
export function getDatabaseConnectionOptions(): DatabaseConnectionOptions {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const dbHost = process.env.MYSQL_HOST || 'localhost';
  const dbPort = parseInt(process.env.MYSQL_PORT || '3306', 10);
  const dbUsername = process.env.MYSQL_USER || 'account_book_user';
  const dbPassword = process.env.MYSQL_PASSWORD || 'password';
  const dbName = process.env.MYSQL_DATABASE || 'account_book_dev';

  // 環境整合性チェック（マイグレーション以外の場合のみ）
  // マイグレーション実行時は TYPEORM_MIGRATION=true が設定される
  if (!process.env.TYPEORM_MIGRATION) {
    validateEnvironmentConsistency(nodeEnv, dbName, dbPort);
  }

  return {
    host: dbHost,
    port: dbPort,
    username: dbUsername,
    password: dbPassword,
    database: dbName,
  };
}
