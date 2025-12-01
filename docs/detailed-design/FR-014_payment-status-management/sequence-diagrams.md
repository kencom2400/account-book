# シーケンス図

このドキュメントでは、支払いステータス管理機能の処理フローをシーケンス図で記載しています。

## 目次

1. [手動ステータス更新のフロー](#手動ステータス更新のフロー)
2. [自動ステータス更新のフロー（日次バッチ）](#自動ステータス更新のフロー日次バッチ)
3. [ステータス履歴取得のフロー](#ステータス履歴取得のフロー)
4. [照合結果による自動ステータス更新のフロー](#照合結果による自動ステータス更新のフロー)
5. [エラーハンドリングフロー](#エラーハンドリングフロー)

---

## 手動ステータス更新のフロー

### 概要

**ユースケース**: ユーザーが請求明細のステータスを手動で更新する

**アクター**: フロントエンド、ユーザー

**前提条件**:

- 請求データ（MonthlyCardSummary）が存在する
- 現在のステータスが取得可能

**成功時の結果**:

- ステータスが更新される
- ステータス変更履歴が記録される
- 更新理由とメモが保存される

### 正常系フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Frontend as フロントエンド
    participant API as PaymentStatusController
    participant UC as UpdatePaymentStatusUseCase
    participant Validator as PaymentStatusTransitionValidator
    participant SummaryRepo as MonthlyCardSummaryRepository
    participant StatusRepo as PaymentStatusRepository
    participant Entity as PaymentStatusRecord

    User->>Frontend: ステータス変更ボタンをクリック
    Frontend->>Frontend: ステータス選択ダイアログを表示
    User->>Frontend: 新しいステータスとメモを入力
    Frontend->>API: PUT /api/payment-status/:cardSummaryId<br/>{newStatus, notes}

    API->>API: リクエスト検証
    API->>UC: execute(dto)

    UC->>SummaryRepo: findById(cardSummaryId)
    SummaryRepo-->>UC: MonthlyCardSummary

    alt 請求データが見つからない
        SummaryRepo-->>UC: null
        UC-->>API: Result.failure(CardSummaryNotFoundError)
        API-->>Frontend: 404 Not Found<br/>{error: "請求データが見つかりません"}
        Frontend-->>User: エラーメッセージ表示
    end

    UC->>StatusRepo: findByCardSummaryId(cardSummaryId)
    StatusRepo-->>UC: PaymentStatusRecord | null

    alt ステータス記録が存在しない
        StatusRepo-->>UC: null
        UC->>UC: 初期ステータス（PENDING）を設定
    end

    UC->>Validator: validateTransition(currentStatus, newStatus)
    Validator->>Validator: 遷移ルールを確認
    Validator-->>UC: isValid: boolean

    alt 無効な遷移
        Validator-->>UC: false
        UC-->>API: Result.failure(InvalidStatusTransitionError)
        API-->>Frontend: 400 Bad Request<br/>{error: "無効なステータス遷移です"}
        Frontend-->>User: エラーメッセージ表示
    end

    UC->>Entity: create new PaymentStatusRecord
    Entity->>Entity: ステータス記録を作成<br/>{cardSummaryId, newStatus, previousStatus, updatedBy: 'user', notes}
    Entity-->>UC: newRecord

    UC->>StatusRepo: save(newRecord)
    StatusRepo->>StatusRepo: 履歴に追加
    StatusRepo->>StatusRepo: ファイルに保存
    StatusRepo-->>UC: savedRecord

    UC->>UC: toResponseDto(savedRecord)
    UC-->>API: Result.success(PaymentStatusResponseDto)
    API-->>Frontend: 200 OK<br/>{success: true, data: statusRecord}
    Frontend-->>User: 成功メッセージ表示

    Note over UC,API: UseCaseでエンティティをDTOに変換<br/>Controllerはドメインエンティティを扱わない
```

### ステップ詳細

1. **リクエスト受信**
   - エンドポイント: `PUT /api/payment-status/:cardSummaryId`
   - RequestDTO: `UpdatePaymentStatusRequestDto`
   - バリデーション: newStatus（PaymentStatus Enum）、notes（任意、最大1000文字）

2. **請求データ取得**
   - カード集計IDから請求データを取得
   - 請求データが存在しない場合は404エラー

3. **現在のステータス取得**
   - カード集計IDから最新のステータス記録を取得
   - ステータス記録が存在しない場合は初期ステータス（PENDING）を設定

4. **ステータス遷移の検証**
   - 現在のステータスから新しいステータスへの遷移が許可されているか検証
   - 無効な遷移の場合は400エラー

5. **ステータス記録の作成**
   - 新しいステータス記録を作成
   - updatedBy: 'user'、notesを設定

6. **永続化**
   - ステータス記録をJSON形式で保存
   - ステータス変更履歴に追加

7. **レスポンス**
   - ResponseDTO: `PaymentStatusResponseDto`
   - HTTPステータス: 200 OK

---

## 自動ステータス更新のフロー（日次バッチ）

### 概要

**ユースケース**: 日次バッチ処理により、引落予定日に基づいて自動的にステータスを更新する

**アクター**: スケジューラー（NestJS Schedule）

**前提条件**:

- 請求データ（MonthlyCardSummary）が存在する
- 引落予定日が設定されている

**成功時の結果**:

- ステータスが自動更新される
- ステータス変更履歴が記録される
- 更新理由が記録される

### PENDING → PROCESSING の更新フロー

```mermaid
sequenceDiagram
    participant Scheduler as PaymentStatusUpdateScheduler
    participant UC as UpdatePaymentStatusUseCase
    participant SummaryRepo as MonthlyCardSummaryRepository
    participant StatusRepo as PaymentStatusRepository
    participant Validator as PaymentStatusTransitionValidator

    Note over Scheduler: 毎日深夜0時実行

    Scheduler->>Scheduler: updatePendingToProcessing()
    Scheduler->>SummaryRepo: findAll()
    SummaryRepo-->>Scheduler: MonthlyCardSummary[]

    Scheduler->>Scheduler: 引落予定日の3日前の請求を抽出<br/>filter(summary => paymentDate - 3 days <= today)

    loop 各請求
        Scheduler->>StatusRepo: findByCardSummaryId(cardSummaryId)
        StatusRepo-->>Scheduler: PaymentStatusRecord | null

        alt ステータスがPENDING
            Scheduler->>UC: execute({cardSummaryId, newStatus: PROCESSING, updatedBy: 'system', reason: '引落予定日の3日前'})

            UC->>Validator: validateTransition(PENDING, PROCESSING)
            Validator-->>UC: true

            UC->>StatusRepo: save(newRecord)
            StatusRepo-->>UC: savedRecord

            UC-->>Scheduler: Result.success()
        end
    end

    Scheduler->>Scheduler: ログ出力<br/>"X件のステータスを更新しました"
```

### PROCESSING → OVERDUE の更新フロー

```mermaid
sequenceDiagram
    participant Scheduler as PaymentStatusUpdateScheduler
    participant UC as UpdatePaymentStatusUseCase
    participant SummaryRepo as MonthlyCardSummaryRepository
    participant StatusRepo as PaymentStatusRepository

    Note over Scheduler: 毎日深夜0時実行

    Scheduler->>Scheduler: updateProcessingToOverdue()
    Scheduler->>StatusRepo: findAllByStatus(PROCESSING)
    StatusRepo-->>Scheduler: PaymentStatusRecord[]

    Scheduler->>Scheduler: 引落予定日+7日経過の請求を抽出<br/>filter(record => paymentDate + 7 days < today)

    loop 各ステータス記録
        Scheduler->>SummaryRepo: findById(cardSummaryId)
        SummaryRepo-->>Scheduler: MonthlyCardSummary

        alt 引落予定日+7日経過
            Scheduler->>UC: execute({cardSummaryId, newStatus: OVERDUE, updatedBy: 'system', reason: '引落予定日+7日経過'})

            UC->>StatusRepo: save(newRecord)
            StatusRepo-->>UC: savedRecord

            UC-->>Scheduler: Result.success()

            Note over Scheduler: 重要アラート生成（FR-015で対応）
        end
    end

    Scheduler->>Scheduler: ログ出力<br/>"X件のステータスをOVERDUEに更新しました"
```

### ステップ詳細

1. **スケジューラー起動**
   - 毎日深夜0時に実行
   - NestJS Schedule（@nestjs/schedule）を使用

2. **対象抽出**
   - PENDING → PROCESSING: 引落予定日の3日前の請求を抽出
   - PROCESSING → OVERDUE: 引落予定日+7日経過の請求を抽出

3. **ステータス更新**
   - 各請求に対してステータス更新を実行
   - updatedBy: 'system'、reasonを設定

4. **ログ記録**
   - 更新件数をログに記録

---

## 照合結果による自動ステータス更新のフロー

### 概要

**ユースケース**: 照合結果（FR-013）に基づいて自動的にステータスを更新する

**アクター**: 照合処理（FR-013）

**前提条件**:

- 照合処理が実行されている
- 照合結果が取得可能

**成功時の結果**:

- ステータスが自動更新される（PROCESSING → PAID または DISPUTED）
- 照合IDが記録される

### PROCESSING → PAID の更新フロー（照合成功）

```mermaid
sequenceDiagram
    participant Recon as 照合処理（FR-013）
    participant Scheduler as PaymentStatusUpdateScheduler
    participant UC as UpdatePaymentStatusUseCase
    participant ReconRepo as ReconciliationRepository
    participant StatusRepo as PaymentStatusRepository

    Recon->>Recon: 照合処理実行
    Recon->>ReconRepo: findByCardSummaryId(cardSummaryId)
    ReconRepo-->>Recon: ReconciliationResult{status: SUCCESS}

    Recon->>Scheduler: updateProcessingToPaid(cardSummaryId, reconciliationId)

    Scheduler->>StatusRepo: findByCardSummaryId(cardSummaryId)
    StatusRepo-->>Scheduler: PaymentStatusRecord{status: PROCESSING}

    alt ステータスがPROCESSING
        Scheduler->>UC: execute({cardSummaryId, newStatus: PAID, updatedBy: 'system', reason: '照合成功', reconciliationId})

        UC->>StatusRepo: save(newRecord)
        StatusRepo-->>UC: savedRecord

        UC-->>Scheduler: Result.success()
        Scheduler-->>Recon: ステータス更新完了
    end
```

### PROCESSING → DISPUTED の更新フロー（照合失敗）

```mermaid
sequenceDiagram
    participant Recon as 照合処理（FR-013）
    participant Scheduler as PaymentStatusUpdateScheduler
    participant UC as UpdatePaymentStatusUseCase
    participant ReconRepo as ReconciliationRepository
    participant StatusRepo as PaymentStatusRepository

    Recon->>Recon: 照合処理実行
    Recon->>ReconRepo: findByCardSummaryId(cardSummaryId)
    ReconRepo-->>Recon: ReconciliationResult{status: FAILED}

    Recon->>Scheduler: updateProcessingToDisputed(cardSummaryId, reconciliationId)

    Scheduler->>StatusRepo: findByCardSummaryId(cardSummaryId)
    StatusRepo-->>Scheduler: PaymentStatusRecord{status: PROCESSING}

    alt ステータスがPROCESSING
        Scheduler->>UC: execute({cardSummaryId, newStatus: DISPUTED, updatedBy: 'system', reason: '照合失敗', reconciliationId})

        UC->>StatusRepo: save(newRecord)
        StatusRepo-->>UC: savedRecord

        UC-->>Scheduler: Result.success()
        Scheduler-->>Recon: ステータス更新完了

        Note over Scheduler: アラート生成（FR-015で対応）
    end
```

---

## ステータス履歴取得のフロー

### 概要

**ユースケース**: 指定された請求月のステータス変更履歴を取得する

**アクター**: フロントエンド、ユーザー

**前提条件**:

- 請求データ（MonthlyCardSummary）が存在する

**成功時の結果**:

- ステータス変更履歴が取得される
- すべてのステータス変更（自動・手動）が時系列で表示される

### 正常系フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Frontend as フロントエンド
    participant API as PaymentStatusController
    participant UC as GetPaymentStatusHistoryUseCase
    participant StatusRepo as PaymentStatusRepository

    User->>Frontend: ステータス履歴ボタンをクリック
    Frontend->>API: GET /api/payment-status/:cardSummaryId/history

    API->>UC: execute(cardSummaryId)

    UC->>StatusRepo: findHistoryByCardSummaryId(cardSummaryId)
    StatusRepo->>StatusRepo: loadHistoryFromFile()
    StatusRepo->>StatusRepo: filterByCardSummaryId(cardSummaryId)
    StatusRepo-->>UC: PaymentStatusHistory

    alt 履歴が存在する
        UC->>UC: toResponseDto(history)
        UC-->>API: Result.success(PaymentStatusHistoryResponseDto)
        API-->>Frontend: 200 OK<br/>{success: true, data: history}
        Frontend-->>User: 履歴を表示
    else 履歴が存在しない
        UC-->>API: Result.success({cardSummaryId, statusChanges: []})
        API-->>Frontend: 200 OK<br/>{success: true, data: {cardSummaryId, statusChanges: []}}
        Frontend-->>User: "履歴がありません"を表示
    end
```

### ステップ詳細

1. **リクエスト受信**
   - エンドポイント: `GET /api/payment-status/:cardSummaryId/history`
   - パラメータ: cardSummaryId（パスパラメータ）

2. **履歴取得**
   - カード集計IDからステータス変更履歴を取得
   - 履歴が存在しない場合は空配列を返す

3. **レスポンス**
   - ResponseDTO: `PaymentStatusHistoryResponseDto`
   - HTTPステータス: 200 OK

---

## エラーハンドリングフロー

### バリデーションエラー (400 Bad Request)

```mermaid
sequenceDiagram
    actor User
    participant API as PaymentStatusController
    participant UC as UpdatePaymentStatusUseCase

    User->>API: PUT /api/payment-status/:cardSummaryId<br/>{newStatus: "INVALID_STATUS"}

    API->>API: リクエスト検証
    API->>API: バリデーションエラー検出<br/>- newStatus: PaymentStatus Enum値ではない

    API-->>User: 400 Bad Request<br/>{<br/>  statusCode: 400,<br/>  message: "Validation failed",<br/>  errors: [{<br/>    field: "newStatus",<br/>    message: "newStatusは有効なPaymentStatus値である必要があります"<br/>  }]<br/>}
```

**エラーレスポンス例**:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "newStatus",
      "message": "newStatusは有効なPaymentStatus値である必要があります"
    }
  ]
}
```

### 無効なステータス遷移エラー (400 Bad Request)

```mermaid
sequenceDiagram
    actor User
    participant API as Controller
    participant UC as UpdatePaymentStatusUseCase
    participant Validator as PaymentStatusTransitionValidator

    User->>API: PUT /api/payment-status/:cardSummaryId<br/>{newStatus: "PENDING"}
    API->>UC: execute(dto)
    UC->>Validator: validateTransition(PAID, PENDING)
    Validator->>Validator: 遷移ルールを確認
    Validator-->>UC: false

    UC->>UC: InvalidStatusTransitionError生成
    UC-->>API: Result.failure(InvalidStatusTransitionError)

    API->>API: エラーハンドリング
    API-->>User: 400 Bad Request<br/>{<br/>  "success": false,<br/>  "statusCode": 400,<br/>  "errorCode": "PS001",<br/>  "message": "無効なステータス遷移です",<br/>  "fromStatus": "PAID",<br/>  "toStatus": "PENDING"<br/>}
```

### 請求データ未検出エラー (404 Not Found)

```mermaid
sequenceDiagram
    participant API as Controller
    participant UC as UpdatePaymentStatusUseCase
    participant SummaryRepo as MonthlyCardSummaryRepository

    API->>UC: execute(dto)
    UC->>SummaryRepo: findById(cardSummaryId)
    SummaryRepo-->>UC: null

    UC->>UC: CardSummaryNotFoundError生成
    UC-->>API: Result.failure(CardSummaryNotFoundError)

    API->>API: エラーハンドリング
    API-->>API: 404 Not Found<br/>{<br/>  "success": false,<br/>  "statusCode": 404,<br/>  "errorCode": "PS002",<br/>  "message": "請求データが見つかりません",<br/>  "cardSummaryId": "xxx"<br/>}
```

### 同時更新の競合エラー (409 Conflict)

```mermaid
sequenceDiagram
    participant User1 as ユーザー1
    participant User2 as ユーザー2
    participant API as Controller
    participant UC as UpdatePaymentStatusUseCase
    participant StatusRepo as PaymentStatusRepository

    User1->>API: PUT /api/payment-status/:id<br/>{newStatus: "PAID"}
    User2->>API: PUT /api/payment-status/:id<br/>{newStatus: "DISPUTED"}

    API->>UC: execute(dto1)
    UC->>StatusRepo: findByCardSummaryId(id)
    StatusRepo-->>UC: record1{version: 1}

    API->>UC: execute(dto2)
    UC->>StatusRepo: findByCardSummaryId(id)
    StatusRepo-->>UC: record2{version: 1}

    UC->>StatusRepo: save(record1)
    StatusRepo-->>UC: saved{version: 2}

    UC->>StatusRepo: save(record2)
    StatusRepo->>StatusRepo: バージョン競合検出<br/>expectedVersion: 1, actualVersion: 2
    StatusRepo--xUC: ConflictError

    UC->>UC: ConflictError生成
    UC-->>API: Result.failure(ConflictError)

    API-->>User2: 409 Conflict<br/>{<br/>  "success": false,<br/>  "statusCode": 409,<br/>  "errorCode": "PS004",<br/>  "message": "同時更新の競合が発生しました。最新データを再取得して再試行してください"<br/>}
```

### サーバーエラー (500 Internal Server Error)

```mermaid
sequenceDiagram
    participant API as Controller
    participant UC as UpdatePaymentStatusUseCase
    participant StatusRepo as PaymentStatusRepository

    API->>UC: execute(dto)
    UC->>StatusRepo: save(record)
    StatusRepo->>StatusRepo: 予期しないエラー発生<br/>(ファイル書き込み失敗等)
    StatusRepo--xUC: Error

    UC->>UC: エラーログ出力
    UC-->>API: Result.failure(InternalError)

    API->>API: エラーハンドリング
    API-->>API: 500 Internal Server Error<br/>{<br/>  statusCode: 500,<br/>  message: "サーバーエラーが発生しました"<br/>}
```

---

## ステータス遷移ルール詳細

### 許可された遷移

```mermaid
sequenceDiagram
    participant Validator as PaymentStatusTransitionValidator

    Note over Validator: PENDING → PROCESSING<br/>条件: 引落予定日の3日前
    Note over Validator: PENDING → PARTIAL<br/>条件: 一部金額のみ引落
    Note over Validator: PENDING → CANCELLED<br/>条件: ユーザーがキャンセル
    Note over Validator: PENDING → MANUAL_CONFIRMED<br/>条件: 手動で確認完了
    Note over Validator: PROCESSING → PAID<br/>条件: 照合成功（FR-013）
    Note over Validator: PROCESSING → DISPUTED<br/>条件: 照合失敗（FR-013）
    Note over Validator: PROCESSING → OVERDUE<br/>条件: 引落予定日+7日経過
    Note over Validator: DISPUTED → MANUAL_CONFIRMED<br/>条件: 手動で確認完了
```

### 禁止された遷移

- PAID → PENDING: 支払済みから未払いに戻すことは不可
- PAID → PROCESSING: 支払済みから処理中に戻すことは不可
- OVERDUE → PENDING: 延滞から未払いに戻すことは不可
- CANCELLED → その他: キャンセルから他のステータスに遷移することは不可

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
- [x] レスポンスの型とステータスコードが明記されている
- [x] ステータス遷移ルールが明確
- [x] 自動更新と手動更新の違いが明確

### 実装ガイド

- [x] 各ステップに説明が付与されている
- [x] 前提条件が明確
- [x] 成功時の結果が明確
- [x] エラーレスポンス例が記載されている
