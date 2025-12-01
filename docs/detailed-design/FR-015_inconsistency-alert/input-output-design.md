# 入出力設計

このドキュメントでは、不一致時のアラート表示機能のAPI仕様とデータモデルを記載しています。

## 目次

1. [APIエンドポイント一覧](#apiエンドポイント一覧)
2. [リクエスト/レスポンス仕様](#リクエストレスポンス仕様)
3. [データモデル定義](#データモデル定義)
4. [エラーレスポンス](#エラーレスポンス)
5. [バリデーションルール](#バリデーションルール)

---

## APIエンドポイント一覧

### アラート管理 - FR-015

| Method | Path                      | 説明                     | 認証     |
| ------ | ------------------------- | ------------------------ | -------- |
| GET    | `/api/alerts`             | アラート一覧を取得       | 将来対応 |
| GET    | `/api/alerts/:id`         | アラート詳細を取得       | 将来対応 |
| POST   | `/api/alerts`             | アラートを生成（内部用） | 将来対応 |
| PATCH  | `/api/alerts/:id/resolve` | アラートを解決済みにする | 将来対応 |
| PATCH  | `/api/alerts/:id/read`    | アラートを既読にする     | 将来対応 |
| DELETE | `/api/alerts/:id`         | アラートを削除           | 将来対応 |

**補足**:

- 一覧取得時の絞り込みはクエリパラメータで行う（例: `?level=warning&status=unread`）
- RESTfulな設計原則に基づき、リソース名を複数形（`alerts`）で統一
- `POST /api/alerts`は主に照合処理（FR-013）から呼び出される内部用エンドポイント

### 補足

- **認証**: JWT トークンによる Bearer 認証（将来対応）
- **レート制限**: 1分間に60リクエストまで（将来対応）
- **ページネーション**: `?page=1&limit=20`（将来対応）

---

## リクエスト/レスポンス仕様

### GET /api/alerts

アラート一覧を取得します。

**Query Parameters:**

| パラメータ   | 型     | 必須 | 説明                | 例                 |
| ------------ | ------ | ---- | ------------------- | ------------------ |
| level        | string | ❌   | アラートレベル      | `warning`, `error` |
| status       | string | ❌   | アラートステータス  | `unread`, `read`   |
| type         | string | ❌   | アラートタイプ      | `amount_mismatch`  |
| cardId       | string | ❌   | カードID            | UUID               |
| billingMonth | string | ❌   | 請求月              | `2025-01`          |
| page         | number | ❌   | ページ番号          | `1`                |
| limit        | number | ❌   | 1ページあたりの件数 | `20`               |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "alert-001",
        "type": "amount_mismatch",
        "level": "warning",
        "title": "クレジットカード引落額が一致しません",
        "status": "unread",
        "createdAt": "2025-01-30T00:00:00.000Z"
      }
    ],
    "total": 10,
    "unreadCount": 5
  }
}
```

**Response Schema (AlertListResponseDto):**

| フィールド  | 型                 | 説明         |
| ----------- | ------------------ | ------------ |
| alerts      | AlertListItemDto[] | アラート一覧 |
| total       | number             | 総件数       |
| unreadCount | number             | 未読件数     |

**AlertListItemDto:**

| フィールド | 型     | 説明                                       |
| ---------- | ------ | ------------------------------------------ |
| id         | string | アラートID（UUID）                         |
| type       | string | アラートタイプ                             |
| level      | string | アラートレベル                             |
| title      | string | アラートタイトル                           |
| status     | string | アラートステータス（UNREAD/READ/RESOLVED） |
| createdAt  | string | 作成日時（ISO8601）                        |

---

### GET /api/alerts/:id

アラート詳細を取得します。

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "alert-001",
    "type": "amount_mismatch",
    "level": "warning",
    "title": "クレジットカード引落額が一致しません",
    "message": "三井住友カードの2025-01分の引落額に差異があります。\n\n請求額: ¥50000\n引落額: ¥48000\n差額: ¥-2000",
    "details": {
      "cardId": "card-001",
      "cardName": "三井住友カード",
      "billingMonth": "2025-01",
      "expectedAmount": 50000,
      "actualAmount": 48000,
      "discrepancy": -2000,
      "paymentDate": "2025-02-27T00:00:00.000Z",
      "relatedTransactions": ["tx-001", "tx-002"],
      "reconciliationId": "reconciliation-001"
    },
    "status": "unread",
    "createdAt": "2025-01-30T00:00:00.000Z",
    "resolvedAt": null,
    "resolvedBy": null,
    "resolutionNote": null,
    "actions": [
      {
        "id": "action-001",
        "label": "詳細を確認",
        "action": "view_details",
        "isPrimary": false
      },
      {
        "id": "action-002",
        "label": "手動で照合",
        "action": "manual_match",
        "isPrimary": true
      },
      {
        "id": "action-003",
        "label": "解決済みにする",
        "action": "mark_resolved",
        "isPrimary": false
      }
    ]
  }
}
```

**Response Schema (AlertResponseDto):**

| フィールド     | 型               | 説明                                       |
| -------------- | ---------------- | ------------------------------------------ |
| id             | string           | アラートID（UUID）                         |
| type           | string           | アラートタイプ                             |
| level          | string           | アラートレベル                             |
| title          | string           | アラートタイトル                           |
| message        | string           | アラートメッセージ                         |
| details        | AlertDetailsDto  | アラート詳細情報                           |
| status         | string           | アラートステータス（UNREAD/READ/RESOLVED） |
| createdAt      | string           | 作成日時（ISO8601）                        |
| resolvedAt     | string \| null   | 解決日時（ISO8601、RESOLVED時のみ）        |
| resolvedBy     | string \| null   | 解決者                                     |
| resolutionNote | string \| null   | 解決理由                                   |
| actions        | AlertActionDto[] | アクションリスト                           |

**AlertDetailsDto:**

| フィールド          | 型             | 説明                  |
| ------------------- | -------------- | --------------------- |
| cardId              | string         | カードID（UUID）      |
| cardName            | string         | カード名              |
| billingMonth        | string         | 請求月（YYYY-MM）     |
| expectedAmount      | number         | 期待金額（請求額）    |
| actualAmount        | number \| null | 実際の金額（引落額）  |
| discrepancy         | number \| null | 差額                  |
| paymentDate         | string \| null | 引落予定日（ISO8601） |
| daysElapsed         | number \| null | 経過日数              |
| relatedTransactions | string[]       | 関連取引IDのリスト    |
| reconciliationId    | string \| null | 照合結果ID（UUID）    |

**AlertActionDto:**

| フィールド | 型      | 説明                   |
| ---------- | ------- | ---------------------- |
| id         | string  | アクションID           |
| label      | string  | アクションラベル       |
| action     | string  | アクションタイプ       |
| isPrimary  | boolean | プライマリアクションか |

**Error Responses:**

- `404 Not Found`: アラートが見つからない（AL001）

---

### POST /api/alerts

アラートを生成します（主に照合処理から呼び出される内部用エンドポイント）。

**Request Body:**

```json
{
  "reconciliationId": "reconciliation-001"
}
```

**Request Schema (CreateAlertRequestDto):**

| フィールド       | 型     | 必須 | 説明       | 制約     |
| ---------------- | ------ | ---- | ---------- | -------- |
| reconciliationId | string | ✅   | 照合結果ID | UUID形式 |

**補足**:

- アラート種別（`type`）は`AlertService`が照合結果を分析して自動判定します
- リクエストで`type`を指定する必要はありません

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "alert-001",
    "type": "amount_mismatch",
    "level": "warning",
    "title": "クレジットカード引落額が一致しません",
    "message": "三井住友カードの2025-01分の引落額に差異があります。\n\n請求額: ¥50000\n引落額: ¥48000\n差額: ¥-2000",
    "details": {
      "cardId": "card-001",
      "cardName": "三井住友カード",
      "billingMonth": "2025-01",
      "expectedAmount": 50000,
      "actualAmount": 48000,
      "discrepancy": -2000,
      "paymentDate": "2025-02-27T00:00:00.000Z",
      "relatedTransactions": ["tx-001", "tx-002"],
      "reconciliationId": "reconciliation-001"
    },
    "status": "unread",
    "createdAt": "2025-01-30T00:00:00.000Z",
    "actions": [
      {
        "id": "action-001",
        "label": "詳細を確認",
        "action": "view_details",
        "isPrimary": false
      },
      {
        "id": "action-002",
        "label": "手動で照合",
        "action": "manual_match",
        "isPrimary": true
      },
      {
        "id": "action-003",
        "label": "解決済みにする",
        "action": "mark_resolved",
        "isPrimary": false
      }
    ]
  }
}
```

**Error Responses:**

- `400 Bad Request`: バリデーションエラー
- `404 Not Found`: 照合結果が見つからない
- `422 Unprocessable Entity`: 重複アラート（AL002）

---

### PATCH /api/alerts/:id/resolve

アラートを解決済みにします。

**Request Body:**

```json
{
  "resolvedBy": "user",
  "resolutionNote": "手動で確認済み。ポイント利用が反映されていなかった。"
}
```

**Request Schema (ResolveAlertRequestDto):**

| フィールド     | 型     | 必須 | 説明     | 制約                |
| -------------- | ------ | ---- | -------- | ------------------- |
| resolvedBy     | string | ✅   | 解決者   | 文字列（1-100文字） |
| resolutionNote | string | ❌   | 解決理由 | 文字列（0-500文字） |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "alert-001",
    "type": "amount_mismatch",
    "level": "warning",
    "title": "クレジットカード引落額が一致しません",
    "status": "resolved",
    "resolvedAt": "2025-01-30T12:00:00.000Z",
    "resolvedBy": "user",
    "resolutionNote": "手動で確認済み。ポイント利用が反映されていなかった。"
  }
}
```

**Error Responses:**

- `404 Not Found`: アラートが見つからない（AL001）
- `422 Unprocessable Entity`: 既に解決済みのアラート（AL003）

---

### PATCH /api/alerts/:id/read

アラートを既読にします。

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "alert-001",
    "type": "amount_mismatch",
    "level": "warning",
    "title": "クレジットカード引落額が一致しません",
    "status": "read"
  }
}
```

**Error Responses:**

- `404 Not Found`: アラートが見つからない（AL001）

---

### DELETE /api/alerts/:id

アラートを削除します。

**Response (204 No Content):**

レスポンスボディは空です。

**Error Responses:**

- `404 Not Found`: アラートが見つからない（AL001）
- `422 Unprocessable Entity`: CRITICALアラートは削除不可（AL004、アーカイブのみ）

---

## データモデル定義

### Alert Entity

```typescript
export interface Alert {
  id: string; // UUID
  type: AlertType; // アラートタイプ
  level: AlertLevel; // アラートレベル
  title: string; // タイトル
  message: string; // メッセージ
  details: AlertDetails; // 詳細情報
  status: AlertStatus; // ステータス（UNREAD/READ/RESOLVED）
  createdAt: Date; // 作成日時
  resolvedAt?: Date; // 解決日時（RESOLVED時のみ）
  resolvedBy?: string; // 解決者（RESOLVED時のみ）
  resolutionNote?: string; // 解決理由（RESOLVED時のみ）
  actions: AlertAction[]; // アクションリスト
}
```

### AlertType Enum

```typescript
export enum AlertType {
  AMOUNT_MISMATCH = 'amount_mismatch', // 金額不一致
  PAYMENT_NOT_FOUND = 'payment_not_found', // 引落未検出
  OVERDUE = 'overdue', // 延滞
  MULTIPLE_CANDIDATES = 'multiple_candidates', // 複数候補
}
```

### AlertLevel Enum

```typescript
export enum AlertLevel {
  INFO = 'info', // 情報（軽微な差異）
  WARNING = 'warning', // 警告（要確認）
  ERROR = 'error', // エラー（重大な不一致）
  CRITICAL = 'critical', // 緊急（延滞等）
}
```

### AlertStatus Enum

```typescript
export enum AlertStatus {
  UNREAD = 'unread', // 未読
  READ = 'read', // 既読
  RESOLVED = 'resolved', // 解決済み
}
```

### ActionType Enum

```typescript
export enum ActionType {
  VIEW_DETAILS = 'view_details', // 詳細を確認
  MANUAL_MATCH = 'manual_match', // 手動で照合
  MARK_RESOLVED = 'mark_resolved', // 解決済みにする
  CONTACT_BANK = 'contact_bank', // カード会社に問い合わせ
  IGNORE = 'ignore', // 無視する
}
```

---

## エラーレスポンス

### 共通エラーレスポンス形式

```json
{
  "statusCode": 400,
  "message": "エラーメッセージ",
  "errorCode": "AL001",
  "errors": [
    {
      "field": "fieldName",
      "message": "フィールド固有のエラーメッセージ"
    }
  ]
}
```

### エラーコード一覧

| エラーコード | HTTPステータス | 説明                       | 対処方法               |
| ------------ | -------------- | -------------------------- | ---------------------- |
| AL001        | 404            | アラートが見つからない     | アラートIDを確認       |
| AL002        | 422            | 重複アラート生成エラー     | 既存のアラートを確認   |
| AL003        | 422            | 既に解決済みのアラート     | アラート状態を確認     |
| AL004        | 422            | CRITICALアラートは削除不可 | アーカイブのみ可能     |
| AL005        | 500            | アラート生成失敗           | ログ記録して再試行     |
| AL006        | 500            | 通知送信失敗               | バックグラウンドで再送 |
| AL007        | 500            | アラート解決失敗           | データを再読み込み     |

---

## バリデーションルール

### CreateAlertRequestDto

| フィールド       | ルール         | エラーメッセージ                                 |
| ---------------- | -------------- | ------------------------------------------------ |
| reconciliationId | 必須、UUID形式 | "reconciliationIdはUUID形式である必要があります" |

**補足**: `type`フィールドは不要です。`AlertService`が照合結果を分析してアラート種別を自動判定します。

### ResolveAlertRequestDto

| フィールド     | ルール                          | エラーメッセージ                                |
| -------------- | ------------------------------- | ----------------------------------------------- |
| resolvedBy     | 必須、文字列（1-100文字）       | "resolvedByは1-100文字である必要があります"     |
| resolutionNote | オプション、文字列（0-500文字） | "resolutionNoteは0-500文字である必要があります" |

---

## TypeScript型定義

### Request DTOs (class)

```typescript
// CreateAlertRequestDto
export class CreateAlertRequestDto {
  @IsUUID()
  @IsNotEmpty()
  reconciliationId: string;
  // 注意: typeはAlertServiceが照合結果を分析して自動判定するため、リクエストには含めない
}

// ResolveAlertRequestDto
export class ResolveAlertRequestDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  resolvedBy: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  resolutionNote?: string;
}
```

### Response DTOs (interface)

```typescript
// AlertResponseDto
export interface AlertResponseDto {
  id: string;
  type: string;
  level: string;
  title: string;
  message: string;
  details: AlertDetailsDto;
  status: string; // UNREAD/READ/RESOLVED
  createdAt: string;
  resolvedAt?: string | null; // RESOLVED時のみ
  resolvedBy?: string | null; // RESOLVED時のみ
  resolutionNote?: string | null; // RESOLVED時のみ
  actions: AlertActionDto[];
}

// AlertListResponseDto
export interface AlertListResponseDto {
  alerts: AlertListItemDto[];
  total: number;
  unreadCount: number;
}

// AlertListItemDto
export interface AlertListItemDto {
  id: string;
  type: string;
  level: string;
  title: string;
  status: string; // UNREAD/READ/RESOLVED
  createdAt: string;
}

// AlertDetailsDto
export interface AlertDetailsDto {
  cardId: string;
  cardName: string;
  billingMonth: string;
  expectedAmount: number;
  actualAmount?: number | null;
  discrepancy?: number | null;
  paymentDate?: string | null;
  daysElapsed?: number | null;
  relatedTransactions: string[];
  reconciliationId?: string | null;
}

// AlertActionDto
export interface AlertActionDto {
  id: string;
  label: string;
  action: string;
  isPrimary: boolean;
}
```

---

## チェックリスト

入出力設計作成時の確認事項：

### 必須項目

- [x] すべてのAPIエンドポイントが記載されている
- [x] リクエスト/レスポンスのスキーマが定義されている
- [x] エラーレスポンスが定義されている
- [x] バリデーションルールが記載されている

### 推奨項目

- [x] TypeScript型定義が記載されている
- [x] リクエスト/レスポンスの例が記載されている
- [x] クエリパラメータが記載されている
- [x] エラーコード一覧が記載されている
