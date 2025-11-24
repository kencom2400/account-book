#!/bin/bash

# すべてのPRとプロジェクト内のIssueを紐づけるスクリプト
# PR側に関連Issueを追記する

set -e

OWNER="kencom2400"
REPO="account-book"
PROJECT_NUMBER=1

echo "════════════════════════════════════════════════════════════════"
echo "   🔗 すべてのPRとプロジェクトIssueの紐づけ"
echo "════════════════════════════════════════════════════════════════"
echo ""

# 1. プロジェクト内のすべてのIssueを取得
echo "📝 プロジェクト内のすべてのIssueを取得中..."
PROJECT_ISSUES=$(gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --format json --limit 9999 | \
  jq -r '.items[].content.number' | sort -n)

if [ -z "$PROJECT_ISSUES" ]; then
  echo "⚠️  対象となるIssueが見つかりませんでした"
  exit 0
fi

echo "✅ 対象Issue数: $(echo "$PROJECT_ISSUES" | wc -w) 個"
echo ""

# 2. すべてのPRを取得
echo "📋 すべてのPRを取得中..."
ALL_PRS=$(gh pr list --repo "$OWNER/$REPO" --state all --limit 9999 --json number,title,state,headRefName,body)
echo "✅ PR数: $(echo "$ALL_PRS" | jq '. | length') 個"
echo ""

# 3. 各PRについて、マッチするIssueを探す
echo "────────────────────────────────────────────────────────────────"
echo "🔍 PRとIssueのマッチング開始"
echo "────────────────────────────────────────────────────────────────"
echo ""

TOTAL_LINKED=0
TOTAL_SKIPPED=0
TOTAL_NO_MATCH=0
TOTAL_ALREADY_LINKED=0

for pr_num in $(echo "$ALL_PRS" | jq -r '.[].number'); do
  PR_DATA=$(echo "$ALL_PRS" | jq --arg num "$pr_num" '.[] | select(.number == ($num | tonumber))')
  PR_TITLE=$(echo "$PR_DATA" | jq -r '.title')
  PR_BRANCH=$(echo "$PR_DATA" | jq -r '.headRefName')
  PR_BODY=$(echo "$PR_DATA" | jq -r '.body // ""')
  PR_STATE=$(echo "$PR_DATA" | jq -r '.state')
  
  echo "[PR #$pr_num] ($PR_STATE)"
  echo "  タイトル: $PR_TITLE"
  echo "  ブランチ: $PR_BRANCH"
  
  # ブランチ名から issue-{number} を抽出
  ISSUE_FROM_BRANCH=""
  if echo "$PR_BRANCH" | grep -qE 'issue-[0-9]+'; then
    ISSUE_FROM_BRANCH=$(echo "$PR_BRANCH" | grep -oE 'issue-[0-9]+' | head -1 | sed 's/issue-//')
  fi
  
  # PRのタイトルまたは本文から #number を抽出
  ISSUES_FROM_PR=$(echo -e "${PR_TITLE}\n${PR_BODY}" | grep -oE '#[0-9]+' | sed 's/#//' | sort -u)
  
  # すべての候補を結合
  CANDIDATE_ISSUES=$(echo -e "${ISSUE_FROM_BRANCH}\n${ISSUES_FROM_PR}" | grep -E '^[0-9]+$' | sort -u)
  
  if [ -z "$CANDIDATE_ISSUES" ]; then
    echo "  ℹ️  Issue番号が見つかりませんでした（スキップ）"
    echo ""
    TOTAL_NO_MATCH=$((TOTAL_NO_MATCH + 1))
    continue
  fi
  
  # プロジェクトに存在するIssueのみをフィルタリング
  VALID_ISSUES=""
  for candidate in $CANDIDATE_ISSUES; do
    if echo "$PROJECT_ISSUES" | grep -qw "$candidate"; then
      VALID_ISSUES="$VALID_ISSUES $candidate"
    fi
  done
  
  if [ -z "$VALID_ISSUES" ]; then
    echo "  ℹ️  プロジェクト内のIssueが見つかりませんでした"
    echo ""
    TOTAL_NO_MATCH=$((TOTAL_NO_MATCH + 1))
    continue
  fi
  
  echo "  ✅ マッチしたIssue: $VALID_ISSUES"
  
  # PRの本文に適切な参照があるかチェック
  NEEDS_UPDATE=false
  ISSUES_TO_ADD=""
  
  for issue_num in $VALID_ISSUES; do
    # "Closes #X", "Fixes #X", "Resolves #X", "Related to #X" などの形式があるかチェック
    if ! echo "$PR_BODY" | grep -qE "(Closes|Fixes|Resolves|Related to|Ref|Issue)\s*(#)?${issue_num}(\s|,|\.|$)"; then
      NEEDS_UPDATE=true
      ISSUES_TO_ADD="$ISSUES_TO_ADD #$issue_num"
    fi
  done
  
  if [ "$NEEDS_UPDATE" = false ]; then
    echo "  ✓ すでにすべてのIssueが適切に参照されています"
    echo ""
    TOTAL_ALREADY_LINKED=$((TOTAL_ALREADY_LINKED + 1))
    continue
  fi
  
  # PRの本文に関連Issueを追記
  echo "  📝 PR #${pr_num} にIssueを追記中:$ISSUES_TO_ADD"
  
  # 新しい本文を作成
  if [ -z "$PR_BODY" ] || [ "$PR_BODY" = "null" ]; then
    NEW_BODY="Related to$ISSUES_TO_ADD"
  else
    # 既存の本文の末尾に追記
    NEW_BODY="${PR_BODY}

---
Related to$ISSUES_TO_ADD"
  fi
  
  # PRの本文を更新
  UPDATE_RESULT=$(gh pr edit "$pr_num" --repo "$OWNER/$REPO" --body "$NEW_BODY" 2>&1)
  
  if [ $? -eq 0 ]; then
    echo "  ✅ PR #${pr_num} を更新しました"
    TOTAL_LINKED=$((TOTAL_LINKED + 1))
  else
    echo "  ❌ PR #${pr_num} の更新に失敗しました: $UPDATE_RESULT"
  fi
  
  echo ""
  
  # API rate limit対策
  sleep 2
done

# 結果サマリー
echo "════════════════════════════════════════════════════════════════"
echo "   📊 実行結果"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "対象PR数: $(echo "$ALL_PRS" | jq '. | length') 個"
echo "プロジェクトIssue数: $(echo "$PROJECT_ISSUES" | wc -w) 個"
echo ""
echo "✅ PRに追記: $TOTAL_LINKED 個"
echo "✓ 既に適切に参照済み: $TOTAL_ALREADY_LINKED 個"
echo "ℹ️  マッチなし: $TOTAL_NO_MATCH 個"
echo ""
echo "════════════════════════════════════════════════════════════════"

