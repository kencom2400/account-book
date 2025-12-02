# シーケンス図

このドキュメントでは、月別収支集計機能の処理フローをシーケンス図で記載しています。

## 目次

1. [月別収支集計取得のフロー](#月別収支集計取得のフロー)
2. [エラーハンドリングフロー](#エラーハンドリングフロー)

---

## 月別収支集計取得のフロー

### 概要

**ユースケース**: 指定した月の収入・支出を集計し、詳細な分析情報を取得する

**アクター**: ユーザー（フロントエンド経由）

**前提条件**:

- 取引データが存在する（データが存在しない場合は空データを返す）

**成功時の結果**:

- 月別収支集計情報が取得される
- カテゴリ別・金融機関別の内訳が取得される
- 前月比・前年同月比の比較情報が取得される
- 貯蓄率が計算される

### 正常系フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController
    participant UC as CalculateMonthlyBalanceUseCase
    participant DS as MonthlyBalanceDomainService
    participant Repo as TransactionRepository
    participant DB as Database/File

    User->>FE: 月別収支レポート画面を開く<br/>(2025-01を指定)
    FE->>FE: バリデーション<br/>(YYYY-MM形式チェック)
    FE->>API: GET /api/aggregation/monthly-balance?year=2025&month=1

    API->>API: リクエスト検証<br/>(year, monthの妥当性)
    API->>UC: execute(2025, 1)

    Note over UC: 当月データ取得
    UC->>Repo: findByMonth(2025, 1)
    Repo->>DB: データ読み込み
    DB-->>Repo: TransactionEntity[]
    Repo-->>UC: TransactionEntity[]

    Note over UC: 前月データ取得（比較用）
    UC->>UC: getPreviousMonth(2025, 1)<br/>(→ {year: 2024, month: 12})
    UC->>Repo: findByMonth(2024, 12)
    Repo->>DB: データ読み込み
    DB-->>Repo: TransactionEntity[]
    Repo-->>UC: TransactionEntity[]

    Note over UC: 前年同月データ取得（比較用）
    UC->>UC: getSameMonthLastYear(2025, 1)<br/>(→ {year: 2024, month: 1})
    UC->>Repo: findByMonth(2024, 1)
    Repo->>DB: データ読み込み
    DB-->>Repo: TransactionEntity[]
    Repo-->>UC: TransactionEntity[]

    Note over UC: 集計処理
    UC->>DS: calculateBalance(currentTransactions)
    DS-->>UC: BalanceResult<br/>{income: 300000, expense: 200000, balance: 100000}

    UC->>DS: aggregateByCategory(currentTransactions)
    DS-->>UC: Map<string, AggregationData><br/>(キーはcategoryId)

    UC->>DS: aggregateByInstitution(currentTransactions)
    DS-->>UC: Map<string, AggregationData>

    UC->>DS: calculateSavingsRate(300000, 200000)
    DS-->>UC: 33.33

    Note over UC: 前月比計算
    UC->>DS: calculateBalance(previousMonthTransactions)
    DS-->>UC: BalanceResult<br/>{income: 280000, expense: 190000, balance: 90000}

    UC->>DS: calculateMonthComparison(currentBalance, previousBalance)
    DS-->>UC: MonthComparison<br/>{incomeDiff: 20000, expenseDiff: 10000,<br/>balanceDiff: 10000, incomeChangeRate: 7.14, expenseChangeRate: 5.26}

    Note over UC: 前年同月比計算
    UC->>DS: calculateBalance(sameMonthLastYearTransactions)
    DS-->>UC: BalanceResult<br/>{income: 290000, expense: 195000, balance: 95000}

    UC->>DS: calculateMonthComparison(currentBalance, lastYearBalance)
    DS-->>UC: MonthComparison<br/>{incomeDiff: 10000, expenseDiff: 5000,<br/>balanceDiff: 5000, incomeChangeRate: 3.45, expenseChangeRate: 2.56}

    Note over UC: DTO構築
    UC->>UC: buildCategoryBreakdown(aggregation, transactions)
    UC->>UC: buildInstitutionBreakdown(aggregation, transactions)
    UC-->>API: MonthlyBalanceResponseDto

    API->>API: ResponseDTOに変換
    API-->>FE: 200 OK<br/>{MonthlyBalanceResponseDto}
    FE->>FE: UI更新<br/>(グラフ描画、サマリー表示)
    FE-->>User: 月別収支レポート表示
```

### ステップ詳細

1. **ユーザーアクション**
   - ユーザーが月別収支レポート画面を開く
   - デフォルトで当月を表示、または月を選択

2. **Frontend バリデーション**
   - 月の形式チェック（YYYY-MM形式）
   - 無効な月指定のチェック（13月など）

3. **API リクエスト**
   - エンドポイント: `GET /api/aggregation/monthly-balance?year=2025&month=1`
   - クエリパラメータ: `year` (number), `month` (number)

4. **UseCase 実行**
   - 当月の取引データを取得
   - 前月の取引データを取得（比較用）
   - 前年同月の取引データを取得（比較用）
   - 各月のデータを集計
   - 前月比・前年同月比を計算
   - 貯蓄率を計算
   - カテゴリ別・金融機関別の内訳を構築

5. **Domain Service 実行**
   - `calculateBalance()`: 収入・支出・収支差額を計算
   - `aggregateByCategory()`: カテゴリID別に集計（キーは`categoryId`）
   - `aggregateByInstitution()`: 金融機関別に集計
   - `calculateSavingsRate()`: 貯蓄率を計算（incomeが0の場合は0を返す）
   - `calculateMonthComparison()`: 前月比・前年同月比を計算

6. **レスポンス**
   - ResponseDTO: `MonthlyBalanceResponseDto`
   - HTTPステータス: 200 OK

### データが存在しない場合のフロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController
    participant UC as CalculateMonthlyBalanceUseCase
    participant Repo as TransactionRepository
    participant DB as Database/File

    User->>FE: 月別収支レポート画面を開く<br/>(2025-01を指定)
    FE->>API: GET /api/aggregation/monthly-balance?year=2025&month=1

    API->>UC: execute(2025, 1)

    UC->>Repo: findByMonth(2025, 1)
    Repo->>DB: データ読み込み
    DB-->>Repo: [] (空配列)
    Repo-->>UC: [] (空配列)

    Note over UC: データが存在しない場合も<br/>正常な応答として処理
    UC->>DS: calculateBalance([])
    DS-->>UC: BalanceResult<br/>{income: 0, expense: 0, balance: 0}

    UC->>UC: 前月・前年同月データも取得<br/>(存在しない場合はnull)

    UC-->>API: MonthlyBalanceResponseDto<br/>{month: "2025-01", income: {...},<br/>expense: {...}, balance: 0,<br/>comparison: {previousMonth: null,<br/>sameMonthLastYear: null}}

    API-->>FE: 200 OK<br/>{MonthlyBalanceResponseDto}
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

    User->>FE: 月別収支レポート画面を開く<br/>(無効な月を指定: month=13)
    FE->>FE: バリデーション<br/>(month > 12 を検出)
    FE->>API: GET /api/aggregation/monthly-balance?year=2025&month=13

    API->>API: リクエスト検証<br/>(month > 12 を検出)
    API-->>FE: 400 Bad Request<br/>{success: false, message: "Invalid month",<br/>errors: [{field: "month", message: "Month must be between 1 and 12"}]}
    FE-->>User: エラーメッセージ表示
```

### サーバーエラー（500 Internal Server Error）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController
    participant UC as CalculateMonthlyBalanceUseCase
    participant Repo as TransactionRepository
    participant DB as Database/File

    User->>FE: 月別収支レポート画面を開く<br/>(2025-01を指定)
    FE->>API: GET /api/aggregation/monthly-balance?year=2025&month=1

    API->>UC: execute(2025, 1)

    UC->>Repo: findByMonth(2025, 1)
    Repo->>DB: データ読み込み
    DB-->>Repo: Error (DB接続失敗)
    Repo-->>UC: throw DatabaseConnectionError

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

| HTTPステータス | エラーコード                | 説明                   | 例                       |
| -------------- | --------------------------- | ---------------------- | ------------------------ |
| 400            | `VALIDATION_ERROR`          | バリデーションエラー   | 無効な月指定（13月など） |
| 500            | `DATABASE_CONNECTION_ERROR` | データベース接続エラー | DB接続失敗               |
| 500            | `INTERNAL_SERVER_ERROR`     | 予期しないエラー       | その他の内部エラー       |

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
