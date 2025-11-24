# 費目の手動修正機能 (FR-010) モジュール詳細設計書

**対象機能**:

- FR-010: 費目の手動修正機能

**作成日**: 2025-11-24
**最終更新日**: 2025-11-24
**バージョン**: 1.0

## 概要

このドキュメントは、FR-010（費目の手動修正機能）に関するモジュールの詳細設計を文書化したものです。

**機能説明**: ユーザーが取引データのカテゴリ（費目）を手動で変更できる機能を提供します。変更履歴を記録することで、将来的な分析や監査に活用できます。

## 目次

1. [クラス図](./class-diagrams.md) - **必須**
2. [シーケンス図](./sequence-diagrams.md) - **必須**
3. [入出力設計](./input-output-design.md) - **必須** (API仕様)

## アーキテクチャ概要

このシステムは **Onion Architecture** を採用しており、以下のレイヤ構成となっています。

### レイヤ構成

```
┌─────────────────────────────────────────┐
│     Presentation Layer                  │
│  - TransactionController                │
│  - UpdateTransactionCategoryDto         │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Application Layer                   │
│  - UpdateTransactionCategoryUseCase     │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Domain Layer                        │
│  - TransactionEntity                    │
│  - TransactionCategoryChangeHistory     │
│     Entity                              │
│  - ITransactionRepository               │
│  - ITransactionCategoryChangeHistory    │
│     Repository                          │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Infrastructure Layer                │
│  - TransactionTypeOrmRepository         │
│  - TransactionCategoryChangeHistory     │
│     Repository                          │
│  - TransactionOrmEntity                 │
│  - TransactionCategoryChangeHistory     │
│     OrmEntity                           │
└─────────────────────────────────────────┘
```

### レイヤごとの責務

#### Presentation Layer（プレゼンテーション層）

- **責務**: HTTP リクエスト/レスポンスの処理
- **主なコンポーネント**:
  - `TransactionController`: PATCH `/api/transactions/:id/category` エンドポイント
  - `UpdateTransactionCategoryDto`: リクエストDTOのバリデーション

#### Application Layer（アプリケーション層）

- **責務**: カテゴリ更新のユースケース実装、トランザクション管理
- **主なコンポーネント**:
  - `UpdateTransactionCategoryUseCase`: カテゴリ更新処理の調整

#### Domain Layer（ドメイン層）

- **責務**: 取引エンティティとカテゴリ変更履歴のビジネスロジック
- **主なコンポーネント**:
  - `TransactionEntity`: 取引エンティティ
  - `TransactionCategoryChangeHistoryEntity`: カテゴリ変更履歴エンティティ
  - Repository Interfaces: データ永続化のインターフェース定義

#### Infrastructure Layer（インフラストラクチャ層）

- **責務**: データベース永続化、ORMマッピング
- **主なコンポーネント**:
  - TypeORM Repository実装
  - ORM Entity定義

## 主要機能

### カテゴリ更新機能

**概要**: ユーザーが取引のカテゴリを手動で変更できる機能

**実装箇所**:

- Controller: `TransactionController.updateCategory()`
- Use Case: `UpdateTransactionCategoryUseCase`
- Entity: `TransactionEntity.updateCategory()`

**特徴**:

- データベーストランザクションによる原子性保証
- 変更前後のカテゴリ情報を履歴として記録

### カテゴリ変更履歴記録

**概要**: カテゴリ変更の履歴を自動的に記録

**実装箇所**:

- Entity: `TransactionCategoryChangeHistoryEntity`
- Repository: `ITransactionCategoryChangeHistoryRepository`

**記録内容**:

- 変更前カテゴリ（ID、名前、タイプ）
- 変更後カテゴリ（ID、名前、タイプ）
- 変更日時
- 変更者（将来的にユーザー認証実装時に使用）

## 技術スタック

### Backend

- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Architecture**: Onion Architecture
- **ORM**: TypeORM
- **Database**: MySQL
- **Transaction Management**: DataSource.transaction

### Frontend

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: React 19, Tailwind CSS
- **State Management**: React Hooks (useState, useEffect)

### 共通

- **Types**: @account-book/types (共有型定義)
- **Utilities**: @account-book/utils (フォーマット関数等)

## データモデル

### 主要エンティティ

#### TransactionEntity

```typescript
interface Transaction {
  id: string;
  date: Date;
  amount: number;
  category: Category;
  description: string;
  institutionId: string;
  accountId: string;
  status: TransactionStatus;
  isReconciled: boolean;
  relatedTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### TransactionCategoryChangeHistoryEntity

```typescript
interface TransactionCategoryChangeHistory {
  id: string;
  transactionId: string;
  oldCategory: Category;
  newCategory: Category;
  changedAt: Date;
  changedBy?: string; // 将来的にユーザー認証実装時に使用
}
```

#### Category

```typescript
interface Category {
  id: string;
  name: string;
  type: CategoryType;
}

enum CategoryType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
  REPAYMENT = 'REPAYMENT',
  INVESTMENT = 'INVESTMENT',
}
```

## データベース設計

### transaction_category_change_history テーブル

```sql
CREATE TABLE transaction_category_change_history (
  id VARCHAR(36) PRIMARY KEY,
  transactionId VARCHAR(36) NOT NULL,
  oldCategoryId VARCHAR(36) NOT NULL,
  oldCategoryName VARCHAR(100) NOT NULL,
  oldCategoryType ENUM('INCOME', 'EXPENSE', 'TRANSFER', 'REPAYMENT', 'INVESTMENT') NOT NULL,
  newCategoryId VARCHAR(36) NOT NULL,
  newCategoryName VARCHAR(100) NOT NULL,
  newCategoryType ENUM('INCOME', 'EXPENSE', 'TRANSFER', 'REPAYMENT', 'INVESTMENT') NOT NULL,
  changedAt DATETIME NOT NULL,
  changedBy VARCHAR(36) NULL,
  INDEX idx_transaction (transactionId),
  INDEX idx_transaction_changed (transactionId, changedAt)
);
```

**インデックス設計**:

- `idx_transaction`: transactionIdによる検索の高速化
- `idx_transaction_changed`: transactionIdとchangedAtの複合インデックス（時系列順ソート用）

**トランザクション管理**:

- データベーストランザクションにより、取引更新と変更履歴記録をアトミックに実行
- トランザクション外で取引の存在確認を実施（パフォーマンス最適化）

## API仕様概要

詳細は [入出力設計](./input-output-design.md) を参照。

### 主要エンドポイント

| メソッド | エンドポイント                   | 説明                 |
| -------- | -------------------------------- | -------------------- |
| PATCH    | `/api/transactions/:id/category` | 取引のカテゴリを更新 |

## セキュリティ考慮事項

- [x] 入力値のバリデーション（DTOレベルで実施）
- [x] SQLインジェクション対策（TypeORMの型安全なクエリ使用）
- [ ] 認証・認可の実装（将来対応）
- [ ] APIレート制限（将来対応）
- [x] トランザクションの原子性保証（データベーストランザクション使用）

## パフォーマンス考慮事項

- [x] データベーストランザクションの適切な使用
- [x] インデックスの適用（transactionId、複合インデックス）
- [x] トランザクション外での検証処理（不要なロック時間の削減）
- [x] エンティティマネージャー直接使用によるオーバーヘッド削減

**パフォーマンス最適化の実装**:

- 取引の存在確認はトランザクション外で実施
- トランザクション内では変更履歴の記録と取引の更新のみを実行
- これにより、トランザクションのロック時間を最小化

## エラーハンドリング

### エラー分類

1. **バリデーションエラー** (400 Bad Request)
   - カテゴリIDが不正な形式
   - 必須項目の欠如

2. **リソース未検出** (404 Not Found)
   - 指定されたtransactionIdが存在しない

3. **サーバーエラー** (500 Internal Server Error)
   - データベーストランザクションのロールバック
   - 予期しないエラー

## テスト方針

### ユニットテスト

- **対象**: Domain Layer, Application Layer
- **ツール**: Jest
- **実装済み**: 5件
  - `UpdateTransactionCategoryUseCase`のテスト
  - `TransactionEntity.updateCategory()`のテスト

### E2Eテスト（Backend）

- **対象**: API エンドポイント
- **ツール**: Supertest + Jest
- **実装済み**: 3件
  - 正常系: カテゴリ更新成功
  - 異常系: 存在しない取引IDでの更新
  - 異常系: 不正なカテゴリデータでの更新

### E2Eテスト（Frontend）

- **対象**: UI操作フロー
- **ツール**: Playwright
- **実装済み**: 7件（一時的にスキップ中）
  - カテゴリ選択UIの表示
  - カテゴリ変更の実行
  - エラーハンドリングの確認

**テストカバレッジ**: 80%以上を達成

## 実装上の注意事項

1. **型安全性の遵守**
   - すべての関数に適切な型定義
   - DTOはclassで定義（バリデーションデコレータ使用のため）
   - レスポンスDTOはinterfaceで定義

2. **依存性の方向**
   - 外側のレイヤから内側のレイヤへのみ依存
   - ドメイン層は他のレイヤに依存しない

3. **エラーハンドリング**
   - すべての非同期処理にエラーハンドリング
   - トランザクション内でのエラーは自動的にロールバック

4. **ロギング**
   - 重要な処理（カテゴリ変更）にログ出力
   - 変更内容の詳細を記録

5. **トランザクション管理**
   - 複数のデータベース操作は必ずトランザクション内で実行
   - トランザクション外で可能な検証は先に実行

## 実装時の設計判断

### データベーストランザクションの使用

**判断**: TypeORMの`DataSource.transaction`を使用して、変更履歴の作成と取引の更新をアトミックに実行

**理由**:

- 変更履歴と取引の更新は常に同時に成功または失敗する必要がある
- トランザクションを使用することで、データの整合性を保証

**トレードオフ**:

- `entityManager`を直接使用するため、リポジトリパターンの完全性が若干低下
- 将来的な改善案として、リポジトリメソッドが`EntityManager`を受け取れるよう拡張を検討

### 検証処理のトランザクション外実行

**判断**: 取引の存在確認はトランザクション外で実施

**理由**:

- パフォーマンス最適化（不要なロック時間の削減）
- トランザクション内では実際の更新処理のみを実行

### @CreateDateColumnではなく@Columnの使用

**判断**: `changedAt`フィールドは`@CreateDateColumn`ではなく`@Column`で定義

**理由**:

- アプリケーション層で日時を明示的に管理したい
- ビジネスロジックとして日時を制御する必要がある

## 制約・前提条件

- カテゴリマスタ（`categories`テーブル）が事前に登録されていること
- 更新対象の取引（`transactions`テーブル）が存在すること
- データベースはMySQL 8.0以上を使用
- トランザクション分離レベル: READ COMMITTED（デフォルト）

## 関連ドキュメント

- [機能要件書](../../functional-requirements/FR-008-011_data-classification.md) (L535-714)
- [システムアーキテクチャ](../../system-architecture.md)
- [データベース設計](../../database-schema.md)

## 変更履歴

| バージョン | 日付       | 変更内容                       | 作成者     |
| ---------- | ---------- | ------------------------------ | ---------- |
| 1.0        | 2025-11-24 | 初版作成（事後ドキュメント化） | kencom2400 |

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

- [ ] 画面遷移図が作成されている（画面がある場合）- **不要**（既存UIの一部機能）
- [ ] 状態遷移図が作成されている（複雑な状態管理がある場合）- **不要**（シンプルな状態管理）
- [ ] バッチ処理詳細が作成されている（バッチ処理がある場合）- **不要**（リアルタイム処理のみ）
