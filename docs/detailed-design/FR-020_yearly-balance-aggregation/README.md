# 年間収支推移表示機能 (FR-020) モジュール詳細設計書

**対象機能**:

- FR-020: 年間収支推移表示機能

**作成日**: 2025-01-27
**最終更新日**: 2025-01-27
**バージョン**: 1.0

## 概要

このドキュメントは、年間収支推移表示機能 (FR-020) に関するモジュールの詳細設計を文書化したものです。

**簡単な機能説明**: 指定した年の1年間（12ヶ月）の収支推移を月別に集計・表示し、トレンドを視覚化する。年間サマリー（合計・平均・貯蓄率）、トレンド分析（線形回帰による傾き・標準偏差）、ハイライト情報（最大収入月・最大支出月・最高収支月・最低収支月）を提供する。

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
  - Domain Services: ドメインサービス（集計ロジック・トレンド分析など）
  - Repository Interfaces: リポジトリのインターフェース

#### Infrastructure Layer（インフラストラクチャ層）

- **責務**: 外部システムとのやりとり、永続化
- **主なコンポーネント**:
  - Repository Implementations: リポジトリの実装
  - External API Clients: 外部APIクライアント
  - Database Access: データベースアクセス

## 主要機能

### 年間収支推移表示

**概要**: 指定した年の1年間（12ヶ月）の収支推移を集計し、詳細な分析情報を提供する。

**実装箇所**:

- Controller: `AggregationController`（既存、拡張）
- Use Case: `CalculateYearlyBalanceUseCase`（新規作成）
- Domain Service: `YearlyBalanceDomainService`（新規作成）、`MonthlyBalanceDomainService`（既存、再利用）
- Entity: `TransactionEntity`（既存）

**主な機能**:

1. 年間収支の基本集計（12ヶ月分の合計・平均・貯蓄率）
2. 月別推移データの取得（FR-016の月別収支集計機能を再利用）
3. トレンド分析（線形回帰による傾き・標準偏差・方向判定）
4. ハイライト情報の抽出（最大収入月・最大支出月・最高収支月・最低収支月）

### 既存実装との関係

既存の`CalculateMonthlyBalanceUseCase`（FR-016）を再利用し、年間集計機能を実装：

1. **新しいUseCaseの作成**: `CalculateYearlyBalanceUseCase`
   - 対象年全体の取引データを`findByDateRange`で一度に取得（パフォーマンス最適化）
   - メモリ上で月別に集計処理を実行（FR-016の`MonthlyBalanceDomainService`を再利用）
   - 年間サマリーの計算（合計・平均・貯蓄率）
   - トレンド分析の実行
   - ハイライト情報の抽出

2. **Domain Serviceの拡張**: `YearlyBalanceDomainService`（新規作成）
   - トレンド分析ロジック（線形回帰・標準偏差計算）
   - ハイライト情報の抽出ロジック
   - 年間サマリーの計算ロジック

3. **既存Domain Serviceの再利用**: `MonthlyBalanceDomainService`（FR-016で作成済み）
   - メモリ上で月別にフィルタリングした取引データの収支集計に使用

4. **DTOの拡張**: 年間集計用の簡略版DTO（`MonthlyBalanceSummaryDto`）を新規作成し、`YearlyBalanceResponseDto`を作成
   - 12ヶ月分の`MonthlyBalanceSummaryDto`を含む（`comparison`フィールドを除外した簡略版）
   - 年間サマリー情報を追加
   - トレンド分析情報を追加
   - ハイライト情報を追加
   - **注意**: 月別集計API（FR-016）では`MonthlyBalanceResponseDto`（完全版、`comparison`フィールド含む）を使用し、年間集計API（FR-020）では`MonthlyBalanceSummaryDto`（簡略版、`comparison`フィールドなし）を使用する

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

#### YearlyBalanceSummary（Value Object - 新規作成）

```typescript
interface YearlyBalanceSummary {
  year: number;
  months: MonthlyBalanceSummary[]; // FR-016のMonthlyBalanceSummaryを再利用
  annual: {
    totalIncome: number;
    totalExpense: number;
    totalBalance: number;
    averageIncome: number;
    averageExpense: number;
    savingsRate: number; // 年間貯蓄率 (totalBalance / totalIncome * 100)。totalIncomeが0の場合は0を返す
  };
  trend: {
    incomeProgression: TrendAnalysis;
    expenseProgression: TrendAnalysis;
    balanceProgression: TrendAnalysis;
  };
  highlights: {
    maxIncomeMonth: string | null; // YYYY-MM形式、データが存在しない場合はnull
    maxExpenseMonth: string | null;
    bestBalanceMonth: string | null; // 最高収支月（収支が最大の月）
    worstBalanceMonth: string | null; // 最低収支月（収支が最小の月）
  };
}

interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  changeRate: number; // 傾き（線形回帰の係数）を100倍した値
  standardDeviation: number; // 標準偏差
}

interface MonthlyBalanceSummary {
  month: string; // YYYY-MM
  income: {
    total: number;
    count: number;
  };
  expense: {
    total: number;
    count: number;
  };
  balance: number; // 収支差額 (income - expense)
  savingsRate: number; // 貯蓄率 (balance / income * 100)。incomeが0の場合は0を返す
}
```

## API仕様概要

詳細は [入出力設計](./input-output-design.md) を参照。

### 主要エンドポイント

| メソッド | エンドポイント                    | 説明                   |
| -------- | --------------------------------- | ---------------------- |
| GET      | `/api/aggregation/yearly-balance` | 年間収支推移情報を取得 |

## セキュリティ考慮事項

- [x] 認証・認可の実装（将来対応）
- [x] 入力値のバリデーション（年の形式チェック）
- [x] SQLインジェクション対策（パラメータ化クエリ使用）
- [ ] XSS対策（フロントエンド側で対応）
- [ ] CSRF対策（将来対応）
- [ ] APIレート制限（将来対応）

## パフォーマンス考慮事項

- [x] データベースクエリの最適化（年単位での取得、`findByDateRange`で一度に取得してメモリ上で月別集計）
- [x] インデックスの適用（日付・カテゴリ・金融機関ID）
- [ ] キャッシング戦略（将来対応：年間集計結果のキャッシュ）
- [ ] ページネーション実装（不要：年単位の集計のため）
- [ ] 不要なデータの遅延読み込み（取引明細は必要時のみ取得）

**注意**: パフォーマンス最適化のため、12ヶ月分のデータを`findByDateRange`で一度に取得し、メモリ上で月別に集計する。これにより、N+1問題を回避し、データベースへの負荷を大幅に削減できる。将来的には、月次集計結果をキャッシュして再利用することを検討。

## エラーハンドリング

### エラー分類

1. **バリデーションエラー** (400 Bad Request)
   - 年の形式エラー（数値でない）
   - 無効な年指定（1900年未満など）

2. **リソース未検出** (404 Not Found)
   - 指定された年のデータが存在しない（空配列を返すため、404ではなく200で空データを返す）

3. **サーバーエラー** (500 Internal Server Error)
   - 予期しないエラー（DB接続失敗など）

### エラーレスポンス形式

すべてのエラーレスポンスは、プロジェクトで定義されている標準形式（`libs/types/src/api/error-response.ts`）に従う：

```typescript
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ErrorDetail[];
  };
  metadata: {
    timestamp: string;
    version: string;
  };
}

export interface ErrorDetail {
  field?: string;
  message: string;
  code?: string;
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
   - 貯蓄率計算: `totalIncome`が0の場合は0を返す（ゼロ除算エラーを避ける）
   - トレンド分析: 線形回帰の計算は数値計算ライブラリを使用するか、適切な精度で実装

6. **日付計算**
   - 閏年対応を考慮
   - 月の最終日を正確に取得（Date APIを活用）

7. **既存機能の再利用**
   - 対象年全体の取引データを`findByDateRange`で一度に取得（パフォーマンス最適化）
   - メモリ上で月別にフィルタリングし、FR-016の`MonthlyBalanceDomainService`を再利用して集計
   - **エラーハンドリング**: データ取得時にエラー（DB接続失敗など）が発生した場合は、500 Internal Server Errorを返す（空データとして扱わない）。これにより、クライアント側で正常な空データとサーバー側の問題を明確に区別できる

## 関連ドキュメント

- [機能要件書](../../functional-requirements/FR-016-022_aggregation-analysis.md#fr-020-年間収支推移表示)
- [システムアーキテクチャ](../../system-architecture.md)
- [既存実装: CalculateMonthlyBalanceUseCase (FR-016)](../FR-016_monthly-balance-aggregation/README.md)

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

- [ ] 画面遷移図が作成されている（画面がある場合）
- [ ] 状態遷移図が作成されている（複雑な状態管理がある場合）
- [ ] バッチ処理詳細が作成されている（バッチ処理がある場合）
