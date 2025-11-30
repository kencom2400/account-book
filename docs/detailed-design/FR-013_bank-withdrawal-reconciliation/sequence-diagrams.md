# シーケンス図

このドキュメントでは、銀行引落額との自動照合機能の処理フローをシーケンス図で記載しています。

## 目次

1. [クレジットカード照合実行のフロー](#クレジットカード照合実行のフロー)
2. [照合結果一覧取得のフロー](#照合結果一覧取得のフロー)
3. [エラーハンドリングフロー](#エラーハンドリングフロー)

---

## クレジットカード照合実行のフロー

### 概要

**ユースケース**: クレジットカードの月別集計額と銀行引落額を照合する

**アクター**: フロントエンド（将来対応）、外部システム

**前提条件**:

- クレジットカードが登録済み
- 月別集計データが作成済み（FR-012）
- 銀行取引データが存在する

**成功時の結果**:

- 照合結果が作成される
- 一致・不一致が判定される
- 照合結果がJSON形式で永続化される
- 完全一致の場合は支払済ステータスに更新される

### 正常系フロー（完全一致）

```mermaid
sequenceDiagram
    actor User as 外部システム
    participant API as ReconciliationController
    participant UC as ReconcileCreditCardUseCase
    participant RS as ReconciliationService
    participant AR as AggregationRepository
    participant TR as TransactionRepository
    participant RR as ReconciliationRepository
    participant Entity as Reconciliation

    User->>API: POST /api/reconciliations<br/>{cardId, billingMonth}

    API->>API: リクエスト検証
    API->>UC: execute(dto)

    UC->>AR: findByCardAndMonth(cardId, billingMonth)
    AR-->>UC: MonthlyCardSummary{paymentDate, netPaymentAmount}

    alt カード月別集計データが見つからない
        AR-->>UC: null
        UC-->>API: Result.failure(CardSummaryNotFoundError)
        API-->>User: 404 Not Found<br/>{error: "カード請求データが見つかりません", code: "RC001"}
    end

    UC->>UC: 引落予定日 ± 3営業日の範囲を計算
    UC->>TR: findByDateRange(paymentDate ± 3営業日)
    TR-->>UC: TransactionEntity[]

    Note over UC,TR: 空配列（[]）は正常な応答<br/>照合対象がない場合は不一致として処理

    UC->>RS: reconcilePayment(cardSummary, bankTransactions)

    RS->>RS: filterByDateRange(transactions, paymentDate, 3営業日)
    RS-->>RS: candidates (日付範囲内の取引)

    RS->>RS: filterByAmount(candidates, netPaymentAmount)
    RS-->>RS: amountMatches (金額一致の取引)

    RS->>RS: filterByDescription(amountMatches, cardName)
    RS-->>RS: descriptionMatches (摘要一致の取引)

    alt 完全一致（1件のみ）
        RS->>RS: calculateConfidence(完全一致) = 100
        RS-->>UC: ReconciliationResult{isMatched: true, confidence: 100, bankTransaction}
    else 部分一致（金額・日付のみ一致）
        RS->>RS: calculateConfidence(部分一致) = 70
        RS-->>UC: ReconciliationResult{isMatched: false, confidence: 70, discrepancy}
    else 不一致
        RS->>RS: calculateConfidence(不一致) = 0
        RS->>RS: analyzeDiscrepancy(cardSummary, bankTransactions)
        RS-->>UC: ReconciliationResult{isMatched: false, confidence: 0, discrepancy}
    end

    UC->>Entity: create Reconciliation
    Entity-->>UC: reconciliation

    alt 完全一致（confidence = 100）
        UC->>Entity: markAsMatched()
        Entity->>Entity: status = MATCHED
        Note over UC,Entity: MonthlyCardSummaryのstatusも<br/>PAIDに更新（将来対応）
    else 部分一致（confidence = 70）
        UC->>Entity: markAsPartial()
        Entity->>Entity: status = PARTIAL
    else 不一致（confidence = 0）
        UC->>Entity: markAsUnmatched()
        Entity->>Entity: status = UNMATCHED
    end

    UC->>RR: save(reconciliation)
    RR-->>UC: saved reconciliation

    UC->>UC: toResponseDto(reconciliation)
    UC-->>API: Result.success(ReconciliationResponseDto)
    API-->>User: 201 Created<br/>{success: true, data: reconciliation}

    Note over UC,API: UseCaseでエンティティをDTOに変換<br/>Controllerはドメインエンティティを扱わない
```

### ステップ詳細

1. **リクエスト受信**
   - エンドポイント: `POST /api/reconciliations`
   - RequestDTO: `ReconcileCreditCardRequestDto`
   - バリデーション: cardId（UUID）、billingMonth（YYYY-MM）

2. **カード月別集計データ取得**
   - カードIDと請求月から月別集計データを取得
   - 引落予定日（paymentDate）、最終支払額（netPaymentAmount）を取得
   - データが存在しない場合は404エラー（RC001）

3. **銀行取引データ取得**
   - 引落予定日 ± 3営業日の範囲で銀行取引を取得
   - 営業日計算（土日を除外）
   - 空配列（[]）は正常な応答として扱い、照合対象がない場合は不一致（UNMATCHED）として処理
   - 外部システム（銀行APIなど）の障害やデータベース接続失敗など予期しないエラーの場合のみ502/503エラー（RC002）

4. **照合処理**
   - **日付範囲フィルタリング**: 引落予定日 ± 3営業日の範囲でフィルタ
   - **金額フィルタリング**: 銀行引落額 = カード請求額（完全一致）
   - **摘要フィルタリング**: 銀行取引の摘要にカード会社名が含まれるか判定
   - **信頼度スコアリング**:
     - 完全一致（金額・日付・摘要すべて一致）: confidence = 100
     - 部分一致（金額・日付のみ一致）: confidence = 70
     - 不一致: confidence = 0

5. **結果判定**
   - confidence = 100: ステータスを「MATCHED」に更新
   - confidence = 70: ステータスを「PARTIAL」に更新（要確認）
   - confidence = 0: ステータスを「UNMATCHED」に更新（アラート生成）

6. **永続化**
   - 照合結果をJSON形式で保存
   - 既存データがある場合は上書き（最新の結果を保持）

7. **レスポンス**
   - ResponseDTO: `ReconciliationResponseDto`
   - HTTPステータス: 201 Created

---

## 照合結果一覧取得のフロー

### 概要

**ユースケース**: 特定カードの照合結果を一覧取得

**アクター**: フロントエンド（将来対応）

**前提条件**:

- 照合データが既に作成されている

### 正常系フロー

```mermaid
sequenceDiagram
    actor User
    participant API as ReconciliationController
    participant RR as ReconciliationRepository

    User->>API: GET /api/reconciliations?cardId=xxx&startMonth=2025-01&endMonth=2025-03

    API->>API: クエリパラメータ検証

    API->>RR: findByCard(cardId, startMonth, endMonth)
    RR->>RR: loadFromFile()
    RR->>RR: filterByDateRange(startMonth, endMonth)
    RR-->>API: Reconciliation[]

    alt データが存在する
        API->>API: ResponseDTOに変換
        API-->>User: 200 OK<br/>{success: true, data: reconciliations}
    else データが存在しない
        API-->>User: 200 OK<br/>{success: true, data: []}
    end
```

### 詳細取得フロー

```mermaid
sequenceDiagram
    actor User
    participant API as ReconciliationController
    participant RR as ReconciliationRepository

    User->>API: GET /api/reconciliations/:id

    API->>RR: findById(id)
    RR-->>API: Reconciliation | null

    alt データが存在する
        API->>API: ResponseDTOに変換
        API-->>User: 200 OK<br/>{success: true, data: reconciliation}
    else データが存在しない
        API-->>User: 404 Not Found<br/>{error: "照合結果が見つかりません"}
    end
```

---

## エラーハンドリングフロー

### バリデーションエラー (400 Bad Request)

```mermaid
sequenceDiagram
    actor User
    participant API as ReconciliationController
    participant UC as UseCase

    User->>API: POST /api/reconciliations<br/>{cardId: "invalid", billingMonth: "2025-13"}

    API->>API: リクエスト検証
    API->>API: バリデーションエラー検出<br/>- cardId: UUID形式ではない<br/>- billingMonth: 無効な月

    API-->>User: 400 Bad Request<br/>{<br/>  statusCode: 400,<br/>  message: "Validation failed",<br/>  errors: [{<br/>    field: "cardId",<br/>    message: "cardIdはUUID形式である必要があります"<br/>  }, {<br/>    field: "billingMonth",<br/>    message: "billingMonthはYYYY-MM形式である必要があります"<br/>  }]<br/>}
```

**エラーレスポンス例**:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "cardId",
      "message": "cardIdはUUID形式である必要があります"
    },
    {
      "field": "billingMonth",
      "message": "billingMonthはYYYY-MM形式である必要があります"
    }
  ]
}
```

### カード月別集計データ未検出エラー (404 Not Found - RC001)

```mermaid
sequenceDiagram
    actor User
    participant API as Controller
    participant UC as UseCase
    participant AR as AggregationRepository

    User->>API: POST /api/reconciliations
    API->>UC: execute(dto)
    UC->>AR: findByCardAndMonth(cardId, billingMonth)
    AR-->>UC: null

    UC->>UC: CardSummaryNotFoundError生成（RC001）
    UC-->>API: Result.failure(CardSummaryNotFoundError)

    API->>API: エラーハンドリング
    API-->>User: 404 Not Found<br/>{<br/>  "success": false,<br/>  "statusCode": 404,<br/>  "message": "カード請求データが見つかりません",<br/>  "code": "RC001",<br/>  "cardId": "xxx",<br/>  "billingMonth": "2025-01"<br/>}
```

### 引落予定日が未来エラー (422 Unprocessable Entity - RC003)

```mermaid
sequenceDiagram
    participant UC as UseCase
    participant AR as AggregationRepository

    UC->>AR: findByCardAndMonth(cardId, billingMonth)
    AR-->>UC: MonthlyCardSummary{paymentDate: 2025-02-27}

    UC->>UC: 現在日付と比較<br/>paymentDate > 現在日付
    UC->>UC: InvalidPaymentDateError生成（RC003）
    UC-->>UC: Result.failure(InvalidPaymentDateError)
```

### 複数の候補取引が存在エラー (422 Unprocessable Entity - RC004)

```mermaid
sequenceDiagram
    participant UC as UseCase
    participant RS as ReconciliationService
    participant TR as TransactionRepository

    UC->>TR: findByDateRange(paymentDate ± 3営業日)
    TR-->>UC: TransactionEntity[]

    UC->>RS: reconcilePayment(cardSummary, transactions)
    RS->>RS: filterByAmount() → 2件の候補
    RS->>RS: filterByDescription() → 2件の候補（摘要一致）

    RS->>RS: 複数候補検出
    RS-->>UC: ReconciliationResult{isMatched: false, confidence: 0, multipleCandidates: true}

    UC->>UC: MultipleCandidateError生成（RC004）
    UC-->>UC: Result.failure(MultipleCandidateError)
```

### サーバーエラー (500 Internal Server Error)

```mermaid
sequenceDiagram
    participant API as Controller
    participant UC as UseCase
    participant RR as ReconciliationRepository

    API->>UC: execute(dto)
    UC->>RR: save(reconciliation)
    RR->>RR: 予期しないエラー発生<br/>(ファイル書き込み失敗等)
    RR--xUC: Error

    UC->>UC: エラーログ出力
    UC-->>API: Result.failure(InternalError)

    API->>API: エラーハンドリング
    API-->>API: 500 Internal Server Error<br/>{<br/>  statusCode: 500,<br/>  message: "サーバーエラーが発生しました"<br/>}
```

---

## 照合ロジック詳細

### 営業日計算

```mermaid
sequenceDiagram
    participant RS as ReconciliationService

    Note over RS: 例: 引落予定日 2025-02-27（木）、±3営業日

    RS->>RS: calculateBusinessDays(2025-02-24, 2025-03-04)
    RS->>RS: -3営業日: 2/24（月）, 2/25（火）, 2/26（水）
    RS->>RS: 2/27（木）: 引落予定日
    RS->>RS: +3営業日: 2/28（金）, 3/3（月）, 3/4（火）
    RS->>RS: 3/1（日）: 非営業日（除外）
    RS->>RS: 3/2（日）: 非営業日（除外）
    RS-->>RS: 範囲: 2025-02-24 〜 2025-03-04
```

### 照合マッチングフロー

```mermaid
sequenceDiagram
    participant RS as ReconciliationService

    RS->>RS: 銀行取引リスト（10件）

    RS->>RS: filterByDateRange() → 5件（日付範囲内）
    RS->>RS: filterByAmount() → 2件（金額一致）
    RS->>RS: filterByDescription() → 1件（摘要一致）

    alt 1件のみ（完全一致）
        RS->>RS: calculateConfidence() = 100
        RS-->>RS: ReconciliationResult{isMatched: true, confidence: 100}
    else 2件以上（複数候補）
        RS->>RS: 複数候補検出
        RS-->>RS: ReconciliationResult{isMatched: false, confidence: 0, multipleCandidates: true}
        Note over RS: UseCaseでMultipleCandidateError（RC004）を生成
    else 0件（不一致）
        RS->>RS: analyzeDiscrepancy()
        RS-->>RS: ReconciliationResult{isMatched: false, confidence: 0, discrepancy}
    end
```

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
- [x] 照合ロジックの詳細が記載されている
- [x] 営業日計算ロジックが明確
- [x] エラーコード（RC001-RC004）が明記されている

### 実装ガイド

- [x] 各ステップに説明が付与されている
- [x] 前提条件が明確
- [x] 成功時の結果が明確
- [x] エラーレスポンス例が記載されている
