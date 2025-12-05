# 入出力設計（API仕様）

このドキュメントでは、イベントメモ機能（FR-021）のAPI仕様を記載しています。

## 目次

1. [エンドポイント一覧](#エンドポイント一覧)
2. [データモデル](#データモデル)
3. [API詳細](#api詳細)
   - [イベント作成](#イベント作成)
   - [イベント一覧取得](#イベント一覧取得)
   - [イベント詳細取得](#イベント詳細取得)
   - [イベント更新](#イベント更新)
   - [イベント削除](#イベント削除)
   - [日付範囲でのイベント取得](#日付範囲でのイベント取得)
   - [取引との紐付け](#取引との紐付け)
   - [取引との紐付け解除](#取引との紐付け解除)
4. [エラーレスポンス](#エラーレスポンス)
5. [バリデーションルール](#バリデーションルール)

---

## エンドポイント一覧

### Base URL

```
http://localhost:3001/api
```

### エンドポイント

| メソッド | エンドポイント                            | 説明                   | 認証             |
| -------- | ----------------------------------------- | ---------------------- | ---------------- |
| GET      | `/events`                                 | イベント一覧取得       | 必要（将来対応） |
| GET      | `/events/:id`                             | イベント詳細取得       | 必要（将来対応） |
| GET      | `/events/date-range`                      | 日付範囲でイベント取得 | 必要（将来対応） |
| POST     | `/events`                                 | イベント作成           | 必要（将来対応） |
| PUT      | `/events/:id`                             | イベント更新           | 必要（将来対応） |
| DELETE   | `/events/:id`                             | イベント削除           | 必要（将来対応） |
| POST     | `/events/:id/transactions`                | 取引との紐付け         | 必要（将来対応） |
| DELETE   | `/events/:id/transactions/:transactionId` | 取引との紐付け解除     | 必要（将来対応） |

**注意**: 現在は開発フェーズのため認証は実装しませんが、本番環境では必須となります。

---

## データモデル

### EventCategory (Enum)

```typescript
enum EventCategory {
  EDUCATION = 'education', // 就学関連
  PURCHASE = 'purchase', // 高額購入
  TRAVEL = 'travel', // 旅行
  MEDICAL = 'medical', // 医療
  LIFE_EVENT = 'life_event', // ライフイベント
  INVESTMENT = 'investment', // 投資
  OTHER = 'other', // その他
}
```

### EventEntity (Domain Model)

```typescript
interface EventEntity {
  id: string; // UUID
  date: Date; // イベント日付
  title: string; // タイトル（1-100文字）
  description: string | null; // 説明（最大1000文字）
  category: EventCategory; // イベントカテゴリ
  tags: string[]; // タグ（配列）
  relatedTransactionIds: string[]; // 関連取引ID（配列）
  createdAt: Date; // 作成日時
  updatedAt: Date; // 更新日時
}
```

### TransactionDto (Response)

```typescript
interface TransactionDto {
  id: string;
  date: string; // ISO 8601 形式
  amount: number;
  categoryType: string; // CategoryTypeの文字列値
  categoryId: string;
  categoryName: string;
  institutionId: string;
  accountId: string;
  description: string;
}
```

---

## API詳細

### イベント作成

#### POST `/events`

新しいイベントを追加します。

**Request**

- **Content-Type**: `application/json`

```typescript
// CreateEventDto
interface CreateEventRequest {
  date: string; // 必須: イベント日付（ISO 8601形式: YYYY-MM-DD）
  title: string; // 必須: タイトル（1-100文字）
  description?: string | null; // 任意: 説明（最大1000文字）
  category: EventCategory; // 必須: イベントカテゴリ
  tags?: string[]; // 任意: タグ（文字列配列）
}
```

**Request Example**

```json
{
  "date": "2025-04-01",
  "title": "入学式",
  "description": "長男の小学校入学式",
  "category": "education",
  "tags": ["学校", "入学"]
}
```

**Response**

- **Status**: `201 Created`
- **Content-Type**: `application/json`

```typescript
// EventResponseDto
interface EventResponse {
  id: string;
  date: string; // ISO 8601 形式
  title: string;
  description: string | null;
  category: EventCategory;
  tags: string[];
  relatedTransactions: TransactionDto[]; // 関連取引（初期は空配列）
  createdAt: string; // ISO 8601 形式
  updatedAt: string; // ISO 8601 形式
}
```

**Response Example**

```json
{
  "id": "evt_001",
  "date": "2025-04-01",
  "title": "入学式",
  "description": "長男の小学校入学式",
  "category": "education",
  "tags": ["学校", "入学"],
  "relatedTransactions": [],
  "createdAt": "2025-01-27T10:00:00Z",
  "updatedAt": "2025-01-27T10:00:00Z"
}
```

**エラーレスポンス**

| Status | エラー                  | 説明                 |
| ------ | ----------------------- | -------------------- |
| 400    | `VALIDATION_ERROR`      | バリデーションエラー |
| 500    | `INTERNAL_SERVER_ERROR` | サーバーエラー       |

---

### イベント一覧取得

#### GET `/events`

すべてのイベントを取得します。

**Query Parameters**

| パラメータ | 型     | 必須 | 説明                        |
| ---------- | ------ | ---- | --------------------------- |
| `limit`    | number | 任意 | 取得件数（デフォルト: 100） |
| `offset`   | number | 任意 | オフセット（デフォルト: 0） |

**Response**

- **Status**: `200 OK`
- **Content-Type**: `application/json`

```typescript
interface EventListResponse {
  events: EventResponse[];
  total: number; // 総件数
  limit: number;
  offset: number;
}
```

**Response Example**

```json
{
  "events": [
    {
      "id": "evt_001",
      "date": "2025-04-01",
      "title": "入学式",
      "description": "長男の小学校入学式",
      "category": "education",
      "tags": ["学校", "入学"],
      "relatedTransactions": [],
      "createdAt": "2025-01-27T10:00:00Z",
      "updatedAt": "2025-01-27T10:00:00Z"
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

---

### イベント詳細取得

#### GET `/events/:id`

指定したIDのイベント詳細を取得します。

**Path Parameters**

| パラメータ | 型     | 必須 | 説明       |
| ---------- | ------ | ---- | ---------- |
| `id`       | string | 必須 | イベントID |

**Response**

- **Status**: `200 OK`
- **Content-Type**: `application/json`

```typescript
// EventResponseDto（関連取引情報を含む）
interface EventResponse {
  id: string;
  date: string;
  title: string;
  description: string | null;
  category: EventCategory;
  tags: string[];
  relatedTransactions: TransactionDto[]; // 関連取引一覧
  createdAt: string;
  updatedAt: string;
}
```

**Response Example**

```json
{
  "id": "evt_001",
  "date": "2025-04-01",
  "title": "入学式",
  "description": "長男の小学校入学式",
  "category": "education",
  "tags": ["学校", "入学"],
  "relatedTransactions": [
    {
      "id": "txn_001",
      "date": "2025-04-01",
      "amount": 50000,
      "categoryType": "EXPENSE",
      "categoryId": "cat_001",
      "categoryName": "教育費",
      "institutionId": "inst_001",
      "accountId": "acc_001",
      "description": "入学準備費用"
    }
  ],
  "createdAt": "2025-01-27T10:00:00Z",
  "updatedAt": "2025-01-27T10:00:00Z"
}
```

**エラーレスポンス**

| Status | エラー                  | 説明                             |
| ------ | ----------------------- | -------------------------------- |
| 404    | `EVENT_NOT_FOUND`       | 指定されたイベントが見つからない |
| 500    | `INTERNAL_SERVER_ERROR` | サーバーエラー                   |

---

### イベント更新

#### PUT `/events/:id`

既存イベントの情報を更新します。

**Path Parameters**

| パラメータ | 型     | 必須 | 説明       |
| ---------- | ------ | ---- | ---------- |
| `id`       | string | 必須 | イベントID |

**Request**

- **Content-Type**: `application/json`

```typescript
// UpdateEventDto
interface UpdateEventRequest {
  date?: string; // 任意: イベント日付（ISO 8601形式）
  title?: string; // 任意: タイトル（1-100文字）
  description?: string | null; // 任意: 説明（最大1000文字）
  category?: EventCategory; // 任意: イベントカテゴリ
  tags?: string[]; // 任意: タグ（文字列配列）
}
```

**Request Example**

```json
{
  "title": "入学式（更新）",
  "description": "長男の小学校入学式 - 更新"
}
```

**Response**

- **Status**: `200 OK`
- **Content-Type**: `application/json`

```typescript
// EventResponseDto
interface EventResponse {
  id: string;
  date: string;
  title: string;
  description: string | null;
  category: EventCategory;
  tags: string[];
  relatedTransactions: TransactionDto[];
  createdAt: string;
  updatedAt: string;
}
```

**エラーレスポンス**

| Status | エラー                  | 説明                   |
| ------ | ----------------------- | ---------------------- |
| 400    | `VALIDATION_ERROR`      | バリデーションエラー   |
| 404    | `EVENT_NOT_FOUND`       | イベントが見つからない |
| 500    | `INTERNAL_SERVER_ERROR` | サーバーエラー         |

---

### イベント削除

#### DELETE `/events/:id`

イベントを削除します。関連する取引との紐付けも自動的に削除されます（CASCADE）。

**Path Parameters**

| パラメータ | 型     | 必須 | 説明       |
| ---------- | ------ | ---- | ---------- |
| `id`       | string | 必須 | イベントID |

**Response**

- **Status**: `204 No Content`
- **Body**: なし

**エラーレスポンス**

| Status | エラー                  | 説明                             |
| ------ | ----------------------- | -------------------------------- |
| 404    | `EVENT_NOT_FOUND`       | 指定されたイベントが見つからない |
| 500    | `INTERNAL_SERVER_ERROR` | サーバーエラー                   |

---

### 日付範囲でのイベント取得

#### GET `/events/date-range`

指定した日付範囲のイベント一覧を取得します。

**Query Parameters**

| パラメータ  | 型     | 必須 | 説明                               |
| ----------- | ------ | ---- | ---------------------------------- |
| `startDate` | string | 必須 | 開始日（ISO 8601形式: YYYY-MM-DD） |
| `endDate`   | string | 必須 | 終了日（ISO 8601形式: YYYY-MM-DD） |

**Request Example**

```
GET /api/events/date-range?startDate=2025-01-01&endDate=2025-01-31
```

**Response**

- **Status**: `200 OK`
- **Content-Type**: `application/json`

```typescript
interface EventListResponse {
  events: EventResponse[];
  total: number;
  startDate: string;
  endDate: string;
}
```

**Response Example**

```json
{
  "events": [
    {
      "id": "evt_001",
      "date": "2025-01-15",
      "title": "旅行",
      "description": "沖縄旅行",
      "category": "travel",
      "tags": ["旅行", "沖縄"],
      "relatedTransactions": [],
      "createdAt": "2025-01-10T10:00:00Z",
      "updatedAt": "2025-01-10T10:00:00Z"
    }
  ],
  "total": 1,
  "startDate": "2025-01-01",
  "endDate": "2025-01-31"
}
```

**エラーレスポンス**

| Status | エラー                  | 説明                                  |
| ------ | ----------------------- | ------------------------------------- |
| 400    | `INVALID_DATE_RANGE`    | 無効な日付範囲（startDate > endDate） |
| 500    | `INTERNAL_SERVER_ERROR` | サーバーエラー                        |

---

### 取引との紐付け

#### POST `/events/:id/transactions`

イベントと取引を関連付けます。

**Path Parameters**

| パラメータ | 型     | 必須 | 説明       |
| ---------- | ------ | ---- | ---------- |
| `id`       | string | 必須 | イベントID |

**Request**

- **Content-Type**: `application/json`

```typescript
interface LinkTransactionRequest {
  transactionId: string; // 必須: 取引ID
}
```

**Request Example**

```json
{
  "transactionId": "txn_001"
}
```

**Response**

- **Status**: `201 Created`
- **Content-Type**: `application/json`

```typescript
interface LinkTransactionResponse {
  eventId: string;
  transactionId: string;
  linkedAt: string; // ISO 8601 形式
}
```

**Response Example**

```json
{
  "eventId": "evt_001",
  "transactionId": "txn_001",
  "linkedAt": "2025-01-27T10:30:00Z"
}
```

**エラーレスポンス**

| Status | エラー                       | 説明                     |
| ------ | ---------------------------- | ------------------------ |
| 400    | `VALIDATION_ERROR`           | バリデーションエラー     |
| 404    | `EVENT_NOT_FOUND`            | イベントが見つからない   |
| 404    | `TRANSACTION_NOT_FOUND`      | 取引が見つからない       |
| 409    | `DUPLICATE_TRANSACTION_LINK` | 既に紐付けられている取引 |
| 500    | `INTERNAL_SERVER_ERROR`      | サーバーエラー           |

---

### 取引との紐付け解除

#### DELETE `/events/:id/transactions/:transactionId`

イベントと取引の関連付けを解除します。

**Path Parameters**

| パラメータ      | 型     | 必須 | 説明       |
| --------------- | ------ | ---- | ---------- |
| `id`            | string | 必須 | イベントID |
| `transactionId` | string | 必須 | 取引ID     |

**Response**

- **Status**: `204 No Content`
- **Body**: なし

**エラーレスポンス**

| Status | エラー                  | 説明                   |
| ------ | ----------------------- | ---------------------- |
| 404    | `EVENT_NOT_FOUND`       | イベントが見つからない |
| 404    | `TRANSACTION_NOT_FOUND` | 取引が見つからない     |
| 404    | `RELATION_NOT_FOUND`    | 紐付けが見つからない   |
| 500    | `INTERNAL_SERVER_ERROR` | サーバーエラー         |

---

## エラーレスポンス

すべてのエラーレスポンスは、プロジェクトで定義されている標準形式（`libs/types/src/api/error-response.ts`）に従います：

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

### エラーコード一覧

| エラーコード                 | HTTPステータス | 説明                     |
| ---------------------------- | -------------- | ------------------------ |
| `VALIDATION_ERROR`           | 400            | バリデーションエラー     |
| `EVENT_NOT_FOUND`            | 404            | イベントが見つからない   |
| `TRANSACTION_NOT_FOUND`      | 404            | 取引が見つからない       |
| `RELATION_NOT_FOUND`         | 404            | 紐付けが見つからない     |
| `INVALID_DATE_RANGE`         | 400            | 無効な日付範囲           |
| `DUPLICATE_TRANSACTION_LINK` | 409            | 既に紐付けられている取引 |
| `INTERNAL_SERVER_ERROR`      | 500            | サーバー内部エラー       |

### エラーレスポンス例

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "タイトルは必須です",
    "details": [
      {
        "field": "title",
        "message": "タイトルは必須です"
      }
    ]
  },
  "metadata": {
    "timestamp": "2025-01-27T10:00:00Z",
    "version": "1.0.0"
  }
}
```

---

## バリデーションルール

### CreateEventDto / UpdateEventDto

| フィールド    | 型             | 必須 | バリデーションルール                   |
| ------------- | -------------- | ---- | -------------------------------------- |
| `date`        | string         | 必須 | ISO 8601形式（YYYY-MM-DD）、妥当な日付 |
| `title`       | string         | 必須 | 1-100文字                              |
| `description` | string \| null | 任意 | 最大1000文字                           |
| `category`    | EventCategory  | 必須 | EventCategoryの値                      |
| `tags`        | string[]       | 任意 | 各タグは1-50文字、最大10個まで         |

### 日付範囲クエリパラメータ

| パラメータ  | 型     | 必須 | バリデーションルール                   |
| ----------- | ------ | ---- | -------------------------------------- |
| `startDate` | string | 必須 | ISO 8601形式（YYYY-MM-DD）、妥当な日付 |
| `endDate`   | string | 必須 | ISO 8601形式（YYYY-MM-DD）、妥当な日付 |
|             |        |      | `startDate <= endDate` であること      |

### バリデーションエラーメッセージ

| フィールド    | エラー条件            | メッセージ                                |
| ------------- | --------------------- | ----------------------------------------- |
| `date`        | 未入力                | `日付は必須です`                          |
| `date`        | 無効な形式            | `有効な日付を入力してください`            |
| `title`       | 未入力                | `タイトルは必須です`                      |
| `title`       | 1文字未満             | `タイトルは1文字以上で入力してください`   |
| `title`       | 100文字超             | `タイトルは100文字以内で入力してください` |
| `description` | 1000文字超            | `説明は1000文字以内で入力してください`    |
| `category`    | 未入力                | `カテゴリは必須です`                      |
| `category`    | 無効な値              | `有効なカテゴリを選択してください`        |
| `tags`        | 10個超                | `タグは最大10個までです`                  |
| `tags`        | タグが1-50文字以外    | `タグは1-50文字で入力してください`        |
| `startDate`   | `startDate > endDate` | `開始日は終了日以前である必要があります`  |

---

## レスポンス形式の統一

すべての成功レスポンスは、プロジェクトで定義されている標準形式に従います：

```typescript
export interface SuccessResponse<T> {
  success: true;
  data: T;
  metadata: {
    timestamp: string;
    version: string;
  };
}
```

**例**:

```json
{
  "success": true,
  "data": {
    "id": "evt_001",
    "date": "2025-04-01",
    "title": "入学式",
    ...
  },
  "metadata": {
    "timestamp": "2025-01-27T10:00:00Z",
    "version": "1.0.0"
  }
}
```
