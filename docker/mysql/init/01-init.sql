-- MySQL初期化スクリプト
-- このスクリプトはMySQLコンテナの初回起動時に自動実行されます

-- データベースの文字コード設定を確認
SELECT @@character_set_database, @@collation_database;

-- タイムゾーンの設定
SET GLOBAL time_zone = '+09:00';

-- デフォルトの認証プラグインを確認
-- MySQL 8.0では caching_sha2_password がデフォルトですが、
-- 互換性のために mysql_native_password を使用する場合は以下を有効化
-- ALTER USER 'account_book_user'@'%' IDENTIFIED WITH mysql_native_password BY 'password';

-- 初期化完了のログ
SELECT 'MySQL Database Initialized Successfully' AS status;

