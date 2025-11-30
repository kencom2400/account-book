# シーケンス図

このドキュメントでは、クレジットカード月別集計機能の処理フローをシーケンス図で記載しています。

## 目次

1. [カード利用明細の月別集計のフロー](#カード利用明細の月別集計のフロー)
2. [月別集計一覧取得のフロー](#月別集計一覧取得のフロー)
3. [エラーハンドリングフロー](#エラーハンドリングフロー)

---

## カード利用明細の月別集計のフロー

### 概要

**ユースケース**: カード利用明細を月別に集計する

**アクター**: フロントエンド（将来対応）、外部システム

**前提条件**:

- クレジットカードが登録済み
- 締め日・支払日が設定済み
- 指定期間内に取引データが存在する

**成功時の結果**:

- 月別集計データが作成される
- 請求月、カテゴリ別内訳、支払額が正しく算出される
- 集計データがJSON形式で永続化される

### 正常系フロー

```mermaid
sequenceDiagram
    actor User as 外部システム
    participant API as AggregationController
    participant UC as AggregateCardTransactionsUseCase
    participant Calc as BillingPeriodCalculator
    participant CardRepo as CreditCardRepository
    participant TxRepo as TransactionRepository
    participant AggRepo as AggregationRepository
    participant Entity as MonthlyCardSummary

    User->>API: POST /api/aggregation/card/monthly<br/>{cardId, startMonth, endMonth}

    API->>API: リクエスト検証
    API->>UC: execute(dto)

    UC->>CardRepo: findById(cardId)
    CardRepo-->>UC: CreditCard{closingDay, paymentDay}

    alt カードが見つからない
        CardRepo-->>UC: null
        UC-->>API: Result.failure(CardNotFoundError)
        API-->>User: 404 Not Found<br/>{error: "カードが見つかりません"}
    end

    UC->>UC: 期間を日付範囲に変換<br/>(startMonth, endMonth → startDate, endDate)
    UC->>TxRepo: findByCardId(cardId, startDate, endDate)
    TxRepo-->>UC: Transaction[]

    alt 取引データが存在しない
        TxRepo-->>UC: []
        UC-->>API: Result.failure(NoTransactionsError)
        API-->>User: 404 Not Found<br/>{error: "明細データが存在しません"}
    end

    UC->>UC: 取引を請求月別にグループ化
    loop 各取引
        UC->>Calc: determineBillingMonth(tx.date, closingDay)
        Calc-->>UC: billingMonth (YYYY-MM)
    end

    UC->>UC: グループ化結果<br/>Map<billingMonth, Transaction[]>

    loop 各請求月
        UC->>UC: カテゴリ別集計<br/>totalAmount, categoryBreakdown計算

        UC->>Calc: calculateClosingDate(billingMonth, closingDay)
        Calc-->>UC: closingDate

        UC->>Calc: calculatePaymentDate(closingDate, paymentDay)
        Calc-->>UC: paymentDate

        UC->>Entity: create MonthlyCardSummary
        Entity-->>UC: summary

        UC->>AggRepo: save(summary)
        AggRepo-->>UC: saved summary
    end

    Note over UC: 割引は初期実装では未対応<br/>（FR-013実装時に対応予定）

    UC->>UC: toResponseDto(summaries)
    UC-->>API: Result.success(MonthlyCardSummaryResponseDto[])
    API-->>User: 201 Created<br/>{success: true, data: summaries}

    Note over UC,API: UseCaseでエンティティをDTOに変換<br/>ControllerはドメインエンティティをAPI扱わない
```

### ステップ詳細

1. **リクエスト受信**
   - エンドポイント: `POST /api/aggregation/card/monthly`
   - RequestDTO: `AggregateCardTransactionsRequestDto`
   - バリデーション: cardId（UUID）、startMonth/endMonth（YYYY-MM）、期間（最大12ヶ月）

2. **カード情報取得**
   - カードIDからクレジットカード情報を取得
   - 締め日（closingDay）、支払日（paymentDay）を取得
   - カードが存在しない場合は404エラー

3. **取引データ取得**
   - 指定期間（startMonth〜endMonth）の取引データを取得
   - 期間を日付範囲に変換（例: 2025-01 → 2025-01-01〜2025-01-31）
   - 取引が存在しない場合は404エラー

4. **請求月別グループ化**
   - 各取引の日付と締め日を比較
   - 取引日 <= 締め日 → 当月請求
   - 取引日 > 締め日 → 翌月請求
   - 請求月をキーとしてグループ化

5. **月別集計**
   - 各請求月ごとに集計処理
   - 合計金額、取引件数を計算
   - カテゴリ別内訳を作成
   - 締め日・支払日を算出

6. **支払額計算**
   - ポイント利用・キャッシュバックを控除
   - netPaymentAmount = totalAmount - sum(discounts)
   - 0円未満にはならない（Math.max(0, result)）

7. **永続化**
   - 月別集計データをJSON形式で保存
   - 既存データがある場合は更新

8. **レスポンス**
   - ResponseDTO: `MonthlyCardSummaryResponseDto[]`
   - HTTPステータス: 201 Created

---

## 月別集計一覧取得のフロー

### 概要

**ユースケース**: 特定カードの月別集計データを一覧取得

**アクター**: フロントエンド（将来対応）

**前提条件**:

- 集計データが既に作成されている

### 正常系フロー

```mermaid
sequenceDiagram
    actor User
    participant API as AggregationController
    participant AggRepo as AggregationRepository

    User->>API: GET /api/aggregation/card/monthly?cardId=xxx&startMonth=2025-01&endMonth=2025-03

    API->>API: クエリパラメータ検証

    API->>AggRepo: findByCard(cardId, startMonth, endMonth)
    AggRepo->>AggRepo: loadFromFile()
    AggRepo->>AggRepo: filterByDateRange(startMonth, endMonth)
    AggRepo-->>API: MonthlyCardSummary[]

    alt データが存在する
        API->>API: ResponseDTOに変換
        API-->>User: 200 OK<br/>{success: true, data: summaries}
    else データが存在しない
        API-->>User: 200 OK<br/>{success: true, data: []}
    end
```

### 詳細取得フロー

```mermaid
sequenceDiagram
    actor User
    participant API as AggregationController
    participant AggRepo as AggregationRepository

    User->>API: GET /api/aggregation/card/monthly/:id

    API->>AggRepo: findById(id)
    AggRepo-->>API: MonthlyCardSummary | null

    alt データが存在する
        API->>API: ResponseDTOに変換
        API-->>User: 200 OK<br/>{success: true, data: summary}
    else データが存在しない
        API-->>User: 404 Not Found<br/>{error: "集計データが見つかりません"}
    end
```

---

## エラーハンドリングフロー

### バリデーションエラー (400 Bad Request)

```mermaid
sequenceDiagram
    actor User
    participant API as AggregationController
    participant UC as UseCase

    User->>API: POST /api/aggregation/card/monthly<br/>{cardId: "invalid", startMonth: "2025-13"}

    API->>API: リクエスト検証
    API->>API: バリデーションエラー検出<br/>- cardId: UUID形式ではない<br/>- startMonth: 無効な月

    API-->>User: 400 Bad Request<br/>{<br/>  statusCode: 400,<br/>  message: "Validation failed",<br/>  errors: [{<br/>    field: "cardId",<br/>    message: "cardIdはUUID形式である必要があります"<br/>  }, {<br/>    field: "startMonth",<br/>    message: "startMonthはYYYY-MM形式である必要があります"<br/>  }]<br/>}
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
      "field": "startMonth",
      "message": "startMonthはYYYY-MM形式である必要があります"
    }
  ]
}
```

### カード未検出エラー (404 Not Found)

```mermaid
sequenceDiagram
    actor User
    participant API as Controller
    participant UC as UseCase
    participant CardRepo as CreditCardRepository

    User->>API: POST /api/aggregation/card/monthly
    API->>UC: execute(dto)
    UC->>CardRepo: findById(cardId)
    CardRepo-->>UC: null

    UC->>UC: CardNotFoundError生成
    UC-->>API: Result.failure(CardNotFoundError)

    API->>API: エラーハンドリング
    API-->>User: 404 Not Found<br/>{<br/>  "success": false,<br/>  "statusCode": 404,<br/>  "message": "カードが見つかりません",<br/>  "cardId": "xxx"<br/>}
```

### 取引データ不存在エラー (404 Not Found)

```mermaid
sequenceDiagram
    participant UC as UseCase
    participant TxRepo as TransactionRepository

    UC->>TxRepo: findByCardId(cardId, startDate, endDate)
    TxRepo-->>UC: []

    UC->>UC: NoTransactionsError生成
    UC-->>UC: Result.failure(NoTransactionsError)
```

### サーバーエラー (500 Internal Server Error)

```mermaid
sequenceDiagram
    participant API as Controller
    participant UC as UseCase
    participant AggRepo as Repository

    API->>UC: execute(dto)
    UC->>AggRepo: save(summary)
    AggRepo->>AggRepo: 予期しないエラー発生<br/>(ファイル書き込み失敗等)
    AggRepo--xUC: Error

    UC->>UC: エラーログ出力
    UC-->>API: Result.failure(InternalError)

    API->>API: エラーハンドリング
    API-->>API: 500 Internal Server Error<br/>{<br/>  statusCode: 500,<br/>  message: "サーバーエラーが発生しました"<br/>}
```

---

## 請求月判定ロジック詳細

### 月末締めの場合

```mermaid
sequenceDiagram
    participant UC as UseCase
    participant Calc as BillingPeriodCalculator

    Note over UC,Calc: 例: 締め日31日（月末締め）

    UC->>Calc: determineBillingMonth(2025-01-15, 31)
    Calc->>Calc: 1月15日 <= 1月31日
    Calc-->>UC: "2025-01"

    UC->>Calc: determineBillingMonth(2025-02-28, 31)
    Calc->>Calc: 2月28日 <= 2月末日
    Calc-->>UC: "2025-02"

    UC->>Calc: determineBillingMonth(2025-03-01, 31)
    Calc->>Calc: 3月1日 <= 3月31日
    Calc-->>UC: "2025-03"
```

### 15日締めの場合

```mermaid
sequenceDiagram
    participant UC as UseCase
    participant Calc as BillingPeriodCalculator

    Note over UC,Calc: 例: 締め日15日

    UC->>Calc: determineBillingMonth(2025-01-10, 15)
    Calc->>Calc: 1月10日 <= 1月15日
    Calc-->>UC: "2025-01"

    UC->>Calc: determineBillingMonth(2025-01-20, 15)
    Calc->>Calc: 1月20日 > 1月15日 → 翌月
    Calc-->>UC: "2025-02"

    UC->>Calc: determineBillingMonth(2025-12-25, 15)
    Calc->>Calc: 12月25日 > 12月15日 → 翌年1月
    Calc-->>UC: "2026-01"
```

---

## 支払額計算フロー

```mermaid
sequenceDiagram
    participant UC as UseCase
    participant Entity as MonthlyCardSummary

    UC->>Entity: create(data)
    Entity->>Entity: totalAmount = 50000円
    Entity-->>UC: summary

    UC->>Entity: addDiscount({type: POINT, amount: 5000})
    Entity->>Entity: discounts.push(discount)

    UC->>Entity: addDiscount({type: CASHBACK, amount: 1000})
    Entity->>Entity: discounts.push(discount)

    UC->>Entity: calculateNetPayment()
    Entity->>Entity: sum(discounts) = 6000円
    Entity->>Entity: netPayment = 50000 - 6000 = 44000円
    Entity->>Entity: Math.max(0, netPayment)
    Entity-->>UC: 44000円
```

---

## パフォーマンス最適化

### キャッシング戦略（将来対応）

```mermaid
sequenceDiagram
    participant API as Controller
    participant Cache as Cache
    participant UC as UseCase
    participant AggRepo as Repository

    API->>Cache: get(cacheKey)

    alt キャッシュヒット
        Cache-->>API: データ
        API-->>API: レスポンス返却
    else キャッシュミス
        Cache-->>API: null
        API->>UC: execute(dto)
        UC->>AggRepo: findByCard(cardId, startMonth, endMonth)
        AggRepo-->>UC: データ
        UC-->>API: データ
        API->>Cache: set(cacheKey, data, ttl: 3600)
        API-->>API: レスポンス返却
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
- [x] 計算ロジックの詳細が記載されている
- [x] 請求月判定ロジックが明確

### 実装ガイド

- [x] 各ステップに説明が付与されている
- [x] 前提条件が明確
- [x] 成功時の結果が明確
- [x] エラーレスポンス例が記載されている
