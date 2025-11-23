# Docker Compose 環境設定

## 概要

このディレクトリには、環境別のDocker Compose設定ファイルが含まれています。
各環境は独立したポート、コンテナ名、データベースを使用し、同時実行が可能です。

## ファイル一覧

| ファイル                  | 環境   | 用途                                         |
| ------------------------- | ------ | -------------------------------------------- |
| `docker-compose.yml`      | 共通   | 後方互換性のための既存設定（開発環境と同等） |
| `docker-compose.dev.yml`  | 開発   | 日常的な開発作業用                           |
| `docker-compose.test.yml` | テスト | ユニットテスト実行用                         |
| `docker-compose.e2e.yml`  | E2E    | E2Eテスト実行用                              |

## ポート割り当て

各環境には専用のポート範囲が割り当てられています：

| 環境        | Backend | Frontend | MySQL | 説明                   |
| ----------- | ------- | -------- | ----- | ---------------------- |
| **develop** | 3001    | 3000     | 3306  | 開発環境（デフォルト） |
| **test**    | 3011    | 3010     | 3316  | ユニットテスト環境     |
| **e2e**     | 3021    | 3020     | 3326  | E2Eテスト環境          |

## 使用方法

### 開発環境の起動

```bash
# 方法1: 既存のdocker-compose.ymlを使用（後方互換性）
docker-compose up

# 方法2: docker-compose.dev.ymlを明示的に指定
docker-compose -f docker-compose.dev.yml up

# バックグラウンド起動
docker-compose -f docker-compose.dev.yml up -d
```

### テスト環境の起動

```bash
# ユニットテスト環境
docker-compose -f docker-compose.test.yml up -d

# E2Eテスト環境
docker-compose -f docker-compose.e2e.yml up -d
```

### 複数環境の同時起動

```bash
# 開発環境とE2E環境を同時起動
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.e2e.yml up -d

# すべてのコンテナ確認
docker ps
```

### 環境のクリーンアップ

```bash
# 開発環境を停止・削除
docker-compose -f docker-compose.dev.yml down

# データボリュームも削除
docker-compose -f docker-compose.dev.yml down -v

# すべての環境を停止
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.test.yml down
docker-compose -f docker-compose.e2e.yml down
```

## 環境変数

各環境は専用の環境変数を使用します。`.env`ファイルで設定可能です：

### 開発環境

```bash
# Backend
BACKEND_PORT_DEV=3001

# Frontend
FRONTEND_PORT_DEV=3000

# MySQL
MYSQL_PORT_DEV=3306
MYSQL_DATABASE_DEV=account_book_dev
MYSQL_USER_DEV=account_book_user
MYSQL_PASSWORD_DEV=password
```

### テスト環境

```bash
# Backend
BACKEND_PORT_TEST=3011

# Frontend
FRONTEND_PORT_TEST=3010

# MySQL
MYSQL_PORT_TEST=3316
MYSQL_DATABASE_TEST=account_book_test
MYSQL_USER_TEST=account_book_test_user
MYSQL_PASSWORD_TEST=test_password
```

### E2E環境

```bash
# Backend
BACKEND_PORT_E2E=3021

# Frontend
FRONTEND_PORT_E2E=3020

# MySQL
MYSQL_PORT_E2E=3326
MYSQL_DATABASE_E2E=account_book_e2e
MYSQL_USER_E2E=account_book_e2e_user
MYSQL_PASSWORD_E2E=e2e_password
```

### 共通環境変数

```bash
# MySQL Root
MYSQL_ROOT_PASSWORD=root_password

# アプリケーション
ENCRYPTION_KEY=your-encryption-key
CRYPTO_SALT=your-crypto-salt
```

## コンテナ名

各環境は独立したコンテナ名を使用します：

### 開発環境

- `account-book-mysql-dev`
- `account-book-backend-dev`
- `account-book-frontend-dev`

### テスト環境

- `account-book-mysql-test`
- `account-book-backend-test`
- `account-book-frontend-test`

### E2E環境

- `account-book-mysql-e2e`
- `account-book-backend-e2e`
- `account-book-frontend-e2e`

## Docker Network

各環境は独立したネットワークを使用します：

- `account-book-network-dev` - 開発環境
- `account-book-network-test` - テスト環境
- `account-book-network-e2e` - E2E環境

## Docker Volume

各環境は独立したデータボリュームを使用します：

- `mysql-data-dev` - 開発環境のMySQLデータ
- `mysql-data-test` - テスト環境のMySQLデータ
- `mysql-data-e2e` - E2E環境のMySQLデータ

## トラブルシューティング

### ポート競合エラー

```bash
Error: bind: address already in use
```

**原因**: 指定したポートが既に使用されています。

**対処法**:

1. 使用中のポートを確認

```bash
lsof -i :3001
```

2. 環境変数でポートを変更

```bash
BACKEND_PORT_DEV=3002 docker-compose -f docker-compose.dev.yml up
```

### コンテナ名の競合

```bash
Error: container name already in use
```

**原因**: 同じコンテナ名が既に存在します。

**対処法**:

```bash
# 既存のコンテナを停止・削除
docker stop account-book-mysql-dev
docker rm account-book-mysql-dev

# または、すべてのコンテナを削除
docker-compose -f docker-compose.dev.yml down
```

### データベース接続エラー

**対処法**:

1. MySQLコンテナのヘルスチェック確認

```bash
docker-compose -f docker-compose.dev.yml ps
```

2. MySQLログ確認

```bash
docker logs account-book-mysql-dev
```

3. データベースリセット

```bash
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

## ベストプラクティス

### 1. 環境の分離を維持

- 開発中は`docker-compose.dev.yml`を使用
- テスト実行時は`docker-compose.test.yml`または`docker-compose.e2e.yml`を使用
- 環境を混在させない

### 2. データのクリーンアップ

テスト環境のデータは定期的にクリーンアップ：

```bash
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.e2e.yml down -v
```

### 3. リソース管理

不要なコンテナは停止してリソースを節約：

```bash
docker-compose -f docker-compose.dev.yml stop
```

### 4. ログの確認

問題が発生した場合はログを確認：

```bash
# すべてのサービスのログ
docker-compose -f docker-compose.dev.yml logs

# 特定のサービスのログ
docker-compose -f docker-compose.dev.yml logs backend

# リアルタイムでログを表示
docker-compose -f docker-compose.dev.yml logs -f
```

## 関連ドキュメント

- [CI/CD設定ガイドライン](.cursor/rules/05-ci-cd.md)
- [環境設定ドキュメント](docs/environment-configuration.md)
- [SETUP.md](SETUP.md)

## 備考

- 既存の`docker-compose.yml`は後方互換性のために残されています
- 新しい開発作業では`docker-compose.dev.yml`の使用を推奨します
- 各環境は完全に独立しており、同時実行が可能です
