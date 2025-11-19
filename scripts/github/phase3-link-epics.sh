#!/bin/bash

# Phase 3: Link Issues to Epics
# このスクリプトは、各IssueのDescriptionに対応するEpic番号を追記します

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🔗 Phase 3: Linking Issues to Epics"
echo "===================================="
echo ""

# Function to prepend Epic reference to issue body
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
    if echo "$current_body" | grep -q "Epic.*#$epic_num"; then
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

echo "Starting Epic-Issue linking..."
echo ""

# EPIC-002: データ取得機能 (#182)
echo "📦 EPIC-002: データ取得機能"
for issue in 47 48 49 50 51 52 53; do
    add_epic_to_issue "$issue" 182 "データ取得機能"
done
echo ""

# EPIC-003: データ分類機能 (#183)
echo "📦 EPIC-003: データ分類機能"
for issue in 55 56 57 58 110; do
    add_epic_to_issue "$issue" 183 "データ分類機能"
done
echo ""

# EPIC-004: クレジットカード管理 (#184)
echo "📦 EPIC-004: クレジットカード管理"
for issue in 59 60 61 62 113; do
    add_epic_to_issue "$issue" 184 "クレジットカード管理"
done
echo ""

# EPIC-005: 集計・分析機能 (#185)
echo "📦 EPIC-005: 集計・分析機能"
for issue in 63 64 65 66 67 68 69 111 112; do
    add_epic_to_issue "$issue" 185 "集計・分析機能"
done
echo ""

# EPIC-006: 可視化機能 (#186)
echo "📦 EPIC-006: 可視化機能"
for issue in 54 70 71 72 73 74 116; do
    add_epic_to_issue "$issue" 186 "可視化機能"
done
echo ""

# EPIC-007: 設定機能 (#187)
echo "📦 EPIC-007: 設定機能"
for issue in 75 76 77 78 114 115; do
    add_epic_to_issue "$issue" 187 "設定機能"
done
echo ""

# EPIC-008: セキュリティ強化 (#188)
echo "📦 EPIC-008: セキュリティ強化"
for issue in 79 80 81 82 83 105; do
    add_epic_to_issue "$issue" 188 "セキュリティ強化"
done
echo ""

# EPIC-009: パフォーマンス最適化 (#189)
echo "📦 EPIC-009: パフォーマンス最適化"
for issue in 84 85 86 104 126; do
    add_epic_to_issue "$issue" 189 "パフォーマンス最適化"
done
echo ""

# EPIC-010: Frontend実装 (#190)
echo "📦 EPIC-010: Frontend実装"
for issue in 107 108 109 110 111 112 113 114 115 116 117 118 119 120 121 92; do
    add_epic_to_issue "$issue" 190 "Frontend実装"
done
echo ""

# EPIC-011: Backend実装 (#191)
echo "📦 EPIC-011: Backend実装"
for issue in 37 38 39 40 41 88 89 90 91 127; do
    add_epic_to_issue "$issue" 191 "Backend実装"
done
echo ""

# EPIC-012: テスト実装 (#192)
echo "📦 EPIC-012: テスト実装"
for issue in 93 94 95 96 97 98 99 100 101 102 103 104 105 106 167; do
    add_epic_to_issue "$issue" 192 "テスト実装"
done
echo ""

# EPIC-013: データ永続化基盤 (#193)
echo "📦 EPIC-013: データ永続化基盤"
for issue in 122 123 124 125 126 165 166; do
    add_epic_to_issue "$issue" 193 "データ永続化基盤"
done
echo ""

# EPIC-014: ドキュメント整備 (#194)
echo "📦 EPIC-014: ドキュメント整備"
for issue in 127 128 129 130 133 140; do
    add_epic_to_issue "$issue" 194 "ドキュメント整備"
done
echo ""

# EPIC-015: インフラ・運用整備 (#195)
echo "📦 EPIC-015: インフラ・運用整備"
for issue in 131 132 165 166 176; do
    add_epic_to_issue "$issue" 195 "インフラ・運用整備"
done
echo ""

# EPIC-016: 将来拡張機能 (#196)
echo "📦 EPIC-016: 将来拡張機能"
for issue in 134 135 136 137; do
    add_epic_to_issue "$issue" 196 "将来拡張機能"
done
echo ""

echo "✨ Phase 3 completed!"
echo ""
echo "📊 Summary:"
echo "  - EPIC-002: 7 issues linked"
echo "  - EPIC-003: 5 issues linked"
echo "  - EPIC-004: 5 issues linked"
echo "  - EPIC-005: 9 issues linked"
echo "  - EPIC-006: 7 issues linked"
echo "  - EPIC-007: 6 issues linked"
echo "  - EPIC-008: 6 issues linked"
echo "  - EPIC-009: 5 issues linked"
echo "  - EPIC-010: 16 issues linked"
echo "  - EPIC-011: 10 issues linked"
echo "  - EPIC-012: 15 issues linked"
echo "  - EPIC-013: 7 issues linked"
echo "  - EPIC-014: 6 issues linked"
echo "  - EPIC-015: 5 issues linked"
echo "  - EPIC-016: 4 issues linked"
echo ""
echo "🎯 Next: Run Phase 4 to identify additional Epics needed"

