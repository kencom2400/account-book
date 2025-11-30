# 銀行引落額との自動照合 (FR-013) モジュール詳細設計書

**対象機能**:

- FR-013: 銀行引落額との自動照合機能

**作成日**: 2025-01-27
**最終更新日**: 2025-01-27
**バージョン**: 1.0

## 概要

このドキュメントは、クレジットカードの月別集計額と銀行口座からの実際の引落額を自動的に照合する機能 (FR-013) に関するモジュールの詳細設計を文書化したものです。

**簡単な機能説明**: クレジットカードの月別集計額（FR-012で算出）と銀行口座からの実際の引落額を自動的に照合し、金額・日付・摘要の3つの条件でマッチング判定を行います。完全一致の場合は支払済ステータスに更新し、不一致の場合はアラートを生成します。引落予定日の3日後（自動）またはユーザーによる手動実行で照合を実行します。

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
│  - ReconciliationController (REST API)  │
│  - ReconciliationResponseDto            │
│  - ReconcileCreditCardRequestDto        │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Application Layer                   │
│  - ReconcileCreditCardUseCase           │
│  - ReconciliationService                │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Domain Layer                        │
│  - Reconciliation                       │
│  - ReconciliationResult                │
│  - ReconciliationStatus (Enum)          │
│  - ReconciliationRepository (Interface) │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Infrastructure Layer                │
│  - JsonReconciliationRepository         │
│  - TransactionRepository (既存)         │
│  - AggregationRepository (既存)        │
└─────────────────────────────────────────┘
```

### レイヤごとの責務

#### Presentation Layer（プレゼンテーション層）

- **責務**: HTTP リクエスト/レスポンスの処理
- **主なコンポーネント**:
  - `ReconciliationController`: 照合実行APIエンドポイント
  - `ReconcileCreditCardRequestDto`: 照合リクエストDTO（class）
  - `ReconciliationResponseDto`: 照合結果レスポンスDTO（interface）

#### Application Layer（アプリケーション層）

- **責務**: 照合ロジックの調整、ユースケースの実装
- **主なコンポーネント**:
  - `ReconcileCreditCardUseCase`: クレジットカード引落額照合ユースケース
  - `ReconciliationService`: 照合処理の調整サービス

#### Domain Layer（ドメイン層）

- **責務**: 照合ロジックのビジネスルール
- **主なコンポーネント**:
  - `Reconciliation`: 照合エンティティ
  - `ReconciliationResult`: 照合結果Value Object
  - `ReconciliationStatus`: 照合ステータスEnum
  - `ReconciliationRepository`: 照合データリポジトリインターフェース

#### Infrastructure Layer（インフラストラクチャ層）

- **責務**: 照合データの永続化、取引データ・集計データの取得
- **主なコンポーネント**:
  - `JsonReconciliationRepository`: 照合データのJSON永続化実装
  - `TransactionRepository`: 銀行取引データ取得（既存）
  - `AggregationRepository`: カード月別集計データ取得（既存）

## 主要機能

### クレジットカード引落額の自動照合

**概要**: 指定されたカードと請求月の月別集計データを取得し、引落予定日前後3営業日の銀行取引を検索して、金額・日付・摘要の3つの条件でマッチング判定を行います。完全一致の場合は支払済ステータスに更新し、不一致の場合はアラートを生成します。

**実装箇所**:

- Controller: `ReconciliationController`
- Use Case: `ReconcileCreditCardUseCase`
- Entity: `Reconciliation`
- Service: `ReconciliationService`

**照合ロジック**:

1. **日付範囲フィルタリング**
   - 引落予定日 ± 3営業日の範囲で銀行取引を検索
   - 営業日計算（土日・祝日を除外）

2. **金額マッチング**
   - 銀行引落額 = カード請求額（完全一致、許容誤差±0円）

3. **摘要マッチング**
   - 銀行取引の摘要にカード会社名が含まれるか判定
   - 例: "カ－ド", "三井住友カ－ド", "クレジット"

4. **信頼度スコアリング**
   - 完全一致（金額・日付・摘要すべて一致）: confidence = 100
   - 部分一致（金額・日付のみ一致）: confidence = 70
   - 不一致: confidence = 0

5. **結果判定**
   - **Reconciliation.status**:
     - confidence = 100: `MATCHED`に更新
     - confidence = 70: `PARTIAL`に更新
     - confidence = 0: `UNMATCHED`に更新
   - **MonthlyCardSummary.status**（将来対応）:
     - confidence = 100: `PAID`に更新
     - confidence = 70: `PARTIAL`または`DISPUTED`に更新（要確認）
     - confidence = 0: `DISPUTED`に更新、アラート生成（FR-015）

**照合タイミング**:

- **自動実行**: 引落予定日の3日後（バッチ処理、将来対応）
- **手動実行**: ユーザーがAPIを呼び出し
- **データ同期完了時**: データ同期完了後に自動実行（将来対応）

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

#### Reconciliation

```typescript
export interface Reconciliation {
  id: string;
  cardId: string;
  billingMonth: string; // YYYY-MM
  status: ReconciliationStatus;
  executedAt: Date;
  results: ReconciliationResult[];
  summary: {
    total: number;
    matched: number;
    unmatched: number;
    partial: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

#### ReconciliationResult

```typescript
export interface ReconciliationResult {
  isMatched: boolean;
  confidence: number; // 0-100
  bankTransactionId?: string;
  cardSummaryId: string;
  discrepancy?: Discrepancy;
  matchedAt?: Date;
}
```

#### Discrepancy

```typescript
export interface Discrepancy {
  amountDifference: number; // 金額差
  dateDifference: number; // 日数差（営業日）
  descriptionMatch: boolean; // 摘要一致フラグ
  reason: string; // 不一致理由
}
```

#### ReconciliationStatus

```typescript
export enum ReconciliationStatus {
  MATCHED = 'MATCHED', // 完全一致
  UNMATCHED = 'UNMATCHED', // 不一致
  PARTIAL = 'PARTIAL', // 部分一致（要確認）
  PENDING = 'PENDING', // 照合待ち
}
```

## API仕様概要

詳細は [入出力設計](./input-output-design.md) を参照。

### 主要エンドポイント

| メソッド | エンドポイント             | 説明                     |
| -------- | -------------------------- | ------------------------ |
| POST     | `/api/reconciliations`     | クレジットカード照合実行 |
| GET      | `/api/reconciliations`     | 照合結果一覧を取得       |
| GET      | `/api/reconciliations/:id` | 照合結果詳細を取得       |

**補足**:

- 一覧取得時の絞り込みはクエリパラメータで行う（例: `?cardId=...&billingMonth=...`）
- RESTfulな設計原則に基づき、リソース名を複数形（`reconciliations`）で統一

## セキュリティ考慮事項

- [x] 認証・認可の実装（将来対応）
- [x] 入力値のバリデーション
- [x] SQLインジェクション対策（TypeORM使用）
- [x] XSS対策
- [x] CSRF対策
- [ ] APIレート制限（将来対応）
- [x] **照合ログの暗号化保存（初期実装で対応）**
  - 環境変数に保存した鍵で暗号化
  - AES-256-GCMアルゴリズムを使用
  - JSONファイル保存時も暗号化済みデータを保存
- [x] **個人情報のマスキング**
  - ログ出力時にカード番号、口座番号をマスキング

## パフォーマンス考慮事項

- [x] データベースクエリの最適化（インデックス使用）
- [x] 照合期間の制限（最大1ヶ月分）
- [x] 大量取引対応（最大1万件）
- [x] キャッシング戦略（将来対応）
- [x] **1件の照合処理: 100ms以内**
- [x] **一括照合（全カード・1ヶ月分）: 3秒以内**

## エラーハンドリング

### エラー分類

1. **バリデーションエラー** (400 Bad Request)
   - 入力値の形式エラー（例: UUID形式でない、YYYY-MM形式でない）
   - 必須項目の欠如

2. **リソース未検出** (404 Not Found)
   - カードIDが存在しない（リクエストされたリソースが存在しない）
   - 月別集計データが存在しない（RC001）
   - 照合結果が存在しない

3. **ビジネスロジックエラー** (422 Unprocessable Entity)
   - 引落予定日が未来（RC003）
   - 複数の候補取引が存在（RC004）

4. **サーバーエラー** (500 Internal Server Error)
   - 予期しないエラー
   - データベース接続エラー

### エラーコード

| エラーコード | エラー内容                     | HTTPステータス | 対処方法             |
| ------------ | ------------------------------ | -------------- | -------------------- |
| RC001        | カード請求データが見つからない | 404            | データ同期を実施     |
| RC002        | 銀行取引データが取得できない   | 500            | 銀行連携を確認       |
| RC003        | 引落予定日が未来               | 422            | 引落日到来後に再実行 |
| RC004        | 複数の候補取引が存在           | 422            | 手動で選択           |

## テスト方針

### ユニットテスト

- **対象**: Domain Layer, Application Layer
- **ツール**: Jest
- **カバレッジ目標**: 80%以上
- **主要テストケース**:
  - 完全一致の照合（TC-013-001）
  - 金額不一致（TC-013-002）
  - 日付ずれの許容（TC-013-003）
  - 複数候補の処理（TC-013-004）
  - 営業日計算ロジック
  - 摘要マッチングロジック
  - 信頼度スコアリング

### 統合テスト

- **対象**: API エンドポイント
- **ツール**: Supertest + Jest
- **テスト内容**: HTTPリクエスト/レスポンスの検証

### E2Eテスト

- **対象**: ユーザーシナリオ
- **ツール**: Playwright
- **テスト内容**: 照合実行フローの検証（将来対応）

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
   - 照合処理の開始・終了ログ
   - エラー発生時のスタックトレース
   - 個人情報のマスキング

5. **営業日計算**
   - 土日を除外
   - 祝日対応（将来対応）
   - 日付範囲の計算に注意

6. **金融計算の精度**
   - **金額は整数（円単位）で扱う**
   - JavaScriptのnumber型の浮動小数点誤差を避けるため、少数以下を扱わない設計
   - 許容誤差は±0円（完全一致）

7. **照合結果の保存**
   - 照合結果は永続化して履歴として保存
   - 同じカード・請求月の照合結果は上書き（最新の結果を保持）

## 関連ドキュメント

- [機能要件書](../../functional-requirements/FR-012-015_credit-card-management.md)
- [システムアーキテクチャ](../../system-architecture.md)
- [FR-012詳細設計書](../FR-012_credit-card-monthly-aggregation/README.md)

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

- [ ] 画面遷移図が作成されている（画面なし）
- [ ] 状態遷移図が作成されている（ReconciliationStatusの遷移は将来対応）
- [ ] バッチ処理詳細が作成されている（バッチ処理は将来対応）
