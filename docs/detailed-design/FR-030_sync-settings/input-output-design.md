# 入出力設計

このドキュメントでは、データ同期間隔設定機能のAPI仕様とデータモデルを記載しています。

## 目次

1. [APIエンドポイント一覧](#apiエンドポイント一覧)
2. [リクエスト/レスポンス仕様](#リクエストレスポンス仕様)
3. [データモデル定義](#データモデル定義)
4. [エラーレスポンス](#エラーレスポンス)
5. [バリデーションルール](#バリデーションルール)

---

## APIエンドポイント一覧

### 同期設定 - FR-030

| Method | Path                                  | 説明                     | 認証 |
| ------ | ------------------------------------- | ------------------------ | ---- |
| GET    | `/api/sync-settings`                  | 全体設定を取得           | 必要 |
| PUT    | `/api/sync-settings`                  | 全体設定を更新           | 必要 |
| GET    | `/api/sync-settings/institutions`     | 全金融機関の設定を取得   | 必要 |
| GET    | `/api/sync-settings/institutions/:id` | 特定金融機関の設定を取得 | 必要 |
| PUT    | `/api/sync-settings/institutions/:id` | 特定金融機関の設定を更新 | 必要 |

### 補足

- **認証**: JWT トークンによる Bearer 認証
- **レート制限**: 1分間に60リクエストまで
- **Content-Type**: `application/json`

---

## リクエスト/レスポンス仕様

### GET /api/sync-settings

全体の同期設定を取得します。

**Request Headers:**

```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "defaultInterval": {
      "type": "standard",
      "value": null,
      "unit": null,
      "customSchedule": null
    },
    "wifiOnly": false,
    "batterySavingMode": false,
    "autoRetry": true,
    "maxRetryCount": 3,
    "nightModeSuspend": false,
    "nightModeStart": "22:00",
    "nightModeEnd": "06:00"
  }
}
```

**Response Schema (SyncSettingsResponseDto):**

| フィールド        | 型              | 説明                                 |
| ----------------- | --------------- | ------------------------------------ |
| defaultInterval   | SyncIntervalDto | デフォルト同期間隔                   |
| wifiOnly          | boolean         | Wi-Fi接続時のみ自動同期              |
| batterySavingMode | boolean         | バッテリー節約モード時は同期を控える |
| autoRetry         | boolean         | エラー時は自動リトライ               |
| maxRetryCount     | number          | 最大リトライ回数                     |
| nightModeSuspend  | boolean         | 夜間モード有効化                     |
| nightModeStart    | string          | 夜間モード開始時刻（HH:mm形式）      |
| nightModeEnd      | string          | 夜間モード終了時刻（HH:mm形式）      |

**SyncIntervalDto:**

| フィールド     | 型     | 説明                             |
| -------------- | ------ | -------------------------------- |
| type           | string | 同期間隔タイプ（Enum）           |
| value          | number | カスタムの場合の値（nullable）   |
| unit           | string | カスタムの場合の単位（nullable） |
| customSchedule | string | Cron式（nullable）               |

**Error Responses:**

- `401 Unauthorized`: 認証エラー
- `500 Internal Server Error`: サーバーエラー

---

### PUT /api/sync-settings

全体の同期設定を更新します。

**Request Headers:**

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**

```json
{
  "defaultInterval": {
    "type": "frequent",
    "value": null,
    "unit": null,
    "customSchedule": null
  },
  "wifiOnly": true,
  "batterySavingMode": false,
  "autoRetry": true,
  "maxRetryCount": 3,
  "nightModeSuspend": true,
  "nightModeStart": "22:00",
  "nightModeEnd": "06:00"
}
```

**Request Schema (UpdateSyncSettingsRequestDto):**

| フィールド        | 型              | 必須 | 説明                                 | 制約                                   |
| ----------------- | --------------- | ---- | ------------------------------------ | -------------------------------------- |
| defaultInterval   | SyncIntervalDto | ✅   | デフォルト同期間隔                   | -                                      |
| wifiOnly          | boolean         | ⬜   | Wi-Fi接続時のみ自動同期              | -                                      |
| batterySavingMode | boolean         | ⬜   | バッテリー節約モード時は同期を控える | -                                      |
| autoRetry         | boolean         | ⬜   | エラー時は自動リトライ               | -                                      |
| maxRetryCount     | number          | ⬜   | 最大リトライ回数                     | 1-10                                   |
| nightModeSuspend  | boolean         | ⬜   | 夜間モード有効化                     | -                                      |
| nightModeStart    | string          | ⬜   | 夜間モード開始時刻                   | HH:mm形式、nightModeSuspend=true時必須 |
| nightModeEnd      | string          | ⬜   | 夜間モード終了時刻                   | HH:mm形式、nightModeSuspend=true時必須 |

**SyncIntervalDto (Request):**

| フィールド     | 型     | 必須 | 説明                 | 制約                                                           |
| -------------- | ------ | ---- | -------------------- | -------------------------------------------------------------- |
| type           | string | ✅   | 同期間隔タイプ       | Enum: realtime, frequent, standard, infrequent, manual, custom |
| value          | number | ⬜   | カスタムの場合の値   | type=custom時必須、5-43200（分）                               |
| unit           | string | ⬜   | カスタムの場合の単位 | type=custom時必須、Enum: minutes, hours, days                  |
| customSchedule | string | ⬜   | Cron式               | -                                                              |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "defaultInterval": {
      "type": "frequent",
      "value": null,
      "unit": null,
      "customSchedule": null
    },
    "wifiOnly": true,
    "batterySavingMode": false,
    "autoRetry": true,
    "maxRetryCount": 3,
    "nightModeSuspend": true,
    "nightModeStart": "22:00",
    "nightModeEnd": "06:00"
  }
}
```

**Error Responses:**

- `400 Bad Request`: バリデーションエラー
  ```json
  {
    "success": false,
    "error": {
      "code": "SY001",
      "message": "不正な同期間隔",
      "details": "5分〜30日の範囲で設定してください"
    },
    "metadata": {
      "timestamp": "2025-01-27T10:00:00.000Z",
      "version": "1.0"
    }
  }
  ```
- `401 Unauthorized`: 認証エラー
- `500 Internal Server Error`: サーバーエラー

---

### GET /api/sync-settings/institutions

全金融機関の同期設定を取得します。

**Request Headers:**

```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "inst-sync-001",
      "institutionId": "inst-001",
      "interval": {
        "type": "standard",
        "value": null,
        "unit": null,
        "customSchedule": null
      },
      "enabled": true,
      "lastSyncedAt": "2025-01-27T04:00:00.000Z",
      "nextSyncAt": "2025-01-27T10:00:00.000Z",
      "syncStatus": "idle",
      "errorCount": 0,
      "lastError": null
    },
    {
      "id": "inst-sync-002",
      "institutionId": "inst-002",
      "interval": {
        "type": "infrequent",
        "value": null,
        "unit": null,
        "customSchedule": null
      },
      "enabled": true,
      "lastSyncedAt": "2025-01-27T00:00:00.000Z",
      "nextSyncAt": "2025-01-28T00:00:00.000Z",
      "syncStatus": "idle",
      "errorCount": 0,
      "lastError": null
    }
  ]
}
```

**Response Schema (InstitutionSyncSettingsResponseDto[]):**

| フィールド    | 型              | 説明                                  |
| ------------- | --------------- | ------------------------------------- |
| id            | string          | 設定ID（UUID）                        |
| institutionId | string          | 金融機関ID                            |
| interval      | SyncIntervalDto | 同期間隔                              |
| enabled       | boolean         | 有効/無効                             |
| lastSyncedAt  | string          | 最終同期日時（ISO8601、nullable）     |
| nextSyncAt    | string          | 次回同期予定日時（ISO8601、nullable） |
| syncStatus    | string          | 同期ステータス（Enum）                |
| errorCount    | number          | エラー回数                            |
| lastError     | string          | 最後のエラーメッセージ（nullable）    |

**Error Responses:**

- `401 Unauthorized`: 認証エラー
- `500 Internal Server Error`: サーバーエラー

---

### GET /api/sync-settings/institutions/:id

特定金融機関の同期設定を取得します。

**Request Headers:**

```
Authorization: Bearer <JWT_TOKEN>
```

**Path Parameters:**

| パラメータ | 型     | 説明       |
| ---------- | ------ | ---------- |
| id         | string | 金融機関ID |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "inst-sync-001",
    "institutionId": "inst-001",
    "interval": {
      "type": "standard",
      "value": null,
      "unit": null,
      "customSchedule": null
    },
    "enabled": true,
    "lastSyncedAt": "2025-01-27T04:00:00.000Z",
    "nextSyncAt": "2025-01-27T10:00:00.000Z",
    "syncStatus": "idle",
    "errorCount": 0,
    "lastError": null
  }
}
```

**Error Responses:**

- `401 Unauthorized`: 認証エラー
- `404 Not Found`: 金融機関が見つからない
  ```json
  {
    "success": false,
    "error": {
      "code": "INST001",
      "message": "金融機関が見つかりません"
    },
    "metadata": {
      "timestamp": "2025-01-27T10:00:00.000Z",
      "version": "1.0"
    }
  }
  ```
- `500 Internal Server Error`: サーバーエラー

---

### PUT /api/sync-settings/institutions/:id

特定金融機関の同期設定を更新します。

**Request Headers:**

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Path Parameters:**

| パラメータ | 型     | 説明       |
| ---------- | ------ | ---------- |
| id         | string | 金融機関ID |

**Request Body:**

```json
{
  "interval": {
    "type": "frequent",
    "value": null,
    "unit": null,
    "customSchedule": null
  },
  "enabled": true
}
```

**Request Schema (UpdateInstitutionSyncSettingsRequestDto):**

| フィールド | 型              | 必須 | 説明      | 制約 |
| ---------- | --------------- | ---- | --------- | ---- |
| interval   | SyncIntervalDto | ✅   | 同期間隔  | -    |
| enabled    | boolean         | ⬜   | 有効/無効 | -    |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "inst-sync-001",
    "institutionId": "inst-001",
    "interval": {
      "type": "frequent",
      "value": null,
      "unit": null,
      "customSchedule": null
    },
    "enabled": true,
    "lastSyncedAt": "2025-01-27T04:00:00.000Z",
    "nextSyncAt": "2025-01-27T05:00:00.000Z",
    "syncStatus": "idle",
    "errorCount": 0,
    "lastError": null
  }
}
```

**Error Responses:**

- `400 Bad Request`: バリデーションエラー
- `401 Unauthorized`: 認証エラー
- `404 Not Found`: 金融機関が見つからない
- `500 Internal Server Error`: サーバーエラー

---

## データモデル定義

### SyncIntervalType (Enum)

```typescript
export enum SyncIntervalType {
  REALTIME = 'realtime', // リアルタイム（5分ごと）
  FREQUENT = 'frequent', // 高頻度（1時間ごと）
  STANDARD = 'standard', // 標準（6時間ごと）
  INFREQUENT = 'infrequent', // 低頻度（1日1回）
  MANUAL = 'manual', // 手動のみ
  CUSTOM = 'custom', // カスタム間隔
}
```

### TimeUnit (Enum)

```typescript
export enum TimeUnit {
  MINUTES = 'minutes', // 分
  HOURS = 'hours', // 時間
  DAYS = 'days', // 日
}
```

### SyncStatus (Enum)

```typescript
export enum SyncStatus {
  IDLE = 'idle', // 待機中
  SYNCING = 'syncing', // 同期中
  ERROR = 'error', // エラー
}
```

### TypeScript型定義

```typescript
// Request DTOs
export interface UpdateSyncSettingsRequestDto {
  defaultInterval: SyncIntervalDto;
  wifiOnly?: boolean;
  batterySavingMode?: boolean;
  autoRetry?: boolean;
  maxRetryCount?: number;
  nightModeSuspend?: boolean;
  nightModeStart?: string;
  nightModeEnd?: string;
}

export interface SyncIntervalDto {
  type: SyncIntervalType;
  value?: number;
  unit?: TimeUnit;
  customSchedule?: string;
}

export interface UpdateInstitutionSyncSettingsRequestDto {
  interval: SyncIntervalDto;
  enabled?: boolean;
}

// Response DTOs
export interface SyncSettingsResponseDto {
  defaultInterval: SyncIntervalDto;
  wifiOnly: boolean;
  batterySavingMode: boolean;
  autoRetry: boolean;
  maxRetryCount: number;
  nightModeSuspend: boolean;
  nightModeStart: string;
  nightModeEnd: string;
}

export interface InstitutionSyncSettingsResponseDto {
  id: string;
  institutionId: string;
  interval: SyncIntervalDto;
  enabled: boolean;
  lastSyncedAt?: string;
  nextSyncAt?: string;
  syncStatus: SyncStatus;
  errorCount: number;
  lastError?: string;
}
```

---

## エラーレスポンス

### 共通エラーレスポンス形式

すべてのエラーレスポンスは以下の形式に統一されます：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": "詳細な説明（オプション）"
  },
  "metadata": {
    "timestamp": "2025-01-27T10:00:00.000Z",
    "version": "1.0"
  }
}
```

### エラーコード一覧

| エラーコード | HTTPステータス | 説明                           |
| ------------ | -------------- | ------------------------------ |
| SY001        | 400            | 不正な同期間隔                 |
| SY002        | 400            | 夜間モード時刻の形式エラー     |
| SY003        | 400            | 夜間モード開始時刻 >= 終了時刻 |
| SY004        | 400            | カスタム間隔の値が範囲外       |
| SY005        | 400            | カスタム間隔の単位が未指定     |
| SY006        | 500            | 設定保存失敗                   |
| SY007        | 500            | スケジュール更新失敗           |
| INST001      | 404            | 金融機関が見つかりません       |

---

## バリデーションルール

### 同期間隔のバリデーション

1. **プリセット間隔**
   - `type`が`realtime`, `frequent`, `standard`, `infrequent`, `manual`の場合
   - `value`, `unit`, `customSchedule`は不要（nullまたは未指定）

2. **カスタム間隔**
   - `type`が`custom`の場合
   - `value`は必須、範囲: 5〜43200（分単位に換算）
   - `unit`は必須、Enum: `minutes`, `hours`, `days`
   - 換算後の値が5分〜30日（43200分）の範囲内であること

3. **Cron式**
   - `customSchedule`が指定されている場合、有効なCron式であること

### 詳細オプションのバリデーション

1. **maxRetryCount**
   - 範囲: 1〜10
   - デフォルト: 3

2. **nightModeStart / nightModeEnd**
   - 形式: `HH:mm`（24時間形式）
   - `nightModeSuspend`が`true`の場合、両方必須
   - `nightModeStart` < `nightModeEnd`であること
   - 例: `nightModeStart: "22:00"`, `nightModeEnd: "06:00"`（翌日6時まで）

### カスタム間隔の換算例

- `value: 2, unit: "hours"` → 120分（有効）
- `value: 1, unit: "days"` → 1440分（有効）
- `value: 3, unit: "minutes"` → 3分（無効: 最小5分）
- `value: 31, unit: "days"` → 44640分（無効: 最大43200分）

---

## チェックリスト

設計書作成時の確認事項：

### 必須項目

- [x] すべてのAPIエンドポイントが記載されている
- [x] リクエスト/レスポンスのスキーマが定義されている
- [x] エラーレスポンスが定義されている
- [x] バリデーションルールが記載されている

### 推奨項目

- [x] TypeScript型定義が記載されている
- [x] エラーコード一覧が記載されている
- [x] リクエスト/レスポンスの例が記載されている
