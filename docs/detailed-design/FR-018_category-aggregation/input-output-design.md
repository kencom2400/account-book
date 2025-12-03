# 入出力設計

このドキュメントでは、カテゴリ別集計機能のAPI仕様とデータモデルを記載しています。

## 目次

1. [APIエンドポイント一覧](#apiエンドポイント一覧)
2. [リクエスト/レスポンス仕様](#リクエストレスポンス仕様)
3. [データモデル定義](#データモデル定義)
4. [エラーレスポンス](#エラーレスポンス)
5. [バリデーションルール](#バリデーションルール)

---

## APIエンドポイント一覧

### カテゴリ別集計 - FR-018

| Method | Path                        | 説明                     | 認証     |
| ------ | --------------------------- | ------------------------ | -------- |
| GET    | `/api/aggregation/category` | カテゴリ別集計情報を取得 | 将来対応 |

### 補足

- **認証**: 将来対応（現在は不要）
- **レート制限**: 将来対応
- **ページネーション**: 不要（集計結果のため）

---

## リクエスト/レスポンス仕様

### GET /api/aggregation/category

指定した期間の5つの主要カテゴリ（収入・支出・振替・返済・投資）ごとに取引を集計し、詳細な分析情報を取得します。

**Query Parameters:**

| パラメータ   | 型           | 必須 | デフォルト | 説明                                                                                                 |
| ------------ | ------------ | ---- | ---------- | ---------------------------------------------------------------------------------------------------- |
| startDate    | string       | ✅   | -          | 開始日（ISO8601形式、例: 2025-01-01）                                                                |
| endDate      | string       | ✅   | -          | 終了日（ISO8601形式、例: 2025-01-31）                                                                |
| categoryType | CategoryType | ❌   | -          | カテゴリタイプ（INCOME, EXPENSE, TRANSFER, REPAYMENT, INVESTMENT）。指定しない場合は全カテゴリを集計 |

**Request Example（全カテゴリ集計）:**

```
GET /api/aggregation/category?startDate=2025-01-01&endDate=2025-01-31
```

**Request Example（特定カテゴリのみ集計）:**

```
GET /api/aggregation/category?startDate=2025-01-01&endDate=2025-01-31&categoryType=EXPENSE
```

**Response (200 OK) - 全カテゴリ集計の場合:**

```json
{
  "success": true,
  "data": [
    {
      "category": "INCOME",
      "period": {
        "start": "2025-01-01T00:00:00.000Z",
        "end": "2025-01-31T23:59:59.999Z"
      },
      "totalAmount": 300000,
      "transactionCount": 1,
      "subcategories": [
        {
          "subcategory": "給与",
          "subcategoryId": "cat-001",
          "amount": 300000,
          "count": 1,
          "percentage": 100.0,
          "topTransactions": [
            {
              "id": "txn-001",
              "date": "2025-01-25T00:00:00.000Z",
              "amount": 300000,
              "categoryType": "INCOME",
              "categoryId": "cat-001",
              "categoryName": "給与",
              "institutionId": "inst-001",
              "accountId": "acc-001",
              "description": "給与"
            }
          ]
        }
      ],
      "percentage": 45.5,
      "trend": {
        "monthly": [
          {
            "month": "2025-01",
            "amount": 300000,
            "count": 1
          }
        ]
      }
    },
    {
      "category": "EXPENSE",
      "period": {
        "start": "2025-01-01T00:00:00.000Z",
        "end": "2025-01-31T23:59:59.999Z"
      },
      "totalAmount": 200000,
      "transactionCount": 5,
      "subcategories": [
        {
          "subcategory": "食費",
          "subcategoryId": "cat-002",
          "amount": 100000,
          "count": 3,
          "percentage": 50.0,
          "topTransactions": [
            {
              "id": "txn-002",
              "date": "2025-01-10T00:00:00.000Z",
              "amount": 50000,
              "categoryType": "EXPENSE",
              "categoryId": "cat-002",
              "categoryName": "食費",
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
              "categoryName": "食費",
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
              "categoryName": "食費",
              "institutionId": "inst-001",
              "accountId": "acc-001",
              "description": "外食"
            }
          ]
        },
        {
          "subcategory": "交通費",
          "subcategoryId": "cat-003",
          "amount": 50000,
          "count": 1,
          "percentage": 25.0,
          "topTransactions": [
            {
              "id": "txn-005",
              "date": "2025-01-12T00:00:00.000Z",
              "amount": 50000,
              "categoryType": "EXPENSE",
              "categoryId": "cat-003",
              "categoryName": "交通費",
              "institutionId": "inst-002",
              "accountId": "acc-002",
              "description": "電車代"
            }
          ]
        },
        {
          "subcategory": "娯楽",
          "subcategoryId": "cat-004",
          "amount": 50000,
          "count": 1,
          "percentage": 25.0,
          "topTransactions": [
            {
              "id": "txn-006",
              "date": "2025-01-18T00:00:00.000Z",
              "amount": 50000,
              "categoryType": "EXPENSE",
              "categoryId": "cat-004",
              "categoryName": "娯楽",
              "institutionId": "inst-001",
              "accountId": "acc-001",
              "description": "映画"
            }
          ]
        }
      ],
      "percentage": 30.3,
      "trend": {
        "monthly": [
          {
            "month": "2025-01",
            "amount": 200000,
            "count": 5
          }
        ]
      }
    },
    {
      "category": "TRANSFER",
      "period": {
        "start": "2025-01-01T00:00:00.000Z",
        "end": "2025-01-31T23:59:59.999Z"
      },
      "totalAmount": 100000,
      "transactionCount": 2,
      "subcategories": [],
      "percentage": 15.2,
      "trend": {
        "monthly": [
          {
            "month": "2025-01",
            "amount": 100000,
            "count": 2
          }
        ]
      }
    },
    {
      "category": "REPAYMENT",
      "period": {
        "start": "2025-01-01T00:00:00.000Z",
        "end": "2025-01-31T23:59:59.999Z"
      },
      "totalAmount": 50000,
      "transactionCount": 1,
      "subcategories": [],
      "percentage": 7.6,
      "trend": {
        "monthly": [
          {
            "month": "2025-01",
            "amount": 50000,
            "count": 1
          }
        ]
      }
    },
    {
      "category": "INVESTMENT",
      "period": {
        "start": "2025-01-01T00:00:00.000Z",
        "end": "2025-01-31T23:59:59.999Z"
      },
      "totalAmount": 10000,
      "transactionCount": 1,
      "subcategories": [],
      "percentage": 1.5,
      "trend": {
        "monthly": [
          {
            "month": "2025-01",
            "amount": 10000,
            "count": 1
          }
        ]
      }
    }
  ]
}
```

**Response (200 OK) - 特定カテゴリのみ集計の場合:**

```json
{
  "success": true,
  "data": [
    {
      "category": "EXPENSE",
      "period": {
        "start": "2025-01-01T00:00:00.000Z",
        "end": "2025-01-31T23:59:59.999Z"
      },
      "totalAmount": 200000,
      "transactionCount": 5,
      "subcategories": [
        {
          "subcategory": "食費",
          "subcategoryId": "cat-002",
          "amount": 100000,
          "count": 3,
          "percentage": 50.0,
          "topTransactions": [
            {
              "id": "txn-002",
              "date": "2025-01-10T00:00:00.000Z",
              "amount": 50000,
              "categoryType": "EXPENSE",
              "categoryId": "cat-002",
              "categoryName": "食費",
              "institutionId": "inst-002",
              "accountId": "acc-002",
              "description": "スーパー"
            }
          ]
        }
      ],
      "percentage": 100.0,
      "trend": {
        "monthly": [
          {
            "month": "2025-01",
            "amount": 200000,
            "count": 5
          }
        ]
      }
    }
  ]
}
```

**Response Schema (CategoryAggregationResponseDto):**

| フィールド       | 型                   | 説明                                                               |
| ---------------- | -------------------- | ------------------------------------------------------------------ |
| category         | CategoryType         | カテゴリタイプ（INCOME, EXPENSE, TRANSFER, REPAYMENT, INVESTMENT） |
| period           | Period               | 集計期間                                                           |
| totalAmount      | number               | 合計金額                                                           |
| transactionCount | number               | 取引件数                                                           |
| subcategories    | SubcategorySummary[] | サブカテゴリ（費目）別内訳                                         |
| percentage       | number               | 全体に占める割合（%）。categoryTypeが指定されている場合は100.0     |
| trend            | TrendData            | 推移データ（月次推移）                                             |

**Period:**

| フィールド | 型     | 説明                  |
| ---------- | ------ | --------------------- |
| start      | string | 開始日（ISO8601形式） |
| end        | string | 終了日（ISO8601形式） |

**SubcategorySummary:**

| フィールド      | 型               | 説明                              |
| --------------- | ---------------- | --------------------------------- |
| subcategory     | string           | サブカテゴリ名（費目名）          |
| subcategoryId   | string           | サブカテゴリID（カテゴリID）      |
| amount          | number           | 金額                              |
| count           | number           | 件数                              |
| percentage      | number           | カテゴリ内での割合（%）           |
| topTransactions | TransactionDto[] | 金額の大きい取引（最大5件、降順） |

**TrendData:**

| フィールド | 型             | 説明           |
| ---------- | -------------- | -------------- |
| monthly    | MonthlyTrend[] | 月次推移データ |

**MonthlyTrend:**

| フィールド | 型     | 説明              |
| ---------- | ------ | ----------------- |
| month      | string | 月（YYYY-MM形式） |
| amount     | number | 金額              |
| count      | number | 件数              |

**TransactionDto:**

| フィールド    | 型     | 説明                         |
| ------------- | ------ | ---------------------------- |
| id            | string | 取引ID                       |
| date          | string | 日付（ISO8601形式）          |
| amount        | number | 金額                         |
| categoryType  | string | カテゴリタイプ（文字列）     |
| categoryId    | string | カテゴリID                   |
| categoryName  | string | カテゴリ名（サブカテゴリ名） |
| institutionId | string | 金融機関ID                   |
| accountId     | string | 口座ID                       |
| description   | string | 説明                         |

**Error Responses:**

- `400 Bad Request`: バリデーションエラー（無効な期間指定など）
- `500 Internal Server Error`: サーバーエラー（DB接続失敗など）

**TypeScript型定義:**

```typescript
// Response DTO（interface）
// 注意: categoryTypeが指定されていない場合は全カテゴリ（5つ）の配列、
// categoryTypeが指定されている場合は該当カテゴリ（1つ）の配列を返す
export interface CategoryAggregationResponseDto {
  category: CategoryType;
  period: Period;
  totalAmount: number;
  transactionCount: number;
  subcategories: SubcategorySummary[];
  percentage: number; // 全体に占める割合（%）。categoryTypeが指定されている場合は100.0
  trend: TrendData;
}

export interface Period {
  start: string; // ISO8601形式
  end: string; // ISO8601形式
}

export interface SubcategorySummary {
  subcategory: string; // サブカテゴリ名（費目名）
  subcategoryId: string; // サブカテゴリID（カテゴリID）
  amount: number;
  count: number;
  percentage: number; // カテゴリ内での割合（%）
  topTransactions: TransactionDto[]; // 最大5件
}

export interface TrendData {
  monthly: MonthlyTrend[];
}

export interface MonthlyTrend {
  month: string; // YYYY-MM
  amount: number;
  count: number;
}

export interface TransactionDto {
  id: string;
  date: string; // ISO8601形式
  amount: number;
  categoryType: string; // CategoryTypeの文字列値
  categoryId: string;
  categoryName: string; // サブカテゴリ名
  institutionId: string;
  accountId: string;
  description: string;
}

// Request DTO（class）
export class GetCategoryAggregationQueryDto {
  @IsString()
  @IsDateString()
  startDate!: string;

  @IsString()
  @IsDateString()
  @ValidateIf((o) => o.startDate)
  @IsAfter('startDate')
  endDate!: string;

  @IsOptional()
  @IsEnum(CategoryType)
  categoryType?: CategoryType;
}
```

**データが存在しない場合のレスポンス（全カテゴリ集計）:**

```json
{
  "success": true,
  "data": [
    {
      "category": "INCOME",
      "period": {
        "start": "2025-01-01T00:00:00.000Z",
        "end": "2025-01-31T23:59:59.999Z"
      },
      "totalAmount": 0,
      "transactionCount": 0,
      "subcategories": [],
      "percentage": 0,
      "trend": {
        "monthly": []
      }
    },
    {
      "category": "EXPENSE",
      "period": {
        "start": "2025-01-01T00:00:00.000Z",
        "end": "2025-01-31T23:59:59.999Z"
      },
      "totalAmount": 0,
      "transactionCount": 0,
      "subcategories": [],
      "percentage": 0,
      "trend": {
        "monthly": []
      }
    },
    {
      "category": "TRANSFER",
      "period": {
        "start": "2025-01-01T00:00:00.000Z",
        "end": "2025-01-31T23:59:59.999Z"
      },
      "totalAmount": 0,
      "transactionCount": 0,
      "subcategories": [],
      "percentage": 0,
      "trend": {
        "monthly": []
      }
    },
    {
      "category": "REPAYMENT",
      "period": {
        "start": "2025-01-01T00:00:00.000Z",
        "end": "2025-01-31T23:59:59.999Z"
      },
      "totalAmount": 0,
      "transactionCount": 0,
      "subcategories": [],
      "percentage": 0,
      "trend": {
        "monthly": []
      }
    },
    {
      "category": "INVESTMENT",
      "period": {
        "start": "2025-01-01T00:00:00.000Z",
        "end": "2025-01-31T23:59:59.999Z"
      },
      "totalAmount": 0,
      "transactionCount": 0,
      "subcategories": [],
      "percentage": 0,
      "trend": {
        "monthly": []
      }
    }
  ]
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

### CategoryEntity（既存）

```typescript
export interface CategoryEntity {
  id: string;
  name: string;
  type: CategoryType;
  parentId: string | null;
  icon: string | null;
  color: string | null;
  isSystemDefined: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
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
      "field": "startDate",
      "message": "Start date must be before end date"
    }
  ],
  "timestamp": "2025-12-03T10:00:00.000Z",
  "path": "/api/aggregation/category"
}
```

#### 500 Internal Server Error（サーバーエラー）

```json
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error",
  "code": "DATABASE_CONNECTION_ERROR",
  "timestamp": "2025-12-03T10:00:00.000Z",
  "path": "/api/aggregation/category"
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

| パラメータ   | ルール                                         | エラーメッセージ                                                                 |
| ------------ | ---------------------------------------------- | -------------------------------------------------------------------------------- |
| startDate    | 必須、ISO8601形式の日付文字列                  | "Start date is required and must be a valid date"                                |
| endDate      | 必須、ISO8601形式の日付文字列、startDateより後 | "End date is required and must be after start date"                              |
| categoryType | オプション、有効なCategoryType                 | "Category type must be one of: INCOME, EXPENSE, TRANSFER, REPAYMENT, INVESTMENT" |

### バリデーション実装例

NestJSのベストプラクティスに従い、`class-validator`と`ValidationPipe`を使用したDTOによるバリデーションを推奨します。

```typescript
// DTOにバリデーションルールを定義
import { IsString, IsDateString, IsOptional, IsEnum, ValidateIf, IsAfter } from 'class-validator';
import { CategoryType } from '@account-book/types';

export class GetCategoryAggregationQueryDto {
  @IsString()
  @IsDateString()
  startDate!: string;

  @IsString()
  @IsDateString()
  @ValidateIf((o) => o.startDate)
  @IsAfter('startDate')
  endDate!: string;

  @IsOptional()
  @IsEnum(CategoryType)
  categoryType?: CategoryType;
}

// Controller側でのバリデーション
@Get('category')
// main.tsでapp.useGlobalPipes(new ValidationPipe({ transform: true }))を適用
async getCategoryAggregation(
  @Query() query: GetCategoryAggregationQueryDto,
): Promise<CategoryAggregationResponseDto[]> {
  // バリデーションはValidationPipeによって自動的に実行される

  // UseCase実行
  return await this.calculateCategoryAggregationUseCase.execute(
    new Date(query.startDate),
    new Date(query.endDate),
    query.categoryType,
  );
}
```

**補足**:

- `ValidationPipe`は`main.ts`でグローバルに設定することを推奨
- `transform: true`オプションにより、クエリパラメータが自動的に適切な型に変換される
- バリデーションエラーは自動的に400 Bad Requestとして返される
- `IsAfter`デコレータは`class-validator`のカスタムバリデーターとして実装する必要がある（または`@ValidateIf`と組み合わせて実装）

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
- [x] リクエストDTOは`class`で定義されている
- [x] データが存在しない場合の処理が明確（200 OKで空データを返す）
- [x] エラーレスポンスは共通形式に準拠している
- [x] HTTPステータスコードが適切に使い分けられている
- [x] 全カテゴリ集計と特定カテゴリ集計のレスポンス形式が明確
