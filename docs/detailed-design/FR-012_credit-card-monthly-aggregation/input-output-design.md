# 入出力設計

このドキュメントでは、クレジットカード月別集計機能のAPI仕様とデータモデルを記載しています。

## 目次

1. [APIエンドポイント一覧](#apiエンドポイント一覧)
2. [リクエスト/レスポンス仕様](#リクエストレスポンス仕様)
3. [データモデル定義](#データモデル定義)
4. [エラーレスポンス](#エラーレスポンス)
5. [バリデーションルール](#バリデーションルール)

---

## APIエンドポイント一覧

### カード利用明細集計 - FR-012

| Method | Path                                | 説明                       | 認証     |
| ------ | ----------------------------------- | -------------------------- | -------- |
| POST   | `/api/aggregation/card/monthly`     | カード利用明細の月別集計   | 将来対応 |
| GET    | `/api/aggregation/card/monthly`     | 月別集計の一覧を取得       | 将来対応 |
| GET    | `/api/aggregation/card/monthly/:id` | 月別集計の詳細を取得       | 将来対応 |
| DELETE | `/api/aggregation/card/monthly/:id` | 月別集計を削除（将来対応） | 将来対応 |

### 補足

- **認証**: JWT トークンによる Bearer 認証（将来対応）
- **レート制限**: 1分間に60リクエストまで（将来対応）
- **ページネーション**: `?page=1&limit=20`（将来対応）

---

## リクエスト/レスポンス仕様

### POST /api/aggregation/card/monthly

カード利用明細を月別に集計します。

**Request Body:**

```json
{
  "cardId": "550e8400-e29b-41d4-a716-446655440000",
  "startMonth": "2025-01",
  "endMonth": "2025-03",
  "discounts": [
    {
      "type": "POINT",
      "amount": 5000,
      "description": "ポイント利用"
    },
    {
      "type": "CASHBACK",
      "amount": 1000,
      "description": "キャッシュバック"
    }
  ]
}
```

**Request Schema (AggregateCardTransactionsRequestDto):**

| フィールド | 型         | 必須 | 説明                                 | 制約                     |
| ---------- | ---------- | ---- | ------------------------------------ | ------------------------ |
| cardId     | string     | ✅   | クレジットカードID                   | UUID形式                 |
| startMonth | string     | ✅   | 集計開始月                           | YYYY-MM形式              |
| endMonth   | string     | ✅   | 集計終了月                           | YYYY-MM形式              |
| discounts  | Discount[] | ⬜   | 割引・ポイント利用（デフォルト: []） | 配列、各要素はDiscount型 |

**Response (201 Created):**

```json
{
  "success": true,
  "data": [
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "cardId": "550e8400-e29b-41d4-a716-446655440000",
      "cardName": "楽天カード",
      "billingMonth": "2025-01",
      "closingDate": "2025-01-31T00:00:00.000Z",
      "paymentDate": "2025-02-27T00:00:00.000Z",
      "totalAmount": 50000,
      "transactionCount": 15,
      "categoryBreakdown": [
        {
          "category": "食費",
          "amount": 30000,
          "count": 10
        },
        {
          "category": "交通費",
          "amount": 20000,
          "count": 5
        }
      ],
      "transactionIds": ["tx-001", "tx-002", "tx-003"],
      "discounts": [
        {
          "type": "POINT",
          "amount": 5000,
          "description": "ポイント利用"
        }
      ],
      "netPaymentAmount": 45000,
      "status": "PENDING",
      "createdAt": "2025-11-30T00:00:00.000Z",
      "updatedAt": "2025-11-30T00:00:00.000Z"
    },
    {
      "id": "8d0e7780-8536-51ef-b058-f18gd2g01bf8",
      "cardId": "550e8400-e29b-41d4-a716-446655440000",
      "cardName": "楽天カード",
      "billingMonth": "2025-02",
      "closingDate": "2025-02-28T00:00:00.000Z",
      "paymentDate": "2025-03-27T00:00:00.000Z",
      "totalAmount": 60000,
      "transactionCount": 18,
      "categoryBreakdown": [
        {
          "category": "食費",
          "amount": 35000,
          "count": 12
        },
        {
          "category": "娯楽費",
          "amount": 25000,
          "count": 6
        }
      ],
      "transactionIds": ["tx-004", "tx-005"],
      "discounts": [
        {
          "type": "CASHBACK",
          "amount": 1000,
          "description": "キャッシュバック"
        }
      ],
      "netPaymentAmount": 59000,
      "status": "PENDING",
      "createdAt": "2025-11-30T00:00:00.000Z",
      "updatedAt": "2025-11-30T00:00:00.000Z"
    }
  ]
}
```

**Response Schema (MonthlyCardSummaryResponseDto[]):**

| フィールド        | 型               | 説明                       |
| ----------------- | ---------------- | -------------------------- |
| id                | string           | 集計データID（UUID）       |
| cardId            | string           | クレジットカードID（UUID） |
| cardName          | string           | クレジットカード名         |
| billingMonth      | string           | 請求月（YYYY-MM）          |
| closingDate       | string           | 締め日（ISO8601）          |
| paymentDate       | string           | 支払日（ISO8601）          |
| totalAmount       | number           | 合計金額                   |
| transactionCount  | number           | 取引件数                   |
| categoryBreakdown | CategoryAmount[] | カテゴリ別内訳             |
| transactionIds    | string[]         | 取引IDリスト               |
| discounts         | Discount[]       | 割引・ポイント利用         |
| netPaymentAmount  | number           | 最終支払額（割引控除後）   |
| status            | string           | 支払いステータス           |
| createdAt         | string           | 作成日時（ISO8601）        |
| updatedAt         | string           | 更新日時（ISO8601）        |

**Error Responses:**

- `400 Bad Request`: バリデーションエラー
- `404 Not Found`: カードが見つからない、取引データが存在しない
- `500 Internal Server Error`: サーバーエラー

**TypeScript型定義:**

```typescript
// Request DTO (class)
export class AggregateCardTransactionsRequestDto {
  cardId: string;
  startMonth: string;
  endMonth: string;
  discounts?: Discount[];
}

// Response DTO (interface)
export interface MonthlyCardSummaryResponseDto {
  id: string;
  cardId: string;
  cardName: string;
  billingMonth: string;
  closingDate: string;
  paymentDate: string;
  totalAmount: number;
  transactionCount: number;
  categoryBreakdown: CategoryAmount[];
  transactionIds: string[];
  discounts: Discount[];
  netPaymentAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryAmount {
  category: string;
  amount: number;
  count: number;
}

export interface Discount {
  type: DiscountType;
  amount: number;
  description: string;
}

export enum DiscountType {
  POINT = 'POINT',
  CASHBACK = 'CASHBACK',
  CAMPAIGN = 'CAMPAIGN',
}
```

---

### GET /api/aggregation/card/monthly

月別集計の一覧を取得します。

**Query Parameters:**

| パラメータ | 型     | 必須 | デフォルト | 説明                            |
| ---------- | ------ | ---- | ---------- | ------------------------------- |
| cardId     | string | ✅   | -          | クレジットカードID（UUID）      |
| startMonth | string | ⬜   | -          | 集計開始月（YYYY-MM）           |
| endMonth   | string | ⬜   | -          | 集計終了月（YYYY-MM）           |
| page       | number | ⬜   | 1          | ページ番号（将来対応）          |
| limit      | number | ⬜   | 20         | 1ページあたりの件数（将来対応） |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "cardId": "550e8400-e29b-41d4-a716-446655440000",
      "cardName": "楽天カード",
      "billingMonth": "2025-01",
      "closingDate": "2025-01-31T00:00:00.000Z",
      "paymentDate": "2025-02-27T00:00:00.000Z",
      "totalAmount": 50000,
      "transactionCount": 15,
      "netPaymentAmount": 45000,
      "status": "PENDING",
      "createdAt": "2025-11-30T00:00:00.000Z",
      "updatedAt": "2025-11-30T00:00:00.000Z"
    }
  ]
}
```

**Response Schema:**

| フィールド | 型                              | 説明       |
| ---------- | ------------------------------- | ---------- |
| success    | boolean                         | 成功フラグ |
| data       | MonthlyCardSummaryResponseDto[] | データ配列 |

---

### GET /api/aggregation/card/monthly/:id

月別集計の詳細を取得します。

**Path Parameters:**

| パラメータ | 型     | 必須 | 説明         |
| ---------- | ------ | ---- | ------------ |
| id         | string | ✅   | 集計データID |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "cardId": "550e8400-e29b-41d4-a716-446655440000",
    "cardName": "楽天カード",
    "billingMonth": "2025-01",
    "closingDate": "2025-01-31T00:00:00.000Z",
    "paymentDate": "2025-02-27T00:00:00.000Z",
    "totalAmount": 50000,
    "transactionCount": 15,
    "categoryBreakdown": [
      {
        "category": "食費",
        "amount": 30000,
        "count": 10
      }
    ],
    "transactionIds": ["tx-001", "tx-002"],
    "discounts": [
      {
        "type": "POINT",
        "amount": 5000,
        "description": "ポイント利用"
      }
    ],
    "netPaymentAmount": 45000,
    "status": "PENDING",
    "createdAt": "2025-11-30T00:00:00.000Z",
    "updatedAt": "2025-11-30T00:00:00.000Z"
  }
}
```

**Error Responses:**

- `404 Not Found`: 集計データが存在しない

---

## データモデル定義

### MonthlyCardSummary Entity

```typescript
export interface MonthlyCardSummary {
  id: string; // UUID
  cardId: string; // クレジットカードID（UUID）
  cardName: string; // クレジットカード名
  billingMonth: string; // 請求月（YYYY-MM）
  closingDate: Date; // 締め日
  paymentDate: Date; // 支払日
  totalAmount: number; // 合計金額
  transactionCount: number; // 取引件数
  categoryBreakdown: CategoryAmount[]; // カテゴリ別内訳
  transactionIds: string[]; // 取引IDリスト
  discounts: Discount[]; // 割引・ポイント利用
  netPaymentAmount: number; // 最終支払額
  status: PaymentStatus; // 支払いステータス
  createdAt: Date; // 作成日時
  updatedAt: Date; // 更新日時
}
```

### Enum定義

```typescript
export enum PaymentStatus {
  PENDING = 'PENDING', // 未払い（引落前）
  PROCESSING = 'PROCESSING', // 処理中（引落予定日前後）
  PAID = 'PAID', // 支払済（照合完了）
  OVERDUE = 'OVERDUE', // 延滞（引落日を過ぎても未払い）
  PARTIAL = 'PARTIAL', // 一部支払い
  DISPUTED = 'DISPUTED', // 不一致（要確認）
  CANCELLED = 'CANCELLED', // キャンセル
  MANUAL_CONFIRMED = 'MANUAL_CONFIRMED', // 手動確認済
}

export enum DiscountType {
  POINT = 'POINT', // ポイント利用
  CASHBACK = 'CASHBACK', // キャッシュバック
  CAMPAIGN = 'CAMPAIGN', // キャンペーン割引
}
```

### 関連データ構造

```typescript
// カテゴリ別金額
export interface CategoryAmount {
  category: string; // カテゴリ名
  amount: number; // 金額
  count: number; // 件数
}

// 割引・ポイント利用
export interface Discount {
  type: DiscountType; // 割引タイプ
  amount: number; // 割引額
  description: string; // 説明
}
```

---

## エラーレスポンス

### 共通エラーレスポンス形式

```json
{
  "success": false,
  "statusCode": 400,
  "message": "エラーメッセージ",
  "errors": [
    {
      "field": "field1",
      "message": "field1は必須です"
    }
  ],
  "timestamp": "2025-11-30T00:00:00.000Z",
  "path": "/api/aggregation/card/monthly"
}
```

### HTTPステータスコード

| ステータスコード | 説明                  | 使用例                                   |
| ---------------- | --------------------- | ---------------------------------------- |
| 200              | OK                    | 正常なGET                                |
| 201              | Created               | 正常なPOST                               |
| 400              | Bad Request           | バリデーションエラー                     |
| 404              | Not Found             | カードが見つからない、データが存在しない |
| 500              | Internal Server Error | サーバーエラー                           |

### バリデーションエラー (400)

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "cardId",
      "value": "invalid-uuid",
      "message": "cardIdはUUID形式である必要があります"
    },
    {
      "field": "startMonth",
      "value": "2025-13",
      "message": "startMonthはYYYY-MM形式である必要があります"
    },
    {
      "field": "endMonth",
      "value": "2025-01",
      "message": "endMonthはstartMonth以降である必要があります"
    }
  ]
}
```

### カード未検出エラー (404)

```json
{
  "success": false,
  "statusCode": 404,
  "message": "カードが見つかりません",
  "cardId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 取引データ不存在エラー (404)

```json
{
  "success": false,
  "statusCode": 404,
  "message": "指定期間内に取引データが存在しません",
  "cardId": "550e8400-e29b-41d4-a716-446655440000",
  "startMonth": "2025-01",
  "endMonth": "2025-03"
}
```

### 集計データ不存在エラー (404)

```json
{
  "success": false,
  "statusCode": 404,
  "message": "集計データが見つかりません",
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
}
```

---

## バリデーションルール

### AggregateCardTransactionsRequestDto

| フィールド | バリデーション                                |
| ---------- | --------------------------------------------- |
| cardId     | 必須、UUID形式                                |
| startMonth | 必須、YYYY-MM形式、有効な年月                 |
| endMonth   | 必須、YYYY-MM形式、有効な年月、startMonth以降 |
| 期間       | startMonth〜endMonth <= 12ヶ月                |
| discounts  | オプション、配列、各要素はDiscount型          |

**実装例 (class-validator):**

```typescript
import {
  IsString,
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
  Matches,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AggregateCardTransactionsRequestDto {
  @IsUUID()
  cardId: string;

  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'startMonthはYYYY-MM形式である必要があります',
  })
  startMonth: string;

  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'endMonthはYYYY-MM形式である必要があります',
  })
  @Validate(EndMonthAfterStartMonth)
  endMonth: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiscountDto)
  discounts?: DiscountDto[];
}

export class DiscountDto {
  @IsEnum(DiscountType)
  type: DiscountType;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @Length(1, 200)
  description: string;
}
```

---

## API使用例

### cURL

```bash
# 月別集計を実行
curl -X POST http://localhost:3001/api/aggregation/card/monthly \
  -H "Content-Type: application/json" \
  -d '{
    "cardId": "550e8400-e29b-41d4-a716-446655440000",
    "startMonth": "2025-01",
    "endMonth": "2025-03",
    "discounts": [
      {
        "type": "POINT",
        "amount": 5000,
        "description": "ポイント利用"
      }
    ]
  }'

# 一覧取得
curl -X GET "http://localhost:3001/api/aggregation/card/monthly?cardId=550e8400-e29b-41d4-a716-446655440000&startMonth=2025-01&endMonth=2025-03"

# 詳細取得
curl -X GET http://localhost:3001/api/aggregation/card/monthly/7c9e6679-7425-40de-944b-e07fc1f90ae7
```

### TypeScript (Fetch API)

```typescript
// 月別集計を実行
const response = await fetch('http://localhost:3001/api/aggregation/card/monthly', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    cardId: '550e8400-e29b-41d4-a716-446655440000',
    startMonth: '2025-01',
    endMonth: '2025-03',
    discounts: [
      {
        type: 'POINT',
        amount: 5000,
        description: 'ポイント利用',
      },
    ],
  }),
});

const data = await response.json();
console.log(data.data); // MonthlyCardSummary[]
```

---

## チェックリスト

入出力設計作成時の確認事項：

### 基本項目

- [x] すべてのエンドポイントが定義されている
- [x] リクエスト/レスポンスの型が明確
- [x] HTTPメソッドが適切に選択されている
- [x] HTTPステータスコードが適切

### 詳細項目

- [x] バリデーションルールが明確
- [x] エラーレスポンスが定義されている
- [x] Enum定義がある
- [x] TypeScript型定義が明確

### ドキュメント

- [x] 使用例（cURL/TypeScript）が提供されている
- [x] データモデルが明確に定義されている
- [x] エラーケースが網羅されている
