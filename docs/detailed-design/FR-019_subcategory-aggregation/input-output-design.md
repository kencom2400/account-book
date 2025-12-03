# 入出力設計

このドキュメントでは、費目別集計機能のAPI仕様とデータモデルを記載しています。

## 目次

1. [APIエンドポイント一覧](#apiエンドポイント一覧)
2. [リクエスト/レスポンス仕様](#リクエストレスポンス仕様)
3. [データモデル定義](#データモデル定義)
4. [エラーレスポンス](#エラーレスポンス)
5. [バリデーションルール](#バリデーションルール)

---

## APIエンドポイント一覧

### 費目別集計 - FR-019

| Method | Path                           | 説明                 | 認証     |
| ------ | ------------------------------ | -------------------- | -------- |
| GET    | `/api/aggregation/subcategory` | 費目別集計情報を取得 | 将来対応 |

### 補足

- **認証**: 将来対応（現在は不要）
- **レート制限**: 将来対応
- **ページネーション**: 不要（集計結果のため）

---

## リクエスト/レスポンス仕様

### GET /api/aggregation/subcategory

指定した期間の詳細な費目（食費、交通費、医療費等）ごとに取引を集計し、階層構造で分析情報を取得します。

**Query Parameters:**

| パラメータ   | 型           | 必須 | デフォルト | 説明                                                                                                 |
| ------------ | ------------ | ---- | ---------- | ---------------------------------------------------------------------------------------------------- |
| startDate    | string       | ✅   | -          | 開始日（ISO8601形式、例: 2025-01-01）                                                                |
| endDate      | string       | ✅   | -          | 終了日（ISO8601形式、例: 2025-01-31）                                                                |
| categoryType | CategoryType | ❌   | -          | カテゴリタイプ（INCOME, EXPENSE, TRANSFER, REPAYMENT, INVESTMENT）。指定しない場合は全カテゴリを集計 |
| itemId       | string       | ❌   | -          | 費目ID。指定した場合は、該当費目とその子費目のみを集計                                               |

**Request Example（全費目集計）:**

```
GET /api/aggregation/subcategory?startDate=2025-01-01&endDate=2025-01-31
```

**Request Example（特定カテゴリタイプのみ集計）:**

```
GET /api/aggregation/subcategory?startDate=2025-01-01&endDate=2025-01-31&categoryType=EXPENSE
```

**Request Example（特定費目IDを指定）:**

```
GET /api/aggregation/subcategory?startDate=2025-01-01&endDate=2025-01-31&itemId=cat-food
```

**Response (200 OK) - 全費目集計の場合:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "itemName": "食費",
        "itemCode": "FOOD",
        "itemId": "cat-food",
        "parent": null,
        "totalAmount": 100000,
        "transactionCount": 5,
        "averageAmount": 20000,
        "budget": null,
        "budgetUsage": null,
        "children": [
          {
            "itemName": "外食",
            "itemCode": "FOOD_DINING",
            "itemId": "cat-food-dining",
            "parent": "cat-food",
            "totalAmount": 50000,
            "transactionCount": 2,
            "averageAmount": 25000,
            "budget": null,
            "budgetUsage": null,
            "children": [],
            "monthlyTrend": [
              {
                "month": "2025-01",
                "amount": 50000,
                "count": 2
              }
            ],
            "topTransactions": [
              {
                "id": "txn-001",
                "date": "2025-01-10T00:00:00.000Z",
                "amount": 30000,
                "categoryType": "EXPENSE",
                "categoryId": "cat-food-dining",
                "categoryName": "外食",
                "institutionId": "inst-001",
                "accountId": "acc-001",
                "description": "レストラン"
              },
              {
                "id": "txn-002",
                "date": "2025-01-20T00:00:00.000Z",
                "amount": 20000,
                "categoryType": "EXPENSE",
                "categoryId": "cat-food-dining",
                "categoryName": "外食",
                "institutionId": "inst-001",
                "accountId": "acc-001",
                "description": "カフェ"
              }
            ]
          },
          {
            "itemName": "スーパー",
            "itemCode": "FOOD_SUPERMARKET",
            "itemId": "cat-food-supermarket",
            "parent": "cat-food",
            "totalAmount": 30000,
            "transactionCount": 2,
            "averageAmount": 15000,
            "budget": null,
            "budgetUsage": null,
            "children": [],
            "monthlyTrend": [
              {
                "month": "2025-01",
                "amount": 30000,
                "count": 2
              }
            ],
            "topTransactions": [
              {
                "id": "txn-003",
                "date": "2025-01-05T00:00:00.000Z",
                "amount": 20000,
                "categoryType": "EXPENSE",
                "categoryId": "cat-food-supermarket",
                "categoryName": "スーパー",
                "institutionId": "inst-002",
                "accountId": "acc-002",
                "description": "スーパー"
              },
              {
                "id": "txn-004",
                "date": "2025-01-15T00:00:00.000Z",
                "amount": 10000,
                "categoryType": "EXPENSE",
                "categoryId": "cat-food-supermarket",
                "categoryName": "スーパー",
                "institutionId": "inst-002",
                "accountId": "acc-002",
                "description": "スーパー"
              }
            ]
          },
          {
            "itemName": "コンビニ",
            "itemCode": "FOOD_CONVENIENCE",
            "itemId": "cat-food-convenience",
            "parent": "cat-food",
            "totalAmount": 20000,
            "transactionCount": 1,
            "averageAmount": 20000,
            "budget": null,
            "budgetUsage": null,
            "children": [],
            "monthlyTrend": [
              {
                "month": "2025-01",
                "amount": 20000,
                "count": 1
              }
            ],
            "topTransactions": [
              {
                "id": "txn-005",
                "date": "2025-01-25T00:00:00.000Z",
                "amount": 20000,
                "categoryType": "EXPENSE",
                "categoryId": "cat-food-convenience",
                "categoryName": "コンビニ",
                "institutionId": "inst-001",
                "accountId": "acc-001",
                "description": "コンビニ"
              }
            ]
          }
        ],
        "monthlyTrend": [
          {
            "month": "2025-01",
            "amount": 100000,
            "count": 5
          }
        ],
        "topTransactions": [
          {
            "id": "txn-001",
            "date": "2025-01-10T00:00:00.000Z",
            "amount": 30000,
            "categoryType": "EXPENSE",
            "categoryId": "cat-food-dining",
            "categoryName": "外食",
            "institutionId": "inst-001",
            "accountId": "acc-001",
            "description": "レストラン"
          }
        ]
      },
      {
        "itemName": "交通費",
        "itemCode": "TRANSPORT",
        "itemId": "cat-transport",
        "parent": null,
        "totalAmount": 50000,
        "transactionCount": 3,
        "averageAmount": 16666,
        "budget": null,
        "budgetUsage": null,
        "children": [],
        "monthlyTrend": [
          {
            "month": "2025-01",
            "amount": 50000,
            "count": 3
          }
        ],
        "topTransactions": [
          {
            "id": "txn-006",
            "date": "2025-01-12T00:00:00.000Z",
            "amount": 30000,
            "categoryType": "EXPENSE",
            "categoryId": "cat-transport",
            "categoryName": "交通費",
            "institutionId": "inst-002",
            "accountId": "acc-002",
            "description": "電車代"
          }
        ]
      }
    ],
    "period": {
      "start": "2025-01-01T00:00:00.000Z",
      "end": "2025-01-31T23:59:59.999Z"
    },
    "totalAmount": 150000,
    "totalTransactionCount": 8
  }
}
```

**Response (200 OK) - 特定費目IDを指定した場合:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "itemName": "食費",
        "itemCode": "FOOD",
        "itemId": "cat-food",
        "parent": null,
        "totalAmount": 100000,
        "transactionCount": 5,
        "averageAmount": 20000,
        "budget": null,
        "budgetUsage": null,
        "children": [
          {
            "itemName": "外食",
            "itemCode": "FOOD_DINING",
            "itemId": "cat-food-dining",
            "parent": "cat-food",
            "totalAmount": 50000,
            "transactionCount": 2,
            "averageAmount": 25000,
            "budget": null,
            "budgetUsage": null,
            "children": [],
            "monthlyTrend": [
              {
                "month": "2025-01",
                "amount": 50000,
                "count": 2
              }
            ],
            "topTransactions": [
              {
                "id": "txn-001",
                "date": "2025-01-10T00:00:00.000Z",
                "amount": 30000,
                "categoryType": "EXPENSE",
                "categoryId": "cat-food-dining",
                "categoryName": "外食",
                "institutionId": "inst-001",
                "accountId": "acc-001",
                "description": "レストラン"
              }
            ]
          }
        ],
        "monthlyTrend": [
          {
            "month": "2025-01",
            "amount": 100000,
            "count": 5
          }
        ],
        "topTransactions": [
          {
            "id": "txn-001",
            "date": "2025-01-10T00:00:00.000Z",
            "amount": 30000,
            "categoryType": "EXPENSE",
            "categoryId": "cat-food-dining",
            "categoryName": "外食",
            "institutionId": "inst-001",
            "accountId": "acc-001",
            "description": "レストラン"
          }
        ]
      }
    ],
    "period": {
      "start": "2025-01-01T00:00:00.000Z",
      "end": "2025-01-31T23:59:59.999Z"
    },
    "totalAmount": 100000,
    "totalTransactionCount": 5
  }
}
```

**Response (200 OK) - データが存在しない場合:**

```json
{
  "success": true,
  "data": {
    "items": [],
    "period": {
      "start": "2025-01-01T00:00:00.000Z",
      "end": "2025-01-31T23:59:59.999Z"
    },
    "totalAmount": 0,
    "totalTransactionCount": 0
  }
}
```

---

## データモデル定義

### リクエストDTO

#### GetSubcategoryAggregationQueryDto

```typescript
class GetSubcategoryAggregationQueryDto {
  @IsString()
  @IsDateString()
  startDate: string; // ISO8601形式

  @IsString()
  @IsDateString()
  @Validate(IsAfterDate, ['startDate'])
  endDate: string; // ISO8601形式

  @IsOptional()
  @IsEnum(CategoryType)
  categoryType?: CategoryType; // INCOME, EXPENSE, TRANSFER, REPAYMENT, INVESTMENT

  @IsOptional()
  @IsString()
  itemId?: string; // 費目ID
}
```

### レスポンスDTO

#### SubcategoryAggregationResponseDto

```typescript
interface SubcategoryAggregationResponseDto {
  items: ExpenseItemSummary[]; // 費目別サマリー（階層構造を含む）
  period: Period; // 集計期間
  totalAmount: number; // 合計金額
  totalTransactionCount: number; // 合計取引件数
}
```

#### ExpenseItemSummary

```typescript
interface ExpenseItemSummary {
  itemName: string; // 費目名
  itemCode: string; // 費目コード
  itemId: string; // 費目ID
  parent: string | null; // 親費目ID（階層構造）
  totalAmount: number; // 合計金額
  transactionCount: number; // 取引件数
  averageAmount: number; // 平均金額
  budget?: number | null; // 予算（将来対応）
  budgetUsage?: number | null; // 予算消化率%（将来対応）
  children: ExpenseItemSummary[]; // 子費目（階層構造）
  monthlyTrend: MonthlyTrend[]; // 月次推移
  topTransactions: TransactionDto[]; // 主要取引（最大5件）
}
```

#### Period

```typescript
interface Period {
  start: string; // ISO8601形式
  end: string; // ISO8601形式
}
```

#### MonthlyTrend

```typescript
interface MonthlyTrend {
  month: string; // YYYY-MM形式
  amount: number; // 金額
  count: number; // 取引件数
}
```

#### TransactionDto

```typescript
interface TransactionDto {
  id: string;
  date: string; // ISO8601形式
  amount: number;
  categoryType: string; // CategoryTypeの文字列
  categoryId: string;
  categoryName: string;
  institutionId: string;
  accountId: string;
  description: string;
}
```

---

## エラーレスポンス

### バリデーションエラー (400 Bad Request)

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "startDate",
      "message": "startDate must be a valid ISO8601 date string"
    },
    {
      "field": "endDate",
      "message": "endDate must be after startDate"
    }
  ],
  "timestamp": "2025-01-27T10:00:00.000Z",
  "path": "/api/aggregation/subcategory"
}
```

### サーバーエラー (500 Internal Server Error)

```json
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error",
  "code": "AG019_001",
  "timestamp": "2025-01-27T10:00:00.000Z",
  "path": "/api/aggregation/subcategory"
}
```

---

## バリデーションルール

### startDate

- **必須**: ✅
- **型**: `string`
- **形式**: ISO8601形式（例: `2025-01-01`）
- **バリデーション**:
  - 有効な日付形式であること
  - `endDate`より前であること

### endDate

- **必須**: ✅
- **型**: `string`
- **形式**: ISO8601形式（例: `2025-01-31`）
- **バリデーション**:
  - 有効な日付形式であること
  - `startDate`より後であること

### categoryType

- **必須**: ❌
- **型**: `CategoryType` (enum)
- **有効な値**: `INCOME`, `EXPENSE`, `TRANSFER`, `REPAYMENT`, `INVESTMENT`
- **バリデーション**:
  - 有効なCategoryTypeであること

### itemId

- **必須**: ❌
- **型**: `string`
- **バリデーション**:
  - 有効な費目IDであること（存在チェック）

---

## チェックリスト

入出力設計作成時の確認事項：

### 必須項目

- [x] APIエンドポイントが記載されている
- [x] リクエストパラメータが定義されている
- [x] レスポンス形式が定義されている
- [x] エラーレスポンスが定義されている
- [x] バリデーションルールが記載されている

### 推奨項目

- [x] リクエスト/レスポンスの例が記載されている
- [x] データモデル（DTO）が定義されている
- [x] 階層構造が明確に示されている

### 注意事項

- [x] レスポンスDTOは`interface`で定義されている
- [x] リクエストDTOは`class`で定義されている
- [x] 空データは正常な応答として扱う（500エラーにしない）
- [x] 階層構造（`children`プロパティ）が明確に示されている
