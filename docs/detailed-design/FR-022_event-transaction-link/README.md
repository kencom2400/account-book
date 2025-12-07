# イベントと収支の紐付け機能 (FR-022) モジュール詳細設計書

**対象機能**: FR-022: イベントと収支の紐付け機能

**作成日**: 2025-01-27
**最終更新日**: 2025-01-27
**バージョン**: 1.0

## 概要

このドキュメントは、イベントと収支データの関連付け機能 (FR-022) に関するモジュールの詳細設計を文書化したものです。

**簡単な機能説明**: イベントと関連する取引を紐付けることで、イベントごとの収支を分析できるようにする機能。手動紐付けに加えて、自動推奨機能により関連取引を提案し、イベント別の収支サマリーを提供する。

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
│  - EventController                      │
│  - SuggestTransactionsRequestDto        │
│  - EventFinancialSummaryResponseDto     │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Application Layer                   │
│  - SuggestRelatedTransactionsUseCase    │
│  - GetEventFinancialSummaryUseCase      │
│  - IEventRepository (依存)              │
│  - ITransactionRepository (依存)        │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Domain Layer                        │
│  - EventEntity                          │
│  - TransactionEntity                    │
│  - EventCategory (Enum)                 │
│  - IEventRepository                     │
│  - ITransactionRepository               │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Infrastructure Layer                │
│  - EventOrmRepository                   │
│  - TransactionRepository                │
│  - EventOrmEntity                       │
│  - TransactionOrmEntity                  │
│  - EventTransactionRelationOrmEntity    │
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
    - `SuggestRelatedTransactionsUseCase`: 関連取引の自動推奨
    - `GetEventFinancialSummaryUseCase`: イベント別収支サマリー取得

#### Domain Layer（ドメイン層）

- **責務**: ビジネスルールとドメインロジックの実装
- **主なコンポーネント**:
  - Entities: ビジネスエンティティ（`EventEntity`, `TransactionEntity`）
  - Value Objects: 値オブジェクト
  - Repository Interfaces: リポジトリのインターフェース

#### Infrastructure Layer（インフラストラクチャ層）

- **責務**: 外部システムとのやりとり、永続化
- **主なコンポーネント**:
  - Repository Implementations: リポジトリの実装
  - Database Access: データベースアクセス

## 主要機能

### 1. 自動推奨機能（Suggest Related Transactions）

**概要**: イベントに関連する可能性のある取引を自動的に推奨する

**実装箇所**:

- Controller: `EventController.suggestRelatedTransactions()`
- Use Case: `SuggestRelatedTransactionsUseCase`

**処理フロー**:

1. イベント日付の前後7日間の取引を取得
2. イベントカテゴリに応じたフィルタリング
3. スコアリング（日付の近さ、金額の大きさ、説明文の類似度）
4. 上位10件を推奨として返却

**スコアリングロジック**:

- 日付の近さ: イベント日付に近いほど高スコア
- 金額の大きさ: 高額取引ほど高スコア
- カテゴリマッチ: イベントカテゴリと取引カテゴリの関連性

### 2. イベント別収支サマリー（Event Financial Summary）

**概要**: イベントに関連付けられた取引の収支を集計する

**実装箇所**:

- Controller: `EventController.getFinancialSummary()`
- Use Case: `GetEventFinancialSummaryUseCase`

**集計項目**:

- 総収入（totalIncome）
- 総支出（totalExpense）
- 純収支（netAmount = totalIncome - totalExpense）
- 取引件数（transactionCount）
- 関連取引一覧（relatedTransactions）

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

## データモデル

### EventFinancialSummary (Response DTO)

```typescript
interface EventFinancialSummary {
  event: EventResponseDto;
  relatedTransactions: TransactionDto[];
  totalIncome: number; // 総収入（円）
  totalExpense: number; // 総支出（円）
  netAmount: number; // 純収支（totalIncome - totalExpense）
  transactionCount: number; // 関連取引件数
}
```

### SuggestedTransaction (Response DTO)

```typescript
interface SuggestedTransaction {
  transaction: TransactionDto;
  score: number; // 推奨スコア（0-100）
  reasons: string[]; // 推奨理由（例: ["日付が近い", "高額取引"]）
}
```

## API仕様概要

詳細は [入出力設計](./input-output-design.md) を参照。

### 主要エンドポイント

| メソッド | エンドポイント                         | 説明                       |
| -------- | -------------------------------------- | -------------------------- |
| GET      | `/api/events/:id/suggest-transactions` | 関連取引の推奨取得         |
| GET      | `/api/events/:id/financial-summary`    | イベント別収支サマリー取得 |

## セキュリティ考慮事項

- [ ] 認証・認可の実装（将来対応）
- [x] 入力値のバリデーション（DTO、class-validator）
- [x] SQLインジェクション対策（TypeORM使用）
- [x] XSS対策（フロントエンドでのエスケープ処理）

## パフォーマンス考慮事項

- [x] データベースインデックスの活用（date, category）
- [x] 日付範囲クエリの最適化
- [ ] 推奨結果のキャッシング（将来対応）
- [x] 推奨件数の制限（最大10件）

### パフォーマンス要件

- **推奨取引取得**: 500ms以内
- **収支サマリー取得**: 300ms以内（関連取引100件まで）

## エラーハンドリング

### エラー分類

1. **バリデーションエラー** (400 Bad Request)
   - 無効なイベントID
   - 無効な日付範囲

2. **リソース未検出** (404 Not Found)
   - 指定されたイベントが存在しない

3. **サーバーエラー** (500 Internal Server Error)
   - データベース接続エラー
   - 予期しないエラー

### エラーメッセージ

| エラー               | HTTPコード | メッセージ                           |
| -------------------- | ---------- | ------------------------------------ |
| イベント不存在       | 404        | `指定されたイベントが見つかりません` |
| バリデーションエラー | 400        | `無効なリクエストです`               |

## テスト方針

### ユニットテスト

- **対象**: Application Layer（UseCase）
- **ツール**: Jest
- **カバレッジ目標**: 80%以上

**テストケース例**:

- 推奨取引取得の正常系・異常系
- スコアリングロジックの検証
- 収支サマリー計算の検証

### 統合テスト

- **対象**: API エンドポイント
- **ツール**: Supertest + Jest
- **テスト内容**: HTTPリクエスト/レスポンスの検証

**テストケース例**:

- GET `/api/events/:id/suggest-transactions` - 推奨取引取得API
- GET `/api/events/:id/financial-summary` - 収支サマリー取得API

### E2Eテスト

- **対象**: ユーザーシナリオ
- **ツール**: Playwright
- **テスト内容**: 画面操作フローの検証

**テストケース例**:

- イベント詳細画面で推奨取引を表示
- イベント別収支サマリーを表示

## 実装上の注意事項

### 1. 型安全性の遵守

- `any`型の使用禁止
- すべての関数に適切な型定義
- DTO、Entity、ValueObjectの型定義を明確に分離
- Enum型の比較は型安全に（`Object.entries()`使用時は明示的型キャスト）

### 2. 依存性の方向

- 外側のレイヤから内側のレイヤへのみ依存
- ドメイン層は他のレイヤに依存しない
- Domain層のエンティティは、Presentation層のDTO型に依存してはならない
- エンティティからDTOへの変換は、Application層のUseCaseまたはPresentation層のマッパーで実施

### 3. エラーハンドリング

- すべての非同期処理にtry-catchを実装
- カスタム例外クラスの使用（`EventNotFoundException`等）
- エラーログの適切な出力

### 4. スコアリングロジック

- スコアリングロジックはApplication層のUseCaseに実装
- スコアの計算式は明確に定義し、テスト可能にする
- 将来的に機械学習モデルを導入する場合も、インターフェースを抽象化して差し替え可能にする

### 5. 日付処理

- 日付はUTCで保存し、表示時にローカルタイムゾーンに変換
- 日付範囲のバリデーション（開始日 <= 終了日）
- イベント日付の前後7日間の計算は、タイムゾーンを考慮

## 依存関係

### Depends on (前提条件)

- FR-021: イベントメモ機能 - イベント機能の存在
- TransactionEntity - 取引エンティティ
- `IEventRepository.linkTransaction()` - 手動紐付け機能（既に実装済み）

### Blocks (後続機能)

- FR-020: 年間収支推移表示 - イベントマーカーと収支サマリーの表示

### Related to

- #182: Epic - データ取得機能

## 実装順序

1. **Phase 1**: 詳細設計書作成（本ドキュメント）✅
2. **Phase 2**: Application層実装
   - `SuggestRelatedTransactionsUseCase`実装
   - `GetEventFinancialSummaryUseCase`実装
3. **Phase 3**: Presentation層実装（API）
   - `EventController`にエンドポイント追加
   - DTO定義（`SuggestTransactionsRequestDto`, `EventFinancialSummaryResponseDto`）
4. **Phase 4**: テスト実装・統合
   - ユニットテスト
   - 統合テスト
   - E2Eテスト

## 関連ドキュメント

- [`docs/functional-requirements/FR-016-022_aggregation-analysis.md`](../../functional-requirements/FR-016-022_aggregation-analysis.md#fr-022-イベントと収支の紐付け) - 機能要件書
- [`docs/detailed-design/FR-021_event-memo/README.md`](../FR-021_event-memo/README.md) - FR-021詳細設計書
- [`docs/system-architecture.md`](../../system-architecture.md) - システムアーキテクチャ
- [`docs/database-schema.md`](../../database-schema.md) - データベース設計

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
