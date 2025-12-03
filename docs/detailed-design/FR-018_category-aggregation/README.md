# カテゴリ別集計機能 (FR-018) モジュール詳細設計書

**対象機能**:

- FR-018: カテゴリ別集計機能

**作成日**: 2025-12-03
**最終更新日**: 2025-12-03
**バージョン**: 1.0

## 概要

このドキュメントは、カテゴリ別集計機能 (FR-018) に関するモジュールの詳細設計を文書化したものです。

**簡単な機能説明**: 5つの主要カテゴリ（収入・支出・振替・返済・投資）ごとに取引を集計し、内訳を可視化する。指定した期間のカテゴリ別サマリー、サブカテゴリ内訳、構成比、推移データを提供する。

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

### カテゴリ別集計

**概要**: 指定した期間の5つの主要カテゴリ（収入・支出・振替・返済・投資）ごとに取引を集計し、詳細な分析情報を提供する。

**実装箇所**:

- Controller: `AggregationController`
- Use Case: `CalculateCategoryAggregationUseCase`
- Domain Service: `CategoryAggregationDomainService`（新規作成）
- Entity: `TransactionEntity`（既存）

**主な機能**:

1. カテゴリ別の基本集計（合計金額・取引件数）
2. サブカテゴリ別内訳（費目別の集計）
3. 構成比の計算（全体に占める割合）
4. 推移データの計算（期間内の月次推移）
5. 主要取引の取得（金額の大きい取引）

### 既存実装との関係

既存の集計機能（FR-016: 月別収支集計）と連携し、カテゴリ別の詳細な分析を提供する：

1. **新しいUseCaseの作成**: `CalculateCategoryAggregationUseCase`
   - FR-018専用のUseCaseを作成
   - カテゴリ別集計ロジックを実装
   - サブカテゴリ内訳の計算ロジックを追加

2. **Domain Serviceの作成**: `CategoryAggregationDomainService`（新規作成）
   - カテゴリ別集計ロジック
   - サブカテゴリ別内訳計算
   - 構成比の計算ロジック
   - 推移データの計算ロジック

3. **DTOの作成**: `CategoryAggregationResponseDto`を作成
   - カテゴリ別サマリー情報
   - サブカテゴリ内訳情報
   - 構成比情報
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
  categoryId: string;
  institutionId: string;
  accountId: string;
  description: string;
  // ... その他のプロパティ
  createdAt: Date;
  updatedAt: Date;
}
```

#### CategoryAggregationSummary（Value Object - 新規作成）

```typescript
interface CategoryAggregationSummary {
  category: CategoryType;
  period: {
    start: Date;
    end: Date;
  };
  totalAmount: number;
  transactionCount: number;
  subcategories: SubcategorySummary[];
  percentage: number; // 全体に占める割合
  trend: TrendData;
}

interface SubcategorySummary {
  subcategory: string; // サブカテゴリ名（費目名）
  subcategoryId: string; // サブカテゴリID
  amount: number;
  count: number;
  percentage: number; // カテゴリ内での割合
  topTransactions: TransactionDto[]; // 金額の大きい取引（最大5件）
}

interface TrendData {
  monthly: MonthlyTrend[]; // 期間内の月次推移
}

interface MonthlyTrend {
  month: string; // YYYY-MM
  amount: number;
  count: number;
}

interface TransactionDto {
  id: string;
  date: string; // ISO8601形式
  amount: number;
  categoryType: string; // CategoryTypeの文字列値
  categoryId: string;
  categoryName: string; // サブカテゴリ名
  institutionId: string;
  accountId: string;
  description: string;
}
```

## API仕様概要

詳細は [入出力設計](./input-output-design.md) を参照。

### 主要エンドポイント

| メソッド | エンドポイント              | 説明                     |
| -------- | --------------------------- | ------------------------ |
| GET      | `/api/aggregation/category` | カテゴリ別集計情報を取得 |

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
   - 無効なカテゴリ指定

2. **リソース未検出** (404 Not Found)
   - 指定された期間のデータが存在しない（空配列を返すため、404ではなく200で空データを返す）

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

## 関連ドキュメント

- [機能要件書](../../functional-requirements/FR-016-022_aggregation-analysis.md#fr-018-カテゴリ別集計)
- [システムアーキテクチャ](../../system-architecture.md)
- [既存実装: FR-016 月別収支集計](../FR-016_monthly-balance-aggregation/README.md)

## 変更履歴

| バージョン | 日付       | 変更内容 | 作成者       |
| ---------- | ---------- | -------- | ------------ |
| 1.0        | 2025-12-03 | 初版作成 | AI Assistant |

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

- [ ] 画面遷移図が作成されている（画面がある場合）
- [ ] 状態遷移図が作成されている（複雑な状態管理がある場合）
- [ ] バッチ処理詳細が作成されている（バッチ処理がある場合）
