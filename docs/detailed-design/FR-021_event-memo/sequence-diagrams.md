# シーケンス図

このドキュメントでは、イベントメモ機能（FR-021）の処理フローをシーケンス図で記載しています。

## 目次

1. [イベント作成のフロー](#イベント作成のフロー)
2. [イベント更新のフロー](#イベント更新のフロー)
3. [イベント削除のフロー](#イベント削除のフロー)
4. [イベント詳細取得のフロー](#イベント詳細取得のフロー)
5. [日付範囲でのイベント取得のフロー](#日付範囲でのイベント取得のフロー)
6. [取引との紐付けのフロー](#取引との紐付けのフロー)
7. [取引との紐付け解除のフロー](#取引との紐付け解除のフロー)
8. [エラーハンドリングフロー](#エラーハンドリングフロー)

---

## イベント作成のフロー

### 概要

**ユースケース**: ユーザーが新しいイベントを追加する

**アクター**: ユーザー

**前提条件**:

- ユーザーがイベント管理画面にアクセスしている
- 有効な日付とタイトルが入力されている

**成功時の結果**:

- 新しいイベントがデータベースに保存される
- イベント一覧に新規イベントが表示される
- カレンダー上にイベントマーカーが表示される

### 正常系フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend<br/>(EventManagementPage)
    participant Form as EventForm
    participant API as EventController
    participant UC as CreateEventUseCase
    participant Repo as EventRepository
    participant DB as Database

    User->>FE: 「イベント追加」ボタンクリック
    FE->>Form: フォーム表示

    User->>Form: イベント情報入力<br/>(日付, タイトル, カテゴリ, 説明, タグ)
    Form->>Form: クライアント側バリデーション

    User->>Form: 「保存」ボタンクリック
    Form->>API: POST /api/events<br/>{CreateEventDto}

    API->>API: DTOバリデーション
    API->>UC: execute(createEventDto)

    UC->>UC: リクエスト検証
    UC->>UC: EventEntity作成<br/>(ID生成, バリデーション)

    UC->>Repo: save(event)
    Repo->>DB: INSERT INTO events
    DB-->>Repo: 成功
    Repo-->>UC: 保存されたEventEntity

    UC-->>API: EventEntity
    API->>API: EventResponseDtoに変換
    API-->>FE: 201 Created<br/>{EventResponseDto}

    FE->>FE: イベント一覧を更新
    FE->>FE: カレンダーを更新
    FE-->>User: 成功メッセージ表示<br/>「イベントを追加しました」
```

### ステップ詳細

1. **ユーザーアクション**
   - イベント管理画面で「イベント追加」ボタンをクリック

2. **フォーム表示**
   - EventFormコンポーネントがモーダルで表示される
   - 必須項目: 日付、タイトル、カテゴリ
   - 任意項目: 説明、タグ

3. **Frontend バリデーション**
   - 日付: 必須、妥当な日付
   - タイトル: 必須、1-100文字
   - カテゴリ: 必須、EventCategoryの値
   - 説明: 任意、最大1000文字

4. **API リクエスト**
   - エンドポイント: `POST /api/events`
   - RequestDTO: `CreateEventDto`

5. **UseCase 実行**
   - EventEntityを作成
   - バリデーションを実施
   - リポジトリに保存

6. **データ永続化**
   - `events`テーブルにINSERT

7. **レスポンス**
   - ResponseDTO: `EventResponseDto`
   - HTTPステータス: 201 Created

---

## イベント更新のフロー

### 概要

**ユースケース**: 既存イベントの情報を変更する

**アクター**: ユーザー

**前提条件**:

- イベントが存在する
- ユーザーがイベント詳細画面にアクセスしている

**成功時の結果**:

- イベント情報が更新される
- イベント一覧とカレンダーが更新される

### 正常系フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend<br/>(EventDetailDialog)
    participant Form as EventForm
    participant API as EventController
    participant UC as UpdateEventUseCase
    participant Repo as EventRepository
    participant DB as Database

    User->>FE: 「編集」ボタンクリック
    FE->>Form: 編集フォーム表示<br/>(現在値が入力済み)

    User->>Form: イベント情報を変更
    Form->>Form: クライアント側バリデーション

    User->>Form: 「保存」ボタンクリック
    Form->>API: PUT /api/events/:id<br/>{UpdateEventDto}

    API->>API: DTOバリデーション
    API->>UC: execute(id, updateEventDto)

    UC->>Repo: findById(id)
    Repo->>DB: SELECT * FROM events<br/>WHERE id = ?
    DB-->>Repo: イベントデータ
    Repo-->>UC: EventEntity

    UC->>UC: イベント情報を更新<br/>(新しいEventEntityを作成)

    UC->>Repo: save(updatedEvent)
    Repo->>DB: UPDATE events SET ...
    DB-->>Repo: 成功
    Repo-->>UC: 更新されたEventEntity

    UC-->>API: EventEntity
    API->>API: EventResponseDtoに変換
    API-->>FE: 200 OK<br/>{EventResponseDto}

    FE->>FE: イベント一覧を更新
    FE->>FE: カレンダーを更新
    FE-->>User: 成功メッセージ表示<br/>「イベントを更新しました」
```

---

## イベント削除のフロー

### 概要

**ユースケース**: イベントを削除し、関連付けも解除する

**アクター**: ユーザー

**前提条件**:

- イベントが存在する
- ユーザーがイベント詳細画面にアクセスしている

**成功時の結果**:

- イベントが削除される
- 関連する取引との紐付けも削除される（CASCADE）

### 正常系フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend<br/>(EventDetailDialog)
    participant API as EventController
    participant UC as DeleteEventUseCase
    participant EventRepo as EventRepository
    participant TransRepo as TransactionRepository
    participant DB as Database

    User->>FE: 「削除」ボタンクリック
    FE->>FE: 確認ダイアログ表示

    User->>FE: 「削除」を確定
    FE->>API: DELETE /api/events/:id

    API->>UC: execute(id)

    UC->>EventRepo: findById(id)
    EventRepo->>DB: SELECT * FROM events<br/>WHERE id = ?
    DB-->>EventRepo: イベントデータ
    EventRepo-->>UC: EventEntity

    UC->>EventRepo: delete(id)
    EventRepo->>DB: DELETE FROM events<br/>WHERE id = ?
    Note over DB: CASCADE削除により<br/>event_transaction_relations<br/>も自動削除
    DB-->>EventRepo: 成功

    UC-->>API: void
    API-->>FE: 200 OK<br/>{SuccessResponse: message}

    FE->>FE: イベント一覧を更新
    FE->>FE: カレンダーを更新
    FE-->>User: 成功メッセージ表示<br/>「イベントを削除しました」
```

---

## イベント詳細取得のフロー

### 概要

**ユースケース**: イベントの詳細情報と関連取引を取得する

**アクター**: ユーザー

**前提条件**:

- イベントが存在する

**成功時の結果**:

- イベントの詳細情報が表示される
- 関連する取引一覧が表示される

### 正常系フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend<br/>(EventCalendar)
    participant API as EventController
    participant UC as GetEventByIdUseCase
    participant EventRepo as EventRepository
    participant TransRepo as TransactionRepository
    participant DB as Database

    User->>FE: イベントマーカーをクリック
    FE->>API: GET /api/events/:id

    API->>UC: execute(id)

    UC->>EventRepo: findById(id)
    EventRepo->>DB: SELECT * FROM events<br/>WHERE id = ?
    DB-->>EventRepo: イベントデータ
    EventRepo-->>UC: EventEntity

    UC->>EventRepo: getTransactionIdsByEventId(id)
    EventRepo->>DB: SELECT transaction_id FROM event_transaction_relations<br/>WHERE event_id = ?
    DB-->>EventRepo: 関連取引ID一覧
    EventRepo-->>UC: transactionIds[]

    UC->>TransRepo: findByIds(transactionIds)
    TransRepo->>DB: SELECT * FROM transactions<br/>WHERE id IN (?)
    DB-->>TransRepo: 取引データ一覧
    TransRepo-->>UC: TransactionEntity[]

    UC->>UC: EventResponseDtoに変換<br/>(EventEntity + TransactionEntity[])

    UC-->>API: EventResponseDto
    API-->>FE: 200 OK<br/>{EventResponseDto}

    FE->>FE: EventDetailDialogを表示
    FE-->>User: イベント詳細と関連取引を表示
```

---

## 日付範囲でのイベント取得のフロー

### 概要

**ユースケース**: 指定した日付範囲のイベント一覧を取得する

**アクター**: ユーザー

**前提条件**:

- 日付範囲が指定されている

**成功時の結果**:

- 指定範囲のイベント一覧が表示される
- カレンダー上にイベントマーカーが表示される

### 正常系フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend<br/>(EventCalendar)
    participant API as EventController
    participant UC as GetEventsByDateRangeUseCase
    participant Repo as EventRepository
    participant DB as Database

    User->>FE: カレンダーの月を変更
    FE->>FE: 日付範囲を計算<br/>(月初〜月末)

    FE->>API: GET /api/events/date-range<br/>?startDate=2025-01-01&endDate=2025-01-31

    API->>API: クエリパラメータ検証
    API->>UC: execute(startDate, endDate)

    UC->>UC: 日付範囲のバリデーション<br/>(startDate <= endDate)

    UC->>Repo: findByDateRange(startDate, endDate)
    Repo->>DB: SELECT * FROM events<br/>WHERE date BETWEEN ? AND ?<br/>ORDER BY date ASC
    DB-->>Repo: イベントデータ一覧
    Repo-->>UC: EventEntity[]

    UC->>UC: EventResponseDto[]に変換

    UC-->>API: EventResponseDto[]
    API-->>FE: 200 OK<br/>{EventResponseDto[]}

    FE->>FE: カレンダーを更新
    FE->>FE: イベントマーカーを表示
    FE-->>User: カレンダー上にイベント表示
```

---

## 取引との紐付けのフロー

### 概要

**ユースケース**: イベントと取引を関連付ける

**アクター**: ユーザー

**前提条件**:

- イベントが存在する
- 取引が存在する

**成功時の結果**:

- イベントと取引が関連付けられる
- イベント詳細画面に関連取引が表示される

**設計判断**:

- 中間テーブル（event_transaction_relations）はInfrastructure層の実装詳細として扱い、`IEventRepository.linkTransaction()`で隠蔽
- Domain層の`EventEntity`には`relatedTransactionIds`を含めない（Onion Architecture原則）
- この設計により、Application層は中間テーブルの存在を意識せずに操作可能

### 正常系フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend<br/>(EventDetailDialog)
    participant API as EventController
    participant UC as LinkTransactionToEventUseCase
    participant EventRepo as EventRepository
    participant TransRepo as TransactionRepository
    participant DB as Database

    User->>FE: 「取引を追加」ボタンクリック
    FE->>FE: 取引選択ダイアログ表示

    User->>FE: 取引を選択
    FE->>API: POST /api/events/:id/transactions<br/>{transactionId}

    API->>API: リクエスト検証
    API->>UC: execute(eventId, transactionId)

    UC->>EventRepo: findById(eventId)
    EventRepo->>DB: SELECT * FROM events<br/>WHERE id = ?
    DB-->>EventRepo: イベントデータ
    EventRepo-->>UC: EventEntity

    UC->>TransRepo: findById(transactionId)
    TransRepo->>DB: SELECT * FROM transactions<br/>WHERE id = ?
    DB-->>TransRepo: 取引データ
    TransRepo-->>UC: TransactionEntity

    UC->>EventRepo: getTransactionIdsByEventId(eventId)
    EventRepo->>DB: SELECT transaction_id FROM event_transaction_relations<br/>WHERE event_id = ?
    DB-->>EventRepo: 関連取引ID一覧
    EventRepo-->>UC: transactionIds[]

    UC->>UC: 重複チェック<br/>(transactionIdsにtransactionIdが含まれていないか)

    UC->>EventRepo: linkTransaction(eventId, transactionId)
    Note over EventRepo: 中間テーブルへの保存は<br/>IEventRepositoryの実装詳細として隠蔽<br/>（Onion Architecture原則）
    EventRepo->>DB: INSERT INTO event_transaction_relations<br/>(event_id, transaction_id)
    DB-->>EventRepo: 成功
    EventRepo-->>UC: void

    UC-->>API: void
    API-->>FE: 201 Created

    FE->>FE: イベント詳細を再取得
    FE-->>User: 関連取引が表示される
```

---

## 取引との紐付け解除のフロー

### 概要

**ユースケース**: イベントと取引の関連付けを解除する

**アクター**: ユーザー

**前提条件**:

- イベントが存在する
- 取引が存在する
- イベントと取引が既に紐付けられている

**成功時の結果**:

- イベントと取引の関連付けが解除される
- イベント詳細画面から関連取引が削除される

### 正常系フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend<br/>(EventDetailDialog)
    participant API as EventController
    participant UC as UnlinkTransactionFromEventUseCase
    participant EventRepo as EventRepository
    participant DB as Database

    User->>FE: 「取引を削除」ボタンクリック
    FE->>FE: 確認ダイアログ表示

    User->>FE: 「削除」を確定
    FE->>API: DELETE /api/events/:id/transactions/:transactionId

    API->>API: リクエスト検証
    API->>UC: execute(eventId, transactionId)

    UC->>EventRepo: findById(eventId)
    EventRepo->>DB: SELECT * FROM events<br/>WHERE id = ?
    DB-->>EventRepo: イベントデータ
    EventRepo-->>UC: EventEntity

    UC->>EventRepo: getTransactionIdsByEventId(eventId)
    EventRepo->>DB: SELECT transaction_id FROM event_transaction_relations<br/>WHERE event_id = ?
    DB-->>EventRepo: 関連取引ID一覧
    EventRepo-->>UC: transactionIds[]

    UC->>UC: 紐付け存在チェック<br/>(transactionIdsにtransactionIdが含まれているか)

    UC->>EventRepo: unlinkTransaction(eventId, transactionId)
    Note over EventRepo: 中間テーブルからの削除は<br/>IEventRepositoryの実装詳細として隠蔽<br/>（Onion Architecture原則）
    EventRepo->>DB: DELETE FROM event_transaction_relations<br/>WHERE event_id = ? AND transaction_id = ?
    DB-->>EventRepo: 成功
    EventRepo-->>UC: void

    UC-->>API: void
    API-->>FE: 200 OK<br/>{SuccessResponse: message}

    FE->>FE: イベント詳細を再取得
    FE-->>User: 関連取引が削除される
```

---

## エラーハンドリングフロー

### バリデーションエラー (400 Bad Request)

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as EventController
    participant UC as CreateEventUseCase

    User->>FE: 不正な入力<br/>(タイトルが空)
    FE->>API: POST /api/events<br/>{CreateEventDto: title=""}

    API->>API: DTOバリデーション
    API->>API: バリデーションエラー検出

    API-->>FE: 400 Bad Request<br/>{ErrorResponse:<br/>code: "VALIDATION_ERROR",<br/>message: "タイトルは必須です"}

    FE->>FE: エラーメッセージ表示
    FE-->>User: 「タイトルは必須です」と表示
```

### リソース未検出エラー (404 Not Found)

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as EventController
    participant UC as GetEventByIdUseCase
    participant Repo as EventRepository
    participant DB as Database

    User->>FE: 存在しないイベントIDでアクセス
    FE->>API: GET /api/events/invalid-id

    API->>UC: execute("invalid-id")

    UC->>Repo: findById("invalid-id")
    Repo->>DB: SELECT * FROM events<br/>WHERE id = ?
    DB-->>Repo: 結果なし
    Repo-->>UC: null

    UC->>UC: EventNotFoundExceptionをスロー

    UC-->>API: EventNotFoundException
    API->>API: エラーレスポンスに変換

    API-->>FE: 404 Not Found<br/>{ErrorResponse:<br/>code: "EVENT_NOT_FOUND",<br/>message: "指定されたイベントが見つかりません"}

    FE->>FE: エラーメッセージ表示
    FE-->>User: 「イベントが見つかりません」と表示
```

### サーバーエラー (500 Internal Server Error)

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as EventController
    participant UC as CreateEventUseCase
    participant Repo as EventRepository
    participant DB as Database

    User->>FE: イベント作成
    FE->>API: POST /api/events<br/>{CreateEventDto}

    API->>UC: execute(createEventDto)

    UC->>Repo: save(event)
    Repo->>DB: INSERT INTO events
    DB-->>Repo: データベース接続エラー

    Repo->>Repo: DatabaseExceptionをスロー

    Repo-->>UC: DatabaseException
    UC-->>API: DatabaseException
    API->>API: エラーログ出力
    API->>API: エラーレスポンスに変換

    API-->>FE: 500 Internal Server Error<br/>{ErrorResponse:<br/>code: "INTERNAL_SERVER_ERROR",<br/>message: "サーバーエラーが発生しました"}

    FE->>FE: エラーメッセージ表示
    FE-->>User: 「サーバーエラーが発生しました」と表示
```

---

## エラーレスポンス形式

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

### エラーコード一覧

| エラーコード                 | HTTPステータス | 説明                     |
| ---------------------------- | -------------- | ------------------------ |
| `VALIDATION_ERROR`           | 400            | バリデーションエラー     |
| `EVENT_NOT_FOUND`            | 404            | イベントが見つからない   |
| `TRANSACTION_NOT_FOUND`      | 404            | 取引が見つからない       |
| `INVALID_DATE_RANGE`         | 400            | 無効な日付範囲           |
| `DUPLICATE_TRANSACTION_LINK` | 409            | 既に紐付けられている取引 |
| `INTERNAL_SERVER_ERROR`      | 500            | サーバー内部エラー       |
