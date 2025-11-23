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

## 制約事項

### 同じ環境での複数実行は不可

**重要**: 同じ環境設定（例: `docker-compose.e2e.yml`）を複数回同時に起動することはできません。

**理由**:

- Docker Composeはコンテナ名を固定で定義している（例: `account-book-mysql-e2e`）
- 同じコンテナ名は1つしか存在できない
- 2回目の起動時に`Error: container name already in use`エラーが発生する

**正しい使用方法**:

```bash
# ✅ 異なる環境の同時実行はOK
docker-compose -f docker-compose.dev.yml up -d   # 開発環境
docker-compose -f docker-compose.test.yml up -d  # テスト環境
docker-compose -f docker-compose.e2e.yml up -d   # E2E環境

# ❌ 同じ環境の複数実行は不可
docker-compose -f docker-compose.e2e.yml up -d  # 1回目: OK
docker-compose -f docker-compose.e2e.yml up -d  # 2回目: エラー！
```

**CI環境での動作**:

- GitHub Actionsでは各jobが独立したVMで実行される
- そのため、job間での競合は発生しない
- 各job内では単一の環境のみを起動するため問題ない

**ローカル環境での注意点**:

1. **テスト実行前に環境を確認**

```bash
# 既に起動中のコンテナを確認
docker ps | grep account-book

# 必要に応じて停止
docker-compose -f docker-compose.e2e.yml down
```

2. **自動的に既存環境を再利用**

- スクリプト（`test-e2e.sh`等）は既存のコンテナが起動中かチェックする
- 起動中の場合は再利用し、停止中の場合のみ起動する

3. **複数の開発者が同じマシンを使う場合**

この環境分離設計では、同じマシン上で複数の開発者が同時に作業することは想定していません。各開発者が独自のマシン（またはVM）を使用することを前提としています。

### 並列テスト実行の制約

**テストフレームワークのworker設定**:

```typescript
// playwright.config.ts
workers: process.env.CI ? 1 : undefined,
```

- CI環境では`workers: 1`で順次実行
- ローカル環境では並列実行可能（同じ環境内で複数のテストケースを実行）
- ただし、複数の環境設定ファイルを同時に使用することは不可

## 環境分離の安全性機構

このプロジェクトでは、意図しない環境への接続を防ぐため、以下の多層防御を実装しています。

### 【第1層】アプリケーション起動時の検証

**実装場所**: `apps/backend/src/config/database-common.config.ts`

**機能**:

- アプリケーション起動時にNODE_ENVとMYSQL_DATABASEの整合性をチェック
- 不一致の場合はエラーを出力してアプリケーションを停止
- ポート不整合時は警告を表示
- 接続先のDB情報を視覚的に表示

**検証例**:

```typescript
// 正常: development環境でaccount_book_devに接続
NODE_ENV=development MYSQL_DATABASE=account_book_dev
→ ✅ 起動OK

// エラー: development環境なのにaccount_book_e2eに接続しようとしている
NODE_ENV=development MYSQL_DATABASE=account_book_e2e
→ ❌ エラーで停止

// 起動時の表示例:
═════════════════════════════════════════════════
🔍 データベース接続環境
═════════════════════════════════════════════════
   環境: development
   データベース: account_book_dev
   ホスト: localhost
   ポート: 3306
═════════════════════════════════════════════════
```

### 【第4層】Docker Composeでの環境変数固定

**実装場所**: `docker-compose.{dev,test,e2e}.yml`

**機能**:

- 各環境のDB名を固定値で設定
- .envファイルからの上書きを防止
- コンテナ内では常に正しい環境設定を使用

**設定例**:

```yaml
# docker-compose.e2e.yml
services:
  backend:
    environment:
      # 以下の値は固定（.envから上書き不可）
      - NODE_ENV=test
      - MYSQL_DATABASE=account_book_e2e
      - MYSQL_USER=account_book_e2e_user
      - MYSQL_PASSWORD=e2e_password
```

### 【スクリプト層】環境別の動作制御

**実装場所**: `scripts/dev/start-database.sh`

**機能**:

- dev環境: 既存コンテナを再利用（開発効率優先）
- test/e2e環境: 常にクリーンな状態から開始（冪等性確保）
- コンテナの存在と状態を自動チェック

**動作例**:

```bash
# dev環境: 既存コンテナがあれば再利用
./start-database.sh dev
→ ✅ 既存のコンテナが起動中です: account-book-mysql-dev
   💡 開発環境では既存のコンテナを再利用します

# e2e環境: 既存コンテナは削除して再作成
./start-database.sh e2e
→ ⚠️  テスト環境は冪等性確保のため、常にクリーンな状態から開始します
   既存のコンテナを停止・削除して再作成します...
```

### 安全性のまとめ

| レイヤー     | 場所              | 保護内容               | エラー時の動作 |
| ------------ | ----------------- | ---------------------- | -------------- |
| 第1層        | アプリケーション  | NODE_ENVとDB名の整合性 | 起動停止       |
| 第4層        | Docker Compose    | 環境変数の固定         | 上書き不可     |
| スクリプト層 | start-database.sh | 環境別の再作成制御     | 自動処理       |

これらの多層防御により、以下のような事故を防止します：

- ❌ E2E環境が起動中に`pnpm dev`を実行 → 第1層で検出・停止
- ❌ 環境変数の設定ミス → 第1層で検出・停止
- ❌ Docker環境での誤設定 → 第4層で防止
- ❌ テスト環境のデータ汚染 → スクリプト層で防止（常に再作成）

## 関連ドキュメント

- [CI/CD設定ガイドライン](.cursor/rules/05-ci-cd.md)
- [環境設定ドキュメント](docs/environment-configuration.md)
- [SETUP.md](SETUP.md)

## 備考

- 既存の`docker-compose.yml`は後方互換性のために残されています
- 新しい開発作業では`docker-compose.dev.yml`の使用を推奨します
- 各環境は完全に独立しており、同時実行が可能です
