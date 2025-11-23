# 入出力設計

このドキュメントでは、利用履歴自動取得機能のAPI仕様とデータモデルを記載しています。

## 目次

1. [APIエンドポイント一覧](#apiエンドポイント一覧)
2. [リクエスト/レスポンス仕様](#リクエストレスポンス仕様)
3. [データモデル定義](#データモデル定義)
4. [エラーレスポンス](#エラーレスポンス)
5. [バリデーションルール](#バリデーションルール)

---

## APIエンドポイント一覧

### Sync（同期） - FR-006

| Method | Path                   | 説明                       | 認証 |
| ------ | ---------------------- | -------------------------- | ---- |
| POST   | `/api/sync/start`      | 手動同期を開始             | 必要 |
| GET    | `/api/sync/status`     | 同期ステータスを取得       | 必要 |
| GET    | `/api/sync/history`    | 同期履歴を取得             | 必要 |
| PUT    | `/api/sync/cancel/:id` | 実行中の同期をキャンセル   | 必要 |
| GET    | `/api/sync/schedule`   | 同期スケジュール設定を取得 | 必要 |
| PUT    | `/api/sync/schedule`   | 同期スケジュール設定を更新 | 必要 |

### 補足

- **認証**: JWT トークンによる Bearer 認証
- **レート制限**: 1分間に60リクエストまで
- **ページネーション**: `?page=1&limit=20`（履歴取得のみ）

---

## リクエスト/レスポンス仕様

### POST /api/sync/start

手動同期を開始します。

**Request Body:**

```json
{
  "forceFullSync": false,
  "institutionIds": ["inst_001", "inst_002"]
}
```

**Request Schema (SyncAllTransactionsRequestDto):**

| フィールド     | 型       | 必須 | 説明                                                   | 制約                               |
| -------------- | -------- | ---- | ------------------------------------------------------ | ---------------------------------- |
| forceFullSync  | boolean  | ⬜   | 全件同期を強制（差分同期をスキップ）                   | true or false（デフォルト: false） |
| institutionIds | string[] | ⬜   | 同期対象の金融機関IDリスト（未指定の場合は全金融機関） | 有効な金融機関ID                   |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "sync_001",
      "institutionId": "inst_001",
      "institutionName": "三菱UFJ銀行",
      "institutionType": "bank",
      "status": "completed",
      "startedAt": "2025-11-23T04:00:00.000Z",
      "completedAt": "2025-11-23T04:00:15.000Z",
      "totalFetched": 150,
      "newRecords": 120,
      "duplicateRecords": 30,
      "errorMessage": null
    },
    {
      "id": "sync_002",
      "institutionId": "inst_002",
      "institutionName": "楽天カード",
      "institutionType": "credit-card",
      "status": "completed",
      "startedAt": "2025-11-23T04:00:00.000Z",
      "completedAt": "2025-11-23T04:00:20.000Z",
      "totalFetched": 85,
      "newRecords": 85,
      "duplicateRecords": 0,
      "errorMessage": null
    }
  ],
  "summary": {
    "totalInstitutions": 2,
    "successCount": 2,
    "failureCount": 0,
    "totalFetched": 235,
    "totalNew": 205,
    "totalDuplicate": 30,
    "duration": 20000
  }
}
```

**Response Schema (SyncAllTransactionsResponseDto):**

| フィールド | 型               | 説明           |
| ---------- | ---------------- | -------------- |
| success    | boolean          | 成功フラグ     |
| data       | SyncHistoryDto[] | 同期履歴の配列 |
| summary    | SyncSummaryDto   | サマリー情報   |

**SyncHistoryDto:**

| フィールド       | 型             | 説明                                        |
| ---------------- | -------------- | ------------------------------------------- |
| id               | string         | 同期履歴ID（UUID）                          |
| institutionId    | string         | 金融機関ID                                  |
| institutionName  | string         | 金融機関名                                  |
| institutionType  | string         | 金融機関種別（bank/credit-card/securities） |
| status           | string         | 同期ステータス                              |
| startedAt        | string         | 開始日時（ISO8601）                         |
| completedAt      | string \| null | 完了日時（ISO8601）                         |
| totalFetched     | number         | 取得件数                                    |
| newRecords       | number         | 新規データ件数                              |
| duplicateRecords | number         | 重複データ件数                              |
| errorMessage     | string \| null | エラーメッセージ（失敗時）                  |

**SyncSummaryDto:**

| フィールド        | 型     | 説明               |
| ----------------- | ------ | ------------------ |
| totalInstitutions | number | 対象金融機関数     |
| successCount      | number | 成功件数           |
| failureCount      | number | 失敗件数           |
| totalFetched      | number | 合計取得件数       |
| totalNew          | number | 合計新規データ件数 |
| totalDuplicate    | number | 合計重複データ件数 |
| duration          | number | 処理時間（ミリ秒） |

**Error Responses:**

- `400 Bad Request`: バリデーションエラー
- `401 Unauthorized`: 認証エラー
- `409 Conflict`: 既に同期が実行中

**TypeScript型定義:**

```typescript
// Request DTO
export class SyncAllTransactionsRequestDto {
  @IsOptional()
  @IsBoolean()
  forceFullSync?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  institutionIds?: string[];
}

// Response DTO
export interface SyncAllTransactionsResponseDto {
  success: boolean;
  data: SyncHistoryDto[];
  summary: SyncSummaryDto;
}

export interface SyncHistoryDto {
  id: string;
  institutionId: string;
  institutionName: string;
  institutionType: 'bank' | 'credit-card' | 'securities';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt: string | null;
  totalFetched: number;
  newRecords: number;
  duplicateRecords: number;
  errorMessage: string | null;
}

export interface SyncSummaryDto {
  totalInstitutions: number;
  successCount: number;
  failureCount: number;
  totalFetched: number;
  totalNew: number;
  totalDuplicate: number;
  duration: number;
}
```

---

### GET /api/sync/status

現在の同期ステータスを取得します。

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "currentSyncId": "sync_003",
    "startedAt": "2025-11-23T04:00:00.000Z",
    "progress": {
      "totalInstitutions": 5,
      "completedInstitutions": 2,
      "currentInstitution": "楽天銀行",
      "percentage": 40
    }
  }
}
```

**Response Schema (SyncStatusResponseDto):**

| フィールド | 型            | 説明           |
| ---------- | ------------- | -------------- |
| success    | boolean       | 成功フラグ     |
| data       | SyncStatusDto | ステータス情報 |

**SyncStatusDto:**

| フィールド    | 型                      | 説明                |
| ------------- | ----------------------- | ------------------- |
| isRunning     | boolean                 | 実行中かどうか      |
| currentSyncId | string \| null          | 実行中の同期ID      |
| startedAt     | string \| null          | 開始日時（ISO8601） |
| progress      | SyncProgressDto \| null | 進捗情報            |

**SyncProgressDto:**

| フィールド            | 型     | 説明                   |
| --------------------- | ------ | ---------------------- |
| totalInstitutions     | number | 対象金融機関数         |
| completedInstitutions | number | 完了した金融機関数     |
| currentInstitution    | string | 現在処理中の金融機関名 |
| percentage            | number | 進捗率（%）            |

---

### GET /api/sync/history

同期履歴を取得します。

**Query Parameters:**

| パラメータ    | 型     | 必須 | デフォルト | 説明                                                               |
| ------------- | ------ | ---- | ---------- | ------------------------------------------------------------------ |
| institutionId | string | ⬜   | -          | 金融機関IDでフィルタ                                               |
| status        | string | ⬜   | -          | ステータスでフィルタ（pending/running/completed/failed/cancelled） |
| startDate     | string | ⬜   | -          | 開始日（ISO8601）                                                  |
| endDate       | string | ⬜   | -          | 終了日（ISO8601）                                                  |
| limit         | number | ⬜   | 20         | 取得件数（最大100）                                                |
| page          | number | ⬜   | 1          | ページ番号                                                         |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "sync_001",
      "institutionId": "inst_001",
      "institutionName": "三菱UFJ銀行",
      "institutionType": "bank",
      "status": "completed",
      "startedAt": "2025-11-23T04:00:00.000Z",
      "completedAt": "2025-11-23T04:00:15.000Z",
      "totalFetched": 150,
      "newRecords": 120,
      "duplicateRecords": 30,
      "errorMessage": null
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

**Response Schema:**

| フィールド | 型               | 説明                 |
| ---------- | ---------------- | -------------------- |
| success    | boolean          | 成功フラグ           |
| data       | SyncHistoryDto[] | 同期履歴の配列       |
| meta       | PaginationMeta   | ページネーション情報 |

**TypeScript型定義:**

```typescript
export class GetSyncHistoryRequestDto {
  @IsOptional()
  @IsString()
  institutionId?: string;

  @IsOptional()
  @IsEnum(SyncStatus)
  status?: SyncStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;
}
```

---

### PUT /api/sync/cancel/:id

実行中の同期をキャンセルします。

**Path Parameters:**

| パラメータ | 型     | 必須 | 説明       |
| ---------- | ------ | ---- | ---------- |
| id         | string | ✅   | 同期履歴ID |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "同期をキャンセルしました"
}
```

**Response Schema (CancelSyncResponseDto):**

| フィールド | 型      | 説明       |
| ---------- | ------- | ---------- |
| success    | boolean | 成功フラグ |
| message    | string  | メッセージ |

**Error Responses:**

- `404 Not Found`: 同期履歴が存在しない
- `400 Bad Request`: 同期がキャンセル可能な状態でない

---

### GET /api/sync/schedule

同期スケジュール設定を取得します。

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "enabled": true,
    "cronExpression": "0 4 * * *",
    "timezone": "Asia/Tokyo",
    "nextRun": "2025-11-24T04:00:00.000Z"
  }
}
```

**Response Schema (SyncScheduleResponseDto):**

| フィールド | 型              | 説明             |
| ---------- | --------------- | ---------------- |
| success    | boolean         | 成功フラグ       |
| data       | SyncScheduleDto | スケジュール情報 |

**SyncScheduleDto:**

| フィールド     | 型      | 説明                    |
| -------------- | ------- | ----------------------- |
| enabled        | boolean | スケジュール有効/無効   |
| cronExpression | string  | cron式                  |
| timezone       | string  | タイムゾーン            |
| nextRun        | string  | 次回実行日時（ISO8601） |

---

### PUT /api/sync/schedule

同期スケジュール設定を更新します。

**Request Body:**

```json
{
  "enabled": true,
  "cronExpression": "0 3 * * *",
  "timezone": "Asia/Tokyo"
}
```

**Request Schema (UpdateSyncScheduleRequestDto):**

| フィールド     | 型      | 必須 | 説明                  | 制約                                    |
| -------------- | ------- | ---- | --------------------- | --------------------------------------- |
| enabled        | boolean | ✅   | スケジュール有効/無効 | true or false                           |
| cronExpression | string  | ✅   | cron式                | 有効なcron式                            |
| timezone       | string  | ⬜   | タイムゾーン          | IANA timezone（デフォルト: Asia/Tokyo） |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "enabled": true,
    "cronExpression": "0 3 * * *",
    "timezone": "Asia/Tokyo",
    "nextRun": "2025-11-24T03:00:00.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request`: バリデーションエラー（無効なcron式等）

**TypeScript型定義:**

```typescript
export class UpdateSyncScheduleRequestDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  @IsCronExpression()
  cronExpression: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}
```

---

## データモデル定義

### SyncHistory Entity

```typescript
export interface SyncHistory {
  id: string; // UUID
  institutionId: string; // 金融機関ID
  institutionName: string; // 金融機関名
  institutionType: InstitutionType; // 金融機関種別
  status: SyncStatus; // 同期ステータス
  startedAt: Date; // 開始日時
  completedAt?: Date; // 完了日時
  totalFetched: number; // 取得件数
  newRecords: number; // 新規データ件数
  duplicateRecords: number; // 重複データ件数
  errorMessage?: string; // エラーメッセージ（失敗時）
  retryCount: number; // リトライ回数
  createdAt: Date; // 作成日時
  updatedAt: Date; // 更新日時
}
```

### Enum定義

```typescript
export enum SyncStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum InstitutionType {
  BANK = 'bank',
  CREDIT_CARD = 'credit-card',
  SECURITIES = 'securities',
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
      "field": "forceFullSync",
      "message": "forceFullSyncはboolean型である必要があります"
    }
  ],
  "timestamp": "2025-11-23T00:00:00.000Z",
  "path": "/api/sync/start"
}
```

### HTTPステータスコード

| ステータスコード | 説明                  | 使用例                 |
| ---------------- | --------------------- | ---------------------- |
| 200              | OK                    | 正常なGET, PUT         |
| 201              | Created               | 正常なPOST             |
| 400              | Bad Request           | バリデーションエラー   |
| 401              | Unauthorized          | 認証エラー             |
| 403              | Forbidden             | 権限エラー             |
| 404              | Not Found             | リソース未検出         |
| 409              | Conflict              | 同期が既に実行中       |
| 422              | Unprocessable Entity  | ビジネスロジックエラー |
| 429              | Too Many Requests     | レート制限超過         |
| 500              | Internal Server Error | サーバーエラー         |
| 502              | Bad Gateway           | 外部API接続エラー      |
| 503              | Service Unavailable   | サービス一時停止       |

### バリデーションエラー (400)

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "institutionIds",
      "value": ["invalid_id"],
      "message": "無効な金融機関IDが含まれています",
      "constraints": {
        "isValidInstitutionId": "金融機関IDは有効なUUID形式である必要があります"
      }
    }
  ]
}
```

### 同時実行エラー (409)

```json
{
  "success": false,
  "statusCode": 409,
  "message": "同期が既に実行中です",
  "currentSyncId": "sync_003",
  "startedAt": "2025-11-23T04:00:00.000Z"
}
```

### リソース未検出エラー (404)

```json
{
  "success": false,
  "statusCode": 404,
  "message": "同期履歴が見つかりません",
  "syncId": "sync_999"
}
```

### 外部API接続エラー (502)

```json
{
  "success": false,
  "statusCode": 502,
  "message": "金融機関APIへの接続に失敗しました",
  "institutionId": "inst_001",
  "institutionName": "三菱UFJ銀行",
  "details": "Connection timeout after 10000ms"
}
```

---

## バリデーションルール

### SyncAllTransactionsRequestDto

| フィールド     | バリデーション                             |
| -------------- | ------------------------------------------ |
| forceFullSync  | オプション、真偽値                         |
| institutionIds | オプション、文字列配列、各要素は有効なUUID |

**実装例 (class-validator):**

```typescript
import { IsString, IsBoolean, IsArray, IsOptional, IsUUID } from 'class-validator';

export class SyncAllTransactionsRequestDto {
  @IsOptional()
  @IsBoolean()
  forceFullSync?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  institutionIds?: string[];
}
```

### GetSyncHistoryRequestDto

| フィールド    | バリデーション                    |
| ------------- | --------------------------------- |
| institutionId | オプション、文字列、UUID形式      |
| status        | オプション、Enum (SyncStatus)     |
| startDate     | オプション、日付文字列（ISO8601） |
| endDate       | オプション、日付文字列（ISO8601） |
| limit         | オプション、数値、1-100           |
| page          | オプション、数値、1以上           |

**実装例:**

```typescript
export class GetSyncHistoryRequestDto {
  @IsOptional()
  @IsUUID('4')
  institutionId?: string;

  @IsOptional()
  @IsEnum(SyncStatus)
  status?: SyncStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;
}
```

### UpdateSyncScheduleRequestDto

| フィールド     | バリデーション                    |
| -------------- | --------------------------------- |
| enabled        | 必須、真偽値                      |
| cronExpression | 必須、文字列、有効なcron式        |
| timezone       | オプション、文字列、IANA timezone |

**実装例:**

```typescript
export class UpdateSyncScheduleRequestDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  @Matches(/^(\*|[0-5]?\d)(\s+(\*|[0-5]?\d)){4}$/, {
    message: '有効なcron式である必要があります',
  })
  cronExpression: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}
```

---

## API使用例

### cURL

```bash
# 手動同期開始
curl -X POST http://localhost:3001/api/sync/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "forceFullSync": false,
    "institutionIds": ["inst_001"]
  }'

# 同期ステータス取得
curl -X GET http://localhost:3001/api/sync/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# 同期履歴取得（フィルタ付き）
curl -X GET "http://localhost:3001/api/sync/history?status=completed&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 同期キャンセル
curl -X PUT http://localhost:3001/api/sync/cancel/sync_003 \
  -H "Authorization: Bearer YOUR_TOKEN"

# スケジュール設定更新
curl -X PUT http://localhost:3001/api/sync/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "enabled": true,
    "cronExpression": "0 3 * * *",
    "timezone": "Asia/Tokyo"
  }'
```

### TypeScript (Fetch API)

```typescript
// 手動同期開始
const response = await fetch('http://localhost:3001/api/sync/start', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    forceFullSync: false,
    institutionIds: ['inst_001'],
  }),
});

const data = await response.json();
console.log('同期開始:', data);

// 同期履歴取得
const historyResponse = await fetch(
  'http://localhost:3001/api/sync/history?status=completed&limit=10',
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

const historyData = await historyResponse.json();
console.log('同期履歴:', historyData);
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
- [x] ページネーションが実装されている（履歴取得）
- [x] 認証・認可が考慮されている

### ドキュメント

- [x] 使用例（cURL/TypeScript）が提供されている
- [x] TypeScript型定義が明確
- [x] Enum定義がある
