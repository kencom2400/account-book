# テスト実行ガイド

## 環境構築

### Frontendユニットテスト環境

Frontendのユニットテスト環境を構築するには、リポジトリのルートで `pnpm install` を実行してください。以下の設定ファイルが含まれています：

#### 設定ファイル

1. **Jest設定ファイル**: `apps/frontend/jest.config.js`
   - Next.js統合のJest設定
   - TypeScriptサポート
   - パスマッピング設定（`@/`、`@account-book/types`、`@account-book/utils`）

2. **Jestセットアップファイル**: `apps/frontend/jest.setup.js`
   - DOMマッチャーの追加（`@testing-library/jest-dom`）
   - グローバルモック設定（ResizeObserver、IntersectionObserver、matchMedia）
   - Next.jsルーターのモック

#### 依存関係

以下のパッケージがインストールされています：

```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/react": "^14.1.2",
    "@testing-library/user-event": "^14.5.1",
    "@types/jest": "^29.5.11",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "ts-jest": "^29.1.1"
  }
}
```

#### 環境構築の確認

環境が正しく構築されているか確認するには：

```bash
cd apps/frontend
pnpm test
```

すべてのテストがパスすれば、環境構築は完了しています。

### ユニットテスト

```bash
# すべてのユニットテスト
pnpm test:unit

# Backend のみ
cd apps/backend && pnpm test

# Frontend のみ
cd apps/frontend && pnpm test

# Watch モード
pnpm test:watch

# カバレッジ付き
pnpm test:cov
```

### E2Eテスト

#### Backend E2E

```bash
# すべてのBackend E2E
cd apps/backend && pnpm test:e2e

# Watch モード
cd apps/backend && pnpm test:e2e:watch

# カバレッジ付き
cd apps/backend && pnpm test:e2e:cov
```

#### Frontend E2E

```bash
# すべてのFrontend E2E
cd apps/frontend && pnpm test:e2e

# UIモード（開発時に便利）
cd apps/frontend && pnpm test:e2e:ui

# デバッグモード
cd apps/frontend && pnpm test:e2e:debug

# レポート表示
cd apps/frontend && pnpm test:e2e:report

# 特定のブラウザのみ
cd apps/frontend && pnpm exec playwright test --project=chromium
```

#### すべてのE2E

```bash
# スクリプト経由
./scripts/test/test-e2e.sh all

# または
pnpm test:e2e
```

### CI/CD

GitHub Actionsで自動実行されます：

- `push` / `pull_request` 時に自動実行
- ユニットテストとE2Eテストが並列実行されます

### トラブルシューティング

#### Playwrightのブラウザがインストールされていない

```bash
cd apps/frontend
pnpm exec playwright install
```

#### Backend が起動していない（Frontend E2E実行時）

```bash
# Backend を起動
cd apps/backend
pnpm dev

# 別ターミナルでFrontend E2E実行
cd apps/frontend
pnpm test:e2e
```

#### テストがタイムアウトする

`jest-e2e.json` の `testTimeout` を増やす

```json
{
  "testTimeout": 60000
}
```

#### 環境変数が設定されていない（Backend E2E）

Backend E2Eテストでは、テスト用の環境変数が自動的に設定されます。
`apps/backend/test/setup-e2e.ts` を参照してください。

もし手動で設定する必要がある場合：

```bash
export ENCRYPTION_KEY="your-encryption-key"
export CRYPTO_SALT="your-crypto-salt"
cd apps/backend
pnpm test:e2e
```
