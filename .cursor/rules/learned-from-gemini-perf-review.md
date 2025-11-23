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

---

## 9. パフォーマンス計測の精度向上（第3回レビュー追加）🟠 High

### ❌ 悪い例: Date.now()の使用

```typescript
const startTime = Date.now();
await someOperation();
const duration = Date.now() - startTime;
```

**問題点**:

- ミリ秒単位の精度しかない
- システムクロックの変更に影響を受ける
- 短い処理時間の測定には不十分

### △ 良い例: performance.now()の使用

```typescript
import { performance } from 'perf_hooks';

const startTime = performance.now();
await someOperation();
const duration = performance.now() - startTime;
```

**利点**:

- マイクロ秒単位の精度
- 単調増加が保証
- システムクロックの変更に影響されない

### ✅ 最良の例: process.hrtime.bigint()の使用

```typescript
// ヘルパー関数を定義
function measureTime(startTime: bigint): number {
  return Number(process.hrtime.bigint() - startTime) / 1_000_000;
}

// テストコード
const startTime = process.hrtime.bigint();
await someOperation();
const duration = measureTime(startTime);
```

**利点**:

- ナノ秒単位の高精度計測
- BigInt型で精度の損失なし
- 短いレスポンスタイムも正確に測定可能
- 単調増加が保証

---

## 10. データベーステストの実用性 🟠 High

### ❌ 悪い例: データベースにアクセスしないエンドポイント

```typescript
describe('Database Connection Pool Performance', () => {
  it('should manage pool efficiently', async () => {
    // /api/healthはDBにアクセスしないため、コネクションプールを測定できない
    const requests = Array.from({ length: 30 }, () => request(app).get('/api/health'));
    await Promise.all(requests);
  });
});
```

**問題点**:

- コネクションプールの負荷を測定できない
- テスト名と実際の測定内容が乖離
- 実用的でないパフォーマンステスト

### ✅ 良い例: 実際にDBにアクセスするエンドポイント

```typescript
describe('Database Connection Pool Performance', () => {
  it('should manage pool efficiently', async () => {
    // テストデータを準備
    await seedTestData();

    // /api/institutionsは実際にDBにアクセスする
    const requests = Array.from({ length: 30 }, () => request(app).get('/api/institutions'));
    const startTime = process.hrtime.bigint();
    await Promise.all(requests);
    const duration = measureTime(startTime);

    // コネクションプールの効率を正確に測定できる
    expect(duration).toBeLessThan(3000);
  });
});
```

**利点**:

- 実際のDBアクセスで正確な測定
- コネクションプールの負荷を適切に評価
- 実運用に近い条件でのテスト

---

## 11. フロントエンドテストの堅牢性 🟡 Medium

### ❌ 悪い例: 固定時間待機

```typescript
test('Button clicks should respond quickly', async ({ page }) => {
  await buttons[0].click();
  await page.waitForTimeout(100); // 固定100ms待機
  const duration = Date.now() - startTime;
});
```

**問題点**:

- フレーキーテスト（不安定なテスト）の原因
- 環境によって動作が変わる
- クリック後の変化を正しく待機していない

### ✅ 良い例: イベントベースの待機

```typescript
test('Button clicks should respond quickly', async ({ page }) => {
  await buttons[0].click();
  // 具体的な変化（モーダル表示など）を待つ
  await page.waitForSelector('.modal-dialog', {
    state: 'visible',
    timeout: 500,
  });
  const duration = Date.now() - startTime;
});
```

**利点**:

- テストの堅牢性向上
- 具体的な変化を待つことで意図が明確
- タイムアウトで無限待機を防止

---

## 12. ドキュメントの実用性 🟡 Medium

### △ 不十分な例: 前提条件が不明確

```typescript
// Cursor-based pagination（IDベース）
async findInstitutions(cursor?: string, limit: number = 20) {
  const qb = this.institutionRepository.createQueryBuilder('institution');
  if (cursor) {
    qb.where('institution.id > :cursor', { cursor });
  }
  return qb.orderBy('institution.id', 'ASC').take(limit).getMany();
}
```

**問題点**:

- UUID使用時に動作しない
- 前提条件（ID形式）が明記されていない

### ✅ 良い例: 前提条件と代替案を明記

```typescript
// Cursor-based pagination（IDベース）
// 注意: idが連番でソート可能（例: 自動インクリメントID）であることを前提
async findInstitutions(cursor?: string, limit: number = 20) {
  const qb = this.institutionRepository.createQueryBuilder('institution');
  if (cursor) {
    qb.where('institution.id > :cursor', { cursor });
  }
  return qb.orderBy('institution.id', 'ASC').take(limit).getMany();
}

// UUID使用時の代替実装
async findInstitutionsWithUUID(
  cursor?: { createdAt: Date; id: string },
  limit: number = 20
) {
  const qb = this.institutionRepository.createQueryBuilder('institution');
  if (cursor) {
    qb.where(
      '(institution.createdAt > :createdAt OR ' +
      '(institution.createdAt = :createdAt AND institution.id > :id))',
      { createdAt: cursor.createdAt, id: cursor.id }
    );
  }
  return qb
    .orderBy('institution.createdAt', 'ASC')
    .addOrderBy('institution.id', 'ASC')
    .take(limit)
    .getMany();
}
```

**利点**:

- 前提条件が明確
- 代替実装例が示されている
- 実用的なドキュメント

---

## まとめ（更新版）

### 最重要ポイント（第3回レビュー追加）

1. **型安全性を最優先**: モジュール全体でのルール緩和は避け、個別対応を基本とする
2. **最高精度の測定**: パフォーマンステストでは`process.hrtime.bigint()`を使用
3. **実用的なテスト**: 実際のDBアクセスを伴うエンドポイントでテスト
4. **堅牢な待機処理**: 固定sleepではなく、具体的なイベントを待機
5. **最新APIの使用**: レガシーAPIは避け、標準化された最新APIを使用
6. **実装状況に応じたテスト**: 未実装機能のテストは`.skip`で明示
7. **前提条件の明確化**: ドキュメントでは実装の前提条件と代替案を明記

### 計測精度の進化

```
Date.now() → performance.now() → process.hrtime.bigint()
   ↓              ↓                    ↓
ミリ秒         マイクロ秒           ナノ秒
```

これらの観点を今後の開発・レビューで常に意識することで、より高品質なコードベースを維持できます。

**更新日**: 2025-11-22 (第3回レビュー対応を追加)

---

## 13. コード重複の回避とDRY原則 🔴 Critical

**対象PR**: #266 - カスタムプロンプト（@トリガー）の追加  
**レビュー日**: 2025-11-23

### ❌ 悪い例: ルールファイルリストの重複

```markdown
<!-- start-task.md -->

await Promise.all([
read_file('.cursor/rules/00-WORKFLOW-CHECKLIST.md'),
read_file('.cursor/rules/GIT-WORKFLOW-ENFORCEMENT.md'),
// ... 全10ファイル
]);

<!-- inc-all-rules.md -->

await Promise.all([
read_file('.cursor/rules/00-WORKFLOW-CHECKLIST.md'),
read_file('.cursor/rules/GIT-WORKFLOW-ENFORCEMENT.md'),
// ... 全10ファイル（完全に同じリスト）
]);
```

**問題点**:

- ルールファイル追加時に2箇所を修正する必要がある
- メンテナンス性の低下
- 変更漏れのリスク

### ✅ 良い例: 一元管理と再利用

```markdown
<!-- start-task.md -->

### 0. すべてのルールファイルを再読込（最優先）

**必ず最初に** `@inc-all-rules` を実行して、すべてのルールファイルを読み込んでください。
```

**利点**:

- ルールファイルリストを一箇所で管理
- 変更時の修正箇所が1つだけ
- DRY原則の遵守

---

## 14. ドキュメントの可読性と一貫性 🟡 Medium

### ❌ 悪い例: 情報が分散したファイルリスト

```markdown
### 読込対象ファイル

以下のファイルを順番に読み込んでください：

1. ファイルA
2. ファイルB

### テンプレート

- テンプレート1
- テンプレート2

### 追加リソース

- リソース1
```

**問題点**:

- ファイルリストが複数セクションに分散
- 「順番に」の記述が並列読み込みの実装と矛盾
- 可読性が低い

### ✅ 良い例: 統合されたファイルリスト

```markdown
### 読込対象ファイル

以下のファイルをすべて読み込んでください：

- **ファイルA** - 説明
- **ファイルB** - 説明
- **テンプレート1** - 説明
- **テンプレート2** - 説明
- **リソース1** - 説明
```

**利点**:

- すべての対象ファイルが一目で把握できる
- 並列読み込みの実装と記述が一致
- 可読性の向上

---

## 15. 命名規則の一貫性 🟡 Medium

### △ 不十分な例: 曖昧な命名規則

```bash
git checkout -b feature/issue-<番号>-<説明>
```

**問題点**:

- `<説明>`が曖昧
- 開発者によって異なるフォーマットになる
- 自動化スクリプトとの不一致

### ✅ 良い例: 明確な命名規則

```bash
git checkout -b feature/issue-<番号>-<Issueタイトルをケバブケースにした文字列>

# 例:
# Issue #267: "CI最適化: マークダウン変更時のスキップ"
# → feature/issue-267-ci-optimization-skip-markdown-changes
```

**利点**:

- 一貫したブランチ名
- 自動化スクリプトとの整合性
- 誰が作成しても同じ形式

---

## まとめ（更新版 - PR #266追加）

### 最重要ポイント（第4回レビュー追加）

1. **型安全性を最優先**: モジュール全体でのルール緩和は避け、個別対応を基本とする
2. **最高精度の測定**: パフォーマンステストでは`process.hrtime.bigint()`を使用
3. **実用的なテスト**: 実際のDBアクセスを伴うエンドポイントでテスト
4. **堅牢な待機処理**: 固定sleepではなく、具体的なイベントを待機
5. **最新APIの使用**: レガシーAPIは避け、標準化された最新APIを使用
6. **実装状況に応じたテスト**: 未実装機能のテストは`.skip`で明示
7. **前提条件の明確化**: ドキュメントでは実装の前提条件と代替案を明記
8. **🆕 DRY原則の徹底**: コード重複を避け、一元管理と再利用を推進
9. **🆕 ドキュメントの可読性**: 情報を統合し、一貫性のある記述を心がける
10. **🆕 命名規則の一貫性**: 明確な規則で自動化との整合性を確保

### 計測精度の進化

```
Date.now() → performance.now() → process.hrtime.bigint()
   ↓              ↓                    ↓
ミリ秒         マイクロ秒           ナノ秒
```

### ドキュメントとコードの品質向上

```
重複したリスト → 一元管理 → 再利用可能なプロンプト
     ↓              ↓              ↓
メンテナンス困難  修正箇所1つ    保守性向上
```

これらの観点を今後の開発・レビューで常に意識することで、より高品質なコードベースを維持できます。

**更新日**: 2025-11-23 (PR #266のレビュー対応を追加)
