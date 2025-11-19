#!/bin/bash

# Update Epic Issues with Tasklist for tracked issues
# このスクリプトは、Epic IssueのDescriptionにtasklistを追加して、子Issueを追跡します

set -e

echo "🔗 Setting up Epic tasklists via API"
echo "====================================="
echo ""

# Function to update Epic issue body with tasklist
update_epic_with_tasklist() {
    local epic_num="$1"
    local epic_title="$2"
    shift 2
    local child_issues=("$@")
    
    echo "Updating Epic #$epic_num: $epic_title"
    
    # Get current issue body
    current_body=$(gh issue view "$epic_num" --json body -q .body 2>/dev/null)
    
    # Create tasklist section
    tasklist="## 📊 関連Issue (Tracked Issues)

"
    
    for issue in "${child_issues[@]}"; do
        tasklist+="- [ ] #$issue
"
    done
    
    # Check if tasklist section already exists
    if echo "$current_body" | grep -q "## 📊 関連Issue"; then
        echo "  ⏭️  Tasklist already exists, skipping"
        return
    fi
    
    # Append tasklist to existing body
    new_body="$current_body

---

$tasklist"
    
    # Update issue
    echo "$new_body" | gh issue edit "$epic_num" --body-file - 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "  ✅ Updated Epic #$epic_num with tasklist (${#child_issues[@]} issues)"
    else
        echo "  ❌ Failed to update Epic #$epic_num"
    fi
    
    sleep 0.3
}

echo "Adding tasklists to Epic issues..."
echo ""

# EPIC-002: データ取得機能 (#182)
echo "📦 EPIC-002: データ取得機能"
update_epic_with_tasklist 182 "データ取得機能" 47 48 49 50 51 52 53 22 28
echo ""

# EPIC-003: データ分類機能 (#183)
echo "📦 EPIC-003: データ分類機能"
update_epic_with_tasklist 183 "データ分類機能" 55 56 57 58 110 29 30 31 32
echo ""

# EPIC-004: クレジットカード管理 (#184)
echo "📦 EPIC-004: クレジットカード管理"
update_epic_with_tasklist 184 "クレジットカード管理" 59 60 61 62 113 33 34 35 36 42 43 44
echo ""

# EPIC-005: 集計・分析機能 (#185)
echo "📦 EPIC-005: 集計・分析機能"
update_epic_with_tasklist 185 "集計・分析機能" 63 64 65 66 67 68 69 111 112 45 46
echo ""

# EPIC-006: 可視化機能 (#186)
echo "📦 EPIC-006: 可視化機能"
update_epic_with_tasklist 186 "可視化機能" 54 70 71 72 73 74 116
echo ""

# EPIC-007: 設定機能 (#187)
echo "📦 EPIC-007: 設定機能"
update_epic_with_tasklist 187 "設定機能" 75 76 77 78 114 115
echo ""

# EPIC-008: セキュリティ強化 (#188)
echo "📦 EPIC-008: セキュリティ強化"
update_epic_with_tasklist 188 "セキュリティ強化" 79 80 81 82 83 105
echo ""

# EPIC-009: パフォーマンス最適化 (#189)
echo "📦 EPIC-009: パフォーマンス最適化"
update_epic_with_tasklist 189 "パフォーマンス最適化" 84 85 86 104 126 87
echo ""

# EPIC-010: Frontend実装 (#190)
echo "📦 EPIC-010: Frontend実装"
update_epic_with_tasklist 190 "Frontend実装" 107 108 109 110 111 112 113 114 115 116 117 118 119 120 121 92
echo ""

# EPIC-011: Backend実装 (#191)
echo "📦 EPIC-011: Backend実装"
update_epic_with_tasklist 191 "Backend実装" 37 38 39 40 41 88 89 90 91 127
echo ""

# EPIC-012: テスト実装 (#192)
echo "📦 EPIC-012: テスト実装"
update_epic_with_tasklist 192 "テスト実装" 93 94 95 96 97 98 99 100 101 102 103 104 105 106 167
echo ""

# EPIC-013: データ永続化基盤 (#193)
echo "📦 EPIC-013: データ永続化基盤"
update_epic_with_tasklist 193 "データ永続化基盤" 122 123 124 125 126 165 166
echo ""

# EPIC-014: ドキュメント整備 (#194)
echo "📦 EPIC-014: ドキュメント整備"
update_epic_with_tasklist 194 "ドキュメント整備" 127 128 129 130 133 140
echo ""

# EPIC-015: インフラ・運用整備 (#195)
echo "📦 EPIC-015: インフラ・運用整備"
update_epic_with_tasklist 195 "インフラ・運用整備" 131 132 165 166 176
echo ""

# EPIC-016: 将来拡張機能 (#196)
echo "📦 EPIC-016: 将来拡張機能"
update_epic_with_tasklist 196 "将来拡張機能" 134 135 136 137
echo ""

echo "✨ Tasklist setup completed!"
echo ""
echo "ℹ️  Note: GitHub may automatically convert these tasklists to tracked issues."
echo "   Check the Epic issues in a few moments to see if they appear as sub-issues."
echo ""
echo "⚠️  If automatic conversion doesn't work, manual UI setup is still required."
echo "   See: docs/epic-hierarchy-setup-guide.md"

