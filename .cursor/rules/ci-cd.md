# CI/CD設定ガイドライン

## 基本原則

- **CI/CD設定は常にローカル環境でも再現可能であること**
- **環境変数の管理は明示的かつ安全であること**
- **テスト実行スクリプトは堅牢で、エラーハンドリングが適切であること**
- **ポート競合やリソース競合を避ける設計であること**

## テスト実行スクリプトの設計原則

### サーバー起動待機処理

**❌ 悪い例（固定sleep）:**

```bash
# 固定の待機時間は不確実
pnpm dev &
sleep 5  # サーバーが起動していない可能性がある
```

**✅ 良い例（ヘルスチェックベース）:**

```bash
# ヘルスチェックでサーバーの起動を確認
pnpm dev > /tmp/server.log 2>&1 &
SERVER_PID=$!

BACKEND_URL="http://localhost:3001"
MAX_RETRIES=30
RETRY_COUNT=0

# curlコマンドの存在確認
if ! command -v curl > /dev/null 2>&1; then
  echo "⚠ curlコマンドが見つかりません。固定待機時間を使用します。"
  sleep 5
else
  while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s -f "$BACKEND_URL" > /dev/null 2>&1; then
      echo "✅ サーバーが起動しました"
      break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $((RETRY_COUNT % 5)) -eq 0 ]; then
      echo "  待機中... (${RETRY_COUNT}/${MAX_RETRIES})"
    fi
    sleep 1
  done

  if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ サーバーの起動に失敗しました（タイムアウト）"
    echo "ログを確認: tail -20 /tmp/server.log"
    tail -20 /tmp/server.log 2>/dev/null || echo "ログファイルが見つかりません"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
  fi
fi
```

### エラーハンドリングとログ出力

**必須事項:**

1. **ログファイルへの出力**: サーバーの起動ログをファイルに出力し、エラー時に確認できるようにする
2. **プロセスの適切な終了**: テスト終了時にバックグラウンドプロセスを確実に終了する
3. **終了コードの伝播**: テストの終了コードを適切に伝播する

```bash
# ログファイルに出力
pnpm dev > /tmp/server.log 2>&1 &
SERVER_PID=$!

# テスト実行
pnpm test:e2e
TEST_EXIT_CODE=$?

# プロセスを終了
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

# 終了コードを伝播
exit $TEST_EXIT_CODE
```

## 環境変数の管理

### ポート競合の回避

**❌ 悪い例（環境変数の競合）:**

```yaml
# CI設定
env:
  PORT: 3001 # これがNext.jsにも影響してしまう
```

```typescript
// Playwright設定
webServer: {
  command: 'pnpm dev',  // PORT=3001が設定されていると、Next.jsも3001を使おうとする
  url: 'http://localhost:3000',
}
```

**✅ 良い例（明示的なポート指定）:**

```yaml
# CI設定
env:
  BACKEND_PORT: 3001 # バックエンド専用
  FRONTEND_PORT: 3000 # フロントエンド専用
```

```typescript
// Playwright設定
webServer: [
  {
    command: 'pnpm --filter @account-book/backend dev',
    url: 'http://localhost:3001/api/health/institutions',
    env: {
      PORT: process.env.BACKEND_PORT || '3001', // 明示的に指定
    },
  },
  {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    env: {
      PORT: process.env.FRONTEND_PORT || '3000', // 明示的に指定
    },
  },
];
```

### 環境変数の命名規則

- **サーバー固有の環境変数**: `{SERVER}_PORT`, `{SERVER}_HOST`などの形式を使用
- **共通の環境変数**: `NODE_ENV`, `ENCRYPTION_KEY`などは明示的に設定
- **デフォルト値の提供**: 環境変数が設定されていない場合のデフォルト値を提供

## PlaywrightのwebServer設定

### 複数サーバーの起動

**設定例:**

```typescript
webServer: [
  // バックエンドサーバー
  {
    command: 'pnpm --filter @account-book/backend dev',
    url: 'http://localhost:3001/api/health/institutions',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
    cwd: process.cwd(),
    env: {
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'default-key',
      CRYPTO_SALT: process.env.CRYPTO_SALT || 'default-salt',
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: process.env.BACKEND_PORT || '3001',
    },
  },
  // フロントエンドサーバー
  {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
    cwd: process.cwd(),
    env: {
      PORT: process.env.FRONTEND_PORT || '3000',
    },
  },
];
```

### 重要な設定項目

1. **`reuseExistingServer`**: CI環境では`false`、ローカル環境では`true`に設定
2. **`timeout`**: サーバー起動のタイムアウト（120秒以上推奨）
3. **`stdout`/`stderr`**: `'pipe'`に設定してログを取得可能にする
4. **`cwd`**: 作業ディレクトリを明示的に指定
5. **`env`**: 必要な環境変数を明示的に設定

## GitHub Actions設定

### 環境変数の設定

```yaml
- name: Run Frontend E2E tests
  run: |
    cd apps/frontend
    pnpm test:e2e
  env:
    BASE_URL: http://localhost:3000
    # サーバー固有のポートを分離
    BACKEND_PORT: 3001
    FRONTEND_PORT: 3000
    # 共通の環境変数
    ENCRYPTION_KEY: ${{ secrets.ENCRYPTION_KEY || 'default-key' }}
    CRYPTO_SALT: ${{ secrets.CRYPTO_SALT || 'default-salt' }}
    NODE_ENV: test
```

### ベストプラクティス

1. **手動起動の削除**: PlaywrightのwebServer設定を使用する場合、手動でのサーバー起動は不要
2. **環境変数の分離**: 各サーバーで使用する環境変数は明確に分離する
3. **エラーログの確認**: テスト失敗時は必ずサーバーログを確認する

## チェックリスト

### テストスクリプト作成時

- [ ] 固定sleepではなく、ヘルスチェックベースの待機処理を実装した
- [ ] curlコマンドの存在確認とフォールバック処理を追加した
- [ ] サーバーログをファイルに出力し、エラー時に確認できるようにした
- [ ] テスト終了時にバックグラウンドプロセスを確実に終了する処理を追加した
- [ ] テストの終了コードを適切に伝播するようにした

### CI/CD設定時

- [ ] ポート競合を避けるため、サーバー固有の環境変数を使用した
- [ ] PlaywrightのwebServer設定で必要な環境変数を明示的に設定した
- [ ] 環境変数のデフォルト値を提供した
- [ ] `reuseExistingServer`を適切に設定した（CI: false, ローカル: true）

## 参考資料

- [Playwright webServer Configuration](https://playwright.dev/docs/test-webserver)
- [GitHub Actions Environment Variables](https://docs.github.com/en/actions/learn-github-actions/environment-variables)
