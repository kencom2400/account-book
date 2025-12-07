# シーケンス図

このドキュメントでは、金融機関別資産残高表示機能の処理フローをシーケンス図で記載しています。

## 目次

1. [資産残高取得のフロー](#資産残高取得のフロー)
2. [エラーハンドリングフロー](#エラーハンドリングフロー)

---

## 資産残高取得のフロー

### 概要

**ユースケース**: 各金融機関の現在残高を集計し、総資産や機関別の構成比を取得する

**アクター**: ユーザー（フロントエンド経由）

**前提条件**:

- 金融機関情報が存在する（データが存在しない場合は空データを返す）
- 口座情報が存在する

**成功時の結果**:

- 資産残高情報が取得される
- 金融機関別の内訳が取得される
- 前月比の増減が取得される

### 正常系フロー（基準日: 今日）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController
    participant UC as CalculateAssetBalanceUseCase
    participant DS as AssetBalanceDomainService
    participant IRepo as InstitutionRepository
    participant DB as Database/File

    User->>FE: 資産残高画面を開く<br/>(基準日: 今日)
    FE->>FE: バリデーション<br/>(基準日の妥当性チェック)
    FE->>API: GET /api/aggregation/asset-balance

    API->>API: リクエスト検証<br/>(asOfDateの妥当性、未指定の場合は今日)
    API->>API: 基準日をDateオブジェクトに変換<br/>(asOfDate || new Date())
    API->>UC: execute(asOfDate)

    Note over UC: 金融機関情報取得
    UC->>IRepo: findAll()
    IRepo->>DB: データ読み込み
    DB-->>IRepo: InstitutionEntity[]
    IRepo-->>UC: InstitutionEntity[]

    Note over UC: 資産・負債の分類
    UC->>DS: classifyAssetsAndLiabilities(institutions)
    DS->>DS: 各口座の残高を確認<br/>(balance >= 0: 資産, balance < 0: 負債)
    DS-->>UC: AssetClassification<br/>{totalAssets, totalLiabilities, netWorth}

    Note over UC: 金融機関別資産情報構築
    loop 各金融機関
        UC->>UC: buildInstitutionAsset(institution)
        loop 各口座
            UC->>UC: buildAccountAsset(account)
        end
        UC->>DS: calculatePercentage(institutionTotal, grandTotal)
        DS-->>UC: percentage
    end

    Note over UC: 前月比計算
    UC->>IRepo: 前月同日の残高を取得<br/>(将来対応: 履歴データから取得)
    Note over UC: 現時点では前月比は0で返す<br/>(履歴データ未実装のため)
    UC->>UC: calculateComparison(current, previous)
    UC-->>UC: AssetComparisonDto<br/>{diff: 0, rate: 0}

    Note over UC: DTO構築
    UC-->>API: AssetBalanceResponseDto

    API->>API: ResponseDTOに変換
    API-->>FE: 200 OK<br/>{AssetBalanceResponseDto}
    FE->>FE: UI更新<br/>(総資産カード、機関別リスト、グラフ描画)
    FE-->>User: 資産残高表示
```

### 正常系フロー（基準日: 指定日）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController
    participant UC as CalculateAssetBalanceUseCase
    participant DS as AssetBalanceDomainService
    participant IRepo as InstitutionRepository
    participant DB as Database/File

    User->>FE: 資産残高画面を開く<br/>(基準日: 2025-01-15を指定)
    FE->>FE: バリデーション<br/>(基準日の妥当性チェック)
    FE->>API: GET /api/aggregation/asset-balance?asOfDate=2025-01-15

    API->>API: リクエスト検証<br/>(asOfDateの妥当性)
    API->>API: 基準日をDateオブジェクトに変換<br/>(new Date('2025-01-15'))
    API->>UC: execute(new Date('2025-01-15'))

    Note over UC: 金融機関情報取得
    UC->>IRepo: findAll()
    IRepo->>DB: データ読み込み
    DB-->>IRepo: InstitutionEntity[]
    IRepo-->>UC: InstitutionEntity[]

    Note over UC: 資産・負債の分類
    UC->>DS: classifyAssetsAndLiabilities(institutions)
    DS-->>UC: AssetClassification

    Note over UC: 金融機関別資産情報構築
    loop 各金融機関
        UC->>UC: buildInstitutionAsset(institution)
        UC->>DS: calculatePercentage(institutionTotal, grandTotal)
        DS-->>UC: percentage
    end

    Note over UC: 前月比計算
    UC->>IRepo: 前月同日の残高を取得<br/>(将来対応)
    Note over UC: 現時点では前月比は0で返す
    UC->>UC: calculateComparison(current, previous)

    UC-->>API: AssetBalanceResponseDto

    API-->>FE: 200 OK<br/>{AssetBalanceResponseDto}
    FE-->>User: 指定日の資産残高表示
```

### ステップ詳細

1. **ユーザーアクション**
   - ユーザーが資産残高画面を開く
   - 基準日を選択（デフォルト: 今日）

2. **Frontend バリデーション**
   - 基準日の形式チェック（ISO8601形式）
   - 基準日の妥当性チェック（未来日でないか）

3. **API リクエスト**
   - エンドポイント: `GET /api/aggregation/asset-balance`
   - クエリパラメータ: `asOfDate` (string, オプション、デフォルト: 今日)

4. **Use Case 実行**
   - すべての金融機関情報を取得
   - 各口座の残高を集計
   - 資産と負債に分類
   - 純資産を計算
   - 構成比を計算
   - 前月比を計算（将来対応: 履歴データから取得）

5. **DTO構築**
   - `AssetBalanceResponseDto`を構築
   - 金融機関別資産情報を構築
   - 口座別資産情報を構築

6. **レスポンス**
   - 200 OKでレスポンスを返す
   - データが存在しない場合は空配列を返す（500エラーにしない）

---

## エラーハンドリングフロー

### バリデーションエラー（400 Bad Request）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController
    participant VP as ValidationPipe

    User->>FE: 資産残高画面を開く<br/>(基準日: 無効な形式)
    FE->>FE: バリデーション<br/>(基準日の形式チェック)
    FE->>API: GET /api/aggregation/asset-balance?asOfDate=invalid-date

    API->>VP: リクエスト検証
    VP->>VP: asOfDateの形式チェック<br/>(ISO8601形式)
    VP-->>API: バリデーションエラー<br/>(400 Bad Request)

    API-->>FE: 400 Bad Request<br/>{success: false, message: "Validation failed", errors: [...]}
    FE->>FE: エラーメッセージ表示
    FE-->>User: エラーメッセージを表示
```

### サーバーエラー（500 Internal Server Error）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController
    participant UC as CalculateAssetBalanceUseCase
    participant IRepo as InstitutionRepository
    participant DB as Database/File

    User->>FE: 資産残高画面を開く
    FE->>API: GET /api/aggregation/asset-balance

    API->>UC: execute(asOfDate)

    UC->>IRepo: findAll()
    IRepo->>DB: データ読み込み
    DB-->>IRepo: データベース接続エラー

    IRepo-->>UC: 例外をスロー<br/>(DatabaseConnectionError)
    UC-->>API: 例外をスロー

    API->>API: 例外ハンドラーで捕捉
    API-->>FE: 500 Internal Server Error<br/>{success: false, message: "Internal server error", code: "DATABASE_CONNECTION_ERROR"}

    FE->>FE: エラーメッセージ表示
    FE-->>User: エラーメッセージを表示
```

### データ未検出（200 OK with empty data）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant FE as Frontend
    participant API as AggregationController
    participant UC as CalculateAssetBalanceUseCase
    participant IRepo as InstitutionRepository
    participant DB as Database/File

    User->>FE: 資産残高画面を開く
    FE->>API: GET /api/aggregation/asset-balance

    API->>UC: execute(asOfDate)

    UC->>IRepo: findAll()
    IRepo->>DB: データ読み込み
    DB-->>IRepo: InstitutionEntity[] (空配列)

    IRepo-->>UC: InstitutionEntity[] (空配列)

    Note over UC: 金融機関が存在しない場合<br/>空データを返す（エラーにしない）
    UC->>UC: 空のAssetBalanceResponseDtoを構築<br/>{totalAssets: 0, totalLiabilities: 0, netWorth: 0, institutions: []}

    UC-->>API: AssetBalanceResponseDto (空データ)

    API-->>FE: 200 OK<br/>{success: true, data: {totalAssets: 0, institutions: []}}
    FE->>FE: 空データ表示<br/>("データがありません"メッセージ)
    FE-->>User: 空データメッセージを表示
```

**重要**: 金融機関が存在しない場合でも、500エラーではなく200 OKで空データを返す。これは正常なシナリオの一つとして扱う。

---

## チェックリスト

シーケンス図作成時の確認事項：

### 必須項目

- [x] 正常系フローが記載されている
- [x] エラーハンドリングフローが記載されている
- [x] 各ステップの説明が明確
- [x] アクターと参加者が明確

### 推奨項目

- [x] 複数のシナリオ（基準日指定/未指定）が記載されている
- [x] エラーレスポンス形式が明確
- [x] データ未検出時の処理が明確（200 OKで空データを返す）

### 注意事項

- [x] エラーハンドリングが適切に実装されている
- [x] 空データは正常な応答として扱う（500エラーにしない）
- [x] 前月比計算は将来対応として明記（履歴データ未実装のため）
