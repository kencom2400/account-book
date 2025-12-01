# 支払いステータス管理 (FR-014) モジュール詳細設計書

**対象機能**:

- FR-014: クレジットカード支払いステータス管理

**作成日**: 2025-01-27
**最終更新日**: 2025-01-27
**バージョン**: 1.0

## 概要

このドキュメントは、クレジットカード支払いステータス管理機能 (FR-014) に関するモジュールの詳細設計を文書化したものです。

**簡単な機能説明**: クレジットカードの各請求月について、支払いステータス（未払い/支払済/確認中等）を管理します。引落予定日に基づいて自動的にステータスを更新し、照合結果に応じてステータスを遷移させます。ユーザーによる手動ステータス更新も可能で、すべてのステータス変更履歴を記録します。

## 目次

1. [クラス図](./class-diagrams.md) - **必須**
2. [シーケンス図](./sequence-diagrams.md) - **必須**
3. [状態遷移図](./state-transitions.md) - **推奨**（複雑な状態管理）
4. [入出力設計](./input-output-design.md) - **必須** (API仕様)
5. [バッチ処理詳細](./batch-processing.md) - **オプション**（日次バッチ処理）
6. [画面遷移図](./screen-transitions.md) - **推奨**（UI要件あり）

## アーキテクチャ概要

このシステムは **Onion Architecture** を採用しており、以下のレイヤ構成となっています。

### レイヤ構成

```
┌─────────────────────────────────────────┐
│     Presentation Layer                  │
│  - PaymentStatusController (REST API)   │
│  - UpdatePaymentStatusRequestDto         │
│  - PaymentStatusResponseDto             │
│  - PaymentStatusHistoryResponseDto      │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Application Layer                   │
│  - UpdatePaymentStatusUseCase           │
│  - GetPaymentStatusHistoryUseCase       │
│  - PaymentStatusUpdateScheduler         │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Domain Layer                        │
│  - PaymentStatusRecord                  │
│  - PaymentStatusHistory                 │
│  - PaymentStatus (Enum)                 │
│  - PaymentStatusTransitionRule          │
│  - PaymentStatusRepository (Interface)  │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Infrastructure Layer                 │
│  - JsonPaymentStatusRepository           │
│  - MonthlyCardSummaryRepository (既存)  │
│  - ReconciliationRepository (FR-013)     │
└─────────────────────────────────────────┘
```

### レイヤごとの責務

#### Presentation Layer（プレゼンテーション層）

- **責務**: HTTP リクエスト/レスポンスの処理
- **主なコンポーネント**:
  - `PaymentStatusController`: 支払いステータス管理APIエンドポイント
  - `UpdatePaymentStatusRequestDto`: ステータス更新リクエストDTO（class）
  - `PaymentStatusResponseDto`: ステータスレスポンスDTO（interface）
  - `PaymentStatusHistoryResponseDto`: ステータス履歴レスポンスDTO（interface）

#### Application Layer（アプリケーション層）

- **責務**: ステータス更新ロジック、ステータス遷移の検証、バッチ処理の調整
- **主なコンポーネント**:
  - `UpdatePaymentStatusUseCase`: ステータス更新ユースケース（手動・自動）
  - `GetPaymentStatusHistoryUseCase`: ステータス履歴取得ユースケース
  - `PaymentStatusUpdateScheduler`: 日次バッチ処理のスケジューラー
  - **注意**: 状態遷移の検証は`PaymentStatusRecord`エンティティ（ドメイン層）で実施

#### Domain Layer（ドメイン層）

- **責務**: 支払いステータスのビジネスルール、ステータス遷移ルール
- **主なコンポーネント**:
  - `PaymentStatusRecord`: 支払いステータス記録エンティティ
  - `PaymentStatusHistory`: ステータス変更履歴エンティティ
  - `PaymentStatus`: 支払いステータスEnum
  - `PaymentStatusTransitionRule`: ステータス遷移ルール（Value Object）
  - `PaymentStatusRepository`: ステータスリポジトリインターフェース

#### Infrastructure Layer（インフラストラクチャ層）

- **責務**: ステータスデータの永続化、月別集計データ・照合データの取得
- **主なコンポーネント**:
  - `JsonPaymentStatusRepository`: ステータスデータのJSON永続化実装
  - `MonthlyCardSummaryRepository`: 月別集計データ取得（既存）
  - `ReconciliationRepository`: 照合データ取得（FR-013）

## 主要機能

### 自動ステータス更新

**概要**: 日次バッチ処理により、引落予定日に基づいて自動的にステータスを更新します。引落予定日の3日前にPENDINGからPROCESSINGに遷移し、引落予定日+7日経過でOVERDUEに遷移します。

**実装箇所**:

- Scheduler: `PaymentStatusUpdateScheduler`
- Use Case: `UpdatePaymentStatusUseCase`
- Entity: `PaymentStatusRecord`

**トリガー条件**:

1. **PENDING → PROCESSING**: 引落予定日の3日前
2. **PROCESSING → PAID**: 照合成功時（FR-013）
3. **PROCESSING → DISPUTED**: 照合失敗時（FR-013）
4. **PROCESSING → OVERDUE**: 引落予定日+7日経過かつ未払い

### 手動ステータス更新

**概要**: ユーザーが請求明細を選択し、ステータスを手動で更新できます。ステータス遷移の妥当性を検証し、変更履歴を記録します。

**実装箇所**:

- Controller: `PaymentStatusController`
- Use Case: `UpdatePaymentStatusUseCase`
- Entity: `PaymentStatusRecord`（状態遷移の検証を実施）

**バリデーション**:

- 許可されたステータス遷移のみ実行
- 無効な遷移の場合はエラーメッセージを返す

### ステータス履歴取得

**概要**: 指定された請求月のステータス変更履歴を取得します。すべてのステータス変更（自動・手動）を時系列で表示します。

**実装箇所**:

- Controller: `PaymentStatusController`
- Use Case: `GetPaymentStatusHistoryUseCase`
- Entity: `PaymentStatusHistory`

## 技術スタック

### Backend

- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Architecture**: Onion Architecture
- **ORM**: TypeORM（将来）
- **Database**: MySQL (本番), JSON (開発)
- **Scheduler**: NestJS Schedule（@nestjs/schedule）

### Frontend

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: React, Tailwind CSS

## データモデル

### 主要エンティティ

#### PaymentStatusRecord

```typescript
export class PaymentStatusRecord {
  id: string;
  cardSummaryId: string; // MonthlyCardSummaryのID
  status: PaymentStatus;
  previousStatus?: PaymentStatus;
  updatedAt: Date;
  updatedBy: 'system' | 'user';
  reason?: string; // ステータス変更理由
  reconciliationId?: string; // 照合ID（FR-013）
  notes?: string; // ユーザー入力メモ
  createdAt: Date;

  // 状態遷移の検証メソッド（ドメインロジック）
  canTransitionTo(newStatus: PaymentStatus): boolean {
    // 遷移ルールの検証ロジック
  }
}
```

#### PaymentStatusHistory

```typescript
export class PaymentStatusHistory {
  cardSummaryId: string;
  statusChanges: PaymentStatusRecord[];

  addStatusChange(record: PaymentStatusRecord): void {
    // 履歴追加ロジック
    this.statusChanges.push(record);
  }

  getLatestStatus(): PaymentStatus {
    if (this.statusChanges.length === 0) {
      throw new Error('No status changes found');
    }
    return this.statusChanges[this.statusChanges.length - 1].status;
  }

  getStatusAt(date: Date): PaymentStatusRecord | null {
    // 指定日時点のステータスを取得
    // statusChangesはupdatedAt昇順でソートされていると仮定し、逆順にしてから検索します
    // 指定日以前で最も新しいレコードを返す
    return (
      this.statusChanges
        .slice()
        .reverse()
        .find((record) => record.updatedAt <= date) || null
    );
  }
}
```

#### PaymentStatus

```typescript
export enum PaymentStatus {
  PENDING = 'pending', // 未払い（引落前）
  PROCESSING = 'processing', // 処理中（引落予定日前後）
  PAID = 'paid', // 支払済（照合完了）
  OVERDUE = 'overdue', // 延滞（引落日を過ぎても未払い）
  PARTIAL = 'partial', // 一部支払い
  DISPUTED = 'disputed', // 不一致（要確認）
  CANCELLED = 'cancelled', // キャンセル
  MANUAL_CONFIRMED = 'manual_confirmed', // 手動確認済
}
```

## API仕様概要

詳細は [入出力設計](./input-output-design.md) を参照。

### 主要エンドポイント

| メソッド | エンドポイント                               | 説明                             |
| -------- | -------------------------------------------- | -------------------------------- |
| PUT      | `/api/payment-status/:cardSummaryId`         | ステータスを手動更新             |
| GET      | `/api/payment-status/:cardSummaryId`         | 現在のステータスを取得           |
| GET      | `/api/payment-status/:cardSummaryId/history` | ステータス変更履歴を取得         |
| GET      | `/api/payment-status`                        | ステータス一覧を取得（フィルタ） |

## セキュリティ考慮事項

- [x] 認証・認可の実装（将来対応）
- [x] 入力値のバリデーション
- [x] SQLインジェクション対策（TypeORM使用）
- [x] XSS対策
- [x] CSRF対策
- [ ] APIレート制限（将来対応）
- [x] **更新履歴の改ざん防止**
  - ステータス変更履歴は不変（immutable）として扱う
  - 履歴の削除・変更は不可
- [x] **権限ベースのアクセス制御**
  - 手動ステータス更新は認証済みユーザーのみ

## パフォーマンス考慮事項

- [x] ステータス更新: 50ms以内
- [x] 一括更新（100件）: 3秒以内
- [x] 履歴取得: 200ms以内
- [x] インデックス使用（cardSummaryId, updatedAt）
- [x] ページネーション実装（履歴取得時）
- [ ] キャッシング戦略（将来対応）

## エラーハンドリング

### エラー分類

1. **バリデーションエラー** (400 Bad Request)
   - 無効なステータス遷移
   - 必須項目の欠如
   - 入力値の形式エラー

2. **認証エラー** (401 Unauthorized)
   - トークン無効
   - トークン期限切れ

3. **認可エラー** (403 Forbidden)
   - 更新権限がない

4. **リソース未検出** (404 Not Found)
   - 請求データが見つからない
   - ステータス記録が見つからない

5. **競合エラー** (409 Conflict)
   - 同時更新の競合

6. **サーバーエラー** (500 Internal Server Error)
   - 予期しないエラー
   - データベース接続エラー

### エラーコード

| エラーコード | エラー内容               | HTTPステータス | 対処方法                     |
| ------------ | ------------------------ | -------------- | ---------------------------- |
| PS001        | 無効なステータス遷移     | 400            | 許可された遷移のみ実行       |
| PS002        | 請求データが見つからない | 404            | データを再取得               |
| PS003        | 更新権限がない           | 403            | 管理者に問い合わせ           |
| PS004        | 同時更新の競合           | 409            | 最新データを再取得して再試行 |

## テスト方針

### ユニットテスト

- **対象**: Domain Layer, Application Layer
- **ツール**: Jest
- **カバレッジ目標**: 80%以上
- **主要テストケース**:
  - ステータス遷移ルールの検証
  - 自動ステータス更新ロジック（PENDING → PROCESSING）
  - 照合成功時のステータス更新（PROCESSING → PAID）
  - 延滞検知ロジック（PROCESSING → OVERDUE）
  - 無効な遷移の拒否

### 統合テスト

- **対象**: API エンドポイント
- **ツール**: Supertest + Jest
- **テスト内容**: HTTPリクエスト/レスポンスの検証

### E2Eテスト

- **対象**: ユーザーシナリオ
- **ツール**: Playwright
- **テスト内容**: ステータス更新フローの検証（将来対応）

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
   - ステータス更新の開始・終了ログ
   - エラー発生時のスタックトレース
   - バッチ処理の実行ログ

5. **ステータス遷移の検証**
   - すべてのステータス変更で遷移ルールを検証
   - 無効な遷移は即座に拒否

6. **履歴の不変性**
   - ステータス変更履歴は削除・変更不可
   - 履歴は追記のみ（append-only）

7. **日付計算**
   - 引落予定日の計算は正確に
   - タイムゾーンを考慮
   - 営業日計算は銀行カレンダーに準拠（将来対応）

## 関連ドキュメント

- [機能要件書](../../functional-requirements/FR-012-015_credit-card-management.md#fr-014-支払いステータス管理)
- [FR-012: クレジットカード月別集計](../FR-012_credit-card-monthly-aggregation/README.md)
- [FR-013: 銀行引落額との自動照合](../FR-013_bank-withdrawal-reconciliation/README.md)
- [システムアーキテクチャ](../../system-architecture.md)

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
- [x] 状態遷移図が作成されている（複雑な状態管理）
- [x] 画面遷移図が作成されている（UI要件あり）

### オプション項目

- [x] バッチ処理詳細が作成されている（日次バッチ処理あり）
