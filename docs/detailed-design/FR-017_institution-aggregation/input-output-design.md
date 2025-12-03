# 入出力設計

このドキュメントでは、金融機関別集計機能のAPI仕様とデータモデルを記載しています。

## 目次

1. [APIエンドポイント一覧](#apiエンドポイント一覧)
2. [リクエスト/レスポンス仕様](#リクエストレスポンス仕様)
3. [データモデル定義](#データモデル定義)
4. [エラーレスポンス](#エラーレスポンス)
5. [バリデーションルール](#バリデーションルール)

---

## APIエンドポイント一覧

### 金融機関別集計 - FR-017

| Method | Path                                   | 説明                     | 認証     |
| ------ | -------------------------------------- | ------------------------ | -------- |
| GET    | `/api/aggregation/institution-summary` | 金融機関別集計情報を取得 | 将来対応 |

### 補足

- **認証**: 将来対応（現在は不要）
- **レート制限**: 将来対応
- **ページネーション**: 不要（集計結果のため）

---

## リクエスト/レスポンス仕様

### GET /api/aggregation/institution-summary

指定した期間の取引を金融機関ごとに集計し、機関別の収支状況を取得します。

**Query Parameters:**

| パラメータ          | 型       | 必須 | デフォルト | 説明                                  |
| ------------------- | -------- | ---- | ---------- | ------------------------------------- |
| startDate           | string   | ✅   | -          | 集計開始日（ISO8601形式: YYYY-MM-DD） |
| endDate             | string   | ✅   | -          | 集計終了日（ISO8601形式: YYYY-MM-DD） |
| institutionIds      | string[] | ❌   | 全機関     | 金融機関IDの配列（複数選択可）        |
| includeTransactions | boolean  | ❌   | false      | レスポンスに取引明細を含めるかどうか  |

**Request Example:**

```
GET /api/aggregation/institution-summary?startDate=2025-01-01&endDate=2025-01-31
GET /api/aggregation/institution-summary?startDate=2025-01-01&endDate=2025-01-31&institutionIds=inst-001&institutionIds=inst-002
GET /api/aggregation/institution-summary?startDate=2025-01-01&endDate=2025-01-31&includeTransactions=true
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "institutions": [
      {
        "institutionId": "inst-001",
        "institutionName": "メインバンク",
        "institutionType": "BANK",
        "period": {
          "start": "2025-01-01T00:00:00.000Z",
          "end": "2025-01-31T23:59:59.999Z"
        },
        "accounts": [
          {
            "accountId": "acc-001",
            "accountName": "普通預金",
            "income": 300000,
            "expense": 100000,
            "periodBalance": 200000,
            "currentBalance": 1500000,
            "transactionCount": 5
          }
        ],
        "totalIncome": 300000,
        "totalExpense": 100000,
        "periodBalance": 200000,
        "currentBalance": 1500000,
        "transactionCount": 5,
        "transactions": [
          {
            "id": "txn-001",
            "date": "2025-01-25T00:00:00.000Z",
            "amount": 300000,
            "categoryType": "INCOME",
            "categoryId": "cat-001",
            "institutionId": "inst-001",
            "accountId": "acc-001",
            "description": "給与"
          },
          {
            "id": "txn-002",
            "date": "2025-01-10T00:00:00.000Z",
            "amount": 50000,
            "categoryType": "EXPENSE",
            "categoryId": "cat-002",
            "institutionId": "inst-001",
            "accountId": "acc-001",
            "description": "スーパー"
          }
        ]
      },
      {
        "institutionId": "inst-002",
        "institutionName": "クレジットカードA",
        "institutionType": "CREDIT_CARD",
        "period": {
          "start": "2025-01-01T00:00:00.000Z",
          "end": "2025-01-31T23:59:59.999Z"
        },
        "accounts": [
          {
            "accountId": "acc-002",
            "accountName": "メインカード",
            "income": 0,
            "expense": 150000,
            "periodBalance": -150000,
            "currentBalance": 0,
            "transactionCount": 3
          }
        ],
        "totalIncome": 0,
        "totalExpense": 150000,
        "periodBalance": -150000,
        "currentBalance": 0,
        "transactionCount": 3,
        "transactions": [
          {
            "id": "txn-003",
            "date": "2025-01-15T00:00:00.000Z",
            "amount": 50000,
            "categoryType": "EXPENSE",
            "categoryId": "cat-002",
            "institutionId": "inst-002",
            "accountId": "acc-002",
            "description": "コンビニ"
          }
        ]
      }
    ]
  }
}
```

**Response Schema (InstitutionSummaryResponseDto):**

| フィールド   | 型                      | 説明                   |
| ------------ | ----------------------- | ---------------------- |
| institutions | InstitutionSummaryDto[] | 金融機関別サマリー配列 |

**InstitutionSummaryDto:**

| フィールド       | 型                  | 説明                                            |
| ---------------- | ------------------- | ----------------------------------------------- |
| institutionId    | string              | 金融機関ID                                      |
| institutionName  | string              | 金融機関名                                      |
| institutionType  | InstitutionType     | 金融機関タイプ（BANK, CREDIT_CARD, SECURITIES） |
| period           | Period              | 集計期間                                        |
| accounts         | AccountSummaryDto[] | 口座別サマリー配列                              |
| totalIncome      | number              | 収入合計                                        |
| totalExpense     | number              | 支出合計                                        |
| periodBalance    | number              | 期間内の収支差額（totalIncome - totalExpense）  |
| currentBalance   | number              | 現在の残高（全口座の合計）                      |
| transactionCount | number              | 取引件数                                        |
| transactions     | TransactionDto[]    | 取引明細（必要に応じて）                        |

**AccountSummaryDto:**

| フィールド       | 型     | 説明                                 |
| ---------------- | ------ | ------------------------------------ |
| accountId        | string | 口座ID                               |
| accountName      | string | 口座名                               |
| income           | number | 収入合計                             |
| expense          | number | 支出合計                             |
| periodBalance    | number | 期間内の収支差額（income - expense） |
| currentBalance   | number | 現在の残高                           |
| transactionCount | number | 取引件数                             |

**Period:**

| フィールド | 型   | 説明       |
| ---------- | ---- | ---------- |
| start      | Date | 集計開始日 |
| end        | Date | 集計終了日 |

**TransactionDto:**

| フィールド    | 型     | 説明                  |
| ------------- | ------ | --------------------- |
| id            | string | 取引ID                |
| date          | string | 取引日（ISO8601形式） |
| amount        | number | 金額                  |
| categoryType  | string | カテゴリタイプ        |
| categoryId    | string | カテゴリID            |
| institutionId | string | 金融機関ID            |
| accountId     | string | 口座ID                |
| description   | string | 説明                  |

**Error Responses:**

- `400 Bad Request`: バリデーションエラー（開始日 > 終了日など）
- `500 Internal Server Error`: サーバーエラー（DB接続失敗など）

**TypeScript型定義:**

```typescript
// カスタムバリデーター（フィールド間の相関チェック用）
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
} from 'class-validator';

@ValidatorConstraint({ name: 'isEndDateAfterStartDate', async: false })
export class IsEndDateAfterStartDateConstraint implements ValidatorConstraintInterface {
  validate(endDate: string, args: ValidationArguments): boolean {
    const object = args.object as GetInstitutionSummaryDto;
    const startDate = object.startDate;
    if (!startDate || !endDate) {
      return true; // 必須チェックは @IsNotEmpty で行う
    }
    return new Date(startDate) <= new Date(endDate);
  }

  defaultMessage(args: ValidationArguments): string {
    return 'endDate must be after or equal to startDate';
  }
}

// Request DTO（class）
import {
  IsDateString,
  IsNotEmpty,
  IsArray,
  IsString,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class GetInstitutionSummaryDto {
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  @Validate(IsEndDateAfterStartDateConstraint)
  endDate: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  institutionIds?: string[];

  @IsBoolean()
  @IsOptional()
  includeTransactions?: boolean;
}

// Response DTO（interface）
export interface InstitutionSummaryResponseDto {
  institutions: InstitutionSummaryDto[];
}

export interface InstitutionSummaryDto {
  institutionId: string;
  institutionName: string;
  institutionType: InstitutionType;
  period: Period;
  accounts: AccountSummaryDto[];
  totalIncome: number;
  totalExpense: number;
  periodBalance: number;
  currentBalance: number;
  transactionCount: number;
  transactions: TransactionDto[];
}

export interface AccountSummaryDto {
  accountId: string;
  accountName: string;
  income: number;
  expense: number;
  periodBalance: number;
  currentBalance: number;
  transactionCount: number;
}

export interface Period {
  start: Date;
  end: Date;
}

export interface TransactionDto {
  id: string;
  date: string; // ISO8601形式
  amount: number;
  categoryType: string; // CategoryTypeの文字列値
  categoryId: string;
  institutionId: string;
  accountId: string;
  description: string;
}

export enum InstitutionType {
  BANK = 'BANK',
  CREDIT_CARD = 'CREDIT_CARD',
  SECURITIES = 'SECURITIES',
}
```

**データが存在しない場合のレスポンス:**

以下の2つのケースがあります：

1. **リクエストされた金融機関が存在するが、期間内に取引がない場合**:
   - 金融機関の情報を0埋めのデータとして返す（`totalIncome: 0`, `totalExpense: 0`, `periodBalance: 0`など）
   - フロントエンドは「処理されたがデータがなかった」と判断できる

```json
{
  "success": true,
  "data": {
    "institutions": [
      {
        "institutionId": "inst-001",
        "institutionName": "メインバンク",
        "institutionType": "BANK",
        "period": {
          "start": "2025-01-01T00:00:00.000Z",
          "end": "2025-01-31T23:59:59.999Z"
        },
        "accounts": [
          {
            "accountId": "acc-001",
            "accountName": "普通預金",
            "income": 0,
            "expense": 0,
            "periodBalance": 0,
            "currentBalance": 1000000,
            "transactionCount": 0
          }
        ],
        "totalIncome": 0,
        "totalExpense": 0,
        "periodBalance": 0,
        "currentBalance": 1000000,
        "transactionCount": 0,
        "transactions": []
      }
    ]
  }
}
```

2. **リクエストされた金融機関IDが存在しない場合**:
   - 存在するIDのデータのみを返し、存在しないIDは警告などを出さずに無視する
   - すべてのIDが存在しない場合は空配列を返す
   - 例: `institutionIds=["inst-001", "inst-999"]` の場合、`inst-001`が存在すればそのデータを返し、`inst-999`が存在しなくてもエラーにせず無視する

```json
{
  "success": true,
  "data": {
    "institutions": []
  }
}
```

**重要**: どちらの場合でも、500エラーではなく200 OKで返す。これは正常なシナリオの一つとして扱う。

---

## データモデル定義

### TransactionEntity（既存）

```typescript
export interface TransactionEntity {
  id: string;
  date: Date;
  amount: number;
  categoryType: CategoryType; // INCOME, EXPENSE, TRANSFER, REPAYMENT, INVESTMENT
  categoryId: string;
  institutionId: string;
  accountId: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### InstitutionEntity（既存）

```typescript
export interface InstitutionEntity {
  id: string;
  name: string;
  type: InstitutionType; // BANK, CREDIT_CARD, SECURITIES
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

### CategoryType（既存）

```typescript
export enum CategoryType {
  INCOME = 'INCOME', // 収入
  EXPENSE = 'EXPENSE', // 支出
  TRANSFER = 'TRANSFER', // 振替
  REPAYMENT = 'REPAYMENT', // 返済
  INVESTMENT = 'INVESTMENT', // 投資
}
```

### InstitutionType（既存）

```typescript
export enum InstitutionType {
  BANK = 'BANK', // 銀行
  CREDIT_CARD = 'CREDIT_CARD', // クレジットカード
  SECURITIES = 'SECURITIES', // 証券会社
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
      "field": "startDate",
      "message": "Start date must be before or equal to end date"
    }
  ],
  "timestamp": "2025-01-27T10:00:00.000Z",
  "path": "/api/aggregation/institution-summary"
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
  "path": "/api/aggregation/institution-summary"
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

| パラメータ          | ルール                          | エラーメッセージ                                          |
| ------------------- | ------------------------------- | --------------------------------------------------------- |
| startDate           | 必須、ISO8601形式（YYYY-MM-DD） | "Start date is required and must be in YYYY-MM-DD format" |
| endDate             | 必須、ISO8601形式（YYYY-MM-DD） | "End date is required and must be in YYYY-MM-DD format"   |
| startDate           | 開始日 <= 終了日                | "Start date must be before or equal to end date"          |
| institutionIds      | 任意、文字列配列                | "Institution IDs must be an array of strings"             |
| includeTransactions | 任意、boolean値                 | "includeTransactions must be a boolean value"             |

### バリデーション実装例

NestJSのベストプラクティスに従い、`class-validator`と`ValidationPipe`を使用したDTOによるバリデーションを推奨します。

```typescript
// カスタムバリデーター（フィールド間の相関チェック用）
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, Validate } from 'class-validator';

@ValidatorConstraint({ name: 'isEndDateAfterStartDate', async: false })
export class IsEndDateAfterStartDateConstraint implements ValidatorConstraintInterface {
  validate(endDate: string, args: ValidationArguments): boolean {
    const object = args.object as GetInstitutionSummaryDto;
    const startDate = object.startDate;
    if (!startDate || !endDate) {
      return true; // 必須チェックは @IsNotEmpty で行う
    }
    return new Date(startDate) <= new Date(endDate);
  }

  defaultMessage(args: ValidationArguments): string {
    return 'endDate must be after or equal to startDate';
  }
}

// DTOにバリデーションルールを定義
import { IsDateString, IsNotEmpty, IsArray, IsString, IsOptional, IsBoolean } from 'class-validator';

export class GetInstitutionSummaryDto {
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  @Validate(IsEndDateAfterStartDateConstraint)
  endDate: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  institutionIds?: string[];

  @IsBoolean()
  @IsOptional()
  includeTransactions?: boolean;
}

// Controller側でのバリデーション
@Get('institution-summary')
// main.tsでapp.useGlobalPipes(new ValidationPipe({ transform: true }))を適用
async getInstitutionSummary(
  @Query() query: GetInstitutionSummaryDto,
): Promise<InstitutionSummaryResponseDto> {
  // バリデーションはValidationPipeによって自動的に実行される

  // UseCase実行
  return await this.calculateInstitutionSummaryUseCase.execute(
    new Date(query.startDate),
    new Date(query.endDate),
    query.institutionIds,
  );
}
```

**補足**:

- `ValidationPipe`は`main.ts`でグローバルに設定することを推奨
- `transform: true`オプションにより、クエリパラメータが自動的に適切な型に変換される
- バリデーションエラーは自動的に400 Bad Requestとして返される
- 開始日と終了日の比較は、カスタムバリデーター（`@ValidatorConstraint`）を使用する

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
- [x] データが存在しない場合の処理が明確（金融機関が存在する場合は0埋めデータ、存在しない場合は空配列を返す）
- [x] エラーレスポンスは共通形式に準拠している
- [x] HTTPステータスコードが適切に使い分けられている
