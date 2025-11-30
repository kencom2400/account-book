# 入出力設計

このドキュメントでは、銀行引落額との自動照合機能のAPI仕様とデータモデルを記載しています。

## 目次

1. [APIエンドポイント一覧](#apiエンドポイント一覧)
2. [リクエスト/レスポンス仕様](#リクエストレスポンス仕様)
3. [データモデル定義](#データモデル定義)
4. [エラーレスポンス](#エラーレスポンス)
5. [バリデーションルール](#バリデーションルール)

---

## APIエンドポイント一覧

### クレジットカード照合 - FR-013

| Method | Path                       | 説明                     | 認証     |
| ------ | -------------------------- | ------------------------ | -------- |
| POST   | `/api/reconciliations`     | クレジットカード照合実行 | 将来対応 |
| GET    | `/api/reconciliations`     | 照合結果一覧を取得       | 将来対応 |
| GET    | `/api/reconciliations/:id` | 照合結果詳細を取得       | 将来対応 |

**補足**:

- 一覧取得時の絞り込みはクエリパラメータで行う（例: `?cardId=...&billingMonth=...`）
- RESTfulな設計原則に基づき、リソース名を複数形（`reconciliations`）で統一

### 補足

- **認証**: JWT トークンによる Bearer 認証（将来対応）
- **レート制限**: 1分間に60リクエストまで（将来対応）
- **ページネーション**: `?page=1&limit=20`（将来対応）

---

## リクエスト/レスポンス仕様

### POST /api/reconciliations

クレジットカードの月別集計額と銀行引落額を照合します。

**Request Body:**

```json
{
  "cardId": "550e8400-e29b-41d4-a716-446655440000",
  "billingMonth": "2025-01"
}
```

**Request Schema (ReconcileCreditCardRequestDto):**

| フィールド   | 型     | 必須 | 説明               | 制約        |
| ------------ | ------ | ---- | ------------------ | ----------- |
| cardId       | string | ✅   | クレジットカードID | UUID形式    |
| billingMonth | string | ✅   | 請求月             | YYYY-MM形式 |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "cardId": "550e8400-e29b-41d4-a716-446655440000",
    "billingMonth": "2025-01",
    "status": "MATCHED",
    "executedAt": "2025-01-30T00:00:00.000Z",
    "results": [
      {
        "isMatched": true,
        "confidence": 100,
        "bankTransactionId": "tx-bank-001",
        "cardSummaryId": "summary-001",
        "matchedAt": "2025-01-30T00:00:00.000Z",
        "discrepancy": null
      }
    ],
    "summary": {
      "total": 1,
      "matched": 1,
      "unmatched": 0,
      "partial": 0
    },
    "createdAt": "2025-01-30T00:00:00.000Z",
    "updatedAt": "2025-01-30T00:00:00.000Z"
  }
}
```

**Response Schema (ReconciliationResponseDto):**

| フィールド   | 型                        | 説明                       |
| ------------ | ------------------------- | -------------------------- |
| id           | string                    | 照合結果ID（UUID）         |
| cardId       | string                    | クレジットカードID（UUID） |
| billingMonth | string                    | 請求月（YYYY-MM）          |
| status       | string                    | 照合ステータス             |
| executedAt   | string                    | 照合実行日時（ISO8601）    |
| results      | ReconciliationResultDto[] | 照合結果リスト             |
| summary      | ReconciliationSummaryDto  | 照合サマリー               |
| createdAt    | string                    | 作成日時（ISO8601）        |
| updatedAt    | string                    | 更新日時（ISO8601）        |

**ReconciliationResultDto:**

| フィールド        | 型                     | 説明                   |
| ----------------- | ---------------------- | ---------------------- |
| isMatched         | boolean                | 一致フラグ             |
| confidence        | number                 | 信頼度スコア（0-100）  |
| bankTransactionId | string \| null         | 銀行取引ID（一致時）   |
| cardSummaryId     | string                 | カード月別集計ID       |
| matchedAt         | string \| null         | 一致日時（一致時）     |
| discrepancy       | DiscrepancyDto \| null | 不一致詳細（不一致時） |

**ReconciliationSummaryDto:**

| フィールド | 型     | 説明         |
| ---------- | ------ | ------------ |
| total      | number | 照合件数合計 |
| matched    | number | 一致件数     |
| unmatched  | number | 不一致件数   |
| partial    | number | 部分一致件数 |

**DiscrepancyDto:**

| フィールド       | 型      | 説明             |
| ---------------- | ------- | ---------------- |
| amountDifference | number  | 金額差（円）     |
| dateDifference   | number  | 日数差（営業日） |
| descriptionMatch | boolean | 摘要一致フラグ   |
| reason           | string  | 不一致理由       |

**Error Responses:**

- `400 Bad Request`: バリデーションエラー
- `404 Not Found`: カード月別集計データが見つからない（RC001）
- `422 Unprocessable Entity`: 引落予定日が未来（RC003）、複数の候補取引が存在（RC004）
- `500 Internal Server Error`: サーバーエラー、データベース接続失敗など予期しないエラー（RC002）

**TypeScript型定義:**

```typescript
// Request DTO (class)
export class ReconcileCreditCardRequestDto {
  cardId: string;
  billingMonth: string;
}

// Response DTO (interface)
export interface ReconciliationResponseDto {
  id: string;
  cardId: string;
  billingMonth: string;
  status: ReconciliationStatus;
  executedAt: string;
  results: ReconciliationResultDto[];
  summary: ReconciliationSummaryDto;
  createdAt: string;
  updatedAt: string;
}

// 一覧取得用DTO（簡略版）
export interface ReconciliationListItemDto {
  id: string;
  cardId: string;
  billingMonth: string;
  status: ReconciliationStatus;
  executedAt: string;
  summary: ReconciliationSummaryDto;
  createdAt: string;
  updatedAt: string;
}

export interface ReconciliationResultDto {
  isMatched: boolean;
  confidence: number;
  bankTransactionId: string | null;
  cardSummaryId: string;
  matchedAt: string | null;
  discrepancy: DiscrepancyDto | null;
}

export interface ReconciliationSummaryDto {
  total: number;
  matched: number;
  unmatched: number;
  partial: number;
}

export interface DiscrepancyDto {
  amountDifference: number;
  dateDifference: number;
  descriptionMatch: boolean;
  reason: string;
}

export enum ReconciliationStatus {
  MATCHED = 'MATCHED',
  UNMATCHED = 'UNMATCHED',
  PARTIAL = 'PARTIAL',
  PENDING = 'PENDING',
}
```

---

### GET /api/reconciliations

照合結果一覧を取得します。

**Query Parameters:**

| パラメータ   | 型     | 必須 | デフォルト | 説明                            |
| ------------ | ------ | ---- | ---------- | ------------------------------- |
| cardId       | string | ⬜   | -          | クレジットカードID（UUID）      |
| billingMonth | string | ⬜   | -          | 請求月（YYYY-MM）               |
| startMonth   | string | ⬜   | -          | 照合開始月（YYYY-MM）           |
| endMonth     | string | ⬜   | -          | 照合終了月（YYYY-MM）           |
| page         | number | ⬜   | 1          | ページ番号（将来対応）          |
| limit        | number | ⬜   | 20         | 1ページあたりの件数（将来対応） |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "cardId": "550e8400-e29b-41d4-a716-446655440000",
      "billingMonth": "2025-01",
      "status": "MATCHED",
      "executedAt": "2025-01-30T00:00:00.000Z",
      "summary": {
        "total": 1,
        "matched": 1,
        "unmatched": 0,
        "partial": 0
      },
      "createdAt": "2025-01-30T00:00:00.000Z",
      "updatedAt": "2025-01-30T00:00:00.000Z"
    }
  ]
}
```

**Response Schema:**

一覧取得用DTO（`ReconciliationListItemDto[]`）を返却します。一覧表示に必要な最小限の情報のみを含みます。

| フィールド | 型                          | 説明       |
| ---------- | --------------------------- | ---------- |
| success    | boolean                     | 成功フラグ |
| data       | ReconciliationListItemDto[] | データ配列 |

**ReconciliationListItemDto:**

| フィールド   | 型                       | 説明                       |
| ------------ | ------------------------ | -------------------------- |
| id           | string                   | 照合結果ID（UUID）         |
| cardId       | string                   | クレジットカードID（UUID） |
| billingMonth | string                   | 請求月（YYYY-MM）          |
| status       | string                   | 照合ステータス             |
| executedAt   | string                   | 照合実行日時（ISO8601）    |
| summary      | ReconciliationSummaryDto | 照合サマリー               |
| createdAt    | string                   | 作成日時（ISO8601）        |
| updatedAt    | string                   | 更新日時（ISO8601）        |

**注意**: 一覧取得では`results`（詳細な照合結果リスト）は省略され、詳細取得（`GET /:id`）で取得可能です。

**Error Responses:**

- `400 Bad Request`: バリデーションエラー

---

### GET /api/reconciliations/:id

照合結果の詳細を取得します。

**Path Parameters:**

| パラメータ | 型     | 必須 | 説明       |
| ---------- | ------ | ---- | ---------- |
| id         | string | ✅   | 照合結果ID |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "cardId": "550e8400-e29b-41d4-a716-446655440000",
    "billingMonth": "2025-01",
    "status": "MATCHED",
    "executedAt": "2025-01-30T00:00:00.000Z",
    "results": [
      {
        "isMatched": true,
        "confidence": 100,
        "bankTransactionId": "tx-bank-001",
        "cardSummaryId": "summary-001",
        "matchedAt": "2025-01-30T00:00:00.000Z",
        "discrepancy": null
      }
    ],
    "summary": {
      "total": 1,
      "matched": 1,
      "unmatched": 0,
      "partial": 0
    },
    "createdAt": "2025-01-30T00:00:00.000Z",
    "updatedAt": "2025-01-30T00:00:00.000Z"
  }
}
```

**Error Responses:**

- `404 Not Found`: 照合結果が見つからない

---

---

## データモデル定義

### Reconciliation Entity

```typescript
export interface Reconciliation {
  id: string; // UUID
  cardId: string; // クレジットカードID（UUID）
  billingMonth: string; // 請求月（YYYY-MM）
  status: ReconciliationStatus; // 照合ステータス
  executedAt: Date; // 照合実行日時
  results: ReconciliationResult[]; // 照合結果リスト
  summary: ReconciliationSummary; // 照合サマリー
  createdAt: Date; // 作成日時
  updatedAt: Date; // 更新日時
}
```

### ReconciliationResult Value Object

```typescript
export interface ReconciliationResult {
  isMatched: boolean; // 一致フラグ
  confidence: number; // 信頼度スコア（0-100）
  bankTransactionId?: string; // 銀行取引ID（一致時）
  cardSummaryId: string; // カード月別集計ID
  matchedAt?: Date; // 一致日時（一致時）
  discrepancy?: Discrepancy; // 不一致詳細（不一致時）
}
```

### ReconciliationSummary Value Object

```typescript
export interface ReconciliationSummary {
  total: number; // 照合件数合計
  matched: number; // 一致件数
  unmatched: number; // 不一致件数
  partial: number; // 部分一致件数
}
```

### Discrepancy Value Object

```typescript
export interface Discrepancy {
  amountDifference: number; // 金額差（円）
  dateDifference: number; // 日数差（営業日）
  descriptionMatch: boolean; // 摘要一致フラグ
  reason: string; // 不一致理由
}
```

### Enum定義

```typescript
export enum ReconciliationStatus {
  MATCHED = 'MATCHED', // 完全一致
  UNMATCHED = 'UNMATCHED', // 不一致
  PARTIAL = 'PARTIAL', // 部分一致（要確認）
  PENDING = 'PENDING', // 照合待ち
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
  "code": "RC001",
  "errors": [
    {
      "field": "field1",
      "message": "field1は必須です"
    }
  ],
  "timestamp": "2025-01-30T00:00:00.000Z",
  "path": "/api/reconciliation/card"
}
```

### HTTPステータスコード

| ステータスコード | 説明                  | 使用例                                          |
| ---------------- | --------------------- | ----------------------------------------------- |
| 200              | OK                    | 正常なGET                                       |
| 201              | Created               | 正常なPOST                                      |
| 400              | Bad Request           | バリデーションエラー                            |
| 404              | Not Found             | カード月別集計データが見つからない（RC001）     |
| 422              | Unprocessable Entity  | 引落予定日が未来（RC003）、複数候補（RC004）    |
| 500              | Internal Server Error | サーバーエラー、銀行取引データ取得失敗（RC002） |

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
      "field": "billingMonth",
      "value": "2025-13",
      "message": "billingMonthはYYYY-MM形式である必要があります"
    }
  ]
}
```

### カード月別集計データ未検出エラー (404 - RC001)

```json
{
  "success": false,
  "statusCode": 404,
  "message": "カード請求データが見つかりません",
  "code": "RC001",
  "cardId": "550e8400-e29b-41d4-a716-446655440000",
  "billingMonth": "2025-01"
}
```

### サーバーエラー (500 - RC002)

```json
{
  "success": false,
  "statusCode": 500,
  "message": "サーバーエラーが発生しました",
  "code": "RC002",
  "cardId": "550e8400-e29b-41d4-a716-446655440000",
  "billingMonth": "2025-01"
}
```

**注意**: 空配列（[]）は正常な応答として扱い、照合対象がない場合は不一致（UNMATCHED）として処理します。RC002はデータベース接続失敗など予期しないエラーの場合のみ返します。

### 引落予定日が未来エラー (422 - RC003)

```json
{
  "success": false,
  "statusCode": 422,
  "message": "引落予定日が未来です。引落日到来後に再実行してください",
  "code": "RC003",
  "paymentDate": "2025-02-27T00:00:00.000Z",
  "currentDate": "2025-01-30T00:00:00.000Z"
}
```

### 複数の候補取引が存在エラー (422 - RC004)

```json
{
  "success": false,
  "statusCode": 422,
  "message": "複数の候補取引が存在します。手動で選択してください",
  "code": "RC004",
  "candidates": [
    {
      "id": "tx-001",
      "date": "2025-01-27T00:00:00.000Z",
      "amount": 50000,
      "description": "カード引落"
    },
    {
      "id": "tx-002",
      "date": "2025-01-28T00:00:00.000Z",
      "amount": 50000,
      "description": "カード引落"
    }
  ]
}
```

---

## バリデーションルール

### ReconcileCreditCardRequestDto

| フィールド   | バリデーション                |
| ------------ | ----------------------------- |
| cardId       | 必須、UUID形式                |
| billingMonth | 必須、YYYY-MM形式、有効な年月 |

**実装例 (class-validator):**

```typescript
import { IsString, IsUUID, Matches } from 'class-validator';

export class ReconcileCreditCardRequestDto {
  @IsUUID()
  cardId: string;

  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'billingMonthはYYYY-MM形式である必要があります',
  })
  billingMonth: string;
}
```

---

## API使用例

### cURL

```bash
# 照合を実行
curl -X POST http://localhost:3001/api/reconciliations \
  -H "Content-Type: application/json" \
  -d '{
    "cardId": "550e8400-e29b-41d4-a716-446655440000",
    "billingMonth": "2025-01"
  }'

# 一覧取得（カードIDで絞り込み）
curl -X GET "http://localhost:3001/api/reconciliations?cardId=550e8400-e29b-41d4-a716-446655440000&startMonth=2025-01&endMonth=2025-03"

# 一覧取得（請求月で絞り込み）
curl -X GET "http://localhost:3001/api/reconciliations?billingMonth=2025-01"

# 詳細取得（照合結果ID）
curl -X GET http://localhost:3001/api/reconciliations/7c9e6679-7425-40de-944b-e07fc1f90ae7
```

### TypeScript (Fetch API)

```typescript
// 照合を実行
const response = await fetch('http://localhost:3001/api/reconciliations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    cardId: '550e8400-e29b-41d4-a716-446655440000',
    billingMonth: '2025-01',
  }),
});

const data = await response.json();
console.log(data.data); // ReconciliationResponseDto
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
- [x] エラーコード（RC001-RC004）が明記されている
- [x] Enum定義がある
- [x] TypeScript型定義が明確

### ドキュメント

- [x] 使用例（cURL/TypeScript）が提供されている
- [x] データモデルが明確に定義されている
- [x] エラーケースが網羅されている
