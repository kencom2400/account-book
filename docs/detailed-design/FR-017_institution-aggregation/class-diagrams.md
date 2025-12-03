# クラス図

このドキュメントでは、金融機関別集計機能のクラス構造を記載しています。

## 目次

1. [Domain層クラス図](#domain層クラス図)
2. [Application層クラス図](#application層クラス図)
3. [Infrastructure層クラス図](#infrastructure層クラス図)
4. [Presentation層クラス図](#presentation層クラス図)

---

## Domain層クラス図

### Aggregation Module (FR-017)

```mermaid
classDiagram
    class TransactionEntity {
        +string id
        +Date date
        +number amount
        +CategoryType categoryType
        +string categoryId
        +string institutionId
        +string accountId
        +string description
        +Date createdAt
        +Date updatedAt
        +isIncome() boolean
        +isExpense() boolean
    }

    class InstitutionEntity {
        +string id
        +string name
        +InstitutionType type
        +AccountEntity[] accounts
        +boolean isConnected
        +Date|null lastSyncedAt
        +Date createdAt
        +Date updatedAt
    }

    class AccountEntity {
        +string id
        +string institutionId
        +string accountNumber
        +string accountName
        +number balance
        +string currency
    }

    class CategoryType {
        <<enumeration>>
        INCOME
        EXPENSE
        TRANSFER
        REPAYMENT
        INVESTMENT
    }

    class InstitutionType {
        <<enumeration>>
        BANK
        CREDIT_CARD
        SECURITIES
    }

    class InstitutionAggregationDomainService {
        +aggregateByInstitution(transactions, institutions) Map~string, InstitutionAggregationData~
        +aggregateByAccount(transactions, accounts) Map~string, AccountAggregationData~
        +calculateInstitutionBalance(income, expense) number
        +filterByInstitutionIds(transactions, institutionIds) TransactionEntity[]
    }

    class InstitutionAggregationData {
        +number totalIncome
        +number totalExpense
        +number periodBalance
        +number transactionCount
        +TransactionEntity[] transactions
    }

    class AccountAggregationData {
        +number income
        +number expense
        +number periodBalance
        +number transactionCount
        +TransactionEntity[] transactions
    }

    class ITransactionRepository {
        <<interface>>
        +findByDateRange(start, end) Promise~TransactionEntity[]~
        +findByInstitutionIdsAndDateRange(institutionIds, start, end) Promise~TransactionEntity[]~
    }

    class IInstitutionRepository {
        <<interface>>
        +findAll() Promise~InstitutionEntity[]~
        +findByIds(ids) Promise~InstitutionEntity[]~
    }

    TransactionEntity --> CategoryType
    TransactionEntity --> InstitutionEntity
    TransactionEntity --> AccountEntity
    InstitutionEntity --> InstitutionType
    InstitutionEntity --> AccountEntity
    InstitutionAggregationDomainService --> TransactionEntity
    InstitutionAggregationDomainService --> InstitutionEntity
    InstitutionAggregationDomainService --> AccountEntity
    InstitutionAggregationDomainService --> InstitutionAggregationData
    InstitutionAggregationDomainService --> AccountAggregationData
    ITransactionRepository ..> TransactionEntity
    IInstitutionRepository ..> InstitutionEntity
```

**クラス説明**:

#### TransactionEntity（既存）

- **責務**: 取引データのエンティティ
- **主要メソッド**:
  - `isIncome()`: 収入取引かどうかを判定
  - `isExpense()`: 支出取引かどうかを判定

#### InstitutionEntity（既存）

- **責務**: 金融機関情報のエンティティ
- **主要プロパティ**:
  - `accounts`: 配下の口座一覧

#### AccountEntity（既存）

- **責務**: 口座情報のエンティティ
- **主要プロパティ**:
  - `balance`: 現在の残高

#### InstitutionAggregationDomainService（新規作成）

- **責務**: 金融機関別集計のドメインロジック
- **主要メソッド**:
  - `aggregateByInstitution(transactions, institutions)`: 金融機関別に集計（キーは`institutionId`）
  - `aggregateByAccount(transactions, accounts)`: 口座別に集計（キーは`accountId`）
  - `calculateInstitutionBalance(income, expense)`: 収支差額を計算（income - expense）
  - `filterByInstitutionIds(transactions, institutionIds)`: 指定された金融機関IDの取引のみをフィルタリング

#### InstitutionAggregationData（Value Object）

- **責務**: 金融機関別の集計データを表現
- **不変性**: 値オブジェクトは不変（immutable）

#### AccountAggregationData（Value Object）

- **責務**: 口座別の集計データを表現
- **不変性**: 値オブジェクトは不変（immutable）

---

## Application層クラス図

### Use Cases

```mermaid
classDiagram
    class CalculateInstitutionSummaryUseCase {
        -ITransactionRepository transactionRepository
        -IInstitutionRepository institutionRepository
        -InstitutionAggregationDomainService domainService
        +execute(startDate, endDate, institutionIds) Promise~InstitutionSummaryResponseDto~
        -buildInstitutionSummary(institution, aggregationData, accounts) InstitutionSummaryDto
        -buildAccountSummary(account, aggregationData) AccountSummaryDto
        -toTransactionDto(entity TransactionEntity) TransactionDto
    }

    class InstitutionSummaryResponseDto {
        +InstitutionSummaryDto[] institutions
    }

    class InstitutionSummaryDto {
        +string institutionId
        +string institutionName
        +InstitutionType institutionType
        +Period period
        +AccountSummaryDto[] accounts
        +number totalIncome
        +number totalExpense
        +number periodBalance
        +number currentBalance
        +number transactionCount
        +TransactionDto[] transactions
    }

    class AccountSummaryDto {
        +string accountId
        +string accountName
        +number income
        +number expense
        +number periodBalance
        +number currentBalance
        +number transactionCount
    }

    class Period {
        +Date start
        +Date end
    }

    class TransactionDto {
        +string id
        +string date
        +number amount
        +string categoryType
        +string categoryId
        +string institutionId
        +string accountId
        +string description
    }

    CalculateInstitutionSummaryUseCase --> ITransactionRepository
    CalculateInstitutionSummaryUseCase --> IInstitutionRepository
    CalculateInstitutionSummaryUseCase --> InstitutionAggregationDomainService
    CalculateInstitutionSummaryUseCase --> InstitutionSummaryResponseDto
    InstitutionSummaryResponseDto --> InstitutionSummaryDto
    InstitutionSummaryDto --> AccountSummaryDto
    InstitutionSummaryDto --> Period
    InstitutionSummaryDto --> TransactionDto
    CalculateInstitutionSummaryUseCase --> TransactionDto
```

**クラス説明**:

#### CalculateInstitutionSummaryUseCase（新規作成）

- **責務**: 金融機関別集計のユースケース実装
- **依存**: `ITransactionRepository`, `IInstitutionRepository`, `InstitutionAggregationDomainService`
- **入力**: `startDate: Date`, `endDate: Date`, `institutionIds?: string[]`（未指定の場合は全機関）
- **出力**: `InstitutionSummaryResponseDto`
- **主要メソッド**:
  - `execute(startDate, endDate, institutionIds?)`: 金融機関別集計を実行
  - `buildInstitutionSummary(institution, aggregationData, accounts)`: 金融機関別サマリーを構築
  - `buildAccountSummary(account, aggregationData)`: 口座別サマリーを構築
  - `toTransactionDto(entity: TransactionEntity)`: `TransactionEntity`を`TransactionDto`に変換（Onion Architecture原則）

#### InstitutionSummaryResponseDto（新規作成）

- **責務**: 金融機関別集計のレスポンスDTO
- **型**: `interface`（レスポンスはinterface）

#### InstitutionSummaryDto（新規作成）

- **責務**: 金融機関別のサマリー情報
- **型**: `interface`
- **注意**: `TransactionEntity`ではなく`TransactionDto`を使用（Onion Architecture原則）

#### AccountSummaryDto（新規作成）

- **責務**: 口座別のサマリー情報
- **型**: `interface`

#### Period（新規作成）

- **責務**: 集計期間を表現
- **型**: `interface`

#### TransactionDto（新規作成）

- **責務**: 取引データのDTO（プレゼンテーション層用）
- **型**: `interface`
- **注意**: Domain層の`TransactionEntity`から変換して使用

---

## Infrastructure層クラス図

### Repository Implementations

```mermaid
classDiagram
    class TransactionRepository {
        -string dataDir
        +findByDateRange(start, end) Promise~TransactionEntity[]~
        +findByInstitutionIdsAndDateRange(institutionIds, start, end) Promise~TransactionEntity[]~
        -getMonthFileName(year, month) string
        -loadFromFile(filePath) Promise~TransactionEntity[]~
        -toEntity(json) TransactionEntity
    }

    class TransactionTypeOrmRepository {
        -Repository~TransactionEntity~ repository
        +findByDateRange(start, end) Promise~TransactionEntity[]~
        +findByInstitutionIdsAndDateRange(institutionIds, start, end) Promise~TransactionEntity[]~
    }

    class InstitutionRepository {
        -string dataDir
        +findAll() Promise~InstitutionEntity[]~
        +findByIds(ids) Promise~InstitutionEntity[]~
        -loadFromFile(filePath) Promise~InstitutionEntity[]~
        -toEntity(json) InstitutionEntity
    }

    class InstitutionTypeOrmRepository {
        -Repository~InstitutionEntity~ repository
        +findAll() Promise~InstitutionEntity[]~
        +findByIds(ids) Promise~InstitutionEntity[]~
    }

    class ITransactionRepository {
        <<interface>>
        +findByDateRange(start, end) Promise~TransactionEntity[]~
        +findByInstitutionIdsAndDateRange(institutionIds, start, end) Promise~TransactionEntity[]~
    }

    class IInstitutionRepository {
        <<interface>>
        +findAll() Promise~InstitutionEntity[]~
        +findByIds(ids) Promise~InstitutionEntity[]~
    }

    TransactionRepository ..|> ITransactionRepository
    TransactionTypeOrmRepository ..|> ITransactionRepository
    InstitutionRepository ..|> IInstitutionRepository
    InstitutionTypeOrmRepository ..|> IInstitutionRepository
```

**クラス説明**:

#### TransactionRepository（既存・拡張）

- **責務**: JSONファイルベースの取引リポジトリ実装
- **主要メソッド**:
  - `findByDateRange(start, end)`: 期間で取引を取得
  - `findByInstitutionIdsAndDateRange(institutionIds, start, end)`: 指定された金融機関IDと期間で取引を取得（新規追加）

#### TransactionTypeOrmRepository（既存・拡張）

- **責務**: TypeORMベースの取引リポジトリ実装
- **主要メソッド**:
  - `findByDateRange(start, end)`: 期間で取引を取得
  - `findByInstitutionIdsAndDateRange(institutionIds, start, end)`: 指定された金融機関IDと期間で取引を取得（新規追加）

#### InstitutionRepository（既存）

- **責務**: JSONファイルベースの金融機関リポジトリ実装
- **主要メソッド**:
  - `findAll()`: 全金融機関を取得
  - `findByIds(ids)`: 指定されたIDの金融機関を取得

#### InstitutionTypeOrmRepository（既存）

- **責務**: TypeORMベースの金融機関リポジトリ実装
- **主要メソッド**:
  - `findAll()`: 全金融機関を取得
  - `findByIds(ids)`: 指定されたIDの金融機関を取得

---

## Presentation層クラス図

### Controllers and DTOs

```mermaid
classDiagram
    class AggregationController {
        -CalculateInstitutionSummaryUseCase calculateInstitutionSummaryUseCase
        +getInstitutionSummary(query) Promise~InstitutionSummaryResponseDto~
    }

    class GetInstitutionSummaryDto {
        +Date startDate
        +Date endDate
        +string[] institutionIds
        +validate() boolean
    }

    class InstitutionSummaryResponseDto {
        +InstitutionSummaryDto[] institutions
    }

    class InstitutionSummaryDto {
        +string institutionId
        +string institutionName
        +InstitutionType institutionType
        +Period period
        +AccountSummaryDto[] accounts
        +number totalIncome
        +number totalExpense
        +number periodBalance
        +number currentBalance
        +number transactionCount
        +TransactionDto[] transactions
    }

    class AccountSummaryDto {
        +string accountId
        +string accountName
        +number income
        +number expense
        +number periodBalance
        +number currentBalance
        +number transactionCount
    }

    class Period {
        +Date start
        +Date end
    }

    class TransactionDto {
        +string id
        +string date
        +number amount
        +string categoryType
        +string categoryId
        +string institutionId
        +string accountId
        +string description
    }

    AggregationController --> CalculateInstitutionSummaryUseCase
    AggregationController --> GetInstitutionSummaryDto
    AggregationController --> InstitutionSummaryResponseDto
    InstitutionSummaryResponseDto --> InstitutionSummaryDto
    InstitutionSummaryDto --> AccountSummaryDto
    InstitutionSummaryDto --> Period
    InstitutionSummaryDto --> TransactionDto
```

**クラス説明**:

#### AggregationController（既存・拡張）

- **責務**: 集計機能のREST APIエンドポイント
- **主要メソッド**:
  - `getInstitutionSummary(query)`: 金融機関別集計情報を取得

#### GetInstitutionSummaryDto（新規作成）

- **責務**: 金融機関別集計のリクエストDTO
- **型**: `class`（リクエストはclass）
- **バリデーション**: 開始日・終了日の妥当性チェック

#### InstitutionSummaryResponseDto（新規作成）

- **責務**: 金融機関別集計のレスポンスDTO
- **型**: `interface`（レスポンスはinterface）

---

## チェックリスト

クラス図作成時の確認事項：

### 必須項目

- [x] Domain層のクラス図が記載されている
- [x] Application層のクラス図が記載されている
- [x] Infrastructure層のクラス図が記載されている
- [x] Presentation層のクラス図が記載されている
- [x] 各クラスの責務が説明されている
- [x] 主要メソッドが記載されている
- [x] 依存関係が明確に示されている

### 推奨項目

- [x] Value Objectが明示されている
- [x] Repository Interfaceが明示されている
- [x] DTOの型（class/interface）が明確

### 注意事項

- [x] Domain層のエンティティは、Presentation層のDTO型に依存していない
- [x] 依存関係の方向が正しい（外→内）
- [x] レスポンスDTOは`interface`で定義されている
- [x] リクエストDTOは`class`で定義されている
