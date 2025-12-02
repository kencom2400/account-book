# 入出力設計

このドキュメントでは、月別収支集計機能のAPI仕様とデータモデルを記載しています。

## 目次

1. [APIエンドポイント一覧](#apiエンドポイント一覧)
2. [リクエスト/レスポンス仕様](#リクエストレスポンス仕様)
3. [データモデル定義](#データモデル定義)
4. [エラーレスポンス](#エラーレスポンス)
5. [バリデーションルール](#バリデーションルール)

---

## APIエンドポイント一覧

### 月別収支集計 - FR-016

| Method | Path                               | 説明                   | 認証     |
| ------ | ---------------------------------- | ---------------------- | -------- |
| GET    | `/api/aggregation/monthly-balance` | 月別収支集計情報を取得 | 将来対応 |

### 補足

- **認証**: 将来対応（現在は不要）
- **レート制限**: 将来対応
- **ページネーション**: 不要（月単位の集計のため）

---

## リクエスト/レスポンス仕様

### GET /api/aggregation/monthly-balance

指定した月の収入・支出を集計し、詳細な分析情報を取得します。

**Query Parameters:**

| パラメータ | 型     | 必須 | デフォルト | 説明           |
| ---------- | ------ | ---- | ---------- | -------------- |
| year       | number | ✅   | -          | 年（例: 2025） |
| month      | number | ✅   | -          | 月（1-12）     |

**Request Example:**

```
GET /api/aggregation/monthly-balance?year=2025&month=1
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "month": "2025-01",
    "income": {
      "total": 300000,
      "count": 1,
      "byCategory": [
        {
          "categoryId": "cat-001",
          "categoryName": "給与",
          "amount": 300000,
          "count": 1,
          "percentage": 100.0
        }
      ],
      "byInstitution": [
        {
          "institutionId": "inst-001",
          "institutionName": "メインバンク",
          "amount": 300000,
          "count": 1,
          "percentage": 100.0
        }
      ],
      "transactions": [
        {
          "id": "txn-001",
          "date": "2025-01-25T00:00:00.000Z",
          "amount": 300000,
          "categoryType": "INCOME",
          "categoryId": "cat-001",
          "institutionId": "inst-001",
          "accountId": "acc-001",
          "description": "給与"
        }
      ]
    },
    "expense": {
      "total": 200000,
      "count": 5,
      "byCategory": [
        {
          "categoryId": "cat-002",
          "categoryName": "食費",
          "amount": 100000,
          "count": 3,
          "percentage": 50.0
        },
        {
          "categoryId": "cat-003",
          "categoryName": "交通費",
          "amount": 50000,
          "count": 1,
          "percentage": 25.0
        },
        {
          "categoryId": "cat-004",
          "categoryName": "娯楽",
          "amount": 50000,
          "count": 1,
          "percentage": 25.0
        }
      ],
      "byInstitution": [
        {
          "institutionId": "inst-002",
          "institutionName": "クレジットカードA",
          "amount": 150000,
          "count": 3,
          "percentage": 75.0
        },
        {
          "institutionId": "inst-001",
          "institutionName": "メインバンク",
          "amount": 50000,
          "count": 2,
          "percentage": 25.0
        }
      ],
      "transactions": [
        {
          "id": "txn-002",
          "date": "2025-01-10T00:00:00.000Z",
          "amount": 50000,
          "categoryType": "EXPENSE",
          "categoryId": "cat-002",
          "institutionId": "inst-002",
          "accountId": "acc-002",
          "description": "スーパー"
        },
        {
          "id": "txn-003",
          "date": "2025-01-15T00:00:00.000Z",
          "amount": 30000,
          "categoryType": "EXPENSE",
          "categoryId": "cat-002",
          "institutionId": "inst-002",
          "accountId": "acc-002",
          "description": "コンビニ"
        },
        {
          "id": "txn-004",
          "date": "2025-01-20T00:00:00.000Z",
          "amount": 20000,
          "categoryType": "EXPENSE",
          "categoryId": "cat-002",
          "institutionId": "inst-001",
          "accountId": "acc-001",
          "description": "外食"
        },
        {
          "id": "txn-005",
          "date": "2025-01-12T00:00:00.000Z",
          "amount": 50000,
          "categoryType": "EXPENSE",
          "categoryId": "cat-003",
          "institutionId": "inst-002",
          "accountId": "acc-002",
          "description": "電車代"
        },
        {
          "id": "txn-006",
          "date": "2025-01-18T00:00:00.000Z",
          "amount": 50000,
          "categoryType": "EXPENSE",
          "categoryId": "cat-004",
          "institutionId": "inst-001",
          "accountId": "acc-001",
          "description": "映画"
        }
      ]
    },
    "balance": 100000,
    "savingsRate": 33.33,
    "comparison": {
      "previousMonth": {
        "incomeDiff": 20000,
        "expenseDiff": 10000,
        "balanceDiff": 10000,
        "incomeRate": 7.14,
        "expenseRate": 5.26
      },
      "sameMonthLastYear": {
        "incomeDiff": 10000,
        "expenseDiff": 5000,
        "balanceDiff": 5000,
        "incomeRate": 3.45,
        "expenseRate": 2.56
      }
    }
  }
}
```

**Response Schema (MonthlyBalanceResponseDto):**

| フィールド  | 型                   | 説明                                                        |
| ----------- | -------------------- | ----------------------------------------------------------- |
| month       | string               | 月（YYYY-MM形式）                                           |
| income      | IncomeExpenseSummary | 収入サマリー                                                |
| expense     | IncomeExpenseSummary | 支出サマリー                                                |
| balance     | number               | 収支差額（income - expense）                                |
| savingsRate | number               | 貯蓄率（balance / income \* 100）。incomeが0の場合は0を返す |
| comparison  | ComparisonData       | 比較データ（前月比・前年同月比）                            |

**IncomeExpenseSummary:**

| フィールド    | 型                     | 説明                     |
| ------------- | ---------------------- | ------------------------ |
| total         | number                 | 合計額                   |
| count         | number                 | 取引件数                 |
| byCategory    | CategoryBreakdown[]    | カテゴリ別内訳           |
| byInstitution | InstitutionBreakdown[] | 金融機関別内訳           |
| transactions  | TransactionDto[]       | 取引明細（必要に応じて） |

**CategoryBreakdown:**

| フィールド   | 型     | 説明       |
| ------------ | ------ | ---------- |
| categoryId   | string | カテゴリID |
| categoryName | string | カテゴリ名 |
| amount       | number | 金額       |
| count        | number | 件数       |
| percentage   | number | 割合（%）  |

**InstitutionBreakdown:**

| フィールド      | 型     | 説明       |
| --------------- | ------ | ---------- |
| institutionId   | string | 金融機関ID |
| institutionName | string | 金融機関名 |
| amount          | number | 金額       |
| count           | number | 件数       |
| percentage      | number | 割合（%）  |

**ComparisonData:**

| フィールド        | 型                      | 説明                                       |
| ----------------- | ----------------------- | ------------------------------------------ |
| previousMonth     | MonthComparison \| null | 前月比（データが存在しない場合はnull）     |
| sameMonthLastYear | MonthComparison \| null | 前年同月比（データが存在しない場合はnull） |

**MonthComparison:**

| フィールド  | 型     | 説明              |
| ----------- | ------ | ----------------- |
| incomeDiff  | number | 収入の増減額      |
| expenseDiff | number | 支出の増減額      |
| balanceDiff | number | 収支の増減額      |
| incomeRate  | number | 収入の増減率（%） |
| expenseRate | number | 支出の増減率（%） |

**Error Responses:**

- `400 Bad Request`: バリデーションエラー（無効な月指定など）
- `500 Internal Server Error`: サーバーエラー（DB接続失敗など）

**TypeScript型定義:**

```typescript
// Response DTO（interface）
export interface MonthlyBalanceResponseDto {
  month: string; // YYYY-MM
  income: IncomeExpenseSummary;
  expense: IncomeExpenseSummary;
  balance: number;
  savingsRate: number;
  comparison: ComparisonData;
}

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

export interface ComparisonData {
  previousMonth: MonthComparison | null;
  sameMonthLastYear: MonthComparison | null;
}

export interface MonthComparison {
  incomeDiff: number;
  expenseDiff: number;
  balanceDiff: number;
  incomeRate: number;
  expenseRate: number;
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
```

**データが存在しない場合のレスポンス:**

```json
{
  "success": true,
  "data": {
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
    "savingsRate": 0,
    "comparison": {
      "previousMonth": null,
      "sameMonthLastYear": null
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

---

## エラーレスポンス

### 共通エラーレスポンス形式

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

### エラーレスポンス例

#### 400 Bad Request（バリデーションエラー）

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "month",
      "message": "Month must be between 1 and 12"
    }
  ],
  "timestamp": "2025-01-27T10:00:00.000Z",
  "path": "/api/aggregation/monthly-balance"
}
```

#### 500 Internal Server Error（サーバーエラー）

```json
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error",
  "code": "DATABASE_CONNECTION_ERROR",
  "timestamp": "2025-01-27T10:00:00.000Z",
  "path": "/api/aggregation/monthly-balance"
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

| パラメータ | ルール                 | エラーメッセージ                                 |
| ---------- | ---------------------- | ------------------------------------------------ |
| year       | 必須、数値、1900以上   | "Year is required and must be a number >= 1900"  |
| month      | 必須、数値、1-12の範囲 | "Month is required and must be between 1 and 12" |

### バリデーション実装例

NestJSのベストプラクティスに従い、`class-validator`と`ValidationPipe`を使用したDTOによるバリデーションを推奨します。

```typescript
// DTOにバリデーションルールを定義
import { IsInt, Min, Max, Type } from 'class-validator';

export class GetMonthlyBalanceDto {
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  year: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;
}

// Controller側でのバリデーション
@Get('monthly-balance')
// main.tsでapp.useGlobalPipes(new ValidationPipe({ transform: true }))を適用
async getMonthlyBalance(
  @Query() query: GetMonthlyBalanceDto,
): Promise<MonthlyBalanceResponseDto> {
  // バリデーションはValidationPipeによって自動的に実行される

  // UseCase実行
  return await this.calculateMonthlyBalanceUseCase.execute(query.year, query.month);
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

### 注意事項

- [x] レスポンスDTOは`interface`で定義されている（classではない）
- [x] データが存在しない場合の処理が明確（200 OKで空データを返す）
- [x] エラーレスポンスは共通形式に準拠している
- [x] HTTPステータスコードが適切に使い分けられている
