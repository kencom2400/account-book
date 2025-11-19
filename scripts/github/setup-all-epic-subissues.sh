#!/bin/bash

# Add sub-issues to ALL Epic issues via GraphQL API
# このスクリプトは、全16個のEpicにsub-issueを追加します

set -e

echo "🔗 Adding sub-issues to ALL Epics via GraphQL API"
echo "=================================================="
echo ""

REPO_OWNER="kencom2400"
REPO_NAME="account-book"

# Function to add sub-issue
add_sub_issue() {
    local parent_issue_num="$1"
    local child_issue_num="$2"
    
    # Get parent Issue ID
    parent_id=$(gh api graphql -f query="
    query {
      repository(owner: \"$REPO_OWNER\", name: \"$REPO_NAME\") {
        issue(number: $parent_issue_num) {
          id
        }
      }
    }" --jq '.data.repository.issue.id' 2>/dev/null)
    
    # Get child Issue ID
    child_id=$(gh api graphql -f query="
    query {
      repository(owner: \"$REPO_OWNER\", name: \"$REPO_NAME\") {
        issue(number: $child_issue_num) {
          id
        }
      }
    }" --jq '.data.repository.issue.id' 2>/dev/null)
    
    if [ -z "$parent_id" ] || [ -z "$child_id" ]; then
        echo "  ⚠️  Failed to get Issue IDs for #$child_issue_num"
        return 1
    fi
    
    # Add sub-issue using mutation
    result=$(gh api graphql -f query="
    mutation {
      addSubIssue(input: {
        issueId: \"$parent_id\"
        subIssueId: \"$child_id\"
        replaceParent: false
      }) {
        issue {
          number
          subIssuesSummary {
            total
            completed
          }
        }
      }
    }" 2>&1)
    
    if echo "$result" | jq -e '.data.addSubIssue.issue' > /dev/null 2>&1; then
        total=$(echo "$result" | jq -r '.data.addSubIssue.issue.subIssuesSummary.total')
        echo "  ✅ #$child_issue_num → #$parent_issue_num (Total: $total)"
    else
        # Check if already added
        if echo "$result" | grep -q "already"; then
            echo "  ⏭️  #$child_issue_num already linked to #$parent_issue_num"
        else
            echo "  ❌ #$child_issue_num failed: $(echo $result | jq -r '.errors[0].message' 2>/dev/null || echo 'Unknown error')"
        fi
    fi
    
    sleep 0.2
}

# EPIC-001: 基盤構築 (#181)
echo "📦 EPIC-001: 基盤構築 (#181)"
for issue in 10 138; do
    add_sub_issue 181 $issue
done
echo ""

# EPIC-002: データ取得機能 (#182) - Already done, skip
echo "📦 EPIC-002: データ取得機能 (#182) - Already completed ✅"
echo ""

# EPIC-003: データ分類機能 (#183)
echo "📦 EPIC-003: データ分類機能 (#183)"
for issue in 55 56 57 58 110 29 30 31 32; do
    add_sub_issue 183 $issue
done
echo ""

# EPIC-004: クレジットカード管理 (#184)
echo "📦 EPIC-004: クレジットカード管理 (#184)"
for issue in 59 60 61 62 113 33 34 35 36 42 43 44; do
    add_sub_issue 184 $issue
done
echo ""

# EPIC-005: 集計・分析機能 (#185)
echo "📦 EPIC-005: 集計・分析機能 (#185)"
for issue in 63 64 65 66 67 68 69 111 112 45 46; do
    add_sub_issue 185 $issue
done
echo ""

# EPIC-006: 可視化機能 (#186)
echo "📦 EPIC-006: 可視化機能 (#186)"
for issue in 54 70 71 72 73 74 116; do
    add_sub_issue 186 $issue
done
echo ""

# EPIC-007: 設定機能 (#187)
echo "📦 EPIC-007: 設定機能 (#187)"
for issue in 75 76 77 78 114 115; do
    add_sub_issue 187 $issue
done
echo ""

# EPIC-008: セキュリティ強化 (#188)
echo "📦 EPIC-008: セキュリティ強化 (#188)"
for issue in 79 80 81 82 83 105; do
    add_sub_issue 188 $issue
done
echo ""

# EPIC-009: パフォーマンス最適化 (#189)
echo "📦 EPIC-009: パフォーマンス最適化 (#189)"
for issue in 84 85 86 104 126 87; do
    add_sub_issue 189 $issue
done
echo ""

# EPIC-010: Frontend実装 (#190)
echo "📦 EPIC-010: Frontend実装 (#190)"
for issue in 107 108 109 110 111 112 113 114 115 116 117 118 119 120 121 92; do
    add_sub_issue 190 $issue
done
echo ""

# EPIC-011: Backend実装 (#191)
echo "📦 EPIC-011: Backend実装 (#191)"
for issue in 37 38 39 40 41 88 89 90 91 127; do
    add_sub_issue 191 $issue
done
echo ""

# EPIC-012: テスト実装 (#192)
echo "📦 EPIC-012: テスト実装 (#192)"
for issue in 93 94 95 96 97 98 99 100 101 102 103 104 105 106 167; do
    add_sub_issue 192 $issue
done
echo ""

# EPIC-013: データ永続化基盤 (#193)
echo "📦 EPIC-013: データ永続化基盤 (#193)"
for issue in 122 123 124 125 126 165 166; do
    add_sub_issue 193 $issue
done
echo ""

# EPIC-014: ドキュメント整備 (#194)
echo "📦 EPIC-014: ドキュメント整備 (#194)"
for issue in 127 128 129 130 133 140; do
    add_sub_issue 194 $issue
done
echo ""

# EPIC-015: インフラ・運用整備 (#195)
echo "📦 EPIC-015: インフラ・運用整備 (#195)"
for issue in 131 132 165 166 176; do
    add_sub_issue 195 $issue
done
echo ""

# EPIC-016: 将来拡張機能 (#196)
echo "📦 EPIC-016: 将来拡張機能 (#196)"
for issue in 134 135 136 137; do
    add_sub_issue 196 $issue
done
echo ""

echo "✨ All Epics sub-issue setup completed!"
echo ""
echo "📊 Verification - Getting summary for all Epics..."
echo ""

# Get summary for all Epics
for epic_num in 181 182 183 184 185 186 187 188 189 190 191 192 193 194 195 196; do
    summary=$(gh api graphql -f query="
    query {
      repository(owner: \"$REPO_OWNER\", name: \"$REPO_NAME\") {
        issue(number: $epic_num) {
          number
          title
          subIssuesSummary {
            total
            completed
            percentCompleted
          }
        }
      }
    }" --jq '.data.repository.issue' 2>/dev/null)
    
    title=$(echo "$summary" | jq -r '.title' | cut -d']' -f2- | cut -c 2-50)
    total=$(echo "$summary" | jq -r '.subIssuesSummary.total')
    completed=$(echo "$summary" | jq -r '.subIssuesSummary.completed')
    percent=$(echo "$summary" | jq -r '.subIssuesSummary.percentCompleted')
    
    printf "EPIC-%02d (#%d): %s sub-issues (%d/%d = %d%%)\n" \
        $((epic_num - 180)) $epic_num "$title" $completed $total $percent
done

echo ""
echo "🎉 Complete! All Epics now have sub-issues linked!"
echo ""
echo "🔗 View in GitHub:"
echo "  https://github.com/$REPO_OWNER/$REPO_NAME/issues?q=label:epic"

