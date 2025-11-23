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

#### 1-4. 型ガード関数の実装

型ガード関数（Type Guard）を実装する際は、型安全性を損なわないよう注意が必要です。

**❌ 避けるべきパターン**:

```typescript
// ❌ 型ガード関数内で、証明しようとしている型自身にキャストする
export function isHttpError(error: unknown): error is HttpError {
  return (
    error instanceof Error &&
    'statusCode' in error &&
    typeof (error as HttpError).statusCode === 'number' // ← 問題
  );
}
```

**問題点**:

- 型ガード関数が証明しようとしている型（`HttpError`）に、検証前にキャストしている
- 型ガードの目的（型の証明）と矛盾する
- 型安全性の観点で改善の余地がある

**✅ 正しい実装**:

```typescript
// ✅ より限定的な型アサーションを使用
export function isHttpError(error: unknown): error is HttpError {
  return (
    error instanceof Error &&
    'statusCode' in error &&
    typeof (error as { statusCode: unknown }).statusCode === 'number'
  );
}
```

**改善点**:

- `{ statusCode: unknown }` という最小限の型アサーションを使用
- 型ガード自体の堅牢性が向上
- TypeScriptの型システムをより適切に活用

**参考**: PR #237 - Gemini Code Assistレビュー指摘

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

### 3-1. データベーストランザクション管理

#### ❌ 避けるべきパターン: 複数操作の非アトミック実行

```typescript
// ❌ 悪い例: 変更履歴と取引更新が別々の操作
async execute(dto: UpdateDto): Promise<Result> {
  await this.historyRepository.create(history);  // 1つ目の操作
  return await this.transactionRepository.update(transaction);  // 2つ目の操作
}
```

**問題**:

- 1つ目の操作が成功しても、2つ目が失敗するとデータ不整合が発生
- 履歴だけ記録されて、実際の更新が失敗する可能性
- ロールバックが困難

#### ✅ 正しいパターン: トランザクションでアトミックに実行

```typescript
// ✅ 良い例: データベーストランザクションで複数操作を1つに
@Injectable()
export class UpdateTransactionCategoryUseCase {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    @Inject(HISTORY_REPOSITORY)
    private readonly historyRepository: ITransactionCategoryChangeHistoryRepository,
  ) {}

  async execute(dto: UpdateDto): Promise<Result> {
    // トランザクション外で検証を実行
    const transaction = await this.transactionRepository.findById(dto.id);
    if (!transaction) {
      throw new NotFoundException(`Transaction not found`);
    }

    // データベーストランザクションで複数操作をアトミックに実行
    return await this.dataSource.transaction(async (entityManager) => {
      // 変更履歴を記録
      const historyRepo = entityManager.getRepository(HistoryOrmEntity);
      await historyRepo.save({ ... });

      // 取引を更新
      const transactionRepo = entityManager.getRepository(TransactionOrmEntity);
      await transactionRepo.save({ ... });

      return updatedTransaction;
    });
  }
}
```

**重要なポイント**:

1. **複数のデータベース操作が関連する場合は必ずトランザクションを使用**
2. **トランザクション外で可能な検証は先に実行**（パフォーマンス向上）
3. **エンティティマネージャー経由でリポジトリにアクセス**
4. **すべての操作が成功するか、すべて失敗するかのどちらか**（原子性）

#### リポジトリパターンの活用とトランザクション管理

**注意点**: トランザクション内でentityManagerを直接使用すると、リポジトリ層に集約すべきマッピングロジックがユースケース層に漏れ出てしまいます。

**より良いアプローチ** (将来的な改善案):

1. リポジトリメソッドがオプションで`EntityManager`を受け取れるようにする
2. トランザクション内では、その`EntityManager`をリポジトリメソッドに渡す
3. 永続化ロジックをリポジトリ層にカプセル化しつつ、アトミックな操作を保証

```typescript
// ✅ より良い設計 (将来的な改善案)
export interface IRepository {
  create(entity: Entity, entityManager?: EntityManager): Promise<Entity>;
  update(entity: Entity, entityManager?: EntityManager): Promise<Entity>;
}

// ユースケースでの使用
await this.dataSource.transaction(async (entityManager) => {
  await this.historyRepository.create(history, entityManager);
  return await this.transactionRepository.update(transaction, entityManager);
});
```

**トレードオフ**:

- 現状の実装（entityManager直接使用）でも原子性は保証される
- リポジトリパターンの完全性を優先する場合は、上記の設計を検討
- プロジェクトの段階や優先度に応じて判断する

#### TypeORMのデコレータの適切な使用

```typescript
// ❌ 避けるべきパターン
export class HistoryOrmEntity {
  @CreateDateColumn() // データベースが自動設定するはず
  changedAt!: Date;
}

// アプリケーション層で日時を設定
const history = new History(
  id,
  transactionId,
  oldCategory,
  newCategory,
  new Date() // ← アプリで設定している！
);
```

**問題**: `@CreateDateColumn`はデータベースが自動的に日時を設定するためのもの。アプリケーション側で日時を設定する場合は矛盾が生じる。

```typescript
// ✅ 正しいパターン
export class HistoryOrmEntity {
  @Column() // 通常のカラムとして定義
  changedAt!: Date;
}

// アプリケーション層で明示的に日時を設定
const history = new History(
  id,
  transactionId,
  oldCategory,
  newCategory,
  new Date() // アプリで制御
);
```

**原則**:

- **`@CreateDateColumn` / `@UpdateDateColumn`**: データベースに日時管理を任せる場合
- **`@Column()`**: アプリケーションで日時を制御する場合

### ❌ 避けるべきパターン

#### 3-2. コントローラーから他モジュールのリポジトリへの直接依存

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

### 3-3. NestJSモジュール定義のベストプラクティス

#### ❌ 避けるべきパターン: プロバイダーの重複登録

```typescript
// ❌ 悪い例: 同じプロバイダーが2回登録されている
@Module({
  providers: [
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: TransactionTypeOrmRepository,
    },
    TransactionTypeOrmRepository, // ← 重複！
    {
      provide: HISTORY_REPOSITORY,
      useClass: HistoryRepository,
    },
    HistoryRepository, // ← 重複！
    // ...
  ],
})
export class TransactionModule {}
```

**問題**:

- 同じクラスが2つのインスタンスとして登録される
- DIコンテナが混乱し、予期しない動作を引き起こす可能性
- 保守性が低下

#### ✅ 正しいパターン: トークンベースの登録のみ

```typescript
// ✅ 良い例: トークンベースの登録のみ
@Module({
  providers: [
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: TransactionTypeOrmRepository,
    },
    {
      provide: HISTORY_REPOSITORY,
      useClass: HistoryRepository,
    },
    // Domain Services
    TransactionDomainService,
    // Use Cases
    UpdateTransactionCategoryUseCase,
  ],
})
export class TransactionModule {}
```

**重要なポイント**:

- **トークンで提供されるクラスは、クラス名で再登録しない**
- **依存性注入はトークン経由で行う**
- **モジュール定義をシンプルに保つ**

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

#### 4-3. Jest forceExitの使用禁止

**❌ 禁止**:

```typescript
// jest.config.json
{
  "forceExit": true  // ❌ 根本的な問題を隠すため禁止
}
```

**問題点**:

- `forceExit: true`はJestが終了しない根本的な原因（リソースリークなど）を隠してしまう
- Jest公式ドキュメントでもこのオプションの使用は非推奨
- デバッグが困難になり、将来的な問題の原因となる

**✅ 正しい対応**:

1. **根本原因を特定する**

```bash
# --detectOpenHandlesで原因を調査
pnpm test:e2e --detectOpenHandles
```

2. **一般的な原因と対処法**

```typescript
// ✅ ScheduleModuleなどのリソースを適切にクリーンアップ

// テストセットアップ（test-setup.ts）
export async function createTestApp(
  moduleBuilder: TestingModuleBuilder,
  options: TestAppOptions = {}
): Promise<INestApplication> {
  const moduleFixture = await moduleBuilder.compile();
  const app = moduleFixture.createNestApplication();

  // シャットダウンフックを有効化
  // ScheduleModuleなどのリソースを適切にクリーンアップ
  app.enableShutdownHooks();

  await app.init();
  return app;
}

// テストのafterAll
afterAll(async () => {
  // app.close()がすべてのリソースをクリーンアップ
  await app.close();
});
```

3. **よくある原因**
   - **ScheduleModule**: cronジョブやタイマーがアクティブなまま
   - **データベース接続**: コネクションプールが閉じられていない
   - **EventEmitter**: リスナーが登録されたまま
   - **タイマー**: setTimeoutやsetIntervalが残っている

**参考**:

- Jest公式: https://jestjs.io/docs/configuration#forceexit-boolean
- PR #251 Gemini Code Assistレビュー指摘

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

### モックとスパイのクリーンアップ（必須パターン）

**Issue #248 / PR #273で確立されたベストプラクティス**

#### ✅ 推奨パターン（統一すべきアプローチ）

```typescript
describe('MyService', () => {
  let service: MyService;
  // 1. describeスコープでspy変数を宣言
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(async () => {
    // 2. beforeEachでspyインスタンスを代入
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // テストモジュールのセットアップ
    const module = await Test.createTestingModule({
      providers: [MyService],
    }).compile();

    service = module.get<MyService>(MyService);
  });

  afterEach(() => {
    // 3. jest.clearAllMocks()でモックの呼び出し履歴をクリア
    jest.clearAllMocks();
    // 4. 個別にmockRestore()でspyを復元
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it('should handle errors gracefully', async () => {
    // テストロジック
  });
});
```

#### 🎯 重要な改善点（Geminiレビュー指摘）

##### 1. `jest.clearAllMocks()`の配置

**✅ 推奨**: `afterEach`に配置してクリーンアップ処理をまとめる

```typescript
// ✅ 良い例: クリーンアップがまとまっている
beforeEach(() => {
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.clearAllMocks(); // モックの呼び出し履歴をクリア
  consoleErrorSpy.mockRestore(); // spyを復元
});

// ❌ 避けるべき: beforeEachにclearAllMocksがある
beforeEach(() => {
  jest.clearAllMocks(); // ここにあると、セットアップとクリーンアップが分散
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});
```

**理由:**

- クリーンアップ処理が一箇所にまとまり可読性向上
- テストライフサイクルの意図が明確
- 今回確立したベストプラクティスとの一貫性

##### 2. mockImplementationで複数引数を受け取る

**✅ 推奨**: `...args`を使って全引数を受け取る

```typescript
// ✅ 良い例: 全引数を受け取り、すべてをリダイレクト
consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
  if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) {
    return; // 特定のエラーのみ抑制
  }
  console.warn(...args); // すべての引数を渡す
});

// ❌ 避けるべき: 第一引数のみを受け取る
consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((message) => {
  if (typeof message === 'string' && message.includes('not wrapped in act')) {
    return;
  }
  console.warn(message); // 第一引数しか渡されない
});
```

**理由:**

- `console.error`は複数の引数を取ることがある
- すべての引数を保持しないと情報が欠落する
- より堅牢なエラーハンドリング

#### ❌ 避けるべきパターン

```typescript
// ❌ パターン1: jest.restoreAllMocks()の使用
afterEach(() => {
  jest.restoreAllMocks(); // 影響範囲が広く、意図しない副作用の可能性
});

// ❌ パターン2: spy変数を保存しない
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  // 変数に保存していないため、個別にrestoreできない
});

// ❌ パターン3: clearAllMocks()の欠如
afterEach(() => {
  consoleErrorSpy.mockRestore();
  // jest.clearAllMocks()がないため、テスト間でモックの呼び出し履歴が残る
});
```

#### 📝 このパターンを使う理由

1. **一貫性**: テストスイート全体で同じパターンを使用
   - コードレビューが容易
   - メンテナンス性向上

2. **安全性**: 個別リストアで意図しない副作用を防止
   - `jest.restoreAllMocks()`は影響範囲が広く、他のテストに影響する可能性
   - 明示的なspy変数宣言で、何がモック化されているか明確

3. **保守性**: spy変数の明示的な宣言で可読性向上
   - どのオブジェクトがモック化されているか一目でわかる
   - IDEの補完が効く

4. **テスト分離**: `jest.clearAllMocks()`でテスト間の影響を排除
   - モックの呼び出し履歴がテスト間で干渉しない
   - `toHaveBeenCalledTimes()`などのアサーションが正確に動作

#### 🎯 適用ケース

- **コンソール出力の抑制**: 意図的なエラーテストでの出力抑制
- **外部サービスのモック**: API呼び出し、データベースアクセスなど
- **日付・時刻のモック**: `Date.now()`、`new Date()`など
- **ランダム値のモック**: `Math.random()`など

### 4-7. E2Eテストのベストプラクティス

#### ✅ テストデータのクリーンアップ

```typescript
// ✅ 良い例: テスト後にデータをクリーンアップ
describe('Transaction API (e2e)', () => {
  let app: INestApplication;

  afterEach(async () => {
    // 各テストで作成したデータをクリーンアップ
    await connection.manager.query('DELETE FROM transactions;');
    await connection.manager.query('DELETE FROM categories;');
  });

  afterAll(async () => {
    await connection.close();
    await app.close();
  });
});
```

**重要なポイント**:

- **テスト間の独立性を保つ**: 前のテストのデータが次のテストに影響しない
- **`afterEach`でクリーンアップ**: 各テスト後にデータを削除
- **`afterAll`でリソース解放**: データベース接続やアプリケーションをクローズ

#### ❌ 避けるべきパターン: `waitForTimeout`の使用

```typescript
// ❌ 悪い例: 固定時間待機
await select.selectOption(newOption);
await page.waitForTimeout(1000); // 不安定・遅い
const updatedCategory = await page.locator('...').textContent();
```

**問題**:

- テストが不安定になる（環境によって必要な時間が異なる）
- 不必要に遅くなる（実際には500msで完了するのに1000ms待つ）

```typescript
// ✅ 良い例: UI状態の確認で待機
await select.selectOption(newOption);
// カテゴリが変更されたことを確認（元のカテゴリ名とは異なる）
await expect(page.locator('tbody tr:first-child button').first()).not.toHaveText(
  originalCategory || ''
);
```

**原則**:

- **UI状態の確認で待機**: `expect(...).toBeVisible()`、`expect(...).toHaveText()`など
- **固定時間待機は最終手段**: どうしても必要な場合のみ使用

#### ✅ E2Eテストでのデータベース状態の検証

**問題**: APIレスポンスの検証のみでは、副作用（データベースへの変更）が正しく実行されたか確認できない。

```typescript
// ❌ 不十分な例: APIレスポンスのみを検証
it('取引のカテゴリを更新できる', async () => {
  const response = await request(app.getHttpServer())
    .patch(`/transactions/${id}/category`)
    .send({ category: newCategory })
    .expect(200);

  expect(response.body.data.category.id).toBe('cat-002');
  // データベースに履歴が記録されているかは未検証
});
```

**✅ 推奨パターン**: APIレスポンスとデータベース状態の両方を検証

```typescript
// ✅ 良い例: データベース状態も検証
it('取引のカテゴリを更新できる', async () => {
  const response = await request(app.getHttpServer())
    .patch(`/transactions/${id}/category`)
    .send({ category: newCategory })
    .expect(200);

  // 1. APIレスポンスの検証
  expect(response.body.data.category.id).toBe('cat-002');

  // 2. データベース状態の検証
  const history = await dataSource.query(
    'SELECT * FROM transaction_category_change_history WHERE transactionId = ?',
    [id]
  );
  expect(history).toHaveLength(1);
  expect(history[0].oldCategoryId).toBe('cat-001');
  expect(history[0].newCategoryId).toBe('cat-002');
});
```

**重要なポイント**:

- **副作用の検証**: 重要な副作用（履歴記録、通知送信など）は必ずデータベースで確認
- **E2Eテストの価値最大化**: エンドツーエンドでの動作を完全に検証
- **dbHelperの活用**: `E2ETestDatabaseHelper`やDataSourceを使用してデータベースにアクセス

### 4-8. テストでのアサーション追加

#### ✅ 重要な副作用を検証する

```typescript
// ✅ 良い例: 変更履歴が作成されることを検証
it('取引のカテゴリを正しく更新できる', async () => {
  const result = await useCase.execute({ transactionId, category: newCategory });

  expect(mockRepository.findById).toHaveBeenCalledWith(transactionId);
  expect(mockHistoryRepository.create).toHaveBeenCalled(); // 履歴作成を検証
  expect(mockRepository.update).toHaveBeenCalled();
  expect(result.category).toEqual(newCategory);
});
```

**重要なポイント**:

- **重要な副作用は必ず検証**: 変更履歴の記録、通知の送信など
- **モックの呼び出しを確認**: `toHaveBeenCalled()`, `toHaveBeenCalledWith()`
- **ビジネスロジックを網羅**: 正常系だけでなく、重要な処理も確認

#### 参考

- Issue #248: テスト実行時のエラー出力抑制
- PR #273: Geminiレビュー対応
- Gemini指摘: モッククリーンアップの統一

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

### 5-3. フロントエンドのエラーハンドリングとパフォーマンス

#### ❌ 避けるべきパターン: ユーザーへの通知なしのエラー処理

```typescript
// ❌ 悪い例: エラーがコンソールのみに出力される
useEffect(() => {
  const fetchCategories = async (): Promise<void> => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error('カテゴリの取得に失敗しました:', err); // ユーザーには通知されない
    }
  };
  void fetchCategories();
}, []);
```

**問題**:

- ユーザーにエラーが通知されない
- 空のドロップダウンが表示され、UXが低下
- ユーザーは何が問題なのか分からない

#### ✅ 正しいパターン: ユーザーへの明示的なエラー表示

```typescript
// ✅ 良い例: エラーをUIに表示
useEffect(() => {
  const fetchCategories = async (): Promise<void> => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      setError('カテゴリの取得に失敗しました。ページを再読み込みしてください。');
      console.error('カテゴリの取得に失敗しました:', err);
    }
  };
  void fetchCategories();
}, []);

// UIでエラーを表示
{error && (
  <div className="mb-4 text-red-600 p-3 bg-red-50 rounded-md">{error}</div>
)}
```

**重要なポイント**:

- **エラーをユーザーに通知**: エラーメッセージを視覚的に表示
- **リカバリー方法を提示**: 「ページを再読み込みしてください」など
- **開発者向けログは維持**: `console.error`でデバッグ情報を残す

#### ❌ 避けるべきパターン: コンポーネント内でのヘルパー関数定義

```typescript
// ❌ 悪い例: コンポーネント内に定義
export function MyComponent({ data }: Props) {
  // この関数はレンダリングごとに再定義される
  const flattenTree = (nodes: Node[]): Item[] => {
    // ... 実装 ...
  };

  const flatData = flattenTree(data);
  // ...
}
```

**問題**:

- コンポーネントが再レンダリングされるたびに関数が再定義される
- パフォーマンスが低下
- メモリ使用量が増加

#### ✅ 正しいパターン: モジュールレベルでのヘルパー関数定義

```typescript
// ✅ 良い例: コンポーネント外に定義
const flattenTree = (nodes: Node[]): Item[] => {
  const result: Item[] = [];
  const traverse = (node: Node): void => {
    result.push(node.item);
    node.children.forEach(traverse);
  };
  nodes.forEach(traverse);
  return result;
};

export function MyComponent({ data }: Props) {
  const flatData = flattenTree(data);
  // ...
}
```

**重要なポイント**:

- **propsやstateに依存しない関数はコンポーネント外に**: 再定義を避ける
- **パフォーマンス向上**: 関数の参照が一定になる
- **可読性向上**: コンポーネントのロジックがシンプルになる

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

### 7-3. クロージャとuseCallbackの注意点

**問題**: `useCallback`の依存配列に状態を含めると、コールバックがその時点の値をキャプチャしてしまい、後で状態が変更されても古い値を参照し続ける

❌ **悪い例**:

```typescript
const [formData, setFormData] = useState<FormData>({...});

// handleErrorが呼ばれた時点のformDataをキャプチャ
const handleError = useCallback(
  (errorMessage: string): void => {
    showErrorToast('error', errorMessage, {
      onRetry: () => {
        // ここでキャプチャされたformDataは古い可能性がある
        if (validate()) {
          onSubmit(formData); // ❌ ユーザーが値を変更しても古いデータが送信される
        }
      },
    });
  },
  [formData, validate, onSubmit] // formDataが依存配列に含まれる
);
```

**問題点**:

- エラー通知表示後にユーザーがフォームを変更しても、「再試行」ボタンで古いデータが送信される
- ユーザーの最新の入力が反映されない

✅ **良い例**:

```typescript
const [formData, setFormData] = useState<FormData>({...});
const formDataRef = useRef(formData);

// formDataRefを常に最新の状態に保つ
useEffect(() => {
  formDataRef.current = formData;
}, [formData]);

// validate関数がデータ引数を受け取るように変更
const validate = useCallback((dataToValidate: FormData): boolean => {
  const newErrors: Record<string, string> = {};
  // dataToValidateを使ってバリデーション
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
}, []); // setErrorsは安定しているため依存配列は空

// handleErrorでformDataRefを使用
const handleError = useCallback(
  (errorMessage: string): void => {
    showErrorToast('error', errorMessage, {
      onRetry: () => {
        // 最新のformDataを参照
        if (validate(formDataRef.current)) {
          onSubmit(formDataRef.current); // ✅ 常に最新のデータが送信される
        }
      },
    });
  },
  [validate, onSubmit] // formDataは依存配列から除外
);
```

**改善点**:

- `formDataRef`を使って常に最新のフォームデータを参照
- `validate`関数をデータ引数を受け取るように変更し、依存配列を空に
- `handleError`の依存配列から`formData`を削除し、クロージャ問題を解決
- エラー通知表示後にユーザーがフォームを変更しても、「再試行」ボタンで最新のデータが送信される

**参考**: PR #238 - Gemini Code Assistレビュー指摘

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

### 9-3-1. エラーメッセージのユーザーフレンドリー化

APIから返されるエラーメッセージをそのままユーザーに表示することは避けるべきです。

**❌ 避けるべきパターン**:

```typescript
// ❌ 技術的なエラーメッセージをそのまま表示
catch (error) {
  if (isHttpError(error) && error.statusCode === 401) {
    return Result.failure(error.message); // "Unauthorized: Invalid token format"
  }
}
```

**問題点**:

- APIが返すエラーメッセージは技術的でユーザーにとって分かりにくい
- エラーメッセージの内容がAPIの実装に依存する
- 多言語対応が困難

**✅ 正しい実装**:

```typescript
// ✅ ユーザーフレンドリーな固定メッセージを使用
catch (error) {
  if (isHttpError(error) && error.statusCode === 401) {
    return Result.failure('認証情報が無効です'); // わかりやすい日本語メッセージ
  }
}
```

**改善点**:

- ユーザーが理解しやすい表現
- 一貫性のあるエラーメッセージ
- ログには技術的な詳細を記録しつつ、ユーザーにはわかりやすいメッセージを表示
- 多言語対応が容易

**実装例**:

```typescript
// ログには詳細、ユーザーには簡潔に
catch (error) {
  this.logger.error('認証エラー', {
    error: error instanceof Error ? error.message : String(error),
    statusCode: isHttpError(error) ? error.statusCode : undefined,
  });

  if (isHttpError(error) && (error.statusCode === 401 || error.statusCode === 403)) {
    return {
      success: false,
      needsReauth: true,
      errorMessage: '認証情報が無効です', // ユーザー向け
      errorCode: 'AUTH_ERROR',
    };
  }
}
```

**参考**: PR #237 - Gemini Code Assistレビュー指摘

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

### 9-6. DTO設計の原則

**重要**: リクエストDTOとレスポンスDTOで異なる設計パターンを適用

#### リクエストDTO: `class`を使用

**理由**:

- バリデーションデコレータ（`@IsString()`, `@IsOptional()`等）が必要
- class-validatorがclassベースで動作
- インスタンス化され、バリデーションパイプラインで処理される

**実装例**:

```typescript
import { IsBoolean, IsOptional, IsDateString } from 'class-validator';

export class SyncTransactionsDto {
  @IsOptional()
  @IsBoolean()
  forceFullSync?: boolean;
}

export class GetSyncHistoryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
```

#### レスポンスDTO: `interface`を使用

**理由**:

- 単なる型定義であり、メソッドやバリデーションロジックを持たない
- インスタンス化されない（コントローラーがオブジェクトリテラルを返す）
- TypeScriptの`strictPropertyInitialization`チェックを回避
- classとして定義するとプロパティの初期化が必須になり、不要な複雑性が増す

**実装例**:

```typescript
// ✅ 正しい: interface
export interface SyncTransactionsResponseDto {
  success: boolean;
  data: {
    syncId: string;
    status: string;
    successCount: number;
    failureCount: number;
  };
}

// ❌ 誤り: class（ビルドエラーが発生）
export class SyncTransactionsResponseDto {
  success: boolean;  // TS2564: Property has no initializer
  data: { ... };     // TS2564: Property has no initializer
}
```

**ビルドエラーの例**:

```
TS2564: Property 'success' has no initializer and is not definitely assigned in the constructor.
TS2564: Property 'data' has no initializer and is not definitely assigned in the constructor.
```

**classで定義した場合の問題**:

1. プロパティに初期化子が必要（`success: boolean = false`）
2. または、コンストラクタですべてのプロパティを初期化する必要
3. レスポンスDTOは型定義のみなので、この複雑性は不要

**まとめ**:

| 用途          | 型          | 理由               |
| ------------- | ----------- | ------------------ |
| リクエストDTO | `class`     | バリデーション必要 |
| レスポンスDTO | `interface` | 型定義のみ         |

**参考**: Issue #22 / PR #262 - Geminiレビュー対応でのCI失敗から学習

#### レスポンスDTOでの型の厳密化

**原則**: レスポンスDTOでは、可能な限り厳密な型を使用する

**❌ 避けるべきパターン**:

```typescript
export interface ConnectionStatusDto {
  status: string; // ❌ 曖昧すぎる
  institutionType: string; // ❌ 曖昧すぎる
}
```

**✅ 推奨パターン**:

```typescript
export interface ConnectionStatusDto {
  status: 'CONNECTED' | 'DISCONNECTED' | 'NEED_REAUTH'; // ✅ 厳密な型
  institutionType: 'bank' | 'credit-card' | 'securities'; // ✅ 厳密な型
}
```

**改善効果**:

1. **コンパイル時の型チェック強化**
   - 不正な値（例: `'PENDING'`, `'ERROR'`）をコンパイル時に検出
   - タイポやミスを防止

2. **モジュール内での型定義の一貫性向上**
   - Domain層のEnum型と整合性を保証
   - DTO層、Domain層、Application層で同じ値を使用

3. **APIドキュメントの自動生成**
   - 型定義から可能な値が明確になる
   - OpenAPI/Swaggerで正確な型情報が提供される

**実装時の注意点**:

Domain層でEnum型を使用している場合、Application層で**型ガード関数**を使用して安全に変換：

```typescript
// Domain層: 共通の型定義ファイル (connection.types.ts)
export type ConnectionStatusType = 'CONNECTED' | 'DISCONNECTED' | 'NEED_REAUTH';

// 型ガード関数
export function isPublicConnectionStatus(
  status: string,
): status is ConnectionStatusType {
  return ['CONNECTED', 'DISCONNECTED', 'NEED_REAUTH'].includes(status);
}

// Domain層: Enum型
export enum ConnectionStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  NEED_REAUTH = 'NEED_REAUTH',
  CHECKING = 'CHECKING',  // 内部状態
}

// Application層: 型ガードを使用した安全な変換
private toResult(history: ConnectionHistory): ConnectionHistoryResult {
  // 型ガードで安全に型変換
  if (!isPublicConnectionStatus(history.status)) {
    this.logger.warn(
      `内部ステータス '${history.status}' は公開APIでは使用できません。DISCONNECTEDとして扱います。`,
    );
    // 内部ステータスはDISCONNECTEDとして扱う
    return {
      status: 'DISCONNECTED',
      // ...
    };
  }

  return {
    status: history.status, // 型ガードにより安全に代入可能
    // ...
  };
}
```

**❌ 避けるべきパターン（型アサーションの危険性）**:

```typescript
// ❌ 型アサーション (as) は型安全性を損なう
private toResult(history: ConnectionHistory): ConnectionHistoryResult {
  return {
    status: history.status as 'CONNECTED' | 'DISCONNECTED' | 'NEED_REAUTH',
    // history.statusが'CHECKING'の場合、型チェックをすり抜けてしまう
  };
}
```

**型アサーションのリスク**:

- コンパイラはエラーを検知できない
- ランタイムで予期しない値がクライアントに渡る可能性
- Enumに新しい値が追加された際に気づかない
- 永続化されたデータに内部状態が含まれる場合、検出できない

**型ガードのメリット**:

- 実行時に値を検証し、不正な値を検出
- 型安全性を保ちながら、フォールバック処理が可能
- コードの意図が明確になる
- デバッグ時にログで問題を追跡できる

````

#### 型エイリアスによる型定義の一元管理

**原則**: 文字列リテラルユニオン型は型エイリアスとして定義し、一元管理する

**❌ 避けるべきパターン**:

```typescript
// ファイル1: check-connection.dto.ts
export interface ConnectionStatusDto {
  status: 'CONNECTED' | 'DISCONNECTED' | 'NEED_REAUTH'; // 型を直接記述
}

// ファイル2: get-connection-history.dto.ts
export interface ConnectionHistoryDto {
  status: 'CONNECTED' | 'DISCONNECTED' | 'NEED_REAUTH'; // 同じ型を重複定義
}

// ファイル3: connection-status-result.type.ts
export interface ConnectionStatusResult {
  status: 'CONNECTED' | 'DISCONNECTED' | 'NEED_REAUTH'; // 同じ型を重複定義
}
````

**問題点**:

- 型定義が分散し、変更時に複数箇所を修正する必要
- タイポのリスク
- 一貫性が保てない

**✅ 推奨パターン**:

```typescript
// connection.types.ts（共通定義ファイル）
export type ConnectionStatusType = 'CONNECTED' | 'DISCONNECTED' | 'NEED_REAUTH';
export type InstitutionType = 'bank' | 'credit-card' | 'securities';

// check-connection.dto.ts
import type { ConnectionStatusType, InstitutionType } from '../../domain/types/connection.types';

export interface ConnectionStatusDto {
  status: ConnectionStatusType; // 型エイリアスを使用
  institutionType: InstitutionType;
}

// get-connection-history.dto.ts
import type { ConnectionStatusType, InstitutionType } from '../../domain/types/connection.types';

export interface ConnectionHistoryDto {
  status: ConnectionStatusType; // 型エイリアスを使用
  institutionType: InstitutionType;
}
```

**メリット**:

1. **型定義の変更が1箇所で済む**
   - 値を追加・削除する際、1ファイルのみ修正
   - 変更の影響範囲が明確

2. **タイポの防止**
   - 型エイリアスを使用するため、スペルミスが起きない

3. **一貫性の保証**
   - すべての箇所で同じ型定義を使用
   - Domain層からPresentation層まで統一

4. **保守性の向上**
   - 型の意味が名前から明確
   - リファクタリングが容易

**配置場所**:

- Domain層の `types/` ディレクトリ
- 例: `modules/health/domain/types/connection.types.ts`

#### 内部状態と公開状態の分離

**原則**: Domain層の内部状態と、公開APIで使用する状態を明確に分離する

**背景**:

- Domain層では処理中の状態（`CHECKING`, `PROCESSING`等）を含む完全なEnum
- 公開APIでは確定した状態のみを返す
- この差分を安全に変換する必要がある

**実装パターン**:

```typescript
// Domain層: 完全な状態を持つEnum
export enum ConnectionStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  NEED_REAUTH = 'NEED_REAUTH',
  CHECKING = 'CHECKING', // ⚠️ 内部状態（公開しない）
}

// 公開用の型定義（内部状態を含まない）
export type ConnectionStatusType = 'CONNECTED' | 'DISCONNECTED' | 'NEED_REAUTH';

// 型ガード関数で安全に変換
export function isPublicConnectionStatus(
  status: string,
): status is ConnectionStatusType {
  return ['CONNECTED', 'DISCONNECTED', 'NEED_REAUTH'].includes(status);
}

// Application層での使用
private toResult(entity: SomeEntity): SomeResult {
  if (!isPublicConnectionStatus(entity.status)) {
    // 内部状態を適切なフォールバック値に変換
    this.logger.warn(`内部ステータス '${entity.status}' を公開値に変換します`);
    return { status: 'DISCONNECTED', ... };
  }
  return { status: entity.status, ... };
}
```

**なぜ重要か**:

1. **意図しない状態の露出を防止**
   - 処理中の状態がクライアントに渡らない
   - APIの安定性が向上

2. **永続化データの問題を検出**
   - 予期せぬプロセス中断で内部状態のまま保存されたデータを検出
   - ログで追跡可能

3. **将来の拡張性**
   - 内部状態の追加が公開APIに影響しない
   - Domain層とPresentation層の疎結合

#### 既存コードへの適用（リファクタリング指針）

**原則**: 新規実装時は最初から、既存コードは段階的に改善

**リファクタリングの優先順位**:

1. **高優先度**（すぐに対応）
   - `as`による型アサーションを使用している箇所
   - `string`型で本来は限定的な値しか取らないプロパティ
   - 公開API（外部に影響）の型定義

2. **中優先度**（次のタスクで対応）
   - 内部APIの型定義
   - 重複している型定義

3. **低優先度**（機会があれば対応）
   - 古いコードで動作が安定している箇所

**リファクタリング手順**:

```bash
# 1. 型アサーション使用箇所を検索
grep -r " as " apps/backend/src/

# 2. string型で限定値を持つプロパティを検索
grep -r ": string" apps/backend/src/modules/*/presentation/dto/

# 3. 優先順位をつけて段階的に対応
# - まず公開APIのDTO
# - 次にDomain層の型定義
# - 最後にApplication層の変換処理
```

**注意点**:

- **一度に大量の変更をしない**
  - 1つのモジュールずつ対応
  - テストを確実に実行
- **既存の動作を変えない**
  - 型定義の厳密化は行うが、実行時の振る舞いは維持
  - ログ追加は良いが、エラーハンドリングの変更は慎重に

- **レビューを活用**
  - Geminiのコードレビューで指摘された箇所を優先
  - ルールファイルに学びを追加

**参考**: Issue #265 / PR #274 - Geminiレビュー指摘から学習

---

## 10. push前の必須チェック

```

╔═══════════════════════════════════════════════════════════════╗
║ 🚨 CRITICAL RULE - PUSH前の4ステップチェック 🚨 ║
║ ║
║ 詳細は `.cursor/rules/03-git-workflow.md` を参照 ║
╚═══════════════════════════════════════════════════════════════╝

```

**必須4ステップ**:

```bash
1. ./scripts/test/lint.sh         # 構文・スタイル
2. pnpm build                      # ビルド確認 ⭐ 重要
3. ./scripts/test/test.sh all     # ユニットテスト
4. ./scripts/test/test-e2e.sh frontend # E2Eテスト
```

**実行時間**: 約4-6分

**なぜ重要か**:

- ビルドエラーはすべてのCI jobをブロックする
- ローカルでの早期発見により時間節約（実例: Issue #22で20分の損失を防げた）

**詳細**: `.cursor/rules/03-git-workflow.md` の「3. Push前チェック」セクション参照

---

## 11. まとめ

### 最優先事項

1. **型安全性**: any型・危険な型キャスト禁止、型ガード関数を使用
2. **データ整合性**: IDベースマッピング使用
3. **アーキテクチャ**: 関心の分離、適切なモジュール設計
4. **テスト**: 全ての新規実装にテストを作成
5. **DTO設計**: リクエストはclass、レスポンスはinterface、型エイリアスで一元管理
6. **push前チェック**: Lint → **Build** → Unit Test → E2E Test（4ステップ必須）

### 型安全性のベストプラクティス（Geminiレビューから学習）

1. **型定義の厳密化**
   - `string`ではなく文字列リテラルユニオン型を使用
   - 型エイリアスで一元管理

2. **型アサーション(`as`)を避ける**
   - 型ガード関数で実行時検証
   - フォールバック処理で堅牢性を確保

3. **内部状態と公開状態の分離**
   - Domain層の完全な状態と公開APIの状態を明確に分離
   - 型ガード関数で安全に変換

4. **既存コードの段階的改善**
   - 型アサーション使用箇所を優先的にリファクタリング
   - 公開APIから順に対応

### push前の4ステップチェック（厳守）

```bash
# 絶対に忘れずに実行
./scripts/test/lint.sh
pnpm build  # ⭐ ビルドチェックを忘れない！
./scripts/test/test.sh all
./scripts/test/test-e2e.sh frontend
```

### このチェックリストの更新

- Gemini等のコードレビューで新たな指摘を受けた場合
- 本番環境で問題が発生した場合
- チーム内でベストプラクティスが見つかった場合
- **CIで失敗した場合、原因をルールに追加**
- **型安全性に関する新しい学びがあった場合、必ず記録**

**常にこのチェックリストを進化させ、コード品質を向上させてください。**

---

**参照**:

- `.cursor/rules/00-WORKFLOW-CHECKLIST.md` - ワークフロー全体
- `.cursor/rules/01-project.md` - プロジェクト概要

### 6-2. サブシェルを使用したディレクトリ操作

#### ❌ 避けるべきパターン: 連続的な`cd`コマンド

```bash
# ❌ 悪い例: ディレクトリ構造の変更に脆弱
all)
  echo "🔨 共有型定義のビルド中..."
  cd libs/types
  pnpm build
  echo "🔨 共有ユーティリティのビルド中..."
  cd ../utils  # ← 相対パスに依存
  pnpm build
  echo "🔨 バックエンドのビルド中..."
  cd ../../apps/backend  # ← さらに複雑な相対パス
  pnpm build
  ;;
```

**問題**:

- ディレクトリ構造が変更されると壊れる
- 相対パスが複雑で可読性が低い
- スクリプトの現在位置を追跡しにくい

#### ✅ 正しいパターン: サブシェルで独立した実行

```bash
# ✅ 良い例: サブシェルで各コマンドを独立させる
all)
  echo "🔨 共有型定義のビルド中..."
  (cd libs/types && pnpm build)
  echo "🔨 共有ユーティリティのビルド中..."
  (cd libs/utils && pnpm build)
  echo "🔨 バックエンドのビルド中..."
  (cd apps/backend && pnpm build)
  ;;
```

**重要なポイント**:

- **サブシェル `(...)` の活用**: 各コマンドが独立した環境で実行される
- **プロジェクトルートを基準**: すべてのパスがルートからの相対パス
- **堅牢性の向上**: ディレクトリ構造の変更に強い
- **可読性の向上**: パスが明確で理解しやすい

---

## 7. 未実装機能の明示（Issue #28から学習）

### 7-1. 大規模機能実装時のTODOコメント規約

大規模な機能実装（特にFEATURE票）では、初期実装時に全機能を実装せず、段階的に進めることが推奨されます。その際、未実装箇所を明確に文書化する必要があります。

#### 原則

1. **未実装箇所には必ずTODOコメントを記載**
2. **未実装機能リストドキュメントを作成**
3. **レビュー時に未実装箇所を明示**
4. **将来の実装方針を記載**

#### TODOコメントの書き方

```typescript
// ❌ 悪い例: 不明確なTODO
// TODO: 実装予定

// ✅ 良い例: 明確な説明と実装方針
// TODO: 金融機関APIからの実際のデータ取得を実装
// 【依存】: FR-001, FR-002, FR-003の実装が必要
// 【実装方針】: institutionTypeに応じて適切なUseCaseを呼び出す
// 【参照】: docs/detailed-design/FR-006_auto-fetch-transactions/未実装機能リスト.md
```

### 7-2. 未実装機能リストドキュメント

大規模機能実装時は、詳細設計書ディレクトリに`未実装機能リスト.md`を作成します。

**ファイルパス例**:

```
docs/detailed-design/FR-006_auto-fetch-transactions/未実装機能リスト.md
```

**必須記載項目**:

- 優先度（Critical / High / Medium / Low）
- 未実装の理由（依存関係、技術的制約等）
- 実装方針（コード例を含む）
- 対応予定（Phase 1/2/3等）
- 関連Issue/PR

### 7-3. PR説明での未実装箇所の明示

PR作成時、未実装箇所を明確に記載します。

```markdown
## ✅ 実装完了

- ドメインモデル設計
- API設計
- 基本的な同期フロー

## ⚠️ 未実装（別Issue/PRで対応予定）

### Critical

- [ ] 金融機関APIからの実際のデータ取得（FR-001~003に依存）

### High

- [ ] 同期キャンセル処理（AbortController実装）

### Medium

- [ ] 動的スケジュール更新
- [ ] リアルタイム進捗表示
```

### 7-4. モック実装のガイドライン

未実装機能をモックで代替する際のルール:

```typescript
// ✅ 良い例: 明確なモック実装
private async syncOne(target: SyncTarget): Promise<SyncResult> {
  // TODO: 実際の金融機関APIからデータ取得を実装
  // 現在はモックデータで代替
  // 【実装時期】: FR-001~003完了後
  // 【依存機能】:
  //   - FetchBankTransactionsUseCase
  //   - FetchCreditCardTransactionsUseCase
  //   - FetchSecurityTransactionsUseCase

  // モックデータ（本番環境では使用されないことを保証）
  const mockData = {
    totalFetched: 10,
    newRecords: 10,
    duplicateRecords: 0,
  };

  this.logger.warn(
    `⚠️ モックデータを使用しています: ${target.institutionName}`
  );

  return mockData;
}
```

### 7-5. レビュー観点

コードレビュー時、以下を確認:

- [ ] 未実装箇所に明確なTODOコメントがあるか
- [ ] 未実装機能リストドキュメントが存在するか
- [ ] モック実装が本番環境で問題を起こさないか
- [ ] 将来の実装方針が明確か
- [ ] 依存関係が文書化されているか

### 7-6. 実装フェーズの分割例（Issue #28）

**Phase 1: 基盤機能**（現在のPR）

- ✅ ドメインモデル
- ✅ API設計
- ✅ 基本フロー

**Phase 2: 金融機関連携**（別Issue）

- 🔴 FR-001~003実装
- 🟠 実データ取得
- 🟠 キャンセル処理

**Phase 3: 運用機能**（別Issue）

- 🟡 動的スケジュール
- 🟡 進捗表示
- 🟡 通知機能

---
