# 費目別集計機能 (FR-019) モジュール詳細設計書

**対象機能**:

- FR-019: 費目別集計機能

**作成日**: 2025-01-27
**最終更新日**: 2025-01-27
**バージョン**: 1.0

## 概要

このドキュメントは、費目別集計機能 (FR-019) に関するモジュールの詳細設計を文書化したものです。

**簡単な機能説明**: 詳細な費目（食費、交通費、医療費等）ごとに取引を集計し、支出の内訳を詳細に分析する。階層構造（カテゴリ→費目→サブ費目）で集計し、予算対比や月次推移などの分析情報を提供する。

## 目次

1. [クラス図](./class-diagrams.md) - **必須**
2. [シーケンス図](./sequence-diagrams.md) - **必須**
3. [入出力設計](./input-output-design.md) - **必須** (API仕様)
4. [画面遷移図](./screen-transitions.md) - 画面がある場合

## アーキテクチャ概要

このシステムは **Onion Architecture** を採用しており、以下のレイヤ構成となっています。

### レイヤ構成

```
┌─────────────────────────────────────────┐
│     Presentation Layer                  │
│  - Controllers (REST API)               │
│  - DTOs                                 │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Application Layer                   │
│  - Use Cases                            │
│  - Application Services                 │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Domain Layer                        │
│  - Entities                             │
│  - Value Objects                        │
│  - Domain Services                      │
│  - Repository Interfaces                │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Infrastructure Layer                │
│  - Repository Implementations           │
│  - External API Clients                 │
│  - Database Access                      │
└─────────────────────────────────────────┘
```

### レイヤごとの責務

#### Presentation Layer（プレゼンテーション層）

- **責務**: HTTP リクエスト/レスポンスの処理
- **主なコンポーネント**:
  - Controllers: REST APIエンドポイントの定義
  - DTOs: データ転送オブジェクト（リクエストは`class`、レスポンスは`interface`）

#### Application Layer（アプリケーション層）

- **責務**: ビジネスロジックの調整、ユースケースの実装
- **主なコンポーネント**:
  - Use Cases: 特定のビジネスユースケースの実装
  - Application Services: アプリケーション全体のサービス

#### Domain Layer（ドメイン層）

- **責務**: ビジネスルールとドメインロジックの実装
- **主なコンポーネント**:
  - Entities: ビジネスエンティティ
  - Value Objects: 値オブジェクト
  - Domain Services: ドメインサービス（集計ロジックなど）
  - Repository Interfaces: リポジトリのインターフェース

#### Infrastructure Layer（インフラストラクチャ層）

- **責務**: 外部システムとのやりとり、永続化
- **主なコンポーネント**:
  - Repository Implementations: リポジトリの実装
  - External API Clients: 外部APIクライアント
  - Database Access: データベースアクセス

## 主要機能

### 費目別集計

**概要**: 指定した期間の詳細な費目（食費、交通費、医療費等）ごとに取引を集計し、階層構造で分析情報を提供する。

**実装箇所**:

- Controller: `AggregationController`
- Use Case: `CalculateSubcategoryAggregationUseCase`
- Domain Service: `SubcategoryAggregationDomainService`（新規作成）
- Entity: `TransactionEntity`（既存）、`CategoryEntity`（既存）

**主な機能**:

1. 費目別の基本集計（合計金額・取引件数・平均金額）
2. 階層構造での集計（カテゴリ→費目→サブ費目）
3. 予算対比（予算が設定されている場合）
4. 月次推移データの計算（期間内の月次推移）
5. 主要取引の取得（金額の大きい取引）

### 既存実装との関係

既存の集計機能（FR-016: 月別収支集計、FR-018: カテゴリ別集計）と連携し、より詳細な費目レベルの分析を提供する：

1. **新しいUseCaseの作成**: `CalculateSubcategoryAggregationUseCase`
   - FR-019専用のUseCaseを作成
   - 費目別集計ロジックを実装
   - 階層構造での集計ロジックを追加

2. **Domain Serviceの作成**: `SubcategoryAggregationDomainService`（新規作成）
   - 費目別集計ロジック
   - 階層構造での集計計算
   - 予算対比の計算ロジック
   - 推移データの計算ロジック

3. **DTOの作成**: `SubcategoryAggregationResponseDto`を作成
   - 費目別サマリー情報
   - 階層構造情報
   - 予算対比情報
   - 推移データ情報

## 技術スタック

### Backend

- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Architecture**: Onion Architecture
- **ORM**: TypeORM
- **Database**: MySQL (本番), JSON (開発)

### Frontend

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: React, Tailwind CSS

## データモデル

### 主要エンティティ

#### TransactionEntity（既存）

```typescript
interface TransactionEntity {
  id: string;
  date: Date;
  amount: number;
  categoryType: CategoryType; // INCOME, EXPENSE, TRANSFER, REPAYMENT, INVESTMENT
  categoryId: string; // 費目（サブカテゴリ）ID
  institutionId: string;
  accountId: string;
  description: string;
  // ... その他のプロパティ
  createdAt: Date;
  updatedAt: Date;
}
```

#### CategoryEntity（既存）

```typescript
interface CategoryEntity {
  id: string;
  name: string;
  categoryType: CategoryType;
  parentId: string | null; // 親カテゴリID（階層構造）
  code: string; // 費目コード
  // ... その他のプロパティ
  createdAt: Date;
  updatedAt: Date;
}
```

#### SubcategoryAggregationResult（Value Object - 新規作成）

```typescript
interface SubcategoryAggregationResult {
  itemId: string; // 費目ID（Domain層ではIDのみ）
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  percentage: number; // 全体に占める割合
  children: SubcategoryAggregationResult[]; // 子費目（階層構造）
}

interface MonthlyTrend {
  month: string; // YYYY-MM
  amount: number;
  count: number;
}

interface TrendData {
  monthly: MonthlyTrend[]; // 期間内の月次推移
}
```

**注意**: Domain層のValue Objectには、Application層で取得する情報（費目名など）は含めません。費目名はApplication層で`CategoryRepository`から取得してDTOに設定します。

### レスポンスDTO（Presentation層）

詳細は [入出力設計](./input-output-design.md) を参照。主要なDTOは以下の通りです：

- `SubcategoryAggregationResponseDto`: 費目別集計のレスポンスDTO
- `ExpenseItemSummary`: 費目別サマリーのDTO（`itemName`を含む）
- `TransactionDto`: 取引情報のDTO（`categoryName`を含む）

## API仕様概要

詳細は [入出力設計](./input-output-design.md) を参照。

### 主要エンドポイント

| メソッド | エンドポイント                 | 説明                 |
| -------- | ------------------------------ | -------------------- |
| GET      | `/api/aggregation/subcategory` | 費目別集計情報を取得 |

## セキュリティ考慮事項

- [ ] 認証・認可の実装（将来対応）
- [x] 入力値のバリデーション（期間の形式チェック）
- [x] SQLインジェクション対策（パラメータ化クエリ使用）
- [ ] XSS対策（フロントエンド側で対応）
- [ ] CSRF対策（将来対応）
- [ ] APIレート制限（将来対応）

## パフォーマンス考慮事項

- [x] データベースクエリの最適化（期間単位での取得）
- [x] インデックスの適用（日付・カテゴリID）
- [ ] キャッシング戦略（将来対応：集計結果のキャッシュ）
- [ ] ページネーション実装（取引明細が多い場合）
- [ ] 不要なデータの遅延読み込み（取引明細は必要時のみ取得）

## エラーハンドリング

### エラー分類

1. **バリデーションエラー** (400 Bad Request)
   - 期間の形式エラー（開始日が終了日より後など）
   - 無効なカテゴリタイプ指定

2. **リソース未検出** (200 OK - 空データ)
   - 指定された期間のデータが存在しない場合は空配列を返す（404ではなく200で空データを返す）
   - 指定された`itemId`が存在しない場合も空配列を返す（エラーハンドリング方針の統一）

3. **サーバーエラー** (500 Internal Server Error)
   - 予期しないエラー（DB接続失敗など）

### エラーレスポンス形式

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

## テスト方針

### ユニットテスト

- **対象**: Domain Layer, Application Layer
- **ツール**: Jest
- **カバレッジ目標**: 80%以上

### 統合テスト

- **対象**: API エンドポイント
- **ツール**: Supertest + Jest
- **テスト内容**: HTTPリクエスト/レスポンスの検証

### E2Eテスト

- **対象**: ユーザーシナリオ
- **ツール**: Playwright
- **テスト内容**: 画面操作フローの検証

## 実装上の注意事項

1. **型安全性の遵守**
   - `any`型の使用禁止
   - すべての関数に適切な型定義
   - Enum型の比較は型安全に（`Object.entries()`使用時は明示的型キャスト）

2. **依存性の方向**
   - 外側のレイヤから内側のレイヤへのみ依存
   - ドメイン層は他のレイヤに依存しない
   - Domain層のエンティティは、Presentation層のDTO型に依存してはならない

3. **エラーハンドリング**
   - すべての非同期処理にエラーハンドリング
   - カスタム例外クラスの使用
   - 空配列（[]）は正常な応答として扱う（500エラーにしない）

4. **ロギング**
   - 重要な処理にログ出力
   - 機密情報のログ出力禁止

5. **計算ロジックの精度**
   - 金額は整数（円単位）で扱う（浮動小数点の計算誤差を避ける）
   - 割合計算時は適切な丸め処理を実施
   - 構成比計算: 全体が0の場合は0を返す（ゼロ除算エラーを避ける）

6. **日付計算**
   - 閏年対応を考慮
   - 期間の開始日・終了日を正確に取得（Date APIを活用）

7. **階層構造の処理**
   - 親子関係の再帰的な集計処理
   - 階層の深さ制限（無限ループ防止）

## 関連ドキュメント

- [機能要件書](../../functional-requirements/FR-016-022_aggregation-analysis.md#fr-019-費目別集計)
- [システムアーキテクチャ](../../system-architecture.md)
- [既存実装: FR-016 月別収支集計](../FR-016_monthly-balance-aggregation/README.md)
- [既存実装: FR-018 カテゴリ別集計](../FR-018_category-aggregation/README.md)

## 変更履歴

| バージョン | 日付       | 変更内容 | 作成者       |
| ---------- | ---------- | -------- | ------------ |
| 1.0        | 2025-01-27 | 初版作成 | AI Assistant |

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

- [x] 画面遷移図が作成されている（画面がある場合）
