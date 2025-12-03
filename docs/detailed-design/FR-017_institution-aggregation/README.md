# 金融機関別集計機能 (FR-017) モジュール詳細設計書

**対象機能**:

- FR-017: 金融機関別集計機能

**作成日**: 2025-01-27
**最終更新日**: 2025-01-27
**バージョン**: 1.0

## 概要

このドキュメントは、金融機関別集計機能 (FR-017) に関するモジュールの詳細設計を文書化したものです。

**簡単な機能説明**: 各金融機関（銀行、クレジットカード、証券会社）ごとに取引を集計し、機関別の収支状況を可視化する。指定した期間（開始日〜終了日）の取引を金融機関ごとにグループ化し、収入・支出・収支差額・残高を計算する。複数の金融機関を選択して比較表示することも可能。

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

### 金融機関別集計

**概要**: 指定した期間の取引を金融機関ごとに集計し、機関別の収支状況を提供する。

**実装箇所**:

- Controller: `AggregationController`
- Use Case: `CalculateInstitutionSummaryUseCase`（新規作成）
- Domain Service: `InstitutionAggregationDomainService`（新規作成）
- Entity: `TransactionEntity`（既存）、`InstitutionEntity`（既存）、`AccountEntity`（既存）

**主な機能**:

1. 期間指定による取引データの取得（開始日〜終了日）
2. 金融機関選択（複数選択可、未指定の場合は全機関）
3. 金融機関ごとのグループ化
4. 機関別の収入・支出・収支差額の計算
5. 口座別の集計（各機関配下の口座ごと）
6. 残高情報の取得（現在の残高）
7. 取引件数の集計
8. 取引明細の取得（`includeTransactions`パラメータで制御、デフォルト: false）

### 既存実装との関係

既存の`CalculateMonthlyBalanceUseCase`（FR-016）は月単位の集計を行っているが、FR-017は期間指定（開始日〜終了日）による集計を行う。また、FR-016は全金融機関を対象とするが、FR-017は金融機関を選択可能。

既存の`aggregateByInstitution()`メソッド（`MonthlyBalanceDomainService`）を参考に、期間指定と金融機関選択に対応した集計ロジックを実装する。

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

#### InstitutionEntity（既存）

```typescript
interface InstitutionEntity {
  id: string;
  name: string;
  type: InstitutionType; // BANK, CREDIT_CARD, SECURITIES
  accounts: AccountEntity[];
  isConnected: boolean;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

#### AccountEntity（既存）

```typescript
interface AccountEntity {
  id: string;
  institutionId: string;
  accountNumber: string;
  accountName: string;
  balance: number; // 現在の残高
  currency: string;
}
```

#### InstitutionSummary（Value Object - 新規作成）

```typescript
interface InstitutionSummary {
  institutionId: string;
  institutionName: string;
  institutionType: InstitutionType;
  period: {
    start: Date;
    end: Date;
  };
  accounts: AccountSummary[];
  totalIncome: number;
  totalExpense: number;
  periodBalance: number; // 期間内の収支差額 (totalIncome - totalExpense)
  currentBalance: number; // 現在の残高（全口座の合計）
  transactionCount: number;
  transactions: TransactionDto[]; // 必要に応じて
}

interface AccountSummary {
  accountId: string;
  accountName: string;
  income: number;
  expense: number;
  periodBalance: number; // 期間内の収支差額 (income - expense)
  currentBalance: number; // 現在の残高
  transactionCount: number;
}
```

**命名規則の説明**:

- `periodBalance`: 指定期間内の収支差額（期間内の純増減額）
- `currentBalance`: 現在時点での残高（口座の実際の残高）
- この命名により、期間内の収支と現在の残高を明確に区別できる

## API仕様概要

詳細は [入出力設計](./input-output-design.md) を参照。

### 主要エンドポイント

| メソッド | エンドポイント                         | 説明                     |
| -------- | -------------------------------------- | ------------------------ |
| GET      | `/api/aggregation/institution-summary` | 金融機関別集計情報を取得 |

## セキュリティ考慮事項

- [ ] 認証・認可の実装（将来対応）
- [x] 入力値のバリデーション（日付範囲の妥当性チェック）
- [x] SQLインジェクション対策（パラメータ化クエリ使用）
- [ ] XSS対策（フロントエンド側で対応）
- [ ] CSRF対策（将来対応）
- [ ] APIレート制限（将来対応）

## パフォーマンス考慮事項

- [x] データベースクエリの最適化（期間指定での取得）
- [x] インデックスの適用（日付・金融機関ID・口座ID）
- [ ] キャッシング戦略（将来対応：集計結果のキャッシュ）
- [ ] ページネーション実装（取引明細が多い場合）
- [ ] 不要なデータの遅延読み込み（取引明細は必要時のみ取得）

## エラーハンドリング

### エラー分類

1. **バリデーションエラー** (400 Bad Request)
   - 日付範囲の形式エラー（開始日 > 終了日など）
   - 金融機関IDのフォーマットエラー（UUID形式でない、空文字列など）

2. **リソース未検出** (200 OK - 空データ)
   - 指定された金融機関IDが存在するフォーマットだが、該当するデータがない場合：その機関を警告などを出さずに無視し、存在するIDのデータのみを返す（エラーにしない）
   - すべてのIDが存在しない場合：空配列を返す（404ではなく200 OKで空データを返す）

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

6. **日付計算**
   - 期間の開始日と終了日の妥当性チェック
   - 開始日 > 終了日の場合はエラー

7. **金融機関選択**
   - 未指定の場合は全金融機関を対象
   - 指定された金融機関IDが存在しない場合は、その機関を警告などを出さずに無視し、存在するIDのデータのみを返す（エラーにしない）
   - 例: `institutionIds=["inst-001", "inst-999"]` の場合、`inst-001`が存在すればそのデータを返し、`inst-999`が存在しなくてもエラーにせず無視する

## 関連ドキュメント

- [機能要件書](../../functional-requirements/FR-016-022_aggregation-analysis.md#fr-017-金融機関別集計)
- [システムアーキテクチャ](../../system-architecture.md)
- [既存実装: CalculateMonthlyBalanceUseCase](../FR-016_monthly-balance-aggregation/README.md)

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
