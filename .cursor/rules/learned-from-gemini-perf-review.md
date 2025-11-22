# Geminiレビューから学んだ観点 - パフォーマンステスト

**作成日**: 2025-11-22  
**対象PR**: #259 - パフォーマンステストとチューニング

このドキュメントは、Gemini Code AssistantによるPR #259のレビューから学んだ重要な観点をまとめたものです。

---

## 1. 型安全性の維持 🔴 Critical

### ❌ 悪い例: モジュール全体でのルール緩和

```javascript
// eslint.config.mjs
{
  files: ['src/modules/health/**/*.ts'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',  // モジュール全体で緩和
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    // ... その他の型安全ルールを warn に
  },
}
```

**問題点**:

- 意図しない`any`型の使用を見逃すリスクが高い
- モジュール全体の型安全性が低下
- 将来的なリファクタリングが困難になる

### ✅ 良い例: 必要な箇所でのみインライン無効化

```typescript
// connection-checker.service.ts
async checkConnection(apiAdapter: unknown): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = apiAdapter as any;
  return await adapter.testConnection();
}
```

**推奨アプローチ**:

1. `unknown`型と型ガードを優先的に使用
2. 本当に必要な箇所のみ`// eslint-disable-next-line`で個別対応
3. `any`の代わりに`unknown`型を検討
4. インターフェースを明確に定義

---

## 2. パフォーマンス測定の精度向上 🟡 Medium

### ❌ 悪い例: Date.now()の使用

```typescript
const startTime = Date.now();
await someOperation();
const duration = Date.now() - startTime;
```

**問題点**:

- システムクロックの変更に影響を受ける
- ミリ秒未満の精度がない
- 単調増加が保証されていない

### ✅ 良い例: performance.now()の使用

```typescript
import { performance } from 'perf_hooks';

const startTime = performance.now();
await someOperation();
const duration = performance.now() - startTime;
```

**利点**:

- 高精度（マイクロ秒単位）
- 単調増加が保証されている
- システムクロックの変更に影響されない
- パフォーマンステストの信頼性向上

---

## 3. 非同期処理の待機ロジック 🟡 Medium

### ❌ 悪い例: 固定時間のsleep

```bash
start-database.sh
sleep 5  # 固定5秒待機
```

**問題点**:

- 環境によって起動時間が異なる
- 5秒で足りない場合がある
- 必要以上に待機する可能性がある

### ✅ 良い例: ポーリング＋タイムアウト

```bash
max_wait=30
waited=0
while ! nc -z localhost 3306 2>/dev/null && [ $waited -lt $max_wait ]; do
  sleep 1
  waited=$((waited + 1))
  echo -n "."
done

if [ $waited -ge $max_wait ]; then
  echo "Failed to start within ${max_wait} seconds"
  exit 1
fi
```

**利点**:

- 起動完了次第即座に進行
- タイムアウトで無限待機を防止
- CI環境での安定性向上

---

## 4. フロントエンドパフォーマンステスト 🟡 Medium

### ❌ 悪い例: 固定時間待機

```typescript
// Core Web Vitals取得
setTimeout(() => {
  resolve(metrics);
}, 3000); // 常に3秒待機
```

**問題点**:

- メトリクスが早く取得できても3秒待機
- 3秒で取得できない場合もある
- テスト実行時間の無駄

### ✅ 良い例: ポーリング＋タイムアウト

```typescript
const pollInterval = setInterval(() => {
  if (fcpCaptured && lcpCaptured) {
    clearInterval(pollInterval);
    clearTimeout(timeoutId);
    resolve(metrics);
  }
}, 100);

const timeoutId = setTimeout(() => {
  clearInterval(pollInterval);
  resolve(metrics); // 部分的な結果でも返す
}, 5000);
```

**利点**:

- 取得完了次第即座に進行
- テスト実行速度の向上
- 信頼性の向上

---

## 5. レガシーAPIの使用回避 🟡 Medium

### ❌ 悪い例: window.performance.timing

```typescript
const perfData = window.performance.timing;
const duration = perfData.loadEventEnd - perfData.navigationStart;
```

**問題点**:

- 非推奨API（将来削除される可能性）
- 精度が低い

### ✅ 良い例: Navigation Timing API Level 2

```typescript
const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
const duration = navigation.loadEventEnd - navigation.loadEventStart;
```

**利点**:

- 最新の標準API
- より詳細なメトリクスを取得可能
- 将来的な互換性が保証されている

---

## 6. テストセレクターの一貫性 🟡 Medium

### ❌ 悪い例: クラス名との併用

```typescript
await page.waitForSelector('[data-testid="list"], .list-container');
```

**問題点**:

- スタイリング変更でテストが壊れる
- セレクターの一貫性がない

### ✅ 良い例: data-testid優先

```typescript
await page.waitForSelector('[data-testid="list"]');
```

**利点**:

- テストの堅牢性向上
- スタイリング変更の影響を受けない
- 意図が明確

---

## 7. ページネーションテストの前提条件 🔴 Critical

### ❌ 悪い例: 実装されていない機能のテスト

```typescript
describe('Pagination Performance', () => {
  it('should fetch page 1', async () => {
    await request(app).get('/api/institutions').query({ page: 1, limit: 20 });
  });
});
```

**問題点**:

- APIがページネーションを実装していない
- テストが常に失敗または誤った結果を返す

### ✅ 良い例: 未実装機能は.skip

```typescript
describe.skip('Pagination Performance (Future Implementation)', () => {
  // Note: InstitutionControllerにページネーション実装後に有効化
  it('should fetch page 1', async () => {
    await request(app).get('/api/institutions').query({ page: 1, limit: 20 });
  });
});
```

**推奨**:

1. 実装されていない機能のテストは`.skip`
2. コメントで実装予定を明記
3. 実装完了後にテストを有効化

---

## 8. CI/CD設定の最新化 🟡 Medium

### ❌ 悪い例: 古いアクションバージョン

```yaml
- uses: actions/checkout@v3
- uses: actions/setup-node@v3
- uses: actions/upload-artifact@v3
```

### ✅ 良い例: 最新バージョンの使用

```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
- uses: actions/upload-artifact@v4
  with:
    if-no-files-found: ignore # ファイルがない場合も継続
```

**利点**:

- セキュリティアップデートの適用
- 新機能の利用
- 将来的な互換性の確保

---

## まとめ

### 最重要ポイント

1. **型安全性を最優先**: モジュール全体でのルール緩和は避け、個別対応を基本とする
2. **高精度な測定**: パフォーマンステストでは`performance.now()`を使用
3. **堅牢な待機処理**: 固定sleepではなくポーリング＋タイムアウトを実装
4. **最新APIの使用**: レガシーAPIは避け、標準化された最新APIを使用
5. **実装状況に応じたテスト**: 未実装機能のテストは`.skip`で明示

これらの観点を今後の開発・レビューで常に意識することで、より高品質なコードベースを維持できます。
