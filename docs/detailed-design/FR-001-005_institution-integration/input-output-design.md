# 入出力設計

このドキュメントでは、金融機関連携機能のAPI仕様とデータモデルを記載しています。

## 目次

1. [APIエンドポイント一覧](#apiエンドポイント一覧)
2. [リクエスト/レスポンス仕様](#リクエストレスポンス仕様)
3. [データモデル定義](#データモデル定義)
4. [エラーレスポンス](#エラーレスポンス)
5. [バリデーションルール](#バリデーションルール)

---

## APIエンドポイント一覧

### Institution (金融機関) - FR-001

| Method | Path                                      | 説明               | 認証 |
| ------ | ----------------------------------------- | ------------------ | ---- |
| POST   | `/api/institutions`                       | 金融機関を登録     | 必要 |
| GET    | `/api/institutions`                       | 金融機関一覧を取得 | 必要 |
| GET    | `/api/institutions/banks/supported`       | 対応銀行一覧を取得 | 不要 |
| POST   | `/api/institutions/banks/test-connection` | 銀行接続テスト     | 必要 |

### Credit Card (クレジットカード) - FR-002

| Method | Path                                 | 説明                       | 認証 |
| ------ | ------------------------------------ | -------------------------- | ---- |
| POST   | `/api/credit-cards`                  | クレジットカードを登録     | 必要 |
| GET    | `/api/credit-cards`                  | クレジットカード一覧を取得 | 必要 |
| GET    | `/api/credit-cards/:id`              | クレジットカード詳細を取得 | 必要 |
| GET    | `/api/credit-cards/:id/transactions` | 利用明細を取得             | 必要 |
| GET    | `/api/credit-cards/:id/payment-info` | 請求情報を取得             | 必要 |

### Securities (証券) - FR-003

| Method | Path                                     | 説明               | 認証 |
| ------ | ---------------------------------------- | ------------------ | ---- |
| POST   | `/api/securities-accounts`               | 証券口座を登録     | 必要 |
| GET    | `/api/securities-accounts`               | 証券口座一覧を取得 | 必要 |
| GET    | `/api/securities-accounts/:id`           | 証券口座詳細を取得 | 必要 |
| GET    | `/api/securities-accounts/:id/portfolio` | 保有銘柄を取得     | 必要 |

### Health (接続確認・通知) - FR-004, FR-005

| Method | Path                                 | 説明                     | 認証 |
| ------ | ------------------------------------ | ------------------------ | ---- |
| GET    | `/api/health/check-all`              | 全金融機関の接続確認     | 必要 |
| GET    | `/api/health/check/:id`              | 特定金融機関の接続確認   | 必要 |
| GET    | `/api/health/history`                | 接続履歴を取得           | 必要 |
| GET    | `/api/health/history/:institutionId` | 特定金融機関の履歴を取得 | 必要 |

---

## リクエスト/レスポンス仕様

### POST /api/institutions

金融機関（銀行）を登録します。

**Request Body:**

```json
{
  "name": "三菱UFJ銀行",
  "type": "bank",
  "bankCode": "0005",
  "branchCode": "001",
  "accountNumber": "1234567",
  "apiKey": "your-api-key-here"
}
```

**Request Schema (CreateInstitutionDto):**

| フィールド    | 型     | 必須 | 説明         | 制約                                     |
| ------------- | ------ | ---- | ------------ | ---------------------------------------- |
| name          | string | ✅   | 金融機関名   | 1-100文字                                |
| type          | string | ✅   | 金融機関種別 | "bank", "credit-card", "securities" (※1) |
| bankCode      | string | ✅   | 銀行コード   | 4桁数字                                  |
| branchCode    | string | ✅   | 支店コード   | 3桁数字                                  |
| accountNumber | string | ✅   | 口座番号     | 7桁数字                                  |
| apiKey        | string | ✅   | APIキー      | 1-500文字                                |

**※1**: `type`フィールドは`@account-book/types`パッケージの`InstitutionType` Enumとして実装されており、型安全性が確保されています。

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "inst_1234567890",
    "name": "三菱UFJ銀行",
    "type": "bank",
    "credentials": {
      "encrypted": true
    },
    "isConnected": true,
    "lastSyncedAt": "2025-11-20T10:30:00Z",
    "accounts": [
      {
        "id": "acc_0987654321",
        "accountNumber": "1234567",
        "accountName": "普通預金",
        "accountType": "savings",
        "balance": 500000,
        "availableBalance": 500000,
        "createdAt": "2025-11-20T10:30:00Z",
        "updatedAt": "2025-11-20T10:30:00Z"
      }
    ],
    "createdAt": "2025-11-20T10:30:00Z",
    "updatedAt": "2025-11-20T10:30:00Z"
  }
}
```

---

### GET /api/institutions

登録済みの金融機関一覧を取得します。

**Query Parameters:**

| パラメータ  | 型      | 必須 | 説明                   | デフォルト |
| ----------- | ------- | ---- | ---------------------- | ---------- |
| type        | string  | ❌   | 金融機関種別でフィルタ | -          |
| isConnected | boolean | ❌   | 接続状態でフィルタ     | -          |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "inst_1234567890",
      "name": "三菱UFJ銀行",
      "type": "bank",
      "credentials": {
        "encrypted": true
      },
      "isConnected": true,
      "lastSyncedAt": "2025-11-20T10:30:00Z",
      "accounts": [],
      "createdAt": "2025-11-20T10:30:00Z",
      "updatedAt": "2025-11-20T10:30:00Z"
    }
  ],
  "count": 1
}
```

---

### POST /api/credit-cards

クレジットカードを登録します。

**Request Body:**

```json
{
  "cardName": "三井住友カード",
  "cardNumber": "1234567812345678",
  "cardHolderName": "TARO YAMADA",
  "expiryDate": "2028-12-31",
  "issuer": "三井住友カード株式会社",
  "loginId": "user@example.com",
  "password": "your-password",
  "paymentDay": 10,
  "closingDay": 15,
  "creditLimit": 500000
}
```

**Request Schema (ConnectCreditCardDto):**

| フィールド     | 型     | 必須 | 説明       | 制約               |
| -------------- | ------ | ---- | ---------- | ------------------ |
| cardName       | string | ✅   | カード名   | 1-100文字          |
| cardNumber     | string | ✅   | カード番号 | 16桁数字、Luhn検証 |
| cardHolderName | string | ✅   | カード名義 | 1-100文字          |
| expiryDate     | string | ✅   | 有効期限   | YYYY-MM-DD形式     |
| issuer         | string | ✅   | 発行会社   | 1-100文字          |
| loginId        | string | ✅   | ログインID | メールアドレス形式 |
| password       | string | ✅   | パスワード | 8-100文字          |
| paymentDay     | number | ✅   | 引落日     | 1-31               |
| closingDay     | number | ✅   | 締め日     | 1-31               |
| creditLimit    | number | ✅   | 利用限度額 | 正の数             |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "card_1234567890",
    "cardName": "三井住友カード",
    "cardNumber": "5678",
    "cardHolderName": "TARO YAMADA",
    "expiryDate": "2028-12-31T00:00:00Z",
    "credentials": {
      "encrypted": true
    },
    "isConnected": true,
    "lastSyncedAt": "2025-11-20T10:30:00Z",
    "paymentDay": 10,
    "closingDay": 15,
    "creditLimit": 500000,
    "currentBalance": 120000,
    "availableCredit": 380000,
    "utilizationRate": 24,
    "issuer": "三井住友カード株式会社",
    "isExpired": false,
    "createdAt": "2025-11-20T10:30:00Z",
    "updatedAt": "2025-11-20T10:30:00Z"
  }
}
```

**注意**: カード番号は下4桁のみ保存・返却されます（PCI-DSS準拠）。

---

### GET /api/credit-cards/:id/transactions

クレジットカードの利用明細を取得します。

**Path Parameters:**

| パラメータ | 型     | 必須 | 説明               |
| ---------- | ------ | ---- | ------------------ |
| id         | string | ✅   | クレジットカードID |

**Query Parameters:**

| パラメータ | 型     | 必須 | 説明                 | デフォルト |
| ---------- | ------ | ---- | -------------------- | ---------- |
| from       | string | ❌   | 開始日（YYYY-MM-DD） | 3ヶ月前    |
| to         | string | ❌   | 終了日（YYYY-MM-DD） | 今日       |
| status     | string | ❌   | 決済ステータス       | -          |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "trans_1234567890",
      "creditCardId": "card_1234567890",
      "usageDate": "2025-11-15T14:30:00Z",
      "merchantName": "スーパーマーケット",
      "amount": -3500,
      "status": "settled",
      "paymentDate": "2025-12-10T00:00:00Z",
      "category": "食費",
      "createdAt": "2025-11-16T01:00:00Z",
      "updatedAt": "2025-11-16T01:00:00Z"
    }
  ],
  "count": 1
}
```

---

### POST /api/securities-accounts

証券口座を登録します。

**Request Body:**

```json
{
  "securitiesCompanyName": "SBI証券",
  "accountNumber": "12345678",
  "accountType": "specific",
  "loginId": "user@example.com",
  "password": "your-password",
  "tradePassword": "1234"
}
```

**Request Schema (ConnectSecuritiesAccountDto):**

| フィールド            | 型     | 必須 | 説明         | 制約                                                   |
| --------------------- | ------ | ---- | ------------ | ------------------------------------------------------ |
| securitiesCompanyName | string | ✅   | 証券会社名   | 1-100文字                                              |
| accountNumber         | string | ✅   | 口座番号     | 1-50文字                                               |
| accountType           | string | ✅   | 口座種別     | "general", "specific", "nisa", "tsumitate-nisa", "isa" |
| loginId               | string | ✅   | ログインID   | メールアドレス形式                                     |
| password              | string | ✅   | パスワード   | 8-100文字                                              |
| tradePassword         | string | ❌   | 取引暗証番号 | 4-6桁数字                                              |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "sec_1234567890",
    "securitiesCompanyName": "SBI証券",
    "accountNumber": "12345678",
    "accountType": "specific",
    "credentials": {
      "encrypted": true
    },
    "isConnected": true,
    "lastSyncedAt": "2025-11-20T10:30:00Z",
    "totalEvaluationAmount": 1500000,
    "cashBalance": 200000,
    "totalProfitLoss": 150000,
    "totalProfitLossRate": 10.5,
    "createdAt": "2025-11-20T10:30:00Z",
    "updatedAt": "2025-11-20T10:30:00Z"
  }
}
```

---

### GET /api/health/check-all

全ての登録済み金融機関の接続確認を実行します。

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "institutionId": "inst_1234567890",
      "institutionName": "三菱UFJ銀行",
      "institutionType": "bank",
      "status": "CONNECTED",
      "responseTime": 1234,
      "checkedAt": "2025-11-20T10:30:00Z",
      "errorMessage": null,
      "errorCode": null
    },
    {
      "institutionId": "card_0987654321",
      "institutionName": "三井住友カード",
      "institutionType": "credit-card",
      "status": "NEED_REAUTH",
      "responseTime": 2345,
      "checkedAt": "2025-11-20T10:30:00Z",
      "errorMessage": "認証トークンの有効期限が切れています",
      "errorCode": "AUTH_TOKEN_EXPIRED"
    }
  ],
  "summary": {
    "total": 2,
    "connected": 1,
    "disconnected": 0,
    "needReauth": 1,
    "checking": 0
  }
}
```

---

## データモデル定義

### Institution (金融機関)

保存先: `data/institutions/institutions.json`

```json
{
  "institutions": [
    {
      "id": "inst_uuid_v4",
      "name": "三菱UFJ銀行",
      "type": "bank",
      "credentials": {
        "encryptedData": "...",
        "iv": "..."
      },
      "isConnected": true,
      "lastSyncedAt": "2025-11-20T10:30:00.000Z",
      "accounts": [
        {
          "id": "acc_uuid_v4",
          "accountNumber": "1234567",
          "accountName": "普通預金",
          "accountType": "savings",
          "balance": 500000,
          "availableBalance": 500000,
          "createdAt": "2025-11-20T10:30:00.000Z",
          "updatedAt": "2025-11-20T10:30:00.000Z"
        }
      ],
      "createdAt": "2025-11-20T10:30:00.000Z",
      "updatedAt": "2025-11-20T10:30:00.000Z"
    }
  ]
}
```

### CreditCard (クレジットカード)

保存先: `data/credit-cards/credit-cards.json`

```json
{
  "creditCards": [
    {
      "id": "card_uuid_v4",
      "cardName": "三井住友カード",
      "cardNumber": "5678",
      "cardHolderName": "TARO YAMADA",
      "expiryDate": "2028-12-31T00:00:00.000Z",
      "credentials": {
        "encryptedData": "...",
        "iv": "..."
      },
      "isConnected": true,
      "lastSyncedAt": "2025-11-20T10:30:00.000Z",
      "paymentDay": 10,
      "closingDay": 15,
      "creditLimit": 500000,
      "currentBalance": 120000,
      "issuer": "三井住友カード株式会社",
      "createdAt": "2025-11-20T10:30:00.000Z",
      "updatedAt": "2025-11-20T10:30:00.000Z"
    }
  ]
}
```

### SecuritiesAccount (証券口座)

保存先: `data/securities/securities-accounts.json`

```json
{
  "securitiesAccounts": [
    {
      "id": "sec_uuid_v4",
      "securitiesCompanyName": "SBI証券",
      "accountNumber": "12345678",
      "accountType": "specific",
      "credentials": {
        "encryptedData": "...",
        "iv": "..."
      },
      "isConnected": true,
      "lastSyncedAt": "2025-11-20T10:30:00.000Z",
      "totalEvaluationAmount": 1500000,
      "cashBalance": 200000,
      "createdAt": "2025-11-20T10:30:00.000Z",
      "updatedAt": "2025-11-20T10:30:00.000Z"
    }
  ]
}
```

### ConnectionHistory (接続履歴)

保存先: `data/health/connection-history.json`

```json
{
  "history": [
    {
      "id": "hist_uuid_v4",
      "institutionId": "inst_1234567890",
      "institutionName": "三菱UFJ銀行",
      "institutionType": "bank",
      "status": "CONNECTED",
      "checkedAt": "2025-11-20T10:30:00.000Z",
      "responseTime": 1234,
      "errorMessage": null,
      "errorCode": null
    }
  ]
}
```

---

## エラーレスポンス

### エラーレスポンス形式

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": {
      "field": "フィールド名",
      "reason": "詳細な理由"
    }
  }
}
```

### エラーコード一覧

#### 銀行連携 (FR-001)

| コード | HTTPステータス | メッセージ          | 説明                |
| ------ | -------------- | ------------------- | ------------------- |
| BE001  | 400            | Invalid credentials | 認証情報が不正      |
| BE002  | 408            | Connection timeout  | API接続タイムアウト |
| BE003  | 502            | Bank API error      | 銀行API側エラー     |
| BE004  | 400            | Unsupported bank    | 対応していない銀行  |
| BE005  | 429            | Rate limit exceeded | APIレート制限超過   |

#### クレジットカード連携 (FR-002)

| コード | HTTPステータス | メッセージ          | 説明                  |
| ------ | -------------- | ------------------- | --------------------- |
| CC001  | 400            | Invalid credentials | 認証情報が不正        |
| CC002  | 408            | Connection timeout  | API接続タイムアウト   |
| CC003  | 502            | Card API error      | カード会社API側エラー |
| CC004  | 400            | Unsupported card    | 対応していないカード  |
| CC005  | 400            | Card expired        | カード有効期限切れ    |
| CC006  | 403            | Unauthorized access | 利用明細取得権限なし  |

#### 証券連携 (FR-003)

| コード | HTTPステータス | メッセージ              | 説明                |
| ------ | -------------- | ----------------------- | ------------------- |
| SC001  | 400            | Invalid credentials     | 認証情報が不正      |
| SC002  | 408            | Connection timeout      | API接続タイムアウト |
| SC003  | 502            | Securities API error    | 証券会社API側エラー |
| SC004  | 400            | Outside trading hours   | 取引時間外          |
| SC005  | 403            | API access unauthorized | API利用権限なし     |

#### 接続確認 (FR-004)

| コード | HTTPステータス | メッセージ              | 説明                   |
| ------ | -------------- | ----------------------- | ---------------------- |
| HC001  | 404            | Institution not found   | 金融機関が見つからない |
| HC002  | 500            | Connection check failed | 接続確認に失敗         |

---

## バリデーションルール

### 共通バリデーション

- **必須フィールド**: 空文字列・null・undefinedは不可
- **文字列長**: 指定された文字数制限を守る
- **数値範囲**: 指定された範囲内の値のみ許可
- **日付形式**: ISO 8601形式（YYYY-MM-DDTHH:mm:ss.sssZ）

### 金融機関登録

```typescript
// CreateInstitutionDto
{
  name: string (1-100文字),
  type: "bank" | "credit-card" | "securities",
  bankCode: string (4桁数字、正規表現: /^\d{4}$/),
  branchCode: string (3桁数字、正規表現: /^\d{3}$/),
  accountNumber: string (7桁数字、正規表現: /^\d{7}$/),
  apiKey: string (1-500文字)
}
```

### クレジットカード登録

```typescript
// ConnectCreditCardDto
{
  cardName: string (1-100文字),
  cardNumber: string (16桁数字 + Luhn検証),
  cardHolderName: string (1-100文字),
  expiryDate: Date (未来日付のみ),
  issuer: string (1-100文字),
  loginId: string (メールアドレス形式),
  password: string (8-100文字),
  paymentDay: number (1-31),
  closingDay: number (1-31),
  creditLimit: number (> 0)
}
```

### 証券口座登録

```typescript
// ConnectSecuritiesAccountDto
{
  securitiesCompanyName: string (1-100文字),
  accountNumber: string (1-50文字),
  accountType: "general" | "specific" | "nisa" | "tsumitate-nisa" | "isa",
  loginId: string (メールアドレス形式),
  password: string (8-100文字),
  tradePassword?: string (4-6桁数字、任意)
}
```

---

## まとめ

この入出力設計書は、金融機関連携機能における全てのAPI仕様とデータモデルを網羅しています。バリデーションルール、エラーハンドリング、セキュリティ要件も明確に定義されており、実装時の指針として活用できます。
