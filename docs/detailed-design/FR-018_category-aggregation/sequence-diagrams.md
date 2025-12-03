# シーケンス図

このドキュメントでは、カテゴリ別集計機能の処理フローをシーケンス図で記載しています。

## 目次

1. [カテゴリ別集計取得のフロー](#カテゴリ別集計取得のフロー)
2. [エラーハンドリングフロー](#エラーハンドリングフロー)

---

## カテゴリ別集計取得のフロー

### 概要

**ユースケース**: 指定した期間の5つの主要カテゴリ（収入・支出・振替・返済・投資）ごとに取引を集計し、詳細な分析情報を取得する

**アクター**: ユーザー（フロントエンド経由）

**前提条件**:

- 取引データが存在する（データが存在しない場合は空データを返す）

**成功時の結果**:

- カテゴリ別集計情報が取得される（5つのカテゴリごと）
- サブカテゴリ（費目）別の内訳が取得される
- 構成比が計算される
- 推移データ（月次推移）が計算される
- 主要取引（金額の大きい取引）が取得される

### 正常系フロー（全カテゴリ集計）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController
    participant UC as CalculateCategoryAggregationUseCase
    participant DS as CategoryAggregationDomainService
    participant TRepo as TransactionRepository
    participant CRepo as CategoryRepository
    participant DB as Database/File

    User->>FE: カテゴリ別集計画面を開く<br/>(2025-01-01 〜 2025-01-31を指定)
    FE->>FE: バリデーション<br/>(日付形式チェック、開始日 < 終了日)
    FE->>API: GET /api/aggregation/category?startDate=2025-01-01&endDate=2025-01-31

    API->>API: リクエスト検証<br/>(startDate, endDateの妥当性)
    API->>UC: execute(startDate, endDate, undefined)

    Note over UC: 期間内の取引データ取得
    UC->>TRepo: findByDateRange(2025-01-01, 2025-01-31)
    TRepo->>DB: データ読み込み
    DB-->>TRepo: TransactionEntity[]
    TRepo-->>UC: TransactionEntity[]

    Note over UC: 全カテゴリタイプでループ<br/>(INCOME, EXPENSE, TRANSFER, REPAYMENT, INVESTMENT)
    loop 各カテゴリタイプ
        Note over UC: カテゴリ別集計
        UC->>DS: aggregateByCategoryType(transactions, categoryType)
        DS-->>UC: CategoryAggregationResult<br/>{category: INCOME, totalAmount: 300000,<br/>transactionCount: 5, percentage: 45.5}

        Note over UC: サブカテゴリ別集計
        UC->>DS: aggregateBySubcategory(transactions, categoryType)
        DS-->>UC: Map<string, SubcategoryAggregationData><br/>(キーはcategoryId)

        Note over UC: 推移データ計算
        UC->>DS: calculateTrend(transactions, startDate, endDate)
        DS-->>UC: TrendData<br/>{monthly: [{month: "2025-01", amount: 300000, count: 5}]}

        Note over UC: サブカテゴリ内訳構築
        UC->>UC: buildSubcategorySummary(aggregation, transactions)
        Note over UC: 必要なcategoryIdをすべて収集
        UC->>UC: collectCategoryIds(aggregation)
        UC->>CRepo: findByIds(categoryIds[])
        CRepo->>DB: データ読み込み（一括取得）
        DB-->>CRepo: CategoryEntity[]
        CRepo-->>UC: CategoryEntity[]
        UC->>UC: カテゴリ名をマッピング

        Note over UC: 主要取引取得
        UC->>DS: getTopTransactions(transactions, 5)
        DS-->>UC: TransactionEntity[] (最大5件)

        Note over UC: DTO構築
        UC->>UC: toTransactionDto(entity)
    end

    UC-->>API: CategoryAggregationResponseDto[]<br/>(5つのカテゴリ分)

    API->>API: ResponseDTOに変換
    API-->>FE: 200 OK<br/>{CategoryAggregationResponseDto[]}
    FE->>FE: UI更新<br/>(円グラフ描画、サマリー表示)
    FE-->>User: カテゴリ別集計レポート表示
```

### 正常系フロー（特定カテゴリのみ集計）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController
    participant UC as CalculateCategoryAggregationUseCase
    participant DS as CategoryAggregationDomainService
    participant TRepo as TransactionRepository
    participant CRepo as CategoryRepository
    participant DB as Database/File

    User->>FE: カテゴリ別集計画面を開く<br/>(2025-01-01 〜 2025-01-31、EXPENSEを指定)
    FE->>API: GET /api/aggregation/category?startDate=2025-01-01&endDate=2025-01-31&categoryType=EXPENSE

    API->>UC: execute(startDate, endDate, EXPENSE)

    Note over UC: 期間内の取引データ取得（EXPENSEのみ）
    UC->>TRepo: findByCategoryType(EXPENSE, 2025-01-01, 2025-01-31)
    TRepo->>DB: データ読み込み
    DB-->>TRepo: TransactionEntity[] (EXPENSEのみ)
    TRepo-->>UC: TransactionEntity[]

    Note over UC: EXPENSEカテゴリのみ集計
    UC->>DS: aggregateByCategoryType(transactions, EXPENSE)
    DS-->>UC: CategoryAggregationResult<br/>{category: EXPENSE, totalAmount: 200000,<br/>transactionCount: 20, percentage: 100}

    UC->>DS: aggregateBySubcategory(transactions, EXPENSE)
    DS-->>UC: Map<string, SubcategoryAggregationData>

    UC->>DS: calculateTrend(transactions, startDate, endDate)
    DS-->>UC: TrendData

    UC->>UC: buildSubcategorySummary(aggregation, transactions)
    Note over UC: 必要なcategoryIdをすべて収集
    UC->>UC: collectCategoryIds(aggregation)
    UC->>CRepo: findByIds(categoryIds[])
    CRepo->>DB: データ読み込み（一括取得）
    DB-->>CRepo: CategoryEntity[]
    CRepo-->>UC: CategoryEntity[]
    UC->>UC: カテゴリ名をマッピング

    UC->>DS: getTopTransactions(transactions, 5)
    DS-->>UC: TransactionEntity[]

    UC-->>API: CategoryAggregationResponseDto[]<br/>([EXPENSE] - 要素1つの配列)

    API-->>FE: 200 OK<br/>{CategoryAggregationResponseDto[]}
    FE-->>User: 支出カテゴリ集計レポート表示
```

### ステップ詳細

1. **ユーザーアクション**
   - ユーザーがカテゴリ別集計画面を開く
   - 期間を指定（開始日・終了日）
   - カテゴリタイプを指定（オプション、指定しない場合は全カテゴリ）

2. **Frontend バリデーション**
   - 日付の形式チェック（ISO8601形式）
   - 開始日が終了日より前であることのチェック
   - カテゴリタイプの妥当性チェック（有効なCategoryType）

3. **API リクエスト**
   - エンドポイント: `GET /api/aggregation/category?startDate=2025-01-01&endDate=2025-01-31&categoryType=EXPENSE`
   - クエリパラメータ: `startDate` (string), `endDate` (string), `categoryType?` (CategoryType, オプション)

4. **UseCase 実行**
   - 期間内の取引データを取得（categoryTypeが指定されている場合は該当カテゴリのみ）
   - 各カテゴリタイプで集計（categoryTypeが指定されていない場合）
   - サブカテゴリ別内訳を計算
   - 推移データを計算
   - 主要取引を取得
   - カテゴリ名を取得（CategoryRepositoryを使用）

5. **Domain Service 実行**
   - `aggregateByCategoryType()`: 指定したカテゴリタイプで集計
   - `aggregateBySubcategory()`: サブカテゴリ（費目）別に集計（キーは`categoryId`）
   - `calculatePercentage()`: 構成比を計算（totalが0の場合は0を返す）
   - `calculateTrend()`: 期間内の月次推移を計算
   - `getTopTransactions()`: 金額の大きい取引を取得（最大5件）

6. **レスポンス**
   - ResponseDTO: `CategoryAggregationResponseDto[]`（全カテゴリの場合）または`CategoryAggregationResponseDto`（特定カテゴリの場合）
   - HTTPステータス: 200 OK

### データが存在しない場合のフロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController
    participant UC as CalculateCategoryAggregationUseCase
    participant TRepo as TransactionRepository
    participant DB as Database/File

    User->>FE: カテゴリ別集計画面を開く<br/>(2025-01-01 〜 2025-01-31を指定)
    FE->>API: GET /api/aggregation/category?startDate=2025-01-01&endDate=2025-01-31

    API->>UC: execute(startDate, endDate, undefined)

    UC->>TRepo: findByDateRange(2025-01-01, 2025-01-31)
    TRepo->>DB: データ読み込み
    DB-->>TRepo: [] (空配列)
    TRepo-->>UC: [] (空配列)

    Note over UC: データが存在しない場合も<br/>正常な応答として処理
    Note over UC: 全カテゴリタイプでループ
    loop 各カテゴリタイプ
        UC->>DS: aggregateByCategoryType([], categoryType)
        DS-->>UC: CategoryAggregationResult<br/>{category: INCOME, totalAmount: 0,<br/>transactionCount: 0, percentage: 0}
    end

    UC-->>API: CategoryAggregationResponseDto[]<br/>(5つのカテゴリ、すべて空データ)

    API-->>FE: 200 OK<br/>{CategoryAggregationResponseDto[]}
    FE->>FE: UI更新<br/>(「データがありません」メッセージ表示)
    FE-->>User: 空データ表示
```

**重要**: データが存在しない場合でも、500エラーではなく200 OKで空データを返す。これは正常なシナリオの一つとして扱う。

---

## エラーハンドリングフロー

### バリデーションエラー（400 Bad Request）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController

    User->>FE: カテゴリ別集計画面を開く<br/>(無効な期間を指定: 開始日 > 終了日)
    FE->>FE: バリデーション<br/>(開始日 > 終了日 を検出)
    FE->>API: GET /api/aggregation/category?startDate=2025-01-31&endDate=2025-01-01

    API->>API: リクエスト検証<br/>(開始日 > 終了日 を検出)
    API-->>FE: 400 Bad Request<br/>{success: false, message: "Invalid date range",<br/>errors: [{field: "startDate", message: "Start date must be before end date"}]}
    FE-->>User: エラーメッセージ表示
```

### サーバーエラー（500 Internal Server Error）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController
    participant UC as CalculateCategoryAggregationUseCase
    participant TRepo as TransactionRepository
    participant DB as Database/File

    User->>FE: カテゴリ別集計画面を開く<br/>(2025-01-01 〜 2025-01-31を指定)
    FE->>API: GET /api/aggregation/category?startDate=2025-01-01&endDate=2025-01-31

    API->>UC: execute(startDate, endDate, undefined)

    UC->>TRepo: findByDateRange(2025-01-01, 2025-01-31)
    TRepo->>DB: データ読み込み
    DB-->>TRepo: Error (DB接続失敗)
    TRepo-->>UC: throw DatabaseConnectionError

    UC-->>API: throw DatabaseConnectionError
    API->>API: エラーハンドリング<br/>(500 Internal Server Error)
    API-->>FE: 500 Internal Server Error<br/>{success: false, message: "Internal server error",<br/>code: "DATABASE_CONNECTION_ERROR"}
    FE-->>User: エラーメッセージ表示
```

### エラーレスポンス形式

すべてのエラーレスポンスは以下の共通形式に従う：

```typescript
interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  code?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  timestamp: string;
  path: string;
}
```

### エラー分類

| HTTPステータス | エラーコード                | 説明                   | 例                          |
| -------------- | --------------------------- | ---------------------- | --------------------------- |
| 400            | `VALIDATION_ERROR`          | バリデーションエラー   | 開始日 > 終了日、無効な形式 |
| 500            | `DATABASE_CONNECTION_ERROR` | データベース接続エラー | DB接続失敗                  |
| 500            | `INTERNAL_SERVER_ERROR`     | 予期しないエラー       | その他の内部エラー          |

---

## チェックリスト

シーケンス図作成時の確認事項：

### 必須項目

- [x] 正常系フローが記載されている
- [x] 異常系フローが記載されている
- [x] 各ステップの説明が記載されている
- [x] エラーハンドリングが明確に示されている
- [x] データが存在しない場合の処理が明確

### 推奨項目

- [x] 前提条件が記載されている
- [x] 成功時の結果が記載されている
- [x] エラーレスポンス形式が明確

### 注意事項

- [x] 空配列（[]）は正常な応答として扱う（500エラーにしない）
- [x] エラーレスポンスは共通形式に準拠している
- [x] HTTPステータスコードが適切に使い分けられている
- [x] カテゴリタイプが指定されていない場合は全カテゴリを集計する処理が明確
