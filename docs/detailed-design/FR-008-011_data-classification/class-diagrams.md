# クラス図 - FR-008-011: 取引データの主要カテゴリ自動分類

## Domain層

### CategoryClassificationService

分類ロジックの中核クラス

```mermaid
classDiagram
    class CategoryClassificationService {
        -keywords: Record~CategoryType, string[]~
        +classifyTransaction(transaction, institutionType?) ClassificationResult
        -matchKeywords(description: string) CategoryType | null
        -classifyByAmount(amount: number) CategoryType
        -classifyByInstitutionType(type: string) CategoryType | null
        -isTransferPattern(t1, t2) boolean
        +evaluateConfidence(confidence: number) ConfidenceLevel
        -getDaysDifference(date1, date2) number
    }

    class ClassificationResult {
        +category: CategoryType
        +confidence: number
        +reason: string
        +confidenceLevel: ConfidenceLevel
    }

    CategoryClassificationService --> ClassificationResult : returns
```

#### プロパティ

| 名前     | 型                               | 説明                         |
| -------- | -------------------------------- | ---------------------------- |
| keywords | `Record<CategoryType, string[]>` | カテゴリごとのキーワード辞書 |

#### メソッド

| メソッド                  | 引数                          | 戻り値               | 説明                       |
| ------------------------- | ----------------------------- | -------------------- | -------------------------- |
| classifyTransaction       | transaction, institutionType? | ClassificationResult | 取引を自動分類             |
| matchKeywords             | description: string           | CategoryType \| null | キーワードマッチング       |
| classifyByAmount          | amount: number                | CategoryType         | 金額ベース分類             |
| classifyByInstitutionType | type: string                  | CategoryType \| null | 金融機関タイプベース分類   |
| isTransferPattern         | t1, t2                        | boolean              | 振替パターン検出（未使用） |
| evaluateConfidence        | confidence: number            | ConfidenceLevel      | 信頼度レベル評価           |

---

## Application層

### ClassifyTransactionUseCase

分類処理のオーケストレーション

```mermaid
classDiagram
    class ClassifyTransactionUseCase {
        -classificationService: CategoryClassificationService
        -categoryRepository: ICategoryRepository
        +execute(dto: ClassifyTransactionDto) Promise~ClassifyResult~
        -getDefaultCategoryForType(type: CategoryType) Promise~CategoryInfo~
        -getDefaultCategoryName(type: CategoryType) string
    }

    class ClassifyTransactionDto {
        +amount: number
        +description: string
        +institutionId?: string
        +institutionType?: string
    }

    class ClassifyResult {
        +category: CategoryInfo
        +confidence: number
        +confidenceLevel: ConfidenceLevel
        +reason: string
    }

    class CategoryInfo {
        +id: string
        +name: string
        +type: CategoryType
    }

    ClassifyTransactionUseCase --> CategoryClassificationService : uses
    ClassifyTransactionUseCase --> ICategoryRepository : uses
    ClassifyTransactionUseCase ..> ClassifyTransactionDto : receives
    ClassifyTransactionUseCase --> ClassifyResult : returns
    ClassifyResult --> CategoryInfo : contains
```

#### メソッド

| メソッド                  | 引数                        | 戻り値                  | 説明                                     |
| ------------------------- | --------------------------- | ----------------------- | ---------------------------------------- |
| execute                   | dto: ClassifyTransactionDto | Promise<ClassifyResult> | 分類を実行し、カテゴリ情報を返す         |
| getDefaultCategoryForType | type: CategoryType          | Promise<CategoryInfo>   | タイプに対応するデフォルトカテゴリを取得 |
| getDefaultCategoryName    | type: CategoryType          | string                  | タイプに対応するデフォルト名を取得       |

---

## Presentation層

### TransactionController

API エンドポイント

```mermaid
classDiagram
    class TransactionController {
        -classifyTransactionUseCase: ClassifyTransactionUseCase
        +classify(body: ClassifyTransactionDto) Promise~ClassifyResponse~
    }

    class ClassifyTransactionDto {
        +amount: number
        +description: string
        +institutionId?: string
        +institutionType?: string
    }

    class ClassifyResponse {
        +success: boolean
        +data: ClassifyResult
    }

    TransactionController --> ClassifyTransactionUseCase : uses
    TransactionController ..> ClassifyTransactionDto : receives
    TransactionController --> ClassifyResponse : returns
```

#### エンドポイント

| メソッド | パス                         | 説明             |
| -------- | ---------------------------- | ---------------- |
| POST     | `/api/transactions/classify` | 取引データを分類 |

#### バリデーション

`class-validator`を使用した入力検証：

- `amount`: 数値必須
- `description`: 文字列必須
- `institutionId`: 文字列オプション
- `institutionType`: 文字列オプション

---

## Infrastructure層

### ICategoryRepository

カテゴリリポジトリインターフェース

```mermaid
classDiagram
    class ICategoryRepository {
        <<interface>>
        +findByType(type: CategoryType) Promise~CategoryEntity[]~
        +findById(id: string) Promise~CategoryEntity | null~
        +findAll() Promise~CategoryEntity[]~
        +save(category: CategoryEntity) Promise~CategoryEntity~
        +update(id: string, data) Promise~CategoryEntity~
        +delete(id: string) Promise~void~
        +findByParentId(parentId: string | null) Promise~CategoryEntity[]~
    }

    class CategoryEntity {
        +id: string
        +name: string
        +type: CategoryType
        +parentId: string | null
        +icon: string
        +color: string
        +isActive: boolean
        +order: number
        +createdAt: Date
        +updatedAt: Date
    }

    ICategoryRepository --> CategoryEntity : manages
```

---

## Frontend

### CategoryClassifier Component

```mermaid
classDiagram
    class CategoryClassifier {
        -amount: string
        -description: string
        -result: ClassificationResult | null
        -loading: boolean
        -error: string | null
        +handleClassify() Promise~void~
        -getCategoryTypeLabel(type: CategoryType) string
        -getConfidenceColorClass(level: ConfidenceLevel) string
        -getConfidenceLabelText(level: ConfidenceLevel) string
    }

    class ClassificationResult {
        +category: CategoryInfo
        +confidence: number
        +confidenceLevel: ConfidenceLevel
        +reason: string
    }

    CategoryClassifier --> ClassificationResult : displays
```

---

## 型定義

### CategoryType (Enum)

```typescript
enum CategoryType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
  REPAYMENT = 'REPAYMENT',
  INVESTMENT = 'INVESTMENT',
}
```

### ConfidenceLevel

```typescript
type ConfidenceLevel = 'high' | 'medium' | 'low';
```

---

## クラス間の関係

```mermaid
graph TD
    A[TransactionController] -->|依存| B[ClassifyTransactionUseCase]
    B -->|依存| C[CategoryClassificationService]
    B -->|依存| D[ICategoryRepository]
    D -->|実装| E[CategoryRepositoryImpl]
    E -->|アクセス| F[(Database)]

    G[CategoryClassifier] -->|API呼び出し| A

    style A fill:#e1f5ff
    style B fill:#fff4e1
    style C fill:#e1ffe1
    style D fill:#ffe1f5
    style E fill:#ffe1f5
    style G fill:#e1f5ff
```

---

## 依存性注入

### Backend (NestJS)

```typescript
// CategoryClassificationService
@Injectable()
export class CategoryClassificationService { ... }

// ClassifyTransactionUseCase
@Injectable()
export class ClassifyTransactionUseCase {
  constructor(
    private readonly classificationService: CategoryClassificationService,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}
}

// TransactionController
@Controller('transactions')
export class TransactionController {
  constructor(
    private readonly classifyTransactionUseCase: ClassifyTransactionUseCase,
  ) {}
}
```

---

## 設計パターン

### 使用パターン

1. **Dependency Injection**: NestJSのDIコンテナを活用
2. **Repository Pattern**: データアクセスの抽象化
3. **Use Case Pattern**: ビジネスロジックのカプセル化
4. **Strategy Pattern**: 分類アルゴリズムの切り替え（金融機関タイプ、キーワード、金額）

---

## チェックリスト

- [x] Domain層のクラス定義
- [x] Application層のクラス定義
- [x] Presentation層のクラス定義
- [x] Infrastructure層のインターフェース定義
- [x] Frontend コンポーネント定義
- [x] 型定義の明確化
- [x] クラス間の依存関係の図示
- [x] 依存性注入の説明
- [x] 使用している設計パターンの記載
