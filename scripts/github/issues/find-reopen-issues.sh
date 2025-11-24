#!/bin/bash

# 「未実装」「Reopen」などのキーワードを含むIssueコメントを検索

REPO="kencom2400/account-book"
SEARCH_KEYWORDS=("未実装" "Reopen" "reopenします" "再開" "未完了")

echo "════════════════════════════════════════════════════════════════"
echo "   🔍 未実装・Reopen関連コメントの検索"
echo "════════════════════════════════════════════════════════════════"
echo ""

# 全Issue（Open + Closed）を取得
echo "📊 全Issueを取得中..."
ALL_ISSUES=$(gh issue list --repo "$REPO" --state all --limit 9999 --json number,title,state)
TOTAL_COUNT=$(echo "$ALL_ISSUES" | jq '. | length')

echo "  取得完了: $TOTAL_COUNT 個のIssue"
echo ""

FOUND_ISSUES=()
FOUND_COUNT=0

# 各Issueをチェック
while read -r issue_num; do
    # コメントを取得
    COMMENTS=$(gh issue view "$issue_num" --repo "$REPO" --json comments --jq '.comments[] | "\(.author.login)|\(.body)"' 2>/dev/null)
    
    if [ -z "$COMMENTS" ]; then
        continue
    fi
    
    # キーワード検索
    for keyword in "${SEARCH_KEYWORDS[@]}"; do
        if echo "$COMMENTS" | grep -i "$keyword" > /dev/null; then
            FOUND_ISSUES+=("$issue_num")
            FOUND_COUNT=$((FOUND_COUNT + 1))
            
            issue_info=$(echo "$ALL_ISSUES" | jq -r ".[] | select(.number == $issue_num) | \"\(.number)|\(.title)|\(.state)\"")
            IFS='|' read -r num title state <<< "$issue_info"
            
            echo "────────────────────────────────────────────────────────────────"
            echo "🔍 Issue #$num [$state]"
            echo "   タイトル: $title"
            echo "────────────────────────────────────────────────────────────────"
            
            # キーワードを含むコメントを抽出
            echo "💬 関連コメント:"
            while IFS='|' read -r author body; do
                for kw in "${SEARCH_KEYWORDS[@]}"; do
                    if echo "$body" | grep -i "$kw" > /dev/null; then
                        echo ""
                        echo "  👤 $author:"
                        echo "$body" | grep -i -C 2 "$kw" | sed 's/^/     /'
                        echo ""
                        break
                    fi
                done
            done <<< "$COMMENTS"
            
            break
        fi
    done
    
    # プログレス表示（10個ごと）
    if [ $((issue_num % 10)) -eq 0 ]; then
        echo -n "."
    fi
done < <(echo "$ALL_ISSUES" | jq -r '.[].number')

echo ""
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "   📊 検索結果サマリー"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "検索対象: $TOTAL_COUNT 個のIssue"
echo "見つかった: $FOUND_COUNT 個"
echo ""

if [ ${#FOUND_ISSUES[@]} -gt 0 ]; then
    echo "🔍 該当するIssue一覧:"
    echo ""
    for issue_num in "${FOUND_ISSUES[@]}"; do
        issue_info=$(echo "$ALL_ISSUES" | jq -r ".[] | select(.number == $issue_num) | \"\(.number)|\(.title)|\(.state)\"")
        IFS='|' read -r num title state <<< "$issue_info"
        
        state_icon="📝"
        if [ "$state" = "CLOSED" ]; then
            state_icon="✅"
        fi
        
        echo "  $state_icon #$num [$state] $title"
    done
    echo ""
    echo "────────────────────────────────────────────────────────────────"
    echo "💡 次のアクション:"
    echo "────────────────────────────────────────────────────────────────"
    echo ""
    echo "Closeされている Issue を Reopen する場合:"
    echo ""
    for issue_num in "${FOUND_ISSUES[@]}"; do
        state=$(echo "$ALL_ISSUES" | jq -r ".[] | select(.number == $issue_num) | .state")
        if [ "$state" = "CLOSED" ]; then
            echo "  gh issue reopen $issue_num --repo $REPO"
        fi
    done
else
    echo "✅ 未実装・Reopenのコメントは見つかりませんでした"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"

