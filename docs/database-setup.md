# MySQL + Docker データベース設定ガイド

## 概要

このプロジェクトは MySQL 8.0 + Docker Compose を使用してデータを管理しています。

## 前提条件

- Docker と Docker Compose がインストールされていること
- Node.js 20.x がインストールされていること
- pnpm がインストールされていること

## データベースのセットアップ

### 1. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成します：

```bash
# Application
NODE_ENV=development
PORT=3001

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001

# MySQL Database
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=account_book_user
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=account_book_dev
MYSQL_ROOT_PASSWORD=your_root_password

# MySQL Test Database (for E2E tests)
MYSQL_TEST_HOST=localhost
MYSQL_TEST_PORT=3307
MYSQL_TEST_USER=account_book_test_user
MYSQL_TEST_PASSWORD=test_password
MYSQL_TEST_DATABASE=account_book_test
MYSQL_TEST_ROOT_PASSWORD=test_root_password
```

### 2. MySQLコンテナの起動

```bash
# MySQLのみ起動
./scripts/dev/start-database.sh

# または、すべてのサービスを起動
docker-compose up -d
```

### 3. マイグレーションの実行

```bash
# マイグレーション実行
cd apps/backend
pnpm run migration:run
```

### 4. データ移行（JSONからMySQL）

既存のJSONデータをMySQLに移行する場合：

```bash
# データ移行スクリプト実行
cd apps/backend
pnpm ts-node scripts/migrate-json-to-mysql.ts
```

## データベース管理コマンド

### 起動・停止

```bash
# 起動
./scripts/dev/start-database.sh

# 停止
./scripts/dev/stop-database.sh
```

### バックアップ・リストア

```bash
# バックアップ
./scripts/data/backup-database.sh

# リストア
./scripts/data/restore-database.sh backups/account_book_backup_YYYYMMDD_HHMMSS.sql
```

### リセット（開発用）

```bash
# データベースを完全にリセット
./scripts/dev/reset-database.sh
```

## マイグレーション管理

### マイグレーションの作成

```bash
cd apps/backend
pnpm run migration:create src/migrations/YourMigrationName
```

### マイグレーションの生成（エンティティから自動生成）

```bash
cd apps/backend
pnpm run migration:generate src/migrations/YourMigrationName
```

### マイグレーションの実行

```bash
cd apps/backend
pnpm run migration:run
```

### マイグレーションの取り消し

```bash
cd apps/backend
pnpm run migration:revert
```

### マイグレーションの状態確認

```bash
cd apps/backend
pnpm run migration:show
```

## データベーススキーマ

### テーブル一覧

- `categories`: カテゴリ情報
- `institutions`: 金融機関情報
- `credit_cards`: クレジットカード情報
- `transactions`: 取引情報

詳細なスキーマ定義は `apps/backend/src/migrations/` を参照してください。

## トラブルシューティング

### MySQLに接続できない

```bash
# コンテナの状態確認
docker-compose ps

# ログ確認
docker-compose logs mysql

# コンテナ再起動
docker-compose restart mysql
```

### マイグレーションエラー

```bash
# データベースをリセットして再実行
./scripts/dev/reset-database.sh
```

### データ移行エラー

- JSONファイルのパスを確認
- データベースが起動しているか確認
- マイグレーションが実行済みか確認

## 本番環境への展開

本番環境では以下を推奨します：

- AWS RDS または Google Cloud SQL などのマネージドサービスを使用
- SSL/TLS接続を有効化
- 自動バックアップを設定
- レプリケーション設定（高可用性が必要な場合）

環境変数を本番用に設定し、`NODE_ENV=production` で実行してください。
