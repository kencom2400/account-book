# 入出力設計

このドキュメントでは、年間収支推移表示機能のAPI仕様とデータモデルを記載しています。

## 目次

1. [APIエンドポイント一覧](#apiエンドポイント一覧)
2. [リクエスト/レスポンス仕様](#リクエストレスポンス仕様)
3. [データモデル定義](#データモデル定義)
4. [エラーレスポンス](#エラーレスポンス)
5. [バリデーションルール](#バリデーションルール)

---

## APIエンドポイント一覧

### 年間収支推移表示 - FR-020

| Method | Path                              | 説明                   | 認証     |
| ------ | --------------------------------- | ---------------------- | -------- |
| GET    | `/api/aggregation/yearly-balance` | 年間収支推移情報を取得 | 将来対応 |

### 補足

- **認証**: 将来対応（現在は不要）
- **レート制限**: 将来対応
- **ページネーション**: 不要（年単位の集計のため）

---

## リクエスト/レスポンス仕様

### GET /api/aggregation/yearly-balance

指定した年の1年間（12ヶ月）の収支推移を集計し、詳細な分析情報を取得します。

**Query Parameters:**

| パラメータ | 型     | 必須 | デフォルト | 説明           |
| ---------- | ------ | ---- | ---------- | -------------- |
| year       | number | ✅   | -          | 年（例: 2025） |

**Request Example:**

```
GET /api/aggregation/yearly-balance?year=2025
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "year": 2025,
    "months": [
      {
        "month": "2025-01",
        "income": {
          "total": 300000,
          "count": 1,
          "byCategory": [],
          "byInstitution": [],
          "transactions": []
        },
        "expense": {
          "total": 200000,
          "count": 5,
          "byCategory": [],
          "byInstitution": [],
          "transactions": []
        },
        "balance": 100000,
        "savingsRate": 33.33
      },
      {
        "month": "2025-02",
        "income": {
          "total": 300000,
          "count": 1,
          "byCategory": [],
          "byInstitution": [],
          "transactions": []
        },
        "expense": {
          "total": 180000,
          "count": 4,
          "byCategory": [],
          "byInstitution": [],
          "transactions": []
        },
        "balance": 120000,
        "savingsRate": 40.0
      }
    ],
    "annual": {
      "totalIncome": 3600000,
      "totalExpense": 2400000,
      "totalBalance": 1200000,
      "averageIncome": 300000,
      "averageExpense": 200000,
      "savingsRate": 33.33
    },
    "trend": {
      "incomeProgression": {
        "direction": "stable",
        "changeRate": 0.0,
        "standardDeviation": 0
      },
      "expenseProgression": {
        "direction": "decreasing",
        "changeRate": -1.5,
        "standardDeviation": 15000
      },
      "balanceProgression": {
        "direction": "increasing",
        "changeRate": 2.0,
        "standardDeviation": 10000
      }
    },
    "highlights": {
      "maxIncomeMonth": "2025-06",
      "maxExpenseMonth": "2025-12",
      "bestBalanceMonth": "2025-06",
      "worstBalanceMonth": "2025-12"
    }
  }
}
```

**Response Schema (YearlyBalanceResponseDto):**

| フィールド | 型                         | 説明                                                           |
| ---------- | -------------------------- | -------------------------------------------------------------- |
| year       | number                     | 年                                                             |
| months     | MonthlyBalanceSummaryDto[] | 12ヶ月分の月別収支データ（簡略版、`comparison`フィールドなし） |
| annual     | AnnualSummaryData          | 年間サマリー                                                   |
| trend      | TrendData                  | トレンド分析情報                                               |
| highlights | HighlightsData             | ハイライト情報                                                 |

**注意**: `months`配列の要素は`MonthlyBalanceResponseDto`ではなく、`MonthlyBalanceSummaryDto`（簡略版）を使用します。年間集計では月ごとの比較情報（前月比・前年同月比）は不要なため、`comparison`フィールドを除外した簡略版DTOを定義します。

**AnnualSummaryData:**

| フィールド     | 型     | 説明                                                                           |
| -------------- | ------ | ------------------------------------------------------------------------------ |
| totalIncome    | number | 年間収入合計                                                                   |
| totalExpense   | number | 年間支出合計                                                                   |
| totalBalance   | number | 年間収支差額（totalIncome - totalExpense）                                     |
| averageIncome  | number | 月平均収入（totalIncome / 12）                                                 |
| averageExpense | number | 月平均支出（totalExpense / 12）                                                |
| savingsRate    | number | 年間貯蓄率（totalBalance / totalIncome \* 100）。totalIncomeが0の場合は0を返す |

**TrendData:**

| フィールド         | 型            | 説明               |
| ------------------ | ------------- | ------------------ |
| incomeProgression  | TrendAnalysis | 収入のトレンド分析 |
| expenseProgression | TrendAnalysis | 支出のトレンド分析 |
| balanceProgression | TrendAnalysis | 収支のトレンド分析 |

**TrendAnalysis:**

| フィールド        | 型     | 説明                                                   |
| ----------------- | ------ | ------------------------------------------------------ |
| direction         | string | トレンド方向（"increasing" / "decreasing" / "stable"） |
| changeRate        | number | 傾き（線形回帰の係数）を100倍した値（単位: %/月）      |
| standardDeviation | number | 標準偏差（データのばらつきを表す）                     |

**HighlightsData:**

| フィールド        | 型             | 説明                                                                    |
| ----------------- | -------------- | ----------------------------------------------------------------------- |
| maxIncomeMonth    | string \| null | 最大収入月（YYYY-MM形式、データが存在しない場合はnull）                 |
| maxExpenseMonth   | string \| null | 最大支出月（YYYY-MM形式、データが存在しない場合はnull）                 |
| bestBalanceMonth  | string \| null | 最高収支月（収支が最大の月、YYYY-MM形式、データが存在しない場合はnull） |
| worstBalanceMonth | string \| null | 最低収支月（収支が最小の月、YYYY-MM形式、データが存在しない場合はnull） |

**MonthlyBalanceSummaryDto（新規作成、年間集計用の簡略版）:**

年間集計では月ごとの比較情報（前月比・前年同月比）は不要なため、`MonthlyBalanceResponseDto`から`comparison`フィールドを除外した簡略版DTOを定義します。

| フィールド  | 型                   | 説明                                                        |
| ----------- | -------------------- | ----------------------------------------------------------- |
| month       | string               | 月（YYYY-MM形式）                                           |
| income      | IncomeExpenseSummary | 収入サマリー                                                |
| expense     | IncomeExpenseSummary | 支出サマリー                                                |
| balance     | number               | 収支差額（income - expense）                                |
| savingsRate | number               | 貯蓄率（balance / income \* 100）。incomeが0の場合は0を返す |

**MonthlyBalanceResponseDto（FR-016で定義済み、月別集計APIで使用）:**

詳細は [FR-016の入出力設計](../FR-016_monthly-balance-aggregation/input-output-design.md) を参照。月別集計APIでは`comparison`フィールドを含む完全版を使用します。

**Error Responses:**

- `400 Bad Request`: バリデーションエラー（無効な年指定など）
- `500 Internal Server Error`: サーバーエラー（DB接続失敗など）

**TypeScript型定義:**

```typescript
// Response DTO（interface）
export interface YearlyBalanceResponseDto {
  year: number;
  months: MonthlyBalanceSummaryDto[]; // 年間集計用の簡略版（comparisonフィールドなし）
  annual: AnnualSummaryData;
  trend: TrendData;
  highlights: HighlightsData;
}

// 年間集計用の簡略版DTO（comparisonフィールドを除外）
export interface MonthlyBalanceSummaryDto {
  month: string; // YYYY-MM
  income: IncomeExpenseSummary;
  expense: IncomeExpenseSummary;
  balance: number;
  savingsRate: number;
  // comparisonフィールドは除外（年間集計では不要）
}

// IncomeExpenseSummary（FR-016で定義済み、再利用）
export interface IncomeExpenseSummary {
  total: number;
  count: number;
  byCategory: CategoryBreakdown[];
  byInstitution: InstitutionBreakdown[];
  transactions: TransactionDto[];
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface InstitutionBreakdown {
  institutionId: string;
  institutionName: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface TransactionDto {
  id: string;
  date: string; // ISO8601形式
  amount: number;
  categoryType: string; // CategoryTypeの文字列値
  categoryId: string;
  institutionId: string;
  accountId: string;
  description: string;
}

export interface AnnualSummaryData {
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  averageIncome: number;
  averageExpense: number;
  savingsRate: number;
}

export interface TrendData {
  incomeProgression: TrendAnalysisDto;
  expenseProgression: TrendAnalysisDto;
  balanceProgression: TrendAnalysisDto;
}

// Presentation層のDTO（Domain層のTrendAnalysisとは別物）
export interface TrendAnalysisDto {
  direction: 'increasing' | 'decreasing' | 'stable';
  changeRate: number; // 傾き（線形回帰の係数）を100倍した値
  standardDeviation: number;
}

export interface HighlightsData {
  maxIncomeMonth: string | null; // YYYY-MM形式
  maxExpenseMonth: string | null; // YYYY-MM形式
  bestBalanceMonth: string | null; // YYYY-MM形式
  worstBalanceMonth: string | null; // YYYY-MM形式
}
```

**データが存在しない場合のレスポンス:**

```json
{
  "success": true,
  "data": {
    "year": 2025,
    "months": [
      {
        "month": "2025-01",
        "income": {
          "total": 0,
          "count": 0,
          "byCategory": [],
          "byInstitution": [],
          "transactions": []
        },
        "expense": {
          "total": 0,
          "count": 0,
          "byCategory": [],
          "byInstitution": [],
          "transactions": []
        },
        "balance": 0,
        "savingsRate": 0
      },
      {
        "month": "2025-02",
        "income": {
          "total": 0,
          "count": 0,
          "byCategory": [],
          "byInstitution": [],
          "transactions": []
        },
        "expense": {
          "total": 0,
          "count": 0,
          "byCategory": [],
          "byInstitution": [],
          "transactions": []
        },
        "balance": 0,
        "savingsRate": 0
      },
      {
        "month": "2025-03",
        "income": {
          "total": 0,
          "count": 0,
          "byCategory": [],
          "byInstitution": [],
          "transactions": []
        },
        "expense": {
          "total": 0,
          "count": 0,
          "byCategory": [],
          "byInstitution": [],
          "transactions": []
        },
        "balance": 0,
        "savingsRate": 0
      },
      {
        "month": "2025-04",
        "income": {
          "total": 0,
          "count": 0,
          "byCategory": [],
          "byInstitution": [],
          "transactions": []
        },
        "expense": {
          "total": 0,
          "count": 0,
          "byCategory": [],
          "byInstitution": [],
          "transactions": []
        },
        "balance": 0,
        "savingsRate": 0
      },
      {
        "month": "2025-05",
        "income": {
          "total": 0,
          "count": 0,
          "byCategory": [],
          "byInstitution": [],
          "transactions": []
        },
        "expense": {
          "total": 0,
          "count": 0,
          "byCategory": [],
          "byInstitution": [],
          "transactions": []
        },
        "balance": 0,
        "savingsRate": 0
      },
      {
        "month": "2025-06",
        "income": {
          "total": 0,
          "count": 0,
          "byCategory": [],
          "byInstitution": [],
          "transactions": []
        },
        "expense": {
          "total": 0,
          "count": 0,
          "byCategory": [],
          "byInstitution": [],
          "transactions": []
        },
        "balance": 0,
        "savingsRate": 0
      },
      {
        "month": "2025-07",
        "income": {
          "total": 0,
          "count": 0,
          "byCategory": [],
          "byInstitution": [],
          "transactions": []
        },
        "expense": {
          "total": 0,
          "count": 0,
          "byCategory": [],
          "byInstitution": [],
          "transactions": []
        },
        "balance": 0,
        "savingsRate": 0
      },
      {
        "month": "2025-08",
        "income": {
          "total": 0,
          "count": 0,
          "byCategory": [],
          "byInstitution": [],
          "transactions": []
        },
        "expense": {
          "total": 0,
          "count": 0,
          "byCategory": [],
          "byInstitution": [],
          "transactions": []
        },
        "balance": 0,
        "savingsRate": 0
      },
      {
        "month": "2025-09",
        "income": {
          "total": 0,
          "count": 0,
          "byCategory": [],
          "byInstitution": [],
          "transactions": []
        },
        "expense": {
          "total": 0,
          "count": 0,
          "byCategory": [],
          "byInstitution": [],
          "transactions": []
        },
        "balance": 0,
        "savingsRate": 0
      },
      {
        "month": "2025-10",
        "income": {
          "total": 0,
          "count": 0,
          "byCategory": [],
          "byInstitution": [],
          "transactions": []
        },
        "expense": {
          "total": 0,
          "count": 0,
          "byCategory": [],
          "byInstitution": [],
          "transactions": []
        },
        "balance": 0,
        "savingsRate": 0
      },
      {
        "month": "2025-11",
        "income": {
          "total": 0,
          "count": 0,
          "byCategory": [],
          "byInstitution": [],
          "transactions": []
        },
        "expense": {
          "total": 0,
          "count": 0,
          "byCategory": [],
          "byInstitution": [],
          "transactions": []
        },
        "balance": 0,
        "savingsRate": 0
      },
      {
        "month": "2025-12",
        "income": {
          "total": 0,
          "count": 0,
          "byCategory": [],
          "byInstitution": [],
          "transactions": []
        },
        "expense": {
          "total": 0,
          "count": 0,
          "byCategory": [],
          "byInstitution": [],
          "transactions": []
        },
        "balance": 0,
        "savingsRate": 0
      }
    ],
    "annual": {
      "totalIncome": 0,
      "totalExpense": 0,
      "totalBalance": 0,
      "averageIncome": 0,
      "averageExpense": 0,
      "savingsRate": 0
    },
    "trend": {
      "incomeProgression": {
        "direction": "stable",
        "changeRate": 0,
        "standardDeviation": 0
      },
      "expenseProgression": {
        "direction": "stable",
        "changeRate": 0,
        "standardDeviation": 0
      },
      "balanceProgression": {
        "direction": "stable",
        "changeRate": 0,
        "standardDeviation": 0
      }
    },
    "highlights": {
      "maxIncomeMonth": null,
      "maxExpenseMonth": null,
      "bestBalanceMonth": null,
      "worstBalanceMonth": null
    }
  }
}
```

**重要**: データが存在しない場合でも、500エラーではなく200 OKで空データを返す。これは正常なシナリオの一つとして扱う。

---

## データモデル定義

### TransactionEntity（既存）

```typescript
export interface TransactionEntity {
  id: string;
  date: Date;
  amount: number;
  categoryType: CategoryType; // INCOME, EXPENSE, TRANSFER, REPAYMENT, INVESTMENT
  categoryId: string;
  institutionId: string;
  accountId: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### CategoryType（既存）

```typescript
export enum CategoryType {
  INCOME = 'INCOME', // 収入
  EXPENSE = 'EXPENSE', // 支出
  TRANSFER = 'TRANSFER', // 振替
  REPAYMENT = 'REPAYMENT', // 返済
  INVESTMENT = 'INVESTMENT', // 投資
}
```

### MonthlyBalanceResponseDto（FR-016で定義済み、再利用）

詳細は [FR-016の入出力設計](../FR-016_monthly-balance-aggregation/input-output-design.md) を参照。

---

## エラーレスポンス

### 共通エラーレスポンス形式

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

export interface ErrorDetail {
  field?: string;
  message: string;
  code?: string;
}
```

### エラーレスポンス例

#### 400 Bad Request（バリデーションエラー）

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "year",
        "message": "Year must be >= 1900"
      }
    ]
  },
  "metadata": {
    "timestamp": "2025-01-27T10:00:00.000Z",
    "version": "1.0.0"
  }
}
```

#### 500 Internal Server Error（サーバーエラー）

```json
{
  "success": false,
  "error": {
    "code": "DATABASE_CONNECTION_ERROR",
    "message": "Internal server error"
  },
  "metadata": {
    "timestamp": "2025-01-27T10:00:00.000Z",
    "version": "1.0.0"
  }
}
```

### エラーコード一覧

| エラーコード                | HTTPステータス | 説明                   |
| --------------------------- | -------------- | ---------------------- |
| `VALIDATION_ERROR`          | 400            | バリデーションエラー   |
| `DATABASE_CONNECTION_ERROR` | 500            | データベース接続エラー |
| `INTERNAL_SERVER_ERROR`     | 500            | 予期しないエラー       |

---

## バリデーションルール

### Query Parameters

| パラメータ | ルール               | エラーメッセージ                                |
| ---------- | -------------------- | ----------------------------------------------- |
| year       | 必須、数値、1900以上 | "Year is required and must be a number >= 1900" |

### バリデーション実装例

NestJSのベストプラクティスに従い、`class-validator`と`ValidationPipe`を使用したDTOによるバリデーションを推奨します。

```typescript
// DTOにバリデーションルールを定義
import { IsInt, Min, Type } from 'class-validator';

export class GetYearlyBalanceDto {
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  year: number;
}

// Controller側でのバリデーション
@Get('yearly-balance')
// main.tsでapp.useGlobalPipes(new ValidationPipe({ transform: true }))を適用
async getYearlyBalance(
  @Query() query: GetYearlyBalanceDto,
): Promise<YearlyBalanceResponseDto> {
  // バリデーションはValidationPipeによって自動的に実行される

  // UseCase実行
  return await this.calculateYearlyBalanceUseCase.execute(query.year);
}
```

**補足**:

- `ValidationPipe`は`main.ts`でグローバルに設定することを推奨
- `transform: true`オプションにより、クエリパラメータが自動的に数値に変換される
- バリデーションエラーは自動的に400 Bad Requestとして返される

---

## チェックリスト

入出力設計作成時の確認事項：

### 必須項目

- [x] APIエンドポイントが一覧化されている
- [x] リクエスト/レスポンス仕様が記載されている
- [x] データモデル定義が記載されている
- [x] エラーレスポンス形式が明確
- [x] バリデーションルールが記載されている

### 推奨項目

- [x] TypeScript型定義が記載されている
- [x] レスポンス例が記載されている
- [x] エラーレスポンス例が記載されている
- [x] FR-016のMonthlyBalanceResponseDtoを再利用していることが明確

### 注意事項

- [x] レスポンスDTOは`interface`で定義されている（classではない）
- [x] データが存在しない場合の処理が明確（200 OKで空データを返す）
- [x] エラーレスポンスは共通形式に準拠している
- [x] HTTPステータスコードが適切に使い分けられている
- [x] トレンド分析の計算方法（線形回帰・標準偏差）が明確
