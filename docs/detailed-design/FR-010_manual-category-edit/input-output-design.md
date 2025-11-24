# 入出力設計

このドキュメントでは、FR-010（費目の手動修正機能）のAPI仕様とデータモデルを記載しています。

## 目次

1. [APIエンドポイント一覧](#apiエンドポイント一覧)
2. [リクエスト/レスポンス仕様](#リクエストレスポンス仕様)
3. [データモデル定義](#データモデル定義)
4. [エラーレスポンス](#エラーレスポンス)
5. [バリデーションルール](#バリデーションルール)

---

## APIエンドポイント一覧

### Transaction - FR-010

| Method | Path                             | 説明                 | 認証 |
| ------ | -------------------------------- | -------------------- | ---- |
| PATCH  | `/api/transactions/:id/category` | 取引のカテゴリを更新 | 不要 |

### 補足

- **認証**: 将来的に実装予定（現在は不要）
- **レート制限**: 未実装（将来対応予定）
- **CORS**: 同一オリジンのみ許可

---

## リクエスト/レスポンス仕様

### PATCH /api/transactions/:id/category

取引のカテゴリを更新します。

**Path Parameters:**

| パラメータ | 型     | 必須 | 説明   |
| ---------- | ------ | ---- | ------ |
| id         | string | ✅   | 取引ID |

**Request Body:**

```json
{
  "category": {
    "id": "cat-001",
    "name": "食費",
    "type": "EXPENSE"
  }
}
```

**Request Schema (UpdateTransactionCategoryRequestDto):**

| フィールド    | 型           | 必須 | 説明           | 制約                                             |
| ------------- | ------------ | ---- | -------------- | ------------------------------------------------ |
| category      | object       | ✅   | カテゴリ情報   | -                                                |
| category.id   | string       | ✅   | カテゴリID     | UUIDまたは文字列                                 |
| category.name | string       | ✅   | カテゴリ名     | 1-100文字                                        |
| category.type | CategoryType | ✅   | カテゴリタイプ | INCOME, EXPENSE, TRANSFER, REPAYMENT, INVESTMENT |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "tx-123",
    "date": "2025-11-24",
    "amount": 1500,
    "category": {
      "id": "cat-001",
      "name": "食費",
      "type": "EXPENSE"
    },
    "description": "コンビニで昼食",
    "institutionId": "inst-001",
    "accountId": "acc-001",
    "status": "COMPLETED",
    "isReconciled": false,
    "createdAt": "2025-11-24T00:00:00.000Z",
    "updatedAt": "2025-11-24T12:00:00.000Z"
  }
}
```

**Response Schema (TransactionResponseDto):**

| フィールド         | 型                | 説明                 |
| ------------------ | ----------------- | -------------------- |
| success            | boolean           | 成功フラグ           |
| data               | Transaction       | 更新された取引データ |
| data.id            | string            | 取引ID               |
| data.date          | string            | 取引日（YYYY-MM-DD） |
| data.amount        | number            | 金額                 |
| data.category      | Category          | カテゴリ情報         |
| data.description   | string            | 説明                 |
| data.institutionId | string            | 金融機関ID           |
| data.accountId     | string            | 口座ID               |
| data.status        | TransactionStatus | ステータス           |
| data.isReconciled  | boolean           | 照合済みフラグ       |
| data.createdAt     | string            | 作成日時（ISO8601）  |
| data.updatedAt     | string            | 更新日時（ISO8601）  |

**Error Responses:**

- `400 Bad Request`: バリデーションエラー
- `404 Not Found`: 取引が存在しない
- `500 Internal Server Error`: サーバーエラー

**TypeScript型定義:**

```typescript
// Request DTO (class-validator使用)
export class UpdateTransactionCategoryRequestDto {
  @IsObject()
  @ValidateNested()
  @Type(() => CategoryRequestDto)
  category!: CategoryRequestDto;
}

export class CategoryRequestDto {
  @IsString()
  id!: string;

  @IsString()
  @Length(1, 100)
  name!: string;

  @IsEnum(CategoryType)
  type!: CategoryType;
}

// Response DTO (interface)
export interface TransactionResponseDto {
  success: boolean;
  data: Transaction;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: Category;
  description: string;
  institutionId: string;
  accountId: string;
  status: TransactionStatus;
  isReconciled: boolean;
  relatedTransactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
}
```

---

## データモデル定義

### Transaction Entity

```typescript
export interface Transaction {
  id: string; // UUID
  date: Date; // 取引日
  amount: number; // 金額
  category: Category; // カテゴリ
  description: string; // 説明
  institutionId: string; // 金融機関ID
  accountId: string; // 口座ID
  status: TransactionStatus; // ステータス
  isReconciled: boolean; // 照合済みフラグ
  relatedTransactionId?: string; // 関連取引ID（振替時）
  createdAt: Date; // 作成日時
  updatedAt: Date; // 更新日時
}
```

### TransactionCategoryChangeHistory Entity

```typescript
export interface TransactionCategoryChangeHistory {
  id: string; // UUID
  transactionId: string; // 取引ID
  oldCategory: Category; // 変更前カテゴリ
  newCategory: Category; // 変更後カテゴリ
  changedAt: Date; // 変更日時
  changedBy?: string; // 変更者（将来実装）
}
```

### Category

```typescript
export interface Category {
  id: string; // カテゴリID
  name: string; // カテゴリ名
  type: CategoryType; // カテゴリタイプ
}
```

### Enum定義

```typescript
export enum CategoryType {
  INCOME = 'INCOME', // 収入
  EXPENSE = 'EXPENSE', // 支出
  TRANSFER = 'TRANSFER', // 振替
  REPAYMENT = 'REPAYMENT', // 返済
  INVESTMENT = 'INVESTMENT', // 投資
}

export enum TransactionStatus {
  PENDING = 'PENDING', // 保留中
  COMPLETED = 'COMPLETED', // 完了
  FAILED = 'FAILED', // 失敗
  CANCELLED = 'CANCELLED', // キャンセル
}
```

---

## データベーススキーマ

### transaction_category_change_history テーブル

```sql
CREATE TABLE transaction_category_change_history (
  id VARCHAR(255) PRIMARY KEY,
  transactionId VARCHAR(255) NOT NULL,
  oldCategoryId VARCHAR(255) NOT NULL,
  oldCategoryName VARCHAR(100) NOT NULL,
  oldCategoryType ENUM('INCOME', 'EXPENSE', 'TRANSFER', 'REPAYMENT', 'INVESTMENT') NOT NULL,
  newCategoryId VARCHAR(255) NOT NULL,
  newCategoryName VARCHAR(100) NOT NULL,
  newCategoryType ENUM('INCOME', 'EXPENSE', 'TRANSFER', 'REPAYMENT', 'INVESTMENT') NOT NULL,
  changedAt DATETIME NOT NULL,
  changedBy VARCHAR(255) NULL,
  INDEX idx_transaction (transactionId),
  INDEX idx_transaction_changed (transactionId, changedAt)
);
```

**インデックス説明**:

- `idx_transaction`: transactionIdによる検索の高速化
- `idx_transaction_changed`: transactionIdとchangedAtの複合インデックス（時系列順でのソート用）

### transactions テーブル（更新対象フィールド）

```sql
-- カテゴリ関連フィールド
categoryId VARCHAR(255) NOT NULL,
categoryName VARCHAR(100) NOT NULL,
categoryType ENUM('INCOME', 'EXPENSE', 'TRANSFER', 'REPAYMENT', 'INVESTMENT') NOT NULL,
updatedAt DATETIME NOT NULL
```

---

## エラーレスポンス

### 共通エラーレスポンス形式

```json
{
  "success": false,
  "statusCode": 400,
  "message": "エラーメッセージ",
  "timestamp": "2025-11-24T00:00:00.000Z",
  "path": "/api/transactions/tx-123/category"
}
```

### HTTPステータスコード

| ステータスコード | 説明                  | 使用例               |
| ---------------- | --------------------- | -------------------- |
| 200              | OK                    | 正常なカテゴリ更新   |
| 400              | Bad Request           | バリデーションエラー |
| 404              | Not Found             | 取引が存在しない     |
| 500              | Internal Server Error | サーバーエラー       |

### バリデーションエラー (400)

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "category.id",
      "message": "category.id must be a string"
    },
    {
      "field": "category.name",
      "message": "category.name must not be empty"
    },
    {
      "field": "category.type",
      "message": "category.type must be a valid enum value"
    }
  ]
}
```

### リソース未検出エラー (404)

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Transaction with id tx-999 not found"
}
```

### サーバーエラー (500)

```json
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## バリデーションルール

### UpdateTransactionCategoryRequestDto

| フィールド    | バリデーション                                                |
| ------------- | ------------------------------------------------------------- |
| category      | 必須、オブジェクト、ネストされたバリデーション                |
| category.id   | 必須、文字列                                                  |
| category.name | 必須、文字列、1-100文字                                       |
| category.type | 必須、Enum (INCOME, EXPENSE, TRANSFER, REPAYMENT, INVESTMENT) |

**実装例 (class-validator):**

```typescript
import { IsString, IsEnum, IsObject, ValidateNested, Length } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTransactionCategoryRequestDto {
  @IsObject()
  @ValidateNested()
  @Type(() => CategoryRequestDto)
  category!: CategoryRequestDto;
}

export class CategoryRequestDto {
  @IsString()
  id!: string;

  @IsString()
  @Length(1, 100)
  name!: string;

  @IsEnum(CategoryType)
  type!: CategoryType;
}
```

---

## API使用例

### cURL

```bash
# カテゴリ更新
curl -X PATCH http://localhost:3001/api/transactions/tx-123/category \
  -H "Content-Type: application/json" \
  -d '{
    "category": {
      "id": "cat-001",
      "name": "食費",
      "type": "EXPENSE"
    }
  }'
```

### TypeScript (Fetch API)

```typescript
// Frontend API関数
export async function updateTransactionCategory(
  transactionId: string,
  category: {
    id: string;
    name: string;
    type: CategoryType;
  }
): Promise<Transaction> {
  const response = await fetch(`${API_BASE_URL}/api/transactions/${transactionId}/category`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ category }),
  });

  if (!response.ok) {
    throw new Error('カテゴリの更新に失敗しました');
  }

  const data = await response.json();
  return data.data;
}

// 使用例
const updatedTransaction = await updateTransactionCategory('tx-123', {
  id: 'cat-001',
  name: '食費',
  type: CategoryType.EXPENSE,
});
```

### React Component での使用例

```typescript
const handleCategoryChange = async (
  transactionId: string,
  newCategoryId: string
): Promise<void> => {
  const newCategory = categories.find((c) => c.id === newCategoryId);
  if (!newCategory) return;

  try {
    setUpdating(transactionId);
    setError(null);

    const updatedTransaction = await updateTransactionCategory(transactionId, {
      id: newCategory.id,
      name: newCategory.name,
      type: newCategory.type,
    });

    // 親コンポーネントに通知
    if (onTransactionUpdate) {
      onTransactionUpdate(updatedTransaction);
    }

    setEditingId(null);
  } catch (err) {
    setError('カテゴリの更新に失敗しました');
    console.error('カテゴリ更新エラー:', err);
  } finally {
    setUpdating(null);
  }
};
```

---

## データベーストランザクション詳細

### トランザクションフロー

```typescript
// TypeORMのDataSource.transactionを使用
await this.dataSource.transaction(async (entityManager) => {
  // 1. 変更履歴を記録
  const historyRepo = entityManager.getRepository(TransactionCategoryChangeHistoryOrmEntity);
  await historyRepo.save({
    id: history.id,
    transactionId: history.transactionId,
    oldCategoryId: history.oldCategory.id,
    oldCategoryName: history.oldCategory.name,
    oldCategoryType: history.oldCategory.type,
    newCategoryId: history.newCategory.id,
    newCategoryName: history.newCategory.name,
    newCategoryType: history.newCategory.type,
    changedAt: history.changedAt,
    changedBy: history.changedBy,
  });

  // 2. 取引を更新
  const transactionRepo = entityManager.getRepository(TransactionOrmEntity);
  await transactionRepo.save({
    id: updatedTransaction.id,
    // ... 他のフィールド
    categoryId: updatedTransaction.category.id,
    categoryName: updatedTransaction.category.name,
    categoryType: updatedTransaction.category.type,
    updatedAt: new Date(),
  });
});
```

### トランザクション管理の特徴

- **原子性**: 変更履歴の記録と取引の更新が同時に成功または失敗
- **一貫性**: データベースの整合性を常に保証
- **分離性**: 他のトランザクションと分離して実行（READ COMMITTED）
- **耐久性**: コミット後は永続化を保証

---

## Frontend UIコンポーネント仕様

### TransactionList コンポーネント

#### Props

```typescript
interface TransactionListProps {
  transactions: Transaction[];
  onTransactionUpdate?: (transaction: Transaction) => void;
}
```

#### State

```typescript
const [categories, setCategories] = useState<Category[]>([]);
const [editingId, setEditingId] = useState<string | null>(null);
const [updating, setUpdating] = useState<string | null>(null);
const [error, setError] = useState<string | null>(null);
```

#### 主要メソッド

- `handleCategoryClick(transactionId)`: 編集モードに切り替え
- `handleCategoryChange(transactionId, newCategoryId)`: カテゴリ更新処理
- `handleCancelEdit()`: 編集モードをキャンセル
- `getCategoryTypeColor(type)`: カテゴリタイプに応じた色を返す
- `formatAmount(amount, type)`: 金額をフォーマット

---

## チェックリスト

入出力設計作成時の確認事項：

### 基本項目

- [x] すべてのエンドポイントが定義されている
- [x] リクエスト/レスポンスの型が明確
- [x] HTTPメソッドが適切に選択されている（PATCH）
- [x] HTTPステータスコードが適切

### 詳細項目

- [x] バリデーションルールが明確
- [x] エラーレスポンスが定義されている
- [x] TypeScript型定義が明確
- [x] Enum定義がある

### ドキュメント

- [x] 使用例（cURL/TypeScript）が提供されている
- [x] データベーススキーマが記載されている
- [x] トランザクション管理の詳細が明確

---

## 注意事項

### パフォーマンス

- カテゴリ一覧は初回ロード時に取得し、キャッシュして使用
- 更新処理は楽観的UI更新ではなく、サーバーレスポンス待機後に更新
- インデックスによる高速検索

### セキュリティ

- 入力値のバリデーション（DTOレベル）
- SQLインジェクション対策（TypeORMの型安全なクエリ使用）
- 将来的に認証・認可を実装予定

### 拡張性

- `changedBy`フィールドは将来的にユーザー認証実装時に使用
- トランザクションステータスは将来的な機能拡張に対応
- カテゴリマスタは動的に拡張可能
