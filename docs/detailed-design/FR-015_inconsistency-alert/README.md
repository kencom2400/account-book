# 不一致時のアラート表示 (FR-015) モジュール詳細設計書

**対象機能**:

- FR-015: 不一致時のアラート表示機能

**作成日**: 2025-01-27
**最終更新日**: 2025-01-27
**バージョン**: 1.0

## 概要

このドキュメントは、クレジットカード請求額と銀行引落額の照合結果が不一致の場合に、ユーザーに分かりやすくアラートを表示する機能 (FR-015) に関するモジュールの詳細設計を文書化したものです。

**簡単な機能説明**: クレジットカードの月別集計額と銀行引落額の照合処理（FR-013）で不一致が検出された場合、アラートを生成してユーザーに通知します。アラートレベル（INFO/WARNING/ERROR/CRITICAL）に応じて、ポップアップ表示、バッジ表示、プッシュ通知、メール通知などの方法でユーザーに通知します。ユーザーはアラートを確認し、手動で照合、解決済みにする、無視するなどのアクションを実行できます。

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
│  - AlertController (REST API)           │
│  - AlertResponseDto                      │
│  - AlertListResponseDto                  │
│  - AlertActionRequestDto                 │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Application Layer                   │
│  - CreateAlertUseCase                   │
│  - GetAlertsUseCase                     │
│  - ResolveAlertUseCase                  │
│  - AlertService                         │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Domain Layer                        │
│  - Alert                                 │
│  - AlertLevel (Enum)                     │
│  - AlertType (Enum)                      │
│  - AlertStatus (Enum)                    │
│  - AlertRepository (Interface)          │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Infrastructure Layer                │
│  - JsonAlertRepository                  │
│  - ReconciliationRepository (既存)      │
└─────────────────────────────────────────┘
```

### レイヤごとの責務

#### Presentation Layer（プレゼンテーション層）

- **責務**: HTTP リクエスト/レスポンスの処理
- **主なコンポーネント**:
  - `AlertController`: アラート取得・操作APIエンドポイント
  - `AlertResponseDto`: アラートレスポンスDTO（interface）
  - `AlertListResponseDto`: アラート一覧レスポンスDTO（interface）
  - `AlertActionRequestDto`: アラートアクションリクエストDTO（class）

#### Application Layer（アプリケーション層）

- **責務**: アラート生成・管理ロジックの調整、ユースケースの実装
- **主なコンポーネント**:
  - `CreateAlertUseCase`: アラート生成ユースケース
  - `GetAlertsUseCase`: アラート一覧取得ユースケース
  - `ResolveAlertUseCase`: アラート解決ユースケース
  - `AlertService`: アラート判定・生成サービス

#### Domain Layer（ドメイン層）

- **責務**: アラートのビジネスルール
- **主なコンポーネント**:
  - `Alert`: アラートエンティティ
  - `AlertLevel`: アラートレベルEnum（INFO/WARNING/ERROR/CRITICAL）
  - `AlertType`: アラート種別Enum（AMOUNT_MISMATCH/PAYMENT_NOT_FOUND/OVERDUE/MULTIPLE_CANDIDATES）
  - `AlertStatus`: アラートステータスEnum（UNREAD/READ/RESOLVED）
  - `AlertRepository`: アラートデータリポジトリインターフェース

#### Infrastructure Layer（インフラストラクチャ層）

- **責務**: アラートデータの永続化、照合データの取得
- **主なコンポーネント**:
  - `JsonAlertRepository`: アラートデータのJSON永続化実装
  - `ReconciliationRepository`: 照合データ取得（既存）

## 主要機能

### アラート生成

**概要**: 照合処理（FR-013）の結果に基づいて、不一致が検出された場合にアラートを生成します。

**実装箇所**:

- Use Case: `CreateAlertUseCase`
- Service: `AlertService`
- Entity: `Alert`

**アラート生成条件**:

1. **金額不一致アラート** (WARNING)
   - 条件: カード請求額 ≠ 銀行引落額
   - レベル: WARNING
   - 情報: 請求額、引落額、差額、考えられる原因

2. **引落未検出アラート** (ERROR)
   - 条件: 引落予定日+3日経過しても引落取引が見つからない
   - レベル: ERROR
   - 情報: 請求額、予定引落日、経過日数

3. **延滞アラート** (CRITICAL)
   - 条件: 引落予定日+7日経過しても未払い
   - レベル: CRITICAL
   - 情報: 未払い金額、延滞日数、対処方法

4. **複数候補アラート** (INFO)
   - 条件: 照合候補取引が複数存在
   - レベル: INFO
   - 情報: 候補取引のリスト、手動選択の促し

**アラート生成タイミング**:

- **照合処理完了時**: 照合結果が不一致（UNMATCHED）の場合
- **日次バッチ処理**: 引落未検出・延滞のチェック（将来対応）
- **手動実行**: ユーザーがアラート生成を要求（将来対応）

### アラート表示

**概要**: 生成されたアラートをユーザーに表示します。アラートレベルに応じて、表示方法を変更します。

**実装箇所**:

- Frontend: `AlertListPage`, `AlertDetailPage`, `AlertBadge`
- Frontend: `AlertToast`, `AlertModal`（既存のErrorToast/ErrorModalを拡張）

**表示方法**:

- **CRITICALアラート**: 即座にモーダル表示
- **ERROR/WARNINGアラート**: バッジ表示 + ポップアップ表示
- **INFOアラート**: 一覧でのみ表示

### アラート解決

**概要**: ユーザーがアラートを確認し、解決済みにする機能です。

**実装箇所**:

- Use Case: `ResolveAlertUseCase`
- Controller: `AlertController`

**解決アクション**:

- **解決済みにする**: アラートを解決済み（RESOLVED）に変更
- **無視する**: アラートを既読（READ）に変更（解決済みにはしない）
- **手動で照合**: 手動照合画面に遷移（将来対応）

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
- **状態管理**: Zustand（既存のNotificationStoreを拡張）

## データモデル

### 主要エンティティ

#### Alert

```typescript
export interface Alert {
  id: string;
  type: AlertType;
  level: AlertLevel;
  title: string;
  message: string;
  details: AlertDetails;
  status: AlertStatus; // UNREAD/READ/RESOLVED（isRead/isResolvedはstatusから導出可能）
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNote?: string;
  actions: AlertAction[];
}
```

#### AlertDetails

```typescript
export interface AlertDetails {
  cardId: string;
  cardName: string;
  billingMonth: string; // YYYY-MM
  expectedAmount: number;
  actualAmount?: number;
  discrepancy?: number;
  paymentDate?: Date;
  daysElapsed?: number;
  relatedTransactions: string[];
  reconciliationId?: string;
}
```

#### AlertAction

```typescript
export interface AlertAction {
  id: string;
  label: string;
  action: ActionType;
  isPrimary: boolean;
}
```

#### AlertLevel

```typescript
export enum AlertLevel {
  INFO = 'info', // 情報（軽微な差異）
  WARNING = 'warning', // 警告（要確認）
  ERROR = 'error', // エラー（重大な不一致）
  CRITICAL = 'critical', // 緊急（延滞等）
}
```

#### AlertType

```typescript
export enum AlertType {
  AMOUNT_MISMATCH = 'amount_mismatch', // 金額不一致
  PAYMENT_NOT_FOUND = 'payment_not_found', // 引落未検出
  OVERDUE = 'overdue', // 延滞
  MULTIPLE_CANDIDATES = 'multiple_candidates', // 複数候補
}
```

#### AlertStatus

```typescript
export enum AlertStatus {
  UNREAD = 'unread', // 未読
  READ = 'read', // 既読
  RESOLVED = 'resolved', // 解決済み
}
```

#### ActionType

```typescript
export enum ActionType {
  VIEW_DETAILS = 'view_details', // 詳細を確認
  MANUAL_MATCH = 'manual_match', // 手動で照合
  MARK_RESOLVED = 'mark_resolved', // 解決済みにする
  CONTACT_BANK = 'contact_bank', // カード会社に問い合わせ
  IGNORE = 'ignore', // 無視する
}
```

## API仕様概要

詳細は [入出力設計](./input-output-design.md) を参照。

### 主要エンドポイント

| メソッド | エンドポイント            | 説明                     |
| -------- | ------------------------- | ------------------------ |
| GET      | `/api/alerts`             | アラート一覧を取得       |
| GET      | `/api/alerts/:id`         | アラート詳細を取得       |
| POST     | `/api/alerts`             | アラートを生成（内部用） |
| PATCH    | `/api/alerts/:id/resolve` | アラートを解決済みにする |
| PATCH    | `/api/alerts/:id/read`    | アラートを既読にする     |
| DELETE   | `/api/alerts/:id`         | アラートを削除           |

**補足**:

- 一覧取得時の絞り込みはクエリパラメータで行う（例: `?level=warning&status=unread`）
- RESTfulな設計原則に基づき、リソース名を複数形（`alerts`）で統一

## セキュリティ考慮事項

- [x] 認証・認可の実装（将来対応）
- [x] 入力値のバリデーション
- [x] SQLインジェクション対策（TypeORM使用）
- [x] XSS対策
- [x] CSRF対策
- [ ] APIレート制限（将来対応）
- [x] **アラート履歴の暗号化保存（初期実装で対応）**
  - 環境変数に保存した鍵で暗号化
  - AES-256-GCMアルゴリズムを使用
  - JSONファイル保存時も暗号化済みデータを保存
- [x] **個人情報のマスキング**
  - ログ出力時にカード番号、口座番号をマスキング

## パフォーマンス考慮事項

- [x] データベースクエリの最適化（インデックス使用）
- [x] アラート一覧のページネーション実装
- [x] 未読アラートカウントのキャッシング
- [x] **アラート生成: 100ms以内**
- [x] **アラート一覧取得: 300ms以内**
- [x] **ポップアップ表示: 即座**

## エラーハンドリング

### エラー分類

1. **バリデーションエラー** (400 Bad Request)
   - 入力値の形式エラー（例: UUID形式でない、YYYY-MM形式でない）
   - 必須項目の欠如

2. **リソース未検出** (404 Not Found)
   - アラートIDが存在しない
   - 照合結果が存在しない（AL001）

3. **ビジネスロジックエラー** (422 Unprocessable Entity)
   - 既に解決済みのアラートを再度解決しようとした場合
   - 無効なアクションタイプ

4. **サーバーエラー**
   - **500 Internal Server Error**: データベース接続エラーなど自サーバー内部の問題

### エラーコード

| エラーコード | エラー内容                 | HTTPステータス | 対処方法               |
| ------------ | -------------------------- | -------------- | ---------------------- |
| AL001        | アラートが見つからない     | 404            | アラートIDを確認       |
| AL002        | 重複アラート生成エラー     | 422            | 既存のアラートを確認   |
| AL003        | 既に解決済みのアラート     | 422            | アラート状態を確認     |
| AL004        | CRITICALアラートは削除不可 | 422            | アーカイブのみ可能     |
| AL005        | アラート生成失敗           | 500            | ログ記録して再試行     |
| AL006        | 通知送信失敗               | 500            | バックグラウンドで再送 |
| AL007        | アラート解決失敗           | 500            | データを再読み込み     |

## テスト方針

### ユニットテスト

- **対象**: Domain Layer, Application Layer
- **ツール**: Jest
- **カバレッジ目標**: 80%以上
- **主要テストケース**:
  - 金額不一致アラート生成（TC-015-001）
  - 引落未検出アラート（TC-015-002）
  - 延滞アラート（TC-015-003）
  - アラート解決（TC-015-004）
  - 重複アラート防止（TC-015-005）

### 統合テスト

- **対象**: API エンドポイント
- **ツール**: Supertest + Jest
- **テスト内容**: HTTPリクエスト/レスポンスの検証

### E2Eテスト

- **対象**: ユーザーシナリオ
- **ツール**: Playwright
- **テスト内容**: アラート表示・解決フローの検証（将来対応）

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
   - アラート生成の開始・終了ログ
   - エラー発生時のスタックトレース
   - 個人情報のマスキング

5. **重複アラート防止**
   - 同じ照合結果に対するアラートは1件のみ生成
   - 既存のアラートが未解決の場合は新規生成しない

6. **アラートの保持期間**
   - 解決後90日間保持
   - 重要度の高いアラート（CRITICAL）は削除不可（アーカイブのみ）

## 関連ドキュメント

- [機能要件書](../../functional-requirements/FR-012-015_credit-card-management.md)
- [システムアーキテクチャ](../../system-architecture.md)
- [FR-013詳細設計書](../FR-013_bank-withdrawal-reconciliation/README.md)

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

- [ ] 画面遷移図が作成されている（画面は将来対応）
- [ ] 状態遷移図が作成されている（AlertStatusの遷移は将来対応）
- [ ] バッチ処理詳細が作成されている（バッチ処理は将来対応）
