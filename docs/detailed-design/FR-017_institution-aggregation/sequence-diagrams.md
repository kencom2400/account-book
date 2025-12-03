# シーケンス図

このドキュメントでは、金融機関別集計機能の処理フローをシーケンス図で記載しています。

## 目次

1. [金融機関別集計取得のフロー](#金融機関別集計取得のフロー)
2. [エラーハンドリングフロー](#エラーハンドリングフロー)

---

## 金融機関別集計取得のフロー

### 概要

**ユースケース**: 指定した期間の取引を金融機関ごとに集計し、機関別の収支状況を取得する

**アクター**: ユーザー（フロントエンド経由）

**前提条件**:

- 取引データが存在する（データが存在しない場合は空データを返す）
- 金融機関情報が存在する

**成功時の結果**:

- 金融機関別集計情報が取得される
- 口座別の内訳が取得される
- 残高情報が取得される

### 正常系フロー（全金融機関を対象）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController
    participant UC as CalculateInstitutionSummaryUseCase
    participant DS as InstitutionAggregationDomainService
    participant TRepo as TransactionRepository
    participant IRepo as InstitutionRepository
    participant DB as Database/File

    User->>FE: 金融機関別レポート画面を開く<br/>(2025-01-01 〜 2025-01-31を指定)
    FE->>FE: バリデーション<br/>(日付範囲の妥当性チェック)
    FE->>API: GET /api/aggregation/institution-summary?startDate=2025-01-01&endDate=2025-01-31

    API->>API: リクエスト検証<br/>(startDate, endDateの妥当性)
    API->>API: 日付文字列をDateオブジェクトに変換<br/>(new Date(query.startDate), new Date(query.endDate))
    API->>UC: execute(new Date('2025-01-01'), new Date('2025-01-31'), undefined)

    Note over UC: 金融機関情報取得
    UC->>IRepo: findAll()
    IRepo->>DB: データ読み込み
    DB-->>IRepo: InstitutionEntity[]
    IRepo-->>UC: InstitutionEntity[]

    Note over UC: 取引データ取得
    UC->>TRepo: findByDateRange(2025-01-01, 2025-01-31)
    TRepo->>DB: データ読み込み
    DB-->>TRepo: TransactionEntity[]
    TRepo-->>UC: TransactionEntity[]

    Note over UC: 集計処理
    UC->>DS: aggregateByInstitution(transactions, institutions)
    DS-->>UC: Map<string, InstitutionAggregationData><br/>(キーはinstitutionId)

    Note over UC: 各金融機関のサマリー構築
    loop 各金融機関
        UC->>DS: aggregateByAccount(transactions, accounts)
        DS-->>UC: Map<string, AccountAggregationData><br/>(キーはaccountId)
        UC->>UC: buildInstitutionSummary(institution, aggregationData, accounts)
        UC->>UC: buildAccountSummary(account, aggregationData)
    end

    Note over UC: DTO構築
    UC->>UC: toTransactionDto(entity)
    UC-->>API: InstitutionSummaryResponseDto

    API->>API: ResponseDTOに変換
    API-->>FE: 200 OK<br/>{InstitutionSummaryResponseDto}
    FE->>FE: UI更新<br/>(グラフ描画、サマリー表示)
    FE-->>User: 金融機関別レポート表示
```

### 正常系フロー（特定金融機関を選択）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController
    participant UC as CalculateInstitutionSummaryUseCase
    participant DS as InstitutionAggregationDomainService
    participant TRepo as TransactionRepository
    participant IRepo as InstitutionRepository
    participant DB as Database/File

    User->>FE: 金融機関別レポート画面を開く<br/>(2025-01-01 〜 2025-01-31、金融機関A・Bを選択)
    FE->>FE: バリデーション<br/>(日付範囲・金融機関IDの妥当性チェック)
    FE->>API: GET /api/aggregation/institution-summary?startDate=2025-01-01&endDate=2025-01-31&institutionIds=inst-001&institutionIds=inst-002

    API->>API: リクエスト検証<br/>(startDate, endDate, institutionIdsの妥当性)
    API->>API: 日付文字列をDateオブジェクトに変換<br/>(new Date(query.startDate), new Date(query.endDate))
    API->>UC: execute(new Date('2025-01-01'), new Date('2025-01-31'), ["inst-001", "inst-002"])

    Note over UC: 指定された金融機関情報取得
    UC->>IRepo: findByIds(["inst-001", "inst-002"])
    IRepo->>DB: データ読み込み
    DB-->>IRepo: InstitutionEntity[]
    IRepo-->>UC: InstitutionEntity[]

    Note over UC: 指定された金融機関の取引データ取得
    UC->>TRepo: findByInstitutionIdsAndDateRange(["inst-001", "inst-002"], 2025-01-01, 2025-01-31)
    TRepo->>DB: データ読み込み
    DB-->>TRepo: TransactionEntity[]
    TRepo-->>UC: TransactionEntity[]

    Note over UC: 集計処理
    UC->>DS: aggregateByInstitution(transactions, institutions)
    DS-->>UC: Map<string, InstitutionAggregationData>

    Note over UC: 各金融機関のサマリー構築
    loop 各金融機関
        UC->>DS: aggregateByAccount(transactions, accounts)
        DS-->>UC: Map<string, AccountAggregationData>
        UC->>UC: buildInstitutionSummary(institution, aggregationData, accounts)
    end

    UC-->>API: InstitutionSummaryResponseDto

    API-->>FE: 200 OK<br/>{InstitutionSummaryResponseDto}
    FE-->>User: 選択した金融機関のレポート表示
```

### ステップ詳細

1. **ユーザーアクション**
   - ユーザーが金融機関別レポート画面を開く
   - 集計期間を選択（開始日〜終了日）
   - 金融機関を選択（複数選択可、未選択の場合は全機関）

2. **Frontend バリデーション**
   - 日付範囲の形式チェック（ISO8601形式）
   - 開始日 <= 終了日のチェック
   - 金融機関IDの妥当性チェック（存在チェックはサーバー側で実施）

3. **API リクエスト**
   - エンドポイント: `GET /api/aggregation/institution-summary`
   - クエリパラメータ: `startDate` (Date), `endDate` (Date), `institutionIds` (string[], オプション)

4. **UseCase 実行**
   - 金融機関情報を取得（全機関または指定された機関）
   - 期間内の取引データを取得（全機関または指定された機関）
   - 金融機関ごとにグループ化
   - 各機関の収入・支出を集計
   - 口座別の集計
   - 残高情報を取得
   - DTOを構築

5. **Domain Service 実行**
   - `aggregateByInstitution()`: 金融機関別に集計
   - `aggregateByAccount()`: 口座別に集計
   - `calculateInstitutionBalance()`: 収支差額を計算

6. **レスポンス**
   - ResponseDTO: `InstitutionSummaryResponseDto`
   - HTTPステータス: 200 OK

### データが存在しない場合のフロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController
    participant UC as CalculateInstitutionSummaryUseCase
    participant TRepo as TransactionRepository
    participant IRepo as InstitutionRepository
    participant DB as Database/File

    User->>FE: 金融機関別レポート画面を開く<br/>(2025-01-01 〜 2025-01-31を指定)
    FE->>API: GET /api/aggregation/institution-summary?startDate=2025-01-01&endDate=2025-01-31

    API->>API: リクエスト検証<br/>(startDate, endDateの妥当性)
    API->>API: 日付文字列をDateオブジェクトに変換<br/>(new Date(query.startDate), new Date(query.endDate))
    API->>UC: execute(new Date('2025-01-01'), new Date('2025-01-31'), undefined)

    UC->>IRepo: findAll()
    IRepo->>DB: データ読み込み
    DB-->>IRepo: InstitutionEntity[]
    IRepo-->>UC: InstitutionEntity[]

    UC->>TRepo: findByDateRange(2025-01-01, 2025-01-31)
    TRepo->>DB: データ読み込み
    DB-->>TRepo: [] (空配列)
    TRepo-->>UC: [] (空配列)

    Note over UC: 金融機関が存在するが期間内に取引がない場合も<br/>正常な応答として処理（0埋めデータを返す）
    UC->>DS: aggregateByInstitution([], institutions)
    DS-->>UC: Map<string, InstitutionAggregationData><br/>(すべて0の集計データ)

    UC-->>API: InstitutionSummaryResponseDto<br/>{institutions: [{...totalIncome: 0, totalExpense: 0, periodBalance: 0, ...}]}

    API-->>FE: 200 OK<br/>{InstitutionSummaryResponseDto}
    FE->>FE: UI更新<br/>(「期間内に取引がありません」メッセージ表示)
    FE-->>User: 0埋めデータ表示
```

**重要**:

- 金融機関が存在するが期間内に取引がない場合：0埋めのデータを返す（フロントエンドは「処理されたがデータがなかった」と判断できる）
- 金融機関自体が存在しない場合：空配列を返す
- どちらの場合でも、500エラーではなく200 OKで返す。これは正常なシナリオの一つとして扱う。

---

## エラーハンドリングフロー

### バリデーションエラー（400 Bad Request）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController

    User->>FE: 金融機関別レポート画面を開く<br/>(開始日 > 終了日を指定)
    FE->>FE: バリデーション<br/>(開始日 > 終了日 を検出)
    FE->>API: GET /api/aggregation/institution-summary?startDate=2025-01-31&endDate=2025-01-01

    API->>API: リクエスト検証<br/>(開始日 > 終了日 を検出)
    API-->>FE: 400 Bad Request<br/>{success: false, message: "Validation failed",<br/>errors: [{field: "startDate", message: "Start date must be before or equal to end date"}]}
    FE-->>User: エラーメッセージ表示
```

### サーバーエラー（500 Internal Server Error）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController
    participant UC as CalculateInstitutionSummaryUseCase
    participant TRepo as TransactionRepository
    participant DB as Database/File

    User->>FE: 金融機関別レポート画面を開く<br/>(2025-01-01 〜 2025-01-31を指定)
    FE->>API: GET /api/aggregation/institution-summary?startDate=2025-01-01&endDate=2025-01-31

    API->>API: リクエスト検証<br/>(startDate, endDateの妥当性)
    API->>API: 日付文字列をDateオブジェクトに変換<br/>(new Date(query.startDate), new Date(query.endDate))
    API->>UC: execute(new Date('2025-01-01'), new Date('2025-01-31'), undefined)

    UC->>TRepo: findByDateRange(2025-01-01, 2025-01-31)
    TRepo->>DB: データ読み込み
    DB-->>TRepo: Error (DB接続失敗)
    TRepo-->>UC: throw DatabaseConnectionError

    UC-->>API: throw DatabaseConnectionError
    API->>API: エラーハンドリング<br/>(500 Internal Server Error)
    API-->>FE: 500 Internal Server Error<br/>{success: false, message: "Internal server error",<br/>code: "DATABASE_CONNECTION_ERROR"}
    FE-->>User: エラーメッセージ表示
```

### エラーレスポンス形式

すべてのエラーレスポンスは以下の共通形式に従う：

```typescript
interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  code?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  timestamp: string;
  path: string;
}
```

### エラー分類

| HTTPステータス | エラーコード                | 説明                   | 例                 |
| -------------- | --------------------------- | ---------------------- | ------------------ |
| 400            | `VALIDATION_ERROR`          | バリデーションエラー   | 開始日 > 終了日    |
| 500            | `DATABASE_CONNECTION_ERROR` | データベース接続エラー | DB接続失敗         |
| 500            | `INTERNAL_SERVER_ERROR`     | 予期しないエラー       | その他の内部エラー |

---

## チェックリスト

シーケンス図作成時の確認事項：

### 必須項目

- [x] 正常系フローが記載されている
- [x] 異常系フローが記載されている
- [x] 各ステップの説明が記載されている
- [x] エラーハンドリングが明確に示されている
- [x] データが存在しない場合の処理が明確

### 推奨項目

- [x] 前提条件が記載されている
- [x] 成功時の結果が記載されている
- [x] エラーレスポンス形式が明確

### 注意事項

- [x] 空配列（[]）は正常な応答として扱う（500エラーにしない）
- [x] エラーレスポンスは共通形式に準拠している
- [x] HTTPステータスコードが適切に使い分けられている
- [x] 金融機関選択の有無による処理の違いが明確
