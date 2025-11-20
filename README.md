# Account Book

個人資産管理アプリケーション

## セットアップ

### 前提条件

- Docker と Docker Compose（Docker版を使用する場合）
- または Python 3.8+ と pip3（ローカル環境を使用する場合）

### 初回セットアップ（推奨）

新しくプロジェクトに参加する場合は、以下のワンコマンドで環境構築が完了します：

```bash
# リポジトリのクローン
git clone https://github.com/kencom2400/account-book.git
cd account-book

# 初回環境セットアップ（自動）
./scripts/setup/initial-setup.sh
```

このスクリプトは以下を自動的に実行します：

- Python 3.8+ と pip3 の存在確認
- nodeenv のインストール
- Node.js 20.18.1 環境の作成 (.nodeenv)
- corepack の有効化と pnpm 8.15.0 のセットアップ
- 依存関係のインストール
- 共通ライブラリのビルド
- 環境変数ファイルの作成 (.env)
- 環境の検証

セットアップ完了後、以下のコマンドで開発を開始できます：

```bash
# 開発サーバーの起動
./scripts/dev/dev-parallel.sh
```

### インストール

#### Docker版（推奨）

```bash
# 1. リポジトリのクローン
git clone https://github.com/kencom2400/account-book.git
cd account-book

# 2. 環境変数の設定
cp .env.example .env
# .envファイルを編集して必要な値を設定

# 3. Docker環境の起動
./scripts/dev/dev-docker.sh all

# または
docker-compose up
```

アクセス:

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

#### ローカル環境（従来の方法）

```bash
# nodeenv環境の作成
nodeenv --node=20.18.1 --prebuilt .nodeenv

# 環境のアクティベート
source .nodeenv/bin/activate

# corepackの有効化
corepack enable
corepack prepare pnpm@8.15.0 --activate

# 依存関係のインストールと初期セットアップ
./scripts/setup/setup.sh
```

### 開発サーバーの起動

#### Docker版

```bash
# すべてのコンテナを起動（バックグラウンド）
./scripts/dev/dev-docker.sh start

# バックエンドのみ起動
./scripts/dev/dev-docker.sh start backend

# フロントエンドのみ起動
./scripts/dev/dev-docker.sh start frontend

# コンテナを停止
./scripts/dev/dev-docker.sh stop

# コンテナを再起動
./scripts/dev/dev-docker.sh restart

# ログを確認
./scripts/dev/dev-docker.sh logs          # すべてのログ
./scripts/dev/dev-docker.sh logs backend   # バックエンドのログ
./scripts/dev/dev-docker.sh logs frontend  # フロントエンドのログ

# コンテナの状態を確認
./scripts/dev/dev-docker.sh status

# コンテナをビルドして起動
./scripts/dev/dev-docker.sh build
```

**注意**: 旧形式（`./scripts/dev/dev-docker.sh all`）も使用可能ですが、フォアグラウンドで実行されます。

#### ローカル環境

```bash
# 環境のアクティベート（必要に応じて）
source .nodeenv/bin/activate

# 全サービスの起動
pnpm dev
```

- フロントエンド: http://localhost:3000
- バックエンド: http://localhost:3001

### 個別のサービス起動

```bash
# バックエンドのみ
pnpm --filter @account-book/backend dev

# フロントエンドのみ
pnpm --filter @account-book/frontend dev
```

## テスト実行

```bash
# 全てのテスト（ユニットテスト）
pnpm test

# ユニットテスト
pnpm test:unit

# E2Eテスト
pnpm test:e2e

# スクリプト経由で実行
./scripts/test/test.sh [backend|frontend|all] [unit|e2e|all]
./scripts/test/test-e2e.sh [backend|frontend|all]
```

詳細は[テスト実行ガイド](./docs/testing-guide.md)を参照してください。

## ビルド

```bash
pnpm build
```

## プロジェクト構成

- `apps/frontend` - Next.js フロントエンド
- `apps/backend` - NestJS バックエンド
- `libs/types` - 共通型定義
- `libs/utils` - 共通ユーティリティ

## トラブルシューティング

### Git pre-commitフックでpnpmが見つからない場合

Huskyのpre-commitフック実行時に`pnpm: command not found`エラーが発生した場合：

1. pnpmが正しくインストールされているか確認：

   ```bash
   pnpm --version
   ```

2. プロジェクトの`.husky/pre-commit`ファイルには、一般的なpnpmのインストールパスが自動的に設定されています

3. 詳細は[SETUP.md](./SETUP.md#pnpmコマンドが見つからない場合git-pre-commitフック)を参照してください

## 技術スタック

### フロントエンド

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS

### バックエンド

- NestJS
- TypeScript
- Node.js 20

### 共通

- pnpm workspace
- Turbo (monorepo)
- ESLint
- Prettier

## ライセンス

ISC
