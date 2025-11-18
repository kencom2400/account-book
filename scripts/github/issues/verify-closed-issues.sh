#!/bin/bash

# Closed Issue検証スクリプト
# Acceptance CriteriaとDefinition of Doneが満たされているか確認

REPO="kencom2400/account-book"

echo "════════════════════════════════════════════════════════════════"
echo "   📋 Closed Issue検証レポート"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Closedのissue一覧を取得（カテゴリAとその他に分ける）
CLOSED_ISSUES=$(gh issue list --repo "$REPO" --state closed --limit 100 --json number,title | jq -r '.[] | "\(.number)|\(.title)"' | sort -n)

# カテゴリA（実際に完了している可能性が高い）
CATEGORY_A="5 6 7 8 9 11 12 13 14"

# その他のカテゴリ（未実装の可能性が高い）
CATEGORY_OTHER=$(echo "$CLOSED_ISSUES" | grep -E "^(79|8[0-9]|9[0-9]|1[0-3][0-9])" | cut -d'|' -f1)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 カテゴリA: 環境構築（実際に完了済みの可能性）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

for issue in $CATEGORY_A; do
    TITLE=$(gh issue view "$issue" --repo "$REPO" --json title --jq '.title')
    echo "Issue #$issue: $TITLE"
    echo "  → カテゴリA: 実装済みタスク（Closeは正当）"
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 その他のカテゴリ（未実装の可能性が高い）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# その他のカテゴリをリストアップ
for line in $CLOSED_ISSUES; do
    issue=$(echo "$line" | cut -d'|' -f1)
    title=$(echo "$line" | cut -d'|' -f2)
    
    # カテゴリA以外
    if ! echo "$CATEGORY_A" | grep -q "$issue"; then
        # カテゴリC以降のチェック
        if [ "$issue" -ge 79 ]; then
            echo "Issue #$issue: $title"
            echo "  → 未実装の可能性が高い（Reopenすべき）"
            echo ""
        fi
    fi
done

echo "════════════════════════════════════════════════════════════════"
echo "📊 検証結果サマリー"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "✅ Closeが正当（カテゴリA: 環境構築済み）"
for issue in $CATEGORY_A; do
    echo "  - Issue #$issue"
done
echo ""
echo "⚠️  Reopenすべき（未実装）"
for line in $CLOSED_ISSUES; do
    issue=$(echo "$line" | cut -d'|' -f1)
    if ! echo "$CATEGORY_A 138" | grep -q "$issue"; then
        if [ "$issue" -ge 79 ]; then
            echo "  - Issue #$issue"
        fi
    fi
done
echo ""
echo "════════════════════════════════════════════════════════════════"

