# 入出力設計

このドキュメントでは、詳細費目分類機能のAPI仕様とデータモデルを記載しています。

## 目次

1. [APIエンドポイント一覧](#apiエンドポイント一覧)
2. [リクエスト/レスポンス仕様](#リクエストレスポンス仕様)
3. [データモデル定義](#データモデル定義)
4. [エラーレスポンス](#エラーレスポンス)
5. [バリデーションルール](#バリデーションルール)

---

## APIエンドポイント一覧

### Subcategory (サブカテゴリ) - FR-009

| Method | Path                                | 説明                                       | 認証 |
| ------ | ----------------------------------- | ------------------------------------------ | ---- |
| GET    | `/api/subcategories`                | 全サブカテゴリ一覧を取得                   | 必要 |
| GET    | `/api/subcategories/category/:type` | カテゴリ別サブカテゴリ一覧を取得           | 必要 |
| GET    | `/api/subcategories/:id`            | サブカテゴリ詳細を取得                     | 必要 |
| POST   | `/api/subcategories/classify`       | 取引の詳細費目を自動分類                   | 必要 |
| POST   | `/api/subcategories/batch-classify` | 複数取引の一括分類                         | 必要 |
| GET    | `/api/subcategories/:id/children`   | 子サブカテゴリ一覧を取得（階層化）         | 必要 |
| GET    | `/api/subcategories/recent`         | 最近使用したサブカテゴリを取得             | 必要 |
| GET    | `/api/subcategories/popular`        | よく使われるサブカテゴリを取得             | 必要 |
| POST   | `/api/subcategories`                | サブカテゴリを作成（管理者のみ・将来実装） | 必要 |
| PUT    | `/api/subcategories/:id`            | サブカテゴリを更新（管理者のみ・将来実装） | 必要 |

### Merchant (店舗マスタ) - FR-009

| Method | Path                    | 説明                     | 認証 |
| ------ | ----------------------- | ------------------------ | ---- |
| GET    | `/api/merchants`        | 店舗マスタ一覧を取得     | 必要 |
| GET    | `/api/merchants/:id`    | 店舗詳細を取得           | 必要 |
| GET    | `/api/merchants/search` | 店舗を検索               | 必要 |
| POST   | `/api/merchants`        | 店舗を登録（管理者のみ） | 必要 |
| PUT    | `/api/merchants/:id`    | 店舗を更新（管理者のみ） | 必要 |

---

## リクエスト/レスポンス仕様

### GET /api/subcategories

**説明**: 全サブカテゴリ一覧を取得します。

**Query Parameters:**

| パラメータ       | 型      | 必須 | 説明                 | デフォルト |
| ---------------- | ------- | ---- | -------------------- | ---------- |
| include_inactive | boolean | ❌   | 非アクティブも含める | false      |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "food_groceries",
      "categoryType": "EXPENSE",
      "name": "食料品",
      "parentId": "food",
      "displayOrder": 1,
      "icon": "🛒",
      "color": "#4CAF50",
      "isDefault": true,
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    {
      "id": "food_dining_out",
      "categoryType": "EXPENSE",
      "name": "外食",
      "parentId": "food",
      "displayOrder": 2,
      "icon": "🍽️",
      "color": "#FF9800",
      "isDefault": true,
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 2
}
```

---

### GET /api/subcategories/category/:type

**説明**: 特定カテゴリのサブカテゴリ一覧を取得します。

**Path Parameters:**

| パラメータ | 型     | 必須 | 説明                                                              |
| ---------- | ------ | ---- | ----------------------------------------------------------------- |
| type       | string | ✅   | カテゴリタイプ (INCOME, EXPENSE, TRANSFER, REPAYMENT, INVESTMENT) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "food",
      "categoryType": "EXPENSE",
      "name": "食費",
      "parentId": null,
      "displayOrder": 1,
      "icon": "🍔",
      "color": "#4CAF50",
      "isDefault": true,
      "isActive": true,
      "children": [
        {
          "id": "food_groceries",
          "categoryType": "EXPENSE",
          "name": "食料品",
          "parentId": "food",
          "displayOrder": 1,
          "icon": "🛒",
          "color": "#4CAF50",
          "isDefault": true,
          "isActive": true
        },
        {
          "id": "food_dining_out",
          "categoryType": "EXPENSE",
          "name": "外食",
          "parentId": "food",
          "displayOrder": 2,
          "icon": "🍽️",
          "color": "#FF9800",
          "isDefault": true,
          "isActive": true
        }
      ]
    }
  ],
  "total": 1
}
```

---

### POST /api/subcategories/classify

**説明**: 取引データから詳細費目を自動分類します。

**Request Body:**

```json
{
  "transactionId": "tx_1234567890",
  "description": "スターバックス 表参道店",
  "amount": -450,
  "mainCategory": "EXPENSE",
  "transactionDate": "2025-11-24T10:30:00.000Z"
}
```

**Request Schema (ClassificationRequestDto):**

| フィールド      | 型     | 必須 | 説明       | 制約              |
| --------------- | ------ | ---- | ---------- | ----------------- |
| transactionId   | string | ✅   | 取引ID     | 1-50文字          |
| description     | string | ✅   | 取引説明   | 1-500文字         |
| amount          | number | ✅   | 金額       | -                 |
| mainCategory    | string | ✅   | 主カテゴリ | CategoryType Enum |
| transactionDate | string | ❌   | 取引日時   | ISO 8601形式      |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "subcategory": {
      "id": "food_cafe",
      "categoryType": "EXPENSE",
      "name": "カフェ",
      "parentId": "food",
      "displayOrder": 3,
      "icon": "☕",
      "color": "#795548",
      "isDefault": true,
      "isActive": true
    },
    "confidence": 0.98,
    "reason": "MERCHANT_MATCH",
    "merchantId": "merchant_002",
    "merchantName": "スターバックス"
  }
}
```

**Response Schema (ClassificationResponseDto):**

| フィールド        | 型             | 説明                                                                                   |
| ----------------- | -------------- | -------------------------------------------------------------------------------------- | ------------------------------------ |
| success           | boolean        | 成功フラグ                                                                             |
| data              | object         | 分類結果                                                                               |
| data.subcategory  | SubcategoryDto | サブカテゴリ情報                                                                       |
| data.confidence   | number         | 分類信頼度 (0.00 - 1.00)                                                               |
| data.reason       | string         | 分類理由 (MERCHANT_MATCH, KEYWORD_MATCH, AMOUNT_INFERENCE, RECURRING_PATTERN, DEFAULT) |
| data.merchantId   | string         | null                                                                                   | 店舗ID（店舗マスタにヒットした場合） |
| data.merchantName | string         | null                                                                                   | 店舗名                               |

---

### POST /api/subcategories/batch-classify

**説明**: 複数の取引を一括で分類します。

**Request Body:**

```json
{
  "transactions": [
    {
      "transactionId": "tx_001",
      "description": "セブンイレブン 新宿店",
      "amount": -320,
      "mainCategory": "EXPENSE"
    },
    {
      "transactionId": "tx_002",
      "description": "JR東日本 定期券",
      "amount": -10000,
      "mainCategory": "EXPENSE"
    }
  ]
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "transactionId": "tx_001",
        "success": true,
        "subcategoryId": "food_groceries",
        "confidence": 0.95,
        "reason": "MERCHANT_MATCH"
      },
      {
        "transactionId": "tx_002",
        "success": true,
        "subcategoryId": "transport_train_bus",
        "confidence": 0.8,
        "reason": "KEYWORD_MATCH"
      }
    ],
    "summary": {
      "total": 2,
      "success": 2,
      "failure": 0
    }
  }
}
```

---

### GET /api/merchants

**説明**: 店舗マスタ一覧を取得します。

**Query Parameters:**

| パラメータ | 型     | 必須 | 説明                     | デフォルト |
| ---------- | ------ | ---- | ------------------------ | ---------- |
| page       | number | ❌   | ページ番号（1始まり）    | 1          |
| limit      | number | ❌   | 1ページあたりの件数      | 50         |
| category   | string | ❌   | カテゴリタイプでフィルタ | -          |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "merchant_001",
      "name": "セブンイレブン",
      "aliases": ["7-ELEVEN", "7-11", "セブン-イレブン"],
      "defaultSubcategoryId": "food_groceries",
      "defaultSubcategoryName": "食料品",
      "confidence": 0.95,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    {
      "id": "merchant_002",
      "name": "スターバックス",
      "aliases": ["STARBUCKS", "スタバ"],
      "defaultSubcategoryId": "food_cafe",
      "defaultSubcategoryName": "カフェ",
      "confidence": 0.98,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 50,
  "totalPages": 1
}
```

---

### GET /api/merchants/search

**説明**: 店舗名で店舗マスタを検索します。

**Query Parameters:**

| パラメータ | 型     | 必須 | 説明   | 制約      |
| ---------- | ------ | ---- | ------ | --------- |
| q          | string | ✅   | 検索語 | 1-100文字 |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "merchant_002",
      "name": "スターバックス",
      "aliases": ["STARBUCKS", "スタバ"],
      "defaultSubcategoryId": "food_cafe",
      "defaultSubcategoryName": "カフェ",
      "confidence": 0.98
    }
  ],
  "total": 1
}
```

---

## データモデル定義

### SubcategoryDto

```typescript
interface SubcategoryDto {
  id: string; // サブカテゴリID (例: "food_cafe")
  categoryType: CategoryType; // 主カテゴリ (INCOME | EXPENSE | TRANSFER | REPAYMENT | INVESTMENT)
  name: string; // サブカテゴリ名 (例: "カフェ")
  parentId: string | null; // 親カテゴリID (階層化対応)
  displayOrder: number; // 表示順序
  icon: string | null; // アイコン (例: "☕")
  color: string | null; // 色 (例: "#795548")
  isDefault: boolean; // デフォルト費目かどうか
  isActive: boolean; // アクティブかどうか
  createdAt: string; // 作成日時 (ISO 8601)
  updatedAt: string; // 更新日時 (ISO 8601)
  children?: SubcategoryDto[]; // 子サブカテゴリ（階層取得時）
}
```

### MerchantDto

```typescript
interface MerchantDto {
  id: string; // 店舗ID
  name: string; // 店舗名
  aliases: string[]; // 別名・表記ゆれ
  defaultSubcategoryId: string; // デフォルトサブカテゴリID
  defaultSubcategoryName: string; // デフォルトサブカテゴリ名
  confidence: number; // 信頼度 (0.00 - 1.00)
  createdAt: string; // 作成日時 (ISO 8601)
  updatedAt: string; // 更新日時 (ISO 8601)
}
```

### ClassificationRequestDto

```typescript
interface ClassificationRequestDto {
  transactionId: string; // 取引ID
  description: string; // 取引説明
  amount: number; // 金額
  mainCategory: CategoryType; // 主カテゴリ
  transactionDate?: string; // 取引日時（オプション）
}
```

### ClassificationResponseDto

```typescript
interface ClassificationResponseDto {
  success: boolean;
  data: {
    subcategory: SubcategoryDto;
    confidence: number; // 0.00 - 1.00
    reason: ClassificationReason; // 分類理由
    merchantId?: string | null; // 店舗ID
    merchantName?: string | null; // 店舗名
  };
  error?: string;
}
```

### CategoryType (Enum)

```typescript
enum CategoryType {
  INCOME = 'INCOME', // 収入
  EXPENSE = 'EXPENSE', // 支出
  TRANSFER = 'TRANSFER', // 振替
  REPAYMENT = 'REPAYMENT', // 返済
  INVESTMENT = 'INVESTMENT', // 投資
}
```

### ClassificationReason (Enum)

```typescript
enum ClassificationReason {
  MERCHANT_MATCH = 'MERCHANT_MATCH', // 店舗マスタ一致
  KEYWORD_MATCH = 'KEYWORD_MATCH', // キーワード一致
  AMOUNT_INFERENCE = 'AMOUNT_INFERENCE', // 金額推測
  RECURRING_PATTERN = 'RECURRING_PATTERN', // 定期性判定
  DEFAULT = 'DEFAULT', // デフォルト
}
```

---

## エラーレスポンス

### 共通エラーレスポンス

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string; // エラーコード
    message: string; // エラーメッセージ
    details?: unknown; // 詳細情報（任意）
  };
}
```

### エラーコード一覧

| HTTPステータス | エラーコード                | メッセージ                           | 発生条件             |
| -------------- | --------------------------- | ------------------------------------ | -------------------- |
| 400            | `INVALID_CATEGORY_TYPE`     | 無効なカテゴリタイプです             | 不正なカテゴリタイプ |
| 400            | `INVALID_REQUEST_BODY`      | リクエストボディが不正です           | バリデーションエラー |
| 404            | `SUBCATEGORY_NOT_FOUND`     | サブカテゴリが見つかりません         | サブカテゴリIDが無効 |
| 404            | `MERCHANT_NOT_FOUND`        | 店舗が見つかりません                 | 店舗IDが無効         |
| 500            | `CLASSIFICATION_FAILED`     | 分類処理に失敗しました               | 内部エラー           |
| 503            | `DATABASE_CONNECTION_ERROR` | データベース接続エラーが発生しました | DB接続エラー         |

### エラーレスポンス例

**400 Bad Request:**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CATEGORY_TYPE",
    "message": "無効なカテゴリタイプです",
    "details": {
      "field": "mainCategory",
      "value": "INVALID",
      "allowedValues": ["INCOME", "EXPENSE", "TRANSFER", "REPAYMENT", "INVESTMENT"]
    }
  }
}
```

**404 Not Found:**

```json
{
  "success": false,
  "error": {
    "code": "SUBCATEGORY_NOT_FOUND",
    "message": "サブカテゴリが見つかりません",
    "details": {
      "subcategoryId": "invalid_id"
    }
  }
}
```

---

## バリデーションルール

### SubcategoryDto

| フィールド   | ルール                                     | エラーメッセージ                       |
| ------------ | ------------------------------------------ | -------------------------------------- |
| id           | 必須、1-50文字、英数字とアンダースコアのみ | IDは必須で50文字以内です               |
| categoryType | 必須、CategoryType Enumの値                | 有効なカテゴリタイプを指定してください |
| name         | 必須、1-100文字                            | 名前は必須で100文字以内です            |
| displayOrder | 必須、0以上の整数                          | 表示順序は0以上の整数です              |
| icon         | オプション、10文字以内                     | アイコンは10文字以内です               |
| color        | オプション、HEXカラーコード形式            | 色は#で始まる7文字のHEXコードです      |

### ClassificationRequestDto

| フィールド      | ルール                      | エラーメッセージ                       |
| --------------- | --------------------------- | -------------------------------------- |
| transactionId   | 必須、1-50文字              | 取引IDは必須で50文字以内です           |
| description     | 必須、1-500文字             | 説明は必須で500文字以内です            |
| amount          | 必須、数値                  | 金額は必須です                         |
| mainCategory    | 必須、CategoryType Enumの値 | 有効なカテゴリタイプを指定してください |
| transactionDate | オプション、ISO 8601形式    | 日時はISO 8601形式で指定してください   |

### MerchantDto

| フィールド           | ルール                      | エラーメッセージ                       |
| -------------------- | --------------------------- | -------------------------------------- |
| name                 | 必須、1-200文字             | 店舗名は必須で200文字以内です          |
| aliases              | 配列、各要素1-200文字       | 別名は200文字以内です                  |
| defaultSubcategoryId | 必須、1-50文字、存在する ID | 有効なサブカテゴリIDを指定してください |
| confidence           | 必須、0.00-1.00の範囲       | 信頼度は0.00から1.00の範囲です         |

---

## パフォーマンス要件

### レスポンスタイム

| エンドポイント                         | 目標レスポンスタイム |
| -------------------------------------- | -------------------- |
| GET /api/subcategories                 | 100ms以内            |
| GET /api/subcategories/category/:type  | 100ms以内            |
| POST /api/subcategories/classify       | 50ms以内             |
| POST /api/subcategories/batch-classify | 500ms以内（100件）   |
| GET /api/merchants                     | 100ms以内            |

### キャッシュ戦略

- **サブカテゴリ一覧**: アプリケーション起動時にメモリロード（静的データ）
- **店舗マスタ**: インメモリキャッシュ（1時間TTL）
- **分類結果**: キャッシュしない（リアルタイム分類）

---

## セキュリティ

### 認証・認可

- 全エンドポイント: JWT認証必須
- 店舗マスタ登録・更新: 管理者権限必要（将来実装）

### データ保護

- 取引データは暗号化して保存
- ログに機密情報（金額・店舗名）を含めない

---

## 参考資料

- [README.md](./README.md) - 設計書の概要
- [class-diagrams.md](./class-diagrams.md) - クラス構造
- [sequence-diagrams.md](./sequence-diagrams.md) - 処理フロー
