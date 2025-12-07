# シーケンス図

このドキュメントでは、カテゴリ別円グラフ表示機能の処理フローをシーケンス図で記載しています。

## 目次

1. [カテゴリ別円グラフ表示のフロー](#カテゴリ別円グラフ表示のフロー)
2. [エラーハンドリングフロー](#エラーハンドリングフロー)

---

## カテゴリ別円グラフ表示のフロー

### 概要

**ユースケース**: 指定した期間のカテゴリ別集計データを円グラフ（ドーナツチャート）で表示する

**アクター**: ユーザー

**前提条件**:

- ダッシュボードページが表示されている
- 既存のFR-018 APIが利用可能

**成功時の結果**:

- カテゴリ別円グラフが表示される
- 凡例が表示される
- インタラクティブな操作（ホバー、クリック）が可能

### 正常系フロー（全カテゴリ表示）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Page as DashboardPage
    participant Container as CategoryPieChartContainer
    participant Component as CategoryPieChart
    participant API as aggregationApi
    participant Backend as AggregationController
    participant UseCase as CalculateCategoryAggregationUseCase
    participant DB as Database

    User->>Page: ダッシュボードページを開く
    Page->>Container: CategoryPieChartContainerをレンダリング<br/>(デフォルト期間: 当月)

    Note over Container: 初期化
    Container->>Container: useStateで状態を初期化<br/>(startDate, endDate, data, loading, error)

    Container->>Container: useEffectでデータ取得をトリガー

    Note over Container: データ取得
    Container->>API: getCategoryAggregation(startDate, endDate, undefined)
    API->>Backend: GET /api/aggregation/category?startDate=2025-01-01&endDate=2025-01-31
    Backend->>UseCase: execute(startDate, endDate, undefined)
    UseCase->>DB: 取引データを取得
    DB-->>UseCase: TransactionEntity[]
    UseCase->>UseCase: カテゴリ別集計を計算
    UseCase-->>Backend: CategoryAggregationResponseDto[]
    Backend-->>API: 200 OK {success: true, data: [...]}
    API-->>Container: CategoryAggregationResponseDto[]

    Container->>Container: setData(data)<br/>setLoading(false)
    Container->>Component: dataをpropsで渡す

    Note over Component: データ変換
    Component->>Component: transformToPieChartData(data)
    Note over Component: 各カテゴリタイプごとに<br/>PieChartData[]に変換

    Note over Component: グラフ描画
    Component->>Component: render()
    Component->>Component: PieChartコンポーネントを描画
    Component->>Component: 各セグメントに色を割り当て<br/>(getColorForCategory)
    Component->>Component: 凡例を描画
    Component-->>Page: 円グラフを表示
    Page-->>User: カテゴリ別円グラフが表示される
```

### 正常系フロー（特定カテゴリのみ表示）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Page as DashboardPage
    participant Container as CategoryPieChartContainer
    participant Component as CategoryPieChart
    participant API as aggregationApi
    participant Backend as AggregationController
    participant UseCase as CalculateCategoryAggregationUseCase
    participant DB as Database

    User->>Page: ダッシュボードページを開く
    Page->>Container: CategoryPieChartContainerをレンダリング

    User->>Component: カテゴリタイプを選択<br/>(例: EXPENSE)
    Component->>Container: onCategoryTypeChange(EXPENSE)
    Container->>Container: setCategoryType(EXPENSE)
    Container->>Container: useEffectでデータ再取得をトリガー

    Container->>API: getCategoryAggregation(startDate, endDate, EXPENSE)
    API->>Backend: GET /api/aggregation/category?startDate=2025-01-01&endDate=2025-01-31&categoryType=EXPENSE
    Backend->>UseCase: execute(startDate, endDate, EXPENSE)
    UseCase->>DB: EXPENSEカテゴリの取引データを取得
    DB-->>UseCase: TransactionEntity[] (EXPENSEのみ)
    UseCase->>UseCase: EXPENSEカテゴリのみ集計
    UseCase-->>Backend: CategoryAggregationResponseDto[] ([EXPENSE])
    Backend-->>API: 200 OK {success: true, data: [{categoryType: "EXPENSE", ...}]}
    API-->>Container: CategoryAggregationResponseDto[]

    Container->>Container: setData(data)
    Container->>Component: dataをpropsで渡す

    Component->>Component: transformToPieChartData(data)
    Note over Component: EXPENSEカテゴリの<br/>サブカテゴリごとにセグメントを作成

    Component->>Component: render()
    Component-->>Page: 支出カテゴリの円グラフを表示
    Page-->>User: 支出カテゴリ別円グラフが表示される
```

### インタラクションフロー（ホバー）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Component as CategoryPieChart
    participant PieChart as Recharts PieChart
    participant Tooltip as CustomTooltip

    User->>PieChart: セグメントにマウスホバー
    PieChart->>Component: onMouseEnter(data)
    Component->>Component: handleSegmentHover(data, true)
    Component->>PieChart: セグメントをハイライト
    PieChart->>Tooltip: ツールチップを表示
    Tooltip->>Tooltip: カテゴリ名、金額、割合を表示
    Tooltip-->>User: ツールチップが表示される
```

### インタラクションフロー（クリック - 将来対応）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Component as CategoryPieChart
    participant PieChart as Recharts PieChart

    User->>PieChart: セグメントをクリック
    PieChart->>Component: onClick(data)
    Component->>Component: handleSegmentClick(data)
    Note over Component: 将来対応: ドリルダウン機能<br/>サブカテゴリの詳細表示
    Component-->>User: （将来対応）
```

### ステップ詳細

1. **ユーザーアクション**
   - ユーザーがダッシュボードページを開く
   - デフォルトで当月のデータが表示される

2. **Container 初期化**
   - `CategoryPieChartContainer`がマウントされる
   - デフォルト期間（当月）を設定
   - `useEffect`でデータ取得をトリガー

3. **データ取得**
   - `aggregationApi.getCategoryAggregation()`を呼び出し
   - 既存のFR-018 APIエンドポイントを使用
   - レスポンスを`CategoryAggregationResponseDto[]`として受け取る

4. **データ変換**
   - `transformToPieChartData()`でAPIレスポンスをグラフ用データに変換
   - 各カテゴリタイプごとにセグメントを作成
   - 色を割り当て（`getColorForCategory()`）

5. **グラフ描画**
   - Rechartsの`PieChart`コンポーネントを使用
   - 各セグメントを`Cell`コンポーネントで描画
   - `Tooltip`と`Legend`を表示

6. **インタラクション**
   - ホバー時: ツールチップを表示
   - クリック時: 将来対応（ドリルダウン機能）

### データが存在しない場合のフロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Page as DashboardPage
    participant Container as CategoryPieChartContainer
    participant Component as CategoryPieChart
    participant API as aggregationApi
    participant Backend as AggregationController

    User->>Page: ダッシュボードページを開く
    Page->>Container: CategoryPieChartContainerをレンダリング

    Container->>API: getCategoryAggregation(startDate, endDate, undefined)
    API->>Backend: GET /api/aggregation/category?startDate=2025-01-01&endDate=2025-01-31
    Backend-->>API: 200 OK {success: true, data: [{totalAmount: 0, ...}, ...]}
    API-->>Container: CategoryAggregationResponseDto[] (空データ)

    Container->>Container: setData(data)
    Container->>Component: dataをpropsで渡す

    Component->>Component: transformToPieChartData(data)
    Note over Component: すべてのtotalAmountが0の場合
    Component->>Component: 空データを検出
    Component-->>Page: 「データがありません」メッセージを表示
    Page-->>User: 空データメッセージが表示される
```

**重要**: データが存在しない場合でも、エラーではなく空データメッセージを表示する。これは正常なシナリオの一つとして扱う。

---

## エラーハンドリングフロー

### APIエラー（500 Internal Server Error）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Page as DashboardPage
    participant Container as CategoryPieChartContainer
    participant Component as CategoryPieChart
    participant API as aggregationApi
    participant Backend as AggregationController

    User->>Page: ダッシュボードページを開く
    Page->>Container: CategoryPieChartContainerをレンダリング

    Container->>API: getCategoryAggregation(startDate, endDate, undefined)
    API->>Backend: GET /api/aggregation/category?startDate=2025-01-01&endDate=2025-01-31
    Backend-->>API: 500 Internal Server Error<br/>{success: false, message: "Internal server error"}
    API-->>Container: throw Error("API request failed")

    Container->>Container: setError("データの取得に失敗しました")<br/>setLoading(false)
    Container->>Component: errorをpropsで渡す

    Component->>Component: render()
    Component-->>Page: エラーメッセージを表示
    Page-->>User: エラーメッセージが表示される
```

### バリデーションエラー（400 Bad Request）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Page as DashboardPage
    participant Container as CategoryPieChartContainer
    participant API as aggregationApi
    participant Backend as AggregationController

    User->>Page: ダッシュボードページを開く
    User->>Container: 無効な期間を指定<br/>(開始日 > 終了日)
    Container->>Container: バリデーション<br/>(開始日 > 終了日 を検出)
    Container->>Container: setError("開始日は終了日より前である必要があります")
    Container-->>Page: エラーメッセージを表示
    Page-->>User: バリデーションエラーメッセージが表示される

    Note over Container: API呼び出しは実行されない
```

### エラーハンドリング実装

- **APIエラー**: `try-catch`でエラーをキャッチし、エラーメッセージを表示
- **バリデーションエラー**: フロントエンドで事前にバリデーションを実行
- **ローディング状態**: データ取得中はローディングインジケーターを表示
- **リトライ機能**: 将来対応（必要に応じて実装）

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
- [x] インタラクションフローが明確

### 注意事項

- [x] 既存API（FR-018）との関係が明確
- [x] 空データは正常な応答として扱う（エラーにしない）
- [x] エラーハンドリングが適切に実装されている
