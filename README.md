# Account Book

個人資産管理アプリケーション

## セットアップ

### 前提条件

- Python 3.8+
- nodeenv

### インストール

```bash
# nodeenv環境の作成
nodeenv --node=20.18.1 --prebuilt .nodeenv

# 環境のアクティベート
source .nodeenv/bin/activate

# corepackの有効化
corepack enable
corepack prepare pnpm@8.15.0 --activate

# 依存関係のインストールと初期セットアップ
./scripts/setup.sh
```

### 開発サーバーの起動

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
# 全てのテスト
pnpm test

# ユニットテスト
pnpm test:unit

# E2Eテスト
pnpm test:e2e
```

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
