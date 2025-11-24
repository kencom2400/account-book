# クラス図

このドキュメントでは、詳細費目分類機能のクラス構造を記載しています。

## 目次

1. [Domain層クラス図](#domain層クラス図)
2. [Application層クラス図](#application層クラス図)
3. [Infrastructure層クラス図](#infrastructure層クラス図)
4. [Presentation層クラス図](#presentation層クラス図)
5. [Frontend コンポーネント図](#frontendコンポーネント図)

---

## Domain層クラス図

### Subcategory Entity & Value Objects

```mermaid
classDiagram
    class Subcategory {
        +string id
        +CategoryType categoryType
        +string name
        +string|null parentId
        +number displayOrder
        +string|null icon
        +string|null color
        +boolean isDefault
        +boolean isActive
        +Date createdAt
        +Date updatedAt
        +isIncome() boolean
        +isExpense() boolean
        +isTransfer() boolean
        +isRepayment() boolean
        +isInvestment() boolean
        +hasParent() boolean
        +getParent() Subcategory|null
        +getChildren() Subcategory[]
        +toJSON() SubcategoryJSONResponse
    }

    class Merchant {
        +string id
        +string name
        +string[] aliases
        +string defaultSubcategoryId
        +number confidence
        +Date createdAt
        +Date updatedAt
        +matchesDescription(description) boolean
        +getDefaultSubcategory() string
        +getConfidence() number
        +toJSON() MerchantJSONResponse
    }

    class ClassificationConfidence {
        <<ValueObject>>
        -number value
        +getValue() number
        +isHigh() boolean
        +isMedium() boolean
        +isLow() boolean
        +shouldAutoConfirm() boolean
        +shouldRecommendReview() boolean
        +toString() string
        +equals(other) boolean
    }

    class CategoryType {
        <<enumeration>>
        INCOME
        EXPENSE
        TRANSFER
        REPAYMENT
        INVESTMENT
    }

    class ClassificationReason {
        <<enumeration>>
        MERCHANT_MATCH
        KEYWORD_MATCH
        AMOUNT_INFERENCE
        RECURRING_PATTERN
        DEFAULT
    }

    class SubcategoryClassification {
        <<ValueObject>>
        +string subcategoryId
        +ClassificationConfidence confidence
        +ClassificationReason reason
        +getSubcategoryId() string
        +getConfidence() ClassificationConfidence
        +getReason() ClassificationReason
        +isReliable() boolean
    }

    Subcategory --> CategoryType
    Merchant --> Subcategory : default subcategory
    SubcategoryClassification --> ClassificationConfidence
    SubcategoryClassification --> ClassificationReason
```

### Domain Services

```mermaid
classDiagram
    class SubcategoryClassifierService {
        <<DomainService>>
        -IMerchantRepository merchantRepository
        -ISubcategoryRepository subcategoryRepository
        +classify(transaction, mainCategory) SubcategoryClassification
        -identifyMerchant(description) Merchant|null
        -matchKeywords(description, category) Subcategory|null
        -inferFromAmount(amount, category) Subcategory|null
        -inferFromRecurring(transaction) Subcategory|null
        -getDefaultSubcategory(category) Subcategory
    }

    class KeywordMatcher {
        <<DomainService>>
        -Map~string, string[]~ keywordMap
        +match(text, category) Subcategory|null
        +extractKeywords(text) string[]
        +calculateMatchScore(keywords, subcategory) number
    }

    class MerchantMatcher {
        <<DomainService>>
        -IMerchantRepository merchantRepository
        +match(description) Merchant|null
        +findByName(name) Merchant|null
        +findByAlias(alias) Merchant|null
        -normalizeText(text) string
    }

    SubcategoryClassifierService --> KeywordMatcher
    SubcategoryClassifierService --> MerchantMatcher
```

### Repository Interfaces

```mermaid
classDiagram
    class ISubcategoryRepository {
        <<interface>>
        +findById(id) Promise~Subcategory|null~
        +findAll() Promise~Subcategory[]~
        +findByCategory(categoryType) Promise~Subcategory[]~
        +findByParentId(parentId) Promise~Subcategory[]~
        +findDefault(categoryType) Promise~Subcategory~
        +save(subcategory) Promise~Subcategory~
        +update(subcategory) Promise~Subcategory~
        +delete(id) Promise~void~
    }

    class IMerchantRepository {
        <<interface>>
        +findById(id) Promise~Merchant|null~
        +findAll() Promise~Merchant[]~
        +findByName(name) Promise~Merchant|null~
        +findByAlias(alias) Promise~Merchant|null~
        +search(query) Promise~Merchant[]~
        +save(merchant) Promise~Merchant~
        +update(merchant) Promise~Merchant~
        +delete(id) Promise~void~
    }

    ISubcategoryRepository ..> Subcategory
    IMerchantRepository ..> Merchant
```

---

## Application層クラス図

### Use Cases

```mermaid
classDiagram
    class ClassifySubcategoryUseCase {
        -SubcategoryClassifierService classifierService
        -ISubcategoryRepository subcategoryRepository
        -IMerchantRepository merchantRepository
        +execute(request) Promise~ClassificationResult~
        -validateRequest(request) void
        -createResult(classification) ClassificationResult
    }

    class GetSubcategoriesUseCase {
        -ISubcategoryRepository subcategoryRepository
        +execute() Promise~SubcategoryListResult~
        -groupByCategory(subcategories) Map
        -sortByDisplayOrder(subcategories) Subcategory[]
    }

    class GetSubcategoriesByCategoryUseCase {
        -ISubcategoryRepository subcategoryRepository
        +execute(categoryType) Promise~SubcategoryListResult~
        -validateCategory(categoryType) void
        -buildHierarchy(subcategories) SubcategoryNode[]
    }

    class ClassificationRequest {
        +string transactionId
        +string description
        +number amount
        +CategoryType mainCategory
        +Date transactionDate
    }

    class ClassificationResult {
        +boolean success
        +SubcategoryClassification classification
        +Subcategory subcategory
        +string|null errorMessage
    }

    class SubcategoryListResult {
        +boolean success
        +Subcategory[] subcategories
        +number total
        +string|null errorMessage
    }

    ClassifySubcategoryUseCase ..> ClassificationRequest
    ClassifySubcategoryUseCase ..> ClassificationResult
    GetSubcategoriesUseCase ..> SubcategoryListResult
    GetSubcategoriesByCategoryUseCase ..> SubcategoryListResult
```

---

## Infrastructure層クラス図

### TypeORM Entities

```mermaid
classDiagram
    class SubcategoryOrmEntity {
        +string id
        +string categoryType
        +string name
        +string|null parentId
        +number displayOrder
        +string|null icon
        +string|null color
        +boolean isDefault
        +boolean isActive
        +Date createdAt
        +Date updatedAt
        +SubcategoryOrmEntity|null parent
        +SubcategoryOrmEntity[] children
        +TransactionOrmEntity[] transactions
        +MerchantOrmEntity[] merchants
        +toDomain() Subcategory
    }

    class MerchantOrmEntity {
        +string id
        +string name
        +string[] aliases
        +string defaultSubcategoryId
        +number confidence
        +Date createdAt
        +Date updatedAt
        +SubcategoryOrmEntity defaultSubcategory
        +TransactionOrmEntity[] transactions
        +toDomain() Merchant
    }

    class TransactionOrmEntity {
        +string id
        +string subcategoryId
        +number|null classificationConfidence
        +string|null merchantId
        +SubcategoryOrmEntity|null subcategory
        +MerchantOrmEntity|null merchant
    }

    SubcategoryOrmEntity "1" --* "many" SubcategoryOrmEntity : parent-children
    MerchantOrmEntity --> SubcategoryOrmEntity : default subcategory
    TransactionOrmEntity --> SubcategoryOrmEntity : subcategory
    TransactionOrmEntity --> MerchantOrmEntity : merchant
```

### Repository Implementations

```mermaid
classDiagram
    class SubcategoryTypeOrmRepository {
        -Repository~SubcategoryOrmEntity~ repository
        +findById(id) Promise~Subcategory|null~
        +findAll() Promise~Subcategory[]~
        +findByCategory(categoryType) Promise~Subcategory[]~
        +findByParentId(parentId) Promise~Subcategory[]~
        +findDefault(categoryType) Promise~Subcategory~
        +save(subcategory) Promise~Subcategory~
        +update(subcategory) Promise~Subcategory~
        +delete(id) Promise~void~
        -toEntity(domain) SubcategoryOrmEntity
        -toDomain(entity) Subcategory
    }

    class MerchantTypeOrmRepository {
        -Repository~MerchantOrmEntity~ repository
        +findById(id) Promise~Merchant|null~
        +findAll() Promise~Merchant[]~
        +findByName(name) Promise~Merchant|null~
        +findByAlias(alias) Promise~Merchant|null~
        +search(query) Promise~Merchant[]~
        +save(merchant) Promise~Merchant~
        +update(merchant) Promise~Merchant~
        +delete(id) Promise~void~
        -toEntity(domain) MerchantOrmEntity
        -toDomain(entity) Merchant
    }

    class ISubcategoryRepository {
        <<interface>>
    }

    class IMerchantRepository {
        <<interface>>
    }

    SubcategoryTypeOrmRepository ..|> ISubcategoryRepository
    MerchantTypeOrmRepository ..|> IMerchantRepository
    SubcategoryTypeOrmRepository --> SubcategoryOrmEntity
    MerchantTypeOrmRepository --> MerchantOrmEntity
```

---

## Presentation層クラス図

### Controllers & DTOs

```mermaid
classDiagram
    class SubcategoryController {
        -GetSubcategoriesUseCase getSubcategoriesUseCase
        -GetSubcategoriesByCategoryUseCase getByCategoryUseCase
        -ClassifySubcategoryUseCase classifyUseCase
        +getAll() Promise~SubcategoryResponseDto~
        +getByCategory(categoryType) Promise~SubcategoryResponseDto~
        +classify(request) Promise~ClassificationResponseDto~
    }

    class SubcategoryDto {
        +string id
        +CategoryType categoryType
        +string name
        +string|null parentId
        +number displayOrder
        +string|null icon
        +string|null color
        +boolean isDefault
        +boolean isActive
    }

    class SubcategoryResponseDto {
        +boolean success
        +SubcategoryDto[] data
        +number total
        +string|null error
    }

    class ClassificationRequestDto {
        +string transactionId
        +string description
        +number amount
        +CategoryType mainCategory
        +Date transactionDate
    }

    class ClassificationResponseDto {
        +boolean success
        +SubcategoryDto subcategory
        +number confidence
        +string reason
        +string|null error
    }

    class MerchantDto {
        +string id
        +string name
        +string[] aliases
        +string defaultSubcategoryId
        +number confidence
    }

    SubcategoryController ..> SubcategoryResponseDto
    SubcategoryController ..> ClassificationResponseDto
    SubcategoryResponseDto --> SubcategoryDto
    ClassificationResponseDto --> SubcategoryDto
```

---

## Frontendコンポーネント図

### React Components

```mermaid
classDiagram
    class SubcategorySelector {
        +Props props
        +selectedSubcategory: string|null
        +onSubcategoryChange(subcategoryId) void
        +render() JSX.Element
        -handleSelect(subcategoryId) void
        -fetchSubcategories() Promise~void~
    }

    class SubcategoryTree {
        +Props props
        +expandedNodes: Set~string~
        +onNodeSelect(nodeId) void
        +render() JSX.Element
        -toggleNode(nodeId) void
        -renderNode(node) JSX.Element
        -buildTree(subcategories) TreeNode[]
    }

    class SubcategoryFilter {
        +Props props
        +selectedCategories: Set~CategoryType~
        +onFilterChange(filters) void
        +render() JSX.Element
        -handleCategoryToggle(category) void
        -clearFilters() void
    }

    class SubcategoryBadge {
        +Props props
        +subcategory: SubcategoryDto
        +showIcon: boolean
        +render() JSX.Element
    }

    class useSubcategories {
        <<Hook>>
        +subcategories: SubcategoryDto[]
        +loading: boolean
        +error: string|null
        +fetchAll() Promise~void~
        +fetchByCategory(category) Promise~void~
        +classify(request) Promise~ClassificationResult~
    }

    SubcategorySelector --> SubcategoryTree
    SubcategorySelector --> useSubcategories
    SubcategoryTree --> SubcategoryBadge
    SubcategoryFilter --> useSubcategories
```

### API Client

```mermaid
classDiagram
    class SubcategoryApiClient {
        -AxiosInstance axios
        +getAll() Promise~SubcategoryResponseDto~
        +getByCategory(category) Promise~SubcategoryResponseDto~
        +classify(request) Promise~ClassificationResponseDto~
        -handleError(error) never
    }

    class SubcategoryCache {
        -Map~string, SubcategoryDto[]~ cache
        +get(key) SubcategoryDto[]|null
        +set(key, data) void
        +clear() void
        +has(key) boolean
    }

    SubcategoryApiClient --> SubcategoryCache
```

---

## クラス間の主要な関連

### 依存関係の全体像

```mermaid
graph TB
    Controller[SubcategoryController]
    UseCase1[ClassifySubcategoryUseCase]
    UseCase2[GetSubcategoriesUseCase]
    DomainService[SubcategoryClassifierService]
    SubcatRepo[ISubcategoryRepository]
    MerchantRepo[IMerchantRepository]
    SubcatImpl[SubcategoryTypeOrmRepository]
    MerchantImpl[MerchantTypeOrmRepository]

    Controller --> UseCase1
    Controller --> UseCase2
    UseCase1 --> DomainService
    UseCase1 --> SubcatRepo
    UseCase2 --> SubcatRepo
    DomainService --> SubcatRepo
    DomainService --> MerchantRepo
    SubcatRepo -.implements.-> SubcatImpl
    MerchantRepo -.implements.-> MerchantImpl

    style Controller fill:#e1f5ff
    style UseCase1 fill:#fff4e1
    style UseCase2 fill:#fff4e1
    style DomainService fill:#e8f5e9
    style SubcatRepo fill:#f3e5f5
    style MerchantRepo fill:#f3e5f5
    style SubcatImpl fill:#fce4ec
    style MerchantImpl fill:#fce4ec
```

---

## 設計原則

### Onion Architectureの遵守

1. **依存関係の方向**: 外側から内側へ（Presentation → Application → Domain）
2. **ドメイン層の独立性**: Domainは他のレイヤに依存しない
3. **インターフェース分離**: Repositoryはインターフェースで定義

### SOLID原則

- **単一責任**: 各クラスは一つの責任のみを持つ
- **開放閉鎖**: 拡張に対して開いて、修正に対して閉じている
- **リスコフ置換**: 派生クラスは基底クラスと置換可能
- **インターフェース分離**: 使用しないメソッドへの依存を強制しない
- **依存性逆転**: 抽象に依存し、具象に依存しない

### DDD (Domain-Driven Design)

- **Entity**: IDで識別される（Subcategory, Merchant）
- **Value Object**: 値で識別される（ClassificationConfidence）
- **Domain Service**: エンティティに属さないビジネスロジック（SubcategoryClassifierService）
- **Repository**: 永続化の抽象化

---

## 拡張性

### 将来の拡張ポイント

1. **カスタム費目追加（FR-011）**
   - `Subcategory`に`userId`フィールドを追加
   - ユーザー固有のサブカテゴリをサポート

2. **機械学習ベース分類**
   - `MLClassifierService`を追加
   - `SubcategoryClassifierService`から呼び出し

3. **多言語対応**
   - `SubcategoryTranslation`エンティティを追加
   - ロケールごとの名称管理

4. **階層の拡張**
   - `parentId`を使用した多段階階層
   - 無限ループ防止の検証ロジック

---

## 参考資料

- [README.md](./README.md) - 設計書の概要
- [sequence-diagrams.md](./sequence-diagrams.md) - 処理フロー
- [input-output-design.md](./input-output-design.md) - API仕様
