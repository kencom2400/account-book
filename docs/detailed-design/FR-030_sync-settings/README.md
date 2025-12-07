# データ同期間隔設定機能 (FR-030) モジュール詳細設計書

**対象機能**:

- FR-030: データ同期間隔の設定

**作成日**: 2025-01-27
**最終更新日**: 2025-01-27
**バージョン**: 1.0

## 概要

このドキュメントは、データ同期間隔設定機能 (FR-030) に関するモジュールの詳細設計を文書化したものです。

**簡単な機能説明**: 各金融機関からデータを取得する頻度を設定する機能。ユーザーのニーズに応じて同期間隔をカスタマイズでき、全体設定と金融機関ごとの個別設定をサポートします。また、Wi-Fiのみ同期、バッテリー節約モード、夜間モードなどの詳細オプションも設定可能です。

## 目次

1. [クラス図](./class-diagrams.md) - **必須**
2. [シーケンス図](./sequence-diagrams.md) - **必須**
3. [入出力設計](./input-output-design.md) - **必須** (API仕様)
4. [画面遷移図](./screen-transitions.md) - フロントエンドの設定画面
5. [状態遷移図](./state-transitions.md) - 同期ステータスの管理

## アーキテクチャ概要

このシステムは **Onion Architecture** を採用しており、以下のレイヤ構成となっています。

### レイヤ構成

```
┌─────────────────────────────────────────┐
│     Presentation Layer                  │
│  - SyncSettingsController (REST API)    │
│  - DTOs (Request/Response)              │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Application Layer                   │
│  - GetSyncSettingsUseCase               │
│  - UpdateSyncSettingsUseCase            │
│  - GetInstitutionSyncSettingsUseCase    │
│  - UpdateInstitutionSyncSettingsUseCase │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Domain Layer                        │
│  - SyncSettings Entity                  │
│  - SyncInterval Value Object            │
│  - InstitutionSyncSettings Entity       │
│  - SyncSettings Repository Interface    │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Infrastructure Layer                │
│  - SyncSettingsRepositoryImpl           │
│  - ScheduledSyncJob（動的スケジュール更新）│
└─────────────────────────────────────────┘
```

### レイヤごとの責務

#### Presentation Layer（プレゼンテーション層）

- **責務**: HTTP リクエスト/レスポンスの処理、同期設定の取得・更新
- **主なコンポーネント**:
  - SyncSettingsController: 同期設定関連のREST APIエンドポイント
  - DTOs: リクエスト/レスポンスデータ転送オブジェクト

#### Application Layer（アプリケーション層）

- **責務**: 同期設定の取得・更新ロジック、バリデーション、スケジュール更新の調整
- **主なコンポーネント**:
  - GetSyncSettingsUseCase: 全体設定の取得
  - UpdateSyncSettingsUseCase: 全体設定の更新
  - GetInstitutionSyncSettingsUseCase: 特定金融機関の設定取得
  - GetAllInstitutionSyncSettingsUseCase: 全金融機関の設定取得
  - UpdateInstitutionSyncSettingsUseCase: 金融機関ごとの設定更新

#### Domain Layer（ドメイン層）

- **責務**: 同期設定のビジネスルール、同期間隔の計算、次回同期時刻の算出
- **主なコンポーネント**:
  - SyncSettings: 同期設定エンティティ
  - SyncInterval: 同期間隔の値オブジェクト
  - InstitutionSyncSettings: 金融機関ごとの同期設定エンティティ

#### Infrastructure Layer（インフラストラクチャ層）

- **責務**: 設定の永続化、スケジュールジョブの動的更新
- **主なコンポーネント**:
  - SyncSettingsRepository: 同期設定の永続化（JSON/DB）
  - ScheduledSyncJob: 動的スケジュール更新（NestJS SchedulerRegistry）

## 主要機能

### 1. 全体設定の取得・更新

**概要**: デフォルト同期間隔と詳細オプション（Wi-Fiのみ、バッテリー節約、夜間モード等）の設定

**実装箇所**:

- Controller: `SyncSettingsController.getSettings()`, `SyncSettingsController.updateSettings()`
- UseCase: `GetSyncSettingsUseCase`, `UpdateSyncSettingsUseCase`
- Entity: `SyncSettings`

### 2. 金融機関ごとの設定取得・更新

**概要**: 各金融機関の個別同期間隔設定の取得・更新

**実装箇所**:

- Controller: `SyncSettingsController.getInstitutionSettings()`, `SyncSettingsController.updateInstitutionSettings()`
- UseCase: `GetInstitutionSyncSettingsUseCase`, `GetAllInstitutionSyncSettingsUseCase`, `UpdateInstitutionSyncSettingsUseCase`
- Entity: `InstitutionSyncSettings`

### 3. 動的スケジュール更新

**概要**: 設定変更時にScheduledSyncJobのスケジュールを動的に更新

**実装箇所**:

- Infrastructure: `ScheduledSyncJob.updateSchedule()`
- Application: `UpdateSyncSettingsUseCase`（スケジュール更新を呼び出し）

### 4. 次回同期時刻の計算

**概要**: 同期間隔に基づいて次回同期予定時刻を計算

**実装箇所**:

- Domain: `SyncInterval.calculateNextSyncAt()`

## 技術スタック

### Backend

- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Architecture**: Onion Architecture
- **ORM**: TypeORM
- **Database**: MySQL (本番), JSON (開発)
- **Scheduler**: @nestjs/schedule (`SchedulerRegistry`)

### Frontend

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: React, Tailwind CSS
- **状態管理**: React Context または Zustand

## データモデル

### 主要エンティティ

#### SyncSettings

全体の同期設定を表すエンティティ

```typescript
interface SyncSettings {
  id: string; // UUID
  defaultInterval: SyncInterval; // デフォルト同期間隔
  wifiOnly: boolean; // Wi-Fi接続時のみ自動同期
  batterySavingMode: boolean; // バッテリー節約モード時は同期を控える
  autoRetry: boolean; // エラー時は自動リトライ
  maxRetryCount: number; // 最大リトライ回数（デフォルト: 3）
  nightModeSuspend: boolean; // 夜間モード有効化
  nightModeStart: string; // 夜間モード開始時刻（HH:mm形式）
  nightModeEnd: string; // 夜間モード終了時刻（HH:mm形式）
  createdAt: Date;
  updatedAt: Date;
}
```

#### SyncInterval

同期間隔を表す値オブジェクト

```typescript
interface SyncInterval {
  type: 'realtime' | 'frequent' | 'standard' | 'infrequent' | 'manual' | 'custom';
  value?: number; // カスタムの場合の値
  unit?: 'minutes' | 'hours' | 'days'; // カスタムの場合の単位
  customSchedule?: string; // Cron式（高度なスケジュール）
}
```

#### InstitutionSyncSettings

金融機関ごとの同期設定を表すエンティティ

```typescript
interface InstitutionSyncSettings {
  id: string; // UUID
  institutionId: string; // 金融機関ID
  interval: SyncInterval; // 同期間隔
  enabled: boolean; // 有効/無効
  lastSyncedAt?: Date; // 最終同期日時
  nextSyncAt?: Date; // 次回同期予定日時
  syncStatus: 'idle' | 'syncing' | 'error'; // 同期ステータス
  errorCount: number; // エラー回数
  lastError?: string; // 最後のエラーメッセージ
  createdAt: Date;
  updatedAt: Date;
}
```

## API仕様概要

詳細は [入出力設計](./input-output-design.md) を参照。

### 主要エンドポイント

| メソッド | エンドポイント                        | 説明                                 |
| -------- | ------------------------------------- | ------------------------------------ |
| GET      | `/api/sync-settings`                  | 全体設定を取得                       |
| PATCH    | `/api/sync-settings`                  | 全体設定を更新（部分更新）           |
| GET      | `/api/sync-settings/institutions`     | 全金融機関の設定を取得               |
| GET      | `/api/sync-settings/institutions/:id` | 特定金融機関の設定を取得             |
| PATCH    | `/api/sync-settings/institutions/:id` | 特定金融機関の設定を更新（部分更新） |

## セキュリティ考慮事項

- [x] 認証・認可の実装（JWTトークン）
- [x] 入力値のバリデーション
- [x] 設定変更の監査ログ（将来実装）

## パフォーマンス考慮事項

- [x] 設定のキャッシング（メモリ上）
- [x] スケジュール更新の効率化（必要な場合のみ更新）
- [ ] 大量の金融機関設定のページネーション（将来実装）

## エラーハンドリング

### エラー分類

1. **バリデーションエラー** (400 Bad Request)
   - 同期間隔の範囲外（5分〜30日）
   - 夜間モード時刻の形式エラー
   - 夜間モード開始時刻 === 終了時刻（不正な設定）

2. **認証エラー** (401 Unauthorized)
   - トークン無効
   - トークン期限切れ

3. **リソース未検出** (404 Not Found)
   - 指定された金融機関IDが存在しない

4. **サーバーエラー** (500 Internal Server Error)
   - 設定保存失敗
   - スケジュール更新失敗

## テスト方針

### ユニットテスト

- **対象**: Domain Layer, Application Layer
- **ツール**: Jest
- **カバレッジ目標**: 80%以上
- **重点テスト項目**:
  - 同期間隔の計算ロジック
  - 次回同期時刻の計算
  - バリデーションロジック

### 統合テスト

- **対象**: API エンドポイント
- **ツール**: Supertest + Jest
- **テスト内容**:
  - 設定取得API
  - 設定更新API
  - バリデーションエラー

### E2Eテスト

- **対象**: 設定画面の操作フロー
- **ツール**: Playwright
- **テスト内容**:
  - 設定画面の表示
  - 設定の変更と保存
  - エラー時の挙動

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

4. **スケジュール更新の最適化**
   - 設定変更時のみスケジュールを更新
   - 変更がない場合は更新をスキップ

5. **設定のデフォルト値**
   - 初回設定時は標準（6時間ごと）をデフォルトとする
   - 詳細オプションはすべてfalseをデフォルトとする

## 関連ドキュメント

- [機能要件書](../../functional-requirements/FR-028-031_settings.md#fr-030-データ同期間隔の設定)
- [システムアーキテクチャ](../../system-architecture.md)
- [FR-006: 利用履歴自動取得](../FR-006_auto-fetch-transactions/README.md)

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

- [x] 画面遷移図が作成されている（フロントエンドの設定画面）
- [x] 状態遷移図が作成されている（同期ステータス管理）
