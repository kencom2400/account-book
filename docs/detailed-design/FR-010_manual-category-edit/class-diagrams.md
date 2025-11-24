# クラス図

このドキュメントでは、FR-010（費目の手動修正機能）のクラス構造を記載しています。

## 目次

1. [Domain層クラス図](#domain層クラス図)
2. [Application層クラス図](#application層クラス図)
3. [Infrastructure層クラス図](#infrastructure層クラス図)
4. [Presentation層クラス図](#presentation層クラス図)
5. [Frontend コンポーネント図](#frontendコンポーネント図)

---

## Domain層クラス図

### Transaction Module

```mermaid
classDiagram
    class TransactionEntity {
        +string id
        +Date date
        +number amount
        +Category category
        +string description
        +string institutionId
        +string accountId
        +TransactionStatus status
        +boolean isReconciled
        +string relatedTransactionId
        +Date createdAt
        +Date updatedAt
        +updateCategory(newCategory) TransactionEntity
        +toJSON() TransactionJSONResponse
    }

    class TransactionCategoryChangeHistoryEntity {
        +string id
        +string transactionId
        +Category oldCategory
        +Category newCategory
        +Date changedAt
        +string changedBy
        +getChangeDescription() string
        +isCategoryTypeChanged() boolean
    }

    class Category {
        <<ValueObject>>
        +string id
        +string name
        +CategoryType type
    }

    class CategoryType {
        <<enumeration>>
        INCOME
        EXPENSE
        TRANSFER
        REPAYMENT
        INVESTMENT
    }

    class TransactionStatus {
        <<enumeration>>
        PENDING
        COMPLETED
        FAILED
        CANCELLED
    }

    class ITransactionRepository {
        <<interface>>
        +findById(id) Promise~TransactionEntity|null~
        +findAll() Promise~TransactionEntity[]~
        +create(transaction) Promise~TransactionEntity~
        +update(transaction) Promise~TransactionEntity~
    }

    class ITransactionCategoryChangeHistoryRepository {
        <<interface>>
        +findByTransactionId(transactionId) Promise~TransactionCategoryChangeHistoryEntity[]~
        +create(history) Promise~TransactionCategoryChangeHistoryEntity~
    }

    TransactionEntity --> Category
    TransactionEntity --> TransactionStatus
    TransactionCategoryChangeHistoryEntity --> Category
    Category --> CategoryType
```

**クラス説明**:

#### TransactionEntity

- **責務**: 取引データの管理、カテゴリ更新ロジック
- **主要メソッド**:
  - `updateCategory(newCategory)`: カテゴリを更新して新しいインスタンスを返す
  - `toJSON()`: JSON形式への変換
- **不変性**: Entityは基本的に不変で、更新時は新しいインスタンスを生成

#### TransactionCategoryChangeHistoryEntity

- **責務**: カテゴリ変更履歴の記録と管理
- **主要メソッド**:
  - `getChangeDescription()`: 変更内容の人間が読みやすい説明を返す
  - `isCategoryTypeChanged()`: カテゴリタイプが変更されたかを判定
- **不変性**: すべてのプロパティが`readonly`で不変

#### Category

- **責務**: カテゴリ情報を表現する値オブジェクト
- **不変性**: 値オブジェクトは不変（immutable）
- **構成**: ID、名前、タイプの3つの属性

#### CategoryType

- **責務**: カテゴリの種別を表すEnum
- **値**:
  - `INCOME`: 収入
  - `EXPENSE`: 支出
  - `TRANSFER`: 振替
  - `REPAYMENT`: 返済
  - `INVESTMENT`: 投資

---

## Application層クラス図

### Use Cases

```mermaid
classDiagram
    class UpdateTransactionCategoryUseCase {
        -DataSource dataSource
        -ITransactionRepository transactionRepository
        -ITransactionCategoryChangeHistoryRepository historyRepository
        +execute(dto) Promise~TransactionEntity~
    }

    class UpdateTransactionCategoryDto {
        +string transactionId
        +CategoryDto category
    }

    class CategoryDto {
        +string id
        +string name
        +CategoryType type
    }

    UpdateTransactionCategoryUseCase --> ITransactionRepository
    UpdateTransactionCategoryUseCase --> ITransactionCategoryChangeHistoryRepository
    UpdateTransactionCategoryUseCase --> UpdateTransactionCategoryDto
    UpdateTransactionCategoryDto --> CategoryDto
```

**クラス説明**:

#### UpdateTransactionCategoryUseCase

- **責務**: カテゴリ更新のユースケース実装、トランザクション管理
- **依存**:
  - `ITransactionRepository`: 取引データへのアクセス
  - `ITransactionCategoryChangeHistoryRepository`: 変更履歴の記録
  - `DataSource`: データベーストランザクション管理
- **入力**: `UpdateTransactionCategoryDto`
- **出力**: `Promise<TransactionEntity>`

**処理フロー**:

1. トランザクション外で取引の存在確認
2. ドメインエンティティでカテゴリ更新
3. データベーストランザクション開始
4. 変更履歴を記録
5. 取引を更新
6. トランザクションコミット

#### UpdateTransactionCategoryDto

- **責務**: リクエストデータの受け取り
- **バリデーション**: Presentation層で実施

---

## Infrastructure層クラス図

### Repository Implementations

```mermaid
classDiagram
    class TransactionTypeOrmRepository {
        -Repository transactionRepo
        +findById(id) Promise~TransactionEntity|null~
        +findAll() Promise~TransactionEntity[]~
        +create(transaction) Promise~TransactionEntity~
        +update(transaction) Promise~TransactionEntity~
        -toDomain(orm) TransactionEntity
        -toOrm(entity) TransactionOrmEntity
    }

    class TransactionCategoryChangeHistoryRepository {
        -Repository historyRepo
        +findByTransactionId(transactionId) Promise~TransactionCategoryChangeHistoryEntity[]~
        +create(history) Promise~TransactionCategoryChangeHistoryEntity~
        -toDomain(orm) TransactionCategoryChangeHistoryEntity
        -toOrm(entity) TransactionCategoryChangeHistoryOrmEntity
    }

    class TransactionOrmEntity {
        +string id
        +Date date
        +number amount
        +string categoryId
        +string categoryName
        +CategoryType categoryType
        +string description
        +string institutionId
        +string accountId
        +TransactionStatus status
        +boolean isReconciled
        +string relatedTransactionId
        +Date createdAt
        +Date updatedAt
    }

    class TransactionCategoryChangeHistoryOrmEntity {
        +string id
        +string transactionId
        +string oldCategoryId
        +string oldCategoryName
        +CategoryType oldCategoryType
        +string newCategoryId
        +string newCategoryName
        +CategoryType newCategoryType
        +Date changedAt
        +string changedBy
    }

    TransactionTypeOrmRepository ..|> ITransactionRepository
    TransactionCategoryChangeHistoryRepository ..|> ITransactionCategoryChangeHistoryRepository
    TransactionTypeOrmRepository --> TransactionOrmEntity
    TransactionCategoryChangeHistoryRepository --> TransactionCategoryChangeHistoryOrmEntity
```

**クラス説明**:

#### TransactionTypeOrmRepository

- **責務**: 取引データのデータベース永続化
- **永続化方法**: TypeORM（MySQL）
- **マッピング**: ドメインエンティティとORMエンティティの相互変換

#### TransactionCategoryChangeHistoryRepository

- **責務**: カテゴリ変更履歴のデータベース永続化
- **永続化方法**: TypeORM（MySQL）
- **インデックス**: transactionId、transactionId+changedAt複合インデックス

#### TransactionOrmEntity

- **責務**: 取引データのORMマッピング
- **特徴**: カテゴリはフラット化して保存（categoryId, categoryName, categoryType）

#### TransactionCategoryChangeHistoryOrmEntity

- **責務**: カテゴリ変更履歴のORMマッピング
- **特徴**: 変更前後のカテゴリをフラット化して保存
- **インデックス**: `@Index(['transactionId', 'changedAt'])`

---

## Presentation層クラス図

### Controllers

```mermaid
classDiagram
    class TransactionController {
        -UpdateTransactionCategoryUseCase updateCategoryUseCase
        +updateCategory(id, dto) Promise~Response~
    }

    class UpdateTransactionCategoryRequestDto {
        <<class>>
        +CategoryRequestDto category
        +validate() boolean
    }

    class CategoryRequestDto {
        <<class>>
        +string id
        +string name
        +CategoryType type
    }

    class TransactionResponseDto {
        <<interface>>
        +string id
        +string date
        +number amount
        +CategoryResponseDto category
        +string description
        +string institutionId
        +string accountId
        +string status
        +boolean isReconciled
    }

    class CategoryResponseDto {
        <<interface>>
        +string id
        +string name
        +CategoryType type
    }

    TransactionController --> UpdateTransactionCategoryUseCase
    TransactionController --> UpdateTransactionCategoryRequestDto
    TransactionController --> TransactionResponseDto
    UpdateTransactionCategoryRequestDto --> CategoryRequestDto
    TransactionResponseDto --> CategoryResponseDto
```

**クラス説明**:

#### TransactionController

- **責務**: HTTPリクエスト/レスポンスの処理
- **エンドポイント**:
  - `PATCH /api/transactions/:id/category`: カテゴリ更新

#### UpdateTransactionCategoryRequestDto

- **責務**: リクエストデータの受け取りとバリデーション
- **バリデーション**:
  - `category`は必須
  - `category.id`は文字列で必須
  - `category.name`は文字列で必須
  - `category.type`はCategoryType enumで必須

#### TransactionResponseDto

- **責務**: レスポンスデータの構築
- **変換**: ドメインエンティティから変換（`toJSON()`メソッド使用）

---

## Frontend コンポーネント図

### React Components

```mermaid
classDiagram
    class TransactionList {
        +TransactionListProps props
        +categories: Category[]
        +editingId: string | null
        +updating: string | null
        +error: string | null
        +useEffect() void
        +getCategoryTypeColor(type) string
        +formatAmount(amount, type) string
        +handleCategoryClick(transactionId) void
        +handleCategoryChange(transactionId, newCategoryId) Promise~void~
        +handleCancelEdit() void
        +render() JSX
    }

    class TransactionListProps {
        <<interface>>
        +Transaction[] transactions
        +onTransactionUpdate?: (transaction) => void
    }

    class Transaction {
        <<interface>>
        +string id
        +string date
        +number amount
        +Category category
        +string description
    }

    class Category {
        <<interface>>
        +string id
        +string name
        +CategoryType type
    }

    TransactionList --> TransactionListProps
    TransactionListProps --> Transaction
    Transaction --> Category
```

**コンポーネント説明**:

#### TransactionList

- **責務**: 取引一覧表示とカテゴリ編集UI
- **State**:
  - `categories`: カテゴリ一覧
  - `editingId`: 編集中の取引ID
  - `updating`: 更新中の取引ID
  - `error`: エラーメッセージ
- **API連携**:
  - `getCategories()`: カテゴリ一覧取得
  - `updateTransactionCategory()`: カテゴリ更新
- **Props**:
  - `transactions`: 表示する取引データ配列
  - `onTransactionUpdate`: カテゴリ更新時のコールバック

**UI機能**:

- カテゴリクリックで編集モードに切り替え
- セレクトボックスで新しいカテゴリを選択
- 更新中は無効化
- エラー時は赤いボーダーで表示

---

## クラス間の関係性

### 依存関係の概要

```mermaid
graph TD
    A[Presentation Layer] -->|依存| B[Application Layer]
    B -->|依存| C[Domain Layer]
    A -->|依存| C
    D[Infrastructure Layer] -->|実装| C

    style A fill:#e1f5ff
    style B fill:#fff4e1
    style C fill:#ffe1f5
    style D fill:#e1ffe1
```

### データフロー

```mermaid
sequenceDiagram
    participant C as Controller
    participant U as UseCase
    participant R as Repository
    participant E as Entity

    C->>U: execute(dto)
    U->>R: findById(id)
    R->>E: create from ORM
    E-->>R: TransactionEntity
    R-->>U: TransactionEntity
    U->>E: updateCategory(newCategory)
    E-->>U: updated TransactionEntity
    Note over U: DBトランザクション開始
    U->>R: create history
    U->>R: update transaction
    Note over U: DBトランザクションコミット
    U-->>C: updated TransactionEntity
    C-->>C: toJSON()
```

---

## 実装上の注意点

### 型安全性

- すべてのクラスとメソッドに適切な型定義を行う
- DTOはclassで定義（バリデーションデコレータ使用のため）
- レスポンスDTOはinterfaceで定義（プロパティ初期化不要）
- Genericsを活用して型の再利用性を高める

### 依存性注入

- コンストラクタインジェクションを使用
- インターフェースに依存し、実装に依存しない
- NestJSのDIコンテナを活用
- トークンベースのDI（`@Inject(TRANSACTION_REPOSITORY)`）

### イミュータビリティ

- Domain EntityのHistoryは完全に不変（すべてのプロパティが`readonly`）
- TransactionEntityの更新は新しいインスタンスを返す
- Value Object（Category）は不変とする

### エラーハンドリング

- カスタム例外クラスを使用（`NotFoundException`）
- 適切なHTTPステータスコードを返す
- エラーのロギング（`Logger`使用）
- トランザクション内のエラーは自動的にロールバック

### トランザクション管理

- 複数のデータベース操作は`DataSource.transaction`を使用
- トランザクション外で可能な検証は先に実行（パフォーマンス最適化）
- `entityManager`を経由してリポジトリにアクセス

---

## チェックリスト

クラス図作成時の確認事項：

### Domain層

- [x] すべてのEntityが定義されている
- [x] Value Objectが適切に定義されている
- [x] Repositoryインターフェースが定義されている
- [x] ビジネスロジックがEntityに配置されている

### Application層

- [x] すべてのUseCaseが定義されている
- [x] DTOが適切に定義されている
- [x] トランザクション管理の責務が明確

### Infrastructure層

- [x] Repositoryの実装クラスが定義されている
- [x] ORMエンティティが定義されている
- [x] ドメインエンティティとORMエンティティのマッピングが明確

### Presentation層

- [x] すべてのControllerが定義されている
- [x] RequestDTO、ResponseDTOが定義されている
- [x] エンドポイントが明確

### Frontend

- [x] ページコンポーネントが定義されている
- [x] Props、Stateが明確
- [x] API連携が明確

---

## Mermaid記法のヒント

### クラス定義

```mermaid
classDiagram
    class ClassName {
        +public属性
        -private属性
        #protected属性
        +publicMethod() ReturnType
        -privateMethod() ReturnType
    }
```

### 関係性

- `-->`: 依存（Dependency）
- `--|>`: 継承（Inheritance）
- `..|>`: 実装（Implementation）
- `--*`: コンポジション（Composition）
- `--o`: 集約（Aggregation）

### ジェネリクス

```mermaid
classDiagram
    class Repository~T~ {
        +findById(id) Promise~T|null~
        +findAll() Promise~T[]~
    }
```
