# 利用履歴自動取得機能 (FR-006) モジュール詳細設計書

**対象機能**:

- FR-006: 各金融機関から利用履歴を自動取得

**作成日**: 2025-11-23
**最終更新日**: 2025-11-23
**バージョン**: 1.0

## 概要

このドキュメントは、利用履歴自動取得機能 (FR-006) に関するモジュールの詳細設計を文書化したものです。

**簡単な機能説明**: 連携済みの金融機関から定期的に取引履歴を自動取得し、重複チェックを行い、カテゴリの自動分類を実行してローカルに保存する機能です。手動実行と自動実行（定期スケジュール）の両方をサポートします。

## 目次

1. [クラス図](./class-diagrams.md) - **必須**
2. [シーケンス図](./sequence-diagrams.md) - **必須**
3. [入出力設計](./input-output-design.md) - **必須** (API仕様)
4. [バッチ処理詳細](./batch-processing.md) - バッチ処理（定期実行ジョブ）

## アーキテクチャ概要

このシステムは **Onion Architecture** を採用しており、以下のレイヤ構成となっています。

### レイヤ構成

```
┌─────────────────────────────────────────┐
│     Presentation Layer                  │
│  - SyncController (REST API)            │
│  - DTOs (Request/Response)              │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Application Layer                   │
│  - SyncAllTransactionsUseCase           │
│  - GetSyncHistoryUseCase                │
│  - CancelSyncUseCase                    │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Domain Layer                        │
│  - SyncHistory Entity                   │
│  - SyncStatus Enum                      │
│  - IncrementalSyncStrategy              │
│  - SyncHistory Repository Interface     │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Infrastructure Layer                │
│  - ScheduledSyncJob（定期実行）         │
│  - SyncOrchestrator（同期調整）         │
│  - SyncHistoryRepositoryImpl            │
│  - BankApiClient, CardApiClient等       │
└─────────────────────────────────────────┘
```

### レイヤごとの責務

#### Presentation Layer（プレゼンテーション層）

- **責務**: HTTP リクエスト/レスポンスの処理、同期の開始・状態確認・キャンセル
- **主なコンポーネント**:
  - SyncController: 同期関連のREST APIエンドポイント
  - DTOs: リクエスト/レスポンスデータ転送オブジェクト

#### Application Layer（アプリケーション層）

- **責務**: 同期処理のオーケストレーション、ビジネスロジックの調整
- **主なコンポーネント**:
  - SyncAllTransactionsUseCase: 全金融機関の取引履歴同期
  - GetSyncHistoryUseCase: 同期履歴の取得
  - CancelSyncUseCase: 実行中の同期キャンセル

#### Domain Layer（ドメイン層）

- **責務**: 同期ステータス管理、同期戦略の定義
- **主なコンポーネント**:
  - SyncHistory: 同期履歴エンティティ
  - SyncStatus: 同期ステータス（pending, running, completed, failed, cancelled）
  - IncrementalSyncStrategy: 差分同期戦略（重複チェック）

#### Infrastructure Layer（インフラストラクチャ層）

- **責務**: 定期実行ジョブ、外部API連携、データ永続化
- **主なコンポーネント**:
  - ScheduledSyncJob: 定期実行ジョブ（cron）
  - SyncOrchestrator: 同期オーケストレーター（並行実行制御）
  - SyncHistoryRepository: 同期履歴の永続化
  - BankApiClient: 銀行API接続

## 主要機能

### 1. 自動同期（定期実行）

**概要**: 設定された時刻（デフォルト: 毎日午前4時）に自動的に全金融機関の取引履歴を取得

**実装箇所**:

- Infrastructure: `ScheduledSyncJob`
- Application: `SyncAllTransactionsUseCase`
- Domain: `SyncHistory`, `IncrementalSyncStrategy`

### 2. 手動同期

**概要**: ユーザーが「今すぐ同期」ボタンを押して、任意のタイミングで同期を実行

**実装箇所**:

- Controller: `SyncController.startManualSync()`
- UseCase: `SyncAllTransactionsUseCase`

### 3. 同期履歴取得

**概要**: 過去の同期履歴を取得し、成功・失敗状況を確認

**実装箇所**:

- Controller: `SyncController.getSyncHistory()`
- UseCase: `GetSyncHistoryUseCase`

### 4. 同期キャンセル

**概要**: 実行中の同期処理をキャンセル

**実装箇所**:

- Controller: `SyncController.cancelSync()`
- UseCase: `CancelSyncUseCase`

### 5. 差分同期（重複チェック）

**概要**: 前回取得日以降の新しいデータのみを取得し、重複データはスキップ

**実装箇所**:

- Domain: `IncrementalSyncStrategy`
- Application: `SyncAllTransactionsUseCase`

## 技術スタック

### Backend

- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Architecture**: Onion Architecture
- **ORM**: TypeORM
- **Database**: MySQL (本番), JSON (開発)
- **Scheduler**: @nestjs/schedule (`@Cron`)
- **Retry**: axios-retry または カスタム実装
- **並行実行**: Promise.allSettled

### Frontend

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: React, Tailwind CSS
- **リアルタイム更新**: WebSocket または Server-Sent Events（将来実装）

## データモデル

### 主要エンティティ

#### SyncHistory

同期履歴を記録するエンティティ

```typescript
interface SyncHistory {
  id: string; // UUID
  institutionId: string; // 金融機関ID
  institutionName: string; // 金融機関名
  institutionType: 'bank' | 'credit-card' | 'securities';
  status: SyncStatus; // 同期ステータス
  startedAt: Date; // 開始日時
  completedAt?: Date; // 完了日時
  totalFetched: number; // 取得件数
  newRecords: number; // 新規データ件数
  duplicateRecords: number; // 重複データ件数
  errorMessage?: string; // エラーメッセージ（失敗時）
  retryCount: number; // リトライ回数
  createdAt: Date; // 作成日時
  updatedAt: Date; // 更新日時
}
```

#### SyncStatus（Enum）

```typescript
export enum SyncStatus {
  PENDING = 'pending', // 実行待ち
  RUNNING = 'running', // 実行中
  COMPLETED = 'completed', // 完了
  FAILED = 'failed', // 失敗
  CANCELLED = 'cancelled', // キャンセル
}
```

## API仕様概要

詳細は [入出力設計](./input-output-design.md) を参照。

### 主要エンドポイント

| メソッド | エンドポイント         | 説明                       |
| -------- | ---------------------- | -------------------------- |
| POST     | `/api/sync/start`      | 手動同期を開始             |
| GET      | `/api/sync/status`     | 同期ステータスを取得       |
| GET      | `/api/sync/history`    | 同期履歴を取得             |
| PUT      | `/api/sync/cancel/:id` | 実行中の同期をキャンセル   |
| GET      | `/api/sync/schedule`   | 同期スケジュール設定を取得 |
| PUT      | `/api/sync/schedule`   | 同期スケジュール設定を更新 |

## セキュリティ考慮事項

- [x] 認証・認可の実装（JWTトークン）
- [x] 入力値のバリデーション
- [x] APIレート制限（1分間60リクエスト）
- [x] 金融機関APIの認証情報暗号化
- [ ] 同期処理の排他制御（同時実行防止）

## パフォーマンス考慮事項

- [x] 並行実行制御（最大5金融機関を同時処理）
- [x] バックグラウンド処理（UIブロックなし）
- [x] 差分同期（重複チェック）による効率化
- [x] リトライ機構（最大3回）
- [ ] データベースクエリの最適化
- [ ] インデックスの適用
- [ ] キャッシング戦略（同期履歴）

## エラーハンドリング

### エラー分類

1. **バリデーションエラー** (400 Bad Request)
   - 入力値の形式エラー
   - 必須項目の欠如

2. **認証エラー** (401 Unauthorized)
   - トークン無効
   - トークン期限切れ

3. **API接続エラー** (502 Bad Gateway)
   - 金融機関APIへの接続失敗
   - タイムアウト

4. **同期エラー** (500 Internal Server Error)
   - データ保存失敗
   - 予期しないエラー

5. **同時実行エラー** (409 Conflict)
   - 既に同期が実行中

## テスト方針

### ユニットテスト

- **対象**: Domain Layer, Application Layer
- **ツール**: Jest
- **カバレッジ目標**: 90%以上（Domain層）、85%以上（Application層）
- **重点テスト項目**:
  - 重複チェックロジック
  - リトライ機構
  - エラーハンドリング

### 統合テスト

- **対象**: API エンドポイント
- **ツール**: Supertest + Jest
- **テスト内容**:
  - 同期開始API
  - 同期履歴取得API
  - 同期キャンセルAPI

### E2Eテスト

- **対象**: 同期フロー
- **ツール**: Playwright (Backend E2E)
- **テスト内容**:
  - 手動同期の実行
  - 同期履歴の確認
  - エラー時の挙動

### パフォーマンステスト

- **対象**: 大量データの同期
- **テスト内容**: 1000件/10秒以内の処理速度

## 実装上の注意事項

1. **型安全性の遵守**
   - `any`型の使用禁止
   - すべての関数に適切な型定義

2. **依存性の方向**
   - 外側のレイヤから内側のレイヤへのみ依存
   - ドメイン層は他のレイヤに依存しない

3. **エラーハンドリング**
   - すべての非同期処理にエラーハンドリング
   - カスタム例外クラスの使用

4. **ロギング**
   - 同期開始・終了のログ出力
   - エラー詳細のログ記録
   - 機密情報（APIキー）のログ出力禁止

5. **並行実行制御**
   - Promise.allSettled を使用
   - 1つの金融機関の失敗が他に影響しないよう保証

6. **トランザクション管理**
   - 同期履歴とトランザクションデータの保存は同一トランザクション内で実行

## 関連ドキュメント

- [機能要件書](../../functional-requirements/FR-001-007_data-acquisition.md)
- [システムアーキテクチャ](../../system-architecture.md)
- [FR-001: 銀行口座との連携](../../functional-requirements/FR-001-007_data-acquisition.md#fr-001-銀行口座との連携)
- [FR-002: クレジットカードとの連携](../../functional-requirements/FR-001-007_data-acquisition.md#fr-002-クレジットカードとの連携)
- [FR-003: 証券会社との連携](../../functional-requirements/FR-001-007_data-acquisition.md#fr-003-証券会社との連携)
- [FR-007: データローカル保存](../../functional-requirements/FR-001-007_data-acquisition.md#fr-007-データローカル保存)

## 変更履歴

| バージョン | 日付       | 変更内容 | 作成者       |
| ---------- | ---------- | -------- | ------------ |
| 1.0        | 2025-11-23 | 初版作成 | AI Assistant |

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

- [x] バッチ処理詳細が作成されている（定期実行ジョブ）
- [ ] 画面遷移図が作成されている（フロントエンド実装時）
- [ ] 状態遷移図が作成されている（複雑な状態管理がある場合）
