# クラス図

このドキュメントでは、イベントと収支の紐付け機能（FR-022）のクラス構造を記載しています。

## 目次

1. [Domain層クラス図](#domain層クラス図)
2. [Application層クラス図](#application層クラス図)
3. [Infrastructure層クラス図](#infrastructure層クラス図)
4. [Presentation層クラス図](#presentation層クラス図)

---

## Domain層クラス図

### Event & Transaction Entities

```mermaid
classDiagram
    class EventEntity {
        +string id
        +Date date
        +string title
        +string|null description
        +EventCategory category
        +string[] tags
        +Date createdAt
        +Date updatedAt
    }

    class TransactionEntity {
        +string id
        +Date date
        +number amount
        +CategoryEntity category
        +string institutionId
        +string accountId
        +string description
    }

    class EventCategory {
        <<enumeration>>
        EDUCATION
        PURCHASE
        TRAVEL
        MEDICAL
        LIFE_EVENT
        INVESTMENT
        OTHER
    }

    class IEventRepository {
        <<interface>>
        +findById(id) Promise~EventEntity|null~
        +getTransactionIdsByEventId(eventId) Promise~string[]~
    }

    class ITransactionRepository {
        <<interface>>
        +findById(id) Promise~TransactionEntity|null~
        +findByIds(ids) Promise~TransactionEntity[]~
        +findByDateRange(startDate, endDate) Promise~TransactionEntity[]~
    }

    EventEntity --> EventCategory
    EventEntity ..> IEventRepository
    TransactionEntity ..> ITransactionRepository
```

**クラス説明**:

#### EventEntity

- **責務**: イベントのドメインエンティティ
- **注意**: FR-021で既に実装済み

#### TransactionEntity

- **責務**: 取引のドメインエンティティ
- **注意**: 既存のTransactionモジュールで実装済み

---

## Application層クラス図

### Use Cases

```mermaid
classDiagram
    class SuggestRelatedTransactionsUseCase {
        -IEventRepository eventRepository
        -ITransactionRepository transactionRepository
        +execute(eventId) Promise~SuggestedTransaction[]~
        -calculateScore(transaction, event) number
        -filterByCategory(transactions, eventCategory) TransactionEntity[]
    }

    class GetEventFinancialSummaryUseCase {
        -IEventRepository eventRepository
        -ITransactionRepository transactionRepository
        +execute(eventId) Promise~EventFinancialSummary~
        -calculateSummary(transactions) FinancialSummary
    }

    class SuggestedTransaction {
        +TransactionDto transaction
        +number score
        +string[] reasons
    }

    class EventFinancialSummary {
        +EventResponseDto event
        +TransactionDto[] relatedTransactions
        +number totalIncome
        +number totalExpense
        +number netAmount
        +number transactionCount
    }

    class FinancialSummary {
        +number totalIncome
        +number totalExpense
        +number netAmount
        +number transactionCount
    }

    SuggestRelatedTransactionsUseCase --> IEventRepository
    SuggestRelatedTransactionsUseCase --> ITransactionRepository
    SuggestRelatedTransactionsUseCase --> SuggestedTransaction
    GetEventFinancialSummaryUseCase --> IEventRepository
    GetEventFinancialSummaryUseCase --> ITransactionRepository
    GetEventFinancialSummaryUseCase --> EventFinancialSummary
    GetEventFinancialSummaryUseCase --> FinancialSummary
```

**クラス説明**:

#### SuggestRelatedTransactionsUseCase

- **責務**: イベントに関連する取引を推奨するユースケース
- **依存**: `IEventRepository`, `ITransactionRepository`
- **入力**: `eventId: string`
- **出力**: `SuggestedTransaction[]`
- **処理**:
  1. イベント情報を取得
  2. イベント日付の前後7日間の取引を取得
  3. イベントカテゴリに応じたフィルタリング
  4. スコアリング（日付の近さ、金額の大きさ、カテゴリマッチ）
  5. 上位10件を返却

#### GetEventFinancialSummaryUseCase

- **責務**: イベント別収支サマリーを取得するユースケース
- **依存**: `IEventRepository`, `ITransactionRepository`
- **入力**: `eventId: string`
- **出力**: `EventFinancialSummary`
- **処理**:
  1. イベント情報を取得
  2. イベントに関連付けられた取引ID一覧を取得
  3. 取引エンティティを取得
  4. 収支を集計（総収入、総支出、純収支、取引件数）
  5. サマリーを構築して返却

#### SuggestedTransaction

- **責務**: 推奨取引のDTO
- **フィールド**:
  - `transaction`: 取引情報
  - `score`: 推奨スコア（0-100）
  - `reasons`: 推奨理由の配列

#### EventFinancialSummary

- **責務**: イベント別収支サマリーのDTO
- **フィールド**:
  - `event`: イベント情報
  - `relatedTransactions`: 関連取引一覧
  - `totalIncome`: 総収入
  - `totalExpense`: 総支出
  - `netAmount`: 純収支
  - `transactionCount`: 取引件数

---

## Infrastructure層クラス図

### Repository Implementations

```mermaid
classDiagram
    class EventOrmRepository {
        -DataSource dataSource
        -EventOrmEntityRepository ormRepository
        +findById(id) Promise~EventEntity|null~
        +getTransactionIdsByEventId(eventId) Promise~string[]~
    }

    class TransactionRepository {
        -DataSource dataSource
        -TransactionOrmEntityRepository ormRepository
        +findById(id) Promise~TransactionEntity|null~
        +findByIds(ids) Promise~TransactionEntity[]~
        +findByDateRange(startDate, endDate) Promise~TransactionEntity[]~
    }

    class EventOrmEntity {
        +string id
        +Date date
        +string title
        +string category
        +EventTransactionRelationOrmEntity[] transactionRelations
    }

    class TransactionOrmEntity {
        +string id
        +Date date
        +number amount
        +string categoryId
        +string description
    }

    class EventTransactionRelationOrmEntity {
        +string eventId
        +string transactionId
    }

    EventOrmRepository ..|> IEventRepository
    TransactionRepository ..|> ITransactionRepository
    EventOrmRepository --> EventOrmEntity
    TransactionRepository --> TransactionOrmEntity
    EventOrmEntity --> EventTransactionRelationOrmEntity
```

**クラス説明**:

#### EventOrmRepository

- **責務**: イベントリポジトリの実装（TypeORM）
- **注意**: FR-021で既に実装済み

#### TransactionRepository

- **責務**: 取引リポジトリの実装（TypeORM）
- **注意**: 既存のTransactionモジュールで実装済み

---

## Presentation層クラス図

### Controllers

```mermaid
classDiagram
    class EventController {
        -SuggestRelatedTransactionsUseCase suggestUseCase
        -GetEventFinancialSummaryUseCase summaryUseCase
        +suggestRelatedTransactions(eventId) Promise~SuggestedTransaction[]~
        +getFinancialSummary(eventId) Promise~EventFinancialSummary~
    }

    class SuggestTransactionsResponseDto {
        +SuggestedTransactionDto[] suggestions
    }

    class SuggestedTransactionDto {
        +TransactionDto transaction
        +number score
        +string[] reasons
    }

    class EventFinancialSummaryResponseDto {
        +EventResponseDto event
        +TransactionDto[] relatedTransactions
        +number totalIncome
        +number totalExpense
        +number netAmount
        +number transactionCount
    }

    class TransactionDto {
        +string id
        +string date
        +number amount
        +string categoryType
        +string categoryName
        +string description
    }

    class EventResponseDto {
        +string id
        +string date
        +string title
        +EventCategory category
        +string[] tags
    }

    EventController --> SuggestRelatedTransactionsUseCase
    EventController --> GetEventFinancialSummaryUseCase
    EventController --> SuggestTransactionsResponseDto
    EventController --> EventFinancialSummaryResponseDto
    SuggestTransactionsResponseDto --> SuggestedTransactionDto
    SuggestedTransactionDto --> TransactionDto
    EventFinancialSummaryResponseDto --> EventResponseDto
    EventFinancialSummaryResponseDto --> TransactionDto
```

**クラス説明**:

#### EventController

- **責務**: イベントAPIのコントローラー
- **エンドポイント**:
  - `GET /api/events/:id/suggest-transactions`: 関連取引の推奨取得
  - `GET /api/events/:id/financial-summary`: イベント別収支サマリー取得
- **注意**: FR-021で既に実装されている`EventController`に追加

#### SuggestTransactionsResponseDto

- **責務**: 推奨取引レスポンスのDTO
- **フィールド**:
  - `suggestions`: 推奨取引の配列

#### EventFinancialSummaryResponseDto

- **責務**: イベント別収支サマリーレスポンスのDTO
- **フィールド**: `EventFinancialSummary`と同じ

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

**注意**: Presentation層からDomain層への依存（`A -->|依存| C`）は、`EventResponseDto`が`EventCategory` enumを直接利用しているためです。これは実用的な判断ですが、厳密なOnion Architecture原則からは少し逸脱します。

### データフロー

```mermaid
sequenceDiagram
    participant C as EventController
    participant UC as SuggestRelatedTransactionsUseCase
    participant ER as EventRepository
    participant TR as TransactionRepository
    participant DTO as SuggestedTransactionDto

    C->>UC: execute(eventId)
    UC->>ER: findById(eventId)
    ER-->>UC: EventEntity
    UC->>TR: findByDateRange(startDate, endDate)
    TR-->>UC: TransactionEntity[]
    UC->>UC: calculateScore(transactions, event)
    UC->>UC: sortByScore()
    UC->>UC: slice(0, 10)
    UC-->>C: SuggestedTransaction[]
    C->>DTO: toDto(suggestions)
    DTO-->>C: SuggestedTransactionDto[]
    C-->>C: レスポンス構築
```

---

## 実装上の注意点

### 型安全性

- すべてのクラスとメソッドに適切な型定義を行う
- `any`型の使用を避ける
- Genericsを活用して型の再利用性を高める
- Enum型の比較は型安全に（`Object.entries()`使用時は明示的型キャスト）

### 依存性注入

- コンストラクタインジェクションを使用
- インターフェースに依存し、実装に依存しない
- NestJSのDIコンテナを活用

### スコアリングロジック

- スコアリングロジックはApplication層のUseCaseに実装
- スコアの計算式は明確に定義し、テスト可能にする
- 将来的に機械学習モデルを導入する場合も、インターフェースを抽象化して差し替え可能にする

### エラーハンドリング

- カスタム例外クラスを定義（`EventNotFoundException`等）
- 適切なエラーメッセージを提供
- エラーのロギング

### Onion Architecture原則

- Domain層のEntityは、Presentation層のDTO型に依存してはならない
- EntityからDTOへの変換は、Application層のUseCaseまたはPresentation層のマッパーで実施
- `toJSON()`メソッドでDTOを返すのは違反

---

## チェックリスト

クラス図作成時の確認事項：

### Domain層

- [x] すべてのEntityが定義されている
- [x] Repositoryインターフェースが定義されている
- [x] 既存のEntityを再利用している

### Application層

- [x] すべてのUseCaseが定義されている
- [x] DTOが適切に定義されている
- [x] スコアリングロジックが明確

### Infrastructure層

- [x] Repositoryの実装クラスが定義されている
- [x] 既存のRepositoryを再利用している

### Presentation層

- [x] すべてのControllerが定義されている
- [x] RequestDTO、ResponseDTOが定義されている
- [x] エンドポイントが明確
