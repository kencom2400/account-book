# イベントメモ機能 (FR-021) モジュール詳細設計書

**対象機能**: FR-021: イベントメモ機能

**作成日**: 2025-01-27
**最終更新日**: 2025-01-27
**バージョン**: 1.0

## 概要

このドキュメントは、イベントメモ機能 (FR-021) に関するモジュールの詳細設計を文書化したものです。

**簡単な機能説明**: 特定の日付やイベント（就学、高額購入、旅行等）にメモを追加し、収支と関連付けて記録する機能。カレンダー上にイベントマーカーを表示し、イベントと取引を紐付けることで、イベントごとの収支を分析できるようにする。

## 目次

1. [画面遷移図](./screen-transitions.md) - UIの画面遷移とユーザーフロー
2. [クラス図](./class-diagrams.md) - **必須**
3. [シーケンス図](./sequence-diagrams.md) - **必須**
4. [入出力設計](./input-output-design.md) - **必須** (API仕様)

## アーキテクチャ概要

このシステムは **Onion Architecture** を採用しており、以下のレイヤ構成となっています。

### レイヤ構成

```
┌─────────────────────────────────────────┐
│     Presentation Layer                  │
│  - EventController                      │
│  - CreateEventDto                       │
│  - UpdateEventDto                       │
│  - EventResponseDto                     │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Application Layer                   │
│  - CreateEventUseCase                    │
│  - UpdateEventUseCase                    │
│  - DeleteEventUseCase                    │
│  - GetEventByIdUseCase                   │
│  - GetEventsByDateRangeUseCase           │
│  - LinkTransactionToEventUseCase         │
│  - IEventRepository (依存)              │
│  - ITransactionRepository (依存)        │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Domain Layer                        │
│  - EventEntity                          │
│  - EventCategory (Value Object)         │
│  - EventDate (Value Object)             │
│  - IEventRepository                     │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Infrastructure Layer                │
│  - EventOrmRepository                   │
│  - EventOrmEntity                       │
│  - EventTransactionRelationOrmEntity    │
│  - EventJsonRepository (Fallback)       │
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
  - Domain Services: ドメインサービス
  - Repository Interfaces: リポジトリのインターフェース

#### Infrastructure Layer（インフラストラクチャ層）

- **責務**: 外部システムとのやりとり、永続化
- **主なコンポーネント**:
  - Repository Implementations: リポジトリの実装
  - External API Clients: 外部APIクライアント
  - Database Access: データベースアクセス

## 主要機能

### 1. イベントの作成（Create）

**概要**: ユーザーが新しいイベントを追加する

**実装箇所**:

- Controller: `EventController.create()`
- Use Case: `CreateEventUseCase`
- Entity: `EventEntity`

**バリデーション**:

- タイトル: 必須、1-100文字
- 日付: 必須、妥当な日付
- カテゴリ: 必須、定義済みの値
- 説明: 任意、最大1000文字

### 2. イベントの更新（Update）

**概要**: 既存イベントの情報を変更する

**実装箇所**:

- Controller: `EventController.update()`
- Use Case: `UpdateEventUseCase`
- Entity: `EventEntity`

**バリデーション**:

- タイトル: 1-100文字
- 日付: 妥当な日付
- 説明: 最大1000文字

### 3. イベントの削除（Delete）

**概要**: イベントを削除し、関連付けも解除する

**実装箇所**:

- Controller: `EventController.delete()`
- Use Case: `DeleteEventUseCase`
- Entity: `EventEntity`

**処理**:

- イベントを削除
- 関連する取引との紐付けを解除（CASCADE削除）

### 4. イベントの取得（Read）

**概要**: イベントの詳細情報を取得する

**実装箇所**:

- Controller: `EventController.findById()`
- Use Case: `GetEventByIdUseCase`
- Entity: `EventEntity`

**機能**:

- イベントの基本情報
- 関連する取引の一覧

### 5. 日付範囲でのイベント取得

**概要**: 指定した日付範囲のイベント一覧を取得する

**実装箇所**:

- Controller: `EventController.findByDateRange()`
- Use Case: `GetEventsByDateRangeUseCase`
- Entity: `EventEntity`

**用途**:

- カレンダー表示
- 月次・年次レポート

### 6. 取引との紐付け

**概要**: イベントと取引を関連付ける

**実装箇所**:

- Controller: `EventController.linkTransaction()`
- Use Case: `LinkTransactionToEventUseCase`

**処理**:

- 取引IDとイベントIDを関連付け
- 中間テーブル（event_transaction_relations）に保存

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
- **Calendar**: react-calendar または date-fns

## データモデル

### 主要エンティティ

#### EventEntity (Domain)

```typescript
interface EventEntity {
  id: string; // UUID
  date: Date; // イベント日付
  title: string; // タイトル（1-100文字）
  description: string | null; // 説明（最大1000文字）
  category: EventCategory; // イベントカテゴリ
  tags: string[]; // タグ（配列）
  createdAt: Date;
  updatedAt: Date;
}

// 注意: relatedTransactionIdsはDomain層には含めない
// これはInfrastructure層のEventOrmEntityの関心事であり、
// 関連取引の取得はEventTransactionRelationOrmEntity経由で行う

// 注意: attachmentsは将来対応のため、現時点では定義しない
// 実装時にEventEntityとEventOrmEntityの両方に追加する

enum EventCategory {
  EDUCATION = 'education', // 就学関連
  PURCHASE = 'purchase', // 高額購入
  TRAVEL = 'travel', // 旅行
  MEDICAL = 'medical', // 医療
  LIFE_EVENT = 'life_event', // ライフイベント
  INVESTMENT = 'investment', // 投資
  OTHER = 'other', // その他
}

interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}
```

#### EventOrmEntity (Infrastructure)

```typescript
@Entity('events')
export class EventOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ type: 'varchar', length: 100 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 50 })
  category!: string; // EventCategoryの文字列値

  @Column({ type: 'json', nullable: true })
  tags!: string[] | null; // JSON配列として保存

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => EventTransactionRelationOrmEntity, (relation) => relation.event)
  transactionRelations!: EventTransactionRelationOrmEntity[];

  // 注意: attachmentsは将来対応のため、現時点では定義しない
  // 実装時に以下のように追加する:
  // @Column({ type: 'json', nullable: true })
  // attachments!: Attachment[] | null;
}
```

#### EventTransactionRelationOrmEntity (Infrastructure)

```typescript
@Entity('event_transaction_relations')
export class EventTransactionRelationOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36, name: 'event_id' })
  eventId!: string;

  @PrimaryColumn({ type: 'varchar', length: 36, name: 'transaction_id' })
  transactionId!: string;

  @ManyToOne(() => EventOrmEntity, (event) => event.transactionRelations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event!: EventOrmEntity;

  @ManyToOne(() => TransactionOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transaction_id' })
  transaction!: TransactionOrmEntity;
}
```

## API仕様概要

詳細は [入出力設計](./input-output-design.md) を参照。

### 主要エンドポイント

| メソッド | エンドポイント                                | 説明                   |
| -------- | --------------------------------------------- | ---------------------- |
| GET      | `/api/events`                                 | イベント一覧取得       |
| GET      | `/api/events/:id`                             | イベント詳細取得       |
| GET      | `/api/events/date-range`                      | 日付範囲でイベント取得 |
| POST     | `/api/events`                                 | イベント作成           |
| PUT      | `/api/events/:id`                             | イベント更新           |
| DELETE   | `/api/events/:id`                             | イベント削除           |
| POST     | `/api/events/:id/transactions`                | 取引との紐付け         |
| DELETE   | `/api/events/:id/transactions/:transactionId` | 取引との紐付け解除     |

## セキュリティ考慮事項

- [ ] 認証・認可の実装（将来対応）
- [x] 入力値のバリデーション（DTO、class-validator）
- [x] SQLインジェクション対策（TypeORM使用）
- [x] XSS対策（フロントエンドでのエスケープ処理）
- [ ] 添付ファイルのアップロード制限（将来対応）
- [ ] ファイルサイズ制限（将来対応）

## パフォーマンス考慮事項

- [x] データベースインデックスの活用（date, category）
- [x] 日付範囲クエリの最適化
- [ ] イベント一覧のキャッシング（将来対応）
- [x] ページネーション実装（大量データ対応、将来実装）

### パフォーマンス要件

- **イベント作成**: 100ms以内
- **イベント一覧取得**: 500ms以内（100件まで）
- **日付範囲取得**: 1秒以内（1年分）

## エラーハンドリング

### エラー分類

1. **バリデーションエラー** (400 Bad Request)
   - タイトルが空
   - タイトルが100文字超
   - 無効な日付
   - 無効なカテゴリ

2. **リソース未検出** (404 Not Found)
   - 指定されたイベントが存在しない
   - 指定された取引が存在しない

3. **サーバーエラー** (500 Internal Server Error)
   - データベース接続エラー
   - 予期しないエラー

### エラーメッセージ

| エラー           | HTTPコード | メッセージ                                |
| ---------------- | ---------- | ----------------------------------------- |
| タイトルが空     | 400        | `タイトルは必須です`                      |
| タイトルが長すぎ | 400        | `タイトルは100文字以内で入力してください` |
| 無効な日付       | 400        | `有効な日付を入力してください`            |
| イベント不存在   | 404        | `指定されたイベントが見つかりません`      |

## テスト方針

### ユニットテスト

- **対象**: Domain Layer, Application Layer
- **ツール**: Jest
- **カバレッジ目標**: 80%以上

**テストケース例**:

- イベント作成の正常系・異常系
- バリデーションロジック
- 日付範囲取得ロジック
- 取引紐付けロジック

### 統合テスト

- **対象**: API エンドポイント
- **ツール**: Supertest + Jest
- **テスト内容**: HTTPリクエスト/レスポンスの検証

**テストケース例**:

- POST `/api/events` - イベント作成API
- PUT `/api/events/:id` - イベント更新API
- DELETE `/api/events/:id` - イベント削除API
- GET `/api/events/date-range` - 日付範囲取得API

### E2Eテスト

- **対象**: ユーザーシナリオ
- **ツール**: Playwright
- **テスト内容**: 画面操作フローの検証

**テストケース例**:

- イベント管理画面からイベントを追加
- カレンダー上でイベントを表示
- イベントと取引を紐付け
- イベントを削除

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
- カスタム例外クラスの使用（`EventNotFoundException`, `InvalidEventDateException`等）
- エラーログの適切な出力

### 4. データ整合性

- イベント削除時は関連する取引との紐付けも削除（CASCADE）
- 取引削除時は関連するイベントとの紐付けも削除（CASCADE）
- トランザクション管理の適切な実装

### 5. 日付処理

- 日付はUTCで保存し、表示時にローカルタイムゾーンに変換
- 閏年対応を考慮
- 日付範囲のバリデーション（開始日 <= 終了日）

## 依存関係

### Depends on (前提条件)

- FR-001-007: データ取得機能 - 取引データの存在
- TransactionEntity - 取引エンティティ

### Blocks (後続機能)

- FR-022: イベントと収支の紐付け - イベント機能の拡張
- FR-020: 年間収支推移表示 - イベントマーカーの表示

### Related to

- #182: Epic - データ取得機能

## 実装順序

1. **Phase 1**: 詳細設計書作成（本ドキュメント）✅
2. **Phase 2**: Domain層実装
   - EventEntity実装
   - EventCategory ValueObject実装
   - IEventRepositoryインターフェース定義
3. **Phase 3**: Application層実装
   - CreateEventUseCase
   - UpdateEventUseCase
   - DeleteEventUseCase
   - GetEventByIdUseCase
   - GetEventsByDateRangeUseCase
   - LinkTransactionToEventUseCase
4. **Phase 4**: Infrastructure層実装
   - データベースマイグレーション（events, event_transaction_relationsテーブル）
   - EventOrmRepository実装
   - EventOrmEntity実装
   - EventTransactionRelationOrmEntity実装
   - EventJsonRepository実装（Fallback）
5. **Phase 5**: Presentation層実装（API）
   - EventController実装
   - DTO定義（CreateEventDto, UpdateEventDto, EventResponseDto）
6. **Phase 6**: Frontend実装
   - イベント管理画面
   - イベントフォーム
   - カレンダー表示
7. **Phase 7**: テスト実装・統合
   - ユニットテスト
   - 統合テスト
   - E2Eテスト

## 関連ドキュメント

- [`docs/functional-requirements/FR-016-022_aggregation-analysis.md`](../../functional-requirements/FR-016-022_aggregation-analysis.md#fr-021-イベントメモ機能) - 機能要件書
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

### オプション項目

- [x] 画面遷移図が作成されている
- [ ] 状態遷移図は不要（シンプルなCRUD）
- [ ] バッチ処理詳細は不要（バッチ処理なし）
