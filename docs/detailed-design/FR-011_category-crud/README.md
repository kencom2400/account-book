# 費目のカスタマイズ機能 (FR-011) モジュール詳細設計書

**対象機能**: FR-011: 費目の追加・編集・削除機能

**作成日**: 2025-11-29
**最終更新日**: 2025-11-29
**バージョン**: 1.0

## 概要

このドキュメントは、ユーザーが独自の費目を追加・編集・削除できる機能の詳細設計を記載したものです。個人の生活スタイルに合わせた柔軟な分類を実現し、デフォルト費目では対応できないケースに対応します。

## 目次

1. [クラス図](./class-diagrams.md) - クラス構造とエンティティ設計
2. [シーケンス図](./sequence-diagrams.md) - 処理フローと相互作用
3. [入出力設計](./input-output-design.md) - API仕様とデータ構造
4. [画面遷移図](./screen-transitions.md) - UIの画面遷移とユーザーフロー

## アーキテクチャ概要

このシステムは **Onion Architecture** を採用しており、以下のレイヤ構成となっています。

### レイヤ構成

```
┌─────────────────────────────────────────┐
│     Presentation Layer                  │
│  - CategoryController                   │
│  - CreateCategoryDto                    │
│  - UpdateCategoryDto                    │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Application Layer                   │
│  - CreateCategoryUseCase                │
│  - UpdateCategoryUseCase                │
│  - DeleteCategoryUseCase                │
│  - GetCategoriesUseCase                 │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Domain Layer                        │
│  - CategoryEntity                       │
│  - CategoryType (Value Object)          │
│  - CategoryName (Value Object)          │
│  - CategoryDomainService                │
│  - ICategoryRepository                  │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Infrastructure Layer                │
│  - CategoryTypeOrmRepository            │
│  - CategoryOrmEntity                    │
│  - CategoryJsonRepository (Fallback)    │
└─────────────────────────────────────────┘
```

## モジュール構成

### Backend (NestJS)

**categoryモジュール**: カスタム費目のCRUD管理

#### Domain層

- `CategoryEntity` - 費目エンティティ（カスタム費目を含む）
- `CategoryName` - 費目名ValueObject
- `CategoryType` - カテゴリタイプEnum
- `CategoryDomainService` - 費目管理ドメインサービス
  - 重複チェック
  - デフォルト費目の保護
  - 使用状況確認
- `ICategoryRepository` - 費目リポジトリインターフェース

#### Application層

- `CreateCategoryUseCase` - 費目追加
- `UpdateCategoryUseCase` - 費目編集
- `DeleteCategoryUseCase` - 費目削除
- `GetCategoriesUseCase` - 費目一覧取得
- `GetCategoryByIdUseCase` - 費目詳細取得
- `CheckCategoryUsageUseCase` - 費目使用状況確認

#### Infrastructure層

- `CategoryTypeOrmRepository` - 費目リポジトリ実装（TypeORM）
- `CategoryOrmEntity` - 費目ORMエンティティ
- `CategoryJsonRepository` - 費目リポジトリ実装（JSON）

#### Presentation層

- `CategoryController` - 費目CRUD API
  - `POST /api/categories` - 費目追加
  - `GET /api/categories` - 費目一覧取得
  - `GET /api/categories/:id` - 費目詳細取得
  - `PUT /api/categories/:id` - 費目編集
  - `DELETE /api/categories/:id` - 費目削除
  - `GET /api/categories/:id/usage` - 使用状況確認
- `CreateCategoryDto` - 費目追加DTO
- `UpdateCategoryDto` - 費目更新DTO
- `CategoryResponseDto` - 費目レスポンスDTO

**注意**: 費目削除時の代替費目IDはクエリパラメータで指定します（`DELETE /api/categories/:id?replacementCategoryId=xxx`）

### Frontend (Next.js)

- `CategoryManagementPage.tsx` - 費目管理画面
- `CategoryForm.tsx` - 費目追加・編集フォーム
- `CategoryList.tsx` - 費目一覧表示
- `CategoryDeleteDialog.tsx` - 費目削除確認ダイアログ
- `IconPicker.tsx` - アイコン選択コンポーネント
- `ColorPicker.tsx` - 色選択コンポーネント
- `category.api.ts` - 費目APIクライアント

## 技術スタック

### Backend

- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.x
- **ORM**: TypeORM 0.3.x
- **Database**: MySQL 8.0 / JSON (Fallback)
- **Validation**: class-validator, class-transformer
- **Testing**: Jest, Supertest

### Frontend

- **Framework**: Next.js 15.x (App Router)
- **Language**: TypeScript 5.x
- **State Management**: Zustand
- **HTTP Client**: Axios
- **UI**: Tailwind CSS, shadcn/ui
- **Form Validation**: React Hook Form, Zod

## データベース設計

### 既存テーブルの拡張

`categories`テーブルは既に存在しており、以下の構造を持っています：

```sql
-- 既存テーブル
CREATE TABLE categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type ENUM('INCOME','EXPENSE','TRANSFER','REPAYMENT','INVESTMENT') NOT NULL,
  parent_id VARCHAR(36) NULL,
  icon VARCHAR(50) NULL,
  color VARCHAR(20) NULL,
  is_system_defined BOOLEAN NOT NULL DEFAULT false,
  `order` INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true, -- 論理削除フラグ（false: 削除済み）
  deleted_at TIMESTAMP NULL, -- 論理削除日時
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_categories_type (type),
  INDEX idx_categories_parent_id (parent_id),
  INDEX idx_categories_is_active (is_active) -- 論理削除クエリの高速化
);
```

**注意**: 上記のテーブル定義は論理削除を実装する場合の理想的な構造です。実際の既存テーブルにこれらのカラムがまだ存在しない場合は、以下のマイグレーションが必要です：

```sql
-- マイグレーション例（論理削除カラムが未実装の場合）
ALTER TABLE categories
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN deleted_at TIMESTAMP NULL,
  ADD INDEX idx_categories_is_active (is_active);
```

### データ構造

#### CategoryEntity (Domain)

```typescript
interface CategoryEntity {
  id: string; // UUID
  name: string; // 費目名
  type: CategoryType; // 親カテゴリ（INCOME/EXPENSE/TRANSFER/REPAYMENT/INVESTMENT）
  parentId: string | null; // 親費目ID（階層構造用）
  icon: string | null; // アイコン（絵文字）
  color: string | null; // カラーコード（例: #FF9800）
  isSystemDefined: boolean; // システム定義フラグ（true: デフォルト, false: カスタム）
  order: number; // 表示順序
  isActive: boolean; // 論理削除フラグ（false: 削除済み）
  deletedAt: Date | null; // 論理削除日時
  createdAt: Date;
  updatedAt: Date;
}
```

#### CategoryType Enum

```typescript
enum CategoryType {
  INCOME = 'INCOME', // 収入
  EXPENSE = 'EXPENSE', // 支出
  TRANSFER = 'TRANSFER', // 振替
  REPAYMENT = 'REPAYMENT', // 返済
  INVESTMENT = 'INVESTMENT', // 投資
}
```

## 主要機能

### 1. 費目の追加（Create）

**概要**: ユーザーが独自の費目を追加する

**実装箇所**:

- Controller: `CategoryController.create()`
- Use Case: `CreateCategoryUseCase`
- Entity: `CategoryEntity`

**バリデーション**:

- 費目名: 必須、1-50文字
- 親カテゴリ: 必須、有効なカテゴリタイプ
- 重複チェック: 同一親カテゴリ内で重複不可

### 2. 費目の編集（Update）

**概要**: 既存費目の名称やアイコン、色を変更する

**実装箇所**:

- Controller: `CategoryController.update()`
- Use Case: `UpdateCategoryUseCase`
- Entity: `CategoryEntity`

**バリデーション**:

- 費目名: 1-50文字
- デフォルト費目: 名称変更のみ可（アイコン・色も変更可）
- 親カテゴリの変更は不可

### 3. 費目の削除（Delete）

**概要**: 使用していない費目を削除する、または使用中の費目を代替費目に置き換えて削除する

**実装箇所**:

- Controller: `CategoryController.delete()`
- Use Case: `DeleteCategoryUseCase`
- Entity: `CategoryEntity`

**バリデーション**:

- デフォルト費目: 削除不可
- 使用中の費目: 代替費目の指定が必須

### 4. 費目一覧取得（Read）

**概要**: すべての費目（デフォルト + カスタム）を取得する

**実装箇所**:

- Controller: `CategoryController.findAll()`
- Use Case: `GetCategoriesUseCase`
- Entity: `CategoryEntity`

**機能**:

- カテゴリタイプでフィルタ可能
- 階層構造で返却
- 表示順序でソート

### 5. 費目使用状況確認（Check Usage）

**概要**: 費目が取引データで使用されているか確認する

**実装箇所**:

- Controller: `CategoryController.checkUsage()`
- Use Case: `CheckCategoryUsageUseCase`

**返却データ**:

- 使用件数
- 使用中の取引ID一覧（先頭10件）

## API仕様概要

詳細は [入出力設計](./input-output-design.md) を参照。

### 主要エンドポイント

| メソッド | エンドポイント              | 説明             |
| -------- | --------------------------- | ---------------- |
| GET      | `/api/categories`           | 費目一覧取得     |
| GET      | `/api/categories/:id`       | 費目詳細取得     |
| POST     | `/api/categories`           | 費目追加         |
| PUT      | `/api/categories/:id`       | 費目更新         |
| DELETE   | `/api/categories/:id`       | 費目削除         |
| GET      | `/api/categories/:id/usage` | 費目使用状況確認 |

**注意**: 費目削除時の取引一括置換は `DELETE /api/categories/:id?replacementCategoryId=xxx` のクエリパラメータで指定します。

## 業務ルール

### デフォルト費目の保護

- `is_system_defined: true`の費目は削除不可
- 名称変更は可能（ローカライズ対応のため）
- アイコン・色の変更も可能

### 重複チェック

- 同一親カテゴリ内で同じ名前の費目は作成不可
- 文字の正規化後に比較（NFKC正規化）
  - ひらがな/カタカナの統一（例: 「ペット」と「ぺっと」は重複）
  - 全角/半角の統一（例: 「ABC」と「ＡＢＣ」は重複）
  - 大文字/小文字の統一（例: 「Pet」と「pet」は重複）

### 使用中費目の削除

1. 費目の使用状況を確認
2. 使用中の場合、代替費目の選択を要求
3. すべての取引データの費目を代替費目に一括変更
4. 費目を論理削除（物理削除ではない）

### 表示順序

- デフォルト費目: `order: 0-999`
- カスタム費目: `order: 1000以上`
- 同一order値の場合、名前の昇順でソート

## セキュリティ考慮事項

- [x] 認証・認可の実装（将来: ユーザーごとの費目管理）
- [x] 入力値のバリデーション（DTO、class-validator）
- [x] SQLインジェクション対策（TypeORM使用）
- [x] XSS対策（フロントエンドでのエスケープ処理）
- [x] カスタム費目数の上限設定（スパム防止: 100件/ユーザー）
- [x] 不適切な費目名のフィルタリング

## パフォーマンス考慮事項

- [x] 費目一覧のキャッシング（メモリキャッシュ、TTL: 5分）
- [x] データベースインデックスの活用（type, parent_id）
- [x] 階層構造のクエリ最適化（再帰CTEではなく複数クエリ）
- [x] 一括置換時のバッチ処理（1000件/バッチ）

### パフォーマンス要件

- **費目追加**: 即座に反映（100ms以内）
- **費目削除（代替費目指定時）**: 1000件/秒
- **費目一覧取得**: 100ms以内
- **使用状況確認**: 500ms以内

## エラーハンドリング

### エラー分類

1. **バリデーションエラー** (400 Bad Request)
   - 費目名が空
   - 費目名が50文字超
   - 無効な親カテゴリ
   - 費目名重複

2. **認可エラー** (403 Forbidden)
   - デフォルト費目の削除試行
   - 他のユーザーの費目への操作（将来）

3. **リソース未検出** (404 Not Found)
   - 指定された費目が存在しない

4. **競合エラー** (409 Conflict)
   - 使用中の費目を代替費目なしで削除試行

5. **サーバーエラー** (500 Internal Server Error)
   - データベース接続エラー
   - 一括更新失敗

### エラーメッセージ

| エラー               | HTTPコード | メッセージ                                         |
| -------------------- | ---------- | -------------------------------------------------- |
| 費目名重複           | 400        | `この費目名は既に存在します`                       |
| デフォルト費目の削除 | 403        | `デフォルト費目は削除できません`                   |
| 使用中費目の削除     | 409        | `この費目は使用中です。代替費目を指定してください` |
| 費目が存在しない     | 404        | `指定された費目が見つかりません`                   |
| 文字数超過           | 400        | `費目名は50文字以内で入力してください`             |

## テスト方針

### ユニットテスト

- **対象**: Domain Layer, Application Layer
- **ツール**: Jest
- **カバレッジ目標**: 80%以上

**テストケース例**:

- 費目追加の正常系・異常系
- 重複チェックロジック
- デフォルト費目保護ロジック
- 使用状況確認ロジック

### 統合テスト

- **対象**: API エンドポイント
- **ツール**: Supertest + Jest
- **テスト内容**: HTTPリクエスト/レスポンスの検証

**テストケース例**:

- POST `/api/categories` - 費目追加API
- PUT `/api/categories/:id` - 費目更新API
- DELETE `/api/categories/:id` - 費目削除API
- GET `/api/categories/:id/usage` - 使用状況確認API

### E2Eテスト

- **対象**: ユーザーシナリオ
- **ツール**: Playwright
- **テスト内容**: 画面操作フローの検証

**テストケース例**:

- 費目管理画面から費目を追加
- 費目一覧で費目を編集
- 使用中の費目を代替費目指定で削除
- デフォルト費目の削除試行（エラー表示確認）

## 実装上の注意事項

### 1. 型安全性の遵守

- `any`型の使用禁止
- すべての関数に適切な型定義
- DTO、Entity、ValueObjectの型定義を明確に分離

### 2. 依存性の方向

- 外側のレイヤから内側のレイヤへのみ依存
- ドメイン層は他のレイヤに依存しない
- インフラ層はドメイン層のインターフェースを実装

### 3. エラーハンドリング

- すべての非同期処理にtry-catchを実装
- カスタム例外クラスの使用（`CategoryAlreadyExistsException`, `CategoryInUseException`等）
- エラーログの適切な出力

### 4. トランザクション管理

- 費目削除時の一括置換はトランザクション内で実行
- ロールバック可能な設計

### 5. 論理削除

- 費目の削除は論理削除（`is_active: false`）
- 取引データとの整合性維持

## 依存関係

### Depends on (前提条件)

- FR-008: 主要カテゴリ分類 - カテゴリタイプの定義
- FR-009: 詳細費目分類 - 既存費目体系

### Blocks (後続機能)

- FR-010: 費目の手動修正 - カスタム費目の選択
- FR-016-022: 集計機能 - カスタム費目を含む集計

### Related to

- #183: Epic - データ分類機能

## 実装順序

1. **Phase 1**: 詳細設計書作成（本ドキュメント）✅
2. **Phase 2**: Domain層実装
   - CategoryEntity拡張
   - CategoryDomainService実装
3. **Phase 3**: Application層実装
   - CreateCategoryUseCase
   - UpdateCategoryUseCase
   - DeleteCategoryUseCase
4. **Phase 4**: Infrastructure層実装
   - マイグレーション（必要に応じて）
   - リポジトリ実装
5. **Phase 5**: Presentation層実装（API）
   - CategoryController拡張
   - DTO定義
6. **Phase 6**: Frontend実装
   - 費目管理画面
   - 費目フォーム
7. **Phase 7**: テスト実装・統合
   - ユニットテスト
   - 統合テスト
   - E2Eテスト

## 参考資料

- [`docs/functional-requirements/FR-008-011_data-classification.md`](../../functional-requirements/FR-008-011_data-classification.md) - 機能要件書
- [`docs/system-architecture.md`](../../system-architecture.md) - システムアーキテクチャ
- [`docs/database-schema.md`](../../database-schema.md) - データベース設計
- [`docs/detailed-design/FR-009_detailed-category-classification/README.md`](../FR-009_detailed-category-classification/README.md) - 詳細費目分類の設計

## 変更履歴

| バージョン | 日付       | 変更内容 | 作成者       |
| ---------- | ---------- | -------- | ------------ |
| 1.0        | 2025-11-29 | 初版作成 | AI Assistant |

## チェックリスト

設計書作成時の確認事項：

### 必須項目

- [x] アーキテクチャ図が記載されている
- [x] 主要エンティティが定義されている
- [x] APIエンドポイントが一覧化されている
- [x] クラス図へのリンクが設定されている
- [x] シーケンス図へのリンクが設定されている
- [x] 入出力設計へのリンクが設定されている

### 推奨項目

- [x] セキュリティ考慮事項が記載されている
- [x] パフォーマンス考慮事項が記載されている
- [x] エラーハンドリング方針が明確
- [x] テスト方針が記載されている

### オプション項目

- [x] 画面遷移図が作成されている
- [ ] 状態遷移図は不要（シンプルなCRUD）
- [ ] バッチ処理詳細は不要（バッチ処理なし）
