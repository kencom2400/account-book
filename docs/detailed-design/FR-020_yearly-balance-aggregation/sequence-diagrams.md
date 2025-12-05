# シーケンス図

このドキュメントでは、年間収支推移表示機能の処理フローをシーケンス図で記載しています。

## 目次

1. [年間収支推移取得のフロー](#年間収支推移取得のフロー)
2. [エラーハンドリングフロー](#エラーハンドリングフロー)

---

## 年間収支推移取得のフロー

### 概要

**ユースケース**: 指定した年の1年間（12ヶ月）の収支推移を集計し、詳細な分析情報を取得する

**アクター**: ユーザー（フロントエンド経由）

**前提条件**:

- 取引データが存在する（データが存在しない場合は空データを返す）

**成功時の結果**:

- 年間収支推移情報が取得される
- 12ヶ月分の月別データが取得される
- 年間サマリー（合計・平均・貯蓄率）が計算される
- トレンド分析（収入・支出・収支の傾向）が実行される
- ハイライト情報（最大収入月・最大支出月・最高収支月・最低収支月）が抽出される

### 正常系フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController
    participant UC as CalculateYearlyBalanceUseCase
    participant MonthlyUC as CalculateMonthlyBalanceUseCase
    participant YDS as YearlyBalanceDomainService
    participant MDS as MonthlyBalanceDomainService
    participant Repo as TransactionRepository
    participant DB as Database/File

    User->>FE: 年間収支レポート画面を開く<br/>(2025年を指定)
    FE->>FE: バリデーション<br/>(年の妥当性チェック)
    FE->>API: GET /api/aggregation/yearly-balance?year=2025

    API->>API: リクエスト検証<br/>(yearの妥当性)
    API->>UC: execute(2025)

    Note over UC: 対象年全体のデータを一度に取得<br/>(パフォーマンス最適化)
    UC->>Repo: findByDateRange(2025-01-01, 2025-12-31)
    Repo->>DB: データ読み込み
    DB-->>Repo: TransactionEntity[] (全12ヶ月分)
    Repo-->>UC: TransactionEntity[]

    Note over UC: メモリ上で月別に集計<br/>(1月〜12月をループ)
    loop 1月〜12月
        UC->>UC: 該当月の取引をフィルタリング
        UC->>MDS: calculateBalance(monthlyTransactions)
        MDS-->>UC: BalanceResult
        UC->>UC: MonthlyBalanceResponseDtoを構築
    end

    Note over UC: 年間サマリー計算
    UC->>YDS: calculateAnnualSummary(monthlySummaries)
    YDS-->>UC: AnnualSummary<br/>{totalIncome, totalExpense,<br/>totalBalance, averageIncome,<br/>averageExpense, savingsRate}

    Note over UC: トレンド分析
    UC->>YDS: analyzeTrend(incomeAmounts)
    YDS->>YDS: calculateSlope(incomeAmounts)
    YDS->>YDS: calculateStandardDeviation(incomeAmounts)
    YDS-->>UC: TrendAnalysis<br/>{direction: "increasing",<br/>changeRate: 2.5,<br/>standardDeviation: 15000}

    UC->>YDS: analyzeTrend(expenseAmounts)
    YDS-->>UC: TrendAnalysis

    UC->>YDS: analyzeTrend(balanceAmounts)
    YDS-->>UC: TrendAnalysis

    Note over UC: ハイライト抽出
    UC->>YDS: extractHighlights(monthlySummaries)
    YDS-->>UC: Highlights<br/>{maxIncomeMonth: "2025-03",<br/>maxExpenseMonth: "2025-08",<br/>bestBalanceMonth: "2025-06",<br/>worstBalanceMonth: "2025-12"}

    Note over UC: DTO構築
    UC-->>API: YearlyBalanceResponseDto

    API->>API: ResponseDTOに変換
    API-->>FE: 200 OK<br/>{YearlyBalanceResponseDto}
    FE->>FE: UI更新<br/>(グラフ描画、サマリー表示)
    FE-->>User: 年間収支レポート表示
```

### ステップ詳細

1. **ユーザーアクション**
   - ユーザーが年間収支レポート画面を開く
   - デフォルトで今年を表示、または年を選択

2. **Frontend バリデーション**
   - 年の形式チェック（数値）
   - 無効な年指定のチェック（1900年未満など）

3. **API リクエスト**
   - エンドポイント: `GET /api/aggregation/yearly-balance?year=2025`
   - クエリパラメータ: `year` (number)

4. **UseCase 実行**
   - 1月〜12月の各月について、FR-016の`CalculateMonthlyBalanceUseCase`を呼び出し
   - 各月のデータを取得
   - 年間サマリーを計算（合計・平均・貯蓄率）
   - トレンド分析を実行（収入・支出・収支それぞれ）
   - ハイライト情報を抽出

5. **Domain Service 実行**
   - `calculateAnnualSummary()`: 年間サマリーを計算
   - `analyzeTrend()`: トレンド分析を実行（線形回帰による傾き・標準偏差・方向判定）
   - `extractHighlights()`: ハイライト情報を抽出

6. **レスポンス**
   - ResponseDTO: `YearlyBalanceResponseDto`
   - HTTPステータス: 200 OK

### データが存在しない場合のフロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController
    participant UC as CalculateYearlyBalanceUseCase
    participant MonthlyUC as CalculateMonthlyBalanceUseCase
    participant Repo as TransactionRepository
    participant DB as Database/File

    User->>FE: 年間収支レポート画面を開く<br/>(2025年を指定)
    FE->>API: GET /api/aggregation/yearly-balance?year=2025

    API->>UC: execute(2025)

    Note over UC: 対象年全体のデータを一度に取得<br/>(データが存在しない場合)
    UC->>Repo: findByDateRange(2025-01-01, 2025-12-31)
    Repo->>DB: データ読み込み
    DB-->>Repo: [] (空配列)
    Repo-->>UC: [] (空配列)

    Note over UC: メモリ上で月別に集計<br/>(すべて空データの場合、12ヶ月分すべて空データとして処理)
    loop 1月〜12月
        UC->>UC: 該当月の取引をフィルタリング<br/>(空配列)
        UC->>MDS: calculateBalance([])
        MDS-->>UC: BalanceResult<br/>{income: 0, expense: 0, balance: 0}
        UC->>UC: MonthlyBalanceResponseDtoを構築<br/>{month: "2025-01", income: {...},<br/>expense: {...}, balance: 0}
    end

    Note over UC: データが存在しない場合も<br/>正常な応答として処理
    UC->>YDS: calculateAnnualSummary(monthlySummaries)
    YDS-->>UC: AnnualSummary<br/>{totalIncome: 0, totalExpense: 0,<br/>totalBalance: 0, averageIncome: 0,<br/>averageExpense: 0, savingsRate: 0}

    UC->>YDS: analyzeTrend([])
    YDS-->>UC: TrendAnalysis<br/>{direction: "stable",<br/>changeRate: 0,<br/>standardDeviation: 0}

    UC->>YDS: extractHighlights(monthlySummaries)
    YDS-->>UC: Highlights<br/>{maxIncomeMonth: null,<br/>maxExpenseMonth: null,<br/>bestBalanceMonth: null,<br/>worstBalanceMonth: null}

    UC-->>API: YearlyBalanceResponseDto<br/>{year: 2025, months: [...],<br/>annual: {...}, trend: {...},<br/>highlights: {...}}

    API-->>FE: 200 OK<br/>{YearlyBalanceResponseDto}
    FE->>FE: UI更新<br/>(「データがありません」メッセージ表示)
    FE-->>User: 空データ表示
```

**重要**: データが存在しない場合でも、500エラーではなく200 OKで空データを返す。これは正常なシナリオの一つとして扱う。

### 一部の月にデータが存在しない場合のフロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController
    participant UC as CalculateYearlyBalanceUseCase
    participant MonthlyUC as CalculateMonthlyBalanceUseCase

    User->>FE: 年間収支レポート画面を開く<br/>(2025年を指定)
    FE->>API: GET /api/aggregation/yearly-balance?year=2025

    API->>UC: execute(2025)

    Note over UC: 対象年全体のデータを一度に取得<br/>(一部の月にデータがない場合)
    UC->>Repo: findByDateRange(2025-01-01, 2025-12-31)
    Repo->>DB: データ読み込み
    DB-->>Repo: TransactionEntity[] (一部の月のデータのみ)
    Repo-->>UC: TransactionEntity[]

    Note over UC: メモリ上で月別に集計<br/>(データが存在する月と存在しない月を処理)
    loop 1月〜12月
        UC->>UC: 該当月の取引をフィルタリング
        alt データが存在する月
            UC->>MDS: calculateBalance(monthlyTransactions)
            MDS-->>UC: BalanceResult
            UC->>UC: MonthlyBalanceResponseDtoを構築<br/>(正常なデータ)
        else データが存在しない月
            UC->>MDS: calculateBalance([])
            MDS-->>UC: BalanceResult<br/>{income: 0, expense: 0, balance: 0}
            UC->>UC: MonthlyBalanceResponseDtoを構築<br/>{month: "2025-02", income: {...},<br/>expense: {...}, balance: 0}
        end
    end

    Note over UC: データが存在する月のみで<br/>年間サマリー・トレンド分析を実行
    UC->>YDS: calculateAnnualSummary(monthlySummaries)
    YDS-->>UC: AnnualSummary<br/>(データが存在する月のみで計算)

    UC->>YDS: analyzeTrend(incomeAmounts)
    YDS-->>UC: TrendAnalysis<br/>(データが存在する月のみで計算)

    UC-->>API: YearlyBalanceResponseDto<br/>(12ヶ月分すべて含む、<br/>データがない月はbalance: 0)

    API-->>FE: 200 OK<br/>{YearlyBalanceResponseDto}
    FE-->>User: 年間収支レポート表示<br/>(データがない月も含めて表示)
```

**重要**: 一部の月にデータが存在しない場合でも、その月は空データ（balance: 0）として扱い、エラーにはしない。年間サマリー・トレンド分析は、データが存在する月のみで計算する。

---

## エラーハンドリングフロー

### バリデーションエラー（400 Bad Request）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController

    User->>FE: 年間収支レポート画面を開く<br/>(無効な年を指定: year=1800)
    FE->>FE: バリデーション<br/>(year < 1900 を検出)
    FE->>API: GET /api/aggregation/yearly-balance?year=1800

    API->>API: リクエスト検証<br/>(year < 1900 を検出)
    API-->>FE: 400 Bad Request<br/>{success: false, error: {code: "VALIDATION_ERROR",<br/>message: "Validation failed",<br/>details: [{field: "year", message: "Year must be >= 1900"}]},<br/>metadata: {timestamp: "...", version: "1.0.0"}}
    FE-->>User: エラーメッセージ表示
```

### サーバーエラー（500 Internal Server Error）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController
    participant UC as CalculateYearlyBalanceUseCase
    participant Repo as TransactionRepository
    participant DB as Database/File

    User->>FE: 年間収支レポート画面を開く<br/>(2025年を指定)
    FE->>API: GET /api/aggregation/yearly-balance?year=2025

    API->>UC: execute(2025)

    UC->>Repo: findByDateRange(2025-01-01, 2025-12-31)
    Repo->>DB: データ読み込み
    DB-->>Repo: Error (DB接続失敗)
    Repo-->>UC: throw DatabaseConnectionError
    UC-->>API: throw DatabaseConnectionError
    API->>API: エラーハンドリング<br/>(500 Internal Server Error)
    API-->>FE: 500 Internal Server Error<br/>{success: false, error: {code: "DATABASE_CONNECTION_ERROR",<br/>message: "Internal server error"},<br/>metadata: {timestamp: "...", version: "1.0.0"}}
    FE-->>User: エラーメッセージ表示
```

### エラーレスポンス形式

すべてのエラーレスポンスは、プロジェクトで定義されている標準形式（`libs/types/src/api/error-response.ts`）に従う：

```typescript
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ErrorDetail[];
  };
  metadata: {
    timestamp: string;
    version: string;
  };
}
```

### エラー分類

| HTTPステータス | エラーコード                | 説明                   | 例                         |
| -------------- | --------------------------- | ---------------------- | -------------------------- |
| 400            | `VALIDATION_ERROR`          | バリデーションエラー   | 無効な年指定（1800年など） |
| 500            | `DATABASE_CONNECTION_ERROR` | データベース接続エラー | DB接続失敗                 |
| 500            | `INTERNAL_SERVER_ERROR`     | 予期しないエラー       | その他の内部エラー         |

---

## チェックリスト

シーケンス図作成時の確認事項：

### 必須項目

- [x] 正常系フローが記載されている
- [x] 異常系フローが記載されている
- [x] 各ステップの説明が記載されている
- [x] エラーハンドリングが明確に示されている
- [x] データが存在しない場合の処理が明確
- [x] 一部の月にデータが存在しない場合の処理が明確

### 推奨項目

- [x] 前提条件が記載されている
- [x] 成功時の結果が記載されている
- [x] エラーレスポンス形式が明確
- [x] FR-016のUseCaseを再利用していることが明確

### 注意事項

- [x] 空配列（[]）は正常な応答として扱う（500エラーにしない）
- [x] エラーレスポンスは共通形式に準拠している
- [x] HTTPステータスコードが適切に使い分けられている
- [x] 12ヶ月分のデータ取得がループで表現されている
