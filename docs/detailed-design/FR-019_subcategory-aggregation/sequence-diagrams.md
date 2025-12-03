# シーケンス図

このドキュメントでは、費目別集計機能の処理フローをシーケンス図で記載しています。

## 目次

1. [費目別集計取得のフロー](#費目別集計取得のフロー)
2. [エラーハンドリングフロー](#エラーハンドリングフロー)

---

## 費目別集計取得のフロー

### 概要

**ユースケース**: 指定した期間の詳細な費目（食費、交通費、医療費等）ごとに取引を集計し、階層構造で分析情報を取得する

**アクター**: ユーザー（フロントエンド経由）

**前提条件**:

- 取引データが存在する（データが存在しない場合は空データを返す）

**成功時の結果**:

- 費目別集計情報が取得される（階層構造を含む）
- 平均金額が計算される
- 推移データ（月次推移）が計算される
- 主要取引（金額の大きい取引）が取得される
- 予算対比情報が取得される（将来対応）

### 正常系フロー（全費目集計）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController
    participant UC as CalculateSubcategoryAggregationUseCase
    participant DS as SubcategoryAggregationDomainService
    participant TRepo as TransactionRepository
    participant CRepo as CategoryRepository
    participant DB as Database/File

    User->>FE: 費目別集計画面を開く<br/>(2025-01-01 〜 2025-01-31を指定)
    FE->>FE: バリデーション<br/>(日付形式チェック、開始日 < 終了日)
    FE->>API: GET /api/aggregation/subcategory?startDate=2025-01-01&endDate=2025-01-31

    API->>API: リクエスト検証<br/>(startDate, endDateの妥当性)
    API->>UC: execute(startDate, endDate, undefined, undefined)

    Note over UC: 期間内の取引データ取得
    UC->>TRepo: findByDateRange(2025-01-01, 2025-01-31)
    TRepo->>DB: データ読み込み
    DB-->>TRepo: TransactionEntity[]
    TRepo-->>UC: TransactionEntity[]

    Note over UC: カテゴリ情報取得（階層構造構築用）
    UC->>CRepo: findByCategoryType(EXPENSE)
    CRepo->>DB: データ読み込み
    DB-->>CRepo: CategoryEntity[]
    CRepo-->>UC: CategoryEntity[]

    Note over UC: 費目別集計（階層構造を考慮）
    UC->>DS: aggregateHierarchy(transactions, categories)
    DS->>DS: 親子関係を構築
    DS->>DS: 各費目で集計
    DS-->>UC: SubcategoryAggregationResult[]<br/>(階層構造を含む)

    Note over UC: 推移データ計算
    UC->>DS: calculateTrend(transactions, startDate, endDate)
    DS-->>UC: TrendData<br/>{monthly: [{month: "2025-01", amount: 200000, count: 20}]}

    Note over UC: 階層構造構築とDTO変換
    UC->>UC: buildHierarchy(aggregation, categories)
    Note over UC: 必要なcategoryIdをすべて収集
    UC->>UC: collectCategoryIds(aggregation)
    UC->>CRepo: findByIds(categoryIds[])
    CRepo->>DB: データ読み込み（一括取得）
    DB-->>CRepo: CategoryEntity[]
    CRepo-->>UC: CategoryEntity[]
    UC->>UC: カテゴリ名をマッピング
    UC->>UC: 階層構造を構築（親子関係を反映）

    Note over UC: 各費目で主要取引取得
    loop 各費目
        UC->>DS: getTopTransactions(transactions, 5)
        DS-->>UC: TransactionEntity[] (最大5件)
        UC->>UC: toTransactionDto(entity)
    end

    UC-->>API: SubcategoryAggregationResponseDto<br/>{items: ExpenseItemSummary[], period: {...}, totalAmount: 200000, totalTransactionCount: 20}

    API->>API: ResponseDTOに変換
    API-->>FE: 200 OK<br/>{SubcategoryAggregationResponseDto}
    FE->>FE: UI更新<br/>(階層表示、グラフ描画、サマリー表示)
    FE-->>User: 費目別集計レポート表示
```

### 正常系フロー（特定カテゴリタイプのみ集計）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController
    participant UC as CalculateSubcategoryAggregationUseCase
    participant DS as SubcategoryAggregationDomainService
    participant TRepo as TransactionRepository
    participant CRepo as CategoryRepository
    participant DB as Database/File

    User->>FE: 費目別集計画面を開く<br/>(2025-01-01 〜 2025-01-31、EXPENSEを指定)
    FE->>API: GET /api/aggregation/subcategory?startDate=2025-01-01&endDate=2025-01-31&categoryType=EXPENSE

    API->>UC: execute(startDate, endDate, EXPENSE, undefined)

    Note over UC: 期間内の取引データ取得（EXPENSEのみ）
    UC->>TRepo: findByDateRange(2025-01-01, 2025-01-31)
    TRepo->>DB: データ読み込み
    DB-->>TRepo: TransactionEntity[] (全取引)
    TRepo-->>UC: TransactionEntity[]
    UC->>UC: EXPENSEのみフィルタリング

    Note over UC: カテゴリ情報取得（EXPENSEのみ）
    UC->>CRepo: findByCategoryType(EXPENSE)
    CRepo->>DB: データ読み込み
    DB-->>CRepo: CategoryEntity[] (EXPENSEのみ)
    CRepo-->>UC: CategoryEntity[]

    Note over UC: 費目別集計（階層構造を考慮）
    UC->>DS: aggregateHierarchy(transactions, categories)
    DS-->>UC: SubcategoryAggregationResult[]<br/>(階層構造を含む、EXPENSEのみ)

    UC->>DS: calculateTrend(transactions, startDate, endDate)
    DS-->>UC: TrendData

    UC->>UC: buildHierarchy(aggregation, categories)
    UC->>CRepo: findByIds(categoryIds[])
    CRepo-->>UC: CategoryEntity[]
    UC->>UC: 階層構造を構築

    UC->>DS: getTopTransactions(transactions, 5)
    DS-->>UC: TransactionEntity[]

    UC-->>API: SubcategoryAggregationResponseDto<br/>(EXPENSE費目のみ)

    API-->>FE: 200 OK<br/>{SubcategoryAggregationResponseDto}
    FE-->>User: 支出費目集計レポート表示
```

### 正常系フロー（特定費目IDを指定）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController
    participant UC as CalculateSubcategoryAggregationUseCase
    participant DS as SubcategoryAggregationDomainService
    participant TRepo as TransactionRepository
    participant CRepo as CategoryRepository
    participant DB as Database/File

    User->>FE: 費目別集計画面で「食費」をクリック<br/>(2025-01-01 〜 2025-01-31、itemId=cat-foodを指定)
    FE->>API: GET /api/aggregation/subcategory?startDate=2025-01-01&endDate=2025-01-31&itemId=cat-food

    API->>UC: execute(startDate, endDate, undefined, "cat-food")

    Note over UC: 期間内の取引データ取得
    UC->>TRepo: findByDateRange(2025-01-01, 2025-01-31)
    TRepo->>DB: データ読み込み
    DB-->>TRepo: TransactionEntity[]
    TRepo-->>UC: TransactionEntity[]

    Note over UC: 指定費目とその子費目を取得
    UC->>CRepo: findById("cat-food")
    CRepo->>DB: データ読み込み
    DB-->>CRepo: CategoryEntity
    CRepo-->>UC: CategoryEntity
    UC->>CRepo: findChildren("cat-food")
    CRepo->>DB: データ読み込み
    DB-->>CRepo: CategoryEntity[] (子費目)
    CRepo-->>UC: CategoryEntity[]

    Note over UC: 指定費目とその子費目の取引のみフィルタリング
    UC->>UC: filterTransactionsByCategoryIds(transactions, categoryIds)

    Note over UC: 費目別集計（階層構造を考慮）
    UC->>DS: aggregateHierarchy(filteredTransactions, categories)
    DS-->>UC: SubcategoryAggregationResult[]<br/>(食費とその子費目のみ)

    UC->>DS: calculateTrend(filteredTransactions, startDate, endDate)
    DS-->>UC: TrendData

    UC->>UC: buildHierarchy(aggregation, categories)
    UC->>DS: getTopTransactions(filteredTransactions, 5)
    DS-->>UC: TransactionEntity[]

    UC-->>API: SubcategoryAggregationResponseDto<br/>(食費とその子費目のみ)

    API-->>FE: 200 OK<br/>{SubcategoryAggregationResponseDto}
    FE-->>User: 食費の詳細集計レポート表示
```

### ステップ詳細

#### 1. リクエスト検証

- `startDate`と`endDate`の形式チェック（ISO8601形式）
- `startDate < endDate`のチェック
- `categoryType`の妥当性チェック（オプション）
- `itemId`の妥当性チェック（オプション）

#### 2. 取引データ取得

- 期間内の全取引データを取得
- `categoryType`が指定されている場合は、フィルタリング（Application層で実施）
- `itemId`が指定されている場合は、該当費目とその子費目の取引のみフィルタリング

#### 3. カテゴリ情報取得

- `categoryType`が指定されている場合は、該当カテゴリタイプのカテゴリのみ取得
- `itemId`が指定されている場合は、該当費目とその子費目を取得
- 階層構造構築のために、親子関係を考慮

#### 4. 費目別集計

- `SubcategoryAggregationDomainService.aggregateHierarchy()`で階層構造を考慮した集計
- 親費目の金額は、子費目の合計を含む（再帰的集計）
- 各費目で合計金額・取引件数・平均金額を計算

#### 5. 推移データ計算

- 期間内の月次推移を計算
- 各月の金額・取引件数を集計

#### 6. 階層構造構築

- カテゴリ情報から親子関係を構築
- 集計結果を階層構造にマッピング
- カテゴリ名を取得してDTOに設定

#### 7. 主要取引取得

- 各費目で金額の大きい取引を取得（最大5件）
- `TransactionEntity`を`TransactionDto`に変換

---

## エラーハンドリングフロー

### バリデーションエラー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController
    participant UC as CalculateSubcategoryAggregationUseCase

    User->>FE: 費目別集計画面を開く<br/>(無効な日付形式を指定)
    FE->>FE: バリデーション<br/>(日付形式チェック)
    FE->>FE: エラーメッセージ表示<br/>「日付の形式が正しくありません」

    alt フロントエンドで検出できない場合
        FE->>API: GET /api/aggregation/subcategory?startDate=invalid&endDate=2025-01-31
        API->>API: リクエスト検証<br/>(日付形式チェック)
        API-->>FE: 400 Bad Request<br/>{success: false, message: "Invalid date format", errors: [...]}
        FE->>FE: エラーメッセージ表示
        FE-->>User: エラーメッセージ表示
    end
```

### データ不存在エラー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController
    participant UC as CalculateSubcategoryAggregationUseCase
    participant TRepo as TransactionRepository
    participant DB as Database/File

    User->>FE: 費目別集計画面を開く<br/>(2025-01-01 〜 2025-01-31を指定)
    FE->>API: GET /api/aggregation/subcategory?startDate=2025-01-01&endDate=2025-01-31

    API->>UC: execute(startDate, endDate, undefined, undefined)

    UC->>TRepo: findByDateRange(2025-01-01, 2025-01-31)
    TRepo->>DB: データ読み込み
    DB-->>TRepo: [] (空配列)
    TRepo-->>UC: []

    Note over UC: データが存在しない場合は空データを返す<br/>(エラーではなく正常な応答)
    UC-->>API: SubcategoryAggregationResponseDto<br/>{items: [], period: {...}, totalAmount: 0, totalTransactionCount: 0}

    API-->>FE: 200 OK<br/>{SubcategoryAggregationResponseDto}
    FE->>FE: UI更新<br/>「データがありません」メッセージ表示
    FE-->>User: 空データ表示
```

### サーバーエラー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController
    participant UC as CalculateSubcategoryAggregationUseCase
    participant TRepo as TransactionRepository
    participant DB as Database/File

    User->>FE: 費目別集計画面を開く
    FE->>API: GET /api/aggregation/subcategory?startDate=2025-01-01&endDate=2025-01-31

    API->>UC: execute(startDate, endDate, undefined, undefined)

    UC->>TRepo: findByDateRange(2025-01-01, 2025-01-31)
    TRepo->>DB: データ読み込み
    DB-->>TRepo: Error (DB接続失敗)
    TRepo-->>UC: throw DatabaseError

    UC->>UC: エラーハンドリング<br/>(カスタム例外に変換)
    UC-->>API: throw InternalServerError

    API->>API: エラーハンドリング<br/>(500エラーレスポンスに変換)
    API-->>FE: 500 Internal Server Error<br/>{success: false, message: "Internal server error", code: "AG019_001"}

    FE->>FE: エラーメッセージ表示
    FE-->>User: エラーメッセージ表示<br/>「サーバーエラーが発生しました。しばらくしてから再度お試しください。」
```

---

## チェックリスト

シーケンス図作成時の確認事項：

### 必須項目

- [x] 正常系フローが記載されている
- [x] エラーハンドリングフローが記載されている
- [x] 各ステップの説明が記載されている
- [x] 階層構造の処理が明確に示されている

### 推奨項目

- [x] 複数のシナリオ（全費目、特定カテゴリ、特定費目）が記載されている
- [x] データ不存在時の処理が明確
- [x] エラーレスポンス形式が明確

### 注意事項

- [x] 空データは正常な応答として扱う（500エラーにしない）
- [x] 階層構造の構築処理が明確に示されている
- [x] 親子関係の再帰的集計が明確に示されている
