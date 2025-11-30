# クレジットカード月別集計 (FR-012) モジュール詳細設計書

**対象機能**:

- FR-012: クレジットカード利用明細の月別集計

**作成日**: 2025-11-30
**最終更新日**: 2025-11-30
**バージョン**: 1.0

## 概要

このドキュメントは、クレジットカード利用明細の月別集計機能 (FR-012) に関するモジュールの詳細設計を文書化したものです。

**簡単な機能説明**: クレジットカードの利用明細を月別に集計し、締め日に基づいて正確な請求月を判定し、カテゴリ別内訳や支払額を算出します。各カード会社の締め日パターン（月末、15日、10日、カスタム）に対応し、ポイント利用・キャッシュバック等の控除項目も反映します。

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
│  - AggregationController (REST API)     │
│  - MonthlyCardSummaryResponseDto        │
│  - AggregateCardTransactionsRequestDto  │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Application Layer                   │
│  - AggregateCardTransactionsUseCase     │
│  - BillingPeriodCalculator              │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Domain Layer                        │
│  - MonthlyCardSummary                   │
│  - CategoryAmount                       │
│  - Discount                             │
│  - PaymentStatus (Enum)                 │
│  - DiscountType (Enum)                  │
│  - AggregationRepository (Interface)    │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Infrastructure Layer                │
│  - JsonAggregationRepository            │
│  - TransactionRepository (既存)         │
│  - CreditCardRepository (既存)          │
└─────────────────────────────────────────┘
```

### レイヤごとの責務

#### Presentation Layer（プレゼンテーション層）

- **責務**: HTTP リクエスト/レスポンスの処理
- **主なコンポーネント**:
  - `AggregationController`: カード利用明細集計APIエンドポイント
  - `AggregateCardTransactionsRequestDto`: 集計リクエストDTO（class）
  - `MonthlyCardSummaryResponseDto`: 月別集計レスポンスDTO（interface）

#### Application Layer（アプリケーション層）

- **責務**: カード利用明細の集計ロジック、締め日に基づく請求月判定
- **主なコンポーネント**:
  - `AggregateCardTransactionsUseCase`: カード利用明細の月別集計ユースケース
  - `BillingPeriodCalculator`: 締め日に基づく請求月計算サービス

#### Domain Layer（ドメイン層）

- **責務**: 月別集計データのビジネスルール
- **主なコンポーネント**:
  - `MonthlyCardSummary`: 月別カード集計エンティティ
  - `CategoryAmount`: カテゴリ別金額
  - `Discount`: 割引・ポイント利用
  - `PaymentStatus`: 支払いステータスEnum
  - `DiscountType`: 割引タイプEnum
  - `AggregationRepository`: 集計データリポジトリインターフェース

#### Infrastructure Layer（インフラストラクチャ層）

- **責務**: 集計データの永続化、取引データ・カード情報の取得
- **主なコンポーネント**:
  - `JsonAggregationRepository`: 集計データのJSON永続化実装
  - `TransactionRepository`: 取引データ取得（既存）
  - `CreditCardRepository`: クレジットカード情報取得（既存）

## 主要機能

### カード利用明細の月別集計

**概要**: 指定されたカードと期間の取引を取得し、締め日に基づいて請求月を判定し、月別に集計します。カテゴリ別内訳、ポイント利用・キャッシュバック等の控除を反映した最終支払額を算出します。

**実装箇所**:

- Controller: `AggregationController`
- Use Case: `AggregateCardTransactionsUseCase`
- Entity: `MonthlyCardSummary`
- Service: `BillingPeriodCalculator`

**締め日パターン対応**:

- 月末締め（例: 31日締め、翌月27日払い）
- 15日締め（例: 15日締め、翌月10日払い）
- 10日締め（例: 10日締め、翌月5日払い）
- カスタム締め日（任意の日付）

**計算ロジック**:

1. 取引日と締め日を比較
2. 取引日 <= 締め日の場合: 当月請求
3. 取引日 > 締め日の場合: 翌月請求
4. カテゴリ別に利用額を集計
5. ポイント利用・キャッシュバックを控除
6. 最終支払額を算出

## 技術スタック

### Backend

- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Architecture**: Onion Architecture
- **ORM**: TypeORM（将来）
- **Database**: MySQL (本番), JSON (開発)

### Frontend

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: React, Tailwind CSS

## データモデル

### 主要エンティティ

#### MonthlyCardSummary

```typescript
export interface MonthlyCardSummary {
  id: string;
  cardId: string;
  cardName: string;
  billingMonth: string; // YYYY-MM
  closingDate: Date;
  paymentDate: Date;
  totalAmount: number;
  transactionCount: number;
  categoryBreakdown: CategoryAmount[];
  transactionIds: string[];
  discounts: Discount[];
  netPaymentAmount: number;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

#### CategoryAmount

```typescript
export interface CategoryAmount {
  category: string;
  amount: number;
  count: number;
}
```

#### Discount

```typescript
export interface Discount {
  type: DiscountType;
  amount: number;
  description: string;
}

export enum DiscountType {
  POINT = 'POINT',
  CASHBACK = 'CASHBACK',
  CAMPAIGN = 'CAMPAIGN',
}
```

#### PaymentStatus

```typescript
export enum PaymentStatus {
  PENDING = 'PENDING', // 未払い（引落前）
  PROCESSING = 'PROCESSING', // 処理中（引落予定日前後）
  PAID = 'PAID', // 支払済（照合完了）
  OVERDUE = 'OVERDUE', // 延滞（引落日を過ぎても未払い）
  PARTIAL = 'PARTIAL', // 一部支払い
  DISPUTED = 'DISPUTED', // 不一致（要確認）
  CANCELLED = 'CANCELLED', // キャンセル
  MANUAL_CONFIRMED = 'MANUAL_CONFIRMED', // 手動確認済
}
```

## API仕様概要

詳細は [入出力設計](./input-output-design.md) を参照。

### 主要エンドポイント

| メソッド | エンドポイント                      | 説明                           |
| -------- | ----------------------------------- | ------------------------------ |
| POST     | `/api/aggregation/card/monthly`     | カード利用明細の月別集計を実行 |
| GET      | `/api/aggregation/card/monthly`     | 月別集計の一覧を取得           |
| GET      | `/api/aggregation/card/monthly/:id` | 月別集計の詳細を取得           |

## セキュリティ考慮事項

- [x] 認証・認可の実装（将来対応）
- [x] 入力値のバリデーション
- [x] SQLインジェクション対策（TypeORM使用）
- [x] XSS対策
- [x] CSRF対策
- [ ] APIレート制限（将来対応）
- [x] カード番号のマスキング表示
- [x] 金額情報の暗号化保存（将来対応）

## パフォーマンス考慮事項

- [x] データベースクエリの最適化（インデックス使用）
- [x] 集計期間の制限（最大1年分）
- [x] ページネーション実装（一覧取得時）
- [x] 大量明細対応（最大1万件）
- [x] キャッシング戦略（将来対応）

## エラーハンドリング

### エラー分類

1. **バリデーションエラー** (400 Bad Request)
   - 入力値の形式エラー
   - 必須項目の欠如
   - 集計期間が長すぎる（1年超）

2. **リソース未検出** (404 Not Found)
   - カードIDが存在しない
   - 締め日が設定されていない
   - 明細データが存在しない

3. **サーバーエラー** (500 Internal Server Error)
   - 予期しないエラー
   - データベース接続エラー

## テスト方針

### ユニットテスト

- **対象**: Domain Layer, Application Layer
- **ツール**: Jest
- **カバレッジ目標**: 80%以上
- **主要テストケース**:
  - 請求月判定ロジック（月末締め、15日締め、10日締め）
  - カテゴリ別集計計算
  - ポイント利用・キャッシュバック控除
  - 支払額計算

### 統合テスト

- **対象**: API エンドポイント
- **ツール**: Supertest + Jest
- **テスト内容**: HTTPリクエスト/レスポンスの検証

### E2Eテスト

- **対象**: ユーザーシナリオ
- **ツール**: Playwright
- **テスト内容**: 集計実行フローの検証（将来対応）

## 実装上の注意事項

1. **型安全性の遵守**
   - `any`型の使用禁止
   - すべての関数に適切な型定義
   - RequestDTOは`class`、ResponseDTOは`interface`

2. **依存性の方向**
   - 外側のレイヤから内側のレイヤへのみ依存
   - ドメイン層は他のレイヤに依存しない

3. **エラーハンドリング**
   - すべての非同期処理にエラーハンドリング
   - カスタム例外クラスの使用

4. **ロギング**
   - 集計処理の開始・終了ログ
   - エラー発生時のスタックトレース

5. **締め日計算**
   - 月またぎの処理に注意
   - 12月から1月の遷移処理
   - 閏年対応（将来対応）

## 関連ドキュメント

- [機能要件書](../../functional-requirements/FR-012-015_credit-card-management.md)
- [システムアーキテクチャ](../../system-architecture.md)

## 変更履歴

| バージョン | 日付       | 変更内容 | 作成者       |
| ---------- | ---------- | -------- | ------------ |
| 1.0        | 2025-11-30 | 初版作成 | AI Assistant |

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

- [ ] 画面遷移図が作成されている（画面なし）
- [ ] 状態遷移図が作成されている（PaymentStatusの遷移はFR-014で対応）
- [ ] バッチ処理詳細が作成されている（バッチ処理なし）
