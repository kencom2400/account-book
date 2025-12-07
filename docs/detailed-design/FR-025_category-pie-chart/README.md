# カテゴリ別円グラフ表示機能 (FR-025) モジュール詳細設計書

**対象機能**:

- FR-025: カテゴリ別円グラフ表示

**作成日**: 2025-01-27
**最終更新日**: 2025-01-27
**バージョン**: 1.0

## 概要

このドキュメントは、カテゴリ別円グラフ表示機能 (FR-025) に関するモジュールの詳細設計を文書化したものです。

**簡単な機能説明**: 既存のFR-018（カテゴリ別集計）APIを使用して、支出や収入のカテゴリ別構成比を円グラフ（ドーナツチャート）で視覚化する。フロントエンドのReactコンポーネントとして実装し、ダッシュボードに統合する。

## 目次

1. [クラス図](./class-diagrams.md) - **必須**
2. [シーケンス図](./sequence-diagrams.md) - **必須**
3. [入出力設計](./input-output-design.md) - **必須** (API仕様)

## アーキテクチャ概要

この機能は**フロントエンドのみ**の実装であり、既存のバックエンドAPI（FR-018）を利用します。

### レイヤ構成

```
┌─────────────────────────────────────────┐
│     Frontend Layer                      │
│  - React Components                      │
│  - API Clients                          │
│  - UI Components (Recharts)              │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│     Backend API (既存 - FR-018)         │
│  - AggregationController                 │
│  - CalculateCategoryAggregationUseCase   │
└─────────────────────────────────────────┘
```

### レイヤごとの責務

#### Frontend Layer（フロントエンド層）

- **責務**: ユーザーインターフェースの提供、データ取得、グラフ描画
- **主なコンポーネント**:
  - `CategoryPieChart`: 円グラフ表示コンポーネント
  - `CategoryPieChartContainer`: データ取得と状態管理を行うコンテナコンポーネント
  - API Client: 既存の`aggregationApi`を使用

#### Backend API（既存 - FR-018）

- **責務**: カテゴリ別集計データの提供
- **主なコンポーネント**:
  - `AggregationController`: REST APIエンドポイント
  - `CalculateCategoryAggregationUseCase`: カテゴリ別集計ロジック

## 主要機能

### カテゴリ別円グラフ表示

**概要**: 指定した期間のカテゴリ別集計データを円グラフ（ドーナツチャート）で表示する。

**実装箇所**:

- Component: `CategoryPieChart`（新規作成）
- Container: `CategoryPieChartContainer`（新規作成）
- API Client: 既存の`aggregationApi.getCategoryAggregation()`を使用
- グラフライブラリ: Recharts（既存）

**主な機能**:

1. 期間指定によるデータ取得
2. カテゴリタイプ（収入/支出）の選択
3. 円グラフ（ドーナツチャート）の描画
4. インタラクティブな操作（ホバー、クリック）
5. 凡例の表示
6. レスポンシブデザイン対応

### 既存実装との関係

既存の集計機能（FR-018: カテゴリ別集計）と連携し、視覚的な表示を提供する：

1. **既存APIの利用**: `GET /api/aggregation/category`エンドポイントを使用
2. **既存コンポーネントの参考**: `YearlyBalanceGraph`、`MonthlyBalanceGraph`の実装パターンを参考にする
3. **既存UIコンポーネントの利用**: `Card`、`CardHeader`、`CardTitle`、`CardContent`を使用

## 技術スタック

### Frontend

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: React, Tailwind CSS
- **グラフライブラリ**: Recharts（既存）
- **API Client**: 既存の`apiClient`を使用

### Backend（既存）

- **Framework**: NestJS (Node.js)
- **API**: FR-018の既存エンドポイントを使用

## データモデル

### 主要な型定義

#### CategoryAggregationResponse（既存APIのレスポンス）

```typescript
interface CategoryAggregationResponse {
  success: boolean;
  data: CategoryAggregationResponseDto[];
}

interface CategoryAggregationResponseDto {
  categoryType: CategoryType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalAmount: number;
  transactionCount: number;
  subcategories: SubcategoryAggregationResponseDto[];
  percentage: number;
  trend: TrendDataResponseDto;
}

interface SubcategoryAggregationResponseDto {
  categoryId: string;
  categoryName: string;
  amount: number;
  count: number;
  percentage: number;
  topTransactions: TransactionDto[];
}
```

#### PieChartData（グラフ表示用）

```typescript
interface PieChartData {
  name: string; // カテゴリ名またはサブカテゴリ名
  value: number; // 金額
  percentage: number; // 構成比（%）
  color: string; // 色コード
  categoryId?: string; // カテゴリID（サブカテゴリの場合）
}
```

## API仕様概要

詳細は [入出力設計](./input-output-design.md) を参照。

### 使用する既存エンドポイント

| メソッド | エンドポイント              | 説明                     |
| -------- | --------------------------- | ------------------------ |
| GET      | `/api/aggregation/category` | カテゴリ別集計情報を取得 |

**参照**: [FR-018 入出力設計](../FR-018_category-aggregation/input-output-design.md)

## セキュリティ考慮事項

- [ ] 認証・認可の実装（将来対応、既存APIに依存）
- [x] 入力値のバリデーション（期間の形式チェック）
- [ ] XSS対策（Reactのデフォルトエスケープ機能を使用）
- [ ] CSRF対策（将来対応）

## パフォーマンス考慮事項

- [x] データ取得の最適化（期間指定によるフィルタリング）
- [ ] キャッシング戦略（将来対応：集計結果のキャッシュ）
- [ ] グラフ描画の最適化（大量データの場合の集約表示）
- [x] レスポンシブデザイン対応

## エラーハンドリング

### エラー分類

1. **バリデーションエラー** (400 Bad Request)
   - 期間の形式エラー（開始日が終了日より後など）
   - 無効なカテゴリ指定

2. **データ未検出** (200 OK with empty data)
   - 指定された期間のデータが存在しない（空配列を返す）

3. **サーバーエラー** (500 Internal Server Error)
   - 予期しないエラー（API接続失敗など）

### エラーハンドリング実装

- APIエラー時はエラーメッセージを表示
- データが存在しない場合は「データがありません」メッセージを表示
- ローディング状態の表示

## テスト方針

### ユニットテスト

- **対象**: Reactコンポーネント
- **ツール**: Jest + React Testing Library
- **カバレッジ目標**: 80%以上

### 統合テスト

- **対象**: APIクライアント
- **ツール**: Jest
- **テスト内容**: API呼び出しの検証

### E2Eテスト

- **対象**: ユーザーシナリオ
- **ツール**: Playwright
- **テスト内容**: 画面操作フローの検証（グラフ表示、インタラクション）

## 実装上の注意事項

1. **型安全性の遵守**
   - `any`型の使用禁止
   - すべての関数に適切な型定義
   - 既存APIのレスポンス型を正確に使用

2. **既存実装との一貫性**
   - 既存のグラフコンポーネント（`YearlyBalanceGraph`、`MonthlyBalanceGraph`）の実装パターンに従う
   - 既存のUIコンポーネント（`Card`）を再利用
   - 円グラフ用のツールチップ（`PieChartTooltip`）は`CategoryPieChart.tsx`内で新規作成

3. **エラーハンドリング**
   - すべての非同期処理にエラーハンドリング
   - ローディング状態の適切な表示

4. **レスポンシブデザイン**
   - モバイル・タブレット・デスクトップに対応
   - Tailwind CSSのレスポンシブクラスを使用

5. **アクセシビリティ**
   - 適切なARIAラベルの設定
   - キーボード操作のサポート（将来対応）

## 関連ドキュメント

- [機能要件書](../../functional-requirements/FR-023-027_visualization.md#fr-025-カテゴリ別の円グラフ表示)
- [FR-018 詳細設計書](../FR-018_category-aggregation/README.md)
- [システムアーキテクチャ](../../system-architecture.md)

## 変更履歴

| バージョン | 日付       | 変更内容 | 作成者       |
| ---------- | ---------- | -------- | ------------ |
| 1.0        | 2025-01-27 | 初版作成 | AI Assistant |

## チェックリスト

設計書作成時の確認事項：

### 必須項目

- [x] アーキテクチャ図が記載されている
- [x] 主要コンポーネントが定義されている
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

- [ ] 画面遷移図が作成されている（画面がある場合）
- [ ] 状態遷移図が作成されている（複雑な状態管理がある場合）
