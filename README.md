# Account Book

個人資産管理アプリケーション

## セットアップ

### 前提条件

- **Node.js**: 20.18.1 (`.nvmrc`でバージョン固定)
- **pnpm**: 8.15.0 以上
- Docker と Docker Compose（Docker版を使用する場合）
- または Python 3.8+ と pip3（ローカル環境を使用する場合）
- MySQL 8.0（データベース）

**重要**: Node.jsとpnpmのバージョンは必須要件です。ローカルでのテストがCIと同じ結果になるよう、バージョンを固定しています。

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

# 3. Docker環境の起動（開発環境）
docker-compose -f docker-compose.dev.yml up -d

# または既存の設定（後方互換性）
docker-compose up -d
```

アクセス:

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- MySQL: localhost:3306

**🆕 環境別Docker設定**

プロジェクトでは環境別にDocker設定が分離されています：

| 環境     | Backend | Frontend | MySQL | 用途           |
| -------- | ------- | -------- | ----- | -------------- |
| **dev**  | 3001    | 3000     | 3306  | 開発環境       |
| **test** | 3011    | 3010     | 3316  | ユニットテスト |
| **e2e**  | 3021    | 3020     | 3326  | E2Eテスト      |

詳細は [DOCKER-COMPOSE.md](DOCKER-COMPOSE.md) を参照してください。

#### ローカル環境（従来の方法）

```bash
# 1. MySQLの起動（開発環境）
./scripts/dev/start-database.sh dev

# または特定環境を指定
./scripts/dev/start-database.sh test   # テスト環境
./scripts/dev/start-database.sh e2e    # E2E環境

# 2. nodeenv環境の作成
nodeenv --node=20.18.1 --prebuilt .nodeenv

# 3. 環境のアクティベート
source .nodeenv/bin/activate

# 4. corepackの有効化
corepack enable
corepack prepare pnpm@8.15.0 --activate

# 5. 依存関係のインストールと初期セットアップ
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

## 開発ワークフロー

### Issue開始スクリプト

Issue作業を効率的に開始するための`start-task.sh`スクリプトを提供しています。

#### 基本的な使い方

```bash
# 最優先Issueを自動選択して開始
./scripts/github/workflow/start-task.sh

# Issue番号を指定して開始
./scripts/github/workflow/start-task.sh #201
./scripts/github/workflow/start-task.sh 201  # #なしでもOK

# ヘルプ表示
./scripts/github/workflow/start-task.sh --help
```

#### 機能

- **自動選択モード（引数なし）**
  - GitHub Projectsから「📝 To Do」ステータスのIssueを取得
  - 優先度順に自動ソート（critical > high > medium > low）
  - 最優先Issueを自動的に開始

- **Issue ID指定モード（引数あり）**
  - 指定したIssue番号で作業を開始
  - Issue存在確認、ステータス確認を自動実行

#### スクリプトが実行する処理

1. Issue情報の取得と確認
2. 自分にアサイン（未アサインの場合）
3. mainブランチの最新化
4. フィーチャーブランチの作成（`feature/issue-{番号}-{タイトル}`）
5. GitHub ProjectsでステータスをIn Progressに変更

詳細は[scripts/github/workflow/README.md](./scripts/github/workflow/README.md)を参照してください。

## テスト実行

### ⚠️ テスト作成の必須化

**新規機能・バグ修正の実装時は、必ずテストを同時に作成してください。**

テストなしでのPRマージは禁止されています。詳細なガイドラインは以下を参照してください：

- **[テスト必須化ルール](./.cursor/rules/02-code-standards.md#-テスト作成の必須化最重要ルール)** - テスト作成の絶対ルール
- **[PRテンプレート](./.github/pull_request_template.md)** - テストチェックリスト
- **[コード品質基準](./.cursor/rules/02-code-standards.md)** - 型安全性とテスト実装ガイドライン

**目標カバレッジ:**

- Backend Unit: 80%以上
- Frontend Unit: 80%以上
- E2E: 主要フロー100%

**現在のカバレッジは[カバレッジレポート](./docs/testing/coverage-report.md)で確認できます。**

### ユニットテスト

```bash
# 全てのテスト（ユニットテスト）
pnpm test

# ユニットテスト
pnpm test:unit
```

### E2Eテスト

#### 前提条件

E2EテストはMySQLコンテナを使用します。テストスクリプトは、コンテナが起動していない場合に自動で起動を試みます。

手動でMySQLを起動する場合:

```bash
# MySQLコンテナの起動
./scripts/dev/start-database.sh
```

#### 実行方法

```bash
# E2Eテスト
pnpm test:e2e

# スクリプト経由で実行
./scripts/test/test.sh [backend|frontend|all] [unit|e2e|all]
./scripts/test/test-e2e.sh [backend|frontend|all]
```

詳細は[テスト実行ガイド](./docs/testing-guide.md)を参照してください。

### テストカバレッジ

プロジェクトのテストカバレッジ状況を確認できます：

- **[最新のカバレッジレポート](./docs/testing/coverage-report.md)** - モジュール別カバレッジサマリー
- **[カバレッジ履歴](./docs/testing/coverage-history.md)** - カバレッジの推移
- **モジュール別詳細**:
  - [Backend カバレッジ](./docs/testing/module-coverage/backend.md)
  - [Frontend カバレッジ](./docs/testing/module-coverage/frontend.md)

#### カバレッジレポートの生成

```bash
# カバレッジレポートを生成
./scripts/test/generate-coverage-report.sh

# カバレッジ履歴を更新
./scripts/test/update-coverage-history.sh
```

#### 個別モジュールのカバレッジ確認

```bash
# Backend ユニットテスト
cd apps/backend
pnpm test:cov

# Backend E2Eテスト
cd apps/backend
pnpm test:e2e:cov

# Frontend ユニットテスト
cd apps/frontend
pnpm test -- --coverage
```

## CI/CD

このプロジェクトはGitHub Actionsを使用してCI/CDパイプラインを構築しています。

### CIパイプライン

`main`または`develop`ブランチへのpushやPull Request時に以下が自動実行されます：

#### 1. Lint（静的解析）

- ESLintによるコードスタイルチェック
- TypeScriptの型チェック
- Node.js 20で実行

#### 2. Build（ビルドテスト）

- 共通ライブラリのビルド
- バックエンドのビルド
- フロントエンドのビルド
- Node.js 20と22のマトリックスビルド

#### 3. Unit Tests（ユニットテスト）

- バックエンドとフロントエンドのユニットテスト
- MySQL 8.0サービスコンテナ使用
- テストカバレッジレポートのCodecovへのアップロード

#### 4. Security Check（セキュリティチェック）

- pnpm auditによる依存関係の脆弱性スキャン
- 脆弱性レポートのアーティファクト保存（30日間）

#### 5. E2E Tests（E2Eテスト）

- Backend E2Eテスト（NestJS）
- Frontend E2Eテスト（Playwright）
- MySQL 8.0サービスコンテナを使用して実行

### CI設定ファイル

- `.github/workflows/ci.yml` - メインCIパイプライン

### ローカルでのCI検証

CIと同じチェックをローカルで実行できます：

```bash
# Lint
pnpm run lint

# Build
pnpm run build

# Unit Tests
pnpm run test

# E2E Tests
pnpm run test:e2e
```

または、統合スクリプトを使用：

```bash
# Lint
./scripts/test/lint.sh

# Tests
./scripts/test/test.sh all

# E2E Tests
./scripts/test/test-e2e.sh all
```

### バッジ

[![CI](https://github.com/kencom2400/account-book/actions/workflows/ci.yml/badge.svg)](https://github.com/kencom2400/account-book/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/kencom2400/account-book/branch/main/graph/badge.svg)](https://codecov.io/gh/kencom2400/account-book)

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
