# 詳細費目分類機能 (FR-009) モジュール詳細設計書

**対象機能**: FR-009: MoneyTree・MoneyForward準拠の詳細費目分類

**作成日**: 2025-11-24
**最終更新日**: 2025-11-24
**バージョン**: 1.0

## 概要

このドキュメントは、主要カテゴリ（収入・支出・振替・返済・投資）をさらに詳細な費目（サブカテゴリ）に分類する機能の詳細設計を記載したものです。MoneyTree、MoneyForward等の既存サービスを参考にした体系を採用し、ユーザーの支出管理を細かく把握できるようにします。

## 目次

1. [クラス図](./class-diagrams.md) - クラス構造とエンティティ設計
2. [シーケンス図](./sequence-diagrams.md) - 処理フローと相互作用
3. [入出力設計](./input-output-design.md) - API仕様とデータ構造
4. [画面遷移図](./screen-transitions.md) - UIの画面遷移とユーザーフロー
5. [状態遷移図](./state-transitions.md) - サブカテゴリと分類状態の管理

## アーキテクチャ概要

このシステムは **Onion Architecture** を採用しており、以下のレイヤ構成となっています。

### レイヤ構成

```
┌─────────────────────────────────────────┐
│     Presentation Layer                  │
│  - SubcategoryController                │
│  - SubcategoryDto                       │
│  - ClassificationResponseDto            │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Application Layer                   │
│  - ClassifySubcategoryUseCase           │
│  - GetSubcategoriesUseCase              │
│  - GetSubcategoriesByCategoryUseCase    │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Domain Layer                        │
│  - Subcategory Entity                   │
│  - Merchant Entity                      │
│  - ClassificationConfidence VO          │
│  - SubcategoryClassifierService         │
│  - ISubcategoryRepository               │
│  - IMerchantRepository                  │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Infrastructure Layer                │
│  - SubcategoryTypeOrmRepository         │
│  - MerchantTypeOrmRepository            │
│  - SubcategoryOrmEntity                 │
│  - MerchantOrmEntity                    │
│  - Migration (AddSubcategoriesAndMerchants) │
│  - Seed Data (subcategories, merchants)│
└─────────────────────────────────────────┘
```

## モジュール構成

### Backend (NestJS)

**categoryモジュール**: サブカテゴリ管理とマーチャント（店舗）管理

#### Domain層

- `Subcategory` - サブカテゴリエンティティ
- `Merchant` - 店舗マスタエンティティ
- `ClassificationConfidence` - 分類信頼度ValueObject
- `SubcategoryClassifierService` - サブカテゴリ分類ドメインサービス
- `ISubcategoryRepository` - サブカテゴリリポジトリインターフェース
- `IMerchantRepository` - 店舗リポジトリインターフェース

#### Application層

- `ClassifySubcategoryUseCase` - 詳細費目自動分類
- `GetSubcategoriesUseCase` - 全サブカテゴリ取得
- `GetSubcategoriesByCategoryUseCase` - カテゴリ別サブカテゴリ取得

#### Infrastructure層

- `SubcategoryTypeOrmRepository` - サブカテゴリリポジトリ実装（TypeORM）
- `MerchantTypeOrmRepository` - 店舗リポジトリ実装（TypeORM）
- `SubcategoryOrmEntity` - サブカテゴリORMエンティティ
- `MerchantOrmEntity` - 店舗ORMエンティティ
- `Migration: AddSubcategoriesAndMerchants` - マイグレーション
- `subcategories.seed.ts` - サブカテゴリ初期データ
- `merchants.seed.ts` - 店舗マスタ初期データ

#### Presentation層

- `SubcategoryController` - サブカテゴリAPI
- `SubcategoryDto` - サブカテゴリDTO
- `ClassificationRequestDto` - 分類リクエストDTO
- `ClassificationResponseDto` - 分類結果DTO

### Frontend (Next.js)

- `SubcategorySelector.tsx` - サブカテゴリ選択UIコンポーネント
- `SubcategoryTree.tsx` - 階層表示コンポーネント
- `subcategory.api.ts` - サブカテゴリAPIクライアント

## 技術スタック

### Backend

- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.x
- **ORM**: TypeORM 0.3.x
- **Database**: MySQL 8.0
- **Validation**: class-validator
- **Testing**: Jest

### Frontend

- **Framework**: Next.js 14.x (App Router)
- **Language**: TypeScript 5.x
- **State Management**: Zustand
- **HTTP Client**: Axios
- **UI**: Tailwind CSS

## データベース設計

### テーブル構成

```sql
-- サブカテゴリマスタ
CREATE TABLE subcategories (
  id VARCHAR(50) PRIMARY KEY,
  category_type ENUM('INCOME','EXPENSE','TRANSFER','REPAYMENT','INVESTMENT') NOT NULL,
  name VARCHAR(100) NOT NULL,
  parent_id VARCHAR(50),
  display_order INT NOT NULL,
  icon VARCHAR(10),
  color VARCHAR(7),
  is_default BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES subcategories(id),
  INDEX idx_category_type (category_type),
  INDEX idx_parent_id (parent_id)
);

-- 店舗マスタ
CREATE TABLE merchants (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  aliases JSON,
  default_subcategory_id VARCHAR(50) NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 0.95,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (default_subcategory_id) REFERENCES subcategories(id),
  INDEX idx_name (name)
);

-- Transactionテーブルに追加
ALTER TABLE transactions
  ADD COLUMN subcategory_id VARCHAR(50),
  ADD COLUMN classification_confidence DECIMAL(3,2),
  ADD COLUMN merchant_id VARCHAR(50),
  ADD FOREIGN KEY (subcategory_id) REFERENCES subcategories(id),
  ADD FOREIGN KEY (merchant_id) REFERENCES merchants(id);
```

## サブカテゴリ体系

### 主要5カテゴリ

1. **収入 (INCOME)**: 給与・賞与、事業所得、投資収益、その他収入
2. **支出 (EXPENSE)**: 食費、日用品、住居、水道・光熱費、通信費、交通費、自動車、趣味・娯楽、衣服・美容、健康・医療、教育、保険、税金・社会保険、サブスクリプション、交際費、その他支出
3. **振替 (TRANSFER)**: 口座間移動、クレジットカード引落、電子マネーチャージ、証券口座入金
4. **返済 (REPAYMENT)**: 住宅ローン、自動車ローン、教育ローン、カードローン、その他ローン
5. **投資 (INVESTMENT)**: 株式、投資信託、債券、ETF、不動産投資、その他投資

詳細は機能要件書 [`docs/functional-requirements/FR-008-011_data-classification.md`](../../functional-requirements/FR-008-011_data-classification.md) を参照してください。

## 自動分類ロジック

### 分類アルゴリズム

```typescript
function classifySubcategory(
  transaction: Transaction,
  mainCategory: CategoryType
): SubcategoryClassification {
  // 1. 店舗名・サービス名から判定
  const merchant = identifyMerchant(transaction.description);
  if (merchant) {
    return {
      subcategoryId: merchant.defaultSubcategoryId,
      confidence: merchant.confidence,
      reason: 'merchant_match',
    };
  }

  // 2. キーワードマッチング
  const subcategory = matchSubcategoryKeywords(transaction.description, mainCategory);
  if (subcategory) {
    return {
      subcategoryId: subcategory.id,
      confidence: 0.8,
      reason: 'keyword_match',
    };
  }

  // 3. 金額レンジから推測
  const amountBased = inferFromAmount(transaction.amount, mainCategory);
  if (amountBased) {
    return {
      subcategoryId: amountBased.id,
      confidence: 0.6,
      reason: 'amount_inference',
    };
  }

  // 4. 定期性から判定
  if (isRecurring(transaction)) {
    return inferRecurringCategory(transaction);
  }

  // 5. デフォルト（その他）
  return {
    subcategoryId: getDefaultSubcategory(mainCategory),
    confidence: 0.5,
    reason: 'default',
  };
}
```

### 分類信頼度

- **90%以上**: 自動確定（店舗マスタ完全一致）
- **70-90%**: 自動確定・要確認マーク（キーワード一致）
- **50-70%**: 手動確認推奨（金額・定期性推測）
- **50%未満**: デフォルト費目（その他）

## パフォーマンス要件

- **単一取引の分類**: 5ms以内
- **バッチ分類**: 1000件/秒以上
- **店舗マスタ検索**: メモリキャッシュ利用（インメモリ検索）
- **サブカテゴリ一覧取得**: 100ms以内

## セキュリティ要件

- **店舗マスタ**: 管理者のみ編集可能
- **サブカテゴリ**: デフォルトは削除不可
- **カスタム費目**: ユーザーごとに管理（将来実装: FR-011）

## エラー処理

| エラー                     | HTTPステータス | 処理                 |
| -------------------------- | -------------- | -------------------- |
| サブカテゴリが見つからない | 404            | デフォルト費目を返却 |
| 無効なカテゴリタイプ       | 400            | バリデーションエラー |
| 店舗マスタ登録エラー       | 500            | リトライ可能にする   |
| DB接続エラー               | 503            | エラーメッセージ表示 |

## テスト戦略

### ユニットテスト

- Domain層: 分類ロジックのテスト
- Application層: UseCaseのテスト
- Infrastructure層: Repository実装のテスト

### E2Eテスト

- API経由でのサブカテゴリ取得
- 自動分類の動作確認
- フロントエンドUIの操作確認

### パフォーマンステスト

- 1000件のバッチ分類速度
- 店舗マスタ検索速度

## 依存関係

### Depends on (前提条件)

- FR-006: 取引履歴取得 - 取引データが必要
- FR-008: 主要カテゴリ分類 - 主カテゴリが必要

### Blocks (後続機能)

- FR-010: 費目の手動修正 - サブカテゴリ情報が必要
- FR-016-022: 集計機能 - サブカテゴリ別集計

### Related to

- #183: Epic - データ分類機能

## 実装順序

1. **Phase 1**: 詳細設計書作成（本ドキュメント）
2. **Phase 2**: Domain層実装
3. **Phase 3**: Infrastructure層実装（マイグレーション、シードデータ）
4. **Phase 4**: Application層実装
5. **Phase 5**: Presentation層実装（API）
6. **Phase 6**: Frontend実装
7. **Phase 7**: テスト実装・統合

## 参考資料

- [`docs/functional-requirements/FR-008-011_data-classification.md`](../../functional-requirements/FR-008-011_data-classification.md) - 機能要件書
- [`docs/system-architecture.md`](../../system-architecture.md) - システムアーキテクチャ
- [`docs/database-schema.md`](../../database-schema.md) - データベース設計

## 注意事項

### MoneyTree・MoneyForward準拠

既存の家計簿サービスとの互換性を考慮し、一般的な費目体系を採用します。

### 拡張性

- カスタム費目追加機能（FR-011）を見据えた設計
- 機械学習ベース分類への拡張を想定（Phase 2）

### メンテナンス性

- 店舗マスタは定期的な更新が必要
- サブカテゴリの追加・変更はマイグレーションで管理
