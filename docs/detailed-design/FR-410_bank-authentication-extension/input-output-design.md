# 入出力設計

このドキュメントでは、銀行認証方式の拡張機能のAPI仕様とデータモデルを記載しています。

## 目次

1. [APIエンドポイント一覧](#apiエンドポイント一覧)
2. [リクエスト/レスポンス仕様](#リクエストレスポンス仕様)
3. [データモデル定義](#データモデル定義)
4. [エラーレスポンス](#エラーレスポンス)
5. [バリデーションルール](#バリデーションルール)

---

## APIエンドポイント一覧

### Institution (金融機関) - FR-410拡張

既存のエンドポイントは変更なし。認証方式の拡張により、リクエスト/レスポンスのDTOが拡張されます。

| Method | Path                                | 説明                                     | 認証 | 変更内容                           |
| ------ | ----------------------------------- | ---------------------------------------- | ---- | ---------------------------------- |
| POST   | `/api/institutions`                 | 金融機関を登録（認証情報の形式が拡張）   | 必要 | `credentials`の構造が拡張          |
| POST   | `/api/institutions/test-connection` | 銀行接続テスト（認証情報の形式が拡張）   | 必要 | `credentials`の構造が拡張          |
| GET    | `/api/institutions/supported-banks` | 対応銀行一覧取得（認証タイプ情報を含む） | 不要 | `authenticationType`フィールド追加 |

### 補足

- **認証**: JWT トークンによる Bearer 認証（接続テスト、金融機関登録は必要）
- **レート制限**: 1分間に60リクエストまで
- **ページネーション**: 対応銀行一覧取得では不要（全件取得）

---

## リクエスト/レスポンス仕様

### POST /api/institutions/test-connection

銀行接続テストを実行します。認証方式の拡張により、リクエストボディの構造が拡張されます。

**Request Body (支店コード＋口座番号認証の例):**

```json
{
  "bankCode": "0009",
  "authenticationType": "branch_account",
  "branchCode": "001",
  "accountNumber": "1234567",
  "apiKey": "your-api-key-here",
  "apiSecret": "your-api-secret-here"
}
```

**Request Body (ユーザID＋パスワード認証の例):**

```json
{
  "bankCode": "0005",
  "authenticationType": "userid_password",
  "userId": "user123",
  "password": "password123"
}
```

**Request Schema (TestBankConnectionDto):**

| フィールド         | 型     | 必須 | 説明            | 制約                                          |
| ------------------ | ------ | ---- | --------------- | --------------------------------------------- |
| bankCode           | string | ✅   | 銀行コード      | 4桁数字（正規表現: `/^\d{4}$/`）              |
| authenticationType | string | ✅   | 認証タイプ      | `"branch_account"` または `"userid_password"` |
| branchCode         | string | ⬜   | 支店コード      | 3桁数字（`branch_account`の場合必須）         |
| accountNumber      | string | ⬜   | 口座番号        | 7桁数字（`branch_account`の場合必須）         |
| apiKey             | string | ⬜   | APIキー         | 1-500文字（オプション）                       |
| apiSecret          | string | ⬜   | APIシークレット | 1-500文字（オプション）                       |
| userId             | string | ⬜   | ユーザID        | 1-100文字（`userid_password`の場合必須）      |
| password           | string | ⬜   | パスワード      | 8-100文字（`userid_password`の場合必須）      |

**注意**: `authenticationType`に応じて、必須フィールドが異なります：

- `branch_account`: `bankCode`、`branchCode`、`accountNumber`が必須
- `userid_password`: `bankCode`、`userId`、`password`が必須

**Response (200 OK - 成功時):**

```json
{
  "success": true,
  "message": "接続に成功しました",
  "accountInfo": {
    "bankName": "三菱UFJ銀行",
    "branchName": "本店",
    "accountNumber": "1234567",
    "accountHolder": "ヤマダ　タロウ",
    "accountType": "ordinary",
    "balance": 1000000,
    "availableBalance": 1000000
  }
}
```

**Response (200 OK - 失敗時):**

```json
{
  "success": false,
  "message": "認証に失敗しました",
  "errorCode": "BE001",
  "accountInfo": null
}
```

**Response Schema (BankConnectionTestResult):**

| フィールド  | 型                    | 説明                       |
| ----------- | --------------------- | -------------------------- |
| success     | boolean               | 接続テストの成功/失敗      |
| message     | string                | メッセージ                 |
| accountInfo | BankAccountInfo\|null | 口座情報（成功時のみ）     |
| errorCode   | string\|undefined     | エラーコード（失敗時のみ） |

**Error Responses:**

- `400 Bad Request`: バリデーションエラー（認証方式不一致、必須フィールド欠如など）
- `401 Unauthorized`: 認証エラー

**TypeScript型定義:**

```typescript
// Request DTO
export interface TestBankConnectionDto {
  bankCode: string; // 4桁数字
  authenticationType: AuthenticationType; // 'branch_account' | 'userid_password'
  // 支店コード＋口座番号認証の場合
  branchCode?: string; // 3桁数字
  accountNumber?: string; // 7桁数字
  apiKey?: string;
  apiSecret?: string;
  // ユーザID＋パスワード認証の場合
  userId?: string; // 1-100文字
  password?: string; // 8-100文字
}

// Response DTO
export interface BankConnectionTestResult {
  success: boolean;
  message: string;
  accountInfo?: BankAccountInfo;
  errorCode?: string;
}
```

---

### POST /api/institutions

金融機関を登録します。認証方式の拡張により、`credentials`の構造が拡張されます。

**Request Body (支店コード＋口座番号認証の例):**

```json
{
  "name": "三井住友銀行",
  "type": "bank",
  "credentials": {
    "bankCode": "0009",
    "authenticationType": "branch_account",
    "branchCode": "001",
    "accountNumber": "1234567",
    "apiKey": "your-api-key-here",
    "apiSecret": "your-api-secret-here"
  }
}
```

**Request Body (ユーザID＋パスワード認証の例):**

```json
{
  "name": "三菱UFJ銀行",
  "type": "bank",
  "credentials": {
    "bankCode": "0005",
    "authenticationType": "userid_password",
    "userId": "user123",
    "password": "password123"
  }
}
```

**Request Schema (CreateInstitutionDto):**

| フィールド  | 型     | 必須 | 説明         | 制約                               |
| ----------- | ------ | ---- | ------------ | ---------------------------------- |
| name        | string | ✅   | 金融機関名   | 1-100文字                          |
| type        | string | ✅   | 金融機関種別 | `"bank"`（銀行の場合）             |
| credentials | object | ✅   | 認証情報     | 認証方式に応じて構造が異なる（※1） |

**※1**: `credentials`の構造は認証方式に応じて異なります：

- **支店コード＋口座番号認証 (`authenticationType: "branch_account"`)**:

  ```json
  {
    "bankCode": "0009",
    "authenticationType": "branch_account",
    "branchCode": "001",
    "accountNumber": "1234567",
    "apiKey": "your-api-key-here",
    "apiSecret": "your-api-secret-here"
  }
  ```

- **ユーザID＋パスワード認証 (`authenticationType: "userid_password"`)**:

```json
{
  "bankCode": "0005",
  "authenticationType": "userid_password",
  "userId": "user123",
  "password": "password123"
}
```

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
    "lastSyncedAt": "2025-12-18T10:30:00Z",
    "accounts": [],
    "createdAt": "2025-12-18T10:30:00Z",
    "updatedAt": "2025-12-18T10:30:00Z"
  }
}
```

**注意**: 認証情報は暗号化されて保存されるため、レスポンスには含まれません。

**Error Responses:**

- `400 Bad Request`: バリデーションエラー（認証方式不一致、必須フィールド欠如など）
- `401 Unauthorized`: 認証エラー

---

### GET /api/institutions/supported-banks

対応銀行一覧を取得します。認証方式の拡張により、各銀行に`authenticationType`情報が含まれます。

**Query Parameters:**

| パラメータ | 型     | 必須 | 説明                   | デフォルト |
| ---------- | ------ | ---- | ---------------------- | ---------- |
| category   | string | ❌   | 銀行カテゴリでフィルタ | -          |
| searchTerm | string | ❌   | 検索キーワード         | -          |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "bank_mufg",
      "code": "0005",
      "name": "三菱UFJ銀行",
      "category": "mega_bank",
      "isSupported": true,
      "authenticationType": "userid_password"
    },
    {
      "id": "bank_mizuho",
      "code": "0001",
      "name": "みずほ銀行",
      "category": "mega_bank",
      "isSupported": true,
      "authenticationType": "userid_password"
    },
    {
      "id": "bank_smbc",
      "code": "0009",
      "name": "三井住友銀行",
      "category": "mega_bank",
      "isSupported": true,
      "authenticationType": "branch_account"
    }
  ],
  "count": 3
}
```

**Response Schema (BankResponseDto):**

| フィールド         | 型      | 説明                   |
| ------------------ | ------- | ---------------------- |
| id                 | string  | 銀行ID                 |
| code               | string  | 銀行コード（4桁数字）  |
| name               | string  | 銀行名                 |
| category           | string  | 銀行カテゴリ           |
| isSupported        | boolean | サポート対象かどうか   |
| authenticationType | string  | 認証タイプ（新規追加） |

**TypeScript型定義:**

```typescript
// Response DTO
export interface BankResponseDto {
  id: string;
  code: string; // 4桁数字
  name: string;
  category: BankCategory; // 'mega_bank' | 'regional_bank' | 'online_bank'
  isSupported: boolean;
  authenticationType: AuthenticationType; // 'branch_account' | 'userid_password'
}
```

## データモデル定義

### AuthenticationType Enum

```typescript
export enum AuthenticationType {
  BRANCH_ACCOUNT = 'branch_account', // 支店コード＋口座番号
  USERID_PASSWORD = 'userid_password', // ユーザID＋パスワード
}
```

### BankCredentials Interface (拡張)

```typescript
export interface BankCredentials {
  bankCode: string; // 銀行コード（4桁数字、必須）
  authenticationType: AuthenticationType; // 認証タイプ（必須）

  // 支店コード＋口座番号認証の場合
  branchCode?: string; // 支店コード（3桁数字）
  accountNumber?: string; // 口座番号（7桁数字）
  apiKey?: string; // APIキー（オプション）
  apiSecret?: string; // APIシークレット（オプション）

  // ユーザID＋パスワード認証の場合
  userId?: string; // ユーザID（1-100文字）
  password?: string; // パスワード（8-100文字、暗号化して保存）

  [key: string]: unknown; // その他の銀行固有の認証情報
}
```

### Bank Interface (拡張)

```typescript
export interface Bank {
  id: string;
  code: string; // 銀行コード（4桁）
  name: string;
  category: BankCategory; // 'mega_bank' | 'regional_bank' | 'online_bank'
  isSupported: boolean;
  authenticationType: AuthenticationType; // 新規追加: 認証タイプ
}
```

### BankAccountInfo Interface (変更なし)

```typescript
export interface BankAccountInfo {
  bankName: string;
  branchName: string;
  accountNumber: string;
  accountHolder: string;
  accountType: BankAccountType; // 'ordinary' | 'current' | 'savings' | 'time_deposit'
  balance: number;
  availableBalance: number;
}
```

### BankConnectionTestResult Interface (変更なし)

```typescript
export interface BankConnectionTestResult {
  success: boolean;
  message: string;
  accountInfo?: BankAccountInfo;
  errorCode?: string;
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
      "field": "credentials",
      "message": "認証方式が一致しません"
    }
  ],
  "timestamp": "2025-12-18T00:00:00.000Z",
  "path": "/api/institutions/test-connection"
}
```

### HTTPステータスコード

| ステータスコード | 説明                  | 使用例                               |
| ---------------- | --------------------- | ------------------------------------ |
| 200              | OK                    | 接続テスト結果（成功/失敗）          |
| 201              | Created               | 金融機関登録成功                     |
| 400              | Bad Request           | バリデーションエラー、認証方式不一致 |
| 401              | Unauthorized          | 認証エラー                           |
| 500              | Internal Server Error | サーバーエラー                       |

### バリデーションエラー (400) - 認証方式不一致

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "credentials",
      "message": "認証方式が一致しません。三菱UFJ銀行(0005)はuserid_password認証が必要です"
    }
  ]
}
```

### バリデーションエラー (400) - 必須フィールド欠如

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "credentials.userId",
      "message": "userIdは必須です（userid_password認証の場合）"
    },
    {
      "field": "credentials.password",
      "message": "passwordは必須です（userid_password認証の場合）"
    }
  ]
}
```

### バリデーションエラー (400) - フィールド形式エラー

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "credentials.branchCode",
      "value": "12",
      "message": "branchCodeは3桁の数字で入力してください",
      "constraints": {
        "pattern": "/^\\d{3}$/"
      }
    }
  ]
}
```

### 接続テスト失敗 (200 OK with error)

```json
{
  "success": false,
  "message": "認証に失敗しました",
  "errorCode": "BE001",
  "accountInfo": null
}
```

---

## バリデーションルール

### TestBankConnectionDto

認証方式に応じて、必須フィールドが異なります。

| フィールド         | バリデーション                                             | 認証方式依存                     |
| ------------------ | ---------------------------------------------------------- | -------------------------------- |
| bankCode           | 必須、文字列、4桁数字（正規表現: `/^\d{4}$/`）             | 共通                             |
| authenticationType | 必須、Enum (`"branch_account"` または `"userid_password"`) | 共通                             |
| branchCode         | 条件付き必須、文字列、3桁数字（正規表現: `/^\d{3}$/`）     | `branch_account`の場合必須       |
| accountNumber      | 条件付き必須、文字列、7桁数字（正規表現: `/^\d{7}$/`）     | `branch_account`の場合必須       |
| apiKey             | オプション、文字列、1-500文字                              | `branch_account`の場合オプション |
| apiSecret          | オプション、文字列、1-500文字                              | `branch_account`の場合オプション |
| userId             | 条件付き必須、文字列、1-100文字                            | `userid_password`の場合必須      |
| password           | 条件付き必須、文字列、8-100文字                            | `userid_password`の場合必須      |

**実装例 (class-validator):**

```typescript
import { IsString, IsEnum, IsOptional, Length, Matches, Validate } from 'class-validator';
import { AuthenticationType } from '@account-book/types';

export class TestBankConnectionDto {
  @IsString()
  @Matches(/^\d{4}$/, { message: '銀行コードは4桁の数字で入力してください' })
  bankCode!: string;

  @IsEnum(AuthenticationType, {
    message: '認証タイプは有効な値を指定してください',
  })
  authenticationType!: AuthenticationType;

  // 支店コード＋口座番号認証の場合
  @IsOptional()
  @IsString()
  @Matches(/^\d{3}$/, { message: '支店コードは3桁の数字で入力してください' })
  branchCode?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{7}$/, { message: '口座番号は7桁の数字で入力してください' })
  accountNumber?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  apiKey?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  apiSecret?: string;

  // ユーザID＋パスワード認証の場合
  @IsOptional()
  @IsString()
  @Length(1, 100, { message: 'ユーザIDは1-100文字で入力してください' })
  userId?: string;

  @IsOptional()
  @IsString()
  @Length(8, 100, { message: 'パスワードは8-100文字で入力してください' })
  password?: string;
}
```

**カスタムバリデーター (IsValidBankCredentialsConstraint):**

```typescript
@ValidatorConstraint({ name: 'isValidBankCredentials', async: false })
export class IsValidBankCredentialsConstraint implements ValidatorConstraintInterface {
  validate(credentials: Record<string, unknown> | undefined, args: ValidationArguments): boolean {
    if (!credentials || typeof credentials !== 'object') {
      return true; // @IsNotEmptyでチェックされるため
    }

    const object = args.object as CreateInstitutionDto;
    if (object.type !== InstitutionType.BANK) {
      return true; // 銀行タイプ以外はスキップ
    }

    const { bankCode, authenticationType } = credentials;

    // 銀行コードのチェック
    if (!/^\d{4}$/.test(bankCode as string)) {
      return false;
    }

    // 認証方式に応じたバリデーション
    if (authenticationType === AuthenticationType.BRANCH_ACCOUNT) {
      const { branchCode, accountNumber } = credentials;
      return (
        typeof branchCode === 'string' &&
        /^\d{3}$/.test(branchCode) &&
        typeof accountNumber === 'string' &&
        /^\d{7}$/.test(accountNumber)
      );
    } else if (authenticationType === AuthenticationType.USERID_PASSWORD) {
      const { userId, password } = credentials;
      return (
        typeof userId === 'string' &&
        userId.length >= 1 &&
        userId.length <= 100 &&
        typeof password === 'string' &&
        password.length >= 8 &&
        password.length <= 100
      );
    }

    return false;
  }

  defaultMessage(_args: ValidationArguments): string {
    return '認証方式に応じた必須フィールドが不足しています';
  }
}
```

### CreateInstitutionDto (拡張)

`credentials`フィールドのバリデーションが拡張されます。

| フィールド  | バリデーション                                                 |
| ----------- | -------------------------------------------------------------- |
| name        | 必須、文字列、1-100文字                                        |
| type        | 必須、Enum (`"bank"`)                                          |
| credentials | 必須、オブジェクト、認証方式に応じたバリデーション（上記参照） |

---

## API使用例

### cURL

```bash
# 作成
curl -X POST http://localhost:3000/api/[resource] \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "field1": "値1",
    "field2": 123
  }'

# 一覧取得
curl -X GET "http://localhost:3000/api/[resource]?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 詳細取得
curl -X GET http://localhost:3000/api/[resource]/uuid \
  -H "Authorization: Bearer YOUR_TOKEN"

# 更新
curl -X PUT http://localhost:3000/api/[resource]/uuid \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "field1": "更新値1"
  }'

# 削除
curl -X DELETE http://localhost:3000/api/[resource]/uuid \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### TypeScript (Fetch API)

```typescript
// 作成
const response = await fetch('http://localhost:3000/api/[resource]', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    field1: '値1',
    field2: 123,
  }),
});

const data = await response.json();
```

---

## チェックリスト

入出力設計作成時の確認事項：

### 基本項目

- [ ] すべてのエンドポイントが定義されている
- [ ] リクエスト/レスポンスの型が明確
- [ ] HTTPメソッドが適切に選択されている
- [ ] HTTPステータスコードが適切

### 詳細項目

- [ ] バリデーションルールが明確
- [ ] エラーレスポンスが定義されている
- [ ] ページネーションが実装されている（一覧取得）
- [ ] 認証・認可が考慮されている

### ドキュメント

- [ ] 使用例（cURL/TypeScript）が提供されている
- [ ] TypeScript型定義が明確
- [ ] Enum定義がある（必要な場合）
