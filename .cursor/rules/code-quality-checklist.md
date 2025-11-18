# コード品質チェックリスト

## ⚠️ このルールの目的

過去のコードレビュー（Gemini等）で指摘された問題を再発させないため、コード作成時に必ず確認すべき項目をまとめています。

**AIアシスタントは、コード実装時に必ずこのチェックリストを参照し、問題を事前に防いでください。**

---

## 1. 型安全性（最優先）

### ❌ 絶対禁止

#### 1-1. 危険な型キャスト

```typescript
// ❌ 絶対禁止
apiClient: someObject as unknown as ITargetInterface;
apiClient: someObject as any;
```

**問題**: 型安全性を完全に損なう。実行時エラーの原因。

**正しい対応**:

```typescript
// ✅ インターフェース継承で型安全に
export interface ISourceInterface extends ITargetInterface {
  // 既存のメソッド
}

// ✅ 適切な型定義を作成
interface IAdapter {
  healthCheck(id: string): Promise<HealthCheckResult>;
}
```

#### 1-2. any型の安易な使用

```typescript
// ❌ 禁止
function process(data: any) {}
const result: any = fetchData();
```

**正しい対応**:

```typescript
// ✅ 適切な型定義
interface DataType {
  id: string;
  value: number;
}
function process(data: DataType): void {}

// ✅ 型が不明な場合はunknown
function process(data: unknown): void {
  if (typeof data === 'string') {
    // 型ガードで安全に使用
  }
}
```

**例外**: テストファイルでJestモック作成時のみ、コメント付きで許可

```typescript
// Jest型定義の制約によりany使用
const mockRepo = { findById: jest.fn() } as any;
```

---

## 2. データアクセスと配列操作

### ❌ 避けるべきパターン

#### 2-1. 配列の順序依存

```typescript
// ❌ 配列の順序に暗黙的に依存
const results = await checkMultiple(institutions);
const histories = results.map((result, index) => {
  const institution = institutions[index]; // 危険！
});
```

**問題**: 将来の変更で順序が崩れる可能性。データ不整合のリスク。

**正しい対応**:

```typescript
// ✅ IDベースでマッピング
const institutionMap = new Map(institutions.map((inst) => [inst.id, inst]));

const histories = results
  .map((result) => {
    const institution = institutionMap.get(result.institutionId);
    if (!institution) {
      logger.warn(`対応する金融機関が見つかりません: ${result.institutionId}`);
      return null;
    }
    return createHistory(result, institution);
  })
  .filter((h): h is History => h !== null);
```

#### 2-2. クエリパラメータの網羅性不足

```typescript
// ❌ 一部のパラメータ組み合わせのみ対応
if (query.institutionId) {
  return getLatest(query.institutionId); // limitが無視される！
}
```

**問題**: APIの利用者が期待する挙動と異なる。

**正しい対応**:

```typescript
// ✅ 全てのパラメータ組み合わせを考慮
if (query.latestOnly) {
  // 最新のみ
} else if (query.startDate && query.endDate) {
  // 期間指定（limitも考慮）
  histories = await getByDateRange(...);
  if (query.limit) {
    histories = histories.slice(0, query.limit);
  }
} else if (query.institutionId) {
  // institutionIdのみ（limitも考慮）
  histories = await getAll().filter(h => h.id === query.institutionId);
  if (query.limit) {
    histories = histories.slice(0, query.limit);
  }
}
```

---

## 3. アーキテクチャとモジュール設計

### ❌ 避けるべきパターン

#### 3-1. コントローラーから他モジュールのリポジトリへの直接依存

```typescript
// ❌ コントローラーが複数モジュールのリポジトリに依存
@Controller('health')
class HealthController {
  constructor(
    private institutionRepo: IInstitutionRepository,
    private creditCardRepo: ICreditCardRepository,
    private securitiesRepo: ISecuritiesAccountRepository
  ) {}
}
```

**問題**: 関心の分離違反。モジュール間の結合度が高い。

**正しい対応**:

```typescript
// ✅ 専用サービスを作成してデータ集約
@Injectable()
class InstitutionAggregationService {
  constructor(
    private institutionRepo: IInstitutionRepository,
    private creditCardRepo: ICreditCardRepository,
    private securitiesRepo: ISecuritiesAccountRepository
  ) {}

  async getAllInstitutions(): Promise<IInstitutionInfo[]> {
    // 複数モジュールからデータを集約
  }
}

@Controller('health')
class HealthController {
  constructor(
    private aggregationService: InstitutionAggregationService // 1つのサービスに依存
  ) {}
}
```

#### 3-2. 未使用のDIトークン・ファイル

```typescript
// ❌ 定義されているが使用されていない
export const UNUSED_TOKEN = Symbol('UnusedService');
```

**対応**: 実装前に設計を見直し、不要なトークンは作成しない。作成後に不要と判明したら即座に削除。

---

## 4. 並行処理とデータ整合性

### ⚠️ 注意が必要なパターン

#### 4-1. ファイルベースリポジトリの競合状態

```typescript
// ⚠️ 読み込み→変更→書き込みで競合リスク
async save(data: Data): Promise<void> {
  const existing = await this.loadData(); // 読み込み
  existing.push(data);                     // 変更
  await this.saveData(existing);           // 書き込み（他の処理と競合する可能性）
}
```

**対応**:

```typescript
// ✅ メモリ内セマフォで排他制御
private writeLock: Promise<void> = Promise.resolve();

private async acquireWriteLock(): Promise<() => void> {
  await this.writeLock;
  let resolver: () => void;
  this.writeLock = new Promise(resolve => { resolver = resolve; });
  return () => resolver();
}

async save(data: Data): Promise<void> {
  const release = await this.acquireWriteLock();
  try {
    const existing = await this.loadData();
    existing.push(data);
    await this.saveData(existing);
  } finally {
    release();
  }
}
```

**注意**: これは単一プロセス内のみ有効。本番環境では必ずDB（SQLite/PostgreSQL等）に移行。

---

## 5. パフォーマンスとスケーラビリティ

### ⚠️ 警告が必要なパターン

#### 5-1. 全データをメモリにロードしてフィルタ

```typescript
// ⚠️ データ量増加で性能劣化
async findByDateRange(start: Date, end: Date): Promise<Data[]> {
  const allData = await this.loadAll(); // 全件ロード
  return allData.filter(d => d.date >= start && d.date <= end);
}
```

**対応**:

```typescript
// ✅ 開発用実装であることを明記し、本番環境での改善方針を示す
/**
 * 期間指定でデータを取得
 *
 * ⚠️ パフォーマンス注意: ファイル全体を読み込んでメモリ上でフィルタ
 * データ量が増加すると性能劣化の可能性あり
 * 本番環境では必ずDB（SQLite/PostgreSQL等）に移行すること
 *
 * TODO: DB移行時にリポジトリ層で効率的なクエリを実装
 * 例: SELECT * FROM data WHERE date BETWEEN ? AND ?
 */
async findByDateRange(start: Date, end: Date): Promise<Data[]> {
  // TODO(パフォーマンス改善): DB移行時に効率化
  this.logger.warn('全データをメモリにロード中（データ量増加時は性能注意）');
  const allData = await this.loadAll();
  return allData.filter(d => d.date >= start && d.date <= end);
}
```

---

## 6. テストコードの品質

### ⚠️ 注意が必要なパターン

#### 6-1. テストでの型安全性の軽視

```typescript
// ❌ テストだからといってany型を乱用しない
const mockData: any = { id: 1 };
const result: any = await service.execute();
```

**正しい対応**:

```typescript
// ✅ テストでも適切な型定義を使用
const mockData: EntityType = {
  id: '1',
  name: 'Test',
  // 必要なプロパティを全て定義
};

// Jest型定義の制約によりany使用（理由コメント必須）
const mockRepo = {
  findById: jest.fn(),
  save: jest.fn(),
} as any;
```

#### 6-2. ESLintルールの完全無効化

```javascript
// ❌ テストファイルで全てのルールをoffにしない
{
  files: ['**/*.spec.ts'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unsafe-*': 'off', // 全部off
  }
}
```

**正しい対応**:

```javascript
// ✅ warnレベルで継続監視
{
  files: ['**/*.spec.ts'],
  rules: {
    // any型: offのまま（Jestモック作成時に必要）
    '@typescript-eslint/no-explicit-any': 'off',

    // 戻り値型: warnレベル（テストでも型を明示推奨）
    '@typescript-eslint/explicit-function-return-type': 'warn',

    // unsafe系: warnレベル（モック使用時は避けられないが極力減らす）
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',

    // Jest特有: offのまま
    '@typescript-eslint/unbound-method': 'off',
  }
}
```

---

## 7. 実装フローチェックリスト

### 新機能実装時の確認事項

#### Phase 1: 設計

- [ ] 型定義は適切か？（any型を使っていないか？）
- [ ] インターフェース継承で型安全性を保てるか？
- [ ] モジュール間の依存関係は適切か？（集約サービスが必要か？）
- [ ] 並行処理での競合リスクはないか？

#### Phase 2: 実装

- [ ] 配列の順序に依存していないか？（IDベースのマッピングを使用）
- [ ] クエリパラメータの全組み合わせに対応しているか？
- [ ] 型キャストを使っていないか？（使う場合は型定義を見直す）
- [ ] 未使用のコード（トークン、ファイル）を残していないか？

#### Phase 3: パフォーマンス

- [ ] 全データをメモリにロードしていないか？（ロードする場合は警告コメント追加）
- [ ] ファイルベースで競合状態のリスクはないか？（排他制御を実装）
- [ ] 本番環境でのスケーラビリティは考慮されているか？（TODOコメント追加）

#### Phase 4: テスト

- [ ] テストコードでも型安全性を保っているか？
- [ ] any型を使う場合、理由コメントを付けているか？
- [ ] ESLintルールは適切に設定されているか？（完全offを避ける）

#### Phase 5: ドキュメント

- [ ] パフォーマンス懸念があればJSDocに記載したか？
- [ ] 暫定実装の場合、TODOコメントで改善方針を示したか？
- [ ] 本番環境での推奨事項を明記したか？

---

## 8. コードレビュー後の対応

### Gemini等からの指摘を受けた場合

#### 必須対応手順

1. **指摘内容の分析**
   - 指摘の根本原因を特定
   - 同様の問題が他の箇所にないか確認

2. **修正実施**
   - 指摘箇所を修正
   - 類似箇所も合わせて修正

3. **再発防止策の策定**
   - このチェックリストに該当項目がない場合は追加
   - project.md等の関連ルールも更新

4. **テストとドキュメント**
   - 修正内容をテストで確認
   - コミットメッセージに再発防止策を記載

5. **ルール更新のコミット**
   - 指摘内容から学んだ教訓をルールファイルに反映
   - 将来の開発で同じ問題を起こさないようにする

---

## 9. AIアシスタントへの指示

### 実装時の必須確認事項

**コード作成時**:

1. このチェックリストの該当項目を確認
2. 問題がある場合は設計から見直す
3. 型安全性を最優先に考える

**レビュー指摘を受けた時**:

1. 指摘内容を深く理解する
2. 根本原因を特定する
3. このチェックリストに該当項目がなければ追加する
4. 類似箇所も合わせて修正する
5. ルール更新を別コミットで実施する

**チェックリストに違反しそうな時**:

1. まず設計を見直す
2. どうしても必要な場合は詳細なコメントを追加
3. なぜその実装が必要か明記
4. いつまでにどう改善するか記載
5. 本番環境での推奨事項を明記

---

## 10. まとめ

### 最優先事項

1. **型安全性**: any型・型キャスト禁止
2. **データ整合性**: 配列順序依存禁止、IDベースマッピング使用
3. **アーキテクチャ**: 関心の分離、適切なモジュール設計
4. **並行処理**: 競合状態を考慮、排他制御実装
5. **パフォーマンス**: スケーラビリティ考慮、警告コメント追加

### このチェックリストの更新

- Gemini等のコードレビューで新たな指摘を受けた場合
- 本番環境で問題が発生した場合
- チーム内でベストプラクティスが見つかった場合

**常にこのチェックリストを進化させ、コード品質を向上させてください。**
