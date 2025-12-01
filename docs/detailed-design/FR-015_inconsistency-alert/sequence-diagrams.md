# シーケンス図

このドキュメントでは、不一致時のアラート表示機能の処理フローをシーケンス図で記載しています。

## 目次

1. [アラート生成のフロー](#アラート生成のフロー)
2. [アラート一覧取得のフロー](#アラート一覧取得のフロー)
3. [アラート解決のフロー](#アラート解決のフロー)
4. [エラーハンドリングフロー](#エラーハンドリングフロー)

---

## アラート生成のフロー

### 概要

**ユースケース**: 照合処理完了時に不一致が検出された場合、アラートを生成する

**アクター**: 照合処理（FR-013）

**前提条件**:

- 照合処理が完了している
- 照合結果のステータスが`UNMATCHED`または`PARTIAL`

**成功時の結果**:

- アラートが生成される
- アラートがJSON形式で永続化される
- 重複アラートは生成されない

### 正常系フロー（金額不一致アラート）

```mermaid
sequenceDiagram
    participant RC as ReconcileCreditCardUseCase<br/>(FR-013)
    participant CA as CreateAlertUseCase
    participant AS as AlertService
    participant AR as AlertRepository
    participant RR as ReconciliationRepository
    participant Entity as Alert

    Note over RC,Entity: 照合処理完了後、不一致が検出された場合

    RC->>CA: execute({reconciliationId})

    CA->>RR: findById(reconciliationId)
    RR-->>CA: Reconciliation{status: UNMATCHED, results: [...]}

    CA->>CA: checkDuplicateAlert(reconciliationId)
    CA->>AR: findByReconciliationId(reconciliationId)
    AR-->>CA: Alert|null

    alt 重複アラートが存在しない
        CA->>AS: createAlertFromReconciliation(reconciliation)

        AS->>AS: analyzeReconciliationResult(reconciliation)
        AS->>AS: 照合結果を分析してアラート種別を判定
        AS-->>AS: AlertType.AMOUNT_MISMATCH

        AS->>AS: determineAlertLevel(AMOUNT_MISMATCH, details)
        AS-->>AS: AlertLevel.WARNING

        AS->>AS: buildAlertMessage(AMOUNT_MISMATCH, details)
        AS-->>AS: "クレジットカード引落額が一致しません..."

        AS->>AS: buildAlertActions(AMOUNT_MISMATCH)
        AS-->>AS: AlertAction[{VIEW_DETAILS, MANUAL_MATCH, MARK_RESOLVED}]

        AS->>AS: buildAmountMismatchAlert(reconciliation)
        AS-->>CA: Alert{type: AMOUNT_MISMATCH, level: WARNING, ...}

        CA->>Entity: create Alert from service result
        Entity-->>CA: alert entity

        CA->>AR: save(alert)
        AR->>AR: loadFromFile()
        AR->>AR: saveToFile(alerts)
        AR-->>CA: saved alert

        CA->>CA: toResponseDto(alert)
        CA-->>RC: Result.success(AlertResponseDto)

        Note over CA,RC: アラート生成完了<br/>照合処理は継続
    else 重複アラートが既に存在
        CA-->>RC: Result.failure(DuplicateAlertException)

        Note over CA,RC: 重複アラートは生成しない
    end
```

### ステップ詳細

1. **トリガー**
   - 照合処理（FR-013）完了後、照合結果のステータスが`UNMATCHED`の場合
   - 照合処理から`CreateAlertUseCase`を呼び出し（`reconciliationId`のみを渡す）

2. **照合結果取得**
   - 照合結果IDから照合データを取得
   - 照合結果の詳細（不一致情報等）を取得

3. **重複チェック**
   - 同じ照合結果に対するアラートが既に存在しないか確認
   - 既に存在する場合は新規生成しない

4. **アラート種別判定**
   - `AlertService.analyzeReconciliationResult()`で照合結果を分析
   - 照合結果のステータス、不一致詳細、経過日数等からアラート種別を自動判定

5. **アラート生成**
   - `AlertService`でアラートタイプに応じたアラートを生成
   - アラートレベル、メッセージ、アクションを設定

6. **永続化**
   - アラートをJSON形式で保存
   - 既存データがある場合は上書き

7. **レスポンス**
   - ResponseDTO: `AlertResponseDto`
   - 照合処理に成功結果を返却

---

## アラート一覧取得のフロー

### 概要

**ユースケース**: アラート一覧を取得する

**アクター**: フロントエンド

**前提条件**:

- アラートデータが既に作成されている

### 正常系フロー

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant API as AlertController
    participant UC as GetAlertsUseCase
    participant AR as AlertRepository

    User->>FE: アラート一覧画面を開く

    FE->>API: GET /api/alerts?level=warning&status=unread

    API->>API: クエリパラメータ検証

    API->>UC: execute(query)

    UC->>AR: findAll(query)
    AR->>AR: loadFromFile()
    AR->>AR: filterByQuery(alerts, query)
    AR-->>UC: Alert[]

    UC->>UC: toListResponseDto(alerts)
    UC-->>API: Result.success(AlertListResponseDto)

    API-->>FE: 200 OK<br/>{success: true, data: {alerts: [...], total: 10, unreadCount: 5}}

    FE->>FE: UI更新（アラート一覧表示）
    FE-->>User: アラート一覧を表示
```

### ステップ詳細

1. **リクエスト受信**
   - エンドポイント: `GET /api/alerts`
   - クエリパラメータ: `level`, `status`, `cardId`, `billingMonth`等

2. **アラート取得**
   - クエリパラメータに基づいてアラートをフィルタリング
   - 未読件数も同時に計算

3. **レスポンス**
   - ResponseDTO: `AlertListResponseDto`
   - HTTPステータス: 200 OK

---

## アラート解決のフロー

### 概要

**ユースケース**: アラートを解決済みにする

**アクター**: フロントエンド

**前提条件**:

- アラートが存在する
- アラートが未解決である

### 正常系フロー

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant API as AlertController
    participant UC as ResolveAlertUseCase
    participant AR as AlertRepository
    participant Entity as Alert

    User->>FE: 「解決済みにする」ボタンをクリック

    FE->>FE: 解決理由を入力（オプション）
    FE->>API: PATCH /api/alerts/:id/resolve<br/>{resolvedBy: "user", resolutionNote: "手動で確認済み"}

    API->>API: リクエスト検証

    API->>UC: execute(id, dto)

    UC->>AR: findById(id)
    AR-->>UC: Alert

    alt アラートが存在し、未解決
        UC->>Entity: markAsResolved(resolvedBy, resolutionNote)
        Entity->>Entity: status = RESOLVED
        Entity->>Entity: resolvedAt = now()
        Entity-->>UC: updated alert

        UC->>AR: save(alert)
        AR->>AR: saveToFile(alerts)
        AR-->>UC: saved alert

        UC->>UC: toResponseDto(alert)
        UC-->>API: Result.success(AlertResponseDto)

        API-->>FE: 200 OK<br/>{success: true, data: alert}

        FE->>FE: UI更新（アラートを解決済みに変更）
        FE-->>User: 成功メッセージ表示
    else アラートが存在しない
        AR-->>UC: null
        UC-->>API: Result.failure(AlertNotFoundException)
        API-->>FE: 404 Not Found<br/>{error: "アラートが見つかりません"}
    else 既に解決済み
        UC->>Entity: markAsResolved(...)
        Entity-->>UC: AlertAlreadyResolvedException
        UC-->>API: Result.failure(AlertAlreadyResolvedException)
        API-->>FE: 422 Unprocessable Entity<br/>{error: "既に解決済みのアラートです"}
    end
```

### ステップ詳細

1. **リクエスト受信**
   - エンドポイント: `PATCH /api/alerts/:id/resolve`
   - RequestDTO: `ResolveAlertRequestDto`

2. **アラート取得**
   - アラートIDからアラートを取得

3. **解決処理**
   - アラートを解決済みに更新（`markAsResolved()`）
   - 解決情報（解決者、解決理由）を記録

4. **永続化**
   - 更新されたアラートを保存

5. **レスポンス**
   - ResponseDTO: `AlertResponseDto`
   - HTTPステータス: 200 OK

---

## エラーハンドリングフロー

### バリデーションエラー (400 Bad Request)

```mermaid
sequenceDiagram
    actor User
    participant API as AlertController
    participant UC as CreateAlertUseCase

    User->>API: POST /api/alerts<br/>{reconciliationId: "invalid"}

    API->>API: リクエスト検証
    API->>API: バリデーションエラー検出<br/>- reconciliationId: UUID形式ではない

    API-->>User: 400 Bad Request<br/>{<br/>  statusCode: 400,<br/>  message: "Validation failed",<br/>  errors: [{<br/>    field: "reconciliationId",<br/>    message: "reconciliationIdはUUID形式である必要があります"<br/>  }]<br/>}
```

### リソース未検出エラー (404 Not Found)

```mermaid
sequenceDiagram
    actor User
    participant API as AlertController
    participant UC as ResolveAlertUseCase
    participant AR as AlertRepository

    User->>API: PATCH /api/alerts/invalid-id/resolve

    API->>UC: execute("invalid-id", dto)

    UC->>AR: findById("invalid-id")
    AR-->>UC: null

    UC-->>API: Result.failure(AlertNotFoundException)
    API-->>User: 404 Not Found<br/>{<br/>  statusCode: 404,<br/>  message: "アラートが見つかりません",<br/>  errorCode: "AL001"<br/>}
```

### ビジネスロジックエラー (422 Unprocessable Entity)

```mermaid
sequenceDiagram
    actor User
    participant API as AlertController
    participant UC as ResolveAlertUseCase
    participant AR as AlertRepository
    participant Entity as Alert

    User->>API: PATCH /api/alerts/:id/resolve<br/>(既に解決済みのアラート)

    API->>UC: execute(id, dto)

    UC->>AR: findById(id)
    AR-->>UC: Alert{status: RESOLVED}

    UC->>Entity: markAsResolved(...)
    Entity-->>UC: AlertAlreadyResolvedException

    UC-->>API: Result.failure(AlertAlreadyResolvedException)
    API-->>User: 422 Unprocessable Entity<br/>{<br/>  statusCode: 422,<br/>  message: "既に解決済みのアラートです",<br/>  errorCode: "AL003"<br/>}
```

### 重複アラートエラー (422 Unprocessable Entity)

```mermaid
sequenceDiagram
    participant RC as ReconcileCreditCardUseCase
    participant CA as CreateAlertUseCase
    participant AR as AlertRepository

    RC->>CA: execute({reconciliationId})

    CA->>AR: findByReconciliationId(reconciliationId)
    AR-->>CA: Alert{id: "existing-alert-id"}

    CA->>CA: 重複アラート検出

    CA-->>RC: Result.failure(DuplicateAlertException)

    Note over CA,RC: 重複アラートは生成しない<br/>既存のアラートを返却するか、エラーとする
```

---

## アラート生成タイミングの詳細

### 照合処理からの自動生成

```mermaid
sequenceDiagram
    participant RC as ReconcileCreditCardUseCase
    participant RS as ReconciliationService
    participant CA as CreateAlertUseCase
    participant AS as AlertService
    participant AR as AlertRepository

    RC->>RS: reconcilePayment(cardSummary, bankTransactions)
    RS-->>RC: ReconciliationResult{isMatched: false, confidence: 0}

    RC->>RC: determineStatus(reconciliationResult)
    RC->>RC: status = UNMATCHED

    RC->>RC: save(reconciliation)

    alt 照合結果が不一致（UNMATCHED）
        RC->>CA: execute({reconciliationId})
        CA->>CA: アラート生成処理
        CA->>AS: createAlertFromReconciliation(reconciliation)
        AS->>AS: analyzeReconciliationResult(reconciliation)
        AS-->>AS: AlertType.AMOUNT_MISMATCH
        AS-->>CA: Alert
        CA->>AR: save(alert)
        AR-->>CA: saved alert
        CA-->>RC: Result.success(AlertResponseDto)

        Note over RC,CA: アラート生成完了<br/>照合処理は継続
    else 照合結果が一致（MATCHED）
        Note over RC: アラートは生成しない
    end
```

---

## チェックリスト

シーケンス図作成時の確認事項：

### 必須項目

- [x] 主要なユースケースのフローが記載されている
- [x] 正常系フローが記載されている
- [x] エラーハンドリングフローが記載されている
- [x] アクター、参加者が明確に定義されている

### 推奨項目

- [x] 前提条件が記載されている
- [x] 成功時の結果が記載されている
- [x] ステップ詳細が記載されている
- [x] 条件分岐（alt）が適切に記載されている
