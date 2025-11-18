# テスト実行ガイド

## テスト実行ガイド

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
