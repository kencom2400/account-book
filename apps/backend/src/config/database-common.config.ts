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
 *
 * アプリケーション起動時に環境変数の設定ミスや、意図しない環境への接続を防止するため、
 * NODE_ENVとMYSQL_DATABASEの整合性をチェックします。
 *
 * ## 検証内容
 *
 * ### 1. DB名の検証（エラーレベル）
 * - NODE_ENVに対応したDB名パターンとの一致を確認
 * - 不一致の場合はエラーを出力してアプリケーションを停止
 *
 * ### 2. ポートの検証（警告レベル）
 * - NODE_ENVに対応したポート番号との一致を確認
 * - 不一致の場合は警告を表示するが起動は継続
 *
 * ### 3. 環境情報の表示
 * - 起動時に接続先のDB情報を明示的に表示
 *
 * ## 環境別の期待値
 *
 * | NODE_ENV | DB名パターン | 推奨ポート | 許可ポート |
 * |----------|-------------|-----------|-----------|
 * | development | account_book_dev | 3306 | 3306 |
 * | test | account_book_test または account_book_e2e | 3316 | 3316, 3326, 3306 |
 *
 * ## エラー例
 *
 * ```
 * ❌ 環境不整合エラー
 * NODE_ENV: development
 * 期待されるDB名: account_book_dev
 * 実際のDB名: account_book_e2e
 * → アプリケーションが停止します
 * ```
 *
 * @param nodeEnv - NODE_ENV環境変数の値（例: 'development', 'test'）
 * @param dbName - MYSQL_DATABASE環境変数の値（例: 'account_book_dev'）
 * @param dbPort - MYSQL_PORT環境変数の値（例: 3306, 3316, 3326）
 * @throws {Error} NODE_ENVとDB名が一致しない場合
 *
 * @example
 * // 正常なケース
 * validateEnvironmentConsistency('development', 'account_book_dev', 3306);
 * // → 検証OK、環境情報を表示
 *
 * @example
 * // エラーケース
 * validateEnvironmentConsistency('development', 'account_book_e2e', 3326);
 * // → Error: 環境とDB名が一致しません
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
 *
 * アプリケーション起動時にデータベース接続情報を取得し、環境の整合性を検証します。
 *
 * ## 機能
 *
 * 1. **環境変数の読み込み**
 *    - MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE
 *    - 各環境変数が未設定の場合はデフォルト値を使用
 *
 * 2. **環境整合性チェック**
 *    - NODE_ENVとMYSQL_DATABASEの整合性を検証
 *    - 不一致の場合はエラーで停止（マイグレーション実行時を除く）
 *
 * 3. **視覚的な確認**
 *    - 起動時に接続先DB情報をコンソールに表示
 *
 * ## 環境変数
 *
 * ### 必須環境変数
 * - `NODE_ENV`: 実行環境（development, test, production）
 * - `MYSQL_DATABASE`: データベース名
 *
 * ### オプション環境変数（デフォルト値あり）
 * - `MYSQL_HOST`: DBホスト（デフォルト: 'localhost'）
 * - `MYSQL_PORT`: DBポート（デフォルト: '3306'）
 * - `MYSQL_USER`: DBユーザー名（デフォルト: 'account_book_user'）
 * - `MYSQL_PASSWORD`: DBパスワード（デフォルト: 'password'）
 *
 * ### 特殊環境変数
 * - `TYPEORM_MIGRATION`: マイグレーション実行時は'true'を設定（検証をスキップ）
 *
 * ## デフォルト値
 *
 * | 環境変数 | デフォルト値 |
 * |---------|-------------|
 * | MYSQL_HOST | localhost |
 * | MYSQL_PORT | 3306 |
 * | MYSQL_USER | account_book_user |
 * | MYSQL_PASSWORD | password |
 * | MYSQL_DATABASE | account_book_dev |
 *
 * ## 安全性
 *
 * この関数は以下の多層防御を提供します：
 * - **第1層（アプリケーション）**: 起動時の環境検証
 * - **第2層（Docker）**: docker-composeでの環境変数固定
 * - **第3層（スクリプト）**: 環境別の起動制御
 *
 * @returns データベース接続オプション
 * @throws {Error} 環境とDB名が一致しない場合（マイグレーション時を除く）
 *
 * @example
 * // 開発環境での使用
 * process.env.NODE_ENV = 'development';
 * process.env.MYSQL_DATABASE = 'account_book_dev';
 * const options = getDatabaseConnectionOptions();
 * // → { host: 'localhost', port: 3306, ... }
 *
 * @example
 * // マイグレーション実行時（検証スキップ）
 * process.env.TYPEORM_MIGRATION = 'true';
 * const options = getDatabaseConnectionOptions();
 * // → 環境検証をスキップして接続情報を返す
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
