# 入出力設計（API仕様）

このドキュメントでは、費目のカスタマイズ機能（FR-011）のAPI仕様を記載しています。

## 目次

1. [エンドポイント一覧](#エンドポイント一覧)
2. [データモデル](#データモデル)
3. [API詳細](#api詳細)
   - [費目追加](#費目追加)
   - [費目一覧取得](#費目一覧取得)
   - [費目詳細取得](#費目詳細取得)
   - [費目更新](#費目更新)
   - [費目削除](#費目削除)
   - [費目使用状況確認](#費目使用状況確認)
4. [エラーレスポンス](#エラーレスポンス)
5. [バリデーションルール](#バリデーションルール)

---

## エンドポイント一覧

### Base URL

```
http://localhost:3001/api
```

### エンドポイント

| メソッド | エンドポイント          | 説明             | 認証             |
| -------- | ----------------------- | ---------------- | ---------------- |
| POST     | `/categories`           | 費目追加         | 必要（将来対応） |
| GET      | `/categories`           | 費目一覧取得     | 必要（将来対応） |
| GET      | `/categories/:id`       | 費目詳細取得     | 必要（将来対応） |
| PUT      | `/categories/:id`       | 費目更新         | 必要（将来対応） |
| DELETE   | `/categories/:id`       | 費目削除         | 必要（将来対応） |
| GET      | `/categories/:id/usage` | 費目使用状況確認 | 必要（将来対応） |

**注意**: 現在は開発フェーズのため認証は実装しませんが、本番環境では必須となります。

### 認証方式（将来実装予定）

**認証タイプ**: JWT Bearer Token

**リクエストヘッダー**:

```
Authorization: Bearer <JWT_TOKEN>
```

**トークン検証**:

- コントローラーに`@UseGuards(JwtAuthGuard)`を適用
- ユーザーIDをリクエストから抽出し、ユーザー所有の費目のみアクセス可能

**エラーレスポンス**:

- **401 Unauthorized**: トークンが無効または期限切れ
- **403 Forbidden**: 他ユーザーの費目にアクセス試行

**実装時の参考**:

```typescript
@Controller('categories')
@UseGuards(JwtAuthGuard) // 全エンドポイントで認証必須
export class CategoryController {
  @Post()
  async create(@Request() req, @Body() dto: CreateCategoryDto) {
    const userId = req.user.id; // JWTから取得したユーザーID
    return this.createUseCase.execute(userId, dto);
  }
}
```

---

## データモデル

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

### CategoryEntity (Domain Model)

```typescript
interface CategoryEntity {
  id: string; // UUID
  name: string; // 費目名
  type: CategoryType; // カテゴリタイプ
  parentId: string | null; // 親費目ID（階層構造用）
  icon: string | null; // アイコン（絵文字）
  color: string | null; // カラーコード（例: #FF9800）
  isSystemDefined: boolean; // システム定義フラグ
  order: number; // 表示順序
  createdAt: Date; // 作成日時
  updatedAt: Date; // 更新日時
}
```

---

## API詳細

### 費目追加

#### POST `/categories`

新しいカスタム費目を追加します。

**Request**

- **Content-Type**: `application/json`

```typescript
// CreateCategoryDto
interface CreateCategoryRequest {
  name: string; // 必須: 費目名（1-50文字）
  type: CategoryType; // 必須: カテゴリタイプ
  parentId?: string | null; // 任意: 親費目ID
  icon?: string | null; // 任意: アイコン（絵文字、1文字）
  color?: string | null; // 任意: カラーコード（#RGB, #RRGGBB, #RRGGBBAA形式）
}
```

**Request Example**

```json
{
  "name": "ペット",
  "type": "EXPENSE",
  "parentId": null,
  "icon": "🐕",
  "color": "#FF9800"
}
```

**Response**

- **Status**: `201 Created`
- **Content-Type**: `application/json`

```typescript
// CategoryResponseDto
interface CategoryResponse {
  id: string;
  name: string;
  type: CategoryType;
  parentId: string | null;
  icon: string | null;
  color: string | null;
  isSystemDefined: boolean; // false（カスタム費目）
  order: number;
  createdAt: string; // ISO 8601 形式
  updatedAt: string; // ISO 8601 形式
}
```

**Response Example**

```json
{
  "id": "cat_custom_001",
  "name": "ペット",
  "type": "EXPENSE",
  "parentId": null,
  "icon": "🐕",
  "color": "#FF9800",
  "isSystemDefined": false,
  "order": 1000,
  "createdAt": "2025-11-29T10:00:00Z",
  "updatedAt": "2025-11-29T10:00:00Z"
}
```

**エラーレスポンス**

| Status | エラー                  | 説明                         |
| ------ | ----------------------- | ---------------------------- |
| 400    | `VALIDATION_ERROR`      | バリデーションエラー         |
| 400    | `CATEGORY_DUPLICATE`    | 同一カテゴリ内で費目名が重複 |
| 500    | `INTERNAL_SERVER_ERROR` | サーバーエラー               |

---

### 費目一覧取得

#### GET `/categories`

すべての費目（デフォルト + カスタム）を取得します。

**Query Parameters**

| パラメータ | 型     | 必須 | 説明                                                |
| ---------- | ------ | ---- | --------------------------------------------------- |
| type       | string | 任意 | フィルタリング用カテゴリタイプ（INCOME, EXPENSE等） |

**Request Example**

```
GET /api/categories
GET /api/categories?type=EXPENSE
```

**Response**

- **Status**: `200 OK`
- **Content-Type**: `application/json`

```typescript
// CategoryListResponseDto (Discriminated Union型)
type CategoryListResponse = CategoryListSuccessResponse | ErrorResponse;

interface CategoryListSuccessResponse {
  success: true;
  data: CategoryResponse[];
  total: number;
}

interface ErrorResponse {
  success: false;
  error: string; // エラーコード
  message: string; // エラーメッセージ（日本語）
  details?: object; // エラー詳細（任意）
}
```

**設計のポイント**:

- Discriminated Union型を使用し、`success`フラグで型を判別
- `success: true`の場合は`data`と`total`が必ず存在
- `success: false`の場合は`error`と`message`が必ず存在
- クライアント側で型安全にハンドリング可能

**Response Example**

```json
{
  "success": true,
  "data": [
    {
      "id": "cat_default_001",
      "name": "食費",
      "type": "EXPENSE",
      "parentId": null,
      "icon": "🍔",
      "color": "#4CAF50",
      "isSystemDefined": true,
      "order": 0,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    },
    {
      "id": "cat_custom_001",
      "name": "ペット",
      "type": "EXPENSE",
      "parentId": null,
      "icon": "🐕",
      "color": "#FF9800",
      "isSystemDefined": false,
      "order": 1000,
      "createdAt": "2025-11-29T10:00:00Z",
      "updatedAt": "2025-11-29T10:00:00Z"
    }
  ],
  "total": 2
}
```

---

### 費目詳細取得

#### GET `/categories/:id`

指定された費目の詳細を取得します。

**Path Parameters**

| パラメータ | 型     | 必須 | 説明   |
| ---------- | ------ | ---- | ------ |
| id         | string | 必須 | 費目ID |

**Request Example**

```
GET /api/categories/cat_custom_001
```

**Response**

- **Status**: `200 OK`
- **Content-Type**: `application/json`

```typescript
// CategoryResponseDto
interface CategoryResponse {
  id: string;
  name: string;
  type: CategoryType;
  parentId: string | null;
  icon: string | null;
  color: string | null;
  isSystemDefined: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}
```

**Response Example**

```json
{
  "id": "cat_custom_001",
  "name": "ペット",
  "type": "EXPENSE",
  "parentId": null,
  "icon": "🐕",
  "color": "#FF9800",
  "isSystemDefined": false,
  "order": 1000,
  "createdAt": "2025-11-29T10:00:00Z",
  "updatedAt": "2025-11-29T10:00:00Z"
}
```

**エラーレスポンス**

| Status | エラー               | 説明               |
| ------ | -------------------- | ------------------ |
| 404    | `CATEGORY_NOT_FOUND` | 費目が見つからない |

---

### 費目更新

#### PUT `/categories/:id`

既存費目の名称、アイコン、色を更新します。

**Path Parameters**

| パラメータ | 型     | 必須 | 説明   |
| ---------- | ------ | ---- | ------ |
| id         | string | 必須 | 費目ID |

**Request**

- **Content-Type**: `application/json`

```typescript
// UpdateCategoryDto
interface UpdateCategoryRequest {
  name?: string; // 任意: 費目名（1-50文字）
  icon?: string | null; // 任意: アイコン（絵文字、1文字）
  color?: string | null; // 任意: カラーコード（#RRGGBB形式）
}
```

**Request Example**

```json
{
  "name": "ペット用品",
  "icon": "🐶",
  "color": "#FFA726"
}
```

**Response**

- **Status**: `200 OK`
- **Content-Type**: `application/json`

```typescript
// CategoryResponseDto
interface CategoryResponse {
  id: string;
  name: string;
  type: CategoryType;
  parentId: string | null;
  icon: string | null;
  color: string | null;
  isSystemDefined: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}
```

**Response Example**

```json
{
  "id": "cat_custom_001",
  "name": "ペット用品",
  "type": "EXPENSE",
  "parentId": null,
  "icon": "🐶",
  "color": "#FFA726",
  "isSystemDefined": false,
  "order": 1000,
  "createdAt": "2025-11-29T10:00:00Z",
  "updatedAt": "2025-11-29T15:30:00Z"
}
```

**エラーレスポンス**

| Status | エラー               | 説明                 |
| ------ | -------------------- | -------------------- |
| 400    | `VALIDATION_ERROR`   | バリデーションエラー |
| 400    | `CATEGORY_DUPLICATE` | 費目名が重複         |
| 404    | `CATEGORY_NOT_FOUND` | 費目が見つからない   |

**注意**: デフォルト費目も編集可能です。

---

### 費目削除

#### DELETE `/categories/:id`

指定された費目を削除します。使用中の費目の場合は、代替費目IDをクエリパラメータで指定する必要があります。

**Path Parameters**

| パラメータ | 型     | 必須 | 説明   |
| ---------- | ------ | ---- | ------ |
| id         | string | 必須 | 費目ID |

**Query Parameters**

| パラメータ            | 型     | 必須               | 説明       |
| --------------------- | ------ | ------------------ | ---------- |
| replacementCategoryId | string | 使用中の場合は必須 | 代替費目ID |

**Request Example**

```
DELETE /api/categories/cat_custom_001
DELETE /api/categories/cat_custom_001?replacementCategoryId=cat_default_001
```

**Response**

- **Status**: `200 OK`
- **Content-Type**: `application/json`

```typescript
// DeleteResponseDto
interface DeleteCategoryResponse {
  success: boolean;
  replacedCount: number; // 代替費目に置き換えた取引件数
  message: string;
  error?: string;
}
```

**Response Example**

```json
{
  "success": true,
  "replacedCount": 50,
  "message": "50件の取引を移行して費目を削除しました"
}
```

**エラーレスポンス**

| Status | エラー                     | 説明                                 |
| ------ | -------------------------- | ------------------------------------ |
| 403    | `SYSTEM_CATEGORY_DELETION` | デフォルト費目は削除不可             |
| 404    | `CATEGORY_NOT_FOUND`       | 費目が見つからない                   |
| 409    | `CATEGORY_IN_USE`          | 使用中の費目を代替費目なしで削除試行 |
| 500    | `INTERNAL_SERVER_ERROR`    | サーバーエラー                       |

---

### 費目使用状況確認

#### GET `/categories/:id/usage`

指定された費目が取引データで使用されているか確認します。

**Path Parameters**

| パラメータ | 型     | 必須 | 説明   |
| ---------- | ------ | ---- | ------ |
| id         | string | 必須 | 費目ID |

**Request Example**

```
GET /api/categories/cat_custom_001/usage
```

**Response**

- **Status**: `200 OK`
- **Content-Type**: `application/json`

```typescript
// UsageResponseDto
interface CategoryUsageResponse {
  isUsed: boolean; // 使用中かどうか
  usageCount: number; // 使用件数
  transactionSamples: TransactionSample[]; // 使用中の取引サンプル（先頭10件）
}

interface TransactionSample {
  id: string; // 取引ID
  date: string; // 取引日（ISO 8601形式）
  description: string; // 摘要
  amount: number; // 金額
}
```

**Response Example**

```json
{
  "isUsed": true,
  "usageCount": 50,
  "transactionSamples": [
    {
      "id": "tx_001",
      "date": "2025-11-01",
      "description": "ペットフード",
      "amount": 2000
    },
    {
      "id": "tx_002",
      "date": "2025-11-05",
      "description": "動物病院",
      "amount": 5000
    },
    {
      "id": "tx_003",
      "date": "2025-11-10",
      "description": "ペット用品",
      "amount": 1500
    }
  ]
}
```

**未使用の場合**

```json
{
  "isUsed": false,
  "usageCount": 0,
  "transactionSamples": []
}
```

**エラーレスポンス**

| Status | エラー               | 説明               |
| ------ | -------------------- | ------------------ |
| 404    | `CATEGORY_NOT_FOUND` | 費目が見つからない |

---

## エラーレスポンス

### エラーレスポンス形式

```typescript
interface ErrorResponse {
  success: false;
  error: string; // エラーコード
  message: string; // エラーメッセージ（日本語）
  details?: object; // エラー詳細（任意）
}
```

### エラーコード一覧

#### 400 Bad Request

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "費目名は必須です",
  "details": {
    "field": "name",
    "constraint": "isNotEmpty"
  }
}
```

```json
{
  "success": false,
  "error": "CATEGORY_DUPLICATE",
  "message": "この費目名は既に存在します",
  "details": {
    "name": "ペット",
    "type": "EXPENSE"
  }
}
```

#### 403 Forbidden

```json
{
  "success": false,
  "error": "SYSTEM_CATEGORY_DELETION",
  "message": "デフォルト費目は削除できません",
  "details": {
    "categoryId": "cat_default_001",
    "isSystemDefined": true
  }
}
```

#### 404 Not Found

```json
{
  "success": false,
  "error": "CATEGORY_NOT_FOUND",
  "message": "指定された費目が見つかりません",
  "details": {
    "categoryId": "cat_invalid_001"
  }
}
```

#### 409 Conflict

```json
{
  "success": false,
  "error": "CATEGORY_IN_USE",
  "message": "この費目は使用中です。代替費目を指定してください",
  "details": {
    "categoryId": "cat_custom_001",
    "usageCount": 50
  }
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": "INTERNAL_SERVER_ERROR",
  "message": "サーバーエラーが発生しました",
  "details": {
    "timestamp": "2025-11-29T10:00:00Z"
  }
}
```

---

## バリデーションルール

### 費目名（name）

| ルール     | 値               | エラーメッセージ                       |
| ---------- | ---------------- | -------------------------------------- |
| 必須       | -                | `費目名は必須です`                     |
| 最小文字数 | 1文字            | `費目名は1文字以上で入力してください`  |
| 最大文字数 | 50文字           | `費目名は50文字以内で入力してください` |
| 型         | string           | `費目名は文字列で指定してください`     |
| 重複       | 同一type内で一意 | `この費目名は既に存在します`           |

### カテゴリタイプ（type）

| ルール | 値                                               | エラーメッセージ           |
| ------ | ------------------------------------------------ | -------------------------- |
| 必須   | -                                                | `カテゴリタイプは必須です` |
| Enum   | INCOME, EXPENSE, TRANSFER, REPAYMENT, INVESTMENT | `無効なカテゴリタイプです` |

### アイコン（icon）

| ルール | 値          | エラーメッセージ                          |
| ------ | ----------- | ----------------------------------------- |
| 任意   | -           | -                                         |
| 型     | string      | `アイコンは文字列で指定してください`      |
| 形式   | 絵文字1文字 | `アイコンは絵文字1文字で指定してください` |

### カラーコード（color）

| ルール   | 値                                           | エラーメッセージ                                                     |
| -------- | -------------------------------------------- | -------------------------------------------------------------------- |
| 任意     | -                                            | -                                                                    |
| 型       | string                                       | `カラーコードは文字列で指定してください`                             |
| 形式     | #RGB, #RRGGBB, #RRGGBBAA                     | `カラーコードは#RGB、#RRGGBB、または#RRGGBBAA形式で指定してください` |
| 正規表現 | `^#([0-9A-F]{3}\|[0-9A-F]{6}\|[0-9A-F]{8})$` | `無効なカラーコードです`                                             |

**サポートする形式**:

- **3桁**: `#RGB` (例: `#F00` は `#FF0000` と同義)
- **6桁**: `#RRGGBB` (例: `#FF9800`)
- **8桁**: `#RRGGBBAA` (例: `#FF9800FF` - アルファチャンネル付き)

### 親費目ID（parentId）

| ルール   | 値       | エラーメッセージ                     |
| -------- | -------- | ------------------------------------ |
| 任意     | -        | -                                    |
| 型       | string   | `親費目IDは文字列で指定してください` |
| 存在確認 | 有効なID | `指定された親費目が見つかりません`   |

---

## 実装例

### TypeScript (Frontend)

#### API Client

```typescript
import axios, { AxiosInstance } from 'axios';

export class CategoryApiClient {
  private axios: AxiosInstance;

  constructor(baseURL: string = 'http://localhost:3001/api') {
    this.axios = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async create(data: CreateCategoryRequest): Promise<CategoryResponse> {
    const response = await this.axios.post<CategoryResponse>('/categories', data);
    return response.data;
  }

  async getAll(type?: CategoryType): Promise<CategoryListResponse> {
    const params = type ? { type } : {};
    const response = await this.axios.get<CategoryListResponse>('/categories', { params });
    return response.data;
  }

  async getById(id: string): Promise<CategoryResponse> {
    const response = await this.axios.get<CategoryResponse>(`/categories/${id}`);
    return response.data;
  }

  async update(id: string, data: UpdateCategoryRequest): Promise<CategoryResponse> {
    const response = await this.axios.put<CategoryResponse>(`/categories/${id}`, data);
    return response.data;
  }

  async delete(id: string, replacementCategoryId?: string): Promise<DeleteCategoryResponse> {
    const params = replacementCategoryId ? { replacementCategoryId } : {};
    const response = await this.axios.delete<DeleteCategoryResponse>(`/categories/${id}`, {
      params,
    });
    return response.data;
  }

  async checkUsage(id: string): Promise<CategoryUsageResponse> {
    const response = await this.axios.get<CategoryUsageResponse>(`/categories/${id}/usage`);
    return response.data;
  }
}
```

#### Usage Example

```typescript
const client = new CategoryApiClient();

// 費目追加
try {
  const category = await client.create({
    name: 'ペット',
    type: 'EXPENSE',
    icon: '🐕',
    color: '#FF9800',
  });
  console.log('費目を追加しました:', category);
} catch (error) {
  console.error('エラー:', error.response.data);
}

// 費目一覧取得
const categories = await client.getAll('EXPENSE');
console.log('支出費目一覧:', categories.data);

// 費目削除（使用状況確認 → 代替費目指定）
const usage = await client.checkUsage('cat_custom_001');
if (usage.isUsed) {
  await client.delete('cat_custom_001', 'cat_default_001');
  console.log(`${usage.usageCount}件の取引を移行して削除しました`);
} else {
  await client.delete('cat_custom_001');
  console.log('費目を削除しました');
}
```

---

### NestJS (Backend)

#### Controller

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
  DeleteResponseDto,
} from './dto';
import {
  CreateCategoryUseCase,
  GetCategoriesUseCase,
  GetCategoryByIdUseCase,
  UpdateCategoryUseCase,
  DeleteCategoryUseCase,
  CheckCategoryUsageUseCase,
} from './application';

@Controller('categories')
export class CategoryController {
  constructor(
    private readonly createUseCase: CreateCategoryUseCase,
    private readonly getCategoriesUseCase: GetCategoriesUseCase,
    private readonly getCategoryByIdUseCase: GetCategoryByIdUseCase,
    private readonly updateUseCase: UpdateCategoryUseCase,
    private readonly deleteUseCase: DeleteCategoryUseCase,
    private readonly checkUsageUseCase: CheckCategoryUsageUseCase
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const result = await this.createUseCase.execute(dto);
    return CategoryResponseDto.fromEntity(result);
  }

  @Get()
  async findAll(@Query('type') type?: string): Promise<CategoryListResponseDto> {
    const result = await this.getCategoriesUseCase.execute(type);
    return {
      success: true,
      data: result.map(CategoryResponseDto.fromEntity),
      total: result.length,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CategoryResponseDto> {
    const result = await this.getCategoryByIdUseCase.execute(id);
    return CategoryResponseDto.fromEntity(result);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto
  ): Promise<CategoryResponseDto> {
    const result = await this.updateUseCase.execute(id, dto);
    return CategoryResponseDto.fromEntity(result);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Query('replacementCategoryId') replacementCategoryId?: string
  ): Promise<DeleteResponseDto> {
    const result = await this.deleteUseCase.execute(id, replacementCategoryId);
    return {
      success: true,
      replacedCount: result.replacedCount,
      message:
        result.replacedCount > 0
          ? `${result.replacedCount}件の取引を移行して費目を削除しました`
          : '費目を削除しました',
    };
  }

  @Get(':id/usage')
  async checkUsage(@Param('id') id: string): Promise<CategoryUsageResponseDto> {
    const result = await this.checkUsageUseCase.execute(id);
    return {
      isUsed: result.isUsed,
      usageCount: result.usageCount,
      transactionSamples: result.transactionSamples,
    };
  }
}
```

---

## 参考資料

- [README.md](./README.md) - 設計書の概要
- [class-diagrams.md](./class-diagrams.md) - クラス構造
- [sequence-diagrams.md](./sequence-diagrams.md) - 処理フロー
- [screen-transitions.md](./screen-transitions.md) - 画面遷移
