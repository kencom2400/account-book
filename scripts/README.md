# スクリプト一覧

このディレクトリには、プロジェクトの開発・運用を効率化するスクリプトが含まれています。

## 📋 目次

- [初回セットアップ](#初回セットアップ)
- [日常的な開発作業](#日常的な開発作業)
- [ビルドとテスト](#ビルドとテスト)
- [メンテナンス](#メンテナンス)
- [GitHub管理](#github管理)
- [スクリプト詳細](#スクリプト詳細)
- [トラブルシューティング](#トラブルシューティング)

---

## 🚀 初回セットアップ

### フルセットアップ（推奨）

プロジェクトをゼロからセットアップする場合：

```bash
./scripts/full-setup.sh
```

このスクリプトは以下を自動実行します：
1. Node.js環境のセットアップ
2. 依存パッケージのインストール
3. 共通ライブラリのビルド
4. 環境変数ファイルの作成

### 個別セットアップ

必要に応じて個別に実行することも可能です：

```bash
# 1. Node.js環境のセットアップ
./scripts/setup.sh

# 2. 依存パッケージのインストール
./scripts/install.sh

# 3. 共通ライブラリのビルド
./scripts/build-libs.sh
```

---

## 💻 日常的な開発作業

### 開発サーバーの起動

#### オプション1: 個別に起動（推奨）

**ターミナル1 - バックエンド:**
```bash
./scripts/dev.sh backend
```

**ターミナル2 - フロントエンド:**
```bash
./scripts/dev.sh frontend
```

**ターミナル3 - カテゴリ初期化（初回のみ）:**
```bash
# バックエンドが起動した後に実行
./scripts/init-categories.sh
```

#### オプション2: 並列起動

バックエンドとフロントエンドを同時にバックグラウンド起動：

```bash
./scripts/dev-parallel.sh
```

停止する場合：
```bash
./scripts/stop-dev.sh
```

**注意:** ログは `logs/` ディレクトリに保存されます。

---

## 🔧 ビルドとテスト

### ビルド

#### 全体ビルド
```bash
./scripts/build.sh
```

#### 共通ライブラリのみビルド
```bash
./scripts/build-libs.sh
```

### リントチェック

#### すべてチェック
```bash
./scripts/lint.sh
```

#### 個別チェック
```bash
./scripts/lint.sh backend   # バックエンドのみ
./scripts/lint.sh frontend  # フロントエンドのみ
```

### テスト実行

#### すべてテスト
```bash
./scripts/test.sh
```

#### 個別テスト
```bash
./scripts/test.sh backend   # バックエンドのみ
./scripts/test.sh frontend  # フロントエンドのみ
```

---

## 🧹 メンテナンス

### クリーンアップ

ビルド成果物とログファイルを削除：

```bash
./scripts/clean.sh
```

削除されるもの：
- `apps/backend/dist/`
- `apps/frontend/.next/`
- `libs/types/dist/`
- `libs/utils/dist/`
- `logs/*.log`, `logs/*.pid`

### カテゴリの初期化

デフォルトカテゴリをデータベースに作成：

```bash
./scripts/init-categories.sh
```

**注意:** バックエンドが起動している必要があります。

---

## 🏷️ GitHub管理

### 📦 アーカイブスクリプト

GitHub初期セットアップとIssue作成に使用したスクリプトは **`archive/`ディレクトリ** に移動されました。

これらは既に実行済みで、通常は再実行の必要はありません：

- **Issueラベル・マイルストーン・プロジェクトボード作成**: `archive/setup-github-*.sh`
- **全Issue一括作成**: `archive/create-issues-*.sh`
- **全Issue詳細化**: `archive/update-issues-*.sh`

詳細は [`archive/README.md`](./archive/README.md) を参照してください。

### テストデータのシーディング

開発・テスト用のデータを生成：

```bash
./scripts/seed-test-data.sh
```

**実行内容:**
- サンプル取引データの作成
- テスト用金融機関データの作成
- サンプルカテゴリデータの作成

---

## 📝 スクリプト詳細

### `full-setup.sh`
プロジェクトのフルセットアップを実行します。初回起動時や環境をリセットしたい場合に使用します。

### `setup.sh`
Node.js環境（nodeenv）をセットアップします。

### `install.sh`
pnpmで依存パッケージをインストールします。

### `build-libs.sh`
共通ライブラリ（types, utils）をビルドします。

### `build.sh`
プロジェクト全体（共通ライブラリ、バックエンド、フロントエンド）をビルドします。

### `dev.sh`
開発サーバーを起動します。引数で対象を指定できます。

```bash
./scripts/dev.sh [backend|frontend|all]
```

### `dev-parallel.sh`
バックエンドとフロントエンドを同時にバックグラウンドで起動します。

### `stop-dev.sh`
`dev-parallel.sh` で起動したサーバーを停止します。

### `lint.sh`
ESLintでコードをチェックします。

```bash
./scripts/lint.sh [backend|frontend|all]
```

### `test.sh`
Jestでテストを実行します。

```bash
./scripts/test.sh [backend|frontend|all]
```

### `init-categories.sh`
バックエンドAPIを呼び出して、デフォルトカテゴリを初期化します。

### `clean.sh`
ビルド成果物やログファイルを削除します。

### `activate.sh`
Node.js環境をアクティベートします（他のスクリプト内で自動実行されます）。

### `seed-test-data.sh`
開発・テスト用のサンプルデータを生成します。

**使い方:**
```bash
./scripts/seed-test-data.sh
```

---

## 🔍 トラブルシューティング

### pnpmが見つからない

```bash
./scripts/setup.sh
source .nodeenv/bin/activate
```

### ビルドエラー

```bash
./scripts/clean.sh
./scripts/install.sh
./scripts/build-libs.sh
```

### ポートが使用中

バックエンド（3001）またはフロントエンド（3000）のポートが使用中の場合：

```bash
# プロセスを確認
lsof -i :3001
lsof -i :3000

# プロセスを停止
./scripts/stop-dev.sh
```

### カテゴリ初期化に失敗

1. バックエンドが起動しているか確認
2. バックエンドのURLを確認（デフォルト: http://localhost:3001）

カスタムURLを使用する場合：
```bash
BACKEND_URL=http://localhost:3001 ./scripts/init-categories.sh
```

---

## 📚 関連ドキュメント

- [プロジェクトREADME](../README.md)
- [セットアップガイド](../SETUP.md)
- [開発タスク](../docs/development-setup-tasks.md)

---

**最終更新日**: 2025-11-16

