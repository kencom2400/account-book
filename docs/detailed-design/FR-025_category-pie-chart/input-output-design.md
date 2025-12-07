# 入出力設計

このドキュメントでは、カテゴリ別円グラフ表示機能のAPI仕様とデータモデルを記載しています。

## 目次

1. [使用する既存API](#使用する既存api)
2. [フロントエンドAPIクライアント](#フロントエンドapiクライアント)
3. [データモデル定義](#データモデル定義)
4. [コンポーネントProps](#コンポーネントprops)
5. [エラーハンドリング](#エラーハンドリング)

---

## 使用する既存API

### GET /api/aggregation/category

既存のFR-018 APIを使用します。

**詳細**: [FR-018 入出力設計](../FR-018_category-aggregation/input-output-design.md)

**Query Parameters:**

| パラメータ   | 型           | 必須 | 説明                                                                                                 |
| ------------ | ------------ | ---- | ---------------------------------------------------------------------------------------------------- |
| startDate    | string       | ✅   | 開始日（ISO8601形式、例: 2025-01-01）                                                                |
| endDate      | string       | ✅   | 終了日（ISO8601形式、例: 2025-01-31）                                                                |
| categoryType | CategoryType | ❌   | カテゴリタイプ（INCOME, EXPENSE, TRANSFER, REPAYMENT, INVESTMENT）。指定しない場合は全カテゴリを集計 |

**Request Example（全カテゴリ集計）:**

```
GET /api/aggregation/category?startDate=2025-01-01&endDate=2025-01-31
```

**Request Example（特定カテゴリのみ集計）:**

```
GET /api/aggregation/category?startDate=2025-01-01&endDate=2025-01-31&categoryType=EXPENSE
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "categoryType": "EXPENSE",
      "startDate": "2025-01-01",
      "endDate": "2025-01-31",
      "totalAmount": 200000,
      "transactionCount": 5,
      "subcategories": [
        {
          "categoryId": "cat-002",
          "categoryName": "食費",
          "amount": 100000,
          "count": 3,
          "percentage": 50.0,
          "topTransactions": [...]
        },
        {
          "categoryId": "cat-003",
          "categoryName": "交通費",
          "amount": 50000,
          "count": 1,
          "percentage": 25.0,
          "topTransactions": [...]
        }
      ],
      "percentage": 100.0,
      "trend": {
        "monthly": [...]
      }
    }
  ]
}
```

---

## フロントエンドAPIクライアント

### aggregationApi.getCategoryAggregation()

既存のAPIクライアントにメソッドを追加します。

**実装箇所**: `apps/frontend/src/lib/api/aggregation.ts`

**型定義**:

```typescript
/**
 * カテゴリ別集計情報を取得（FR-018）
 */
getCategoryAggregation: async (
  startDate: string,
  endDate: string,
  categoryType?: CategoryType
): Promise<CategoryAggregationResponseDto[]>
```

**実装例**:

```typescript
export const aggregationApi = {
  // ... 既存のメソッド ...

  /**
   * カテゴリ別集計情報を取得（FR-018）
   */
  getCategoryAggregation: async (
    startDate: string,
    endDate: string,
    categoryType?: CategoryType
  ): Promise<CategoryAggregationResponseDto[]> {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });
    if (categoryType) {
      params.append('categoryType', categoryType);
    }
    return await apiClient.get<CategoryAggregationResponseDto[]>(
      `/api/aggregation/category?${params.toString()}`
    );
  },
};
```

**使用例**:

```typescript
const data = await aggregationApi.getCategoryAggregation(
  '2025-01-01',
  '2025-01-31',
  CategoryType.EXPENSE
);
```

---

## データモデル定義

### CategoryAggregationResponseDto（既存 - FR-018）

```typescript
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
```

**参照**: [FR-018 入出力設計](../FR-018_category-aggregation/input-output-design.md)

### SubcategoryAggregationResponseDto（既存 - FR-018）

```typescript
interface SubcategoryAggregationResponseDto {
  categoryId: string;
  categoryName: string;
  amount: number;
  count: number;
  percentage: number;
  topTransactions: TransactionDto[];
}
```

**参照**: [FR-018 入出力設計](../FR-018_category-aggregation/input-output-design.md)

### PieChartData（新規 - グラフ表示用）

```typescript
interface PieChartData {
  name: string; // カテゴリ名またはサブカテゴリ名
  value: number; // 金額
  percentage: number; // 構成比（%）
  color: string; // 色コード（例: "#FF6B6B"）
  categoryId?: string; // カテゴリID（サブカテゴリの場合）
}
```

**変換ロジック**:

```typescript
function transformToPieChartData(data: CategoryAggregationResponseDto[]): PieChartData[] {
  const result: PieChartData[] = [];

  for (const category of data) {
    if (category.totalAmount === 0) {
      continue; // 金額が0のカテゴリはスキップ
    }

    // サブカテゴリがある場合は、サブカテゴリごとにセグメントを作成
    if (category.subcategories.length > 0) {
      for (const subcategory of category.subcategories) {
        result.push({
          name: subcategory.categoryName,
          value: subcategory.amount,
          percentage: subcategory.percentage,
          color: getColorForCategory(subcategory.categoryName),
          categoryId: subcategory.categoryId,
        });
      }
    } else {
      // サブカテゴリがない場合は、カテゴリタイプ名でセグメントを作成
      result.push({
        name: category.categoryType,
        value: category.totalAmount,
        percentage: category.percentage,
        color: getColorForCategoryType(category.categoryType),
      });
    }
  }

  return result;
}
```

### カラーパレット

```typescript
const CATEGORY_COLORS: Record<string, string> = {
  // 支出カテゴリ
  食費: '#FF6B6B',
  交通費: '#4ECDC4',
  光熱費: '#95E1D3',
  娯楽: '#F38181',
  医療: '#AA96DA',
  教育: '#FCBAD3',
  住居: '#A8D8EA',
  その他: '#FFFFD2',

  // 収入カテゴリ
  給与: '#81C784',
  賞与: '#66BB6A',
  投資: '#4CAF50',
  その他収入: '#C8E6C9',

  // カテゴリタイプ（フォールバック）
  INCOME: '#4CAF50',
  EXPENSE: '#F44336',
  TRANSFER: '#2196F3',
  REPAYMENT: '#FF9800',
  INVESTMENT: '#9C27B0',
};

function getColorForCategory(categoryName: string): string {
  return CATEGORY_COLORS[categoryName] || CATEGORY_COLORS['その他'] || '#CCCCCC';
}

function getColorForCategoryType(categoryType: CategoryType): string {
  return CATEGORY_COLORS[categoryType] || '#CCCCCC';
}
```

---

## コンポーネントProps

### CategoryPieChartContainer Props

```typescript
interface CategoryPieChartContainerProps {
  startDate?: Date; // デフォルト: 当月の開始日
  endDate?: Date; // デフォルト: 当月の終了日
  categoryType?: CategoryType; // デフォルト: undefined（全カテゴリ）
  onDateChange?: (startDate: Date, endDate: Date) => void; // 期間変更コールバック
  onCategoryTypeChange?: (categoryType?: CategoryType) => void; // カテゴリタイプ変更コールバック
}
```

### CategoryPieChart Props

```typescript
interface CategoryPieChartProps {
  data: CategoryAggregationResponseDto[];
  selectedCategoryType?: CategoryType;
  onCategoryTypeChange?: (categoryType?: CategoryType) => void;
  loading?: boolean;
  error?: string | null;
}
```

---

## エラーハンドリング

### エラー分類

1. **バリデーションエラー** (フロントエンド)
   - 期間の形式エラー（開始日が終了日より後など）
   - 無効なカテゴリ指定

2. **APIエラー** (400 Bad Request)
   - バリデーションエラー（API側）
   - 無効なリクエスト

3. **APIエラー** (500 Internal Server Error)
   - サーバーエラー
   - データベース接続エラー

4. **データ未検出** (200 OK with empty data)
   - 指定された期間のデータが存在しない（空配列を返す）

### エラーハンドリング実装

```typescript
// CategoryPieChartContainer内でのエラーハンドリング
const fetchData = async (): Promise<void> => {
  try {
    setLoading(true);
    setError(null);

    // バリデーション
    if (startDate > endDate) {
      setError('開始日は終了日より前である必要があります');
      setLoading(false);
      return;
    }

    // API呼び出し
    const data = await aggregationApi.getCategoryAggregation(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      categoryType
    );

    setData(data);
  } catch (err) {
    setError('データの取得に失敗しました');
    console.error('Failed to fetch category aggregation:', err);
  } finally {
    setLoading(false);
  }
};
```

### エラー表示

```typescript
// CategoryPieChart内でのエラー表示
if (error) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>カテゴリ別円グラフ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
        </div>
      </CardContent>
    </Card>
  );
}
```

**注意**: 現在の実装では再試行ボタンは実装されていません。将来的に追加する場合は、`CategoryPieChartContainer`から`fetchData`関数をpropsで渡す必要があります。

### 空データ表示

```typescript
// CategoryPieChart内での空データ表示
if (!data || data.length === 0 || data.every((d) => d.totalAmount === 0)) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>カテゴリ別円グラフ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <p className="text-gray-600">データがありません</p>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## チェックリスト

入出力設計作成時の確認事項：

### 必須項目

- [x] 使用する既存APIが明確に記載されている
- [x] フロントエンドAPIクライアントの仕様が記載されている
- [x] データモデル定義が記載されている
- [x] コンポーネントPropsが記載されている
- [x] エラーハンドリングが明確

### 推奨項目

- [x] TypeScript型定義が記載されている
- [x] データ変換ロジックが記載されている
- [x] カラーパレットが記載されている

### 注意事項

- [x] 既存API（FR-018）との関係が明確
- [x] データが存在しない場合の処理が明確（200 OKで空データを返す）
- [x] エラーハンドリングが適切に実装されている
- [x] 型安全性が確保されている
