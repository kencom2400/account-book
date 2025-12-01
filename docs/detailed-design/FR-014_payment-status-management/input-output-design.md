# 入出力設計

このドキュメントでは、支払いステータス管理機能のAPI仕様とデータモデルを記載しています。

## 目次

1. [APIエンドポイント一覧](#apiエンドポイント一覧)
2. [リクエスト/レスポンス仕様](#リクエストレスポンス仕様)
3. [データモデル定義](#データモデル定義)
4. [エラーレスポンス](#エラーレスポンス)
5. [バリデーションルール](#バリデーションルール)

---

## APIエンドポイント一覧

### 支払いステータス管理 - FR-014

| Method | Path                                                     | 説明                             | 認証     |
| ------ | -------------------------------------------------------- | -------------------------------- | -------- |
| PUT    | `/api/payment-status/:cardSummaryId`                     | ステータスを手動更新             | 将来対応 |
| GET    | `/api/payment-status/:cardSummaryId`                     | 現在のステータスを取得           | 将来対応 |
| GET    | `/api/payment-status/:cardSummaryId/history`             | ステータス変更履歴を取得         | 将来対応 |
| GET    | `/api/payment-status/:cardSummaryId/allowed-transitions` | 遷移可能なステータスリストを取得 | 将来対応 |
| GET    | `/api/payment-status`                                    | ステータス一覧を取得             | 将来対応 |

### 補足

- **認証**: JWT トークンによる Bearer 認証（将来対応）
- **レート制限**: 1分間に60リクエストまで（将来対応）
- **ページネーション**: `?page=1&limit=20`（将来対応）

---

## リクエスト/レスポンス仕様

### PUT /api/payment-status/:cardSummaryId

ステータスを手動で更新します。

**Path Parameters:**

| パラメータ    | 型     | 必須 | 説明         |
| ------------- | ------ | ---- | ------------ |
| cardSummaryId | string | ✅   | カード集計ID |

**Request Body:**

```json
{
  "newStatus": "MANUAL_CONFIRMED",
  "notes": "手動で確認完了しました"
}
```

**Request Schema (UpdatePaymentStatusRequestDto):**

| フィールド | 型     | 必須 | 説明             | 制約                 |
| ---------- | ------ | ---- | ---------------- | -------------------- |
| newStatus  | string | ✅   | 新しいステータス | PaymentStatus Enum値 |
| notes      | string | ⬜   | ユーザー入力メモ | 最大1000文字         |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "9d1e8891-9647-42f9-a169-929eb3e02c99",
    "cardSummaryId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "status": "MANUAL_CONFIRMED",
    "previousStatus": "DISPUTED",
    "updatedAt": "2025-01-27T10:30:00.000Z",
    "updatedBy": "user",
    "reason": "手動で確認完了",
    "reconciliationId": null,
    "notes": "手動で確認完了しました",
    "createdAt": "2025-01-27T10:30:00.000Z"
  }
}
```

**Response Schema (PaymentStatusResponseDto):**

| フィールド       | 型     | 説明                             |
| ---------------- | ------ | -------------------------------- |
| id               | string | ステータス記録ID（UUID）         |
| cardSummaryId    | string | カード集計ID（UUID）             |
| status           | string | 現在のステータス                 |
| previousStatus   | string | 前のステータス（任意）           |
| updatedAt        | string | 更新日時（ISO8601）              |
| updatedBy        | string | 更新者（'system' または 'user'） |
| reason           | string | ステータス変更理由（任意）       |
| reconciliationId | string | 照合ID（任意、FR-013）           |
| notes            | string | ユーザー入力メモ（任意）         |
| createdAt        | string | 作成日時（ISO8601）              |

**Error Responses:**

- `400 Bad Request`: バリデーションエラー、無効なステータス遷移
- `404 Not Found`: 請求データが見つからない
- `409 Conflict`: 同時更新の競合
- `500 Internal Server Error`: サーバーエラー

**TypeScript型定義:**

```typescript
// Request DTO (class)
export class UpdatePaymentStatusRequestDto {
  newStatus: PaymentStatus;
  notes?: string;
}

// Response DTO (interface)
export interface PaymentStatusResponseDto {
  id: string;
  cardSummaryId: string;
  status: string;
  previousStatus?: string;
  updatedAt: string;
  updatedBy: 'system' | 'user';
  reason?: string;
  reconciliationId?: string;
  notes?: string;
  createdAt: string;
}
```

---

### GET /api/payment-status/:cardSummaryId

現在のステータスを取得します。

**Path Parameters:**

| パラメータ    | 型     | 必須 | 説明         |
| ------------- | ------ | ---- | ------------ |
| cardSummaryId | string | ✅   | カード集計ID |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "9d1e8891-9647-42f9-a169-929eb3e02c99",
    "cardSummaryId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "status": "PROCESSING",
    "previousStatus": "PENDING",
    "updatedAt": "2025-01-27T00:00:00.000Z",
    "updatedBy": "system",
    "reason": "引落予定日の3日前",
    "reconciliationId": null,
    "notes": null,
    "createdAt": "2025-01-27T00:00:00.000Z"
  }
}
```

**Error Responses:**

- `404 Not Found`: ステータス記録が見つからない

---

### GET /api/payment-status/:cardSummaryId/history

ステータス変更履歴を取得します。

**Path Parameters:**

| パラメータ    | 型     | 必須 | 説明         |
| ------------- | ------ | ---- | ------------ |
| cardSummaryId | string | ✅   | カード集計ID |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "cardSummaryId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "statusChanges": [
      {
        "id": "9d1e8891-9647-42f9-a169-929eb3e02c99",
        "status": "MANUAL_CONFIRMED",
        "previousStatus": "DISPUTED",
        "updatedAt": "2025-01-27T10:30:00.000Z",
        "updatedBy": "user",
        "reason": "手動で確認完了",
        "reconciliationId": null,
        "notes": "手動で確認完了しました",
        "createdAt": "2025-01-27T10:30:00.000Z"
      },
      {
        "id": "8c0d7780-8536-51ef-b058-f18da2d01bf8",
        "status": "DISPUTED",
        "previousStatus": "PROCESSING",
        "updatedAt": "2025-01-27T09:00:00.000Z",
        "updatedBy": "system",
        "reason": "照合失敗",
        "reconciliationId": "recon-001",
        "notes": null,
        "createdAt": "2025-01-27T09:00:00.000Z"
      },
      {
        "id": "7b9c6679-7425-40de-944b-e07fc1f90ae7",
        "status": "PROCESSING",
        "previousStatus": "PENDING",
        "updatedAt": "2025-01-27T00:00:00.000Z",
        "updatedBy": "system",
        "reason": "引落予定日の3日前",
        "reconciliationId": null,
        "notes": null,
        "createdAt": "2025-01-27T00:00:00.000Z"
      },
      {
        "id": "6a8b5568-6314-2fcd-833a-d06eb0e80ad6",
        "status": "PENDING",
        "previousStatus": null,
        "updatedAt": "2025-01-26T12:00:00.000Z",
        "updatedBy": "system",
        "reason": "請求確定時",
        "reconciliationId": null,
        "notes": null,
        "createdAt": "2025-01-26T12:00:00.000Z"
      }
    ]
  }
}
```

**Response Schema (PaymentStatusHistoryResponseDto):**

| フィールド    | 型                       | 説明                   |
| ------------- | ------------------------ | ---------------------- |
| cardSummaryId | string                   | カード集計ID（UUID）   |
| statusChanges | PaymentStatusRecordDto[] | ステータス変更履歴配列 |

**PaymentStatusRecordDto:**

| フィールド       | 型     | 説明                             |
| ---------------- | ------ | -------------------------------- |
| id               | string | ステータス記録ID（UUID）         |
| status           | string | ステータス                       |
| previousStatus   | string | 前のステータス（任意）           |
| updatedAt        | string | 更新日時（ISO8601）              |
| updatedBy        | string | 更新者（'system' または 'user'） |
| reason           | string | ステータス変更理由（任意）       |
| reconciliationId | string | 照合ID（任意、FR-013）           |
| notes            | string | ユーザー入力メモ（任意）         |
| createdAt        | string | 作成日時（ISO8601）              |

**注意**: 履歴は時系列順（新しい順）で返却されます。

**Error Responses:**

- `404 Not Found`: 請求データが見つからない

---

### GET /api/payment-status

ステータス一覧を取得します（フィルタ対応）。

**Query Parameters:**

| パラメータ    | 型     | 必須 | デフォルト | 説明                   |
| ------------- | ------ | ---- | ---------- | ---------------------- |
| status        | string | ⬜   | -          | ステータスでフィルタ   |
| cardSummaryId | string | ⬜   | -          | カード集計IDでフィルタ |
| page          | number | ⬜   | 1          | ページ番号（将来対応） |
| limit         | number | ⬜   | 20         | 1ページあたりの件数    |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "9d1e8891-9647-42f9-a169-929eb3e02c99",
      "cardSummaryId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "status": "PROCESSING",
      "updatedAt": "2025-01-27T00:00:00.000Z",
      "updatedBy": "system"
    },
    {
      "id": "8c0d7780-8536-51ef-b058-f18da2d01bf8",
      "cardSummaryId": "8d0e7780-8536-51ef-b058-f18da2d01bf8",
      "status": "PAID",
      "updatedAt": "2025-01-26T15:00:00.000Z",
      "updatedBy": "system"
    }
  ]
}
```

**Response Schema:**

簡略版DTO（`PaymentStatusListItemDto[]`）を返却します。

| フィールド    | 型     | 説明                     |
| ------------- | ------ | ------------------------ |
| id            | string | ステータス記録ID（UUID） |
| cardSummaryId | string | カード集計ID（UUID）     |
| status        | string | ステータス               |
| updatedAt     | string | 更新日時（ISO8601）      |
| updatedBy     | string | 更新者                   |

---

### GET /api/payment-status/:cardSummaryId/allowed-transitions

遷移可能なステータスリストを取得します（フロントエンド用）。

**Path Parameters:**

| パラメータ    | 型     | 必須 | 説明         |
| ------------- | ------ | ---- | ------------ |
| cardSummaryId | string | ✅   | カード集計ID |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "cardSummaryId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "currentStatus": "PENDING",
    "allowedTransitions": ["PARTIAL", "CANCELLED", "MANUAL_CONFIRMED"]
  }
}
```

**Response Schema (AllowedTransitionsResponseDto):**

| フィールド         | 型       | 説明                       |
| ------------------ | -------- | -------------------------- |
| cardSummaryId      | string   | カード集計ID（UUID）       |
| currentStatus      | string   | 現在のステータス           |
| allowedTransitions | string[] | 遷移可能なステータスリスト |

**注意**: このエンドポイントは、フロントエンドで遷移可能なステータスを動的に取得するために使用します。バックエンドの`PaymentStatusRecord`エンティティの`getAllowedTransitions()`メソッドから取得した結果を返却します（Single Source of Truth）。

**Error Responses:**

- `404 Not Found`: ステータス記録が見つからない

---

## データモデル定義

### PaymentStatusRecord Entity

```typescript
export interface PaymentStatusRecord {
  id: string; // UUID
  cardSummaryId: string; // カード集計ID（UUID）
  status: PaymentStatus; // 現在のステータス
  previousStatus?: PaymentStatus; // 前のステータス
  updatedAt: Date; // 更新日時
  updatedBy: 'system' | 'user'; // 更新者
  reason?: string; // ステータス変更理由
  reconciliationId?: string; // 照合ID（FR-013）
  notes?: string; // ユーザー入力メモ
  createdAt: Date; // 作成日時
}
```

### PaymentStatusHistory Entity

```typescript
export interface PaymentStatusHistory {
  cardSummaryId: string; // カード集計ID（UUID）
  statusChanges: PaymentStatusRecord[]; // ステータス変更履歴
}
```

### Enum定義

```typescript
export enum PaymentStatus {
  PENDING = 'pending', // 未払い（引落前）
  PROCESSING = 'processing', // 処理中（引落予定日前後）
  PAID = 'paid', // 支払済（照合完了）
  OVERDUE = 'overdue', // 延滞（引落日を過ぎても未払い）
  PARTIAL = 'partial', // 一部支払い
  DISPUTED = 'disputed', // 不一致（要確認）
  CANCELLED = 'cancelled', // キャンセル
  MANUAL_CONFIRMED = 'manual_confirmed', // 手動確認済
}
```

---

## エラーレスポンス

### 共通エラーレスポンス形式

```json
{
  "success": false,
  "statusCode": 400,
  "errorCode": "PS001",
  "message": "エラーメッセージ",
  "errors": [
    {
      "field": "field1",
      "message": "field1は必須です"
    }
  ],
  "timestamp": "2025-01-27T00:00:00.000Z",
  "path": "/api/payment-status/:cardSummaryId"
}
```

### HTTPステータスコード

| ステータスコード | 説明                  | 使用例                           |
| ---------------- | --------------------- | -------------------------------- |
| 200              | OK                    | 正常なGET                        |
| 400              | Bad Request           | バリデーションエラー、無効な遷移 |
| 404              | Not Found             | 請求データが見つからない         |
| 409              | Conflict              | 同時更新の競合                   |
| 500              | Internal Server Error | サーバーエラー                   |

### エラーコード一覧

| エラーコード | 説明                     | HTTPステータス |
| ------------ | ------------------------ | -------------- |
| PS001        | 無効なステータス遷移     | 400            |
| PS002        | 請求データが見つからない | 404            |
| PS003        | 更新権限がない           | 403            |
| PS004        | 同時更新の競合           | 409            |

### バリデーションエラー (400)

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "newStatus",
      "value": "INVALID_STATUS",
      "message": "newStatusは有効なPaymentStatus値である必要があります"
    },
    {
      "field": "notes",
      "value": "非常に長いメモ...",
      "message": "notesは最大1000文字である必要があります"
    }
  ]
}
```

### 無効なステータス遷移エラー (400)

```json
{
  "success": false,
  "statusCode": 400,
  "errorCode": "PS001",
  "message": "無効なステータス遷移です",
  "fromStatus": "PAID",
  "toStatus": "PENDING"
}
```

### 請求データ未検出エラー (404)

```json
{
  "success": false,
  "statusCode": 404,
  "errorCode": "PS002",
  "message": "請求データが見つかりません",
  "cardSummaryId": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
}
```

### 同時更新の競合エラー (409)

```json
{
  "success": false,
  "statusCode": 409,
  "errorCode": "PS004",
  "message": "同時更新の競合が発生しました。最新データを再取得して再試行してください",
  "cardSummaryId": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
}
```

---

## バリデーションルール

### UpdatePaymentStatusRequestDto

| フィールド | バリデーション             |
| ---------- | -------------------------- |
| newStatus  | 必須、PaymentStatus Enum値 |
| notes      | 任意、最大1000文字         |

**実装例 (class-validator):**

```typescript
import { IsEnum, IsString, MaxLength, IsOptional } from 'class-validator';
import { PaymentStatus } from '@account-book/types';

export class UpdatePaymentStatusRequestDto {
  @IsEnum(PaymentStatus, {
    message: 'newStatusは有効なPaymentStatus値である必要があります',
  })
  newStatus: PaymentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000, {
    message: 'notesは最大1000文字である必要があります',
  })
  notes?: string;
}
```

### ステータス遷移のバリデーション

- 許可された遷移のみ実行可能
- 無効な遷移の場合は400エラーを返す
- 遷移ルールは`PaymentStatusRecord`エンティティ（ドメイン層）で管理

---

## API使用例

### cURL

```bash
# ステータスを手動更新
curl -X PUT http://localhost:3001/api/payment-status/7c9e6679-7425-40de-944b-e07fc1f90ae7 \
  -H "Content-Type: application/json" \
  -d '{
    "newStatus": "MANUAL_CONFIRMED",
    "notes": "手動で確認完了しました"
  }'

# 現在のステータスを取得
curl -X GET http://localhost:3001/api/payment-status/7c9e6679-7425-40de-944b-e07fc1f90ae7

# ステータス履歴を取得
curl -X GET http://localhost:3001/api/payment-status/7c9e6679-7425-40de-944b-e07fc1f90ae7/history

# ステータス一覧を取得（フィルタ）
curl -X GET "http://localhost:3001/api/payment-status?status=PROCESSING"
```

### TypeScript (Fetch API)

```typescript
// ステータスを手動更新
const response = await fetch(
  'http://localhost:3001/api/payment-status/7c9e6679-7425-40de-944b-e07fc1f90ae7',
  {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      newStatus: 'MANUAL_CONFIRMED',
      notes: '手動で確認完了しました',
    }),
  }
);

const data = await response.json();
console.log(data.data); // PaymentStatusResponseDto

// ステータス履歴を取得
const historyResponse = await fetch(
  'http://localhost:3001/api/payment-status/7c9e6679-7425-40de-944b-e07fc1f90ae7/history'
);

const historyData = await historyResponse.json();
console.log(historyData.data); // PaymentStatusHistoryResponseDto
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
- [x] エラーコードが定義されている

### ドキュメント

- [x] 使用例（cURL/TypeScript）が提供されている
- [x] データモデルが明確に定義されている
- [x] エラーケースが網羅されている
