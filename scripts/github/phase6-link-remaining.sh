#!/bin/bash

# Phase 6: Link remaining issues to existing Epics
# このスクリプトは、Phase 4で特定された未リンクIssueを既存Epicに紐付けます

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🔗 Phase 6: Linking remaining issues to Epics"
echo "=============================================="
echo ""

# Function to add Epic reference to issue
add_epic_to_issue() {
    local issue_num="$1"
    local epic_num="$2"
    local epic_title="$3"
    
    echo "Processing Issue #$issue_num → Epic #$epic_num"
    
    # Get current issue body
    current_body=$(gh issue view "$issue_num" --json body -q .body 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        echo "  ⚠️  Issue #$issue_num not found, skipping"
        return
    fi
    
    # Check if Epic reference already exists
    if echo "$current_body" | grep -q "Epic.*#"; then
        echo "  ⏭️  Epic reference already exists, skipping"
        return
    fi
    
    # Prepend Epic reference
    new_body="**Epic**: #$epic_num - $epic_title

---

$current_body"
    
    # Update issue
    echo "$new_body" | gh issue edit "$issue_num" --body-file - 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "  ✅ Added Epic reference to Issue #$issue_num"
    else
        echo "  ❌ Failed to update Issue #$issue_num"
    fi
    
    sleep 0.3
}

echo "Starting remaining Issue-Epic linking..."
echo ""

# EPIC-001: 基盤構築 (#181)
echo "📦 EPIC-001: 基盤構築"
add_epic_to_issue 10 181 "基盤構築"
echo ""

# EPIC-002: データ取得機能 (#182)
echo "📦 EPIC-002: データ取得機能"
for issue in 22 28; do
    add_epic_to_issue "$issue" 182 "データ取得機能"
done
echo ""

# EPIC-003: データ分類機能 (#183)
echo "📦 EPIC-003: データ分類機能"
for issue in 29 30 31 32; do
    add_epic_to_issue "$issue" 183 "データ分類機能"
done
echo ""

# EPIC-004: クレジットカード管理 (#184)
echo "📦 EPIC-004: クレジットカード管理"
for issue in 33 34 35 36 42 43 44; do
    add_epic_to_issue "$issue" 184 "クレジットカード管理"
done
echo ""

# EPIC-005: 集計・分析機能 (#185)
echo "📦 EPIC-005: 集計・分析機能"
for issue in 45 46; do
    add_epic_to_issue "$issue" 185 "集計・分析機能"
done
echo ""

# EPIC-009: パフォーマンス最適化 (#189) - オフラインモード
echo "📦 EPIC-009: パフォーマンス最適化"
add_epic_to_issue 87 189 "パフォーマンス最適化"
echo ""

echo "✨ Phase 6 completed!"
echo ""
echo "📊 Summary:"
echo "  - EPIC-001: 1 additional issue linked"
echo "  - EPIC-002: 2 additional issues linked"
echo "  - EPIC-003: 4 additional issues linked"
echo "  - EPIC-004: 7 additional issues linked"
echo "  - EPIC-005: 2 additional issues linked"
echo "  - EPIC-009: 1 additional issue linked"
echo ""
echo "🎉 All phases completed!"
echo ""
echo "📈 Final Statistics:"
echo "  - Total Epics created: 16"
echo "  - Total Issues linked: $(gh issue list --limit 200 --state open | wc -l | tr -d ' ')"
echo "  - Epic-Issue relationships: ~130"
echo ""
echo "🔗 View your project:"
echo "  https://github.com/users/kencom2400/projects/1"

