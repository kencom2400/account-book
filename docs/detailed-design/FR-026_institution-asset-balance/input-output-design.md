# 入出力設計

このドキュメントでは、金融機関別資産残高表示機能のAPI仕様とデータモデルを記載しています。

## 目次

1. [APIエンドポイント一覧](#apiエンドポイント一覧)
2. [リクエスト/レスポンス仕様](#リクエストレスポンス仕様)
3. [データモデル定義](#データモデル定義)
4. [エラーレスポンス](#エラーレスポンス)
5. [バリデーションルール](#バリデーションルール)

---

## APIエンドポイント一覧

### 資産残高取得 - FR-026

| Method | Path                             | 説明               | 認証     |
| ------ | -------------------------------- | ------------------ | -------- |
| GET    | `/api/aggregation/asset-balance` | 資産残高情報を取得 | 将来対応 |

### 補足

- **認証**: 将来対応（現在は不要）
- **レート制限**: 将来対応
- **ページネーション**: 不要（集計結果のため）

---

## リクエスト/レスポンス仕様

### GET /api/aggregation/asset-balance

各金融機関の現在残高を集計し、総資産や機関別の構成比を取得します。

**Query Parameters:**

| パラメータ | 型     | 必須 | デフォルト | 説明                              |
| ---------- | ------ | ---- | ---------- | --------------------------------- |
| asOfDate   | string | ❌   | 今日       | 基準日（ISO8601形式: YYYY-MM-DD） |

**Request Example:**

```
GET /api/aggregation/asset-balance
GET /api/aggregation/asset-balance?asOfDate=2025-01-15
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "totalAssets": 5358023,
    "totalLiabilities": 123456,
    "netWorth": 5234567,
    "institutions": [
      {
        "institutionId": "inst-001",
        "institutionName": "三菱UFJ銀行",
        "institutionType": "bank",
        "icon": "🏦",
        "accounts": [
          {
            "accountId": "acc-001",
            "accountName": "普通預金",
            "accountType": "SAVINGS",
            "balance": 1234567,
            "currency": "JPY"
          },
          {
            "accountId": "acc-002",
            "accountName": "定期預金",
            "accountType": "TIME_DEPOSIT",
            "balance": 2000000,
            "currency": "JPY"
          }
        ],
        "total": 3234567,
        "percentage": 60.4
      },
      {
        "institutionId": "inst-002",
        "institutionName": "楽天カード",
        "institutionType": "credit-card",
        "icon": "💳",
        "accounts": [
          {
            "accountId": "acc-003",
            "accountName": "メインカード",
            "accountType": "CREDIT_CARD",
            "balance": -123456,
            "currency": "JPY"
          }
        ],
        "total": -123456,
        "percentage": 0.0
      },
      {
        "institutionId": "inst-003",
        "institutionName": "SBI証券",
        "institutionType": "securities",
        "icon": "📈",
        "accounts": [
          {
            "accountId": "acc-004",
            "accountName": "株式",
            "accountType": "STOCK",
            "balance": 1500000,
            "currency": "JPY"
          },
          {
            "accountId": "acc-005",
            "accountName": "投資信託",
            "accountType": "MUTUAL_FUND",
            "balance": 623456,
            "currency": "JPY"
          }
        ],
        "total": 2123456,
        "percentage": 39.6
      }
    ],
    "asOfDate": "2025-01-27T00:00:00.000Z",
    "previousMonth": {
      "diff": 123456,
      "rate": 2.4
    },
    "previousYear": {
      "diff": 500000,
      "rate": 10.8
    }
  }
}
```

**Response Schema (AssetBalanceResponseDto):**

| フィールド       | 型                    | 説明                                     |
| ---------------- | --------------------- | ---------------------------------------- |
| totalAssets      | number                | 総資産（プラス残高の合計）               |
| totalLiabilities | number                | 総負債（マイナス残高の合計の絶対値）     |
| netWorth         | number                | 純資産（totalAssets - totalLiabilities） |
| institutions     | InstitutionAssetDto[] | 金融機関別資産情報配列                   |
| asOfDate         | string                | 基準日（ISO8601形式）                    |
| previousMonth    | AssetComparisonDto    | 前月比                                   |
| previousYear     | AssetComparisonDto    | 前年比                                   |

**InstitutionAssetDto:**

| フィールド      | 型                | 説明                                               |
| --------------- | ----------------- | -------------------------------------------------- |
| institutionId   | string            | 金融機関ID                                         |
| institutionName | string            | 金融機関名                                         |
| institutionType | InstitutionType   | 金融機関タイプ（bank, credit-card, securities）    |
| icon            | string            | アイコン（絵文字）                                 |
| accounts        | AccountAssetDto[] | 口座別資産情報配列                                 |
| total           | number            | 機関別合計（全口座の合計）                         |
| percentage      | number            | 構成比（%）（総資産に対する割合）。負債の場合は0.0 |

**AccountAssetDto:**

| フィールド  | 型          | 説明       |
| ----------- | ----------- | ---------- |
| accountId   | string      | 口座ID     |
| accountName | string      | 口座名     |
| accountType | AccountType | 口座タイプ |
| balance     | number      | 残高       |
| currency    | string      | 通貨       |

**AssetComparisonDto:**

| フィールド | 型     | 説明        |
| ---------- | ------ | ----------- |
| diff       | number | 増減額      |
| rate       | number | 増減率（%） |

**Error Responses:**

- `400 Bad Request`: バリデーションエラー（基準日の形式エラーなど）
- `500 Internal Server Error`: サーバーエラー（DB接続失敗など）

**TypeScript型定義:**

```typescript
// Request DTO（class）
import { IsDateString, IsOptional } from 'class-validator';

export class GetAssetBalanceDto {
  @IsDateString()
  @IsOptional()
  asOfDate?: string;
}

// Response DTO（interface）
export interface AssetBalanceResponseDto {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  institutions: InstitutionAssetDto[];
  asOfDate: string; // ISO8601形式
  previousMonth: AssetComparisonDto;
  previousYear: AssetComparisonDto;
}

export interface InstitutionAssetDto {
  institutionId: string;
  institutionName: string;
  institutionType: InstitutionType;
  icon: string;
  accounts: AccountAssetDto[];
  total: number;
  percentage: number;
}

export enum AccountType {
  SAVINGS = 'SAVINGS',
  TIME_DEPOSIT = 'TIME_DEPOSIT',
  CREDIT_CARD = 'CREDIT_CARD',
  STOCK = 'STOCK',
  MUTUAL_FUND = 'MUTUAL_FUND',
  OTHER = 'OTHER',
}

export interface AccountAssetDto {
  accountId: string;
  accountName: string;
  accountType: AccountType;
  balance: number;
  currency: string;
}

export interface AssetComparisonDto {
  diff: number;
  rate: number;
}

export enum InstitutionType {
  BANK = 'bank',
  CREDIT_CARD = 'credit-card',
  SECURITIES = 'securities',
}
```

**データが存在しない場合のレスポンス:**

金融機関が存在しない場合は、空データを返します（500エラーではなく200 OKで空データを返す）。

```json
{
  "success": true,
  "data": {
    "totalAssets": 0,
    "totalLiabilities": 0,
    "netWorth": 0,
    "institutions": [],
    "asOfDate": "2025-01-27T00:00:00.000Z",
    "previousMonth": {
      "diff": 0,
      "rate": 0
    },
    "previousYear": {
      "diff": 0,
      "rate": 0
    }
  }
}
```

**重要**: どちらの場合でも、500エラーではなく200 OKで返す。これは正常なシナリオの一つとして扱う。

---

## データモデル定義

### InstitutionEntity（既存）

```typescript
export interface InstitutionEntity {
  id: string;
  name: string;
  type: InstitutionType; // bank, credit-card, securities
  credentials: EncryptedCredentials;
  accounts: AccountEntity[];
  isConnected: boolean;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### AccountEntity（既存）

```typescript
export interface AccountEntity {
  id: string;
  institutionId: string;
  accountNumber: string;
  accountName: string;
  balance: number; // 現在の残高
  currency: string;
}
```

### InstitutionType（既存）

```typescript
export enum InstitutionType {
  BANK = 'bank', // 銀行
  CREDIT_CARD = 'credit-card', // クレジットカード
  SECURITIES = 'securities', // 証券会社
}
```

### AssetClassification（Value Object - 新規作成）

```typescript
export interface AssetClassification {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}
```

---

## エラーレスポンス

### 共通エラーレスポンス形式

すべてのエラーレスポンスは以下の共通形式に従う：

```typescript
interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  code?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  timestamp: string;
  path: string;
}
```

### エラーレスポンス例

#### 400 Bad Request（バリデーションエラー）

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "asOfDate",
      "message": "asOfDate must be a valid ISO 8601 date string"
    }
  ],
  "timestamp": "2025-01-27T10:00:00.000Z",
  "path": "/api/aggregation/asset-balance"
}
```

#### 500 Internal Server Error（サーバーエラー）

```json
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error",
  "code": "DATABASE_CONNECTION_ERROR",
  "timestamp": "2025-01-27T10:00:00.000Z",
  "path": "/api/aggregation/asset-balance"
}
```

### エラーコード一覧

| エラーコード                | HTTPステータス | 説明                   |
| --------------------------- | -------------- | ---------------------- |
| `VALIDATION_ERROR`          | 400            | バリデーションエラー   |
| `DATABASE_CONNECTION_ERROR` | 500            | データベース接続エラー |
| `INTERNAL_SERVER_ERROR`     | 500            | 予期しないエラー       |

---

## バリデーションルール

### Query Parameters

| パラメータ | ルール                          | エラーメッセージ                                |
| ---------- | ------------------------------- | ----------------------------------------------- |
| asOfDate   | 任意、ISO8601形式（YYYY-MM-DD） | "asOfDate must be a valid ISO 8601 date string" |
| asOfDate   | 未来日でない                    | "asOfDate must not be a future date"            |

### バリデーション実装例

NestJSのベストプラクティスに従い、`class-validator`と`ValidationPipe`を使用したDTOによるバリデーションを推奨します。

```typescript
// カスタムバリデーター（未来日チェック用）
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, Validate } from 'class-validator';

@ValidatorConstraint({ name: 'isNotFutureDate', async: false })
export class IsNotFutureDateConstraint implements ValidatorConstraintInterface {
  validate(asOfDate: string, args: ValidationArguments): boolean {
    if (!asOfDate) {
      return true; // 必須チェックは @IsOptional で行う
    }
    const date = new Date(asOfDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // 今日の終わりまで許容
    return date <= today;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'asOfDate must not be a future date';
  }
}

// DTOにバリデーションルールを定義
import { IsDateString, IsOptional } from 'class-validator';

export class GetAssetBalanceDto {
  @IsDateString()
  @IsOptional()
  @Validate(IsNotFutureDateConstraint)
  asOfDate?: string;
}

// Controller側でのバリデーション
@Get('asset-balance')
// main.tsでapp.useGlobalPipes(new ValidationPipe({ transform: true }))を適用
async getAssetBalance(
  @Query() query: GetAssetBalanceDto,
): Promise<{
  success: boolean;
  data: AssetBalanceResponseDto;
}> {
  // バリデーションはValidationPipeによって自動的に実行される

  // UseCase実行
  const asOfDate = query.asOfDate ? new Date(query.asOfDate) : new Date();
  const result = await this.calculateAssetBalanceUseCase.execute(asOfDate);

  return {
    success: true,
    data: result,
  };
}
```

**補足**:

- `ValidationPipe`は`main.ts`でグローバルに設定することを推奨
- `transform: true`オプションにより、クエリパラメータが自動的に適切な型に変換される
- バリデーションエラーは自動的に400 Bad Requestとして返される
- 未来日チェックは、カスタムバリデーター（`@ValidatorConstraint`）を使用する

---

## チェックリスト

入出力設計作成時の確認事項：

### 必須項目

- [x] APIエンドポイントが一覧化されている
- [x] リクエスト/レスポンス仕様が記載されている
- [x] データモデル定義が記載されている
- [x] エラーレスポンス形式が明確
- [x] バリデーションルールが記載されている

### 推奨項目

- [x] TypeScript型定義が記載されている
- [x] レスポンス例が記載されている
- [x] エラーレスポンス例が記載されている

### 注意事項

- [x] レスポンスDTOは`interface`で定義されている（classではない）
- [x] リクエストDTOは`class`で定義されている
- [x] データが存在しない場合の処理が明確（空データを返す）
- [x] エラーレスポンスは共通形式に準拠している
- [x] HTTPステータスコードが適切に使い分けられている
