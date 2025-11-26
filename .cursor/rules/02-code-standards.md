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

## 🚨 テスト作成の必須化（最重要ルール）

```
╔══════════════════════════════════════════════════════════════╗
║  🚨 CRITICAL RULE - MUST FOLLOW 🚨                          ║
║                                                              ║
║  新規機能・バグ修正の実装時は、必ずテストを同時に作成する    ║
║  テストなしでのPRマージは禁止                                 ║
║  「後でテストを書く」は許可しない                             ║
╚══════════════════════════════════════════════════════════════╝
```

### 絶対ルール: テストなしでの実装は禁止

**原則として、このルールは全ての実装に適用されます。**

#### ✅ 正しいワークフロー（TDD推奨）

1. **テスト作成**: 実装前に失敗するテストを書く
2. **実装**: テストをパスする最小限の実装
3. **リファクタリング**: コード品質を向上
4. **コミット**: 実装とテストを同時にコミット

#### ⚠️ 許容されるワークフロー（同時実装）

1. **実装とテストを並行**: 機能実装しながらテストも書く
2. **同一PRに含める**: 実装とテストを同じPRでレビュー
3. **コミット**: 実装commitとテストcommitを連続で行う

#### ❌ 禁止されるワークフロー

1. **実装のみでPR作成**: テストなしでPRを出す
2. **「後でテストを書く」**: テストを別PRで対応
3. **テストなしでマージ**: レビュアーがテストなしを許可

### テスト作成の対象

#### Backend

| レイヤー            | 必須テスト  | 理由                         |
| ------------------- | ----------- | ---------------------------- |
| Domain Entity       | Unit        | ビジネスルールの検証         |
| Domain Value Object | Unit        | バリデーションロジックの検証 |
| Domain Service      | Unit        | ドメインロジックの検証       |
| Application UseCase | Unit        | ユースケースのロジック検証   |
| Controller          | E2E         | APIエンドポイントの動作確認  |
| Repository実装      | Integration | データアクセスの検証         |

#### Frontend

| 対象           | 必須テスト | 理由                              |
| -------------- | ---------- | --------------------------------- |
| Component      | Unit       | UIロジックの検証                  |
| Store          | Unit       | 状態管理ロジックの検証            |
| API Client     | Unit       | APIリクエストの検証（モック使用） |
| Utils          | Unit       | ユーティリティ関数の検証          |
| ユーザーフロー | E2E        | 主要な画面遷移の検証              |

### 例外ケース

以下の場合のみ、テストなしでのマージを許可：

1. **ドキュメント変更のみ**: `.md`ファイルの更新のみ
2. **設定ファイル変更のみ**: `tsconfig.json`等の設定変更のみ
3. **緊急のホットフィックス**: セキュリティ修正等（ただし、直後にテスト追加Issueを作成）

### PR作成時のチェックリスト

PRテンプレート（`.github/pull_request_template.md`）には以下のチェックリストが含まれています：

- [ ] 新規追加/変更したすべてのコードに対応するテストを作成した
- [ ] すべてのテストがパスすることを確認した
- [ ] カバレッジレポートを確認し、追加コードがカバーされていることを確認した
- [ ] E2Eテストが必要な場合は追加した
- [ ] ローカルでの4ステップチェックを完了した
  - [ ] `./scripts/test/lint.sh`
  - [ ] `pnpm build`
  - [ ] `./scripts/test/test.sh all`
  - [ ] `./scripts/test/test-e2e.sh frontend`
- [ ] テストなしでマージする場合、例外ケースに該当し、その理由を記載した

**PR作成時は必ずこのチェックリストを確認し、すべての項目をチェックしてください。**

### カバレッジ目標

#### 現在のカバレッジ（2024年11月時点）

- Backend Unit: 35.89%（目標: 80%）
- Backend E2E: 1.23%（目標: 50%）
- Frontend Unit: 47.92%（目標: 80%）

#### 新規実装コードの目標

- **Unit Test Coverage**: 80%以上
- **E2E Test Coverage**: 主要フローを100%カバー

**重要**: 既存コードのカバレッジは段階的に向上させますが、**新規実装コードは必ず80%以上のカバレッジを確保**してください。

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

## 2-3. 環境変数の管理（NestJSベストプラクティス）

### ❌ 避けるべきパターン: `process.env`の直接参照

```typescript
// ❌ 悪い例: process.envを直接参照
@Injectable()
export class ConnectionCheckerService {
  private readonly TIMEOUT_MS = parseInt(process.env.HEALTH_CHECK_TIMEOUT_MS || '10000', 10);
  private readonly MAX_RESPONSE_TIME_MS = parseInt(
    process.env.HEALTH_CHECK_MAX_RESPONSE_TIME_MS || '5000',
    10
  );
}
```

**問題**:

- テスト容易性が低い（`process.env`を直接操作する必要がある）
- 型安全性がない（`parseInt`が`NaN`を返すリスク）
- バリデーションが実行時まで遅延される
- 設定の一元管理が困難

### ✅ 正しいパターン: `ConfigService`の使用

```typescript
// ✅ 良い例: ConfigServiceを使用
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConnectionCheckerService {
  private readonly TIMEOUT_MS: number;
  private readonly MAX_RESPONSE_TIME_MS: number;

  constructor(private readonly configService: ConfigService) {
    this.TIMEOUT_MS = this.configService.get<number>(
      'HEALTH_CHECK_TIMEOUT_MS',
      10000 // デフォルト値
    );
    this.MAX_RESPONSE_TIME_MS = this.configService.get<number>(
      'HEALTH_CHECK_MAX_RESPONSE_TIME_MS',
      5000 // デフォルト値
    );
  }
}
```

**改善点**:

1. **テスト容易性の向上**
   - `ConfigService`をモックすることで、テスト時に設定値を簡単に注入できる
   - `process.env`を直接操作する必要がない

2. **型安全性の向上**
   - `ConfigService`のジェネリクス型パラメータで型を指定
   - `class-validator`と連携することで、起動時にバリデーション可能

3. **設定の一元管理**
   - アプリケーション全体の設定を`ConfigModule`で一元管理
   - 可読性と保守性が向上

4. **実行時エラーの防止**
   - `parseInt`が`NaN`を返すリスクを低減
   - アプリケーション起動時に環境変数の型チェックと存在確認が可能

### 推奨実装パターン

```typescript
// app.module.ts
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 全モジュールでConfigServiceを使用可能に
      validationSchema: Joi.object({
        HEALTH_CHECK_TIMEOUT_MS: Joi.number().default(10000),
        HEALTH_CHECK_MAX_RESPONSE_TIME_MS: Joi.number().default(5000),
        SYNC_MAX_PARALLEL: Joi.number().default(5),
      }),
    }),
  ],
})
export class AppModule {}
```

**バリデーションスキーマ（オプション）**:

`class-validator`を使用することで、より厳密な型チェックとバリデーションが可能です：

```typescript
import { IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class EnvironmentVariables {
  @Type(() => Number)
  @IsNumber()
  @Min(1000)
  @Max(60000)
  HEALTH_CHECK_TIMEOUT_MS: number = 10000;

  @Type(() => Number)
  @IsNumber()
  @Min(1000)
  @Max(30000)
  HEALTH_CHECK_MAX_RESPONSE_TIME_MS: number = 5000;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  HEALTH_CHECK_MAX_PARALLEL: number = 5;
}
```

### チェックリスト

- [ ] `process.env`を直接参照せず、`ConfigService`を使用している
- [ ] 環境変数の型が明示的に指定されている
- [ ] デフォルト値が適切に設定されている
- [ ] テストでは`ConfigService`をモックしている
- [ ] （オプション）バリデーションスキーマを定義している

**参考**: PR #282 - Gemini Code Assistレビュー指摘

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
export class UpdateTransactionSubcategoryUseCase {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    @Inject(SUB_CATEGORY_REPOSITORY)
    private readonly subcategoryRepository: ISubcategoryRepository,
  ) {}

  async execute(dto: UpdateDto): Promise<Result> {
    // トランザクション外でエンティティの存在確認を並列実行
    const [transaction, subcategory] = await Promise.all([
      this.transactionRepository.findById(dto.transactionId),
      this.subcategoryRepository.findById(dto.subcategoryId),
    ]);

    // 存在確認
    if (!transaction) {
      throw new NotFoundException(
        `Transaction not found with ID: ${dto.transactionId}`,
      );
    }
    if (!subcategory) {
      throw new NotFoundException(
        `Subcategory not found with ID: ${dto.subcategoryId}`,
      );
    }

    // データ整合性の検証（カテゴリタイプの一致）
    if (transaction.category.type !== subcategory.categoryType) {
      throw new BadRequestException(
        `Subcategory with type ${subcategory.categoryType} cannot be assigned to a transaction with type ${transaction.category.type}.`,
      );
    }

    // データベーストランザクションで複数操作をアトミックに実行
    return await this.dataSource.transaction(async (entityManager) => {
      // トランザクション内で取引を再取得（競合状態の防止）
      const transactionRepo = entityManager.getRepository(TransactionOrmEntity);
      const transactionOrm = await transactionRepo.findOne({
        where: { id: dto.transactionId },
      });

      if (!transactionOrm) {
        throw new NotFoundException(
          `Transaction not found with ID: ${dto.transactionId} within transaction`,
        );
      }

      // 変更履歴を記録
      const historyRepo = entityManager.getRepository(HistoryOrmEntity);
      await historyRepo.save({ ... });

      // 取引を更新
      await transactionRepo.save({ ... });

      return result;
    });
  }
}
```

**重要なポイント**:

1. **複数のデータベース操作が関連する場合は必ずトランザクションを使用**
2. **トランザクション外で可能な検証は先に実行**（パフォーマンス向上）
3. **エンティティマネージャー経由でリポジトリにアクセス**
4. **すべての操作が成功するか、すべて失敗するかのどちらか**（原子性）
5. **トランザクション内でのデータ取得は必ずentityManagerを使用**
   - トランザクションに紐付いていないリポジトリを使用すると、ダーティリードなどの競合状態が発生する可能性
   - トランザクションの一貫性を保証するため、トランザクション内でのデータ取得は`entityManager.getRepository()`を使用
6. **トランザクション外での並列取得を活用**
   - 複数のエンティティを取得する場合は`Promise.all`を使用して並列化することでパフォーマンスを改善
   - ただし、トランザクション内での更新対象エンティティは必ず再取得する
7. **データ整合性の検証**
   - エンティティ間の関連性（例：カテゴリタイプの一致）を検証し、不整合の場合は`BadRequestException`をスロー
   - 検証はトランザクション外で実行し、早期にエラーを返すことでパフォーマンスを向上
8. **トランザクション内でのタイムスタンプ管理**
   - トランザクション内で複数のタイムスタンプが必要な場合、トランザクション開始時に一度だけ`Date`オブジェクトを生成し、それを使い回す
   - これにより、`changedAt`、`confirmedAt`、`updatedAt`などの間に意図しない時間のずれが生じるのを防ぐ
9. **トランザクション内でのタイムスタンプ管理**
   - トランザクション内で複数のタイムスタンプが必要な場合、トランザクション開始時に一度だけ`Date`オブジェクトを生成し、それを使い回す
   - これにより、`changedAt`、`confirmedAt`、`updatedAt`などの間に意図しない時間のずれが生じるのを防ぐ

#### リポジトリパターンの活用とトランザクション管理

**注意点**: トランザクション内でentityManagerを直接使用すると、リポジトリ層に集約すべきマッピングロジックがユースケース層に漏れ出してしまいます。

**✅ 推奨アプローチ**:

1. リポジトリメソッドがオプションで`EntityManager`を受け取れるようにする
2. トランザクション内では、その`EntityManager`をリポジトリメソッドに渡す
3. 永続化ロジックをリポジトリ層にカプセル化しつつ、アトミックな操作を保証

```typescript
// ✅ より良い設計
export interface IRepository {
  create(entity: Entity, entityManager?: EntityManager): Promise<Entity>;
  update(entity: Entity, entityManager?: EntityManager): Promise<Entity>;
  findById(id: string, entityManager?: EntityManager): Promise<Entity | null>;
}

// リポジトリ実装
@Injectable()
export class TypeOrmRepository implements IRepository {
  constructor(
    @InjectRepository(OrmEntity)
    private readonly repository: Repository<OrmEntity>,
  ) {}

  async create(entity: Entity, manager?: EntityManager): Promise<Entity> {
    const repository = manager ? manager.getRepository(OrmEntity) : this.repository;
    const ormEntity = this.toOrm(entity);
    await repository.save(ormEntity);
    return entity;
  }

  async findById(id: string, manager?: EntityManager): Promise<Entity | null> {
    const repository = manager ? manager.getRepository(OrmEntity) : this.repository;
    const ormEntity = await repository.findOne({ where: { id } });
    return ormEntity ? this.toDomain(ormEntity) : null;
  }

  // ドメインエンティティとORMエンティティのマッピングはリポジトリ内に集約
  private toOrm(domain: Entity): OrmEntity { /* ... */ }
  private toDomain(orm: OrmEntity): Entity { /* ... */ }
}

// ユースケースでの使用
async execute(dto: UpdateDto): Promise<Result> {
  // トランザクション外で検証
  const entity = await this.repository.findById(dto.id);
  if (!entity) {
    throw new NotFoundException(`Entity not found`);
  }

  // トランザクション内でリポジトリを使用
  return await this.dataSource.transaction(async (entityManager) => {
    // ⚠️ 重要: トランザクション内でエンティティを再取得
    // トランザクション外で取得したデータは古い可能性があるため、
    // 更新対象のエンティティは必ずトランザクション内で再取得する
    const entityToUpdate = await this.repository.findById(dto.id, entityManager);
    if (!entityToUpdate) {
      throw new NotFoundException(`Entity not found within transaction`);
    }

    await this.historyRepository.create(history, entityManager);
    return await this.repository.update(entityToUpdate, entityManager);
  });
}
```

**重要な注意点**:

1. **競合状態（レースコンディション）の防止**
   - トランザクション外で取得したエンティティをそのまま更新すると、古いデータで上書きしてしまう危険性がある
   - **必ずトランザクション内でエンティティを再取得**してから更新する
   - これにより、他のトランザクションによる変更を正しく反映できる

2. **パフォーマンス最適化**
   - 大量のデータを処理する場合は`Promise.all`で並列化
   - トランザクション外での検証で早期リターンを活用

```typescript
// ✅ 並列処理でパフォーマンス最適化
await this.dataSource.transaction(async (entityManager) => {
  // 並列で複数のデータを処理
  await Promise.all(
    dataArray.map(async (data) => {
      const existing = await this.repository.findById(data.id, entityManager);
      if (!existing) {
        await this.repository.create(data, entityManager);
      }
    })
  );
});
```

**メリット**:

- ✅ UseCase層がインフラストラクチャ層の実装詳細から切り離される
- ✅ ドメインエンティティとORMエンティティのマッピングがリポジトリに集約
- ✅ コードの重複を削減
- ✅ クリーンアーキテクチャの依存関係ルールを遵守
- ✅ テストの容易性が向上（リポジトリをモックしやすい）

**リポジトリ実装のベストプラクティス**:

3. **ヘルパーメソッドでコード重複を削減**

#### ❌ 避けるべきパターン: コードの重複

```typescript
// ❌ 悪い例: 同じロジックが複数のUseCaseに重複
export class GetSubcategoriesUseCase {
  private buildTree(subcategories: Subcategory[]): SubcategoryTreeItem[] {
    // 階層構造構築ロジック（50行以上）
  }
}

export class GetSubcategoriesByCategoryUseCase {
  private buildTree(subcategories: Subcategory[]): SubcategoryTreeItem[] {
    // 同じ階層構造構築ロジック（50行以上）← 重複！
  }
}
```

**問題**:

- 同じロジックが複数箇所に存在すると、メンテナンス性が低下
- バグ修正や機能追加時に複数箇所を修正する必要がある
- 将来のバグの原因となり得る

#### ✅ 正しいパターン: 共通サービスに抽出

```typescript
// ✅ 良い例: 共通のDomain Serviceに抽出
@Injectable()
export class SubcategoryTreeBuilderService {
  buildTree(subcategories: Subcategory[]): SubcategoryTreeItem[] {
    // 階層構造構築ロジック（1箇所に集約）
  }
}

export class GetSubcategoriesUseCase {
  constructor(private readonly treeBuilderService: SubcategoryTreeBuilderService) {}

  async execute(): Promise<Result> {
    const subcategories = await this.repository.findAll();
    const tree = this.treeBuilderService.buildTree(subcategories);
    return { subcategories: tree };
  }
}

export class GetSubcategoriesByCategoryUseCase {
  constructor(private readonly treeBuilderService: SubcategoryTreeBuilderService) {}

  async execute(categoryType: CategoryType): Promise<Result> {
    const subcategories = await this.repository.findByCategory(categoryType);
    const tree = this.treeBuilderService.buildTree(subcategories);
    return { subcategories: tree };
  }
}
```

**重要なポイント**:

- **同じロジックが2箇所以上に存在する場合は、共通サービスに抽出する**
- **Domain Service層に共通ロジックを配置**（Onion Architectureの原則に従う）
- **コードの重複はメンテナンス性の低下に繋がるため、積極的にリファクタリングする**
- **APIレスポンスの最適化**
  - 空の配列やオプショナルなプロパティは、値が存在する場合にのみレスポンスに含める
  - これにより、レスポンスのペイロードサイズを削減し、クリーンなAPIレスポンスになる
  - 例：子要素を持たないノード（葉ノード）に対して空の`children`配列を含めない

```typescript
// ✅ リポジトリ実装でDRY原則を徹底
@Injectable()
export class TypeOrmRepository implements IRepository {
  constructor(
    @InjectRepository(OrmEntity)
    private readonly repository: Repository<OrmEntity>
  ) {}

  // ヘルパーメソッドでEntityManagerの処理を一元化
  private getRepo(manager?: EntityManager): Repository<OrmEntity> {
    return manager ? manager.getRepository(OrmEntity) : this.repository;
  }

  async create(entity: Entity, manager?: EntityManager): Promise<Entity> {
    const repository = this.getRepo(manager);
    const ormEntity = this.toOrm(entity);
    await repository.save(ormEntity);
    return entity;
  }

  async findById(id: string, manager?: EntityManager): Promise<Entity | null> {
    const repository = this.getRepo(manager);
    const ormEntity = await repository.findOne({ where: { id } });
    return ormEntity ? this.toDomain(ormEntity) : null;
  }

  async update(entity: Entity, manager?: EntityManager): Promise<Entity> {
    const repository = this.getRepo(manager);
    const ormEntity = this.toOrm(entity);
    await repository.save(ormEntity);
    return entity;
  }

  // 他のメソッドも同様にgetRepo()を使用
}
```

**メリット**:

- EntityManager取得ロジックが一箇所に集約される
- 各メソッドがシンプルになり可読性が向上
- 変更が必要な場合、一箇所を修正するだけで済む

**トレードオフ**:

- 現状の実装（entityManager直接使用）でも原子性は保証される
- リポジトリパターンの完全性を優先する場合は、上記の設計を採用
- プロジェクトの段階や優先度に応じて判断する

**参考**: PR #283 Geminiレビュー指摘

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
- **未使用の依存関係は削除する**
  - インジェクトされているが使用されていない依存関係は、コードの理解を妨げる可能性があるため削除する
  - 特に、`entityManager`から直接リポジトリを取得している場合は、不要なインジェクションを削除する
- **DIトークンはSymbolを使用する**
  - 将来的な名前の衝突を避け、一貫性を保つために、すべてのDIトークンは`Symbol`を使用する
  - 文字列リテラルではなく、`Symbol('InterfaceName')`の形式で定義する
  - 例：`export const REPOSITORY_TOKEN = Symbol('IRepository');`

### 3-2. Domain層の設計原則とパフォーマンス考慮

#### ❌ 避けるべきパターン1: Domain ServiceでfindAll()してメモリフィルタリング

```typescript
// ❌ 悪い例: 全件取得してメモリ上でフィルタリング
@Injectable()
export class MerchantMatcherService {
  async match(description: string): Promise<Merchant | null> {
    const merchants = await this.merchantRepository.findAll();

    for (const merchant of merchants) {
      if (merchant.matchesDescription(description)) {
        return merchant;
      }
    }
    return null;
  }
}
```

**問題**:

- データ量の増加に伴いパフォーマンスが著しく低下
- 不要なデータをメモリに読み込む
- データベースの検索機能を活用できていない

**✅ 正しいパターン: リポジトリに検索責務を委譲**

```typescript
// ✅ 良い例: リポジトリ層で効率的な検索を実施
export interface IMerchantRepository {
  searchByDescription(description: string): Promise<Merchant | null>;
}

@Injectable()
export class MerchantMatcherService {
  async match(description: string): Promise<Merchant | null> {
    // リポジトリ層でDB検索を実施（パフォーマンス最適化）
    return await this.merchantRepository.searchByDescription(description);
  }
}

// Infrastructure層での実装例
@Injectable()
export class MerchantTypeOrmRepository implements IMerchantRepository {
  async searchByDescription(description: string): Promise<Merchant | null> {
    // DBレベルでLIKE検索やJSON検索を実施
    const result = await this.repository
      .createQueryBuilder('merchant')
      .where('merchant.name LIKE :desc', { desc: `%${description}%` })
      .orWhere('JSON_SEARCH(merchant.aliases, "one", :desc) IS NOT NULL', {
        desc: `%${description}%`,
      })
      .getOne();

    return result ? this.toDomain(result) : null;
  }
}
```

**重要なポイント**:

1. **Domain Serviceはビジネスロジックの調整に専念**
2. **データアクセスの最適化はリポジトリに委譲**
3. **パフォーマンス要件を考慮したリポジトリメソッド設計**

#### ❌ 避けるべきパターン2: コンストラクタ内でのサービスインスタンス化

```typescript
// ❌ 悪い例: コンストラクタ内で直接new
export class SubcategoryClassifierService {
  private readonly merchantMatcher: MerchantMatcherService;
  private readonly keywordMatcher: KeywordMatcherService;

  constructor(
    private readonly subcategoryRepository: ISubcategoryRepository,
    merchantRepository: IMerchantRepository
  ) {
    this.merchantMatcher = new MerchantMatcherService(merchantRepository);
    this.keywordMatcher = new KeywordMatcherService();
  }
}
```

**問題**:

- 依存性逆転の原則(DIP)に反する
- テストが困難（モック化できない）
- クラス間の結合度が高い

**✅ 正しいパターン: コンストラクタ注入**

```typescript
// ✅ 良い例: すべての依存をコンストラクタ注入
@Injectable()
export class SubcategoryClassifierService {
  constructor(
    private readonly subcategoryRepository: ISubcategoryRepository,
    private readonly merchantMatcher: MerchantMatcherService,
    private readonly keywordMatcher: KeywordMatcherService
  ) {}
}
```

**重要なポイント**:

1. **すべての依存はコンストラクタ経由で注入**
2. **@Injectable()デコレータでNestJSのDIコンテナに登録**
3. **テストしやすい設計**

#### ❌ 避けるべきパターン3: テキスト正規化ロジックの重複

```typescript
// ❌ 悪い例: 各クラスで異なる正規化ロジック
class MerchantEntity {
  private normalizeText(text: string): string {
    return text.toLowerCase().replace(/\s+/g, '');
  }
}

class KeywordMatcherService {
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
      .replace(/[^\w\sぁ-んァ-ヶー一-龯]/g, '')
      .trim();
  }
}
```

**問題**:

- ロジックの一貫性がない
- マッチング結果に予期せぬ差異が発生
- 保守性が低い

**✅ 正しいパターン: 共通ユーティリティの使用**

```typescript
// ✅ 良い例: 統一された正規化ユーティリティ
export class TextNormalizer {
  static normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
      .replace(/[^\w\sぁ-んァ-ヶー一-龯]/g, '')
      .replace(/\s+/g, '')
      .trim();
  }

  static includes(haystack: string, needle: string): boolean {
    return this.normalize(haystack).includes(this.normalize(needle));
  }
}

// 各クラスで統一使用
class MerchantEntity {
  matchesDescription(description: string): boolean {
    return TextNormalizer.includes(description, this.name);
  }
}
```

**重要なポイント**:

1. **アプリケーション全体で統一されたロジック**
2. **一貫性のある処理結果**
3. **保守性・テスト容易性の向上**

#### ✅ Repository Interfaceの安全な設計

```typescript
// ❌ 避けるべき: null安全性がない
export interface ISubcategoryRepository {
  findDefault(categoryType: CategoryType): Promise<Subcategory>;
}

// ✅ 推奨: null安全性を考慮
export interface ISubcategoryRepository {
  findDefault(categoryType: CategoryType): Promise<Subcategory | null>;
}

// 呼び出し側で安全にハンドリング
const defaultSubcategory = await this.repository.findDefault(mainCategory);
if (!defaultSubcategory) {
  throw new Error(`Default subcategory not found for category: ${mainCategory}`);
}
```

**重要なポイント**:

1. **データが見つからない可能性を型で表現**
2. **呼び出し側で適切なエラーハンドリング**
3. **null安全性の向上**

#### ✅ スコアベースの信頼度設計

```typescript
// ❌ 避けるべき: 信頼度をハードコード
const keywordMatch = this.keywordMatcher.match(description, category, subcategories);
if (keywordMatch) {
  const confidence = new ClassificationConfidence(0.8); // 固定値
  return new SubcategoryClassification(...);
}

// ✅ 推奨: 実際のマッチングスコアを活用
export interface KeywordMatchResult {
  subcategory: Subcategory;
  score: number;
}

const keywordMatch = this.keywordMatcher.match(description, category, subcategories);
if (keywordMatch) {
  // スコアを信頼度として利用（最低保証あり）
  const confidenceValue = Math.max(keywordMatch.score, 0.7);
  const confidence = new ClassificationConfidence(confidenceValue);
  return new SubcategoryClassification(...);
}
```

**重要なポイント**:

1. **計算されたスコアを活用**
2. **信頼度の動的な調整**
3. **より精度の高い分類**

#### 📝 日本語テキスト処理の将来対応

```typescript
/**
 * テキストからキーワードを抽出
 *
 * NOTE: 現在はスペースで分割する簡易実装
 * 日本語の取引明細（単語がスペースで区切られていない）には
 * 有効ではないため、将来的に形態素解析ライブラリ（kuromoji.js等）の
 * 導入を検討する必要がある
 */
public extractKeywords(text: string): string[] {
  const normalized = TextNormalizer.normalize(text);
  // TODO: 形態素解析の導入（kuromoji.js等）
  return normalized.split(/\s+/).filter((word) => word.length > 0);
}
```

**重要なポイント**:

1. **現在の実装の制約を明示**
2. **将来の改善方針をコメントで残す**
3. **段階的な機能向上を可能にする**

### 3-3. Value Objectとドメインモデルの一貫性

#### ❌ 避けるべきパターン: プリミティブな型をドメインエンティティで使用

```typescript
// ❌ 悪い例: プリミティブ型
export class Merchant {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly confidence: number // プリミティブ型
  ) {
    // バリデーションをエンティティで実装
    if (confidence < 0 || confidence > 1) {
      throw new Error('Invalid confidence');
    }
  }

  public getConfidence(): number {
    return this.confidence;
  }
}
```

**問題**:

- ドメインモデルの一貫性がない（他では`ClassificationConfidence` VOを使用）
- バリデーションロジックが分散
- 信頼度に関するロジックが集約されていない

**✅ 正しいパターン: Value Objectの活用**

```typescript
// ✅ 良い例: Value Objectを使用
export class Merchant {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly confidence: ClassificationConfidence // Value Object
  ) {
    // バリデーションはVOが担当
  }

  public getConfidence(): ClassificationConfidence {
    return this.confidence;
  }

  public toJSON(): MerchantJSONResponse {
    return {
      id: this.id,
      name: this.name,
      confidence: this.confidence.getValue(), // VOから値を取得
    };
  }
}
```

**重要なポイント**:

1. **ドメインモデル全体で一貫した型を使用**
2. **バリデーションロジックはVOに集約**
3. **JSONシリアライズ時はgetValue()で数値に変換**

### 3-4. マジックナンバーの排除

#### ❌ 避けるべきパターン: 閾値のハードコード

```typescript
// ❌ 悪い例: マジックナンバー
export class ClassificationConfidence {
  public isHigh(): boolean {
    return this.value >= 0.9; // 意図が不明確
  }

  public isMedium(): boolean {
    return this.value >= 0.7 && this.value < 0.9; // 変更時の影響が大きい
  }
}

// ❌ 悪い例: サービス内のマジックナンバー
export class SubcategoryClassifierService {
  async classify(description: string): Promise<SubcategoryClassification> {
    if (keywordMatch) {
      const confidenceValue = Math.max(keywordMatch.score, 0.7); // 意図不明
      // ...
    }
    const defaultConfidence = new ClassificationConfidence(0.5); // 変更困難
  }
}
```

**問題**:

- 数値の意図が不明確
- 変更時に複数箇所の修正が必要
- テストでの検証が困難

**✅ 正しいパターン: 名前付き定数の使用**

```typescript
// ✅ 良い例: Value Objectで定数化
export class ClassificationConfidence {
  private static readonly HIGH_THRESHOLD = 0.9;
  private static readonly MEDIUM_THRESHOLD = 0.7;

  public isHigh(): boolean {
    return this.value >= ClassificationConfidence.HIGH_THRESHOLD;
  }

  public isMedium(): boolean {
    return (
      this.value >= ClassificationConfidence.MEDIUM_THRESHOLD &&
      this.value < ClassificationConfidence.HIGH_THRESHOLD
    );
  }

  // 閾値を外部から取得可能に
  public static getHighThreshold(): number {
    return ClassificationConfidence.HIGH_THRESHOLD;
  }
}

// ✅ 良い例: サービスで定数化
@Injectable()
export class SubcategoryClassifierService {
  private static readonly MINIMUM_KEYWORD_MATCH_CONFIDENCE = 0.7;
  private static readonly DEFAULT_CLASSIFICATION_CONFIDENCE = 0.5;

  async classify(description: string): Promise<SubcategoryClassification> {
    if (keywordMatch) {
      const confidenceValue = Math.max(
        keywordMatch.score,
        SubcategoryClassifierService.MINIMUM_KEYWORD_MATCH_CONFIDENCE
      );
      // ...
    }
    const defaultConfidence = new ClassificationConfidence(
      SubcategoryClassifierService.DEFAULT_CLASSIFICATION_CONFIDENCE
    );
  }
}
```

**重要なポイント**:

1. **意味のある名前で定数を定義**
2. **変更時の影響範囲を最小化**
3. **テストでの検証が容易**
4. **コードの可読性と保守性が向上**

### 3-5. 冗長なasync/awaitの回避

#### ❌ 避けるべきパターン: awaitして即return

```typescript
// ❌ 悪い例: 冗長なasync/await
export class MerchantMatcherService {
  public async match(description: string): Promise<Merchant | null> {
    return await this.merchantRepository.searchByDescription(description);
  }
}
```

**問題**:

- 不要なPromiseラッピング
- 微妙なパフォーマンスオーバーヘッド
- コードが冗長

**✅ 正しいパターン: Promiseを直接返す**

```typescript
// ✅ 良い例: Promiseを直接返す
export class MerchantMatcherService {
  public match(description: string): Promise<Merchant | null> {
    return this.merchantRepository.searchByDescription(description);
  }
}
```

**例外: エラーハンドリングや追加処理が必要な場合**

```typescript
// ✅ async/awaitが必要なケース
export class MerchantMatcherService {
  public async match(description: string): Promise<Merchant | null> {
    try {
      const merchant = await this.merchantRepository.searchByDescription(description);
      // 追加の処理やログ出力
      this.logger.debug(`Matched merchant: ${merchant?.name}`);
      return merchant;
    } catch (error) {
      this.logger.error('Merchant matching failed', error);
      throw new MerchantMatchingException(error);
    }
  }
}
```

**重要なポイント**:

1. **単純なPromise転送ではasync/awaitを省略**
2. **エラーハンドリングや追加処理がある場合は使用**
3. **パフォーマンスとコードのシンプルさのバランス**

### 3-6. テキスト正規化の注意点

#### ❌ 避けるべきパターン: 過度な空白削除

```typescript
// ❌ 悪い例: すべての空白を削除
static normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\sぁ-んァ-ヶー一-龯]/g, '')
    .replace(/\s+/g, '') // すべての空白を削除
    .trim();
}

// 結果: extractKeywords()が機能しない
public extractKeywords(text: string): string[] {
  const normalized = this.normalizeText(text);
  // スペースが存在しないため分割できない
  return normalized.split(/\s+/).filter((word) => word.length > 0);
}
```

**問題**:

- キーワード抽出が機能しない
- 単語の区切りが失われる

**✅ 正しいパターン: 空白を一つにまとめる**

```typescript
// ✅ 良い例: 複数の空白を一つにまとめる
static normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\sぁ-んァ-ヶー一-龯]/g, '')
    .replace(/\s+/g, ' ') // 複数空白を一つにまとめる
    .trim();
}

// 結果: extractKeywords()が正常に動作
public extractKeywords(text: string): string[] {
  const normalized = this.normalizeText(text);
  // スペースで正しく分割できる
  return normalized.split(/\s+/).filter((word) => word.length > 0);
}
```

**重要なポイント**:

1. **正規化の目的を明確にする**
2. **後続の処理への影響を考慮**
3. **汎用的なユーティリティは慎重に設計**

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

- Jest公式: <https://jestjs.io/docs/configuration#forceexit-boolean>
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

### 4-9. テストでの例外検証のベストプラクティス

#### ✅ 効率的な例外アサーション

Jestの`toThrow`マッチャーは、例外のインスタンスを渡すことで、型とメッセージの両方を一度に検証できます。

❌ **悪い例**: 冗長な二重アサーション

```typescript
// ❌ useCase.executeが2回呼び出される（非効率）
await expect(useCase.execute({ creditCardId })).rejects.toThrow(NotFoundException);
await expect(useCase.execute({ creditCardId })).rejects.toThrow(
  `Credit card not found with ID: ${creditCardId}`
);
```

**問題点**:

- `useCase.execute`が2回実行される（非効率、副作用の可能性）
- 型チェックとメッセージチェックが分離している
- テストの意図が不明確

✅ **良い例**: 例外インスタンスで一度に検証

```typescript
// ✅ 一度の呼び出しで型とメッセージの両方を検証
await expect(useCase.execute({ creditCardId })).rejects.toThrow(
  new NotFoundException(`Credit card not found with ID: ${creditCardId}`)
);
```

**改善点**:

- **効率的**: 1回の実行で完全な検証
- **簡潔**: コードが読みやすい
- **明確**: テストの意図が一目瞭然
- **型安全**: 例外の型とメッセージを同時に検証

#### ✅ 適用例

```typescript
// AccountService
it('should throw NotFoundException when account does not exist', async () => {
  mockRepository.findById.mockResolvedValue(null);

  await expect(service.getAccount(accountId)).rejects.toThrow(
    new NotFoundException(`Account not found: ${accountId}`)
  );
});

// UserService
it('should throw BadRequestException for invalid email', async () => {
  const invalidEmail = 'invalid-email';

  await expect(service.createUser({ email: invalidEmail })).rejects.toThrow(
    new BadRequestException(`Invalid email format: ${invalidEmail}`)
  );
});
```

#### 参考

- **PR #285**: Geminiレビュー指摘（Issue #279）
- **学習元**: fetch-credit-card-transactions.use-case.spec.ts, fetch-security-transactions.use-case.spec.ts

---

### 4-10. エラーハンドリングでのステータス保護

#### 🔴 クリティカル: 特定のエラーによるステータス上書き防止

非同期処理でキャンセルやタイムアウトなどの特定のエラーが発生した場合、外側のcatchブロックで意図しないステータスに上書きされる問題に注意が必要です。

❌ **悪い例**: キャンセルエラーがFAILEDに上書きされる

```typescript
try {
  // RUNNING状態に更新
  syncHistory = syncHistory.markAsRunning();
  await this.syncHistoryRepository.update(syncHistory);

  try {
    // 同期処理（キャンセル可能）
    await this.fetchTransactions(abortSignal);
  } catch (error) {
    // ここでエラーをログに出力して再スロー
    this.logger.error('取引取得エラー', error);
    throw error;
  }

  // COMPLETED状態に更新
  syncHistory = syncHistory.markAsCompleted();
  await this.syncHistoryRepository.update(syncHistory);
} catch (error) {
  // ❌ キャンセルエラーもFAILEDに上書きされてしまう
  syncHistory = syncHistory.markAsFailed(error.message);
  await this.syncHistoryRepository.update(syncHistory);
}
```

**問題点**:

- キャンセルエラーが発生すると、CANCELLEDではなくFAILEDステータスに上書きされる
- ユーザーの意図的なキャンセル操作が「失敗」として記録される
- ステータスの整合性が失われる

✅ **良い例**: キャンセルエラーを判定して早期return

```typescript
try {
  // RUNNING状態に更新
  syncHistory = syncHistory.markAsRunning();
  await this.syncHistoryRepository.update(syncHistory);

  try {
    // 同期処理（キャンセル可能）
    await this.fetchTransactions(abortSignal);
  } catch (error) {
    // ✅ キャンセルエラーの場合は、CANCELLEDステータスを設定して早期return
    if (error instanceof Error && error.message === 'Transaction fetch was cancelled') {
      this.logger.log('同期キャンセル');
      syncHistory = syncHistory.markAsCancelled();
      await this.syncHistoryRepository.update(syncHistory);

      return {
        success: false,
        status: syncHistory.status, // CANCELLEDステータスを保持
        errorMessage: 'Sync cancelled',
      };
    }

    // その他のエラーは再スロー
    this.logger.error('取引取得エラー', error);
    throw error;
  }

  // COMPLETED状態に更新
  syncHistory = syncHistory.markAsCompleted();
  await this.syncHistoryRepository.update(syncHistory);
} catch (error) {
  // ✅ ここに到達するのは予期しないエラーのみ
  syncHistory = syncHistory.markAsFailed(error.message);
  await this.syncHistoryRepository.update(syncHistory);
}
```

**改善点**:

- **キャンセルエラーを明示的に判定**: 特定のエラーメッセージで判別
- **適切なステータス設定**: CANCELLEDステータスを保持
- **早期return**: 外側のcatchブロックに到達しない
- **意図の明確化**: コメントで処理の意図を明示

#### ✅ 適用すべきシナリオ

1. **AbortController によるキャンセル処理**
   - ユーザーの明示的なキャンセル操作
   - タイムアウトによる自動キャンセル

2. **ステータス遷移が重要な処理**
   - ワークフロー管理（PENDING → RUNNING → COMPLETED/FAILED/CANCELLED）
   - ジョブステータス管理

3. **複数のエラー状態を持つ処理**
   - バッチ処理（成功/失敗/スキップ/キャンセル）
   - トランザクション処理

#### ✅ 実装パターン

```typescript
// パターン1: 特定のエラークラスで判定
if (error instanceof CancellationError) {
  // キャンセル処理
  return handleCancellation();
}

// パターン2: エラーメッセージで判定
if (error instanceof Error && error.message.includes('cancelled')) {
  // キャンセル処理
  return handleCancellation();
}

// パターン3: カスタムプロパティで判定
if (error instanceof Error && 'isCancelled' in error && error.isCancelled) {
  // キャンセル処理
  return handleCancellation();
}
```

#### 参考

- **PR #285**: Geminiレビュー指摘（Issue #279）
- **修正箇所**: sync-all-transactions.use-case.ts
- **学習元**: 同期キャンセル処理のAbortController導入

---

### 4-11. カスタムエラークラスによる型安全なエラーハンドリング

#### 🔴 推奨: エラーメッセージの文字列依存を排除

エラーメッセージの文字列に依存してエラー判定を行うと、メッセージ変更時にロジックが壊れる脆弱な実装となります。

❌ **悪い例**: エラーメッセージの文字列依存（脆弱）

```typescript
// ❌ エラーメッセージの文字列に依存
try {
  await fetchData();
} catch (error) {
  if (error instanceof Error && error.message === 'Transaction fetch was cancelled') {
    // キャンセル処理
  }
}
```

**問題点**:

- エラーメッセージが変更されるとロジックが壊れる
- 文字列の完全一致が必要で脆弱
- 意図が不明確（どのような種類のエラーなのか）

✅ **良い例**: カスタムエラークラスで型安全に判定

```typescript
// ✅ カスタムエラークラスを定義
export class CancellationError extends Error {
  constructor(message: string = 'Operation was cancelled') {
    super(message);
    this.name = 'CancellationError';
    Error.captureStackTrace?.(this, CancellationError);
  }
}

// エラーのスロー
if (abortSignal?.aborted) {
  throw new CancellationError('Transaction fetch was cancelled');
}

// エラーの判定（型安全）
try {
  await fetchData();
} catch (error) {
  if (error instanceof CancellationError) {
    // キャンセル処理
    return handleCancellation();
  }
  // その他のエラー処理
  throw error;
}
```

**改善点**:

- **型安全**: `instanceof` で型チェック
- **保守性**: エラーメッセージ変更に強い
- **明確性**: エラーの種類が一目瞭然
- **拡張性**: カスタムプロパティを追加可能

#### ✅ カスタムエラークラスの設計パターン

```typescript
// 基本パターン
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string
  ) {
    super(message);
    this.name = 'ValidationError';
    Error.captureStackTrace?.(this, ValidationError);
  }
}

// 使用例
try {
  if (!email.includes('@')) {
    throw new ValidationError('Invalid email format', 'email');
  }
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(`Validation failed for field: ${error.field}`);
  }
}
```

#### ✅ 適用すべきシナリオ

1. **ユーザー操作によるキャンセル**
   - AbortControllerによる中断
   - タイムアウト

2. **ビジネスルール違反**
   - バリデーションエラー
   - 権限エラー

3. **リトライ可能なエラー**
   - ネットワークエラー
   - 一時的なサービス障害

#### ✅ 共通エラークラスの配置

```
src/
  common/
    errors/
      index.ts              # エクスポート
      cancellation.error.ts # キャンセルエラー
      validation.error.ts   # バリデーションエラー
      network.error.ts      # ネットワークエラー
```

#### 参考

- **PR #285**: Geminiレビュー指摘（Issue #279）
- **実装**: src/common/errors/cancellation.error.ts
- **適用箇所**: fetch-credit-card-transactions.use-case.ts, fetch-security-transactions.use-case.ts, sync-all-transactions.use-case.ts

---

### 4-12. 不要な依存関係の削除

#### 🟡 推奨: 使用していない依存関係は削除する

コンストラクタで注入されているが実際には使用されていない依存関係は、コードの複雑性を増し、メンテナンスコストを高めます。

❌ **悪い例**: 未使用の依存関係を保持

```typescript
@Injectable()
export class SyncAllTransactionsUseCase {
  constructor(
    @Inject(SYNC_HISTORY_REPOSITORY)
    private readonly syncHistoryRepository: ISyncHistoryRepository,
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepository: IInstitutionRepository,
    // ❌ 以下は使用していないが注入されている
    @Inject(CREDIT_CARD_REPOSITORY)
    private readonly creditCardRepository: ICreditCardRepository,
    @Inject(SECURITIES_ACCOUNT_REPOSITORY)
    private readonly securitiesAccountRepository: ISecuritiesAccountRepository,
    // 実際に使用するのはこれら
    private readonly fetchCreditCardTransactionsUseCase: FetchCreditCardTransactionsUseCase,
    private readonly fetchSecurityTransactionsUseCase: FetchSecurityTransactionsUseCase
  ) {}
}
```

**問題点**:

- 不要な依存関係がコードを複雑にする
- テスト時に不要なモックを作成する必要がある
- 意図が不明確（なぜ注入されているのか）

✅ **良い例**: 使用する依存関係のみを注入

```typescript
@Injectable()
export class SyncAllTransactionsUseCase {
  constructor(
    @Inject(SYNC_HISTORY_REPOSITORY)
    private readonly syncHistoryRepository: ISyncHistoryRepository,
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepository: IInstitutionRepository,
    private readonly configService: ConfigService,
    // ✅ 実際に使用する依存関係のみ
    private readonly fetchCreditCardTransactionsUseCase: FetchCreditCardTransactionsUseCase,
    private readonly fetchSecurityTransactionsUseCase: FetchSecurityTransactionsUseCase
  ) {}
}
```

**改善点**:

- **シンプル**: 必要な依存関係のみ
- **テスト容易性**: モック作成が簡単
- **明確性**: 意図が明確

#### ✅ 依存関係の見直しチェックリスト

1. **使用状況の確認**
   - `this.xxxRepository` で検索
   - 実際に使用されているか確認

2. **委譲の確認**
   - 子UseCaseに機能が委譲されていないか
   - 直接アクセスが必要か

3. **テストの簡素化**
   - 不要なモックを削除
   - テストが簡潔になるか

#### 参考

- **PR #285**: Geminiレビュー指摘（Issue #279）
- **削除した依存関係**: ICreditCardRepository, ISecuritiesAccountRepository
- **理由**: FetchXxxUseCaseに機能を委譲済み

---

### 4-13. Enum値とリテラル型の一貫性

#### 🟡 推奨: Enum値と使用箇所の型を統一する

Enum値と実際の使用箇所で異なる文字列リテラルを使用すると、変換関数が必要になり、コードが複雑になります。

❌ **悪い例**: Enum値と使用箇所の不一致

```typescript
// libs/types/src/institution.types.ts
export enum InstitutionType {
  BANK = 'bank',
  CREDIT_CARD = 'credit_card', // ❌ アンダースコア
  SECURITIES = 'securities',
}

// 実際の使用箇所
interface SyncTarget {
  institutionType: 'bank' | 'credit-card' | 'securities'; // ❌ ハイフン
}

// ❌ 変換関数が必要になる
function convertInstitutionType(type: InstitutionType): 'bank' | 'credit-card' | 'securities' {
  if (type === InstitutionType.CREDIT_CARD) {
    return 'credit-card';
  }
  return type as 'bank' | 'credit-card' | 'securities';
}
```

**問題点**:

- 変換関数が必要で複雑
- 型の不一致がバグの原因
- 保守性が低い

✅ **良い例**: Enum値と使用箇所を統一

```typescript
// libs/types/src/institution.types.ts
export enum InstitutionType {
  BANK = 'bank',
  CREDIT_CARD = 'credit-card', // ✅ ハイフンで統一
  SECURITIES = 'securities',
}

// 実際の使用箇所
interface SyncTarget {
  institutionType: InstitutionType; // ✅ 直接使用可能
}

// ✅ 変換関数は不要
const target: SyncTarget = {
  institutionType: institution.type, // そのまま使用
};
```

**改善点**:

- **シンプル**: 変換関数が不要
- **型安全**: 型の一貫性が保たれる
- **保守性**: 変更箇所が1箇所のみ

#### ✅ 統一のガイドライン

1. **命名規則の統一**
   - ケバブケース（`credit-card`）
   - スネークケース（`credit_card`）
   - キャメルケース（`creditCard`）

2. **プロジェクト全体で統一**
   - API仕様書
   - データベーススキーマ
   - フロントエンド・バックエンド

3. **既存コードとの整合性**
   - 既存の命名規則に従う
   - 一括変更が可能な場合は統一

#### 参考

- **PR #285**: Geminiレビュー指摘（Issue #279）
- **変更内容**: `'credit_card'` → `'credit-card'`
- **削除**: convertInstitutionType() 変換関数

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

### 7-1. パフォーマンス最適化（useMemoの活用）

**原則**: コンポーネントの再レンダリングごとに実行される計算処理は`useMemo`でメモ化する。

#### ❌ 悪い例: レンダリングごとに計算

```typescript
// ❌ 悪い例: レンダリングごとに配列を走査
export function TransactionClassificationPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  return (
    <div>
      <p>未分類: {transactions.filter((tx) => !tx.subcategoryId).length}</p>
      <p>
        低信頼度:{' '}
        {
          transactions.filter(
            (tx) =>
              tx.classificationConfidence !== undefined &&
              tx.classificationConfidence !== null &&
              tx.classificationConfidence < 0.7
          ).length
        }
      </p>
    </div>
  );
}
```

**問題点**:

- コンポーネントが再レンダリングされるたびに配列全体を走査
- 取引件数が多い場合、パフォーマンスのボトルネックになる
- 不要な計算が繰り返される

#### ✅ 良い例: useMemoでメモ化

```typescript
// ✅ 良い例: useMemoでメモ化
export function TransactionClassificationPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // 統計情報のメモ化
  const stats = useMemo(() => {
    return {
      unclassifiedCount: transactions.filter((tx) => !tx.subcategoryId).length,
      lowConfidenceCount: transactions.filter(
        (tx) =>
          tx.classificationConfidence !== undefined &&
          tx.classificationConfidence !== null &&
          tx.classificationConfidence < 0.7
      ).length,
    };
  }, [transactions]);

  return (
    <div>
      <p>未分類: {stats.unclassifiedCount}</p>
      <p>低信頼度: {stats.lowConfidenceCount}</p>
    </div>
  );
}
```

**利点**:

- `transactions`配列が変更された場合にのみ再計算
- 不要な計算を避け、パフォーマンスが向上
- コードの可読性も向上

### 7-2. イミュータブルな状態更新

**原則**: Reactの状態更新は常にイミュータブルに行う。配列やオブジェクトを直接変更しない。

#### ❌ 悪い例: ミュータブルな更新

```typescript
// ❌ 悪い例: 配列を直接変更
const handleBatchClassify = async () => {
  const result = await subcategoryApi.batchClassify({ transactions: requests });

  const updatedTransactions = [...transactions];
  for (const classificationResult of result.results) {
    if (classificationResult.success && classificationResult.subcategoryId) {
      const txIndex = updatedTransactions.findIndex(
        (tx) => tx.id === classificationResult.transactionId
      );
      if (txIndex !== -1) {
        // 配列の要素を直接変更（ミュータブル）
        updatedTransactions[txIndex] = {
          ...updatedTransactions[txIndex],
          subcategoryId: classificationResult.subcategoryId,
        };
      }
    }
  }
  setTransactions(updatedTransactions);
};
```

**問題点**:

- 配列の要素を直接変更している（ミュータブル）
- Reactのイミュータブルな状態更新の原則に反する
- 意図しない副作用やバグの原因となる可能性

#### ✅ 良い例: イミュータブルな更新（map使用）

```typescript
// ✅ 良い例: mapを使用したイミュータブルな更新
const handleBatchClassify = async () => {
  const result = await subcategoryApi.batchClassify({ transactions: requests });

  // 結果をMapに変換して効率的に検索
  const resultMap = new Map(
    result.results.filter((r) => r.success && r.subcategoryId).map((r) => [r.transactionId, r])
  );

  // mapを使用してイミュータブルに更新
  setTransactions((prev) =>
    prev.map((tx) => {
      const classificationResult = resultMap.get(tx.id);
      if (classificationResult) {
        return {
          ...tx,
          subcategoryId: classificationResult.subcategoryId,
          classificationConfidence: classificationResult.confidence ?? null,
          classificationReason: classificationResult.reason ?? null,
        };
      }
      return tx;
    })
  );
};
```

**利点**:

- 完全にイミュータブルな更新
- コードの可読性と予測可能性が向上
- Reactのベストプラクティスに準拠

### 7-3. 共通ロジックのユーティリティ化

**原則**: 複数のコンポーネントで使用されるロジックは、共通のユーティリティ関数として抽出する。

#### ❌ 悪い例: ロジックの重複

```typescript
// ❌ 悪い例: 各コンポーネントで同じロジックを実装
// ClassificationBadge.tsx
const getReasonText = (): string => {
  switch (reason) {
    case ClassificationReason.MERCHANT_MATCH:
      return merchantName ? `店舗マスタ一致: ${merchantName}` : '店舗マスタ一致';
    case ClassificationReason.KEYWORD_MATCH:
      return 'キーワード一致';
    // ...
  }
};

// TransactionDetailModal.tsx
<p>分類理由: {transaction.classificationReason}</p> // enumキーのまま表示
```

**問題点**:

- 同じロジックが複数箇所に存在（DRY原則違反）
- 修正時に複数箇所を更新する必要がある
- ユーザーフレンドリーでない表示（enumキーのまま）

#### ✅ 良い例: ユーティリティ関数の共通化

```typescript
// ✅ 良い例: 共通ユーティリティ関数を作成
// utils/classification.utils.ts
export function getClassificationReasonText(
  reason: ClassificationReason,
  merchantName?: string | null
): string {
  switch (reason) {
    case ClassificationReason.MERCHANT_MATCH:
      return merchantName ? `店舗マスタ一致: ${merchantName}` : '店舗マスタ一致';
    case ClassificationReason.KEYWORD_MATCH:
      return 'キーワード一致';
    case ClassificationReason.AMOUNT_INFERENCE:
      return '金額推測';
    case ClassificationReason.RECURRING_PATTERN:
      return '定期性判定';
    case ClassificationReason.DEFAULT:
      return 'デフォルト';
    default:
      return '不明';
  }
}

// ClassificationBadge.tsx
import { getClassificationReasonText } from '@/utils/classification.utils';

const reasonText = getClassificationReasonText(reason, merchantName);

// TransactionDetailModal.tsx
import { getClassificationReasonText } from '@/utils/classification.utils';

<p>
  分類理由:{' '}
  {getClassificationReasonText(
    transaction.classificationReason,
    transaction.merchantName
  )}
</p>
```

**利点**:

- DRY原則の遵守
- 一箇所で管理・修正が可能
- ユーザーフレンドリーな表示を統一

### 7-4. データ構造の最適化（Mapの活用）

**原則**: 頻繁に参照されるデータは、配列の`find`や`filter`ではなく、`Map`を使ったO(1)参照に最適化する。

#### ❌ 悪い例: O(n)の線形検索

```typescript
// ❌ 悪い例: 配列のfindでO(n)検索
interface SubcategoryStore {
  subcategories: Subcategory[];
  getSubcategoryById: (id: string) => Subcategory | undefined;
}

export const useSubcategoryStore = create<SubcategoryStore>((set, get) => ({
  subcategories: [],
  getSubcategoryById: (id: string) => {
    // O(n)の線形検索
    return get().subcategories.find((sub) => sub.id === id);
  },
}));

// コンポーネント内で各取引のレンダリング時に呼び出される
// 取引がT個、サブカテゴリがS個ある場合、計算量はO(T*S)
```

**問題点**:

- 各レンダリング時に配列全体を走査（O(n)）
- 取引数が多い場合、パフォーマンスのボトルネックになる
- 計算量がO(T\*S)となり、スケーラビリティが低い

#### ✅ 良い例: Mapを使ったO(1)参照

```typescript
// ✅ 良い例: Mapを使ったO(1)参照
interface SubcategoryStore {
  subcategories: Subcategory[];
  subcategoryMap: Map<string, Subcategory>; // IDをキーとするMap
  getSubcategoryById: (id: string) => Subcategory | undefined;
}

export const useSubcategoryStore = create<SubcategoryStore>((set, get) => ({
  subcategories: [],
  subcategoryMap: new Map<string, Subcategory>(),
  fetchSubcategories: async (categoryType?: CategoryType) => {
    const data = await subcategoryApi.getByCategory(categoryType);
    // IDをキーとするMapを作成（O(1)参照用）
    const map = new Map<string, Subcategory>();
    for (const subcategory of data) {
      map.set(subcategory.id, subcategory);
    }
    set({ subcategories: data, subcategoryMap: map });
  },
  getSubcategoryById: (id: string) => {
    // O(1)の参照
    return get().subcategoryMap.get(id);
  },
}));
```

**利点**:

- O(1)の参照により、パフォーマンスが大幅に改善
- 計算量がO(T)に削減（T: 取引数）
- スケーラビリティが向上

### 7-5. 階層構造構築の最適化

**原則**: 階層構造を構築する際は、親IDをキーとするMapを作成してからツリーを構築することで、計算量を削減する。

#### ❌ 悪い例: 再帰的なfilter呼び出し

```typescript
// ❌ 悪い例: 再帰的にfilterを呼び出す
const buildTree = (allSubcategories: Subcategory[]): Subcategory[] => {
  const rootCategories = allSubcategories.filter((sub) => sub.parentId === null);

  const buildChildren = (parentId: string | null): Subcategory[] => {
    // 毎回配列全体を走査（O(n)）
    const children = allSubcategories.filter((sub) => sub.parentId === parentId);
    return children.map((child) => ({
      ...child,
      children: buildChildren(child.id), // 再帰的にfilterを呼び出し
    }));
  };

  return rootCategories.map((root) => ({
    ...root,
    children: buildChildren(root.id),
  }));
};
```

**問題点**:

- 再帰的に`filter`を呼び出すため、計算量がO(n²)になる可能性
- サブカテゴリ数が多い場合に非効率

#### ✅ 良い例: Mapを使った効率的な構築

```typescript
// ✅ 良い例: 親IDをキーとするMapを作成
const buildTree = (allSubcategories: Subcategory[]): Subcategory[] => {
  // 親IDをキーとする子のMapを作成（O(n)）
  const childrenMap = new Map<string | null, Subcategory[]>();
  for (const sub of allSubcategories) {
    const parentId = sub.parentId;
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    childrenMap.get(parentId)!.push(sub);
  }

  // 親カテゴリ（parentIdがnull）を取得
  const rootCategories = childrenMap.get(null) || [];

  // 階層構造を構築（Mapを使用してO(1)参照）
  const buildChildren = (parentId: string | null): Subcategory[] => {
    const children = childrenMap.get(parentId) || [];
    return children.map((child) => ({
      ...child,
      children: buildChildren(child.id),
    }));
  };

  return rootCategories.map((root) => ({
    ...root,
    children: buildChildren(root.id),
  }));
};
```

**利点**:

- 計算量がO(n)に削減
- Mapを使ったO(1)参照により、パフォーマンスが向上
- サブカテゴリ数が多い場合でも効率的

### 7-6. ロジックの一元化（ストアへの集約）

**原則**: 複数のコンポーネントで使用されるロジックは、状態管理ストアに一元化する。

#### ❌ 悪い例: ロジックの重複

```typescript
// ❌ 悪い例: コンポーネント内とストア内の両方に階層構造構築ロジックが存在
// SubcategorySelector.tsx
const tree = useMemo(() => {
  const filtered = subcategories.filter(...);
  const buildChildren = (parentId: string | null) => {
    const children = filtered.filter((sub) => sub.parentId === parentId);
    // ...
  };
  // ...
}, [subcategories, categoryType, searchQuery]);

// subcategory.store.ts
buildTree: (categoryType?: CategoryType) => {
  const buildChildren = (parentId: string | null) => {
    const children = allSubcategories.filter((sub) => sub.parentId === parentId);
    // ...
  };
  // ...
}
```

**問題点**:

- ロジックが重複している
- 将来的な変更時に片方を修正し忘れる可能性
- 不整合の原因となる

#### ✅ 良い例: ストアに一元化

```typescript
// ✅ 良い例: ストアのbuildTreeを使用
// SubcategorySelector.tsx
const { buildTree } = useSubcategoryStore();

const tree = useMemo(() => {
  // ストアから階層構造を取得
  const fullTree = buildTree(categoryType);
  // 検索クエリでフィルタリング（必要に応じて）
  if (!searchQuery) {
    return fullTree;
  }
  // ...
}, [buildTree, categoryType, searchQuery]);
```

**利点**:

- ロジックの一元化により、保守性が向上
- 修正時に1箇所のみ更新すればよい
- 関心の分離が促進される

### 7-7. E2Eテストの信頼性向上

**原則**: E2Eテストでは、固定時間の待機（`waitForTimeout`）を避け、UIの状態変化を待つ適切な方法を使用する。

#### ❌ 悪い例: waitForTimeoutの使用

```typescript
// ❌ 悪い例: 固定時間での待機
test('フィルターが機能する', async ({ page }) => {
  await page.getByLabel('カテゴリ').selectOption('EXPENSE');
  await page.waitForTimeout(500); // 固定時間での待機
  // アサーション
});
```

**問題点**:

- テストの実行環境によって成功したり失敗したりする（flaky test）
- 実際のUI更新を待たずにアサーションを実行する可能性
- テストの信頼性が低い

#### ✅ 良い例: 適切な待機方法

```typescript
// ✅ 良い例: UIの状態変化を待つ
test('フィルターが機能する', async ({ page }) => {
  // ページが読み込まれるまで待機
  await page.waitForLoadState('networkidle');

  // フィルターを選択
  await page.getByLabel('カテゴリ').selectOption('EXPENSE');

  // フィルターが適用されることを確認（テーブルが表示されるか、メッセージが表示される）
  await expect(
    page.getByRole('table').or(page.getByText('該当する取引がありません'))
  ).toBeVisible();
});
```

**利点**:

- 実際のUI更新を待ってからアサーションを実行
- テストの信頼性が向上
- 環境に依存しない安定したテスト

#### ✅ 良い例: getByRoleを使用したセレクタ

```typescript
// ❌ 悪い例: idをgetByLabelで探す
const checkbox = page.getByLabel('unclassified-only'); // idはgetByLabelの対象ではない

// ✅ 良い例: ロールとアクセシブルネームで要素を特定
const checkbox = page.getByRole('checkbox', { name: '未分類のみ' });
```

**利点**:

- より堅牢で意図が明確なテスト
- アクセシビリティの観点からも適切

**参考**: PR #303 - Gemini Code Assistレビュー指摘

### 7-8. コールバック関数の型定義

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

## 11. シェルスクリプトのベストプラクティス（Issue #286から学習）

### 11-1. マジックナンバーの管理

#### 原則: 共通設定ファイルで一元管理

複数のスクリプトで使用される定数値は、共通設定ファイルで定義して再利用します。

**❌ 悪い例: マジックナンバーが分散**

```bash
# scripts/script1.sh
gh project item-list 1 --limit 9999  # マジックナンバー

# scripts/script2.sh
gh issue list --limit 9999  # 同じ値が複数箇所に

# scripts/script3.sh
gh pr list --limit 9999  # メンテナンスが煩雑
```

**問題点:**

- 値を変更する際に複数ファイルを修正する必要がある
- 修正漏れのリスクがある
- 設定の意図が不明確

**✅ 良い例: 共通設定ファイルで一元管理**

```bash
# scripts/github/workflow/config.sh
export GH_API_LIMIT=9999  # GitHub API limit設定

# scripts/script1.sh
source "${SCRIPT_DIR}/../workflow/config.sh"
gh project item-list 1 --limit "$GH_API_LIMIT"

# scripts/script2.sh
source "${SCRIPT_DIR}/../workflow/config.sh"
gh issue list --limit "$GH_API_LIMIT"
```

**改善点:**

- 設定変更が1箇所で完結
- 設定の意図がコメントで明確
- デフォルト値の設定も可能

**設定ファイルのベストプラクティス:**

```bash
#!/bin/bash

# GitHub Projects設定ファイル

# リポジトリ情報
export REPO_OWNER="kencom2400"
export REPO_NAME="account-book"

# GitHub API設定
export GH_API_LIMIT=9999  # gh project item-list および gh issue list のlimit値
export MIN_ISSUE_COUNT_FOR_COMPLETION=90  # Issue完了確認の最小閾値

# リトライ処理の設定
export MAX_RETRIES=5  # API反映待機のリトライ最大回数
export RETRY_INTERVAL=3  # リトライ間隔（秒）

# API Rate Limit対策
export API_RATE_LIMIT_WAIT=1  # API rate limit対策の基本待機時間（秒）

# プロジェクト情報
export PROJECT_NUMBER=1
export PROJECT_ID="PVT_kwHOANWYrs4BIOm-"
```

**スクリプトでの使用例:**

```bash
#!/bin/bash

# 設定ファイルの読み込み
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "${SCRIPT_DIR}/../workflow/config.sh" ]; then
  source "${SCRIPT_DIR}/../workflow/config.sh"
fi

# デフォルト値の設定（設定ファイルで定義されていない場合）
GH_API_LIMIT="${GH_API_LIMIT:-9999}"
MAX_RETRIES="${MAX_RETRIES:-5}"
RETRY_INTERVAL="${RETRY_INTERVAL:-3}"
API_RATE_LIMIT_WAIT="${API_RATE_LIMIT_WAIT:-1}"

# 使用例1: API Limit
gh project item-list "$PROJECT_NUMBER" --limit "$GH_API_LIMIT"

# 使用例2: リトライ処理
for ((i=1; i<=MAX_RETRIES; i++)); do
  ITEM_INFO=$(get_item_info)
  if [ -n "$ITEM_INFO" ]; then
    break
  fi
  if [ "$i" -lt "$MAX_RETRIES" ]; then
    sleep "$RETRY_INTERVAL"
  fi
done

# 使用例3: API Rate Limit対策
sleep "$API_RATE_LIMIT_WAIT"
```

**重要なポイント:**

- **すべての定数値を変数化**: 回数、時間、閾値などハードコードされた値を排除
- **デフォルト値の設定**: `${VAR:-default}` パターンで設定ファイル未定義時のフォールバック
- **意味のある変数名**: 用途が明確な名前を使用
- **コメントで説明**: 各変数の用途を明記

**参考:** Issue #286 / PR #288 - Geminiレビュー指摘より

---

### 11-2. コードの重複排除と関数化

#### 原則: 繰り返し処理は関数に切り出す

同じ処理が複数箇所で繰り返される場合は、関数に切り出してDRYにします。

**❌ 悪い例: コードの重複**

```bash
# 1回目: アイテム情報を取得
ITEM_INFO=$(gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --format json --limit "$GH_API_LIMIT" | \
  jq --arg num "$ISSUE_NUMBER" '.items[] | select(.content.number == ($num | tonumber)) | {id: .id, title: .title, status: .status}')

if [ -z "$ITEM_INFO" ]; then
  # Issueを追加
  gh project item-add "$PROJECT_NUMBER" --owner "$OWNER" --url "$ISSUE_URL"

  # 2回目: 同じ処理を繰り返す
  ITEM_INFO=$(gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --format json --limit "$GH_API_LIMIT" | \
    jq --arg num "$ISSUE_NUMBER" '.items[] | select(.content.number == ($num | tonumber)) | {id: .id, title: .title, status: .status}')
fi
```

**問題点:**

- 同じコマンドが2回記述されている
- メンテナンス性が低い
- 変更時に複数箇所を修正する必要がある

**✅ 良い例: 関数に切り出す**

```bash
# アイテム情報を取得する関数
get_item_info() {
  gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --format json --limit "$GH_API_LIMIT" | \
    jq --arg num "$ISSUE_NUMBER" '.items[] | select(.content.number == ($num | tonumber)) | {id: .id, title: .title, status: .status}'
}

# 使用例
ITEM_INFO=$(get_item_info)

if [ -z "$ITEM_INFO" ]; then
  # Issueを追加
  gh project item-add "$PROJECT_NUMBER" --owner "$OWNER" --url "$ISSUE_URL"

  # 関数を再利用
  ITEM_INFO=$(get_item_info)
fi
```

**改善点:**

- コードが簡潔になる
- 変更が1箇所で完結
- 可読性が向上

**参考:** Issue #286 / PR #288 - Geminiレビュー指摘より

---

### 11-3. 固定時間待機の回避（リトライ処理）

#### 原則: APIの反映待ちには固定時間ではなくリトライ処理を使用

外部APIの反映を待つ際、固定時間の`sleep`は不安定です。リトライ処理を使用します。

**❌ 悪い例: 固定時間待機**

```bash
# Issueをプロジェクトに追加
gh project item-add "$PROJECT_NUMBER" --owner "$OWNER" --url "$ISSUE_URL"

# 固定時間待機
sleep 3

# 再度取得
ITEM_INFO=$(get_item_info)
```

**問題点:**

- APIの反映が3秒以上かかる場合に失敗する
- 無駄な待機時間が発生する可能性
- 環境によって必要な時間が異なる

**✅ 良い例: リトライ処理**

```bash
# Issueをプロジェクトに追加
gh project item-add "$PROJECT_NUMBER" --owner "$OWNER" --url "$ISSUE_URL"

echo "✅ Issue #${ISSUE_NUMBER} をプロジェクトに追加しました"
echo "⏳ GitHub APIの反映を待機し、再度アイテム情報を取得します..."

# API反映を待つためリトライ処理を追加
for i in {1..5}; do
  ITEM_INFO=$(get_item_info)
  if [ -n "$ITEM_INFO" ]; then
    break
  fi
  if [ "$i" -lt 5 ]; then
    echo "  リトライ ($i/5)..."
    sleep 3
  fi
done

if [ -z "$ITEM_INFO" ]; then
  echo "❌ エラー: Issueの追加後もアイテム情報を取得できませんでした"
  exit 1
fi
```

**改善点:**

- 最大5回リトライ（最大15秒待機）
- 成功したら即座に次の処理に進む
- 環境の違いやAPIの遅延に対応できる
- 進捗状況をユーザーに通知

**リトライ処理のベストプラクティス:**

```bash
# 設定
MAX_RETRIES=5
RETRY_INTERVAL=3

# リトライループ
for ((i=1; i<=MAX_RETRIES; i++)); do
  RESULT=$(some_command)

  # 成功判定
  if [ -n "$RESULT" ]; then
    echo "✅ 成功"
    break
  fi

  # 最終試行でなければ待機
  if [ "$i" -lt $MAX_RETRIES ]; then
    echo "  リトライ ($i/$MAX_RETRIES)..."
    sleep $RETRY_INTERVAL
  fi
done

# 最終的な成功判定
if [ -z "$RESULT" ]; then
  echo "❌ エラー: $MAX_RETRIES 回のリトライ後も失敗しました"
  exit 1
fi
```

**参考:** Issue #286 / PR #288 - Geminiレビュー指摘より

---

## 12. まとめ

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

## 8. ログとコード品質のベストプラクティス（Geminiレビューから学習）

### 8-1. ログメッセージのガイドライン

#### 原則: ASCII文字のみを使用

**理由**:

- ログ解析システムで絵文字が文字化けする可能性
- パースエラーを引き起こす可能性
- 国際化（i18n）への対応

#### ❌ 避けるべきパターン

\`\`\`typescript
// ❌ 悪い例: 絵文字を使用
this.logger.warn('⚠️ 前回の同期がまだ実行中です。');
\`\`\`

#### ✅ 正しいパターン

\`\`\`typescript
// ✅ 良い例: ASCII文字のみ
this.logger.warn('[SKIP] 前回の同期がまだ実行中です。今回の実行をスキップします。');
\`\`\`

### 8-2. 非推奨メソッドの安全な廃止

#### 原則: null返却ではなくエラーをスロー

#### ❌ 避けるべきパターン

\`\`\`typescript
// ❌ 悪い例: nullを返す（型契約を破る）
return null as unknown as Result; // 型安全性を破る
\`\`\`

#### ✅ 正しいパターン

\`\`\`typescript
// ✅ 良い例: エラーをスローする
throw new Error('OldUseCase is deprecated. Please use NewUseCase.');
\`\`\`

### 8-3. ハードコード値の扱い（将来対応）

パフォーマンスチューニングや環境依存の値はハードコードせず、設定ファイル（`.env`）から読み込むよう検討します。

- Issue #28では基盤機能の確立を優先
- Phase 2/3で設定ファイル化を検討

### 8-4. ステータス変換ロジックの責務分離（将来対応）

ドメインロジックをControllerに含めず、Domainエンティティから直接ステータスを返すよう検討します。

- Issue #28では基盤機能の確立を優先
- Phase 2/3で設計改善を検討

---

## 9. Cron式の検証とバリデーション（Geminiレビューから学習）

### 9-1. 基本的なCron式のフィールド数

**NestJSの`@nestjs/schedule`では、6フィールドのcron式をサポート:**

```
秒 分 時 日 月 曜日
```

### 9-2. 正規表現によるバリデーション

#### ❌ 誤った正規表現（5フィールド）

```typescript
// ❌ 悪い例: 「分」フィールドが抜けている
/^(\*|([0-5]?\d)) (\*|([01]?\d|2[0-3])) (\*|([0-2]?\d|3[01])) (\*|([0]?\d|1[0-2])) (\*|([0-6]))$/;
```

#### ✅ 正しい正規表現（6フィールド）

```typescript
// ✅ 良い例: すべてのフィールドを検証
/^(\*|([0-5]?\d)) (\*|([0-5]?\d)) (\*|([01]?\d|2[0-3])) (\*|([0-2]?\d|3[01])) (\*|([0]?\d|1[0-2])) (\*|([0-6]))$/;
```

### 9-3. より堅牢なバリデーション

**基本的な正規表現の制限**:

- `*/5`、`1-10`、`1,5,10`などの高度なcron構文をサポートしていない
- フィールドの値の妥当性（例: 月の31日）を完全に検証できない

**推奨**:

- より堅牢な検証が必要な場合は、`cron-validator`や`cron-parser`などのライブラリの導入を検討
- ただし、Issue #28の基盤機能では基本的な正規表現で十分

### 9-4. エラーメッセージの改善

#### ❌ 汎用的すぎるメッセージ

```typescript
// ❌ 悪い例
@Matches(/^...$/,{ message: 'Invalid cron expression' })
```

#### ✅ 具体的なメッセージ

```typescript
// ✅ 良い例: フォーマットを明示
@Matches(/^...$/, {
  message:
    'Invalid cron expression. Expected format: "second minute hour day month weekday" (6 fields)',
})
```

### 9-5. Cron式の例

```typescript
// ✅ 正しい6フィールドcron式の例
'0 0 4 * * *'; // 毎日午前4時0分0秒
'0 30 9 * * 1-5'; // 平日の午前9時30分0秒
'*/10 * * * * *'; // 10秒ごと（高度な構文 - 正規表現では検証不可）
```

**参照**: Issue #28 Geminiレビュー（第4弾）

---

## 10. Application層における型の一貫性（Geminiレビューから学習）

### 10-1. インライン型定義の回避

#### 原則: 定義済み型を再利用

**理由**:

- 型の変更が1箇所で済む
- 追従漏れを防ぐ
- コードの可読性が向上

#### ❌ 避けるべきパターン

```typescript
// ❌ 悪い例: インライン型定義
private notifyErrors(result: {
  results: Array<{ success: boolean; errorMessage: string | null }>;
  summary: { failureCount: number };
}): void {
  // ...
}
```

#### ✅ 正しいパターン

```typescript
// ✅ 良い例: 定義済み型を使用
import { SyncAllTransactionsResult } from '../dto/sync-result.dto';

private notifyErrors(result: SyncAllTransactionsResult): void {
  // ...
}
```

### 10-2. 配列操作での型ガードの活用

#### 原則: filter+型ガードで型安全性を向上

#### ❌ 従来のパターン

```typescript
// ⚠️ 改善の余地: forループでpush
const targets: SyncTarget[] = [];
for (const inst of institutions) {
  if (inst !== null && inst.isConnected) {
    targets.push({
      /* ... */
    });
  }
}
return targets;
```

#### ✅ 型ガードを使用したパターン

```typescript
// ✅ 良い例: 型ガードで型安全性を確保
return institutions
  .filter((inst): inst is NonNullable<typeof inst> => inst !== null && inst.isConnected)
  .map((inst) => ({
    institutionId: inst.id,
    institutionName: inst.name,
    institutionType: inst.type as 'bank' | 'credit-card' | 'securities',
    lastSyncDate: inst.lastSyncedAt,
  }));
```

**改善点**:

- 型ガードによる明示的な型の絞り込み
- より宣言的で読みやすいコード
- TypeScriptの型推論が効きやすい

### 10-3. ステータスフィールドの明示的な管理

#### 原則: boolean推測ではなく、Enumステータスを使用

#### ❌ 避けるべきパターン

```typescript
// ❌ 悪い例: booleanから推測
interface SyncResult {
  success: boolean;
  // statusフィールドがない
}

// コントローラー層でステータスを推測
status: result.success ? SyncStatus.COMPLETED : SyncStatus.FAILED;
```

**問題点**:

- キャンセル、部分成功などの複雑な状態を表現できない
- ステータス判定ロジックがController層に漏れる
- 将来の拡張性が低い

#### ✅ 正しいパターン

```typescript
// ✅ 良い例: 明示的なstatusフィールド
interface SyncResult {
  status: SyncStatus; // pending/running/completed/failed/cancelled
  success: boolean; // 後方互換性のために残す
}

// コントローラー層ではstatusをそのまま使用
status: result.status;
```

**改善点**:

- ステータスがDomain層で管理される
- Controller層の責務が明確
- 将来的なステータス追加に柔軟

**参照**: Issue #28 Geminiレビュー（第4弾）

---

## 3-7. テキスト正規化の注意点

### 原則: 記号処理は後続処理への影響を考慮する

テキスト正規化（特に記号の処理）は、後続のキーワード抽出やマッチング処理に大きな影響を与えます。

#### ❌ 避けるべきパターン: 記号を削除する

```typescript
// ❌ 悪い例: 記号を単純に削除
static normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\sぁ-んァ-ヶー一-龯]/g, '') // 記号を削除
    .replace(/\s+/g, ' ')
    .trim();
}

// 問題が発生する例
normalize('スターバックス@コーヒー'); // => 'スターバックスコーヒー' （単語が結合してしまう）
extractKeywords('スターバックス@コーヒー'); // => ['スターバックスコーヒー'] （1つの単語として誤認識）
```

**問題点**:

- 記号を削除すると、前後の単語が結合してしまう
- キーワード抽出が正しく動作しない（スペース区切りに依存している場合）
- マッチング精度が低下する

#### ✅ 正しいパターン: 記号をスペースに置換する

```typescript
// ✅ 良い例: 記号をスペースに置換
static normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) =>
      String.fromCharCode(s.charCodeAt(0) - 0xfee0),
    )
    .replace(/[^\w\sぁ-んァ-ヶー一-龯]/g, ' ') // 記号をスペースに置換（単語の区切りを維持）
    .replace(/\s+/g, ' ') // 複数の空白を1つにまとめる
    .trim();
}

// 正しく動作する例
normalize('スターバックス@コーヒー'); // => 'スターバックス コーヒー' （単語が分離される）
extractKeywords('スターバックス@コーヒー'); // => ['スターバックス', 'コーヒー'] （正しく2つの単語に分割）
```

**改善点**:

- 記号をスペースに置換することで、単語の区切りを維持
- キーワード抽出が正しく動作
- マッチング精度が向上

### 補足: 正規化の目的と後続処理の関係

正規化は単独で完結するのではなく、後続の処理（キーワード抽出、マッチング等）との連携を考慮して設計する必要があります。

- **キーワード抽出**がスペース区切りに依存する場合 → 記号はスペースに置換
- **完全一致マッチング**を行う場合 → 記号は削除しても問題ない
- **日本語の形態素解析**を行う場合 → 記号の処理方法を形態素解析エンジンの仕様に合わせる

**参照**: Issue #290 Geminiレビュー（第3弾）

---

## 3-9. 将来のパフォーマンス最適化の検討事項

以下の項目は、現在のアーキテクチャでは大規模な変更となるため、将来的な最適化課題として記録します。

### KeywordMatcherService: キーワードマップの事前正規化

**現状**: `calculateMatchScore`メソッド内で毎回`TextNormalizer.normalize(keyword)`を呼び出している

**改善案**: コンストラクタで`keywordMap`を事前に正規化し、実行時には正規化済みのマップを使用する

**効果**: `match`メソッドの実行速度向上

**制約**: 現在のキーワードは日本語のみで、正規化しても変わらないため、効果は限定的

### SubcategoryClassifierService: サブカテゴリの全件取得を避ける

**現状**: キーワードマッチング前に`subcategoryRepository.findByCategory(mainCategory)`で全サブカテゴリを取得している

**改善案**:

1. `KeywordMatcherService.match`メソッドを修正し、`subcategoryId`のみを返すようにする
2. `SubcategoryClassifierService`側で、`findById()`で必要なサブカテゴリ1件のみを取得する

**効果**: 不要なDBアクセスを削減し、パフォーマンスを大幅に改善

**制約**:

- `KeywordMatcherService`と`SubcategoryClassifierService`のインターフェースが大きく変わる
- すでに書かれた全てのテストコードの修正が必要
- 将来的にキーワードをDBから取得する場合は、さらなる設計変更が必要

**判断**: Phase 2のスコープを超えるため、Phase 7（統合・最適化フェーズ）で再検討する

**参照**: Issue #290 Geminiレビュー（第3弾）

---

## 3-10. TypeORMマイグレーションのベストプラクティス

**原則**: マイグレーションではTypeORM APIを優先使用し、生SQLは最小限にする

### ❌ 避けるべきパターン（生SQL）

```typescript
// ❌ 生SQLでカラム追加
await queryRunner.query(`
  ALTER TABLE transactions
  ADD COLUMN subcategory_id VARCHAR(50) NULL
`);

// ❌ 生SQLでインデックス作成
await queryRunner.query(`
  CREATE INDEX IDX_transactions_subcategory_id ON transactions(subcategory_id)
`);

// ❌ 生SQLでインデックス削除
await queryRunner.query(`DROP INDEX IDX_transactions_merchant_id ON transactions`);
```

### ✅ 推奨パターン（TypeORM API）

```typescript
import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

// ✅ TypeORM APIでカラム追加
await queryRunner.addColumns('transactions', [
  new TableColumn({
    name: 'subcategory_id',
    type: 'varchar',
    length: '50',
    isNullable: true,
  }),
]);

// ✅ TypeORM APIでインデックス作成
await queryRunner.createIndex(
  'transactions',
  new TableIndex({
    name: 'IDX_transactions_subcategory_id',
    columnNames: ['subcategory_id'],
  })
);

// ✅ TypeORM APIでインデックス削除
await queryRunner.dropIndex('transactions', 'IDX_transactions_merchant_id');

// ✅ TypeORM APIでカラム削除
await queryRunner.dropColumns('transactions', ['subcategory_id']);
```

### メリット

1. **データベース非依存性**: MySQL/PostgreSQL等のDB差異を吸収
2. **可読性・保守性**: 宣言的で分かりやすい
3. **一貫性**: 他のTypeORM APIと使い方が統一
4. **型安全性**: TypeScriptの型チェックが有効

**学習元**: PR #301 Geminiレビュー指摘事項（Migration実装）

---

## 3-11. テストのアサーション具体性

**原則**: テストは具体的なパラメータまで検証する

### ❌ 弱いアサーション

```typescript
// ❌ 呼び出されたことしか検証していない
it('should search merchants by query string', async () => {
  const result = await repository.search('テスト');
  expect(ormRepository.find).toHaveBeenCalled();
});
```

### ✅ 強いアサーション

```typescript
import { Like } from 'typeorm';

// ✅ 呼び出しパラメータも検証
it('should search merchants by query string', async () => {
  const result = await repository.search('テスト');

  expect(ormRepository.find).toHaveBeenCalledWith({
    where: { name: Like('%テスト%') },
  });
});
```

### メリット

1. **実装の正確性**: 正しいクエリが発行されているか確認
2. **リグレッション防止**: パラメータ変更時にテストが失敗する
3. **ドキュメント性**: 期待される動作が明確

**学習元**: PR #301 Geminiレビュー指摘事項（Repository Test）

---

## 3-12. TypeORMシードデータの自動タイムスタンプ

**原則**: `@CreateDateColumn`/`@UpdateDateColumn`を使用している場合、手動設定不要

### ❌ 冗長なパターン

```typescript
// ❌ 手動で日付を設定（不要）
const entity = repository.create({
  ...data,
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

### ✅ 推奨パターン

```typescript
// ✅ TypeORMのデコレータに任せる
const entity = repository.create(data);
```

### Entity定義

```typescript
@Entity('subcategories')
export class SubcategoryOrmEntity {
  // ...

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date; // 自動設定される

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date; // 自動設定される
}
```

### メリット

1. **簡潔性**: コードがシンプルになる
2. **一貫性**: TypeORMの標準機能に統一
3. **保守性**: デコレータ変更時に修正箇所が減る

**学習元**: PR #301 Geminiレビュー指摘事項（Seed Runner）

---
