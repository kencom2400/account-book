# 月別収支集計機能 (FR-016) モジュール詳細設計書

**対象機能**:

- FR-016: 月別収支集計機能

**作成日**: 2025-01-27
**最終更新日**: 2025-01-27
**バージョン**: 1.0

## 概要

このドキュメントは、月別収支集計機能 (FR-016) に関するモジュールの詳細設計を文書化したものです。

**簡単な機能説明**: 指定した月の収入・支出を集計し、収支差額や推移を表示する。家計簿の基本機能として月次レポートを提供する。カテゴリ別・金融機関別の内訳、前月比・前年同月比の比較、貯蓄率の計算などの詳細な分析機能を含む。

## 目次

1. [画面遷移図](./screen-transitions.md) - 画面がある場合
2. [クラス図](./class-diagrams.md) - **必須**
3. [シーケンス図](./sequence-diagrams.md) - **必須**
4. [入出力設計](./input-output-design.md) - **必須** (API仕様)

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

### 月別収支集計

**概要**: 指定した月の収入・支出を集計し、詳細な分析情報を提供する。

**実装箇所**:

- Controller: `AggregationController`
- Use Case: `CalculateMonthlyBalanceUseCase`
- Domain Service: `MonthlyBalanceDomainService`（新規作成）
- Entity: `TransactionEntity`（既存）

**主な機能**:

1. 月別収支の基本集計（収入・支出・収支差額）
2. カテゴリ別内訳（収入・支出それぞれ）
3. 金融機関別内訳（収入・支出それぞれ）
4. 貯蓄率の計算
5. 前月比の計算（増減額・増減率）
6. 前年同月比の計算（増減額・増減率）
7. 取引明細の取得

### 既存実装との関係

既存の`CalculateMonthlySummaryUseCase`は基本的な集計のみを行っているため、FR-016の要件を満たすために以下の拡張が必要：

1. **新しいUseCaseの作成**: `CalculateMonthlyBalanceUseCase`
   - 既存のUseCaseを拡張するのではなく、FR-016専用のUseCaseを作成
   - 前月比・前年同月比の計算ロジックを追加
   - 貯蓄率の計算ロジックを追加

2. **Domain Serviceの拡張**: `MonthlyBalanceDomainService`（新規作成）
   - 前月比・前年同月比の計算ロジック
   - 貯蓄率の計算ロジック
   - カテゴリ別・金融機関別の詳細な内訳計算

3. **DTOの拡張**: 既存の`MonthlySummary`を拡張した`MonthlyBalanceResponseDto`を作成
   - 前月比・前年同月比の情報を追加
   - 貯蓄率の情報を追加
   - カテゴリ別・金融機関別の詳細な内訳を追加

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

#### MonthlyBalanceSummary（Value Object - 新規作成）

```typescript
interface MonthlyBalanceSummary {
  month: string; // YYYY-MM
  income: {
    total: number;
    count: number;
    byCategory: CategoryBreakdown[];
    byInstitution: InstitutionBreakdown[];
    transactions: TransactionDto[];
  };
  expense: {
    total: number;
    count: number;
    byCategory: CategoryBreakdown[];
    byInstitution: InstitutionBreakdown[];
    transactions: TransactionDto[];
  };
  balance: number; // 収支差額 (income - expense)
  savingsRate: number; // 貯蓄率 (balance / income * 100)。incomeが0の場合は0を返す
  comparison: {
    previousMonth: MonthComparison | null;
    sameMonthLastYear: MonthComparison | null;
  };
}

interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  amount: number;
  count: number;
  percentage: number;
}

interface InstitutionBreakdown {
  institutionId: string;
  institutionName: string;
  amount: number;
  count: number;
  percentage: number;
}

interface MonthComparison {
  incomeDiff: number;
  expenseDiff: number;
  balanceDiff: number;
  incomeChangeRate: number; // 前月比%
  expenseChangeRate: number;
}

interface TransactionDto {
  id: string;
  date: string; // ISO8601形式
  amount: number;
  categoryType: string; // CategoryTypeの文字列値
  categoryId: string;
  institutionId: string;
  accountId: string;
  description: string;
}
```

## API仕様概要

詳細は [入出力設計](./input-output-design.md) を参照。

### 主要エンドポイント

| メソッド | エンドポイント                     | 説明                   |
| -------- | ---------------------------------- | ---------------------- |
| GET      | `/api/aggregation/monthly-balance` | 月別収支集計情報を取得 |

## セキュリティ考慮事項

- [x] 認証・認可の実装（将来対応）
- [x] 入力値のバリデーション（月の形式チェック）
- [x] SQLインジェクション対策（パラメータ化クエリ使用）
- [ ] XSS対策（フロントエンド側で対応）
- [ ] CSRF対策（将来対応）
- [ ] APIレート制限（将来対応）

## パフォーマンス考慮事項

- [x] データベースクエリの最適化（月単位での取得）
- [x] インデックスの適用（日付・カテゴリ・金融機関ID）
- [ ] キャッシング戦略（将来対応：月次集計結果のキャッシュ）
- [ ] ページネーション実装（取引明細が多い場合）
- [ ] 不要なデータの遅延読み込み（取引明細は必要時のみ取得）

## エラーハンドリング

### エラー分類

1. **バリデーションエラー** (400 Bad Request)
   - 月の形式エラー（YYYY-MM形式でない）
   - 無効な月指定（13月など）

2. **リソース未検出** (404 Not Found)
   - 指定された月のデータが存在しない（空配列を返すため、404ではなく200で空データを返す）

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
   - 貯蓄率計算: `income`が0の場合は0を返す（ゼロ除算エラーを避ける）

6. **日付計算**
   - 閏年対応を考慮
   - 月の最終日を正確に取得（Date APIを活用）

## 関連ドキュメント

- [機能要件書](../../functional-requirements/FR-016-022_aggregation-analysis.md#fr-016-月別収支集計)
- [システムアーキテクチャ](../../system-architecture.md)
- [既存実装: CalculateMonthlySummaryUseCase](../../../apps/backend/src/modules/transaction/application/use-cases/calculate-monthly-summary.use-case.ts)

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
