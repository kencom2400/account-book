# シーケンス図

このドキュメントでは、利用履歴自動取得機能の処理フローをシーケンス図で記載しています。

## 目次

1. [手動同期のフロー](#手動同期のフロー)
2. [自動同期のフロー](#自動同期のフロー)
3. [同期履歴取得のフロー](#同期履歴取得のフロー)
4. [同期キャンセルのフロー](#同期キャンセルのフロー)
5. [エラーハンドリングフロー](#エラーハンドリングフロー)

---

## 手動同期のフロー

### 概要

**ユースケース**: ユーザーが「今すぐ同期」ボタンを押して、任意のタイミングで取引履歴を同期

**アクター**: ユーザー

**前提条件**:

- ユーザーが認証済み
- 金融機関が連携済み
- 同期が実行中でないこと

**成功時の結果**:

- 各金融機関の取引履歴が取得される
- 新規データがデータベースに保存される
- 重複データはスキップされる
- 同期履歴が記録される

### 正常系フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as SyncController
    participant UC as SyncAllTransactionsUseCase
    participant Repo as SyncHistoryRepository
    participant Orch as SyncOrchestrator
    participant Bank as BankApiClient
    participant Trans as TransactionRepository
    participant Strat as IncrementalSyncStrategy

    User->>FE: 「今すぐ同期」ボタンクリック
    FE->>API: POST /api/sync/start<br/>{forceFullSync: false}

    API->>API: リクエスト検証
    API->>UC: execute(dto)

    UC->>Repo: findRunning()
    Repo-->>UC: [] (実行中なし)

    UC->>UC: 連携済み金融機関を取得

    loop 各金融機関（並行実行）
        UC->>Repo: createSyncHistory()
        Repo-->>UC: SyncHistory (status: PENDING)

        UC->>Orch: syncOne(institution)
        Orch->>Repo: markAsRunning(syncId)

        Orch->>Bank: fetchTransactions(from, to)
        Bank-->>Orch: Transaction[]

        Orch->>Strat: filterNewTransactions(transactions)
        Strat-->>Orch: NewTransaction[]

        Orch->>Trans: saveAll(newTransactions)
        Trans-->>Orch: saved

        Orch->>Repo: markAsCompleted(syncId, result)
        Repo-->>Orch: SyncHistory (status: COMPLETED)

        Orch-->>UC: SyncResult
    end

    UC->>UC: サマリー作成
    UC-->>API: SyncAllTransactionsResult
    API->>API: ResponseDTOに変換
    API-->>FE: 200 OK<br/>{success: true, data: [...]}
    FE->>FE: UI更新（同期完了通知）
    FE-->>User: 「同期完了：XX件の新規データ」
```

### ステップ詳細

1. **ユーザーアクション**
   - ユーザーがダッシュボードの「今すぐ同期」ボタンをクリック

2. **Frontend バリデーション**
   - 必須パラメータの確認（なし）
   - オプション: `forceFullSync` (boolean)、`institutionIds` (string[])

3. **API リクエスト**
   - エンドポイント: `POST /api/sync/start`
   - RequestDTO: `SyncAllTransactionsRequestDto`

4. **実行中チェック**
   - 既に同期が実行中の場合はエラー（409 Conflict）

5. **並行同期実行**
   - 最大5金融機関を同時処理
   - 各金融機関の処理は独立（1つの失敗が他に影響しない）

6. **差分同期**
   - 前回同期日以降のデータのみ取得
   - 重複チェック（トランザクションハッシュで判定）

7. **レスポンス**
   - ResponseDTO: `SyncAllTransactionsResponseDto`
   - HTTPステータス: 200 OK

---

## 自動同期のフロー

### 概要

**ユースケース**: 設定された時刻（デフォルト: 毎日午前4時）に自動的に同期を実行

**アクター**: スケジューラー

**前提条件**:

- スケジューラーが有効
- 金融機関が連携済み

**成功時の結果**:

- 各金融機関の取引履歴が自動取得される
- 同期履歴が記録される
- エラー発生時はログに記録される

### 正常系フロー

```mermaid
sequenceDiagram
    participant Scheduler as NestJS Scheduler
    participant Job as ScheduledSyncJob
    participant UC as SyncAllTransactionsUseCase
    participant Repo as SyncHistoryRepository
    participant Orch as SyncOrchestrator
    participant Bank as BankApiClient
    participant Trans as TransactionRepository
    participant Log as Logger
    participant Notify as NotificationService

    Scheduler->>Job: @Cron('0 4 * * *')<br/>handleCron()

    Job->>Job: checkIfAlreadyRunning()

    alt 既に実行中
        Job->>Log: 警告ログ記録
        Job-->>Scheduler: スキップ
    else 実行中でない
        Job->>Log: 開始ログ記録
        Job->>UC: execute({forceFullSync: false})

        UC->>Repo: findRunning()
        Repo-->>UC: []

        loop 各金融機関（並行実行）
            UC->>Orch: syncOne(institution)
            Orch->>Bank: fetchTransactions(from, to)
            Bank-->>Orch: transactions
            Orch->>Trans: saveAll(newTransactions)
            Trans-->>Orch: saved
            Orch->>Repo: updateSyncHistory(result)
        end

        UC-->>Job: SyncAllTransactionsResult

        alt エラーあり
            Job->>Log: エラーログ記録
            Job->>Notify: 管理者に通知
        else 全て成功
            Job->>Log: 完了ログ記録
        end

        Job-->>Scheduler: 完了
    end
```

### ステップ詳細

1. **スケジューラートリガー**
   - NestJS Schedulerが指定時刻にcronジョブを実行
   - デフォルト: 毎日午前4時（`0 4 * * *`）

2. **重複実行チェック**
   - 前回の実行がまだ終わっていない場合はスキップ
   - フラグ管理で制御

3. **同期実行**
   - UseCaseを呼び出して同期処理を実行
   - 手動同期と同じロジックを使用

4. **エラー通知**
   - エラー発生時は管理者に通知
   - 成功率が一定以下の場合も通知

5. **ログ記録**
   - 開始・終了・エラーのログを記録
   - メトリクスを収集

---

## 同期履歴取得のフロー

### 概要

**ユースケース**: 過去の同期履歴を取得し、成功・失敗状況を確認

**アクター**: ユーザー

**前提条件**:

- ユーザーが認証済み

**成功時の結果**:

- 同期履歴の一覧が取得される
- フィルタ・ソートが適用される

### 正常系フロー

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant API as SyncController
    participant UC as GetSyncHistoryUseCase
    participant Repo as SyncHistoryRepository

    User->>FE: 同期履歴ページを表示
    FE->>API: GET /api/sync/history<br/>?institutionId=xxx&status=completed&limit=20

    API->>API: クエリパラメータ検証
    API->>UC: execute(query)

    UC->>UC: フィルタ条件を構築
    UC->>Repo: findAll(queryOptions)
    Repo-->>UC: SyncHistory[]

    UC->>UC: ソート・ページネーション
    UC-->>API: GetSyncHistoryResult
    API->>API: ResponseDTOに変換
    API-->>FE: 200 OK<br/>{success: true, data: [...]}
    FE->>FE: テーブルに表示
    FE-->>User: 同期履歴一覧
```

### ステップ詳細

1. **ユーザーアクション**
   - ユーザーが同期履歴ページを表示
   - フィルタ・ソート条件を指定（オプション）

2. **API リクエスト**
   - エンドポイント: `GET /api/sync/history`
   - クエリパラメータ:
     - `institutionId` (string, optional)
     - `status` (SyncStatus, optional)
     - `startDate` (ISO8601, optional)
     - `endDate` (ISO8601, optional)
     - `limit` (number, optional, default: 20)

3. **フィルタ適用**
   - 指定された条件で履歴をフィルタ
   - デフォルトは最新20件

4. **レスポンス**
   - ResponseDTO: `GetSyncHistoryResponseDto`
   - HTTPステータス: 200 OK

---

## 同期キャンセルのフロー

### 概要

**ユースケース**: 実行中の同期処理をキャンセル

**アクター**: ユーザー

**前提条件**:

- 同期が実行中であること
- ユーザーが認証済み

**成功時の結果**:

- 実行中の同期がキャンセルされる
- ステータスが「cancelled」に更新される

### 正常系フロー

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant API as SyncController
    participant UC as CancelSyncUseCase
    participant Repo as SyncHistoryRepository
    participant Orch as SyncOrchestrator

    User->>FE: 「キャンセル」ボタンクリック
    FE->>API: PUT /api/sync/cancel/:syncId

    API->>UC: execute(syncId)

    UC->>Repo: findById(syncId)
    Repo-->>UC: SyncHistory

    alt ステータスがRUNNING
        UC->>Orch: cancel(syncId)
        Orch->>Orch: AbortController.abort()
        Orch-->>UC: cancelled

        UC->>Repo: markAsCancelled(syncId)
        Repo-->>UC: SyncHistory (status: CANCELLED)

        UC-->>API: CancelSyncResult
        API-->>FE: 200 OK<br/>{success: true}
        FE->>FE: UI更新
        FE-->>User: 「同期をキャンセルしました」
    else ステータスがRUNNING以外
        UC-->>API: Error (Cannot cancel)
        API-->>FE: 400 Bad Request
        FE-->>User: エラーメッセージ
    end
```

### ステップ詳細

1. **ユーザーアクション**
   - ユーザーが実行中の同期の「キャンセル」ボタンをクリック

2. **API リクエスト**
   - エンドポイント: `PUT /api/sync/cancel/:syncId`
   - PathParameter: `syncId` (string)

3. **ステータス確認**
   - ステータスが「RUNNING」の場合のみキャンセル可能
   - それ以外はエラー

4. **AbortController使用**
   - AbortControllerを使用して進行中の処理を中断
   - Promise.allSettledで並行実行している場合、すべての処理を中断

5. **レスポンス**
   - ResponseDTO: `CancelSyncResponseDto`
   - HTTPステータス: 200 OK

---

## エラーハンドリングフロー

### バリデーションエラー (400 Bad Request)

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant API as SyncController
    participant UC as SyncAllTransactionsUseCase

    User->>FE: 不正なリクエスト
    FE->>API: POST /api/sync/start<br/>{institutionIds: ["invalid"]}

    API->>API: リクエスト検証
    API->>API: バリデーションエラー検出

    API-->>FE: 400 Bad Request<br/>{statusCode: 400, message: "Invalid institutionIds"}
    FE->>FE: エラーメッセージ表示
    FE-->>User: 「金融機関IDが無効です」
```

**エラーレスポンス例**:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "institutionIds",
      "message": "Invalid institution ID: invalid"
    }
  ]
}
```

### 同時実行エラー (409 Conflict)

```mermaid
sequenceDiagram
    participant API as SyncController
    participant UC as SyncAllTransactionsUseCase
    participant Repo as SyncHistoryRepository

    API->>UC: execute(dto)
    UC->>Repo: findRunning()
    Repo-->>UC: [SyncHistory] (実行中あり)

    UC->>UC: ConflictError生成
    UC-->>API: Error (Sync already running)

    API->>API: エラーハンドリング
    API-->>API: 409 Conflict<br/>{message: "Sync is already running"}
```

### 金融機関API接続エラー (502 Bad Gateway)

```mermaid
sequenceDiagram
    participant Orch as SyncOrchestrator
    participant Bank as BankApiClient
    participant Repo as SyncHistoryRepository
    participant Log as Logger

    Orch->>Bank: fetchTransactions(from, to)
    Bank->>Bank: API接続試行
    Bank--xOrch: Error (Timeout)

    Orch->>Log: エラーログ記録
    Orch->>Orch: リトライ判定（1回目）

    Orch->>Bank: fetchTransactions(from, to) (2回目)
    Bank--xOrch: Error (Timeout)

    Orch->>Log: エラーログ記録
    Orch->>Orch: リトライ判定（2回目）

    Orch->>Bank: fetchTransactions(from, to) (3回目)
    Bank--xOrch: Error (Timeout)

    Orch->>Log: エラーログ記録
    Orch->>Repo: markAsFailed(syncId, error)
    Repo-->>Orch: SyncHistory (status: FAILED)
```

**リトライ戦略**:

- 最大3回までリトライ
- リトライ間隔: 1秒、2秒、4秒（指数バックオフ）
- 3回失敗したら、ステータスを「FAILED」に変更

### データ保存エラー (500 Internal Server Error)

```mermaid
sequenceDiagram
    participant Orch as SyncOrchestrator
    participant Trans as TransactionRepository
    participant Repo as SyncHistoryRepository
    participant Log as Logger

    Orch->>Trans: saveAll(newTransactions)
    Trans->>Trans: データベース接続エラー
    Trans--xOrch: Error (Database connection failed)

    Orch->>Log: エラーログ記録
    Orch->>Repo: markAsFailed(syncId, error)
    Repo-->>Orch: SyncHistory (status: FAILED)

    Orch-->>Orch: Error (Internal Server Error)
```

---

## トランザクション境界

### データベーストランザクション

```mermaid
sequenceDiagram
    participant UC as SyncAllTransactionsUseCase
    participant TX as Transaction
    participant Repo as SyncHistoryRepository
    participant Trans as TransactionRepository
    participant DB as Database

    UC->>TX: beginTransaction()

    UC->>Repo: createSyncHistory()
    Repo->>DB: INSERT INTO sync_history

    UC->>Trans: saveAll(newTransactions)
    Trans->>DB: INSERT INTO transactions

    UC->>Repo: markAsCompleted(syncId, result)
    Repo->>DB: UPDATE sync_history

    alt すべて成功
        UC->>TX: commit()
        TX->>DB: COMMIT
        DB-->>UC: 成功
    else エラー発生
        UC->>TX: rollback()
        TX->>DB: ROLLBACK
        DB-->>UC: ロールバック完了
    end
```

**トランザクション境界の重要性**:

- 同期履歴とトランザクションデータの保存は同一トランザクション内で実行
- エラー発生時は両方ともロールバックされる
- データの整合性を保証

---

## パフォーマンス最適化

### 並行実行制御

```mermaid
sequenceDiagram
    participant Orch as SyncOrchestrator
    participant Bank1 as BankApiClient1
    participant Bank2 as BankApiClient2
    participant Bank3 as BankApiClient3
    participant Bank4 as BankApiClient4
    participant Bank5 as BankApiClient5

    Orch->>Orch: 金融機関リストを取得（10件）

    Note over Orch: 最大5件を同時実行

    par 並行実行（1-5件目）
        Orch->>Bank1: fetchTransactions()
        Bank1-->>Orch: データ
    and
        Orch->>Bank2: fetchTransactions()
        Bank2-->>Orch: データ
    and
        Orch->>Bank3: fetchTransactions()
        Bank3-->>Orch: データ
    and
        Orch->>Bank4: fetchTransactions()
        Bank4-->>Orch: データ
    and
        Orch->>Bank5: fetchTransactions()
        Bank5-->>Orch: データ
    end

    Note over Orch: 次のバッチ（6-10件目）

    par 並行実行（6-10件目）
        Orch->>Bank1: fetchTransactions()
        Bank1-->>Orch: データ
    and
        Orch->>Bank2: fetchTransactions()
        Bank2-->>Orch: データ
    and
        Orch->>Bank3: fetchTransactions()
        Bank3-->>Orch: データ
    and
        Orch->>Bank4: fetchTransactions()
        Bank4-->>Orch: データ
    and
        Orch->>Bank5: fetchTransactions()
        Bank5-->>Orch: データ
    end
```

**並行実行のメリット**:

- 同期時間の大幅短縮
- APIレート制限の回避（同時実行数制限）
- 1つの失敗が他に影響しない

---

## チェックリスト

シーケンス図作成時の確認事項：

### 基本項目

- [x] 主要なユースケースがすべて記載されている
- [x] アクター、参加者が明確に定義されている
- [x] 正常系フローが記載されている
- [x] 異常系フローが記載されている

### 詳細項目

- [x] エラーハンドリングが明確
- [x] トランザクション境界が明確
- [x] 非同期処理が適切に表現されている
- [x] レスポンスの型とステータスコードが明記されている

### 実装ガイド

- [x] 各ステップに説明が付与されている
- [x] 前提条件が明確
- [x] 成功時の結果が明確

---

## Mermaid記法のヒント

### 基本構文

```mermaid
sequenceDiagram
    participant A as 参加者A
    participant B as 参加者B

    A->>B: 同期メッセージ
    A-->>B: 非同期メッセージ
    A-xB: 失敗メッセージ
    B-->>A: 応答
```

### 条件分岐

```mermaid
sequenceDiagram
    alt 条件1
        A->>B: 処理1
    else 条件2
        A->>C: 処理2
    end
```

### ループ

```mermaid
sequenceDiagram
    loop 繰り返し条件
        A->>B: 処理
    end
```

### 並行処理

```mermaid
sequenceDiagram
    par 並行処理
        A->>B: 処理1
    and
        A->>C: 処理2
    end
```
