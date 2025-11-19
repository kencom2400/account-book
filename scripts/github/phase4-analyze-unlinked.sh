#!/bin/bash

# Phase 4: Identify Issues without Epic assignment
# このスクリプトは、どのEpicにも紐付いていないIssueを特定します

set -e

echo "🔍 Phase 4: Identifying additional Epics needed"
echo "================================================"
echo ""

# すでにEpicに紐付けられているIssue
LINKED_ISSUES=(
  # EPIC-002
  47 48 49 50 51 52 53
  # EPIC-003
  55 56 57 58 110
  # EPIC-004
  59 60 61 62 113
  # EPIC-005
  63 64 65 66 67 68 69 111 112
  # EPIC-006
  54 70 71 72 73 74 116
  # EPIC-007
  75 76 77 78 114 115
  # EPIC-008
  79 80 81 82 83 105
  # EPIC-009
  84 85 86 104 126
  # EPIC-010
  107 108 109 110 111 112 113 114 115 116 117 118 119 120 121 92
  # EPIC-011
  37 38 39 40 41 88 89 90 91 127
  # EPIC-012
  93 94 95 96 97 98 99 100 101 102 103 104 105 106 167
  # EPIC-013
  122 123 124 125 126 165 166
  # EPIC-014
  127 128 129 130 133 140
  # EPIC-015
  131 132 165 166 176
  # EPIC-016
  134 135 136 137
  # EPIC Issues themselves
  181 182 183 184 185 186 187 188 189 190 191 192 193 194 195 196
)

# Get all open issues
ALL_ISSUES=$(gh issue list --limit 200 --state open --json number --jq '.[].number' | sort -n)

echo "📋 Analyzing all open issues..."
echo ""

UNLINKED_ISSUES=()

for issue in $ALL_ISSUES; do
  # Check if issue is in LINKED_ISSUES
  if [[ ! " ${LINKED_ISSUES[@]} " =~ " ${issue} " ]]; then
    UNLINKED_ISSUES+=($issue)
  fi
done

if [ ${#UNLINKED_ISSUES[@]} -eq 0 ]; then
  echo "✅ All open issues are linked to Epics!"
  echo ""
else
  echo "⚠️  Found ${#UNLINKED_ISSUES[@]} issues not linked to any Epic:"
  echo ""
  
  for issue in "${UNLINKED_ISSUES[@]}"; do
    issue_data=$(gh issue view "$issue" --json number,title,labels,state 2>/dev/null)
    if [ $? -eq 0 ]; then
      title=$(echo "$issue_data" | jq -r '.title')
      labels=$(echo "$issue_data" | jq -r '.labels[].name' | tr '\n' ', ' | sed 's/,$//')
      echo "  #$issue: $title"
      echo "    Labels: $labels"
      echo ""
    fi
  done
  
  echo "📊 Analysis Summary:"
  echo "  - Total open issues: $(echo "$ALL_ISSUES" | wc -l | tr -d ' ')"
  echo "  - Linked to Epics: ${#LINKED_ISSUES[@]}"
  echo "  - Not linked: ${#UNLINKED_ISSUES[@]}"
  echo ""
  
  # Categorize unlinked issues
  echo "🏷️  Suggested Epic categories for unlinked issues:"
  echo ""
  
  for issue in "${UNLINKED_ISSUES[@]}"; do
    issue_data=$(gh issue view "$issue" --json number,title,labels 2>/dev/null)
    if [ $? -eq 0 ]; then
      title=$(echo "$issue_data" | jq -r '.title')
      labels=$(echo "$issue_data" | jq -r '.labels[].name' | tr '\n' ',' | sed 's/,$//')
      
      # Analyze labels and title to suggest Epic
      suggested_epic=""
      
      if [[ "$title" =~ (A-|B-) ]] && [[ "$labels" =~ (infrastructure|task) ]]; then
        suggested_epic="EPIC-001 (基盤構築) or create new Epic for initial setup tasks"
      elif [[ "$labels" =~ (infrastructure) ]]; then
        suggested_epic="EPIC-015 (インフラ・運用整備)"
      elif [[ "$labels" =~ (testing) ]]; then
        suggested_epic="EPIC-012 (テスト実装)"
      elif [[ "$labels" =~ (documentation) ]]; then
        suggested_epic="EPIC-014 (ドキュメント整備)"
      elif [[ "$labels" =~ (backend) ]] && [[ "$title" =~ (B-) ]]; then
        suggested_epic="EPIC-011 (Backend実装)"
      elif [[ "$labels" =~ (frontend) ]] && [[ "$title" =~ (E-) ]]; then
        suggested_epic="EPIC-010 (Frontend実装)"
      elif [[ "$labels" =~ (refactor|enhancement) ]]; then
        suggested_epic="Create new Epic for refactoring/improvements"
      else
        suggested_epic="Review manually"
      fi
      
      echo "  #$issue → $suggested_epic"
    fi
  done
fi

echo ""
echo "✨ Phase 4 completed!"
echo ""
echo "🎯 Next steps:"
echo "  1. Review unlinked issues"
echo "  2. Determine if new Epics are needed"
echo "  3. Create new Epics (Phase 5)"
echo "  4. Link remaining issues (Phase 6)"

