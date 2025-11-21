# コード品質基準とテスト実装ガイドライン

このファイルは、コード品質の基準とテスト実装のガイドラインを統合したものです。

---

## 🎯 基本原則

### 型安全性（最優先）

- **any型の使用禁止**（テストのJestモック作成時のみ例外、理由コメント必須）
- **危険な型キャストの禁止**（`as unknown as`等）
- **Enum型の型安全な比較**（`Object.entries()`使用時は明示的型キャスト）
- **テストコードでも型安全性を保つ**

### テストの原則

- **全ての新規実装にユニットテストを作成**
- **APIエンドポイントやUI機能にはE2Eテストも作成**
- **テストが失敗した場合は必ず修正してから次の作業に進む**
- **テストカバレッジは80%以上を目標**

---

## 1. 型安全性のチェックリスト

### ❌ 絶対禁止事項

#### 1-1. 危険な型キャスト

```typescript
// ❌ 絶対禁止
apiClient: someObject as unknown as ITargetInterface;
apiClient: someObject as any;
```

**問題**: 型安全性を完全に損なう。実行時エラーの原因。

**✅ 正しい対応**:

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

**✅ 正しい対応**:

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

#### 1-3. Enum型の型安全な比較

```typescript
// ❌ 避けるべきパターン
{Object.entries(CATEGORY_LABELS).map(([category, label]) => (
  <button
    onClick={() => setSelectedCategory(category as BankCategory)}
    className={String(selectedCategory) === category ? '...' : '...'}
  >
))}
```

**問題**:

- `Object.entries()`の戻り値は`[string, T][]`型
- 型アサーション（`as`）は型安全性を損なう

**✅ 正しい対応**:

```typescript
// ✅ 明示的な型キャストで型安全に
{(Object.entries(CATEGORY_LABELS) as [BankCategory, string][]).map(([category, label]) => (
  <button
    onClick={() => setSelectedCategory(category)}
    className={selectedCategory === category ? '...' : '...'}
  >
))}
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

**✅ 正しい対応**:

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

**✅ 正しい対応**:

```typescript
// ✅ 全てのパラメータ組み合わせを考慮
if (query.latestOnly) {
  // 最新のみ
} else if (query.startDate && query.endDate) {
  histories = await getByDateRange(...);
  if (query.limit) {
    histories = histories.slice(0, query.limit);
  }
} else if (query.institutionId) {
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

**✅ 正しい対応**:

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

---

## 4. テスト実装ガイドライン

### 🚫 テストでの絶対禁止事項

#### 4-1. any型の安易な使用禁止

```typescript
// ❌ 悪い例
const mockData: any = { id: 1 };
const result: any = await service.execute();
```

**✅ 良い例**:

```typescript
// ✅ テストでも適切な型定義を使用
const mockData: CreditCardEntity = {
  id: '1',
  issuer: 'Test Card',
  // ... 必要なプロパティを全て定義
};

// モックオブジェクトでのみany型を許容（理由コメント必須）
const mockRepository = {
  findById: jest.fn(),
  save: jest.fn(),
} as any; // Jest型定義の制約によりany使用
```

#### 4-2. テストエラー・警告の握りつぶし禁止

```typescript
// ❌ 絶対に禁止
it.skip('should process payment', () => {
  // 理由なしのskipは禁止
});

// エラーを握りつぶす
try {
  await service.execute();
} catch (error) {
  // 何もしない  // ❌
}
```

**✅ 正しい対応**:

```typescript
// ✅ 一時的にスキップする場合は理由とTODOを明記
// TODO: #456 - APIモックの修正後にこのテストを有効化
it.skip('should process payment', () => {
  // ...
});

// エラーは適切にテスト
it('should throw error when invalid data', async () => {
  await expect(service.execute(invalidData)).rejects.toThrow('Invalid data');
});
```

### テスト実行義務

#### 新機能実装時

1. **ユニットテストコードを作成する**
   - ドメインロジック、UseCase、コントローラーなど、各レイヤーのユニットテストを作成
2. **E2Eテストコードを作成する（該当する場合）**
   - 新規APIエンドポイント: Backend E2Eテスト
   - 新規UI機能: Frontend E2Eテスト
3. **必ずテストを実行する**
   - ユニットテスト: `./scripts/test/test.sh all`
   - E2Eテスト: `./scripts/test/test-e2e.sh`
4. **全てのテストが成功するまで修正する**

#### テスト実行コマンド

```bash
# ユニットテスト
cd apps/backend
pnpm test <module-name>

# E2Eテスト
./scripts/test/test-e2e.sh all  # 全て
./scripts/test/test-e2e.sh backend  # Backendのみ
./scripts/test/test-e2e.sh frontend  # Frontendのみ
```

### テストの構造（AAA パターン）

```typescript
describe('CreditCardEntity', () => {
  describe('constructor', () => {
    it('should create a valid credit card entity', () => {
      // Arrange - 準備
      const cardData = {
        id: 'cc_123',
        cardName: 'テストカード',
      };

      // Act - 実行
      const creditCard = new CreditCardEntity(/* ... */);

      // Assert - 検証
      expect(creditCard.id).toBe('cc_123');
      expect(creditCard.cardName).toBe('テストカード');
    });
  });
});
```

---

## 5. ESLint設定のベストプラクティス

### 基本方針

#### 5-1. 型情報を活用した静的解析（Type-aware Linting）

```javascript
// ✅ 推奨: typescript-eslint の型チェック有効化
export default tseslint.config(...tseslint.configs.recommendedTypeChecked, {
  languageOptions: {
    parserOptions: {
      projectService: true, // 型情報を利用
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

#### 5-2. 包括的なルールセットの適用

```javascript
// ✅ Next.jsプロジェクトでの推奨設定
export default tseslint.config(js.configs.recommended, ...tseslint.configs.recommendedTypeChecked, {
  plugins: {
    react,
    'react-hooks': reactHooks,
    'jsx-a11y': jsxA11y,
    '@next/next': nextPlugin,
  },
  rules: {
    ...react.configs.recommended.rules,
    ...reactHooks.configs.recommended.rules,
    ...jsxA11y.configs.recommended.rules,
    ...nextPlugin.configs.recommended.rules,
    ...nextPlugin.configs['core-web-vitals'].rules,
  },
});
```

#### 5-3. 環境別の適切な設定

```javascript
// ✅ 推奨: 環境別設定
export default tseslint.config(
  // ソースコード: 厳格な設定
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
    },
  },

  // テストコード: 一部緩和
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.jest },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  }
);
```

---

## 6. シェルスクリプトとコマンドライン

### 6-1. jqフィルターの可読性

**原則**: `jq`でJSON処理を行う際は、意図が明確で可読性の高いフィルターを使用する。

#### ❌ 避けるべきパターン

```bash
# ❌ 単一要素の存在確認に contains() を使用
jq 'map(select(.labels | map(.name) | contains(["In Progress"]) | not))'
```

#### ✅ 推奨パターン

```bash
# ✅ 単一要素の存在確認には any() を使用
jq 'map(select(.labels | map(.name) | any(. == "In Progress") | not))'
```

---

## 7. React/UIコンポーネント

### 7-1. コールバック関数の型定義

**非同期処理に対応したコールバック型**:

❌ **悪い例**:

```typescript
interface Props {
  onRetry?: () => void;
}

const handleRetry = (): void => {
  if (!onRetry) return;
  onRetry(); // 非同期処理の完了を待てない
  onClose(); // リトライ完了前に閉じてしまう
};
```

✅ **良い例**:

```typescript
interface Props {
  onRetry?: () => Promise<void> | void; // Promise対応
}

const handleRetry = async (): Promise<void> => {
  if (!onRetry) return;
  await onRetry(); // 完了を待つ
  onClose(); // 完了後に閉じる
};
```

### 7-2. 日時の固定化

❌ **悪い例**:

```typescript
<ErrorModal
  timestamp={new Date()}  // 再レンダリングで変わる
/>
```

✅ **良い例**:

```typescript
const errorTimestampRef = useRef<Date | null>(null);

const handleError = (message: string): void => {
  if (!errorTimestampRef.current) {
    errorTimestampRef.current = new Date();
  }
};

<ErrorModal
  timestamp={errorTimestampRef.current || undefined}
/>
```

---

## 8. 実装フローチェックリスト

### Phase 1: 設計

- [ ] 型定義は適切か？（any型を使っていないか？）
- [ ] インターフェース継承で型安全性を保てるか？
- [ ] モジュール間の依存関係は適切か？
- [ ] 並行処理での競合リスクはないか？

### Phase 2: 実装

- [ ] 配列の順序に依存していないか？
- [ ] クエリパラメータの全組み合わせに対応しているか？
- [ ] 型キャストを使っていないか？
- [ ] Enum型の比較は型安全か？
- [ ] 未使用のコードを残していないか？

### Phase 3: パフォーマンス

- [ ] 全データをメモリにロードしていないか？
- [ ] ファイルベースで競合状態のリスクはないか？
- [ ] 本番環境でのスケーラビリティは考慮されているか？

### Phase 4: テスト

- [ ] テストコードでも型安全性を保っているか？
- [ ] any型を使う場合、理由コメントを付けているか？
- [ ] ESLintルールは適切に設定されているか？
- [ ] ユニットテストを作成したか？
- [ ] E2Eテストを作成したか（該当する場合）？

### Phase 5: ドキュメント

- [ ] パフォーマンス懸念があればJSDocに記載したか？
- [ ] 暫定実装の場合、TODOコメントで改善方針を示したか？

---

## 9. スクリプト・ツール開発のベストプラクティス

### 9-1. ユーザビリティとヘルプメッセージ

**原則**: ヘルプメッセージは実際の使用方法と完全に一致させる

```bash
# ❌ 悪い例: 実際のステータス名と異なる
echo "例: $0 24 'In Progress'"

# ✅ 良い例: 実際のステータス名（絵文字含む）と一致
echo "例: $0 24 '🚧 In Progress'"
```

**理由**:

- ユーザーがコピー&ペーストで即座に使える
- 絵文字などの特殊文字の使用方法が明確になる
- エラーを未然に防ぐ

### 9-2. 外部API・コマンドのエラーハンドリング

**原則**: 外部APIやコマンドの結果が空の場合は必ずチェック

```bash
# ❌ 悪い例: 結果が空の場合にエラーにならない
FIELD_INFO=$(gh project field-list "$PROJECT_NUMBER" --owner "$OWNER" --format json | \
  jq '.fields[] | select(.name == "Status")')
FIELD_ID=$(echo "$FIELD_INFO" | jq -r '.id')

# ✅ 良い例: 結果が空の場合の明確なエラーハンドリング
FIELD_INFO=$(gh project field-list "$PROJECT_NUMBER" --owner "$OWNER" --format json | \
  jq '.fields[] | select(.name == "Status")')

if [ -z "$FIELD_INFO" ]; then
  echo "❌ エラー: プロジェクトに 'Status' フィールドが見つかりませんでした。"
  exit 1
fi
```

**理由**:

- 堅牢性の向上
- デバッグが容易になる
- 明確なエラーメッセージでユーザーが対応しやすい

### 9-3. 外部コマンド呼び出しの効率化

**原則**: 同じデータから複数の値を取得する場合は、コマンド呼び出しを1回にまとめる

```bash
# ❌ 悪い例: 3回のjq呼び出し
ITEM_ID=$(echo "$ITEM_INFO" | jq -r '.id')
CURRENT_STATUS=$(echo "$ITEM_INFO" | jq -r '.status')
TITLE=$(echo "$ITEM_INFO" | jq -r '.title')

# ✅ 良い例: 1回のjq呼び出し + mapfile
mapfile -t values < <(echo "$ITEM_INFO" | jq -r '.id, .status, .title')
ITEM_ID="${values[0]}"
CURRENT_STATUS="${values[1]}"
TITLE="${values[2]}"
```

**理由**:

- パフォーマンスの向上（3倍の効率化）
- プロセス生成のオーバーヘッドを削減
- コードがより簡潔になる

### 9-4. 設定の外部化と再利用性

**原則**: ハードコードされた設定は環境変数で上書き可能にする

```bash
# ❌ 悪い例: ハードコード
PROJECT_NUMBER=1
OWNER="kencom2400"

# ✅ 良い例: 環境変数で上書き可能
PROJECT_NUMBER="${PROJECT_NUMBER:-1}"
OWNER="${OWNER:-kencom2400}"
```

**使用方法**:

```bash
# デフォルト値を使用
./script.sh

# 環境変数で上書き
PROJECT_NUMBER=2 OWNER="other-user" ./script.sh
```

**理由**:

- 他のプロジェクトやリポジトリでも再利用可能
- テスト環境と本番環境で異なる設定を使える
- 設定変更のためにスクリプトを編集する必要がない

### 9-5. スクリプト開発のチェックリスト

- [ ] ヘルプメッセージは実際の使用方法と一致しているか？
- [ ] 外部API・コマンドの結果が空の場合のエラーハンドリングがあるか？
- [ ] 同じデータへの複数回のアクセスを1回にまとめているか？
- [ ] ハードコードされた設定を環境変数で上書き可能にしているか？
- [ ] エラーメッセージは明確で、ユーザーが対応方法を理解できるか？

---

## 10. push前の必須チェック

**重要**: pushする前に**必ず**以下を実行すること

```bash
./scripts/test/lint.sh
./scripts/test/test.sh all
./scripts/test/test-e2e.sh frontend
```

**理由**:

- pushするとGitHub ActionsでCIが実行される（約3-5分）
- ローカルでエラーを事前に検出することで、無駄なCI実行を防止できる
- 実行時間: 約3-4分（CI実行より短い）

---

## 11. まとめ

### 最優先事項

1. **型安全性**: any型・型キャスト禁止
2. **データ整合性**: IDベースマッピング使用
3. **アーキテクチャ**: 関心の分離、適切なモジュール設計
4. **テスト**: 全ての新規実装にテストを作成
5. **push前チェック**: 必ずローカルで確認

### このチェックリストの更新

- Gemini等のコードレビューで新たな指摘を受けた場合
- 本番環境で問題が発生した場合
- チーム内でベストプラクティスが見つかった場合

**常にこのチェックリストを進化させ、コード品質を向上させてください。**

---

**参照**:

- `.cursor/rules/00-WORKFLOW-CHECKLIST.md` - ワークフロー全体
- `.cursor/rules/01-project.md` - プロジェクト概要
