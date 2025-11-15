# 機能要件書：集計・分析機能

**文書バージョン**: 1.0  
**作成日**: 2025-11-15  
**最終更新日**: 2025-11-15

## 目次
- [FR-016: 月別収支集計](#fr-016-月別収支集計)
- [FR-017: 金融機関別集計](#fr-017-金融機関別集計)
- [FR-018: カテゴリ別集計](#fr-018-カテゴリ別集計)
- [FR-019: 費目別集計](#fr-019-費目別集計)
- [FR-020: 年間収支推移表示](#fr-020-年間収支推移表示)
- [FR-021: イベントメモ機能](#fr-021-イベントメモ機能)
- [FR-022: イベントと収支の紐付け](#fr-022-イベントと収支の紐付け)

---

## FR-016: 月別収支集計

### 基本情報
| 項目 | 内容 |
|------|------|
| 機能ID | FR-016 |
| 機能名 | 月別の収支集計 |
| 優先度 | 高 |
| 対応Phase | Phase 4 |

### 概要
指定した月の収入・支出を集計し、収支差額や推移を表示する。家計簿の基本機能として月次レポートを提供する。

### 詳細仕様

#### 集計対象
- 収入取引（CategoryType.INCOME）
- 支出取引（CategoryType.EXPENSE）
- 振替・返済・投資は対象外（別途表示）

#### 集計単位
- 月単位（YYYY-MM）
- カレンダー月（1日〜末日）

#### 集計項目
```typescript
interface MonthlySummary {
  month: string; // YYYY-MM
  income: {
    total: number;
    count: number;
    byCategory: CategoryBreakdown[];
    byInstitution: InstitutionBreakdown[];
    transactions: Transaction[];
  };
  expense: {
    total: number;
    count: number;
    byCategory: CategoryBreakdown[];
    byInstitution: InstitutionBreakdown[];
    transactions: Transaction[];
  };
  balance: number; // 収支差額 (income - expense)
  savingsRate: number; // 貯蓄率 (balance / income * 100)
  comparison: {
    previousMonth: MonthComparison;
    sameMonthLastYear: MonthComparison;
  };
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

interface MonthComparison {
  incomeDiff: number;
  expenseDiff: number;
  balanceDiff: number;
  incomeRate: number; // 前月比%
  expenseRate: number;
}
```

#### 入力
- 対象月（YYYY-MM）
- フィルタ条件（オプション）
  - 特定の金融機関
  - 特定のカテゴリ
  - 金額範囲

#### 出力
- 月次サマリー（MonthlySummary）
- 収支グラフ
- カテゴリ別円グラフ
- トレンド比較

#### 処理フロー
```
1. ユーザーが月次レポート画面を開く
2. デフォルトで当月を表示
3. [データ取得]
   a. 該当月の全取引データを取得
   b. カテゴリで振り分け（収入/支出）
4. [集計処理]
   a. 収入合計を算出
   b. 支出合計を算出
   c. 収支差額を計算
   d. カテゴリ別・機関別に分類集計
5. [比較計算]
   a. 前月データを取得して比較
   b. 前年同月データを取得して比較
   c. 増減率を計算
6. [表示]
   a. サマリー情報を表示
   b. グラフを描画
   c. 明細一覧を表示
```

#### 計算ロジック

##### 貯蓄率の計算
```typescript
function calculateSavingsRate(income: number, expense: number): number {
  if (income === 0) return 0;
  const balance = income - expense;
  return (balance / income) * 100;
}
```

##### 前月比の計算
```typescript
function calculateMonthComparison(
  current: MonthlySummary,
  previous: MonthlySummary
): MonthComparison {
  return {
    incomeDiff: current.income.total - previous.income.total,
    expenseDiff: current.expense.total - previous.expense.total,
    balanceDiff: current.balance - previous.balance,
    incomeRate: calculateChangeRate(
      previous.income.total,
      current.income.total
    ),
    expenseRate: calculateChangeRate(
      previous.expense.total,
      current.expense.total
    )
  };
}

function calculateChangeRate(previous: number, current: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
```

#### バリデーション
- 月の形式チェック（YYYY-MM）
- 日付の妥当性チェック
- フィルタ条件の妥当性

#### エラー処理
| エラーコード | エラー内容 | 対処方法 |
|-------------|-----------|---------|
| AG001 | データが存在しない | データ同期を実施 |
| AG002 | 無効な月指定 | 正しい形式で入力 |
| AG003 | 集計処理タイムアウト | 期間を短縮して再試行 |

#### パフォーマンス要件
- 1ヶ月分の集計: 1秒以内
- グラフ描画: 500ms以内
- フィルタ変更時の再集計: 300ms以内

#### テストケース

##### TC-016-001: 基本集計
- **前提**: 2025年1月に収入300,000円、支出200,000円のデータ
- **入力**: 2025-01を指定
- **期待結果**:
  - 収入合計: 300,000円
  - 支出合計: 200,000円
  - 収支: +100,000円
  - 貯蓄率: 33.33%

##### TC-016-002: データなし月
- **前提**: 取引データがない月
- **入力**: 2024-12を指定
- **期待結果**: すべて0円、適切なメッセージ表示

##### TC-016-003: 前月比計算
- **前提**: 1月収入300,000円、2月収入330,000円
- **入力**: 2025-02を指定
- **期待結果**: 前月比+10%と表示

#### UI/UX要件
- 大きな数字で収支を強調表示
- プラスは緑、マイナスは赤で色分け
- 前月比を矢印で視覚化（↑↓）
- スワイプで前月/次月に移動
- カレンダー形式での月選択

#### 関連要件
- [FR-008: 主要カテゴリ分類](FR-008-011_data-classification.md#fr-008-主要カテゴリ分類)
- [FR-017: 金融機関別集計](#fr-017-金融機関別集計)
- [FR-018: カテゴリ別集計](#fr-018-カテゴリ別集計)

---

## FR-017: 金融機関別集計

### 基本情報
| 項目 | 内容 |
|------|------|
| 機能ID | FR-017 |
| 機能名 | 金融機関別の集計 |
| 優先度 | 中 |
| 対応Phase | Phase 4 |

### 概要
各金融機関（銀行、クレジットカード、証券会社）ごとに取引を集計し、機関別の収支状況を可視化する。

### 詳細仕様

#### 集計対象
- すべての金融機関
- 各機関配下の全口座

#### データ構造
```typescript
interface InstitutionSummary {
  institutionId: string;
  institutionName: string;
  institutionType: InstitutionType;
  period: {
    start: Date;
    end: Date;
  };
  accounts: AccountSummary[];
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  currentBalance: number; // 現在の残高
  transactionCount: number;
  transactions: Transaction[];
}

interface AccountSummary {
  accountId: string;
  accountName: string;
  income: number;
  expense: number;
  balance: number;
  currentBalance: number;
  transactionCount: number;
}
```

#### 入力
- 集計期間（開始日〜終了日）
- 金融機関選択（複数選択可）

#### 出力
- 金融機関別サマリー
- 機関別比較グラフ
- 残高推移グラフ

#### 処理フロー
```
1. ユーザーが金融機関別レポートを開く
2. 集計期間を選択
3. [データ取得]
   a. すべての金融機関情報を取得
   b. 各機関の取引データを取得
4. [集計処理]
   a. 機関ごとにグループ化
   b. 収入・支出を集計
   c. 残高を計算
5. [ソート]
   a. デフォルトは取引額の多い順
   b. ユーザー設定で変更可能
6. [表示]
   a. 一覧表示
   b. グラフ描画
```

#### テストケース

##### TC-017-001: 複数機関の集計
- **前提**: 銀行A（収入30万、支出10万）、銀行B（支出5万）
- **入力**: 2025-01の期間指定
- **期待結果**:
  - 銀行A: 収支+20万
  - 銀行B: 収支-5万
  - 合計: 収支+15万

#### 関連要件
- [FR-001: 銀行口座との連携](FR-001-007_data-acquisition.md#fr-001-銀行口座との連携)
- [FR-016: 月別収支集計](#fr-016-月別収支集計)

---

## FR-018: カテゴリ別集計

### 基本情報
| 項目 | 内容 |
|------|------|
| 機能ID | FR-018 |
| 機能名 | カテゴリ別の集計 |
| 優先度 | 高 |
| 対応Phase | Phase 4 |

### 概要
5つの主要カテゴリ（収入・支出・振替・返済・投資）ごとに取引を集計し、内訳を可視化する。

### 詳細仕様

#### データ構造
```typescript
interface CategorySummary {
  category: CategoryType;
  period: {
    start: Date;
    end: Date;
  };
  totalAmount: number;
  transactionCount: number;
  subcategories: SubcategorySummary[];
  percentage: number; // 全体に占める割合
  trend: TrendData;
}

interface SubcategorySummary {
  subcategory: string;
  amount: number;
  count: number;
  percentage: number;
  topTransactions: Transaction[];
}
```

#### 入力
- 集計期間
- カテゴリ選択

#### 出力
- カテゴリ別サマリー
- 円グラフ（構成比）
- サブカテゴリ内訳

#### テストケース

##### TC-018-001: 支出カテゴリの集計
- **前提**: 食費5万、交通費2万、娯楽3万のデータ
- **入力**: 2025-01、支出カテゴリ
- **期待結果**:
  - 合計: 10万円
  - 食費50%、交通費20%、娯楽30%

#### 関連要件
- [FR-008: 主要カテゴリ分類](FR-008-011_data-classification.md#fr-008-主要カテゴリ分類)
- [FR-019: 費目別集計](#fr-019-費目別集計)

---

## FR-019: 費目別集計

### 基本情報
| 項目 | 内容 |
|------|------|
| 機能ID | FR-019 |
| 機能名 | 費目別の集計 |
| 優先度 | 中 |
| 対応Phase | Phase 4 |

### 概要
詳細な費目（食費、交通費、医療費等）ごとに取引を集計し、支出の内訳を詳細に分析する。

### 詳細仕様

#### 費目階層
```
カテゴリ（大）
  └ 費目（中）
      └ サブ費目（小）

例:
支出
  └ 食費
      ├ 外食
      ├ スーパー
      └ コンビニ
```

#### データ構造
```typescript
interface ExpenseItemSummary {
  itemName: string;
  itemCode: string;
  parent: string;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  budget?: number;
  budgetUsage?: number; // 予算消化率%
  children: ExpenseItemSummary[];
  monthlyTrend: MonthlyAmount[];
}
```

#### 入力
- 集計期間
- 費目選択

#### 出力
- 費目別サマリー
- 階層表示
- 予算対比

#### テストケース

##### TC-019-001: 階層集計
- **前提**: 食費（外食2万、スーパー2.5万、コンビニ0.5万）
- **入力**: 2025-01
- **期待結果**:
  - 食費合計: 5万円
  - 内訳が正しく集計される

#### 関連要件
- [FR-009: 詳細費目分類](FR-008-011_data-classification.md#fr-009-詳細費目分類)
- [FR-018: カテゴリ別集計](#fr-018-カテゴリ別集計)

---

## FR-020: 年間収支推移表示

### 基本情報
| 項目 | 内容 |
|------|------|
| 機能ID | FR-020 |
| 機能名 | 年間の収支推移表示 |
| 優先度 | 高 |
| 対応Phase | Phase 4 |

### 概要
1年間（または指定期間）の収支推移を月別に表示し、トレンドを視覚化する。

### 詳細仕様

#### データ構造
```typescript
interface YearlySummary {
  year: number;
  months: MonthlySummary[];
  annual: {
    totalIncome: number;
    totalExpense: number;
    totalBalance: number;
    averageIncome: number;
    averageExpense: number;
    savingsRate: number;
  };
  trend: {
    incomeProgression: TrendAnalysis;
    expenseProgression: TrendAnalysis;
    balanceProgression: TrendAnalysis;
  };
  highlights: {
    maxIncomeMonth: string;
    maxExpenseMonth: string;
    bestBalanceMonth: string;
    worstBalanceMonth: string;
  };
}

interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  changeRate: number;
  standardDeviation: number;
}
```

#### 入力
- 対象年

#### 出力
- 年間サマリー
- 月別推移グラフ（折れ線グラフ）
- トレンド分析
- ハイライト情報

#### 処理フロー
```
1. ユーザーが年次レポート画面を開く
2. デフォルトで今年を表示
3. [データ取得]
   a. 1月〜12月の月次データを取得
4. [年間集計]
   a. 12ヶ月分を合算
   b. 平均値を算出
   c. トレンドを分析
5. [ハイライト抽出]
   a. 最大/最小月を特定
   b. 特異点を検出
6. [表示]
   a. 年間サマリーを表示
   b. 月別推移グラフを描画
   c. イベントマーカーを重畳表示
```

#### 計算ロジック

##### トレンド分析
```typescript
function analyzeTrend(monthlyAmounts: number[]): TrendAnalysis {
  const n = monthlyAmounts.length;
  
  // 線形回帰で傾きを計算
  const slope = calculateSlope(monthlyAmounts);
  
  // 標準偏差を計算
  const stdDev = calculateStandardDeviation(monthlyAmounts);
  
  // トレンド方向を判定
  let direction: 'increasing' | 'decreasing' | 'stable';
  if (Math.abs(slope) < 0.01) {
    direction = 'stable';
  } else if (slope > 0) {
    direction = 'increasing';
  } else {
    direction = 'decreasing';
  }
  
  return {
    direction,
    changeRate: slope * 100,
    standardDeviation: stdDev
  };
}
```

#### テストケース

##### TC-020-001: 年間集計
- **前提**: 12ヶ月分のデータが存在
- **入力**: 2025年
- **期待結果**:
  - 年間収入・支出が正しく合算される
  - 月平均が正しく計算される
  - トレンドが判定される

##### TC-020-002: ハイライト抽出
- **前提**: 3月が最大収入、8月が最大支出
- **入力**: 2025年
- **期待結果**:
  - maxIncomeMonth: 2025-03
  - maxExpenseMonth: 2025-08

#### UI/UX要件
- 折れ線グラフで収入・支出・収支を同時表示
- イベントマーカーをグラフ上に表示
- グラフのドリルダウン（月をクリック→詳細表示）
- 年比較機能（複数年を重ねて表示）

#### 関連要件
- [FR-016: 月別収支集計](#fr-016-月別収支集計)
- [FR-021: イベントメモ機能](#fr-021-イベントメモ機能)

---

## FR-021: イベントメモ機能

### 基本情報
| 項目 | 内容 |
|------|------|
| 機能ID | FR-021 |
| 機能名 | イベントメモの追加・管理 |
| 優先度 | 中 |
| 対応Phase | Phase 5 |

### 概要
特定の日付やイベント（就学、高額購入、旅行等）にメモを追加し、収支と関連付けて記録する。

### 詳細仕様

#### データ構造
```typescript
interface Event {
  id: string;
  date: Date;
  title: string;
  description: string;
  category: EventCategory;
  tags: string[];
  relatedTransactions: string[];
  attachments: Attachment[];
  createdAt: Date;
  updatedAt: Date;
}

enum EventCategory {
  EDUCATION = 'education',       // 就学関連
  PURCHASE = 'purchase',         // 高額購入
  TRAVEL = 'travel',            // 旅行
  MEDICAL = 'medical',          // 医療
  LIFE_EVENT = 'life_event',    // ライフイベント
  INVESTMENT = 'investment',     // 投資
  OTHER = 'other'               // その他
}

interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}
```

#### CRUD機能

##### 作成（Create）
```
1. ユーザーが「イベント追加」ボタンをクリック
2. イベント入力フォームを表示
3. 必須項目を入力
   - 日付
   - タイトル
4. オプション項目を入力
   - 説明
   - カテゴリ
   - タグ
   - 関連取引
5. [保存] ボタンをクリック
6. バリデーション実施
7. データベースに保存
8. 成功メッセージ表示
```

##### 読取（Read）
```
1. カレンダー上のイベントマーカーをクリック
2. イベント詳細ダイアログを表示
3. 関連取引も合わせて表示
```

##### 更新（Update）
```
1. イベント詳細から「編集」をクリック
2. 編集フォームを表示（現在値が入力済み）
3. 変更を加える
4. [保存] をクリック
5. 更新を保存
```

##### 削除（Delete）
```
1. イベント詳細から「削除」をクリック
2. 確認ダイアログを表示
3. [削除] を確定
4. データベースから削除
5. 関連付けも解除
```

#### バリデーション
- タイトル: 必須、1〜100文字
- 日付: 必須、妥当な日付
- 説明: 任意、最大1000文字
- カテゴリ: 必須、定義済みの値

#### テストケース

##### TC-021-001: イベント作成
- **入力**: 
  - 日付: 2025-04-01
  - タイトル: 入学式
  - カテゴリ: EDUCATION
- **期待結果**: イベントが作成され、カレンダーに表示される

##### TC-021-002: イベント更新
- **前提**: イベントが存在
- **入力**: タイトルを変更
- **期待結果**: 変更が保存され、表示が更新される

#### UI/UX要件
- カレンダー上にイベントマーカー表示
- カテゴリ別の色分け
- ドラッグ&ドロップで日付変更
- タグによるフィルタリング
- 検索機能

#### 関連要件
- [FR-022: イベントと収支の紐付け](#fr-022-イベントと収支の紐付け)
- [FR-020: 年間収支推移表示](#fr-020-年間収支推移表示)

---

## FR-022: イベントと収支の紐付け

### 基本情報
| 項目 | 内容 |
|------|------|
| 機能ID | FR-022 |
| 機能名 | イベントと収支データの関連付け |
| 優先度 | 中 |
| 対応Phase | Phase 5 |

### 概要
イベントと関連する取引を紐付けることで、イベントごとの収支を分析できるようにする。

### 詳細仕様

#### 紐付け方法

##### 1. 手動紐付け
```
1. イベント詳細画面で「取引を追加」をクリック
2. 取引一覧ダイアログを表示
3. チェックボックスで取引を選択
4. [追加] をクリック
5. イベントに取引が関連付けられる
```

##### 2. 自動紐付け（推奨機能）
```typescript
function suggestRelatedTransactions(event: Event): Transaction[] {
  const dateRange = {
    start: addDays(event.date, -7),
    end: addDays(event.date, 7)
  };
  
  // 日付範囲内の取引を取得
  let candidates = getTransactionsByDateRange(dateRange);
  
  // イベントカテゴリに応じたフィルタ
  candidates = filterByEventCategory(candidates, event.category);
  
  // 金額でスコアリング（高額取引を優先）
  const scored = scoreTransactions(candidates);
  
  return scored.slice(0, 10); // 上位10件を推奨
}
```

#### データ構造
```typescript
interface EventTransactionLink {
  id: string;
  eventId: string;
  transactionId: string;
  linkType: 'manual' | 'auto';
  confidence?: number;
  createdAt: Date;
}
```

#### 出力
- イベント別収支サマリー
```typescript
interface EventFinancialSummary {
  event: Event;
  relatedTransactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  transactionCount: number;
}
```

#### 処理フロー
```
1. ユーザーがイベントを選択
2. [関連取引を検索]
   a. 日付範囲で候補を絞り込み
   b. カテゴリで候補を絞り込み
3. [スコアリング]
   a. 日付の近さ
   b. 金額の大きさ
   c. 説明文の類似度
4. [推奨表示]
   a. スコア順に候補を表示
   b. ユーザーが選択
5. [紐付け保存]
   a. 関連付けを保存
   b. イベントサマリーを更新
```

#### テストケース

##### TC-022-001: 手動紐付け
- **前提**: イベントと取引が存在
- **実行**: 取引をイベントに関連付け
- **期待結果**: 紐付けが保存され、サマリーに反映

##### TC-022-002: 自動推奨
- **前提**: 旅行イベント（2025-08-10）
- **実行**: 推奨取引を取得
- **期待結果**: 
  - 前後7日間の取引が候補になる
  - 交通費・宿泊費が上位に表示される

#### UI/UX要件
- イベント詳細画面に関連取引リスト表示
- 推奨取引に「推奨」バッジ表示
- ドラッグ&ドロップで紐付け
- 紐付け解除機能
- イベント別収支グラフ

#### 関連要件
- [FR-021: イベントメモ機能](#fr-021-イベントメモ機能)
- [FR-016: 月別収支集計](#fr-016-月別収支集計)

---

## 付録

### A. 用語集
| 用語 | 説明 |
|------|------|
| 集計 | データを特定の基準でグループ化して合計すること |
| サマリー | 集計結果の要約情報 |
| トレンド | 時系列データの傾向・推移 |
| イベント | 特定の日付に発生した出来事の記録 |
| 紐付け | 異なるデータ同士を関連付けること |

### B. 変更履歴
| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|---------|--------|
| 1.0 | 2025-11-15 | 初版作成 | System |
