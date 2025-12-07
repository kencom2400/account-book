# 入出力設計（API仕様）

このドキュメントでは、イベントと収支の紐付け機能（FR-022）のAPI仕様を記載しています。

## 目次

1. [エンドポイント一覧](#エンドポイント一覧)
2. [データモデル](#データモデル)
3. [API詳細](#api詳細)
   - [関連取引の推奨取得](#関連取引の推奨取得)
   - [イベント別収支サマリー取得](#イベント別収支サマリー取得)
4. [エラーレスポンス](#エラーレスポンス)
5. [バリデーションルール](#バリデーションルール)

---

## エンドポイント一覧

### Base URL

```
http://localhost:3001/api
```

### エンドポイント

| メソッド | エンドポイント                     | 説明                       | 認証             |
| -------- | ---------------------------------- | -------------------------- | ---------------- |
| GET      | `/events/:id/suggest-transactions` | 関連取引の推奨取得         | 必要（将来対応） |
| GET      | `/events/:id/financial-summary`    | イベント別収支サマリー取得 | 必要（将来対応） |

**注意**: 現在は開発フェーズのため認証は実装しませんが、本番環境では必須となります。

---

## データモデル

### SuggestedTransactionDto (Response)

```typescript
interface SuggestedTransactionDto {
  transaction: TransactionDto;
  score: number; // 推奨スコア（0-100）
  reasons: string[]; // 推奨理由の配列
}
```

### EventFinancialSummaryResponseDto (Response)

```typescript
interface EventFinancialSummaryResponseDto {
  event: EventSummaryDto; // relatedTransactionsを除外したイベント情報
  relatedTransactions: TransactionDto[];
  totalIncome: number; // 総収入（円）
  totalExpense: number; // 総支出（円）
  netAmount: number; // 純収支（totalIncome - totalExpense）
  transactionCount: number; // 関連取引件数
}

// 収支サマリー専用のイベント情報（relatedTransactionsを除外）
interface EventSummaryDto {
  id: string;
  date: string; // ISO 8601 形式
  title: string;
  description: string | null;
  category: EventCategory;
  tags: string[];
  createdAt: string; // ISO 8601 形式
  updatedAt: string; // ISO 8601 形式
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

### EventResponseDto (Response)

```typescript
interface EventResponseDto {
  id: string;
  date: string; // ISO 8601 形式
  title: string;
  description: string | null;
  category: EventCategory;
  tags: string[];
  relatedTransactions: TransactionDto[]; // 既存のフィールド（FR-021）
  createdAt: string; // ISO 8601 形式
  updatedAt: string; // ISO 8601 形式
}
```

---

## API詳細

### 関連取引の推奨取得

#### GET `/events/:id/suggest-transactions`

イベントに関連する可能性のある取引を推奨します。

**Path Parameters**

| パラメータ | 型     | 必須 | 説明       |
| ---------- | ------ | ---- | ---------- |
| `id`       | string | 必須 | イベントID |

**Request Example**

```
GET /api/events/evt_001/suggest-transactions
```

**Response**

- **Status**: `200 OK`
- **Content-Type**: `application/json`

```typescript
interface SuggestTransactionsResponse {
  success: true;
  data: SuggestedTransactionDto[];
  metadata: {
    timestamp: string;
    version: string;
  };
}
```

**Response Example**

```json
{
  "success": true,
  "data": [
    {
      "transaction": {
        "id": "txn_001",
        "date": "2025-08-10",
        "amount": -50000,
        "categoryType": "EXPENSE",
        "categoryId": "cat_001",
        "categoryName": "交通費",
        "institutionId": "inst_001",
        "accountId": "acc_001",
        "description": "新幹線代"
      },
      "score": 85,
      "reasons": ["日付が近い（0日差）", "高額取引（5万円以上）", "カテゴリが関連（交通費）"]
    },
    {
      "transaction": {
        "id": "txn_002",
        "date": "2025-08-11",
        "amount": -30000,
        "categoryType": "EXPENSE",
        "categoryId": "cat_002",
        "categoryName": "宿泊費",
        "institutionId": "inst_001",
        "accountId": "acc_001",
        "description": "ホテル代"
      },
      "score": 75,
      "reasons": ["日付が近い（1日差）", "高額取引（3万円以上）", "カテゴリが関連（宿泊費）"]
    }
  ],
  "metadata": {
    "timestamp": "2025-01-27T10:00:00Z",
    "version": "1.0.0"
  }
}
```

**推奨理由の例**

- `"日付が近い（0日差）"`: イベント日付と同じ日
- `"日付が近い（1日差）"`: イベント日付の前後1日
- `"高額取引（5万円以上）"`: 金額が5万円以上
- `"カテゴリが関連（交通費）"`: イベントカテゴリと取引カテゴリが関連

**エラーレスポンス**

| Status | エラー                  | 説明                             |
| ------ | ----------------------- | -------------------------------- |
| 404    | `EVENT_NOT_FOUND`       | 指定されたイベントが見つからない |
| 500    | `INTERNAL_SERVER_ERROR` | サーバーエラー                   |

---

### イベント別収支サマリー取得

#### GET `/events/:id/financial-summary`

イベントに関連付けられた取引の収支を集計します。

**Path Parameters**

| パラメータ | 型     | 必須 | 説明       |
| ---------- | ------ | ---- | ---------- |
| `id`       | string | 必須 | イベントID |

**Request Example**

```
GET /api/events/evt_001/financial-summary
```

**Response**

- **Status**: `200 OK`
- **Content-Type**: `application/json`

```typescript
interface EventFinancialSummaryResponse {
  success: true;
  data: EventFinancialSummaryResponseDto;
  metadata: {
    timestamp: string;
    version: string;
  };
}
```

**Response Example**

```json
{
  "success": true,
  "data": {
    "event": {
      "id": "evt_001",
      "date": "2025-08-10",
      "title": "沖縄旅行",
      "description": "家族旅行",
      "category": "travel",
      "tags": ["旅行", "沖縄"],
      "createdAt": "2025-01-27T10:00:00Z",
      "updatedAt": "2025-01-27T10:00:00Z"
    },
    "relatedTransactions": [
      {
        "id": "txn_001",
        "date": "2025-08-10",
        "amount": -50000,
        "categoryType": "EXPENSE",
        "categoryId": "cat_001",
        "categoryName": "交通費",
        "institutionId": "inst_001",
        "accountId": "acc_001",
        "description": "新幹線代"
      },
      {
        "id": "txn_002",
        "date": "2025-08-11",
        "amount": -30000,
        "categoryType": "EXPENSE",
        "categoryId": "cat_002",
        "categoryName": "宿泊費",
        "institutionId": "inst_001",
        "accountId": "acc_001",
        "description": "ホテル代"
      },
      {
        "id": "txn_003",
        "date": "2025-08-12",
        "amount": -20000,
        "categoryType": "EXPENSE",
        "categoryId": "cat_003",
        "categoryName": "飲食費",
        "institutionId": "inst_001",
        "accountId": "acc_001",
        "description": "レストラン"
      }
    ],
    "totalIncome": 0,
    "totalExpense": 100000,
    "netAmount": -100000,
    "transactionCount": 3
  },
  "metadata": {
    "timestamp": "2025-01-27T10:00:00Z",
    "version": "1.0.0"
  }
}
```

**集計ロジック**

- **総収入（totalIncome）**: 関連取引のうち、`categoryType`が`INCOME`の取引の`amount`の合計
- **総支出（totalExpense）**: 関連取引のうち、`categoryType`が`EXPENSE`の取引の`amount`の絶対値の合計
- **純収支（netAmount）**: `totalIncome - totalExpense`
- **取引件数（transactionCount）**: 関連取引の件数

**注意**: 取引の`amount`は、支出の場合は負の値、収入の場合は正の値として保存されています。集計時は、支出の場合は絶対値を取って合計します。

**エラーレスポンス**

| Status | エラー                  | 説明                             |
| ------ | ----------------------- | -------------------------------- |
| 404    | `EVENT_NOT_FOUND`       | 指定されたイベントが見つからない |
| 500    | `INTERNAL_SERVER_ERROR` | サーバーエラー                   |

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

| エラーコード            | HTTPステータス | 説明                   |
| ----------------------- | -------------- | ---------------------- |
| `EVENT_NOT_FOUND`       | 404            | イベントが見つからない |
| `INTERNAL_SERVER_ERROR` | 500            | サーバー内部エラー     |

### エラーレスポンス例

```json
{
  "success": false,
  "error": {
    "code": "EVENT_NOT_FOUND",
    "message": "指定されたイベントが見つかりません",
    "details": [
      {
        "field": "id",
        "message": "イベントID 'evt_999' は存在しません"
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

### Path Parameters

| パラメータ | 型     | 必須 | バリデーションルール |
| ---------- | ------ | ---- | -------------------- |
| `id`       | string | 必須 | UUID形式（36文字）   |

### バリデーションエラーメッセージ

| フィールド | エラー条件 | メッセージ                           |
| ---------- | ---------- | ------------------------------------ |
| `id`       | 未入力     | `イベントIDは必須です`               |
| `id`       | 無効な形式 | `有効なイベントIDを入力してください` |

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
  "data": [
    {
      "transaction": {
        "id": "txn_001",
        "date": "2025-08-10",
        "amount": -50000,
        "categoryType": "EXPENSE",
        "categoryId": "cat_001",
        "categoryName": "交通費",
        "institutionId": "inst_001",
        "accountId": "acc_001",
        "description": "新幹線代"
      },
      "score": 85,
      "reasons": ["日付が近い（0日差）", "高額取引（5万円以上）", "カテゴリが関連（交通費）"]
    }
  ],
  "metadata": {
    "timestamp": "2025-01-27T10:00:00Z",
    "version": "1.0.0"
  }
}
```

---

## パフォーマンス考慮事項

### 推奨取引取得

- **日付範囲**: イベント日付の前後7日間（合計15日間）
- **最大件数**: 10件（スコア順）
- **レスポンス時間目標**: 500ms以内

### 収支サマリー取得

- **関連取引**: 最大100件まで（それ以上は警告を表示）
- **レスポンス時間目標**: 300ms以内

---

## 関連API

### 既存のイベントAPI（FR-021）

- `GET /api/events/:id`: イベント詳細取得（関連取引情報を含む）
- `POST /api/events/:id/transactions`: 取引との紐付け
- `DELETE /api/events/:id/transactions/:transactionId`: 取引との紐付け解除

### 既存の取引API

- `GET /api/transactions`: 取引一覧取得
- `GET /api/transactions/:id`: 取引詳細取得
