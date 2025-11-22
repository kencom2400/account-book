# 入出力設計 - FR-008-011: 取引データの主要カテゴリ自動分類

## API 仕様

### エンドポイント一覧

| メソッド | パス                         | 説明             | 認証                     |
| -------- | ---------------------------- | ---------------- | ------------------------ |
| POST     | `/api/transactions/classify` | 取引データを分類 | 不要（将来的に追加予定） |

---

## POST /api/transactions/classify

取引データ（金額・説明）を受け取り、カテゴリを自動分類します。

### リクエスト

#### エンドポイント

```
POST /api/transactions/classify
```

#### ヘッダー

```http
Content-Type: application/json
```

#### リクエストボディ

```typescript
interface ClassifyTransactionRequest {
  amount: number; // 必須: 取引金額（正=収入、負=支出）
  description: string; // 必須: 取引説明
  institutionId?: string; // オプション: 金融機関ID
  institutionType?: string; // オプション: 金融機関タイプ（'securities'等）
}
```

#### バリデーションルール

| フィールド      | 型     | 必須 | ルール           |
| --------------- | ------ | ---- | ---------------- |
| amount          | number | ✅   | 数値であること   |
| description     | string | ✅   | 文字列であること |
| institutionId   | string | ❌   | 文字列であること |
| institutionType | string | ❌   | 文字列であること |

#### リクエスト例

**例1: 基本的な分類（収入）**

```json
{
  "amount": 300000,
  "description": "給与振込"
}
```

**例2: 基本的な分類（支出）**

```json
{
  "amount": -1500,
  "description": "スターバックス コーヒー"
}
```

**例3: 金融機関タイプ指定（証券口座）**

```json
{
  "amount": -50000,
  "description": "株式購入",
  "institutionId": "inst-securities-001",
  "institutionType": "securities"
}
```

**例4: 返済取引**

```json
{
  "amount": -100000,
  "description": "住宅ローン返済"
}
```

---

### レスポンス

#### 成功時（200 OK）

```typescript
interface ClassifyTransactionResponse {
  success: boolean;
  data: {
    category: {
      id: string; // カテゴリID
      name: string; // カテゴリ名
      type: CategoryType; // カテゴリタイプ
    };
    confidence: number; // 信頼度スコア（0.0-1.0）
    confidenceLevel: 'high' | 'medium' | 'low'; // 信頼度レベル
    reason: string; // 分類理由の説明
  };
}
```

#### レスポンス例

**例1: 収入取引（キーワードマッチ、信頼度: medium）**

```json
{
  "success": true,
  "data": {
    "category": {
      "id": "income-salary",
      "name": "給与所得",
      "type": "INCOME"
    },
    "confidence": 0.7,
    "confidenceLevel": "medium",
    "reason": "キーワードマッチ: 「給与」が収入カテゴリに該当"
  }
}
```

**例2: 支出取引（キーワードマッチ、信頼度: medium）**

```json
{
  "success": true,
  "data": {
    "category": {
      "id": "expense-food",
      "name": "食費",
      "type": "EXPENSE"
    },
    "confidence": 0.7,
    "confidenceLevel": "medium",
    "reason": "キーワードマッチ: 「コンビニ」が支出カテゴリに該当"
  }
}
```

**例3: 投資取引（金融機関タイプ、信頼度: high）**

```json
{
  "success": true,
  "data": {
    "category": {
      "id": "investment-stocks",
      "name": "株式",
      "type": "INVESTMENT"
    },
    "confidence": 0.9,
    "confidenceLevel": "high",
    "reason": "証券口座の取引のため、投資カテゴリに分類"
  }
}
```

**例4: 返済取引（キーワードマッチ、信頼度: medium）**

```json
{
  "success": true,
  "data": {
    "category": {
      "id": "repayment-loan",
      "name": "ローン返済",
      "type": "REPAYMENT"
    },
    "confidence": 0.7,
    "confidenceLevel": "medium",
    "reason": "キーワードマッチ: 「住宅ローン」が返済カテゴリに該当"
  }
}
```

**例5: 金額ベース分類（信頼度: low）**

```json
{
  "success": true,
  "data": {
    "category": {
      "id": "expense-other",
      "name": "その他支出",
      "type": "EXPENSE"
    },
    "confidence": 0.3,
    "confidenceLevel": "low",
    "reason": "金額ベース分類: 負の金額のため支出に分類"
  }
}
```

---

### エラーレスポンス

#### 400 Bad Request - バリデーションエラー

```typescript
interface ValidationErrorResponse {
  statusCode: 400;
  message: string[]; // エラーメッセージの配列
  error: 'Bad Request';
}
```

**例: 必須フィールド不足**

```json
{
  "statusCode": 400,
  "message": ["amount must be a number", "description must be a string"],
  "error": "Bad Request"
}
```

#### 500 Internal Server Error - サーバーエラー

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## Frontend API Client

### classifyTransaction関数

```typescript
// apps/frontend/src/lib/api/classification.ts

export interface ClassifyTransactionRequest {
  amount: number;
  description: string;
  institutionId?: string;
  institutionType?: string;
}

export interface ClassifyTransactionResponse {
  success: boolean;
  data: {
    category: {
      id: string;
      name: string;
      type: CategoryType;
    };
    confidence: number;
    reason: string;
    confidenceLevel: 'high' | 'medium' | 'low';
  };
}

/**
 * 取引データを分類
 */
export async function classifyTransaction(
  request: ClassifyTransactionRequest
): Promise<ClassifyTransactionResponse['data']> {
  const response = await apiClient.post<ClassifyTransactionResponse['data']>(
    '/api/transactions/classify',
    request
  );
  return response;
}
```

### 使用例（Frontend）

```typescript
import { classifyTransaction } from '@/lib/api/classification';

// 分類実行
const result = await classifyTransaction({
  amount: 300000,
  description: '給与振込',
});

console.log(result.category.name); // "給与所得"
console.log(result.confidence); // 0.7
console.log(result.confidenceLevel); // "medium"
console.log(result.reason); // "キーワードマッチ: ..."
```

---

## データモデル

### CategoryType（Enum）

```typescript
enum CategoryType {
  INCOME = 'INCOME', // 収入
  EXPENSE = 'EXPENSE', // 支出
  TRANSFER = 'TRANSFER', // 振替
  REPAYMENT = 'REPAYMENT', // 返済
  INVESTMENT = 'INVESTMENT', // 投資
}
```

### ConfidenceLevel（Union Type）

```typescript
type ConfidenceLevel = 'high' | 'medium' | 'low';
```

### 信頼度レベルの定義

| レベル | スコア範囲 | 分類方法         | 説明                           |
| ------ | ---------- | ---------------- | ------------------------------ |
| high   | 0.9以上    | 金融機関タイプ   | 証券口座など、確実性の高い情報 |
| medium | 0.7以上    | キーワードマッチ | 説明文からのキーワード検出     |
| low    | 0.7未満    | 金額ベース       | 正負の金額のみから推定         |

---

## バリデーション詳細

### class-validator デコレーター

```typescript
// apps/backend/src/modules/transaction/presentation/controllers/transaction.controller.ts

import { IsNumber, IsString, IsOptional } from 'class-validator';

class ClassifyTransactionDto {
  @IsNumber()
  amount: number;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  institutionId?: string;

  @IsOptional()
  @IsString()
  institutionType?: string;
}
```

### バリデーションエラーメッセージ

| エラー                         | メッセージ                         |
| ------------------------------ | ---------------------------------- |
| amount が数値でない            | `amount must be a number`          |
| description が文字列でない     | `description must be a string`     |
| institutionId が文字列でない   | `institutionId must be a string`   |
| institutionType が文字列でない | `institutionType must be a string` |

---

## 分類ロジックの内部データフロー

### キーワード辞書（内部データ）

```typescript
// CategoryClassificationService内のプライベートプロパティ

private readonly keywords = {
  [CategoryType.REPAYMENT]: [
    'ローン', '返済', 'loan', 'repayment',
    '住宅ローン', '自動車ローン', '教育ローン'
  ],
  [CategoryType.INVESTMENT]: [
    '株式', '投資信託', '債券', '売買', '配当', '分配金',
    '株', 'fund', 'stock', '証券'
  ],
  [CategoryType.TRANSFER]: [
    '振替', 'カード引落', '口座振替', '資金移動',
    'チャージ', '送金', 'transfer', '口座間'
  ],
  [CategoryType.INCOME]: [
    '給与', '賞与', 'ボーナス', '報酬', '利息', '売上',
    '還付', 'キャッシュバック', '払戻', '返金', '振込',
    'salary', 'bonus', '入金'
  ],
  [CategoryType.EXPENSE]: [
    '購入', '支払', '決済', '引落', 'コンビニ', 'スーパー',
    'レストラン', 'カフェ', 'ガソリン', '公共料金',
    '携帯', '水道', '電気', 'ガス'
  ],
};
```

### 分類結果の生成

```typescript
// ClassificationResult型（内部型）

interface ClassificationResult {
  category: CategoryType;
  confidence: number;
  reason: string;
  confidenceLevel: 'high' | 'medium' | 'low';
}
```

---

## パフォーマンス

### レスポンスタイム目標

| 項目                 | 目標値  |
| -------------------- | ------- |
| API レスポンスタイム | < 100ms |
| バリデーション       | < 10ms  |
| 分類処理             | < 5ms   |
| データベースクエリ   | < 20ms  |

### スループット

- **同時リクエスト**: 100req/s以上
- **データベース接続**: コネクションプール利用

---

## セキュリティ

### 入力検証

- `class-validator`による型チェック
- XSS対策（自動エスケープ）
- SQLインジェクション対策（ORM利用）

### 認証・認可

- 現在未実装
- 将来的にJWT認証を追加予定

---

## テストデータ

### 単体テスト用データ

```typescript
// テストデータ例

const testCases = [
  {
    input: { amount: 300000, description: '給与振込' },
    expected: { type: 'INCOME', confidenceLevel: 'medium' },
  },
  {
    input: { amount: -1500, description: 'コンビニ' },
    expected: { type: 'EXPENSE', confidenceLevel: 'medium' },
  },
  {
    input: { amount: -50000, description: 'カード引落' },
    expected: { type: 'TRANSFER', confidenceLevel: 'medium' },
  },
  {
    input: { amount: -100000, description: '住宅ローン返済' },
    expected: { type: 'REPAYMENT', confidenceLevel: 'medium' },
  },
  {
    input: { amount: -50000, description: '株式購入', institutionType: 'securities' },
    expected: { type: 'INVESTMENT', confidenceLevel: 'high' },
  },
];
```

---

## チェックリスト

- [x] APIエンドポイントの定義
- [x] リクエスト形式の定義
- [x] バリデーションルールの定義
- [x] レスポンス形式の定義（正常系）
- [x] レスポンス形式の定義（異常系）
- [x] 具体的なリクエスト/レスポンス例
- [x] Frontend API Client の実装
- [x] データモデルの定義
- [x] バリデーション詳細
- [x] 分類ロジックの内部データ
- [x] パフォーマンス目標
- [x] セキュリティ考慮事項
- [x] テストデータの例示
