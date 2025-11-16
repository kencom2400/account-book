#!/bin/bash

# 全Issue一括作成マスタースクリプト
# 残りのカテゴリB-2〜Hを作成

set -e

REPO="kencom2400/account-book"

echo "════════════════════════════════════════════════════════════════"
echo "   📋 残りのIssue一括作成"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "作成予定: 約80個のIssue"
echo ""

# カテゴリB-2: データ分類機能 (FR-008〜011)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 カテゴリB-2: データ分類機能 (4個)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

gh issue create --repo "$REPO" \
  --title "[FEATURE] FR-008: 5種類のカテゴリ分類機能" \
  --label "feature,classification,category,backend,priority: high,size: L" \
  --milestone "Phase 2: 分類機能" \
  --body "収入・支出・振替・返済・投資の5種類のカテゴリ自動分類機能の実装"

gh issue create --repo "$REPO" \
  --title "[FEATURE] FR-009: 詳細費目分類機能" \
  --label "feature,classification,category,backend,priority: high,size: XL" \
  --milestone "Phase 2: 分類機能" \
  --body "MoneyTree、MoneyForward等を参考にした詳細費目分類ロジックの実装"

gh issue create --repo "$REPO" \
  --title "[FEATURE] FR-010: 費目の手動修正機能" \
  --label "feature,classification,category,frontend,backend,priority: medium,size: M" \
  --milestone "Phase 2: 分類機能" \
  --body "ユーザーによる費目の手動修正・変更機能の実装"

gh issue create --repo "$REPO" \
  --title "[FEATURE] FR-011: 費目の追加・編集・削除機能" \
  --label "feature,classification,category,frontend,backend,priority: medium,size: M" \
  --milestone "Phase 2: 分類機能" \
  --body "カスタム費目の追加・編集・削除機能の実装"

echo "✅ カテゴリB-2完了 (4個)"
echo ""

# カテゴリB-3: クレジットカード管理 (FR-012〜015)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 カテゴリB-3: クレジットカード管理 (4個)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

gh issue create --repo "$REPO" \
  --title "[FEATURE] FR-012: クレジットカード利用明細の月別集計" \
  --label "feature,credit-card,backend,priority: high,size: M" \
  --milestone "Phase 3: クレジットカード" \
  --body "クレジットカード利用明細を月別に集計する機能の実装"

gh issue create --repo "$REPO" \
  --title "[FEATURE] FR-013: 銀行引落額との自動照合機能" \
  --label "feature,credit-card,backend,priority: high,size: L" \
  --milestone "Phase 3: クレジットカード" \
  --body "クレジットカード請求額と銀行引落額を自動照合する機能の実装"

gh issue create --repo "$REPO" \
  --title "[FEATURE] FR-014: 支払いステータス管理機能" \
  --label "feature,credit-card,backend,priority: medium,size: M" \
  --milestone "Phase 3: クレジットカード" \
  --body "クレジットカードの支払いステータス（未支払い/支払済）を管理する機能"

gh issue create --repo "$REPO" \
  --title "[FEATURE] FR-015: 不一致時のアラート表示" \
  --label "feature,credit-card,frontend,priority: medium,size: S" \
  --milestone "Phase 3: クレジットカード" \
  --body "請求額と引落額の不一致時にアラートを表示する機能"

echo "✅ カテゴリB-3完了 (4個)"
echo ""

# カテゴリB-4: 集計・分析機能 (FR-016〜022)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 カテゴリB-4: 集計・分析機能 (7個)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

gh issue create --repo "$REPO" \
  --title "[FEATURE] FR-016: 月別収支集計機能" \
  --label "feature,aggregation,backend,priority: high,size: M" \
  --milestone "Phase 4: 集計・分析" \
  --body "月別の収支を集計する機能の実装"

gh issue create --repo "$REPO" \
  --title "[FEATURE] FR-017: 金融機関別集計機能" \
  --label "feature,aggregation,backend,priority: medium,size: M" \
  --milestone "Phase 4: 集計・分析" \
  --body "金融機関別に収支を集計する機能の実装"

gh issue create --repo "$REPO" \
  --title "[FEATURE] FR-018: カテゴリ別集計機能" \
  --label "feature,aggregation,backend,priority: high,size: M" \
  --milestone "Phase 4: 集計・分析" \
  --body "カテゴリ別（収入・支出等）に収支を集計する機能の実装"

gh issue create --repo "$REPO" \
  --title "[FEATURE] FR-019: 費目別集計機能" \
  --label "feature,aggregation,backend,priority: high,size: M" \
  --milestone "Phase 4: 集計・分析" \
  --body "費目別（食費・交通費等）に収支を集計する機能の実装"

gh issue create --repo "$REPO" \
  --title "[FEATURE] FR-020: 年間収支推移表示機能" \
  --label "feature,aggregation,backend,priority: medium,size: M" \
  --milestone "Phase 4: 集計・分析" \
  --body "年間の収支推移を集計・表示する機能の実装"

gh issue create --repo "$REPO" \
  --title "[FEATURE] FR-021: イベントメモ機能" \
  --label "feature,event,backend,frontend,priority: low,size: M" \
  --milestone "Phase 4: 集計・分析" \
  --body "就学、高額購入等のライフイベントをメモする機能の実装"

gh issue create --repo "$REPO" \
  --title "[FEATURE] FR-022: イベントと収支の紐付け機能" \
  --label "feature,event,backend,priority: low,size: M" \
  --milestone "Phase 4: 集計・分析" \
  --body "イベントと収支データを紐付けて分析する機能の実装"

echo "✅ カテゴリB-4完了 (7個)"
echo ""

# カテゴリB-5: 可視化機能 (FR-023〜027)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 カテゴリB-5: 可視化機能 (5個)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

gh issue create --repo "$REPO" \
  --title "[FEATURE] FR-023: 月間収支グラフ表示" \
  --label "feature,visualization,chart,frontend,priority: high,size: M" \
  --milestone "Phase 5: 可視化" \
  --body "月間の収支をグラフで表示する機能の実装（棒グラフ・折れ線グラフ）"

gh issue create --repo "$REPO" \
  --title "[FEATURE] FR-024: 年間収支グラフ表示" \
  --label "feature,visualization,chart,frontend,priority: medium,size: M" \
  --milestone "Phase 5: 可視化" \
  --body "年間の収支推移をグラフで表示する機能の実装"

gh issue create --repo "$REPO" \
  --title "[FEATURE] FR-025: カテゴリ別円グラフ表示" \
  --label "feature,visualization,chart,frontend,priority: high,size: M" \
  --milestone "Phase 5: 可視化" \
  --body "カテゴリ別の支出割合を円グラフで表示する機能の実装"

gh issue create --repo "$REPO" \
  --title "[FEATURE] FR-026: 金融機関別資産残高表示" \
  --label "feature,visualization,frontend,priority: medium,size: M" \
  --milestone "Phase 5: 可視化" \
  --body "金融機関別の資産残高を一覧表示する機能の実装"

gh issue create --repo "$REPO" \
  --title "[FEATURE] FR-027: 収支推移のトレンド表示" \
  --label "feature,visualization,chart,frontend,priority: medium,size: M" \
  --milestone "Phase 5: 可視化" \
  --body "収支推移のトレンドを表示する機能の実装（移動平均など）"

echo "✅ カテゴリB-5完了 (5個)"
echo ""

# カテゴリB-6: 設定機能 (FR-028〜031)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 カテゴリB-6: 設定機能 (4個)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

gh issue create --repo "$REPO" \
  --title "[FEATURE] FR-028: 金融機関の登録・編集・削除機能" \
  --label "feature,settings,frontend,backend,priority: high,size: M" \
  --milestone "Phase 6: 設定機能" \
  --body "金融機関の登録・編集・削除を行う設定画面の実装"

gh issue create --repo "$REPO" \
  --title "[FEATURE] FR-029: 同期設定機能" \
  --label "feature,settings,frontend,backend,priority: medium,size: M" \
  --milestone "Phase 6: 設定機能" \
  --body "同期頻度・タイミング等の設定機能の実装"

gh issue create --repo "$REPO" \
  --title "[FEATURE] FR-030: 表示設定機能" \
  --label "feature,settings,frontend,priority: low,size: S" \
  --milestone "Phase 6: 設定機能" \
  --body "UI/グラフの表示設定（ダークモード等）の実装"

gh issue create --repo "$REPO" \
  --title "[FEATURE] FR-031: データエクスポート機能" \
  --label "feature,settings,backend,priority: low,size: M" \
  --milestone "Phase 6: 設定機能" \
  --body "データをCSV/JSON形式でエクスポートする機能の実装"

echo "✅ カテゴリB-6完了 (4個)"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo "✅ 機能要件Issue作成完了！"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "作成されたIssue: 31個（FR-001〜FR-031）"
echo ""
echo "確認: https://github.com/kencom2400/account-book/issues"
echo ""

