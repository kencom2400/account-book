# 機能要件書：可視化機能

**文書バージョン**: 1.0  
**作成日**: 2025-11-15  
**最終更新日**: 2025-11-15

## 目次
- [FR-023: 月間収支グラフ表示](#fr-023-月間収支グラフ表示)
- [FR-024: 年間収支グラフ表示](#fr-024-年間収支グラフ表示)
- [FR-025: カテゴリ別円グラフ表示](#fr-025-カテゴリ別円グラフ表示)
- [FR-026: 金融機関別資産残高表示](#fr-026-金融機関別資産残高表示)
- [FR-027: 収支推移トレンド表示](#fr-027-収支推移トレンド表示)

---

## FR-023: 月間収支グラフ表示

### 基本情報
| 項目 | 内容 |
|------|------|
| 機能ID | FR-023 |
| 機能名 | 月間収支のグラフ表示 |
| 優先度 | 高 |
| 対応Phase | Phase 4 |

### 概要
月ごとの収入・支出を視覚的に分かりやすく表示するグラフ機能。棒グラフや折れ線グラフで月内の推移や日別の内訳を確認できる。

### 詳細仕様

#### グラフ種類

##### 1. 月間サマリーバーグラフ
```
収入 |████████████████| 300,000円
支出 |██████████| 200,000円
収支 |██████| +100,000円
```

- 横棒グラフ
- 収入は青、支出は赤、収支は緑/赤で表示
- 金額をバーの横に表示

##### 2. 日別推移グラフ
```
折れ線グラフ
Y軸: 金額
X軸: 日付（1日〜31日）
2本の線: 収入（青）、支出（赤）
```

##### 3. 累積グラフ
```
エリアグラフ
Y軸: 累積金額
X軸: 日付
収入累積と支出累積の2つのエリア
```

#### データ構造
```typescript
interface MonthlyGraphData {
  month: string; // YYYY-MM
  summary: {
    income: number;
    expense: number;
    balance: number;
  };
  daily: DailyData[];
  cumulative: CumulativeData[];
}

interface DailyData {
  date: string; // YYYY-MM-DD
  income: number;
  expense: number;
  balance: number;
  transactionCount: number;
}

interface CumulativeData {
  date: string;
  cumulativeIncome: number;
  cumulativeExpense: number;
  cumulativeBalance: number;
}
```

#### 入力
- 対象月（YYYY-MM）
- グラフタイプ選択
- 表示オプション（凡例、グリッド等）

#### 出力
- インタラクティブなグラフ
- ツールチップ（ホバー時に詳細表示）
- 画像エクスポート機能

#### 処理フロー
```
1. ユーザーが月次レポート画面を開く
2. [データ準備]
   a. FR-016で集計したデータを取得
   b. 日別にデータを分解
   c. 累積値を計算
3. [グラフ描画]
   a. Chart.js / Recharts を使用
   b. レスポンシブ対応
   c. アニメーション効果
4. [インタラクション]
   a. ホバーでツールチップ表示
   b. クリックで詳細表示
   c. ドラッグでズーム
```

#### グラフライブラリ
- **採用候補**: Chart.js または Recharts
- **理由**: 
  - React対応
  - カスタマイズ性が高い
  - パフォーマンスが良い
  - レスポンシブ対応

#### バリデーション
- データの存在確認
- 日付の妥当性チェック
- 数値の範囲チェック

#### エラー処理
| エラーコード | エラー内容 | 対処方法 |
|-------------|-----------|---------|
| VZ001 | データが存在しない | 「データなし」メッセージ表示 |
| VZ002 | グラフ描画エラー | エラーメッセージ表示、リロード促す |
| VZ003 | 画像エクスポート失敗 | 再試行を促す |

#### パフォーマンス要件
- グラフ描画: 500ms以内
- ホバーアクション: 即座（レスポンス感）
- データ点が1000件以上の場合: サンプリング処理

#### テストケース

##### TC-023-001: 基本グラフ描画
- **前提**: 2025-01に取引データが存在
- **実行**: 月間収支グラフを表示
- **期待結果**: 
  - 収入バー、支出バー、収支バーが表示される
  - 金額が正しく表示される
  - 色分けが正しい

##### TC-023-002: データなし月
- **前提**: 取引データがない月
- **実行**: グラフ表示を試行
- **期待結果**: 「データがありません」メッセージが表示される

##### TC-023-003: ツールチップ表示
- **実行**: グラフ上にマウスホバー
- **期待結果**: 
  - ツールチップが表示される
  - 日付と金額が表示される
  - 取引件数が表示される

##### TC-023-004: エクスポート
- **実行**: 「画像として保存」をクリック
- **期待結果**: PNG形式でグラフがダウンロードされる

#### UI/UX要件

##### デザイン
- **カラーパレット**:
  - 収入: #4CAF50（緑）
  - 支出: #F44336（赤）
  - 収支プラス: #2196F3（青）
  - 収支マイナス: #FF9800（オレンジ）

- **フォント**: 
  - 数値: 16px, Bold
  - ラベル: 12px, Regular

- **余白**: 適切なpadding/margin

##### インタラクション
- スムーズなアニメーション（300ms）
- ホバー時のハイライト効果
- クリック時の詳細表示
- スワイプで前月/次月切り替え（モバイル）

##### レスポンシブ対応
- デスクトップ: フルサイズ
- タブレット: 横幅いっぱい
- モバイル: 縦向きに最適化、スクロール可能

#### アクセシビリティ
- ARIA ラベル設定
- キーボード操作対応
- スクリーンリーダー対応
- カラーブラインド対応（パターン併用）

#### 関連要件
- [FR-016: 月別収支集計](FR-016-022_aggregation-analysis.md#fr-016-月別収支集計)
- [FR-024: 年間収支グラフ表示](#fr-024-年間収支グラフ表示)

#### 備考
- 印刷時の最適化も考慮
- ダークモード対応を将来検討

---

## FR-024: 年間収支グラフ表示

### 基本情報
| 項目 | 内容 |
|------|------|
| 機能ID | FR-024 |
| 機能名 | 年間収支のグラフ表示 |
| 優先度 | 高 |
| 対応Phase | Phase 4 |

### 概要
1年間（12ヶ月）の収支推移を折れ線グラフで表示し、年間トレンドを可視化する。

### 詳細仕様

#### グラフ種類

##### 1. 月別折れ線グラフ
```
Y軸: 金額
X軸: 月（1月〜12月）
3本の線:
- 収入（青）
- 支出（赤）
- 収支（緑/赤）
```

##### 2. 月別積み上げ棒グラフ
```
X軸: 月
Y軸: 金額
各月に2本のバー:
- 収入バー（青）
- 支出バー（赤）
```

##### 3. 収支差額エリアグラフ
```
X軸: 月
Y軸: 収支差額
0を基準に:
- プラス: 緑のエリア
- マイナス: 赤のエリア
```

#### データ構造
```typescript
interface YearlyGraphData {
  year: number;
  months: MonthlyPoint[];
  annotations: Annotation[];
}

interface MonthlyPoint {
  month: string; // YYYY-MM
  income: number;
  expense: number;
  balance: number;
  savingsRate: number;
  events: Event[];
}

interface Annotation {
  month: string;
  type: 'event' | 'milestone' | 'alert';
  label: string;
  icon: string;
}
```

#### 入力
- 対象年
- グラフタイプ選択
- イベント表示オン/オフ

#### 出力
- 年間推移グラフ
- イベントマーカー重畳表示
- 統計情報表示

#### 処理フロー
```
1. ユーザーが年次レポート画面を開く
2. [データ準備]
   a. FR-020で集計したデータを取得
   b. イベントデータを取得（FR-021）
   c. 月ごとのポイントデータを作成
3. [グラフ描画]
   a. 折れ線グラフを描画
   b. イベントマーカーを追加
   c. トレンドラインを表示（オプション）
4. [インタラクション]
   a. 月をクリック→月次詳細へ
   b. イベントマーカークリック→詳細表示
```

#### 特殊機能

##### イベントマーカー
```typescript
interface EventMarker {
  position: { x: number, y: number };
  event: Event;
  icon: string;
  color: string;
}

function renderEventMarkers(events: Event[], graphData: YearlyGraphData) {
  return events.map(event => ({
    position: calculatePosition(event.date),
    event,
    icon: getIconForCategory(event.category),
    color: getColorForCategory(event.category)
  }));
}
```

##### トレンドライン
```typescript
function calculateTrendLine(dataPoints: MonthlyPoint[]): TrendLine {
  const n = dataPoints.length;
  const values = dataPoints.map(p => p.balance);
  
  // 線形回帰
  const slope = linearRegression(values);
  
  return {
    start: { x: 0, y: values[0] },
    end: { x: n - 1, y: values[0] + slope * (n - 1) },
    equation: `y = ${slope.toFixed(2)}x + ${values[0].toFixed(2)}`
  };
}
```

#### テストケース

##### TC-024-001: 年間グラフ描画
- **前提**: 2025年の12ヶ月分データが存在
- **実行**: 年間収支グラフを表示
- **期待結果**:
  - 12ポイントの折れ線グラフが表示される
  - 収入・支出・収支の3本の線がある
  - 正しい値が表示される

##### TC-024-002: イベントマーカー表示
- **前提**: 3月と8月にイベントが登録済み
- **実行**: グラフ表示
- **期待結果**:
  - 3月と8月の位置にマーカーが表示される
  - マーカーをクリックでイベント詳細表示

##### TC-024-003: トレンドライン
- **実行**: トレンドライン表示をオン
- **期待結果**:
  - 破線のトレンドラインが表示される
  - 傾きの方向が正しい

##### TC-024-004: 月クリック遷移
- **実行**: グラフ上の5月のポイントをクリック
- **期待結果**: 5月の月次詳細画面に遷移

#### UI/UX要件

##### レイアウト
```
┌─────────────────────────────────────┐
│  2025年 年間収支推移         [▼年選択]│
├─────────────────────────────────────┤
│                                     │
│  [グラフエリア]                      │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │  折れ線グラフ                │   │
│  │  ● イベントマーカー          │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  凡例: ─ 収入  ─ 支出  ─ 収支     │
├─────────────────────────────────────┤
│  年間統計                            │
│  収入合計: ¥3,600,000               │
│  支出合計: ¥2,400,000               │
│  収支: +¥1,200,000                  │
│  貯蓄率: 33.3%                      │
└─────────────────────────────────────┘
```

##### インタラクション
- グラフホバー: 月の詳細ポップアップ
- グラフクリック: 月次詳細へ遷移
- ドラッグ: 拡大表示
- ピンチ: ズーム（モバイル）

#### 関連要件
- [FR-020: 年間収支推移表示](FR-016-022_aggregation-analysis.md#fr-020-年間収支推移表示)
- [FR-021: イベントメモ機能](FR-016-022_aggregation-analysis.md#fr-021-イベントメモ機能)
- [FR-023: 月間収支グラフ表示](#fr-023-月間収支グラフ表示)

---

## FR-025: カテゴリ別円グラフ表示

### 基本情報
| 項目 | 内容 |
|------|------|
| 機能ID | FR-025 |
| 機能名 | カテゴリ別の円グラフ表示 |
| 優先度 | 高 |
| 対応Phase | Phase 4 |

### 概要
支出や収入のカテゴリ別構成比を円グラフ（パイチャート/ドーナツチャート）で視覚化する。

### 詳細仕様

#### グラフ種類

##### 1. ドーナツチャート（推奨）
```
       食費 30%
       ┌───┐
    ┌──┤   ├──┐
娯楽 │  └───┘  │ 交通費
20% │   合計   │ 15%
    │ 100,000円│
    └──────────┘
     光熱費 10%
     その他 25%
```

##### 2. パイチャート
```
通常の円グラフ
各セクターに%とラベル表示
```

##### 3. 階層ドーナツチャート
```
外側: 大カテゴリ（収入/支出）
内側: 詳細費目
```

#### データ構造
```typescript
interface PieChartData {
  title: string;
  total: number;
  segments: PieSegment[];
}

interface PieSegment {
  label: string;
  value: number;
  percentage: number;
  color: string;
  subcategories?: PieSegment[];
}
```

#### カラーパレット
```typescript
const CATEGORY_COLORS = {
  // 支出カテゴリ
  food: '#FF6B6B',           // 食費: 赤
  transport: '#4ECDC4',      // 交通費: 青緑
  utilities: '#95E1D3',      // 光熱費: 緑
  entertainment: '#F38181',  // 娯楽: ピンク
  healthcare: '#AA96DA',     // 医療: 紫
  education: '#FCBAD3',      // 教育: 桃色
  housing: '#A8D8EA',        // 住居: 水色
  other: '#FFFFD2',          // その他: 黄色
  
  // 収入カテゴリ
  salary: '#81C784',         // 給与: 緑
  bonus: '#66BB6A',          // 賞与: 濃い緑
  investment: '#4CAF50',     // 投資: さらに濃い緑
  other_income: '#C8E6C9'    // その他収入: 薄緑
};
```

#### 入力
- 対象期間
- 表示タイプ（収入/支出）
- カテゴリレベル（大分類/中分類）

#### 出力
- インタラクティブな円グラフ
- 凡例
- 詳細テーブル

#### 処理フロー
```
1. ユーザーが収支レポート画面を開く
2. [データ準備]
   a. FR-018でカテゴリ別集計を取得
   b. 構成比を計算
   c. セグメントデータを作成
3. [色の割り当て]
   a. 各カテゴリに色を設定
   b. サブカテゴリは明度を変える
4. [グラフ描画]
   a. ドーナツチャートを描画
   b. ラベルと%を表示
   c. 凡例を表示
5. [インタラクション]
   a. セグメントホバー: 詳細表示
   b. セグメントクリック: ドリルダウン
```

#### テストケース

##### TC-025-001: 円グラフ描画
- **前提**: 支出データ（食費5万、交通費2万、その他3万）
- **実行**: 支出円グラフを表示
- **期待結果**:
  - 3つのセグメント表示
  - 食費50%、交通費20%、その他30%
  - 色分けが正しい

##### TC-025-002: ドリルダウン
- **前提**: 食費セグメントにサブカテゴリあり
- **実行**: 食費セグメントをクリック
- **期待結果**: 
  - 内訳（外食、スーパー等）が表示される
  - 階層ドーナツに変化

##### TC-025-003: 小さいセグメント
- **前提**: 1%未満のカテゴリが複数存在
- **実行**: 円グラフ表示
- **期待結果**: 小さいセグメントは「その他」にまとめられる

#### UI/UX要件

##### インタラクション
- ホバー: セグメント拡大 + 詳細ポップアップ
- クリック: ドリルダウン（サブカテゴリ表示）
- ダブルクリック: 取引一覧へ遷移
- 凡例クリック: セグメントハイライト

##### アニメーション
- 初期表示: セグメントが順番に描画（200ms間隔）
- ホバー: セグメントが少し飛び出す効果
- ドリルダウン: 回転してズームイン

##### レスポンシブ
- デスクトップ: 横並び（グラフ + テーブル）
- モバイル: 縦並び

#### 関連要件
- [FR-018: カテゴリ別集計](FR-016-022_aggregation-analysis.md#fr-018-カテゴリ別集計)
- [FR-019: 費目別集計](FR-016-022_aggregation-analysis.md#fr-019-費目別集計)

---

## FR-026: 金融機関別資産残高表示

### 基本情報
| 項目 | 内容 |
|------|------|
| 機能ID | FR-026 |
| 機能名 | 金融機関別の資産残高表示 |
| 優先度 | 中 |
| 対応Phase | Phase 4 |

### 概要
各金融機関の現在残高を集計し、総資産や機関別の構成比を視覚化する。

### 詳細仕様

#### 表示内容

##### 1. 総資産カード
```
┌──────────────────────┐
│   総資産              │
│   ¥5,234,567        │
│   前月比 +¥123,456   │
│   (+2.4%)            │
└──────────────────────┘
```

##### 2. 金融機関別リスト
```
┌──────────────────────────────┐
│ 🏦 三菱UFJ銀行               │
│    普通預金: ¥1,234,567     │
│    定期預金: ¥2,000,000     │
│    小計: ¥3,234,567 (61.8%) │
├──────────────────────────────┤
│ 💳 楽天カード                │
│    未払い額: -¥123,456      │
├──────────────────────────────┤
│ 📈 SBI証券                   │
│    株式: ¥1,500,000         │
│    投資信託: ¥623,456       │
│    小計: ¥2,123,456 (40.6%) │
└──────────────────────────────┘
```

##### 3. 資産構成グラフ
- 横棒グラフまたはツリーマップ
- 各機関の割合を視覚化

#### データ構造
```typescript
interface AssetSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  institutions: InstitutionAsset[];
  asOfDate: Date;
  comparison: {
    previousMonth: AssetComparison;
    previousYear: AssetComparison;
  };
}

interface InstitutionAsset {
  institutionId: string;
  institutionName: string;
  institutionType: InstitutionType;
  icon: string;
  accounts: AccountAsset[];
  total: number;
  percentage: number;
}

interface AccountAsset {
  accountId: string;
  accountName: string;
  accountType: string;
  balance: number;
  currency: string;
}

interface AssetComparison {
  diff: number;
  rate: number;
}
```

#### 入力
- 基準日（デフォルト: 今日）
- 表示通貨（将来: 外貨対応）

#### 出力
- 総資産額
- 機関別資産リスト
- 資産構成グラフ
- 推移グラフ

#### 処理フロー
```
1. ユーザーが資産一覧画面を開く
2. [データ取得]
   a. すべての金融機関情報を取得
   b. 各口座の最新残高を取得
   c. クレジットカードの未払い額を取得
3. [集計処理]
   a. 資産合計を計算
   b. 負債合計を計算
   c. 純資産を計算（資産 - 負債）
   d. 構成比を計算
4. [比較データ取得]
   a. 前月同日の残高を取得
   b. 増減を計算
5. [表示]
   a. 総資産カードを表示
   b. 機関別リストを表示
   c. グラフを描画
```

#### 計算ロジック

##### 純資産の計算
```typescript
function calculateNetWorth(institutions: InstitutionAsset[]): number {
  let assets = 0;
  let liabilities = 0;
  
  for (const institution of institutions) {
    for (const account of institution.accounts) {
      if (account.balance >= 0) {
        assets += account.balance;
      } else {
        liabilities += Math.abs(account.balance);
      }
    }
  }
  
  return assets - liabilities;
}
```

##### 構成比の計算
```typescript
function calculatePercentage(
  institutionTotal: number,
  grandTotal: number
): number {
  if (grandTotal === 0) return 0;
  return (institutionTotal / grandTotal) * 100;
}
```

#### テストケース

##### TC-026-001: 総資産計算
- **前提**: 
  - 銀行A: 100万円
  - 銀行B: 200万円
  - カード: -5万円
- **実行**: 資産一覧を表示
- **期待結果**:
  - 総資産: 300万円
  - 負債: 5万円
  - 純資産: 295万円

##### TC-026-002: 構成比計算
- **前提**: 上記と同じ
- **期待結果**:
  - 銀行A: 33.3%
  - 銀行B: 66.7%

##### TC-026-003: 前月比
- **前提**: 今月295万円、前月280万円
- **期待結果**: 
  - 差額: +15万円
  - 増減率: +5.4%

#### UI/UX要件

##### デザイン
- カード型レイアウト
- 金融機関ごとにアイコン表示
- プラス/マイナスの色分け
- スケルトンローディング

##### インタラクション
- 機関カードをクリック: 口座詳細表示
- スワイプで更新（Pull to refresh）
- 長押しで口座編集メニュー

##### レスポンシブ
- デスクトップ: 3カラムレイアウト
- タブレット: 2カラム
- モバイル: 1カラム

#### 関連要件
- [FR-001: 銀行口座との連携](FR-001-007_data-acquisition.md#fr-001-銀行口座との連携)
- [FR-002: クレジットカードとの連携](FR-001-007_data-acquisition.md#fr-002-クレジットカードとの連携)
- [FR-017: 金融機関別集計](FR-016-022_aggregation-analysis.md#fr-017-金融機関別集計)

---

## FR-027: 収支推移トレンド表示

### 基本情報
| 項目 | 内容 |
|------|------|
| 機能ID | FR-027 |
| 機能名 | 収支推移のトレンド表示 |
| 優先度 | 中 |
| 対応Phase | Phase 4 |

### 概要
長期的な収支のトレンドを分析し、傾向や周期性を視覚化する。移動平均線やトレンドラインを表示して将来予測の基礎とする。

### 詳細仕様

#### 表示要素

##### 1. 実績データ
- 月別の収入・支出・収支の実績値
- 折れ線グラフまたはエリアグラフ

##### 2. 移動平均線
```typescript
// 3ヶ月移動平均（SMA: Simple Moving Average）
function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(NaN); // データ不足
    } else {
      const sum = data.slice(i - period + 1, i + 1)
        .reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
  }
  
  return sma;
}
```

##### 3. トレンドライン
```typescript
// 線形回帰によるトレンドライン
function calculateTrendLine(data: number[]): TrendLine {
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumXX += i * i;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return {
    slope,
    intercept,
    points: data.map((_, i) => slope * i + intercept)
  };
}
```

##### 4. 周期性分析
- 季節性の検出（例: ボーナス月、年末年始等）
- 定期的な支出パターンの識別

#### データ構造
```typescript
interface TrendData {
  period: {
    start: Date;
    end: Date;
  };
  actual: DataPoint[];
  movingAverage: {
    period: number;
    data: DataPoint[];
  };
  trendLine: {
    slope: number;
    intercept: number;
    points: DataPoint[];
  };
  seasonality: SeasonalPattern[];
  forecast?: DataPoint[]; // 将来機能
}

interface DataPoint {
  date: string;
  value: number;
}

interface SeasonalPattern {
  pattern: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  confidence: number;
}
```

#### 入力
- 対象期間（最低6ヶ月、推奨12ヶ月以上）
- 移動平均の期間（3ヶ月/6ヶ月/12ヶ月）
- 表示対象（収入/支出/収支）

#### 出力
- トレンドグラフ
- トレンド分析レポート
- 統計情報

#### 処理フロー
```
1. ユーザーがトレンド分析画面を開く
2. [データ取得]
   a. 指定期間の月次データを取得
   b. 最低6ヶ月分を確保
3. [トレンド計算]
   a. 移動平均を計算
   b. トレンドラインを計算
   c. 季節性を分析
4. [グラフ描画]
   a. 実績データをプロット
   b. 移動平均線を重ねる
   c. トレンドラインを追加
5. [レポート生成]
   a. トレンドの方向を判定
   b. 特徴的なパターンを抽出
   c. インサイトを生成
```

#### トレンド判定ロジック
```typescript
enum TrendDirection {
  INCREASING = 'increasing',     // 上昇傾向
  DECREASING = 'decreasing',     // 下降傾向
  STABLE = 'stable',             // 横ばい
  VOLATILE = 'volatile'          // 不安定
}

function determineTrend(trendLine: TrendLine, data: number[]): TrendDirection {
  const slope = trendLine.slope;
  const stdDev = calculateStandardDeviation(data);
  const mean = data.reduce((a, b) => a + b) / data.length;
  const cv = stdDev / mean; // 変動係数
  
  // 変動が大きい場合
  if (cv > 0.3) {
    return TrendDirection.VOLATILE;
  }
  
  // 傾きで判定
  if (Math.abs(slope) < mean * 0.01) {
    return TrendDirection.STABLE;
  } else if (slope > 0) {
    return TrendDirection.INCREASING;
  } else {
    return TrendDirection.DECREASING;
  }
}
```

#### インサイト生成
```typescript
interface Insight {
  type: 'trend' | 'pattern' | 'anomaly';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  recommendation?: string;
}

function generateInsights(trendData: TrendData): Insight[] {
  const insights: Insight[] = [];
  
  // 支出増加トレンド
  if (trendData.trendLine.slope > 0 && /* 支出データ */) {
    insights.push({
      type: 'trend',
      severity: 'warning',
      title: '支出が増加傾向です',
      description: `過去${trendData.actual.length}ヶ月間で支出が継続的に増加しています。`,
      recommendation: 'カテゴリ別の内訳を確認し、増加要因を特定しましょう。'
    });
  }
  
  // 季節性パターン
  if (trendData.seasonality.length > 0) {
    insights.push({
      type: 'pattern',
      severity: 'info',
      title: '季節的なパターンを検出',
      description: '特定の時期に支出が増加する傾向があります。',
      recommendation: '予算計画に季節変動を織り込みましょう。'
    });
  }
  
  return insights;
}
```

#### テストケース

##### TC-027-001: トレンドライン計算
- **前提**: 12ヶ月の増加傾向データ
- **実行**: トレンド分析
- **期待結果**: 
  - slope > 0
  - トレンド方向: INCREASING

##### TC-027-002: 移動平均計算
- **前提**: 月次データ [100, 110, 120, 130]
- **入力**: 3ヶ月移動平均
- **期待結果**: [NaN, NaN, 110, 120]

##### TC-027-003: インサイト生成
- **前提**: 支出が連続6ヶ月増加
- **実行**: トレンド分析
- **期待結果**: 
  - 「支出が増加傾向」のインサイト生成
  - severity: warning

#### UI/UX要件

##### グラフデザイン
- 実績データ: 太線（#2196F3）
- 移動平均: 破線（#FF9800）
- トレンドライン: 点線（#4CAF50）
- 信頼区間: 半透明エリア

##### インタラクティブ要素
- 移動平均期間の切り替え（3/6/12ヶ月）
- グラフの拡大/縮小
- 期間選択スライダー
- ツールチップで詳細表示

##### レポート表示
```
┌────────────────────────────┐
│ トレンド分析レポート        │
├────────────────────────────┤
│ ⚠️ 支出が増加傾向です      │
│   過去12ヶ月で平均...      │
│                            │
│ ℹ️ 季節的なパターンを検出  │
│   12月と3月に...           │
│                            │
│ ✅ 収入は安定しています     │
│   変動係数: 5.2%           │
└────────────────────────────┘
```

#### パフォーマンス要件
- トレンド計算: 500ms以内
- グラフ描画: 1秒以内
- インサイト生成: 300ms以内

#### 関連要件
- [FR-020: 年間収支推移表示](FR-016-022_aggregation-analysis.md#fr-020-年間収支推移表示)
- [FR-024: 年間収支グラフ表示](#fr-024-年間収支グラフ表示)

#### 備考
- Phase 6で予測機能（機械学習）を追加予定
- 外れ値検出アルゴリズムの実装を検討

---

## 付録

### A. グラフライブラリ比較

| ライブラリ | メリット | デメリット | 推奨度 |
|-----------|---------|-----------|-------|
| Chart.js | シンプル、軽量 | カスタマイズ制限 | ⭐⭐⭐ |
| Recharts | React最適化 | バンドルサイズ大 | ⭐⭐⭐⭐⭐ |
| D3.js | 最強のカスタマイズ性 | 学習コスト高 | ⭐⭐⭐ |
| Victory | 宣言的、美しい | パフォーマンス課題 | ⭐⭐⭐ |

**結論**: Rechartsを推奨

### B. カラーアクセシビリティ

色覚異常対応のため、色だけでなくパターンも併用:
- 実線/破線/点線の使い分け
- 太さの違い
- マーカーの形状

### C. パフォーマンス最適化

- データポイントが多い場合: サンプリング
- リアルタイム更新: requestAnimationFrame使用
- 大量グラフ: 仮想スクロール適用
- SVGよりCanvas（大量データ時）

### D. 変更履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|---------|--------|
| 1.0 | 2025-11-15 | 初版作成 | System |
